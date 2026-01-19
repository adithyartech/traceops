# TraceOps Handoff Pack (Checkpoint)

Date: 2026-01-19
Owner: Adithya (adithyartech)
Repo: https://github.com/adithyartech/traceops

## Current Status (Working)
- docker compose dev stack works
- backend: FastAPI (python:3.12-slim)
- frontend: React TS Vite (node:22-alpine)
- engine: Go (golang:1.22)
- artifact store: shared docker volume mounted at /data/traceops
- queue: filesystem queue in /data/traceops/queue/
  - pending/
  - done/
  - failed/
- engine worker: engine/worker.sh auto processes jobs

## Working Flow
1) UI POST /api/v1/jobs
2) backend creates:
   - job_id
   - placeholder report.json in /data/traceops/artifacts/reports/<job_id>/report.json
   - queue request file: /data/traceops/queue/pending/<job_id>.json
3) engine worker picks pending job and runs engine CLI:
   go run ./cmd/traceops-engine --input <pcap_path> --output <report_path>
4) report.json updated, job file moved to /queue/done
5) UI polls GET /api/v1/jobs/<job_id>/report and displays results

## Key Files
- deploy/docker-compose.dev.yml
- backend/app/main.py (CORS enabled)
- backend/app/api/routes_jobs.py (job create + queue)
- engine/worker.sh (worker loop)
- engine/cmd/traceops-engine/main.go (engine output report)
- frontend/src/App.tsx (Jobs UI: create job, poll report, show findings/evidence)

## Report Schema (current)
report.json (v0.5.0-like):
- summary.title
- findings[] (finding_id, type, protocol, severity, confidence, message, evidence_refs)
- evidence[] (evidence_id, type, time_range?, details)

## Engine Output (current)
Engine outputs a dummy DNS finding + evidence (no real pcap parsing yet).

## Next Task
Implement real DNS parsing (Option B: pure Go using gopacket):
- parse PCAP
- build DNS txns
- compute timeout ratio, latency
- implement DNS_TIMEOUTS_HIGH signature (first)
- output findings+evidence based on real PCAP input

## Commands
Start:
cd ~/code/traceops
sudo docker compose -f deploy/docker-compose.dev.yml up -d --build
sudo docker compose -f deploy/docker-compose.dev.yml ps

Logs:
sudo docker compose -f deploy/docker-compose.dev.yml logs -f engine
sudo docker compose -f deploy/docker-compose.dev.yml logs -f backend
sudo docker compose -f deploy/docker-compose.dev.yml logs -f frontend

Stop:
sudo docker compose -f deploy/docker-compose.dev.yml down

API:
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/jobs -H "Content-Type: application/json" -d '{}'
curl http://localhost:8000/api/v1/jobs/<JOB_ID>/report
