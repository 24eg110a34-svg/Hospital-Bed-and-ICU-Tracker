# Real-Time Hospital Emergency Bed & ICU Allocation Tracker

A three-tier web application for managing hospital bed capacity across Emergency, ICU, HDU,
Isolation and General wards, and for matching waiting patients to beds under clinical and
infrastructural constraints. State changes propagate to every connected clinical terminal over
WebSocket without polling.

## Features

- **Live bed board** — 3D-perspective ward floor map, grouped by ward, with per-bed status
- **Priority triage queue** — all pre-admission patients, ordered by acuity then arrival time
- **Scored bed–patient matching** — blocker-based eligibility with an operator-auditable reason
  for every ranking decision (see `BedAllocationService#evaluate`)
- **Real-time synchronisation** — STOMP over SockJS across seven topics
- **Housekeeping workflow** — `OCCUPIED → CLEANING → AVAILABLE` turnaround loop
- **Resource tracking** — ventilator/oxygen/PPE stock with shortage alerting
- **Ambulance fleet** — dispatch state and arrival tracking
- **Role-based access control** — `ADMIN`, `DOCTOR`, `NURSE`, `STAFF`, enforced server-side
- **Immutable audit log** — every state-changing operation recorded with actor and before/after
- **Alerting** — capacity thresholds, prolonged waiting, resource shortages
- **Command palette** — `Ctrl+K` global search across patients, beds and wards

## Motion design system

Motion in this project is functional, not decorative. Every animation answers a clinical
question: *did this number just change, which bed just freed up, is the backend still
talking to me.* Animations are declared once as `cc-`prefixed keyframes in
`frontend/src/index.css` and consumed as utility classes, so timing stays consistent
across every page.

| Utility | Purpose |
|---|---|
| `cc-stagger` | Staggered list entrance via a `--i` index variable. Applied to the triage queue so priority order is legible at a glance as rows cascade in |
| `cc-attention` | One-shot expanding ring, fired when a live WebSocket event mutates an entity. Green for freed capacity, `-warn` variant for degradation |
| `cc-collapse` | Height-animated disclosure using the `grid-template-rows: 0fr → 1fr` technique — no JS measurement, so it cannot desync from content |
| `cc-ring` | Conic-gradient occupancy ring with a radial mask, colour-shifting at 70% and 85% capacity thresholds |
| `cc-value-flash` | Background pulse when a bound clinical value changes |
| `cc-count-pulse` | Vertical tick on stat values as `CountUp` resolves |
| `cc-sheen` | One-pass highlight sweep on hover for interactive cards |
| `cc-bar-glow` | Breathing saturation on live progress bars |
| `cc-spinner` / `cc-sweep` / `cc-skeleton` | Indeterminate loading states |

`CountUp` animates stat values with `requestAnimationFrame` and an ease-out cubic, diffing
from the previous value so a live update tweens rather than jumps.

**Accessibility.** A global `prefers-reduced-motion: reduce` block collapses every animation
and transition to `0.001ms`, so the entire system above respects the OS setting with no
per-component opt-out. Decorative keyframes are additionally marked `will-change` and
compositor-only (`transform` / `opacity`) to keep them off the main thread.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.2.0, Spring Data JPA, Hibernate 6.3 |
| Real-time | Spring WebSocket, STOMP 1.2 over SockJS |
| Security | Spring Security 6.2, method-level RBAC, BCrypt |
| Database | MySQL 8.0 |
| Frontend | React 18.2, Vite 5.4, React Router 6.20 |
| Styling | Tailwind CSS 3.3, custom CSS-3D design system |
| Charts | Recharts 2.10 |
| Icons | Lucide React |

## Architecture

```
React SPA  ──REST/JSON──>  Controllers ──> Services ──> Repositories ──> MySQL
    │                            │             │
    └────STOMP/WebSocket────> RealtimeEventPublisher
```

Strict separation between persistence entities, transport-facing DTOs, and domain services.
Entities are never serialised directly; all responses are built from `PatientView`, `BedView`
and `AllocationView`. This prevents lazy-initialisation faults during serialisation and keeps
the persistence representation out of the public API contract.

## Getting started

### Prerequisites

- JDK 21+
- Maven 3.9+
- Node.js 18+
- MySQL 8.0 running

### Quick start with Docker

The whole stack — MySQL, backend and a production nginx build of the front end — comes up with
one command. No local JDK, Maven, Node or MySQL install required:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Front end | http://localhost:8080 |
| Backend API | http://localhost:8081 |
| MySQL | `localhost:3306` (user `root`, password `root`) |

The schema is created automatically on first boot. To wipe the database and start clean:

