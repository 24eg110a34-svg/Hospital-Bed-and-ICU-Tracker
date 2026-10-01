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

print("=" * 60)
print("TEST 1: REST API Authentication & Data")
print("=" * 60)

try:
    req = urllib.request.Request("http://localhost:8081/api/beds", headers=HEADERS)
    r = urllib.request.urlopen(req)
    beds = json.loads(r.read())
    print(f"PASS: Got {len(beds)} beds")
except Exception as e:
    print(f"FAIL: {e}")

try:
    req = urllib.request.Request("http://localhost:8081/api/command-center/stats", headers=HEADERS)
    r = urllib.request.urlopen(req)
    stats = json.loads(r.read())
    print(f"PASS: Stats: totalBeds={stats.get('totalBeds')}, available={stats.get('availableBeds')}")
except Exception as e:
    print(f"FAIL: {e}")

try:
    req = urllib.request.Request("http://localhost:8081/api/patients/queue", headers=HEADERS)
    r = urllib.request.urlopen(req)
    patients = json.loads(r.read())
    print(f"PASS: {len(patients)} waiting patients")
except Exception as e:
    print(f"FAIL: {e}")

print()
print("=" * 60)
print("TEST 2: STOMP WebSocket Connection")
print("=" * 60)

class TestListener(stomp.ConnectionListener):
    def __init__(self):
        self.messages = []
        self.connected = False
        self.lock = threading.Lock()
    def on_connected(self, frame):
        self.connected = True
        print("[WS] Connected!")
    def on_message(self, frame):
        try:
            body = json.loads(frame.body)
            with self.lock:
                self.messages.append(body)
            print(f"[WS] {frame.headers.get('destination','?')}: {json.dumps(body)[:120]}")
        except:
            print(f"[WS] raw: {frame.body[:80]}")
    def on_disconnected(self):
        self.connected = False
        print("[WS] Disconnected")

try:
    conn = stomp.Connection([("localhost", 61613)], heartbeat=(10000, 10000))
    listener = TestListener()
    conn.set_listener("", listener)
    conn.connect("admin", "admin123", wait=True)
    time.sleep(1)
    if listener.connected:
        print("PASS: STOMP connected successfully")
        topics = ["/topic/beds", "/topic/patients", "/topic/allocations", "/topic/reservations", "/topic/ambulances", "/topic/command-center", "/topic/notifications"]
        for topic in topics:
            try:
                conn.subscribe(destination=topic, id=hash(topic), ack="auto")
                print(f"PASS: Subscribed to {topic}")
            except Exception as e:
                print(f"FAIL: {topic}: {e}")
        time.sleep(2)
        with listener.lock:
            print(f"Messages received after subscriptions: {len(listener.messages)}")
        conn.disconnect()
    else:
        print("FAIL: STOMP not connected")
except Exception as e:
    print(f"FAIL: {e}")

print()
print("=" * 60)
print("REAL-TIME VERIFICATION COMPLETE")
print("=" * 60)
