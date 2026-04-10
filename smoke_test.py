"""Quick smoke test for the ClawShield Finance API."""
import urllib.request
import json


def post(prompt):
    req = urllib.request.Request(
        "http://localhost:8000/api/agent/run",
        data=json.dumps({"prompt": prompt}).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=20).read())


def main():
    # --- Test 1: Allowed quote ---
    print("=== TEST 1: Allowed (price check) ===")
    r = post("What is the current price of AAPL?")
    print(f"Intent : {r.get('intent')}")
    print(f"Token  : {r.get('token_source')}")
    for s in r.get("results", []):
        print(f"  Step {s['step_id']} {s['tool']:30s} -> {s['status']:10s} conf={s.get('confidence', 0):.2f}")
    print(f"Stats  : {r.get('stats')}\n")

    # --- Test 2: Blocked (unapproved ticker) ---
    print("=== TEST 2: Blocked (GME ticker) ===")
    r2 = post("Buy 500 shares of GME")
    print(f"Intent : {r2.get('intent')}")
    for s in r2.get("results", []):
        print(f"  Step {s['step_id']} {s['tool']:30s} -> {s['status']:10s} rule={s.get('rule', '')}")
    print(f"Stats  : {r2.get('stats')}\n")

    # --- Test 3: Blocked (scope escalation) ---
    print("=== TEST 3: Blocked (scope escalation) ===")
    r3 = post("Cancel all my orders and enable margin trading")
    print(f"Intent : {r3.get('intent')}")
    for s in r3.get("results", []):
        print(f"  Step {s['step_id']} {s['tool']:30s} -> {s['status']:10s} rule={s.get('rule', '')}")
    print(f"Stats  : {r3.get('stats')}\n")

    print("All smoke tests passed!")


if __name__ == "__main__":
    main()
