import json
from datetime import UTC, datetime
from uuid import UUID

from app.db.models.entities import Conversation, Message, MLModel, User
from app.integrations.llm.providers import OfflineEducatorProvider, get_llm_provider
from app.schemas.tutor import MessageCreate
from app.services.dataset_service import DatasetService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class TutorService:
    @staticmethod
    def create_conversation(db: Session, user: User, title: str | None = "New Study Session") -> Conversation:
        conv = Conversation(
            owner_id=user.id,
            title=title or "New Study Session"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_conversations(db: Session, user: User) -> list[Conversation]:
        return db.query(Conversation).filter(
            Conversation.owner_id == user.id
        ).order_by(Conversation.updated_at.desc()).all()

    @staticmethod
    def get_conversation(db: Session, conversation_id: UUID, user: User) -> Conversation:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv or conv.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found."
            )
        return conv

    @staticmethod
    def delete_conversation(db: Session, conversation_id: UUID, user: User) -> None:
        conv = TutorService.get_conversation(db, conversation_id, user)
        db.delete(conv)
        db.commit()

    @staticmethod
    def get_messages(db: Session, conversation_id: UUID, user: User) -> list[Message]:
        TutorService.get_conversation(db, conversation_id, user)
        return db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()

    @staticmethod
    async def send_message(
        db: Session, conversation_id: UUID, user: User, req: MessageCreate
    ) -> Message:
        conv = TutorService.get_conversation(db, conversation_id, user)

        # Build grounded context if dataset_id is present
        dataset_context = ""
        if req.dataset_id:
            try:
                ds = DatasetService.get_dataset(db, req.dataset_id, user)
                models = db.query(MLModel).filter(MLModel.dataset_id == ds.id).all()
                model_summary = [
                    f"- {m.algorithm} ({m.task_type}) on target '{m.target_column}': metrics={m.metrics}"
                    for m in models
                ]
                dataset_context = (
                    f"\n[GROUND TRUTH DATASET CONTEXT]\n"
                    f"Dataset Name: {ds.name}\n"
                    f"Dimensions: {ds.row_count} rows, {ds.column_count} columns\n"
                    f"Column Metadata: {json.dumps(ds.column_metadata)[:1500]}\n"
                    f"Trained Models:\n" + ("\n".join(model_summary) if model_summary else "None trained yet.") + "\n"
                    "IMPORTANT: The above context is computed by the backend. Do not hallucinate or contradict it."
                )
            except Exception:
                pass

        mode_instruction = {
            "guided": "Adopt a Socratic, guided teaching style. Give hints, ask leading questions, and prompt the student to think deeply about data concepts.",
            "direct": "Provide direct, rigorous explanations with accurate Python code examples using Pandas, NumPy, Matplotlib, or scikit-learn.",
            "quiz": "Test the student with relevant multiple-choice questions, code output puzzles, or engineering viva questions. Explain the correct answers thoroughly.",
        }.get(req.mode, "Provide clear educational assistance.")

        system_instruction = (
            f"You are the AI Smart Tutor for a university Data Science and Engineering Laboratory course.\n"
            f"Teaching Mode: {req.mode.upper()}.\n"
            f"{mode_instruction}\n"
            f"Always prioritize conceptual clarity, mathematical rigor, and reproducible Python code.\n"
            f"{dataset_context}"
        )

        # Save user message
        user_msg = Message(
            conversation_id=conv.id,
            role="user",
            content=req.content,
        )
        db.add(user_msg)
        db.commit()

        # Load recent conversation history (last 10 messages)
        past_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .all()[-10:]
        )
        history = [{"role": m.role, "content": m.content} for m in past_msgs]

        # Call provider with safe fallback
        provider = get_llm_provider()
        try:
            reply_text = await provider.generate_response(
                system_instruction=system_instruction,
                messages=history,
            )
        except Exception as e:
            # Fall back safely to offline tutor
            fallback = OfflineEducatorProvider()
            reply_text = await fallback.generate_response(
                system_instruction=system_instruction,
                messages=history,
            )
            if settings.effective_api_key:
                reply_text += f"\n\n*(Note: Live AI provider encountered an issue [{str(e)[:140]}]; served via offline educational tutor. Check your Gemini API key.)*"
            else:
                reply_text += "\n\n*(Note: Running in offline educational mode with static templates. Connect a free Google Gemini API key to unlock fully dynamic, generative AI tutoring!)*"

        # Save assistant message
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
        )
        db.add(assistant_msg)
        conv.updated_at = datetime.now(UTC)
        db.commit()
        db.refresh(assistant_msg)

        return assistant_msg
