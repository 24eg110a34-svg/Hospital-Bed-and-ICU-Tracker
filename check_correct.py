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

# The frontend uses /api/patients/queue for waiting patients
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"GET /api/patients/queue (waiting): {len(data)} patients")
    for p in data[:5]:
        print(f"  {p.get('fullName')} | status={p.get('admissionStatus')} | triage={p.get('triageLevel')}")
except Exception as e:
    print(f"GET /api/patients/queue: ERROR - {e}")

# Check all endpoint mappings
print()
# Check what patientService.getWaiting() maps to in api.js
# getWaiting: () => api.get('/patients/queue')
# getTriageQueue: () => api.get('/patients/triage-queue')

# Test triage queue
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/triage-queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"GET /api/patients/triage-queue: {len(data)} patients")
except Exception as e:
    print(f"GET /api/patients/triage-queue: ERROR - {e}")

# Test the combined triage queue
print()
try:
    p1 = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
    p2 = urllib.request.Request("http://localhost:8081/api/patients/triage-queue", headers=HEADERS)
    waiting = json.loads(urllib.request.urlopen(p1).read())
    triage = json.loads(urllib.request.urlopen(p2).read())
    print(f"Triage queue page data: waiting={len(waiting)}, triage={len(triage)}, total={len(waiting)+len(triage)}")
    for p in waiting[:3]:
        print(f"  WAITING: {p.get('fullName')} | level={p.get('triageLevel')} | status={p.get('admissionStatus')}")
except Exception as e:
    print(f"Combined error: {e}")
