import { useState } from "react";
import "./App.css";

type JobCreateResponse = {
  job_id: string;
  status: string;
  report_path: string;
};

type ReportJson = {
  report_version: string;
  engine_version: string;
  generated_at?: string;
  summary?: { title?: string };
  findings?: any[];
  evidence?: any[];
};

const API_BASE = "http://localhost:8000";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobCreateResponse | null>(null);
  const [report, setReport] = useState<ReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createJob() {
    setLoading(true);
    setError(null);
    setReport(null);

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

      // poll report until engine overwrites placeholder
      await pollReport(data.job_id);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function pollReport(jobId: string) {
    // Try for ~10 seconds
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const r = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/report`);
      if (r.ok) {
        const rep: ReportJson = await r.json();
        setReport(rep);

        // if engine has processed, title becomes dummy report title
        const title = rep?.summary?.title || "";
        if (!title.startsWith("PENDING")) return;
      }
      await new Promise((x) => setTimeout(x, 500));
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>TraceOps</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Phase 2 • Jobs → Engine Worker → Report Viewer
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Report Version</div>
                <div style={{ fontWeight: 600 }}>{report.report_version}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Engine Version</div>
                <div style={{ fontWeight: 600 }}>{report.engine_version}</div>
              </div>
            </div>

            <h3 style={{ marginTop: 0 }}>Raw JSON</h3>
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
