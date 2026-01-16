# TraceOps Report Schema (v0.1 -> v0.5)

## Design goals
- Stable versioned schema
- Evidence-driven output
- UI and AI layers depend only on schema

## Top-level structure (v0.1)
- report_version
- engine_version
- job_id
- generated_at
- input
- summary
- findings[]
- evidence[]
- flows[]
- protocol_stats

## Finding object
Each finding MUST include evidence references.
Fields:
- id
- title
- category (DNS/TCP/TLS/HTTP/...)
- severity (INFO/WARN/HIGH/CRITICAL)
- confidence (0.0 - 1.0)
- recommendations[]
- evidence_refs[]

## Evidence object
- evidence_id
- type
- time_range
- flow_refs[]
- details{}

## Phase 2 additions (target v0.5)
- timeline[]
- rca.root_cause_candidates[]
- rca.primary_symptoms[]
- rca.recommendations[]
