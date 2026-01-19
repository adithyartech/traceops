#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${TRACEOPS_DATA_DIR:-/data/traceops}"
PENDING_DIR="${DATA_DIR}/queue/pending"
DONE_DIR="${DATA_DIR}/queue/done"
FAILED_DIR="${DATA_DIR}/queue/failed"

mkdir -p "$PENDING_DIR" "$DONE_DIR" "$FAILED_DIR"

echo "[worker] starting engine worker"
echo "[worker] pending=$PENDING_DIR"

while true; do
  jobfile="$(ls -1 "$PENDING_DIR"/*.json 2>/dev/null | head -n 1 || true)"

  if [[ -z "${jobfile}" ]]; then
    sleep 1
    continue
  fi

  echo "[worker] picked: $jobfile"

  job_id="$(jq -r '.job_id' "$jobfile")"
  pcap_path="$(jq -r '.pcap_path' "$jobfile")"
  report_path="$(jq -r '.report_path' "$jobfile")"

  echo "[worker] job_id=$job_id"
  echo "[worker] report_path=$report_path"

  # Run engine
  if go run ./cmd/traceops-engine --input "$pcap_path" --output "$report_path"; then
    mv "$jobfile" "${DONE_DIR}/${job_id}.json"
    echo "[worker] DONE: $job_id"
  else
    mv "$jobfile" "${FAILED_DIR}/${job_id}.json"
    echo "[worker] FAILED: $job_id"
  fi
done
