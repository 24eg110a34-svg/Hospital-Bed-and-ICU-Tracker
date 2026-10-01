import json
import os
import urllib.request

API = os.environ.get("HOSPITAL_API", "http://localhost:8081/api")
USER = os.environ.get("HOSPITAL_USER", "admin")
PASSWORD = os.environ.get("HOSPITAL_PASSWORD", "admin123")


def login():
    req = urllib.request.Request(
        API + "/auth/login",
        data=json.dumps({"username": USER, "password": PASSWORD}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req).read())["token"]


TOKEN = os.environ.get("HOSPITAL_TOKEN") or login()
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# Check triage queue
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/triage-queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"Triage queue: {len(data)} patients")
    for p in data[:10]:
        print(f"  {p.get('fullName')} | level={p.get('triageLevel')} | status={p.get('admissionStatus')} | waiting={p.get('waitingTime')}")
except Exception as e:
    print(f"Error: {e}")

# Check all patients
print()
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"Waiting queue: {len(data)} patients")
    for p in data[:10]:
        print(f"  {p.get('fullName')} | status={p.get('admissionStatus')}")
except Exception as e:
    print(f"Error: {e}")

# Check command center stats
print()
try:
    req = urllib.request.Request("http://localhost:8081/api/command-center/stats", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"Command center: {json.dumps(data, indent=2)[:300]}")
except Exception as e:
    print(f"Error: {e}")
