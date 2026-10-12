from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        system_instruction: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        """Generates an assistant response from the LLM."""
