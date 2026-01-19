import { useState } from "react";
import "./App.css";

type JobCreateResponse = {
  job_id: string;
  status: string;
  report_path: string;
};

type Finding = {
  finding_id: string;
  type: string;
  protocol: string;
  severity: "INFO" | "WARN" | "HIGH" | "CRITICAL" | string;
  confidence: number;
  message: string;
  evidence_refs: string[];
};

type Evidence = {
  evidence_id: string;
  type: string;
  time_range?: { start?: string; end?: string };
  details: Record<string, any>;
};

type ReportJson = {
  report_version: string;
  engine_version: string;
  generated_at?: string;
  summary?: { title?: string };
  findings?: Finding[];
  evidence?: Evidence[];
};

const API_BASE = "http://localhost:8000";

function severityBadge(sev: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    INFO: { bg: "#e8f1ff", fg: "#003b8a" },
    WARN: { bg: "#fff6db", fg: "#7a5200" },
    HIGH: { bg: "#ffe1e1", fg: "#8a0000" },
    CRITICAL: { bg: "#ffcbcb", fg: "#4b0000" },
  };
  const c = map[sev] || { bg: "#f3f3f3", fg: "#333" };
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {sev}
    </span>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobCreateResponse | null>(null);
  const [report, setReport] = useState<ReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  async function createJob() {
    setLoading(true);
    setError(null);
    setReport(null);
    setSelectedFinding(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      const data: JobCreateResponse = await res.json();
      setJob(data);

      await pollReport(data.job_id);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function pollReport(jobId: string) {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      const r = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/report`);
      if (r.ok) {
        const rep: ReportJson = await r.json();
        setReport(rep);

        const title = rep?.summary?.title || "";
        if (!title.startsWith("PENDING")) return;
      }
      await new Promise((x) => setTimeout(x, 500));
    }
  }

  function findEvidenceById(evidenceId: string): Evidence | undefined {
    return report?.evidence?.find((e) => e.evidence_id === evidenceId);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>TraceOps</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Phase 2 • Jobs → Engine Worker → Findings + Evidence Viewer
          </p>
        </div>

        <button
          onClick={createJob}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Creating Job..." : "Create Job"}
        </button>
      </header>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: "#ffecec", border: "1px solid #ffb5b5", borderRadius: 12 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>Job</h2>
        {!job ? (
          <p style={{ opacity: 0.7 }}>No job created yet.</p>
        ) : (
          <div style={{ padding: 14, borderRadius: 12, border: "1px solid #eee" }}>
            <div><b>Job ID:</b> {job.job_id}</div>
            <div><b>Status:</b> {job.status}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Artifact: {job.report_path}
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Report</h2>

        {!report ? (
          <p style={{ opacity: 0.7 }}>No report loaded yet.</p>
        ) : (
          <div style={{ padding: 14, borderRadius: 12, border: "1px solid #eee" }}>
            <div style={{ marginBottom: 10 }}>
              <b>Title:</b> {report?.summary?.title || "(no title)"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Report Version</div>
                <div style={{ fontWeight: 700 }}>{report.report_version}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Engine Version</div>
                <div style={{ fontWeight: 700 }}>{report.engine_version}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Findings</div>
                <div style={{ fontWeight: 700 }}>{report.findings?.length || 0}</div>
              </div>
            </div>

            {/* Findings */}
            <h3>Findings</h3>
            {(!report.findings || report.findings.length === 0) ? (
              <p style={{ opacity: 0.7 }}>No findings.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                      <th style={{ padding: 10 }}>Severity</th>
                      <th style={{ padding: 10 }}>Type</th>
                      <th style={{ padding: 10 }}>Protocol</th>
                      <th style={{ padding: 10 }}>Confidence</th>
                      <th style={{ padding: 10 }}>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.findings.map((f) => (
                      <tr
                        key={f.finding_id}
                        style={{ borderBottom: "1px solid #f4f4f4", cursor: "pointer" }}
                        onClick={() => setSelectedFinding(f)}
                      >
                        <td style={{ padding: 10 }}>{severityBadge(f.severity)}</td>
                        <td style={{ padding: 10, fontWeight: 700 }}>{f.type}</td>
                        <td style={{ padding: 10 }}>{f.protocol}</td>
                        <td style={{ padding: 10 }}>{f.confidence}%</td>
                        <td style={{ padding: 10 }}>{f.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Finding details */}
            {selectedFinding && (
              <div style={{ marginTop: 18, padding: 14, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <h3 style={{ marginTop: 0 }}>Finding Details</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {severityBadge(selectedFinding.severity)}
                  <div style={{ fontWeight: 800 }}>{selectedFinding.type}</div>
                  <div style={{ opacity: 0.7 }}>({selectedFinding.protocol})</div>
                </div>

                <p style={{ marginTop: 10 }}>{selectedFinding.message}</p>

                <h4>Evidence</h4>
                {selectedFinding.evidence_refs.length === 0 ? (
                  <p style={{ opacity: 0.7 }}>No evidence references.</p>
                ) : (
                  selectedFinding.evidence_refs.map((evid) => {
                    const ev = findEvidenceById(evid);
                    if (!ev) {
                      return (
                        <div key={evid} style={{ padding: 10, borderRadius: 10, border: "1px solid #ffe1e1", marginBottom: 10 }}>
                          Evidence missing: <b>{evid}</b>
                        </div>
                      );
                    }
                    return (
                      <div key={evid} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", marginBottom: 10 }}>
                        <div style={{ fontWeight: 800 }}>{ev.type}</div>
                        {ev.time_range && (
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                            {ev.time_range.start} → {ev.time_range.end}
                          </div>
                        )}

                        <pre
                          style={{
                            marginTop: 10,
                            background: "#0b1020",
                            color: "#e6e6e6",
                            padding: 12,
                            borderRadius: 12,
                            overflowX: "auto",
                            fontSize: 13,
                            lineHeight: 1.4,
                          }}
                        >
                          {JSON.stringify(ev.details, null, 2)}
                        </pre>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Raw JSON */}
            <h3 style={{ marginTop: 22 }}>Raw JSON</h3>
            <pre
              style={{
                background: "#0b1020",
                color: "#e6e6e6",
                padding: 14,
                borderRadius: 12,
                overflowX: "auto",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <footer style={{ marginTop: 40, opacity: 0.6, fontSize: 12 }}>
        TraceOps • Evidence-driven RCA platform (Phase 2 MVP)
      </footer>
    </div>
  );
}
