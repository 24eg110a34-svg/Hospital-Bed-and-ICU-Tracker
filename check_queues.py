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

# Check getWaiting endpoint
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/waiting", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"GET /api/patients/waiting: {len(data)} patients")
    for p in data[:3]:
        print(f"  {p.get('fullName')} | status={p.get('admissionStatus')} | triage={p.get('triageLevel')}")
except Exception as e:
    print(f"GET /api/patients/waiting: ERROR - {e}")

# Check getTriageQueue endpoint
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/triage-queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"\nGET /api/patients/triage-queue: {len(data)} patients")
    for p in data[:3]:
        print(f"  {p.get('fullName')} | status={p.get('admissionStatus')} | triage={p.get('triageLevel')}")
except Exception as e:
    print(f"\nGET /api/patients/triage-queue: ERROR - {e}")

# Check getWaiting (all patients endpoint)
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/all", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"\nGET /api/patients/all: {len(data)} patients total")
except Exception as e:
    print(f"GET /api/patients/all: ERROR - {e}")
