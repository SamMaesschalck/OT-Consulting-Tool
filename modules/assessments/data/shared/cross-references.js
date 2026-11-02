/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/cross-references.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.shared = window.App.Data.shared || {};
window.App.Data.shared.crossReferences = {
  "schema": "cross-references/1.0",
  "_note": "Cross-references between regulatory instruments (CAF, NIS2) and IEC 62443 (3-3 SRs and 2-1:2024 SPRs). PRIMARY USE: remediation guidance - a CAF/NIS2 gap links to the 62443 requirements that show how to engineer the fix. SECONDARY USE: evidence reuse in the reverse direction. Each row is stored ONCE and read both ways. relationship is always 'remediation-guidance'. strength: direct (62443 req directly specifies how to meet the outcome) | partial (contributes) | contextual (related background). confidence is the DRAFT author's confidence the mapping is correct - VERIFY before client use; low-confidence links were omitted rather than guessed. MAPPINGS ARE LOSSY AND NEVER AUTO-SCORE: they guide and pre-fill, the consultant always judges. Technical outcomes map to 3-3 SRs; governance/programme outcomes map to 2-1:2024 SPRs; some map to both. [NIS2 fromIds rebound to the real instrument codes (GOV/A-J/REP) on verification.]",
  "strengthScale": {
    "direct": "The 62443 requirement directly specifies how to meet this outcome.",
    "partial": "The 62443 requirement contributes to but does not fully address the outcome.",
    "contextual": "Related background; informs understanding rather than providing the fix."
  },
  "rows": [
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A1.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Board direction <-> ISMS governance"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A1.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Roles & responsibilities"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A1.c",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1",
        "ORG 1.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Decision-making/accountability"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A2.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Risk management process; also see 62443-3-2 for SL-T derivation"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A2.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Understanding threat"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A2.c",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "SolutionsPT consultant draft (verify)",
      "note": "Assurance <-> SP review"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A3.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "CM 1.1",
        "CM 1.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Asset management & inventory"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A3.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "System component inventory"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A4.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.6"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Supply chain"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "A4.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Secure dev/support; see also 62443-4-1"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B1.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified & cleaned vs CAF 4.0",
      "note": "Policy development"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B1.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Policy implementation"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B2.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.1",
        "SR 1.2",
        "SR 2.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Identity verification, auth, authorisation"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B2.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.2",
        "SR 2.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Device management"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B2.c",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.1",
        "SR 2.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Privileged user management / least privilege"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B2.d",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.3",
        "SR 1.4",
        "SR 1.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "IdAM lifecycle"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B3.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 4.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Understanding data"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B3.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 3.1",
        "SR 4.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Data in transit"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B3.c",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 4.1",
        "SR 3.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Stored data"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B3.d",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 4.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Mobile data"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B3.e",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 4.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Media/equipment sanitisation"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B4.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 5.1",
        "SR 5.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Secure by design / segmentation; see 62443-3-2"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B4.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.6",
        "SR 7.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Secure configuration / least functionality"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B4.c",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.13",
        "SR 2.6"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Secure management / remote access"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B4.d",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 3.2",
        "SR 2.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Vulnerability management; see also 2-1 COMP 3.x"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B4.d",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "COMP 3.2",
        "COMP 3.5",
        "EVENT 1.9"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Patch & vulnerability handling"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B5.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.1",
        "SR 7.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Resilience preparation"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B5.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 5.2",
        "SR 7.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Design for resilience / island mode"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B5.c",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.3",
        "SR 7.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Backups & recovery"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B5.c",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "AVAIL 2.1",
        "AVAIL 2.3",
        "AVAIL 2.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Backup, verify, restore"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B6.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Security culture"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "B6.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.4",
        "ORG 1.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Training"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.a",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 6.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Monitoring coverage"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 2.8",
        "SR 3.9",
        "SR 6.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Securing logs"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.c",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 6.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Generating alerts"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.d",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Triage / event analysis"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.e",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "contextual",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Monitoring skills"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C1.f",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 6.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "FLAG: verify C1.f exists in CAF 4.0 instrument",
      "note": "Behaviour/threat intel"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "C2.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "contextual",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Threat hunting (nascent in OT)"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D1.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Response plan"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D1.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8",
        "AVAIL 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Response & recovery capability"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D1.b",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "high",
      "source": "verified vs CAF 4.0",
      "note": "Recovery/reconstitution"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D1.c",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Testing & exercising"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D2.a",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.7",
        "EVENT 1.9"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Root cause analysis"
    },
    {
      "fromStandard": "ncsc-caf",
      "fromId": "D2.b",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs CAF 4.0",
      "note": "Lessons learned -> improvement"
    },
    {
      "fromStandard": "nis2",
      "fromId": "GOV.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Management approval of measures"
    },
    {
      "fromStandard": "nis2",
      "fromId": "GOV.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1",
        "ORG 2.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Oversight of implementation"
    },
    {
      "fromStandard": "nis2",
      "fromId": "GOV.3",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "contextual",
      "confidence": "high",
      "source": "verified & adjusted vs NIS2 directive; codes rebound to instrument",
      "note": "Management accountability"
    },
    {
      "fromStandard": "nis2",
      "fromId": "GOV.4",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Management training"
    },
    {
      "fromStandard": "nis2",
      "fromId": "GOV.5",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Staff training"
    },
    {
      "fromStandard": "nis2",
      "fromId": "A.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Risk analysis; see 62443-3-2"
    },
    {
      "fromStandard": "nis2",
      "fromId": "A.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Information system security policy"
    },
    {
      "fromStandard": "nis2",
      "fromId": "B.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Incident handling capability"
    },
    {
      "fromStandard": "nis2",
      "fromId": "B.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 6.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Audit log access supports handling"
    },
    {
      "fromStandard": "nis2",
      "fromId": "B.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.4",
        "EVENT 1.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "high",
      "source": "verified & adjusted vs NIS2 directive; codes rebound to instrument",
      "note": "Incident logging & lessons"
    },
    {
      "fromStandard": "nis2",
      "fromId": "C.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "AVAIL 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Continuity management"
    },
    {
      "fromStandard": "nis2",
      "fromId": "C.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "AVAIL 2.1",
        "AVAIL 2.5"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Disaster recovery / backups"
    },
    {
      "fromStandard": "nis2",
      "fromId": "C.2",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.3",
        "SR 7.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Backup & recovery (technical)"
    },
    {
      "fromStandard": "nis2",
      "fromId": "C.3",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8",
        "AVAIL 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Crisis management"
    },
    {
      "fromStandard": "nis2",
      "fromId": "D.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.6"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Supplier risk management"
    },
    {
      "fromStandard": "nis2",
      "fromId": "E.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.3",
        "COMP 3.2"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Secure acquisition & development; see 62443-4-1"
    },
    {
      "fromStandard": "nis2",
      "fromId": "E.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 3.4",
        "SR 7.6"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Software integrity / config"
    },
    {
      "fromStandard": "nis2",
      "fromId": "F.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 2.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Effectiveness assessment / SP review"
    },
    {
      "fromStandard": "nis2",
      "fromId": "F.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 3.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Security functionality verification"
    },
    {
      "fromStandard": "nis2",
      "fromId": "G.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.6",
        "SR 7.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "SolutionsPT consultant draft (verify); codes rebound to instrument",
      "note": "Cyber hygiene <-> config/least functionality"
    },
    {
      "fromStandard": "nis2",
      "fromId": "G.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.4"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Cybersecurity training"
    },
    {
      "fromStandard": "nis2",
      "fromId": "H.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 4.1",
        "SR 4.3",
        "SR 3.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Cryptography & encryption"
    },
    {
      "fromStandard": "nis2",
      "fromId": "H.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "DATA 1.5",
        "DATA 1.6"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Crypto & key management"
    },
    {
      "fromStandard": "nis2",
      "fromId": "I.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "ORG 1.2",
        "ORG 1.3"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified & adjusted vs NIS2 directive; codes rebound to instrument",
      "note": "HR security / identity"
    },
    {
      "fromStandard": "nis2",
      "fromId": "I.2",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.1",
        "SR 2.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Access control"
    },
    {
      "fromStandard": "nis2",
      "fromId": "I.3",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 7.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Asset management"
    },
    {
      "fromStandard": "nis2",
      "fromId": "I.3",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "CM 1.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Asset inventory"
    },
    {
      "fromStandard": "nis2",
      "fromId": "J.1",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 1.7",
        "SR 1.9"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "MFA / strong authentication"
    },
    {
      "fromStandard": "nis2",
      "fromId": "J.2",
      "toStandard": "iec-62443-3-3",
      "toIds": [
        "SR 3.1",
        "SR 4.1"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified & adjusted vs NIS2 directive; codes rebound to instrument",
      "note": "Secure comms & segmentation"
    },
    {
      "fromStandard": "nis2",
      "fromId": "REP.1",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.1",
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "high",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "Significant incident identification"
    },
    {
      "fromStandard": "nis2",
      "fromId": "REP.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.2",
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "24h early warning: largely procedural, limited 62443 coverage"
    },
    {
      "fromStandard": "nis2",
      "fromId": "REP.3",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.2",
        "EVENT 1.8"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "72h notification: largely procedural"
    },
    {
      "fromStandard": "nis2",
      "fromId": "REP.4",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.8",
        "EVENT 1.7"
      ],
      "relationship": "remediation-guidance",
      "strength": "partial",
      "confidence": "med",
      "source": "verified vs NIS2 directive; codes rebound to instrument",
      "note": "1-month final report: procedural + root cause"
    },
    {
      "fromStandard": "nis2",
      "fromId": "E.2",
      "toStandard": "iec-62443-2-1-2024",
      "toIds": [
        "EVENT 1.9"
      ],
      "relationship": "remediation-guidance",
      "strength": "direct",
      "confidence": "high",
      "source": "verified against Art 21(2)(e); codes rebound to instrument",
      "note": "(e) explicitly includes vulnerability handling and disclosure -> EVENT 1.9",
      "_rebind": "ME.1(vuln-handling addition) -> E 2"
    },
        {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "A1",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle A1 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "A2",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle A2 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "A4",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle A4 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "B1",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle B1 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "B3",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024",
        "iec-62443-3-3"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle B3 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "B4",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024",
        "iec-62443-3-3"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle B4 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "B6",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle B6 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "C1",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle C1 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    },
    {
      "fromStandard": "ncsc-caf-aviation",
      "fromId": "C2",
      "toStandard": "multi",
      "toIds": [
        "iec-62443-2-1-2024"
      ],
      "relationship": "informative-reference",
      "strength": "contextual",
      "confidence": "high",
      "source": "CAA CAP1850 Annex B (regulator-published informative references)",
      "note": "CAF for Aviation principle C2 cites these 62443 parts as informative references in Annex B. Principle-level (not outcome-level); regulator-sourced, not consultant draft."
    }
  ]
};
