# Signature Framework (v0.1)

## Goal
Signatures are modular detection units that:
- analyze extracted facts
- generate findings
- attach evidence references

## Signature principles
- deterministic
- explainable
- testable

## Signature fields
- signature_id (stable)
- title
- category
- severity
- confidence scoring rules
- evidence producer

## Evidence-first rule
Every signature finding MUST include:
- evidence_refs[]
and evidence objects must contain:
- details
- time_range
- flow_refs

## Testing strategy
- unit tests per signature
- golden tests using sample PCAPs:
  - input PCAP
  - expected finding IDs + counts
