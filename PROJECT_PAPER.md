# A Real-Time Hospital Emergency Bed and ICU Allocation Tracker

**Design, Implementation and Defect Analysis of a Web-Based Bed Management System**

---

## Abstract

This paper presents the design and implementation of a real-time hospital bed and ICU allocation tracker, a web-based system that manages the lifecycle of beds across emergency, intensive care and general wards, and matches waiting patients to beds under clinical and infrastructural constraints. The system is built as a three-tier Java/Spring Boot and React single-page application backed by MySQL, and uses STOMP over WebSocket to propagate state changes to all connected clinical terminals without polling.

The central contribution of this work is not the technology stack, which is deliberately conventional, but rather (a) a formalised, scored bed–patient eligibility algorithm that encodes triage severity, ward-type affinity and equipment capability into a single auditable decision, and (b) a rigorous defect analysis of four substantive faults uncovered during integration testing, two of which silently corrupted clinical data and two of which caused total application failure. The most consequential finding is that a partial-update defect in the persistence layer silently erased life-support equipment requirements from patient records during triage, which would have caused critically ill patients to be matched to beds lacking ventilatory support.

The system is evaluated through functional and data-integrity testing against a live deployment. Results demonstrate correct queue semantics, preservation of clinical requirements across triage transitions, and a reduction in alert-payload volume of approximately 99.7% following remediation of an unbounded alert-generation defect. Limitations are discussed candidly, including the absence of load testing and a formalised automated test suite.

**Keywords:** bed management, health informatics, real-time systems, emergency department, triage, WebSocket, Spring Boot, decision support

---

## 1. Introduction

### 1.1 Problem statement

Hospital bed management is a discrete-event allocation problem under scarcity. Emergency departments admit patients continuously, while bed capacity is fixed and heterogeneous: a bed may differ from its neighbour in ward type, in the presence of ventilatory support, in isolation capability, or in access to dialysis. Patients arrive with differing acuity, and the clinical consequence of a mis-assignment is not symmetric — placing a patient requiring mechanical ventilation into an un-equipped bed is a categorically different event from placing a stable patient in a higher-acuity bed than strictly necessary.

The operational difficulty is compounded by temporal dynamics. Beds are not static inventory. A bed moves through a lifecycle of occupancy, discharge, terminal cleaning, and return to service, and during the cleaning interval it is correctly unavailable. Consequently, a staffing decision made against a static bed board is frequently invalid by the time it is acted upon.

### 1.2 Motivation

Existing bed-management deployments in the literature and in practice are frequently static, updated by periodic refresh, or dependent on a single coordinating operator entering state manually. [CITATION NEEDED: research on electronic bed management systems and their adoption in emergency departments.] This creates two failure modes. First, the displayed board diverges from physical reality, so staff allocate against stale information. Second, because the scarce resource is a bed rather than a patient, the absence of *any* match is frequently a data-consistency failure rather than a genuine capacity constraint — a patient may exist who is compatible with an available bed, but who is not visible in the interface because of a query defect.

The second failure mode is the more insidious, and motivated part of this work. During integration testing of the present system, precisely this defect was observed: a patient record existed, was counted on the operations dashboard, and was simultaneously absent from the triage queue presented to clinical staff.

### 1.3 Objectives and contributions

The objectives of this project were:

1. To maintain a consistent, real-time view of bed capacity and patient acuity across all connected terminals.
2. To encode bed–patient compatibility as an explicit, inspectable and scored algorithm rather than ad-hoc operator judgement.
3. To guarantee that the set of patients presented for triage is *complete* with respect to all clinically pre-admission states.
4. To guarantee that clinical data — in particular equipment requirements — is not corrupted by operations that do not semantically modify it.

Contributions claimed by this paper are:

- **C1.** A three-tier architecture for real-time bed and ICU allocation, described in §5.
- **C2.** A scored, blocker-based bed–patient eligibility algorithm (§6.2) producing both a binary eligibility decision and a human-readable justification.
- **C3.** A defect analysis (§8) of four substantive faults, including a partial-update defect that silently destroyed clinical safety-critical data, and an inconsistency in the eligibility query scope.
- **C4.** A remediation of an unbounded alert-generation defect, yielding a 99.7% reduction in alert payload volume (§9.3).

### 1.4 Scope

