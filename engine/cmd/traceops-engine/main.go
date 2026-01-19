package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"
)

type Evidence struct {
	EvidenceID string                 `json:"evidence_id"`
	Type       string                 `json:"type"`
	TimeRange  map[string]string      `json:"time_range,omitempty"`
	Details    map[string]interface{} `json:"details"`
}

type Finding struct {
	FindingID    string   `json:"finding_id"`
	Type         string   `json:"type"`
	Protocol     string   `json:"protocol"`
	Severity     string   `json:"severity"`   // INFO/WARN/HIGH/CRITICAL
	Confidence   int      `json:"confidence"` // 0-100
	Message      string   `json:"message"`
	EvidenceRefs []string `json:"evidence_refs"`
}

type Report struct {
	ReportVersion string    `json:"report_version"`
	EngineVersion string    `json:"engine_version"`
	GeneratedAt   time.Time `json:"generated_at"`

	Summary struct {
		Title string `json:"title"`
	} `json:"summary"`

	Findings []Finding  `json:"findings"`
	Evidence []Evidence `json:"evidence"`
}

func main() {
	var input string
	var output string

	flag.StringVar(&input, "input", "", "path to pcap")
	flag.StringVar(&output, "output", "", "path to report.json")
	flag.Parse()

	if output == "" {
		fmt.Println("missing --output")
		os.Exit(1)
	}

	// --- Dummy DNS finding + evidence (Phase 2 schema scaffold) ---
	ev1 := Evidence{
		EvidenceID: "ev-dns-001",
		Type:       "dns_timeout_samples",
		TimeRange: map[string]string{
			"start": time.Now().Add(-2 * time.Minute).UTC().Format(time.RFC3339Nano),
			"end":   time.Now().UTC().Format(time.RFC3339Nano),
		},
		Details: map[string]interface{}{
			"resolver_ip":    "10.10.10.53",
			"timeout_count":  48,
			"timeout_ratio":  0.16,
			"sample_queries": []string{"api.company.com A", "login.microsoftonline.com AAAA"},
		},
	}

	f1 := Finding{
		FindingID:    "fd-dns-001",
		Type:         "DNS_TIMEOUTS_HIGH",
		Protocol:     "DNS",
		Severity:     "HIGH",
		Confidence:   75,
		Message:      "High DNS query timeout rate detected for resolver 10.10.10.53",
		EvidenceRefs: []string{ev1.EvidenceID},
	}

	rep := Report{
		ReportVersion: "0.5.0",
		EngineVersion: "0.0.2",
		GeneratedAt:   time.Now().UTC(),
		Findings:      []Finding{f1},
		Evidence:      []Evidence{ev1},
	}
	rep.Summary.Title = "TraceOps Phase2 - Findings Report"

	b, _ := json.MarshalIndent(rep, "", "  ")
	if err := os.WriteFile(output, b, 0644); err != nil {
		fmt.Println("write output failed:", err)
		os.Exit(1)
	}

	fmt.Println("ok: generated report at", output, "from input", input)
}