```bash
docker compose down -v
```

Override any setting without editing the compose file:

```bash
DB_PASSWORD=secret CORS_ORIGINS=https://your.host docker compose up --build
```

### Running locally

### Database

The schema is generated automatically by Hibernate (`ddl-auto=update`) on first boot; no manual
migration step is required.

```sql
CREATE DATABASE IF NOT EXISTS bedtracker;
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

Runs on `http://localhost:8081`.

Or run the packaged jar, which is what the Docker image and the local watchdog use:

```bash
mvn package
java -jar target/bedtracker-0.0.1-SNAPSHOT.jar
```

> If the backend is already running from `target/*.jar` on Windows, stop that process before
> `mvn package` — the running JVM holds a lock on the jar and `clean` will fail to delete it.

Configuration is externalised — every value has a working local default and can be overridden by
environment variable:

| Variable | Default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `bedtracker` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `root` |
| `SERVER_PORT` | `8081` |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` |

For anything beyond local development, set `DB_PASSWORD` and `CORS_ORIGINS` explicitly.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### Default credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Doctor | `doctor` | `doc123` |
| Nurse | `nurse` | `nurse123` |
| Staff | `staff` | `staff123` |

> These are development seeds. Replace them before any non-local deployment.

### Security posture

Session tokens are opaque 384-bit values from `SecureRandom`, persisted server-side with a
12-hour expiry and validated on every request — not stateless JWTs, so there is no signing
key to leak or rotate. Passwords are BCrypt hashes, and RBAC is enforced server-side at the
method level rather than in the client. All configuration, including the datasource
password, is externalised behind environment variables with working local defaults.

## Tests

The eligibility and scoring algorithm in `BedAllocationService#evaluate` is the part of this
system where a silent regression would matter most — a bad ranking sends a patient to the
wrong ward — so it is covered directly.

```bash
cd backend
mvn test
```

21 tests run in about a second with no external dependencies. They pin the behaviour of:

- **Hard blockers** — a non-`AVAILABLE` bed, a bed with an active allocation, a bed-type
  mismatch, each unmet clinical requirement, and a bed belonging to another hospital all make
  a match ineligible, and each names itself in the operator-facing reason
- **Ward routing** — a matching `requiredWardType` scores +60; a mismatch is a hard blocker
  rather than a low score; level 1 patients are pushed to ICU (and blocked elsewhere); level 2
  patients accept any acute ward; stable patients are steered away from scarce ICU capacity
- **Scoring** — capability bonuses, the extra 5 points for a fully equipped ICU bed, and the
  `RECOMMENDED` / `SUITABLE` / `ACCEPTABLE` / `POOR_MATCH` label boundaries
- **Ranking** — results order eligible beds first, then by descending score, then bed number,
  and a patient who already holds a bed cannot be matched again

Tests use Mockito and need no database. `ByteBuddy` is pinned to 1.18.11 in `pom.xml` because
the version managed by Spring Boot 3.2.0 cannot instrument classes on JDK 25.

Continuous integration runs `mvn test`, `mvn package`, `npm ci`, `npm run build` and a Docker
image build on every push — see `.github/workflows/ci.yml`.

## Verification scripts

Ad-hoc API checks authenticate dynamically and require the backend to be running:

```bash
python check_queues.py      # queue state
python check_triage.py      # triage queue contents
python test_workflow.py     # allocation workflow
```

Override connection settings with `HOSPITAL_API`, `HOSPITAL_USER`, `HOSPITAL_PASSWORD`, or
supply a pre-issued `HOSPITAL_TOKEN`.

## Project documentation

`PROJECT_PAPER.md` — full design and evaluation write-up covering the architecture, the
eligibility algorithm, and a defect analysis of four substantive faults found during
integration testing.

## Known limitations

- No load or latency characterisation has been performed
- `BedAllocationService` is covered by unit tests, but there is no integration or end-to-end
  test suite; the workflow scripts below remain the only check on the HTTP and WebSocket layers
- `GET /api/notifications` returns the full notification history unpaginated (~5 MB against
  the seed dataset); it should be paged or windowed before it is used at scale
- Alert deduplication state is held in memory, so restarts re-raise active alerts
- Bearer tokens are stored in `localStorage` with no refresh or rotation
- The `suitable-patients` query considers only `WAITING_FOR_BED`, which is narrower than the
  triage queue's status set
- Seeded accounts use fixed development passwords and are recreated by `DataInitializer` on
  an empty database; they must be disabled or rotated outside local development
- The Docker Compose stack and the CI workflow have not been executed end-to-end; the images
  are built from the same commands verified locally