The system manages adult emergency, ICU, HDU, isolation, cardiology, surgery, paediatrics and general beds. It does not model clinical decision support, diagnosis, medication administration, or scheduling of procedures. Triage acuity is recorded by a clinician; the system consumes it and does not infer it.

---

## 2. Related Work

### 2.1 Real-time clinical information systems

Push-based notification over WebSocket has largely replaced polling in clinical dashboards, principally to reduce load and to eliminate staleness. The present system uses the STOMP protocol [1] over a SockJS [2] transport, selected for its compatibility with restrictive corporate proxies that frequently block raw WebSocket upgrades. Spring's messaging abstraction [3] provides the broker and subscription model.

### 2.2 Interoperability standards

The HL7 FHIR standard defines resources for patient, location and healthcare-service concepts [4]. The present system is *not* FHIR-conformant; its entities were designed independently. However, the `Patient`, `Ward` and `Bed` entities map cleanly onto FHIR `Patient`, `Location` and `HealthcareService` respectively, and §11 identifies FHIR adoption as the principal avenue for interoperability. [CITATION NEEDED: literature on FHIR-based bed management or location tracking.]

### 2.3 Triage and department crowding

Triage acuity assignment in this system uses a five-level ordinal scale mapped to named categories. Mass-casualty triage literature uses different scales optimised for surge rather than routine flow. [CITATION NEEDED: START triage and other mass-casualty triage instruments.] Department crowding is a well-documented predictor of adverse outcomes and is commonly quantified by metrics such as left-without-being-seen rates. [CITATION NEEDED: crowding metrics and their association with patient outcomes.]

### 2.4 Bed turnaround and housekeeping

The occupancy-to-available cycle is the mechanism by which capacity is released. [CITATION NEEDED: literature on bed turnaround time and environmental cleaning in acute care.]

---

## 3. Domain Model

### 3.1 Entities

The system models 15 relational entities. The principal ones are:

| Entity | Responsibility |
|---|---|
| `Hospital` | Root tenant; owns wards |
| `Ward` | Named clinical area with a `wardType` and `floor` |
| `Bed` | Allocatable unit; `bedType`, `status`, equipment flags |
| `Patient` | Person under care; acuity, requirements, admission state |
| `Allocation` | Time-bounded assignment of a patient to a bed |
| `BedReservation` | Provisional claim on a bed |
| `VitalSigns` | Time-series observation record |
| `PatientEvent` | Append-only clinical timeline entry |
| `Resource` | Consumable stock (ventilators, oxygen, PPE) with shortage flag |
| `Ambulance` | Fleet unit and its dispatch state |
| `Notification` | Generated clinical or operational alert |
| `AuditLog` | Immutable record of state-changing operations |
| `AuthToken` | Issued session token |
| `BedStatusHistory` | Bed lifecycle transition log |

`Patient` carries five boolean equipment requirements (`requiresVentilator`, `requiresOxygen`, `requiresIsolation`, `requiresDialysis`, `requiresCardiacMonitor`) and two allocation constraints (`requiredBedType`, `requiredWardType`). These fields are consumed directly by the eligibility algorithm and, as documented in §8.2, constitute the system's most safety-critical data.

### 3.2 Acuity model

Triage acuity is an ordinal integer 1–5, mapped to a categorical label:

| Level | Category | Interpretation |
|---|---|---|
| 1 | `CRITICAL` | Immediate life-threatening intervention |
| 2 | `EMERGENCY` | Very urgent, short delay tolerable |
| 3 | `URGENT` | Urgent, can wait briefly |
| 4 | `SEMI-URGENT` | Less urgent |
| 5 | `NON-URGENT` | Non-urgent |

The mapping is applied server-side and stored redundantly as `triageCategory` so that reporting queries do not require recomputation.

### 3.3 Bed lifecycle

```
AVAILABLE ──allocate──> OCCUPIED ──discharge──> CLEANING ──complete──> AVAILABLE
    │                      │                       │
    ├──reserve──> RESERVED┘                       └──> MAINTENANCE ──> AVAILABLE
    └──block───> BLOCKED ──────────────────────────> AVAILABLE
```

`RESERVED` to `OCCUPIED` is distinguished from other transitions to `OCCUPIED` in the event stream, since a reservation confirmation is a distinct clinical event from a fresh allocation.

---

## 4. Requirements

