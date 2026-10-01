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

# Test getWaiting
req = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
data = json.loads(urllib.request.urlopen(req).read())
print(f"/api/patients/queue: {len(data)} patients")
for p in data:
    print(f"  {p.get('fullName')} | status={p.get('admissionStatus')} | triage={p.get('triageLevel')} | waiting={p.get('waitingMinutes')}m")
    if 'waitingMinutes' not in p:
        print("  WARNING: waitingMinutes field missing!")

# Test getTriageQueue
req2 = urllib.request.Request("http://localhost:8081/api/patients/triage-queue", headers=HEADERS)
data2 = json.loads(urllib.request.urlopen(req2).read())
print(f"/api/patients/triage-queue: {len(data2)} patients")

# Check if PatientView has all required fields
if data:
    keys = list(data[0].keys())
    print(f"\nPatientView fields: {keys}")
    missing = ['waitingMinutes', 'requiredEquipmentSummary', 'triageCategory']
    for m in missing:
        if m not in keys:
            print(f"  MISSING: {m}")
        else:
            print(f"  OK: {m} = {data[0].get(m)}")
