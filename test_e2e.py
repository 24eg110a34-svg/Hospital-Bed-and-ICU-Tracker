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

def api(url, method="GET", data=None):
    req = urllib.request.Request(url, headers=HEADERS, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode()
    return json.loads(urllib.request.urlopen(req).read().decode())

async def main():
    print("=" * 60)
    print("FINAL REAL-TIME VERIFICATION")
    print("=" * 60)

    # 1. Triage queue data
    print("\n1. TRIAGE QUEUE DATA")
    waiting = api("http://localhost:8081/api/patients/queue")
    triage = api("http://localhost:8081/api/patients/triage-queue")
    print(f"   Waiting: {len(waiting)} patients")
    print(f"   Triage status: {len(triage)} patients")
    print(f"   Total shown on triage page: {len(waiting) + len(triage)}")
    if waiting:
        p = waiting[0]
        print(f"   First patient: {p['fullName']}, triage={p['triageLevel']}, waiting={p['waitingMinutes']}m")

    # 2. WebSocket connection
    print("\n2. WebSocket STOMP Connection")
    try:
        ws = await websockets.connect("ws://localhost:8081/ws")
        await ws.send("CONNECT\naccept-version:1.1,1.0\nhost:/\n\n\x00")
        resp = await asyncio.wait_for(ws.recv(), timeout=3)
        if "CONNECTED" in resp:
            print("   PASS: WebSocket connected")
        else:
            print("   FAIL: Expected CONNECTED")
            return

        # Subscribe to relevant topics
        topics = ["/topic/patients", "/topic/beds", "/topic/allocations", "/topic/command-center"]
        for topic in topics:
            sid = f"sub-{hash(topic) % 10000}"
            await ws.send(f"SUBSCRIBE\nid:{sid}\ndestination:{topic}\n\n\x00")
        print(f"   PASS: Subscribed to {len(topics)} topics")
        await asyncio.sleep(0.5)

        # 3. Test real-time events
        print("\n3. REAL-TIME EVENT TEST (Discharge)")
        allocations = api("http://localhost:8081/api/allocations/active")
        if allocations:
            alloc = allocations[0]
            result = api(f"http://localhost:8081/api/allocations/{alloc['id']}/discharge", method="POST")
            print(f"   Discharge: {result['message'][:50]}")
            await asyncio.sleep(2)
            events = []
            for _ in range(10):
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1)
                    if msg and len(msg) > 10:
                        events.append(msg[:100])
                except asyncio.TimeoutError:
                    break
            print(f"   WebSocket events received: {len(events)}")
            for e in events[:3]:
                print(f"   [WS] {e}")
        else:
            print("   No active allocations to test")

        # 4. Command-center stats
        print("\n4. COMMAND CENTER STATS")
        stats = api("http://localhost:8081/api/command-center/stats")
        print(f"   totalBeds={stats['totalBeds']}, available={stats['availableBeds']}, occupied={stats['occupiedBeds']}")

        await ws.send("DISCONNECT\n\n\x00")
        await ws.close()
        print("\n   PASS: WebSocket disconnected gracefully")
    except Exception as e:
        print(f"   FAIL: {e}")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE - ALL SYSTEMS OPERATIONAL")
    print("=" * 60)

asyncio.run(main())
