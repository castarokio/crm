import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def api_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"Error connecting to {url}: {e}")
        sys.exit(1)

def run_tests():
    print("=== STARTING BACKEND REST API TESTS ===")
    
    # 1. Health check
    health = api_request("/health")
    print(f"Health check status: {health['status']}")
    assert health["status"] == "ok"

    # 2. Get initial counts
    initial_leads = api_request("/leads/count")
    initial_processed = api_request("/processed/count")
    print(f"Initial leads count: {initial_leads['count']}")
    print(f"Initial processed count: {initial_processed['count']}")
    
    assert initial_leads["count"] == 980
    assert initial_processed["count"] == 0

    # 3. Get lead IDs
    lead_ids = api_request("/leads/ids")
    print(f"Fetched {lead_ids['total']} lead IDs.")
    assert len(lead_ids["ids"]) == 980
    first_lead_id = lead_ids["ids"][0]
    second_lead_id = lead_ids["ids"][1]

    # 4. Get first lead details
    first_lead = api_request(f"/leads/{first_lead_id}")
    print(f"First Lead: ID={first_lead['id']}, Name='{first_lead['business_name']}'")
    assert first_lead["id"] == first_lead_id

    # 5. Process first lead (Save & Process)
    payload = {
        "call_status": "Interested",
        "note": "Wants a callback on Monday to discuss visa service pricing."
    }
    print(f"Processing lead {first_lead_id} with status '{payload['call_status']}'...")
    res = api_request(f"/leads/{first_lead_id}/process", method="POST", data=payload)
    print(f"Process Response: {res}")
    assert res["lead_id"] == first_lead_id
    assert res["next_lead_id"] == second_lead_id

    # 6. Verify counts updated
    post_process_leads = api_request("/leads/count")
    post_process_processed = api_request("/processed/count")
    print(f"New leads count: {post_process_leads['count']}")
    print(f"New processed count: {post_process_processed['count']}")
    assert post_process_leads["count"] == 979
    assert post_process_processed["count"] == 1

    # 7. Check that processed lead exists in Tab 2
    processed_list = api_request("/processed?skip=0&limit=10")
    print(f"Processed leads in list: {processed_list['total']}")
    assert processed_list["total"] == 1
    p_lead = processed_list["leads"][0]
    print(f"Processed Lead: ID={p_lead['id']}, Original ID={p_lead['original_lead_id']}, Status='{p_lead['call_status']}', Note='{p_lead['note']}'")
    assert p_lead["original_lead_id"] == first_lead_id
    assert p_lead["call_status"] == "Interested"
    assert p_lead["note"] == payload["note"]

    # 8. Test search on processed
    search_processed = api_request(f"/processed/search?q={urllib.parse.quote('visa')}")
    print(f"Search processed for 'visa': found {search_processed['total']}")
    assert search_processed["total"] == 1

    # 9. Test search on leads
    search_leads = api_request(f"/leads/search?q={urllib.parse.quote('Algeria')}")
    print(f"Search leads for 'Algeria': found {search_leads['total']}")

    # 10. Delete lead
    print(f"Deleting lead {second_lead_id}...")
    del_res = api_request(f"/leads/{second_lead_id}", method="DELETE")
    print(f"Delete Response: {del_res}")
    assert del_res["lead_id"] == second_lead_id

    # 11. Verify count decreased again
    final_leads = api_request("/leads/count")
    print(f"Final leads count: {final_leads['count']}")
    assert final_leads["count"] == 978

    print("\n=== ALL REST API INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
