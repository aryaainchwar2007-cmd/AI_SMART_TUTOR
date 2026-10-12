import io

SAMPLE_CSV = b"""sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
"""

SAMPLE_CSV_WITH_NULLS = b"""feature_a,feature_b,category
10.5,20.0,A
12.0,,B
,25.0,A
14.0,30.0,B
10.5,20.0,A
"""


def test_dataset_upload_and_preview(user_a_client):
    client, _ = user_a_client

    # 1. Upload CSV
    files = {"file": ("iris.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    upload_resp = client.post("/api/v1/datasets", files=files)
    assert upload_resp.status_code == 201
    dataset = upload_resp.json()
    dataset_id = dataset["id"]
    assert dataset["row_count"] == 10
    assert dataset["column_count"] == 5
    assert "sepal_length" in dataset["column_metadata"]

    # 2. Preview pagination
    prev_resp = client.get(f"/api/v1/datasets/{dataset_id}/preview?page=1&page_size=5")
    assert prev_resp.status_code == 200
    prev_data = prev_resp.json()
    assert len(prev_data["rows"]) == 5
    assert prev_data["total_rows"] == 10

    # 3. Summary
    summary_resp = client.get(f"/api/v1/datasets/{dataset_id}/summary")
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    assert "sepal_length" in summary_data["numeric_summary"]
    assert summary_data["numeric_summary"]["sepal_length"]["mean"] > 0


def test_dataset_upload_invalid_file(user_a_client):
    client, _ = user_a_client

    # Reject .txt file
    files = {"file": ("data.txt", io.BytesIO(b"random text"), "text/plain")}
    resp = client.post("/api/v1/datasets", files=files)
    assert resp.status_code == 400
    assert "Only CSV and JSON" in resp.json()["detail"]


def test_cross_user_dataset_isolation(user_a_client, user_b_client):
    client_a, _ = user_a_client
    client_b, _ = user_b_client

    # User A uploads a dataset
    files = {"file": ("user_a_data.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    upload_resp = client_a.post("/api/v1/datasets", files=files)
    assert upload_resp.status_code == 201
    dataset_a_id = upload_resp.json()["id"]

    # User B attempts to read User A's dataset -> Must return 404 (do not leak existence)
    unauthorized_get = client_b.get(f"/api/v1/datasets/{dataset_a_id}")
    assert unauthorized_get.status_code == 404

    # User B attempts to preview User A's dataset -> Must return 404
    unauthorized_preview = client_b.get(f"/api/v1/datasets/{dataset_a_id}/preview")
    assert unauthorized_preview.status_code == 404

    # User B attempts to delete User A's dataset -> Must return 404
    unauthorized_delete = client_b.delete(f"/api/v1/datasets/{dataset_a_id}")
    assert unauthorized_delete.status_code == 404

    # User A can still access and delete their own dataset
    auth_get = client_a.get(f"/api/v1/datasets/{dataset_a_id}")
    assert auth_get.status_code == 200

    auth_delete = client_a.delete(f"/api/v1/datasets/{dataset_a_id}")
    assert auth_delete.status_code == 200
