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

# Step 1: Find suitable patients for first available bed
print("STEP 1: Find suitable patients for available bed")
req = urllib.request.Request("http://localhost:8081/api/beds/available", headers=HEADERS)
beds = json.loads(urllib.request.urlopen(req).read())
bed = beds[0]
print(f"Bed: {bed['bedNumber']} (id={bed['id']})")

req2 = urllib.request.Request(f"http://localhost:8081/api/beds/{bed['id']}/suitable-patients", headers=HEADERS)
patients = json.loads(urllib.request.urlopen(req2).read())
print(f"Suitable patients: {len(patients)}")
if patients:
    patient = patients[0]
    print(f"Best match: {patient['fullName']} (score={patient.get('score')})")
    
    # Step 2: Allocate patient to bed
    print(f"\nSTEP 2: Allocate {patient['fullName']} to {bed['bedNumber']}")
    req3 = urllib.request.Request(
        f"http://localhost:8081/api/beds/{bed['id']}/allocate-patient/{patient['id']}",
        headers=HEADERS, method="POST"
    )
    result = json.loads(urllib.request.urlopen(req3).read())
    print(f"Allocation result: {result['message']}")
    print(f"Patient: {result['patient']}, Bed: {result['bed']}")
    
    # Step 3: Verify bed status changed
    req4 = urllib.request.Request("http://localhost:8081/api/beds/available", headers=HEADERS)
    beds_after = json.loads(urllib.request.urlopen(req4).read())
    print(f"\nSTEP 3: Available beds after allocation: {len(beds_after)} (was {len(beds)})")
    
    # Step 4: Check patient status
    req5 = urllib.request.Request(f"http://localhost:8081/api/patients/{patient['id']}", headers=HEADERS)
    p_after = json.loads(urllib.request.urlopen(req5).read())
    print(f"\nSTEP 4: Patient status: {p_after['admissionStatus']}")
    
    # Step 5: Test discharge to cleaning
    print(f"\nSTEP 5: Discharge to CLEANING")
    req6 = urllib.request.Request("http://localhost:8081/api/allocations/active", headers=HEADERS)
    allocs = json.loads(urllib.request.urlopen(req6).read())
    if allocs:
        alloc = allocs[0]
        req7 = urllib.request.Request(
            f"http://localhost:8081/api/allocations/{alloc['id']}/discharge",
            headers=HEADERS, method="POST"
        )
        result = json.loads(urllib.request.urlopen(req7).read())
        print(f"Discharge result: {result['message']}")
    
    # Step 6: Complete cleaning
    print(f"\nSTEP 6: Complete cleaning")
    try:
        req8 = urllib.request.Request("http://localhost:8081/api/beds/cleaning", headers=HEADERS)
        cleaning_beds = json.loads(urllib.request.urlopen(req8).read())
        if cleaning_beds:
            cb = cleaning_beds[0]
            req9 = urllib.request.Request(
                f"http://localhost:8081/api/beds/{cb['id']}/complete-cleaning",
                headers=HEADERS, method="POST"
            )
            result = json.loads(urllib.request.urlopen(req9).read())
            print(f"Cleaning result: {result['message']}")
    except Exception as e:
        print(f"Cleaning test error: {e}")

print("\nWORKFLOW TEST COMPLETE")
