import urllib.request
req = urllib.request.Request('http://localhost:5173/src/pages/Triage.jsx')
try:
    r = urllib.request.urlopen(req)
    content = r.read().decode()
    print(f"Triage.jsx loaded: {len(content)} chars")
    print(f"Has useLiveData: {'useLiveData' in content}")
    print(f"Has getWaiting: {'getWaiting' in content}")
    print(f"Has getTriageQueue: {'getTriageQueue' in content}")
    print(f"Has PatientView: {'PatientView' in content}")
except Exception as e:
    print(f"Error: {e}")

# Check if useLiveData hook is loaded
req2 = urllib.request.Request('http://localhost:5173/src/hooks/useLiveData.js')
try:
    r2 = urllib.request.urlopen(req2)
    content2 = r2.read().decode()
    print(f"\nuseLiveData.js loaded: {len(content2)} chars")
    print(f"Has fetcher: {'fetcher' in content2}")
    print(f"Has latestEvent: {'latestEvent' in content2}")
except Exception as e:
    print(f"useLiveData error: {e}")

# Check HospitalContext
req3 = urllib.request.Request('http://localhost:5173/src/context/HospitalContext.jsx')
try:
    r3 = urllib.request.urlopen(req3)
    content3 = r3.read().decode()
    print(f"\nHospitalContext.jsx loaded: {len(content3)} chars")
    print(f"Has onConnect: {'onConnect' in content3}")
    print(f"Has setLatestEvent: {'setLatestEvent' in content3}")
    print(f"Has TOPICS: {'TOPICS' in content3}")
except Exception as e:
    print(f"HospitalContext error: {e}")