### 4.1 Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Display all beds grouped by ward with live status |
| FR-2 | Display all pre-admission patients in a priority-ordered triage queue |
| FR-3 | Rank candidate beds for a given patient, with justification |
| FR-4 | List patients suitable for a given available bed |
| FR-5 | Allocate, reserve, discharge and complete cleaning, subject to role |
| FR-6 | Propagate all state changes to connected terminals within one second |
| FR-7 | Record all state-changing operations in an immutable audit log |
| FR-8 | Generate alerts on capacity thresholds and prolonged waiting |

### 4.2 Non-functional requirements

| ID | Requirement | Rationale |
|---|---|---|
| NFR-1 | No data loss on partial update | Safety-critical (§8.2) |
| NFR-2 | Queue completeness | Operator cannot triage what is not displayed (§8.1) |
| NFR-3 | Graceful degradation | A rendering fault must not produce an unusable terminal |
| NFR-4 | Bounded alert volume | Prevents client-side resource exhaustion (§8.4) |
| NFR-5 | Accessibility | `prefers-reduced-motion` honoured; keyboard navigation |

---

## 5. System Architecture

### 5.1 Overview

The system follows a three-tier architecture with a strict separation between persistence entities, transport-facing data-transfer objects, and service logic.

```
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION  (React 18 + Vite + Tailwind)                      │
│  Dashboard · WardMap3D · Triage · Patients · Analytics · Search  │
└───────────────┬──────────────────────────────┬───────────────────┘
                │ REST (Axios)                 │ STOMP / SockJS
                ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  APPLICATION  (Spring Boot 3.2, Java)                            │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │ Controllers│ │   Services   │ │  Realtime  │ │   Security  │  │
│  │  (REST)    │ │ (domain)     │ │  Publisher │ │  (JWT+RBAC) │  │
│  └────────────┘ └──────┬───────┘ └────────────┘ └─────────────┘  │
│                        │                                         │
│  ┌────────────┐ ┌──────▼───────┐ ┌────────────────────────────┐  │
│  │    DTOs    │ │ Repositories │ │  Scheduled (AlertMonitor)  │  │
│  └────────────┘ └──────┬───────┘ └────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│  PERSISTENCE  MySQL 8.0 · Hibernate 6.3 (JPA)                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology selection

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Runtime | Java | 21 (toolchain) | Long-term support, strong JPA ecosystem |
| Framework | Spring Boot | 3.2.0 | Integrated security, data, messaging |
| Persistence | Hibernate (JPA) | 6.3.1 | Managed schema evolution, portable JPQL |
| Messaging | STOMP / SockJS | 1.2 / 1.6.1 | Proxy-tolerant WebSocket |
| Security | Spring Security | 6.2.0 | Method-level RBAC via `@PreAuthorize` |
| Database | MySQL | 8.0 | ACID, mature operational tooling |
| UI | React | 18.2 | Component model, concurrent rendering |
| Build | Vite | 5.4 | Fast HMR, ESM-native |
| Styling | Tailwind CSS | 3.3 | Consistent design tokens, no CSS bloat |
| Charts | Recharts | 2.10 | Declarative React-native charting |

Implementation size: 76 Java source files (4,858 lines), 32 frontend source files (4,828 lines), 247 lines of design-system CSS.

### 5.3 Real-time synchronisation

The server publishes a `RealtimeEvent` — a type discriminator, ISO-8601 timestamp and a string-keyed payload map — to seven topics:

`/topic/beds`, `/topic/patients`, `/topic/allocations`, `/topic/reservations`, `/topic/ambulances`, `/topic/notifications`, `/topic/command-center`

The client maintains a single STOMP connection and exposes both the most recent event and a rolling 60-entry activity log. On receipt of an event the client triggers a targeted refetch of the affected aggregate rather than a full page reload, which keeps network cost proportional to the change rather than to the page.

Bed status transitions are published with a *derived* event type rather than a single generic event, so that consumers can distinguish `BED_AVAILABLE` from `BED_CLEANING` from `BED_RESERVED` without inspecting the payload.

### 5.4 Access control

Four roles are defined — `ADMIN`, `DOCTOR`, `NURSE`, `STAFF` — enforced at the service method boundary with `@PreAuthorize`. Enforcement is deliberately *not* replicated in the client; the interface hides controls the current user cannot exercise, but the server remains authoritative. A review during development found that the front-end triage control was restricted to `ADMIN` and `DOCTOR` while the corresponding server endpoint also permitted `NURSE`; the client was subsequently widened to match.

---

## 6. Methodology

### 6.1 Triage queue construction

The triage queue must return every patient who is not yet admitted or discharged, ordered by clinical priority. Formally, for patient *p* with acuity *a(p)* ∈ {1..5} and arrival time *t(p)*:

**Queue(p)** ⟺ `admissionStatus(p)` ∈ {`TRIAGE`, `REGISTERED`, `WAITING`, `WAITING_FOR_BED`}

**order(p)** = ( COALESCE(*a(p)*, 99), *t(p)* ) ascending

`COALESCE` ensures unacuity-assessed patients sort last rather than first, since SQL `NULL` ordering is dialect-dependent. The implementation is a single JPQL query:

```sql
SELECT p FROM Patient p
WHERE p.admissionStatus IN :statuses
ORDER BY COALESCE(p.triageLevel, 99) ASC, p.arrivalTime ASC
```

The status set is defined as a named constant shared with the service layer, and a data-integrity check (§8.1) establishes that the persistence default and this set must not diverge.

### 6.2 Bed–patient eligibility algorithm

The algorithm is the system's principal decision-logic component. It produces a binary eligibility decision, an integer score, a banded label, and a human-readable justification. It operates in two stages: **blockers** (vetoes) and **score** (ranking).

**Stage 1 — Blockers.** Any blocker renders the pairing ineligible regardless of score:

1. Bed status is not `AVAILABLE`.
2. Bed already has an active (non-discharged) allocation.
3. Patient `requiredBedType` does not equal bed `bedType`.
4. Patient requires a capability the bed lacks (ventilator, oxygen, isolation, dialysis, cardiac monitor).
5. Patient `requiredWardType` is specified and does not match the ward's type.
6. Bed and patient belong to different hospitals.

**Stage 2 — Score.** Additive preference, applied only when no blocker is present:

| Condition | Δ Score |
|---|---|
| Ward type matches patient `requiredWardType` | +60 |
| Level 1 patient, ward is `ICU` | +100 |
| Level 1 patient, ward is not `ICU` | −80 (and a blocker) |
| Level 2 patient, ward ∈ {`EMERGENCY`, `ICU`, `HDU`} | +40 |
| Level 2 patient, other ward | −30 |
| Level ≥3 patient, ward is `ICU` | −70 |
| Level ≥3 patient, non-ICU ward | +30 |
| Bed has ventilator (patient does not require one) | +15 |
| Bed has oxygen (not required) | +10 |
| Bed has isolation (not required) | +15 |
| Bed has dialysis (not required) | +15 |
| Bed has cardiac monitor (not required) | +10 |
| No other reason recorded | +5 |
| ICU bed with ventilator *and* oxygen | +5 |

Score bands: ≥120 `RECOMMENDED`, ≥60 `SUITABLE`, ≥0 `ACCEPTABLE`, <0 `POOR-MATCH`.

Two design decisions merit comment. First, the scoring is **asymmetric by intent**: scarce high-acuity resources are actively *penalised* for non-critical patients (−70), implementing a conservation policy that a symmetric similarity metric would not express. Second, every rule appends to a `reasons` or `blockers` string that is returned to the operator, so the system's recommendation is auditable rather than opaque. This is a deliberate rejection of an uninterpretable learned ranker, on the grounds that a clinical operator must be able to overrule the system and must understand why.

The algorithm is asymmetric in a further sense: `GET /beds/{id}/suitable-patients` computes the transpose relation, evaluating each waiting patient against a single fixed bed. This is discussed as a residual defect in §8.5.

### 6.3 Alert generation

A scheduled evaluator runs every 120 seconds and raises alerts on: zero available ICU beds; ICU occupancy ≥ 80%; individual patients waiting ≥ 30 and ≥ 60 minutes; Level 1 patients waiting; resource shortages; and any blocked beds.

Deduplication is achieved by maintaining a set of *alert keys*; a key is emitted only if absent from the previous evaluation. This suppresses repetition for conditions that persist. §8.4 documents the consequence of the key set being held in volatile memory.

---

## 7. Implementation

### 7.1 Persistence layer

Fifteen tables were generated under `spring.jpa.hibernate.ddl-auto=update`, meaning the schema evolves with the entity model rather than being hand-maintained. Associations use explicit `LAZY` fetching for many-to-one relations to avoid accidental join fan-out on list endpoints. Response payloads are constructed through explicit `PatientView`, `BedView` and `AllocationView` data-transfer objects rather than serialising entities directly. This prevents lazy-initialisation exceptions during JSON serialisation and, critically, prevents the persistence representation of a patient — including all clinical requirement flags — from becoming an accidental part of the public API contract.

### 7.2 Service layer

Service methods are transactionally annotated, with read-only transactions for queries. State-changing operations emit audit records and realtime events as a matter of course, so that no code path can mutate state silently. A timeline service records append-only clinical events distinct from the operational audit log: the former is clinical narrative, the latter is a security record.

### 7.3 Client architecture

A single context provider owns session state, the STOMP connection, the toast queue, the rolling activity log and a resync counter. Pages consume data through small service hooks that refetch on relevant events. Entity access is isolated behind a `*Service` module per aggregate.

The presentation layer implements a design system built on a restrained CSS-3D approach: a perspective scene for the ward floor plan, tiles that elevate and tilt on hover, and a three-dimensional `rotateX` transition when a bed changes status. All motion is disabled under `prefers-reduced-motion`, and the continuous animations are limited to a live-connection indicator, alert emphasis, and cleaning-state shimmer.

### 7.4 Ward floor visualisation

The central visualisation renders every bed grouped by ward within a perspective-transformed grid. Selecting a bed opens a detail panel that retrieves suitable patients via the transpose eligibility query and offers direct allocation. The intended workflow is therefore continuous and physically motivated: a bed becomes available, an operator inspects it, compatible patients are retrieved, one is selected, the allocation is written, and both the patient and bed transition.

---

## 8. Defect Analysis

Four substantive defects and one architectural inconsistency were identified during integration testing. They are reported in detail because collectively they illustrate the principal failure modes of this class of system: invisible data, silent data corruption, total client failure, and unbounded resource growth.

### 8.1 Defect 1 — Incomplete triage queue (severity: high)

**Symptom.** Patients existed in the database and were counted on the operations dashboard, but did not appear in the triage queue. The dashboard reported a patient as waiting; the clinical queue offered no such patient.

**Cause.** The queue was constructed by merging two queries, each filtering on a single hard-coded status: `TRIAGE` and `WAITING_FOR_BED`. The status `WAITING` was simultaneously (a) declared valid in the entity's own documentation, (b) offered as a selectable option in the operator's registration form, (c) consumed by the command-centre, analytics and alert services — and (d) matched by no queue query whatsoever.

A second, more subtle variant compounded this. The `Patient` entity constructor initialised `admissionStatus` to the literal `REGISTERED`. Because Jackson invokes the no-arg constructor during deserialisation, this default was always present, and the service-layer guard intended to substitute a sensible default for a blank status was therefore **unreachable dead code**. Consequently, any client that omitted `admissionStatus` produced a patient in state `REGISTERED` — a value absent from the documented status set, from every queue query, and from the client-side status style map.

This is a defect of *semantic closure*: the system had no mechanism guaranteeing that the set of states a record could occupy was a subset of the set of states any consumer would query.

**Remediation.** A single parameterised query over an explicit status set, with `COALESCE` ordering (§6.1); the persistence default normalised to `TRIAGE` on creation; and the dead default-guard replaced with a reachable one. Verification: 0 pre-admission patients absent from the queue; registration without an explicit status now appears in the queue; the previously invisible `REGISTERED` state is also included as a legacy-data measure.

### 8.2 Defect 2 — Partial update destroying equipment requirements (severity: critical)

**Symptom.** Applying a triage decision silently erased a patient's equipment requirements.

**Cause.** The generic patient-update handler null-guarded every field *except* five. The five equipment-requirement fields were declared as primitive Java `boolean`, and were therefore assigned unconditionally from the incoming request object. Absent JSON properties deserialise to `false` for primitive types. The triage interface submitted a partial document containing only `{ triageLevel, admissionStatus }`; consequently all five requirement flags were overwritten with `false`.

**Clinical consequence.** A patient recorded as requiring mechanical ventilation, oxygen, isolation, dialysis and cardiac monitoring had all five requirements erased by a triage action. Because these fields are the direct input to the eligibility algorithm (§6.2), subsequent matching would have offered beds lacking ventilatory support to a Level 1 patient. The corruption was silent: no exception, no audit indication, and the operator's action appeared to succeed.

**Secondary cause.** The client invoked the generic update endpoint rather than the purpose-built `POST /patients/{id}/triage`. This bypassed the timeline event, the audit record, and the `PATIENT_TRIAGE_COMPLETED` broadcast, meaning other connected terminals never received the triage.

**Remediation.** The five fields were retyped as wrapper `Boolean` so that "absent" is distinguishable from "false", and the update handler was made null-guarded consistent with every other field. A normalisation step coerces nulls to `false` on creation so that no null is persisted. The accessors retained primitive return types with null-safe coercion, so that no call site required modification. The client was repointed to the dedicated endpoint.

**Verification.** A patient with ventilator and oxygen requirements was triaged; all five flags were confirmed unchanged. A partial update containing only `triageLevel` was confirmed to preserve all flags. An explicit `false` was confirmed to be honoured, establishing that the fix distinguishes absence from intent.

### 8.3 Defect 3 — Response-shape mismatch causing total client failure (severity: critical)

**Symptom.** The triage page displayed a permanent "could not load data" state. The underlying endpoint was healthy and returned correct data.

**Cause.** The service module returns an HTTP client response object, not a parsed payload. The queue-construction code destructured an array from that object, producing a type error at render time which the surrounding error handler converted into a user-facing failure state. Notably, **the original implementation contained this defect and it was preserved through an initial remediation attempt**, in which the same incorrect assumption was reproduced in rewritten form. Only end-to-end observation of the rendered page exposed it; neither a successful build nor a healthy API response would reveal it.

**Remediation.** Destructure the `data` property, with an explicit array-type assertion, consistent with the pattern already used elsewhere in the codebase. The codebase was subsequently audited for the same anti-pattern.

**Broader lesson.** A build succeeding and an endpoint returning HTTP 200 are jointly insufficient evidence of correctness. This defect motivated the introduction of a top-level error boundary (§8.6) so that a rendering fault produces a diagnostic — including the component stack — rather than an unusable terminal.

### 8.4 Defect 4 — Unbounded alert generation and client payload exhaustion (severity: medium)

**Symptom.** The notification table contained 5,736 rows, of which the large majority were unread and of critical severity. The client bell badge displayed a four-digit figure.

**Cause.** Two compounding faults. First, the alert evaluator's deduplication key set was held in volatile memory; consequently **every application restart re-raised every currently-active alert**, and the table grew monotonically across the development cycle. Second, the unread-notification endpoint retrieved the entire table and filtered in application memory, and the client's header component polled that endpoint every sixty seconds and on every inbound event.

**Remediation.** A count-only endpoint was introduced, returning two aggregate counts, and the client was repointed to it. The list endpoint was bounded to the fifty most recent unread records via a derived query, and the client polls only on notification-topic events plus a slow interval. The critical badge display was capped.

**Effect.** Unread payload reduced from approximately 11 KB to 31 bytes — a 99.7% reduction — and, more importantly, the payload is now independent of table size.

**Residual risk.** The volatile deduplication set remains unfixed, so the table will continue to grow across restarts. The correct remedy is to persist the key set. This is stated as outstanding work in §11.

### 8.5 Architectural inconsistency — eligibility scope

The triage queue (§6.1) admits patients in any of four pre-admission states, but the transpose query that lists suitable patients for a bed considers only `WAITING_FOR_BED`. A patient awaiting triage is therefore visible in the queue yet invisible as an allocation candidate. This is the same class of defect as §8.1, arising in a second location, and is recorded here as a finding rather than concealed. Remediation is straightforward — reuse the shared status constant — but was not implemented during the reported period and is listed in §11.

### 8.6 Client robustness defect

A rendering fault in the ward visualisation caused a blank application screen. The visualisation's detail component dereferenced a property of a nullable object during the initial render, before any bed was selected. Because no error boundary existed, the exception propagated to the root and React unmounted the entire tree, destroying the interface for all authenticated users on all pages.

Remediation comprised a null guard placed before any property access — and, following an audit, applied to all three components exhibiting the pattern — together with a top-level error boundary that renders a diagnostic with a component stack and a recovery action. The lesson generalises: in a clinical system, a fault in one view must not render the operator unable to reach the view that matters.

A further defect was identified during review: a React hook was invoked inside an array callback, violating the rules of hooks and risking a render-phase failure. This was corrected prior to deployment. Additionally, an entrance animation declared with `animation-fill-mode: both` retained its final keyframe transform indefinitely, which silently suppressed the `:hover` transform on the very elements the interaction design depended upon. Changing the fill mode to `backwards` preserved the entrance effect while restoring the interaction.

---

## 9. Evaluation

### 9.1 Method

Evaluation comprised functional and data-integrity testing against a live deployment with a seeded dataset of 8 wards, 71 beds (10 ICU, 12 emergency, 37 general, 6 HDU, 6 isolation), 43 patients, 25 allocations, 9 resources, 6 ambulances and 4 users. Tests were executed as scripted API-level assertions covering both successful paths and the specific defect scenarios of §8. All timings below are single-run measurements on a single-node deployment and should not be interpreted as statistically characterised.

### 9.2 Results

| Property | Expected | Observed |
|---|---|---|
| Triage queue completeness | All pre-admission patients | 0 absent |
| Queue ordering | Ascuity, then arrival | Confirmed |
| Registration without explicit status | Enters queue | Confirmed, state `TRIAGE` |
| Triage preserves equipment flags | Unchanged | Unchanged (5/5) |
| Partial update preserves flags | Unchanged | Unchanged (5/5) |
| Explicit `false` honoured | Applied | Applied |
| Triage transition retains queue membership | Retained | Retained |
| Suitable-patients query | 200, ranked | 200, 8 candidates |
| Unread payload after remediation | Bounded | 31 B (from ~11 KB) |
| Dashboard dependency endpoints | 200 | 7/7 |

### 9.3 Defect-driven yield

Of the four substantive defects, all were detected by functional testing that exercised the workflow rather than the endpoint. Three of the four (§8.2, §8.3, §8.6) were **invisible to compilation and to HTTP status codes**, and would not have been caught by a build pipeline or a smoke test asserting HTTP 200. This constitutes the principal methodological finding of the evaluation: for this class of system, correctness evidence must be drawn from state assertions rather than transport-level success.

### 9.4 Threats to validity

Several limitations materially constrain the strength of these conclusions.

- **No load or performance testing.** No concurrent-user, throughput or latency characterisation was performed. The claim of sub-second propagation (§4.2) is a design intent, not a measured result.
- **No formalised automated test suite.** Verification was performed with ad-hoc scripts. The defect in §8.3 survived partly because no regression test pinned the response-extraction contract.
- **Synthetic data.** The dataset is seeded and does not reflect real admission distributions, so the eligibility algorithm has not been exercised against realistic acuity mixes.
- **No clinical evaluation.** No usability testing with clinical staff, and no assessment of whether the system's recommendations align with clinical judgement.
- **Single-node deployment.** Broker, session and scheduling behaviour under multi-instance deployment is uncharacterised; the in-memory alert key set (§8.4) would in fact produce divergent behaviour across instances.

---

## 10. Discussion

The central architectural lesson of this project concerns the *closure* of state spaces. Defects §8.1 and §8.5 share a single root cause: the system permitted records to occupy states that no query retrieved. The persistence default, the operator-facing form options, the documentation and the query predicates were each independently reasonable, and nothing in the design forced them to agree. Such defects are invisible to code review conducted file-by-file, because no individual file is wrong; they emerge only from the assertion that the union of all reachable states must be a subset of the union of all queried states.

The second lesson concerns the semantics of partial update. §8.2 is a direct instance of a well-known hazard: a type system that cannot represent "not specified" (`boolean`) is coerced into asserting a value that the caller never intended. The remediation — wrapper types plus null guards — is unremarkable in isolation, but its absence caused silent destruction of safety-critical data, and its presence elsewhere in the same method for every other field shows the inconsistency was an oversight rather than a decision.

The third lesson is methodological. Three of the four substantive defects were undetectable by compilation and by transport-level success criteria. This argues that for clinical systems, the minimum viable verification harness must assert *state* — that a record exists, that a field retains its value, that a queue is complete — rather than asserting that a request returned 200.

Finally, the deliberate rejection of an uninterpretable ranking model in §6.2 deserves defence. A learned ranker would likely score marginally better on historical allocation data. It would also be impossible to audit, and an operator confronted with an unexplained recommendation for a Level 1 patient would be justified in disregarding it entirely. In this domain, interpretability is a functional requirement, not a nicety.

---

## 11. Limitations and Future Work

**Correctness and consistency**
1. Unify the eligibility scope with the triage-queue scope (§8.5) by reusing the shared status constant.
2. Persist the alert deduplication key set to eliminate cross-restart re-raising (§8.4).
3. Introduce an automated regression suite pinning the response-extraction contract (§8.3) and the partial-update contract (§8.2).
4. Add a schema-level `CHECK` constraint or equivalent on `admission_status` to make illegal states unrepresentable.

**Clinical and operational**
5. Model estimated discharge time to enable forward bed-availability projection, which the current reactive design cannot provide.
6. Add a cleaning-progress field, permitting genuine turnaround-time measurement rather than a binary cleaning state.
7. Support HL7 FHIR `Location`/`Patient` interoperability (§2.2).
8. Introduce deterioration alerts driven by vital-sign trends, not only dwell time.

**Engineering**
9. Characterise propagation latency and behaviour under concurrent load (§9.4).
10. Externalise scheduled execution and session state to support horizontal scaling.
11. Add token refresh and rotation; the current bearer tokens in `localStorage` are unsuitable for production.
12. Code-split the front-end bundle, which currently exceeds a conservative single-chunk threshold.

---

## 12. Conclusion

This paper has described a real-time hospital bed and ICU allocation system, and has reported four substantive defects discovered during its construction with the seriousness they warrant. The system's decision core — a scored, blocker-based eligibility algorithm with operator-auditable justification — encodes clinical acuity and infrastructural capability in an interpretable form. Its real-time layer propagates state to all terminals without polling.

The most valuable outcome, however, is negative and methodological. A defect that made waiting patients invisible to clinicians, a defect that silently erased ventilatory requirements from critically ill patients, and a defect that rendered the entire interface unusable were each invisible to a successful build and to HTTP 200 responses. Two of these survived an explicit remediation attempt. For clinical information systems, the implication is that verification must assert clinical state rather than transport success, and that the closure of reachable state spaces is a design obligation to be tested, not an assumption to be made.

---

## References

[1] *The STOMP Protocol Specification, Version 1.2.* Stomp Protocol Working Group.
Available: https://stomp.github.io/stomp-specification-1.2.html

[2] *The SockJS Protocol.* The SockJS project.
Available: https://github.com/sockjs/sockjs-spec

[3] *Spring Framework Reference Documentation — Integration (Messaging).* VMware.
Available: https://docs.spring.io/spring-framework/reference/integration/messaging.html

[4] *HL7 FHIR — Health Level Seven International.* Available: https://hl7.org/fhir/

[5] *Spring Boot Reference Documentation.* VMware. Available: https://docs.spring.io/spring-boot/index.html

[6] *Spring Data JPA Reference Documentation.* VMware. Available: https://docs.spring.io/spring-data/jpa/reference/

[7] *Spring Security Reference Documentation.* VMware. Available: https://docs.spring.io/spring-security/reference/

[8] *Hibernate ORM Documentation.* Available: https://docs.hibernate.org/orm/

[9] *MySQL 8.0 Reference Manual.* Oracle. Available: https://dev.mysql.com/doc/refman/8.0/en/

[10] *React Documentation.* Meta Platforms, Inc. Available: https://react.dev/

[11] *Vite Guide.* Available: https://vite.dev/guide/

[12] *Tailwind CSS Documentation.* Available: https://tailwindcss.com/docs

[13] *MDN Web Docs — `prefers-reduced-motion`.* Mozilla. Available: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

---

### Note on sources

References [1]–[13] are primary technical documentation and specifications, verifiable at the URLs given.

**Academic literature citations require your input.** The following are marked `[CITATION NEEDED]` and must be sourced from your own library before submission — I have deliberately not invented them:

- §1.2 — Electronic bed management systems in emergency departments
- §2.3 — Triage instruments (START and mass-casualty triage scales)
- §2.3 — Department crowding metrics and their association with patient outcomes
- §2.4 — Bed turnaround time and environmental cleaning in acute care
- §2.2 — FHIR-based bed management or location tracking

Where your course requires a specific citation style (IEEE, APA, Harvard), the numbered references above should be reformatted accordingly.
