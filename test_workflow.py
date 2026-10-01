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

# Test findSuitablePatients
try:
    req = urllib.request.Request("http://localhost:8081/api/beds/available", headers=HEADERS)
    beds = json.loads(urllib.request.urlopen(req).read())
    print(f"Available beds: {len(beds)}")
    if beds:
        bed = beds[0]
        print(f"First bed: {bed['bedNumber']} (id={bed['id']})")
        
        # Find suitable patients for this bed
        req2 = urllib.request.Request(f"http://localhost:8081/api/beds/{bed['id']}/suitable-patients", headers=HEADERS)
        patients = json.loads(urllib.request.urlopen(req2).read())
        print(f"Suitable patients for {bed['bedNumber']}: {len(patients)}")
        for p in patients[:3]:
            print(f"  {p['fullName']} | triage={p['triageLevel']} | score={p.get('score')} | {p.get('scoreLabel')}")
except Exception as e:
    print(f"Error: {e}")

# Test triage queue
print()
try:
    req = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"Waiting patients: {len(data)}")
    for p in data[:3]:
        print(f"  {p['fullName']} | status={p['admissionStatus']} | triage={p['triageLevel']}")
except Exception as e:
    print(f"Error: {e}")

# Test command-center stats
print()
try:
    req = urllib.request.Request("http://localhost:8081/api/command-center/stats", headers=HEADERS)
    stats = json.loads(urllib.request.urlopen(req).read())
    print(f"Command center: total={stats['totalBeds']}, available={stats['availableBeds']}, occupied={stats['occupiedBeds']}")
except Exception as e:
    print(f"Error: {e}")
