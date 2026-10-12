import io

REPORT_CSV = b"""val1,val2,target
1.0,10.0,0
2.0,20.0,0
3.0,30.0,1
4.0,40.0,1
5.0,50.0,1
"""


def test_report_generation_and_download(user_a_client):
    client, _ = user_a_client

    files = {"file": ("report_dataset.csv", io.BytesIO(REPORT_CSV), "text/csv")}
    up = client.post("/api/v1/datasets", files=files)
    dataset_id = up.json()["id"]

    # Generate Report
    rep_req = {
        "include_cleaning": True,
        "include_eda": True,
        "include_visualizations": True,
        "include_statistics": True,
        "include_models": True,
        "notes": "Testing report generation for university lab.",
    }
    rep_resp = client.post(f"/api/v1/datasets/{dataset_id}/reports", json=rep_req)
    assert rep_resp.status_code == 201
    rep_data = rep_resp.json()
    assert "sections" in rep_data
    report_id = rep_data["report_id"]

    # Retrieve Report JSON
    get_resp = client.get(f"/api/v1/reports/{report_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["dataset_name"] == "report_dataset.csv"

    # Download Report
    down_resp = client.get(f"/api/v1/reports/{report_id}/download")
    assert down_resp.status_code == 200
    assert "application/json" in down_resp.headers["content-type"]
