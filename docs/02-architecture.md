# TraceOps Architecture (v0.1)

## Components
- Frontend: React + TypeScript + Vite
- Backend API: FastAPI (Python)
- Engine: Go PCAP analysis engine
- Storage:
  - SQLite (MVP)
  - filesystem artifacts
- Future:
  - Postgres + MinIO/S3
  - async queue workers

## High-level flow
User uploads PCAP -> Analysis Job -> Engine generates Report JSON -> UI renders Findings/Evidence.

## Job model
Jobs are tracked using states:
- CREATED
- QUEUED
- RUNNING
- DONE
- FAILED

Future state:
- CANCELED

## Artifact model
Artifacts represent stored objects:
- PCAP input
- Report JSON
- Report Markdown
- Report PDF (later)

Artifacts include:
- artifact_id
- type
- uri
- sha256
- size_bytes

## Boundaries (non-negotiable)
- Engine is deterministic and does not rely on AI.
- Backend orchestrates jobs and storage.
- Frontend consumes only report JSON from backend.
- Report schema is versioned and backward compatible.
