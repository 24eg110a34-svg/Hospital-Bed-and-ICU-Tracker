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

req = urllib.request.Request("http://localhost:8081/api/allocations/active", headers=HEADERS)
allocs = json.loads(urllib.request.urlopen(req).read())
print(f"Active allocations: {len(allocs)}")
for a in allocs[:5]:
    print(f"  id={a.get('id')}, bedId={a.get('bedId')}, patientId={a.get('patientId')}")
# Check bed 2 status
req2 = urllib.request.Request("http://localhost:8081/api/beds/2", headers=HEADERS)
bed2 = json.loads(urllib.request.urlopen(req2).read())
print(f"\nBed 2 status: {bed2.get('status')}")
# Check if bed 2 has active allocation
req3 = urllib.request.Request("http://localhost:8081/api/allocations?bedId=2", headers=HEADERS)
try:
    allocs2 = json.loads(urllib.request.urlopen(req3).read())
    print(f"Allocations for bed 2: {len(allocs2)}")
    for a in allocs2:
        print(f"  id={a.get('id')}, dischargeTime={a.get('dischargeTime')}")
except Exception as e:
    print(f"Error: {e}")
