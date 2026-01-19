from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import uuid
import os
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])

DATA_DIR = Path(os.environ.get("TRACEOPS_DATA_DIR", "/data/traceops"))
ARTIFACTS_DIR = DATA_DIR / "artifacts"
REPORTS_DIR = ARTIFACTS_DIR / "reports"

QUEUE_DIR = DATA_DIR / "queue"
QUEUE_PENDING = QUEUE_DIR / "pending"
QUEUE_DONE = QUEUE_DIR / "done"
QUEUE_FAILED = QUEUE_DIR / "failed"


class CreateJobRequest(BaseModel):
    pcap_path: str | None = None


class CreateJobResponse(BaseModel):
    job_id: str
    status: str
    report_path: str


def ensure_dirs() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    QUEUE_PENDING.mkdir(parents=True, exist_ok=True)
    QUEUE_DONE.mkdir(parents=True, exist_ok=True)
    QUEUE_FAILED.mkdir(parents=True, exist_ok=True)


def write_placeholder_report(report_path: Path) -> None:
    placeholder = {
        "report_version": "0.5.0",
        "engine_version": "0.0.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"title": "PENDING: queued for engine processing"},
        "findings": [],
        "evidence": []
    }
    report_path.write_text(json.dumps(placeholder, indent=2))


@router.post("", response_model=CreateJobResponse)
def create_job(req: CreateJobRequest):
    ensure_dirs()

    job_id = str(uuid.uuid4())
    report_dir = REPORTS_DIR / job_id
    report_dir.mkdir(parents=True, exist_ok=True)

    report_path = report_dir / "report.json"
    pcap_path = req.pcap_path or "dummy.pcap"

    write_placeholder_report(report_path)

    job_req = {
        "job_id": job_id,
        "pcap_path": pcap_path,
        "report_path": str(report_path),
    }

    pending_file = QUEUE_PENDING / f"{job_id}.json"
    pending_file.write_text(json.dumps(job_req, indent=2))

    return CreateJobResponse(
        job_id=job_id,
        status="QUEUED",
        report_path=str(report_path),
    )


@router.get("/{job_id}/report")
def get_report(job_id: str):
    report_path = REPORTS_DIR / job_id / "report.json"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="report not found")

    try:
        return json.loads(report_path.read_text())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"report JSON invalid: {e}")
