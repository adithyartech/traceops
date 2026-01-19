package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"
)

type Report struct {
	ReportVersion string    `json:"report_version"`
	EngineVersion string    `json:"engine_version"`
	GeneratedAt   time.Time `json:"generated_at"`
	Summary       struct {
		Title string `json:"title"`
	} `json:"summary"`
	Findings []any `json:"findings"`
	Evidence []any `json:"evidence"`
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

	rep := Report{
		ReportVersion: "0.5.0",
		EngineVersion: "0.0.1",
		GeneratedAt:   time.Now().UTC(),
		Findings:      []any{},
		Evidence:      []any{},
	}
	rep.Summary.Title = "TraceOps Phase2 - Dummy Report"

	b, _ := json.MarshalIndent(rep, "", "  ")
	if err := os.WriteFile(output, b, 0644); err != nil {
		fmt.Println("write output failed:", err)
		os.Exit(1)
	}

	fmt.Println("ok: generated report at", output, "from input", input)
}
