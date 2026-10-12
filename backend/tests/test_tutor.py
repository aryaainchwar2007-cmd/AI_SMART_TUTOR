

def test_tutor_conversation_and_message_flow(user_a_client):
    client, _ = user_a_client

    # 1. Create conversation
    conv_resp = client.post("/api/v1/conversations", json={"title": "EDA & Viva Prep"})
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # 2. Send message in quiz mode
    msg_req = {
        "content": "Can you give me viva practice questions on data leakage?",
        "mode": "quiz",
    }
    msg_resp = client.post(f"/api/v1/conversations/{conv_id}/messages", json=msg_req)
    assert msg_resp.status_code == 200
    msg_data = msg_resp.json()
    assert msg_data["role"] == "assistant"
    assert "leakage" in msg_data["content"].lower() or "question" in msg_data["content"].lower()

    # 3. Retrieve messages
    list_resp = client.get(f"/api/v1/conversations/{conv_id}/messages")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 2  # user + assistant

    # 4. Delete conversation
    del_resp = client.delete(f"/api/v1/conversations/{conv_id}")
    assert del_resp.status_code == 200


def test_cross_user_conversation_isolation(user_a_client, user_b_client):
    client_a, _ = user_a_client
    client_b, _ = user_b_client

    conv_a = client_a.post("/api/v1/conversations", json={"title": "Private Notes"}).json()
    conv_a_id = conv_a["id"]

    # User B cannot access User A's conversation
    assert client_b.get(f"/api/v1/conversations/{conv_a_id}/messages").status_code == 404
    assert client_b.delete(f"/api/v1/conversations/{conv_a_id}").status_code == 404
