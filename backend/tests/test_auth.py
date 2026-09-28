SIGNUP = {"email": "user@example.com", "password": "testpass123", "role": "general"}


def test_signup_returns_token_and_role(client):
    response = client.post("/auth/signup", json=SIGNUP)
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["role"] == "general"
    assert body["email"] == "user@example.com"


def test_signup_duplicate_email_rejected(client):
    client.post("/auth/signup", json=SIGNUP)
    response = client.post("/auth/signup", json=SIGNUP)
    assert response.status_code == 400


def test_signup_short_password_rejected(client):
    response = client.post("/auth/signup", json={**SIGNUP, "password": "short"})
    assert response.status_code == 422


def test_signup_invalid_role_rejected(client):
    response = client.post("/auth/signup", json={**SIGNUP, "role": "admin"})
    assert response.status_code == 422


def test_login_success(client):
    client.post("/auth/signup", json=SIGNUP)
    response = client.post(
        "/auth/login", json={"email": SIGNUP["email"], "password": SIGNUP["password"]}
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_wrong_password(client):
    client.post("/auth/signup", json=SIGNUP)
    response = client.post(
        "/auth/login", json={"email": SIGNUP["email"], "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "testpass123"}
    )
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "tech@example.com"
    assert body["role"] == "technician"


def test_me_requires_auth(client):
    assert client.get("/auth/me").status_code == 401