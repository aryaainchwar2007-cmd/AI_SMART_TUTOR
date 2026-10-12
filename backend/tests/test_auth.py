

def test_user_registration_and_login(client):
    # 1. Register new student
    email = "new_student@university.edu"
    pwd = "StrongSecurePassword123!"
    reg_resp = client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == email

    # 2. Login
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_resp.status_code == 200
    assert login_resp.json()["authenticated"] is True
    token = login_resp.headers.get("X-Session-Token")
    assert token is not None

    # 3. Access /auth/me with bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # 4. Logout
    logout_resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # 5. Subsequent request with revoked token fails
    me_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_after.status_code == 401


def test_login_invalid_credentials(client):
    resp = client.post("/api/v1/auth/login", json={"email": "nonexistent@university.edu", "password": "WrongPassword"})
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]


def test_password_change_flow(client, db_session):
    email = "pass_student@university.edu"
    old_pwd = "OldPassword123!"
    new_pwd = "BrandNewPassword456!"

    client.post("/api/v1/auth/register", json={"email": email, "password": old_pwd})
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    token = login_resp.headers.get("X-Session-Token")

    # Change password
    change_resp = client.post(
        "/api/v1/auth/change-password",
        json={"old_password": old_pwd, "new_password": new_pwd},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert change_resp.status_code == 200

    # Old password no longer works
    fail_login = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    assert fail_login.status_code == 401

    # New password succeeds
    success_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_pwd})
    assert success_login.status_code == 200
