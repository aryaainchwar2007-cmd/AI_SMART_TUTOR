import io

SAMPLE_CSV_FOR_CLEANING = b"""x1,x2,cat
1.0,10.0,A
2.0,,B
,30.0,A
4.0,40.0,A
1.0,10.0,A
100.0,50.0,B
"""


def test_data_cleaning_operations(user_a_client):
    client, _ = user_a_client

    # Upload test dataset
    files = {"file": ("dirty.csv", io.BytesIO(SAMPLE_CSV_FOR_CLEANING), "text/csv")}
    up = client.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    # Perform cleaning: drop duplicates, impute median/mode, remove outlier via IQR
    clean_req = {
        "drop_duplicates": True,
        "missing_numeric_strategy": "median",
        "missing_categorical_strategy": "mode",
        "remove_outliers": True,
        "outlier_method": "iqr",
        "save_as_new": False,
    }
    clean_resp = client.post(f"/api/v1/datasets/{dataset_id}/clean", json=clean_req)
    assert clean_resp.status_code == 200
    clean_data = clean_resp.json()
    assert clean_data["duplicates_removed"] == 1
    assert "x1" in clean_data["missing_imputed"]
    assert clean_data["outliers_removed"] >= 1


def test_visualization_generation(user_a_client):
    client, _ = user_a_client

    files = {"file": ("viz_data.csv", io.BytesIO(SAMPLE_CSV_FOR_CLEANING), "text/csv")}
    up = client.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    # 1. Histogram
    hist_resp = client.post(
        f"/api/v1/datasets/{dataset_id}/visualizations",
        json={"chart_type": "histogram", "x_column": "x1", "bins": 10}
    )
    assert hist_resp.status_code == 200
    assert hist_resp.json()["image_base64"].startswith("data:image/png;base64,")

    # 2. Correlation Heatmap
    heat_resp = client.post(
        f"/api/v1/datasets/{dataset_id}/visualizations",
        json={"chart_type": "heatmap"}
    )
    assert heat_resp.status_code == 200
    assert heat_resp.json()["image_base64"].startswith("data:image/png;base64,")


def test_statistics_and_hypothesis_testing(user_a_client):
    client, _ = user_a_client

    files = {"file": ("stat_data.csv", io.BytesIO(SAMPLE_CSV_FOR_CLEANING), "text/csv")}
    up = client.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    # Descriptive stats + Welch's t-test
    stat_req = {
        "hypothesis_test": "two_sample_ttest",
        "col1": "x1",
        "col2": "x2"
    }
    resp = client.post(f"/api/v1/datasets/{dataset_id}/statistics", json=stat_req)
    assert resp.status_code == 200
    data = resp.json()
    assert "descriptive_statistics" in data
    assert "skewness_kurtosis" in data
    assert data["hypothesis_test_result"] is not None
    assert "p_value" in data["hypothesis_test_result"]
