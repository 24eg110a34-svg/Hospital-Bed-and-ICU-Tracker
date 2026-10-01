import urllib.request
try:
    req = urllib.request.Request('http://localhost:5173/triage')
    r = urllib.request.urlopen(req)
    html = r.read().decode()
    print(f"Status: {r.status}")
    print(f"Length: {len(html)}")
    has_triage = "Triage" in html
    has_register = "Register Emergency" in html
    print(f"Has 'Triage': {has_triage}")
    print(f"Has 'Register Emergency': {has_register}")
    # Check for React root
    has_root = 'id="root"' in html or 'id="app"' in html or '<div' in html
    print(f"Has React root: {has_root}")
except Exception as e:
    print(f"Error: {e}")
