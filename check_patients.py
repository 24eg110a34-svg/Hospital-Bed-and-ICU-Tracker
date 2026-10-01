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

req = urllib.request.Request("http://localhost:8081/api/patients/all", headers=HEADERS)
data = json.loads(urllib.request.urlopen(req).read())
print(f"Total patients: {len(data)}")
statuses = {}
for p in data:
    s = p.get('admissionStatus')
    statuses[s] = statuses.get(s, 0) + 1
print(f"Statuses: {statuses}")

for s in set(p.get('admissionStatus') for p in data):
    patients = [p for p in data if p.get('admissionStatus') == s][:3]
    names = [(p.get('fullName'), p.get('triageLevel'), p.get('triageCategory')) for p in patients]
    print(f"  {s}: {names}")

# Check patient 17 (Aarav Nair) specifically
print()
try:
    req2 = urllib.request.Request("http://localhost:8081/api/patients/17", headers=HEADERS)
    p = json.loads(urllib.request.urlopen(req2).read())
    print(f"Patient 17 ({p.get('fullName')}): status={p.get('admissionStatus')}, triage={p.get('triageLevel')}, cat={p.get('triageCategory')}")
except Exception as e:
    print(f"Error: {e}")
