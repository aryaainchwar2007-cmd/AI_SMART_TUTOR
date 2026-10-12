import io

ML_DATASET_CSV = b"""age,income,education,bought
25,30000,Bachelors,0
30,55000,Masters,1
45,80000,Doctorate,1
22,25000,Bachelors,0
35,60000,Bachelors,1
50,95000,Masters,1
28,40000,Bachelors,0
42,75000,Masters,1
38,62000,Bachelors,1
24,28000,Bachelors,0
55,110000,Doctorate,1
29,48000,Masters,0
"""


def test_model_training_and_inference(user_a_client):
    client, _ = user_a_client

    # 1. Upload dataset
    files = {"file": ("customers.csv", io.BytesIO(ML_DATASET_CSV), "text/csv")}
    up = client.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    # 2. Train Random Forest Classifier
    train_req = {
        "target_column": "bought",
        "feature_columns": ["age", "income", "education"],
        "task_type": "classification",
        "algorithm": "random_forest",
        "test_size": 0.25,
        "random_state": 42,
    }
    train_resp = client.post(f"/api/v1/datasets/{dataset_id}/models/train", json=train_req)
    assert train_resp.status_code == 201
    model_data = train_resp.json()
    model_id = model_data["id"]
    assert "accuracy" in model_data["metrics"]
    assert "f1_score" in model_data["metrics"]

    # 3. Model Inference / Prediction
    predict_req = {
        "inputs": [
            {"age": 26, "income": 32000, "education": "Bachelors"},
            {"age": 48, "income": 88000, "education": "Masters"},
        ]
    }
    pred_resp = client.post(f"/api/v1/models/{model_id}/predict", json=predict_req)
    assert pred_resp.status_code == 200
    preds = pred_resp.json()["predictions"]
    assert len(preds) == 2


def test_cross_user_model_isolation(user_a_client, user_b_client):
    client_a, _ = user_a_client
    client_b, _ = user_b_client

    # User A trains a model
    files = {"file": ("data_a.csv", io.BytesIO(ML_DATASET_CSV), "text/csv")}
    up = client_a.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    train_req = {
        "target_column": "bought",
        "feature_columns": ["age", "income"],
        "task_type": "classification",
        "algorithm": "linear_baseline",
    }
    model_a = client_a.post(f"/api/v1/datasets/{dataset_id}/models/train", json=train_req).json()
    model_a_id = model_a["id"]

    # User B attempts to access model -> 404
    resp_get = client_b.get(f"/api/v1/models/{model_a_id}")
    assert resp_get.status_code == 404

    # User B attempts to run inference on User A's model -> 404
    resp_pred = client_b.post(
        f"/api/v1/models/{model_a_id}/predict",
        json={"inputs": [{"age": 30, "income": 50000}]}
    )
    assert resp_pred.status_code == 404
