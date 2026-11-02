/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/risk-context-interchange.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.shared = window.App.Data.shared || {};
window.App.Data.shared.riskContextInterchange = {
  "schema": "spt-risk-context/1.4",
  "_note": "Interchange format between the risk tool and the assessment tool. The risk tool EXPORTS this; the 3-3 instrument IMPORTS it to scope assessment per zone. v1.1 added the 62443-3-2 clause 4.5 detailed-risk outputs: a per-foundational-requirement SL-T vector (slTargetByFR), the threat/vulnerability/countermeasure register, and unmitigated-vs-tolerable risk. v1.2 adds provenance: the clause 4.2 high-level asset/system risk ranking (highLevelAssets) and the basis of assessment (basisOfAssessment: interviews/documents/observations). v1.3 adds the clause 4.6/4.7 per-threat risk disposition: threats[].disposition ('countermeasure' | 'sl-t' | 'accepted' | 'mitigated' | null, set only where exceedsTolerable — 'sl-t' means the risk is carried into the SL-T and capability is built through the 3-3 programme, so an empty countermeasure register is a legitimate position) and threats[].acceptance (free-text recorded risk acceptance). v1.4 adds the clause 4.7 residual-risk iteration: threats[].residualLikelihood / residualImpact / residualRisk (the risk remaining after countermeasures — null where untreated; 'mitigated' disposition means residualRisk reaches tolerable), countermeasures[].existing (true = a control already in place vs a planned remediation), and a top-level approval object (asset-owner sign-off of the tolerable risk and outcome, §4.3.6/§4). These are context only and never scope or score the 3-3 assessment. A scalar slTarget (the max across FRs) is retained so an importer that only understands per-zone SL-T still works. Both tools carry their own copy of this contract; bump the schema string in BOTH when the shape changes so drift fails loudly. Importers must ACCEPT the listed schemas and reject unknown ones.",
  "acceptedSchemas": ["spt-risk-context/1.0", "spt-risk-context/1.1", "spt-risk-context/1.2", "spt-risk-context/1.3", "spt-risk-context/1.4"],
  "example": {
    "schema": "spt-risk-context/1.4",
    "generatedBy": "spt-risk-tool/0.2",
    "generatedOn": "2026-07-02",
    "suc": {
      "name": "Example Water Treatment Works",
      "description": "Primary treatment and distribution control",
      "scopeStatement": "All ICS supporting treatment and distribution; excludes corporate IT."
    },
    "securityRequirements": {
      "tolerableRisk": "medium",
      "knownThreats": ["Capable criminal adversary assumed", "Insider misuse of engineering access"],
      "mandatorySecurityFunctions": ["Hard-wired ESD independent of the BPCS"],
      "regulatory": ["UK NIS Regulations 2018 (water)"]
    },
    "highLevelAssets": [
      { "id": "A1", "name": "SIS controller", "functionLocation": "Safety, field", "consequence": "severe", "likelihood": "medium", "risk": "very-high", "note": "→ Safety systems zone" },
      { "id": "A2", "name": "PLC cluster", "functionLocation": "Basic process control, equipment room", "consequence": "serious", "likelihood": "high", "risk": "high", "note": "→ Basic process control zone" }
    ],
    "basisOfAssessment": {
      "interviews": [
        { "id": "I1", "name": "J. Smith", "role": "Control systems engineer, Riverside Works", "date": "2026-06-30", "notes": "Network architecture, remote access arrangements" }
      ],
      "documents": [
        { "id": "D1", "title": "Network architecture diagram", "reference": "Rev C, 2025-11", "source": "Provided by system integrator", "relevance": "Confirmed DMZ and conduit list" }
      ],
      "observations": [
        { "id": "O1", "description": "Firewall rule base on the DMZ", "location": "Control room", "date": "2026-06-30", "notes": "Overly-permissive rule found" }
      ]
    },
    "assumptions": [
      "Client risk matrix used for consequence severity",
      "Threat context: capable criminal adversary assumed"
    ],
    "approval": {
      "name": "A. Patel",
      "role": "Plant Manager (asset owner)",
      "date": "2026-07-01",
      "statement": "Tolerable risk of Medium and the per-zone SL-T targets in this assessment approved; residual risks accepted as recorded.",
      "approved": true
    },
    "zones": [
      {
        "id": "Z1",
        "name": "Safety systems",
        "safetyRelated": true,
        "slSuggestedByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
        "slTargetByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
        "slTarget": 3,
        "worstUnmitigatedRisk": "very-high",
        "justification": "Contains SIS for chlorine dosing. Worst-case consequence severe (safety), likelihood medium -> very-high unmitigated risk. SL3 floor per house rule across all FRs; client risk criteria concur.",
        "assets": [
          { "name": "SIS controller", "type": "safety-plc" }
        ],
        "accessPoints": ["Hard-wired link to BPCS (C1)"],
        "externalDependencies": [],
        "securityPolicies": ["No engineering changes without MoC"],
        "threats": [
          {
            "id": "T1",
            "statement": "A malicious insider with SIS engineering access alters the safety logic, defeating the dosing interlock.",
            "source": "Malicious insider",
            "affectedFR": ["UC", "SI"],
            "likelihood": "medium",
            "impact": "severe",
            "unmitigatedRisk": "very-high",
            "residualLikelihood": "low",
            "residualImpact": "serious",
            "residualRisk": "medium",
            "exceedsTolerable": true,
            "disposition": "mitigated",
            "acceptance": ""
          }
        ],
        "vulnerabilities": [
          { "id": "V1", "description": "SIS engineering workstation shares a domain with BPCS." }
        ],
        "countermeasures": [
          { "id": "M1", "description": "Separate SIS engineering into its own zone; enforce MoC and 4-eyes on logic changes.", "addressesFR": ["UC", "SI"], "reference": "62443-3-3 SR 2.1, SR 3.4", "existing": false }
        ]
      },
      {
        "id": "Z2",
        "name": "Basic process control",
        "safetyRelated": false,
        "slSuggestedByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 1, "RDF": 3, "TRE": 2, "RA": 2 },
        "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 2, "DC": 1, "RDF": 3, "TRE": 2, "RA": 2 },
        "slTarget": 3,
        "worstUnmitigatedRisk": "high",
        "justification": "Vendor remote access raises IAC/RDF likelihood to high; consultant holds SI at SL2 pending the brokered-access rework (see conduit C2). Revisit at next review.",
        "assets": [
          { "name": "PLC cluster", "type": "plc" },
          { "name": "HMIs", "type": "hmi" }
        ],
        "accessPoints": ["Vendor VPN (C2)", "Historian replication (C3)"],
        "externalDependencies": ["Vendor support contract"],
        "securityPolicies": [],
        "threats": [
          {
            "id": "T2",
            "statement": "An external attacker reuses the standing vendor VPN to reach PLCs and manipulate control.",
            "source": "External attacker via vendor tunnel",
            "affectedFR": ["IAC", "RDF", "SI"],
            "likelihood": "high",
            "impact": "serious",
            "unmitigatedRisk": "high",
            "residualLikelihood": "medium",
            "residualImpact": "serious",
            "residualRisk": "high",
            "exceedsTolerable": true,
            "disposition": "countermeasure",
            "acceptance": ""
          }
        ],
        "vulnerabilities": [
          { "id": "V2", "description": "Always-on vendor VPN terminating inside the control zone." }
        ],
        "countermeasures": [
          { "id": "M3", "description": "DMZ firewall already segregating the control network from corporate IT.", "addressesFR": ["IAC"], "reference": "62443-3-3 SR 5.1", "existing": true },
          { "id": "M2", "description": "Broker vendor access via a jump host in the DMZ; remove the standing tunnel.", "addressesFR": ["IAC", "RDF"], "reference": "62443-3-3 SR 1.13, SR 5.1", "existing": false }
        ]
      }
    ],
    "conduits": [
      {
        "id": "C1",
        "fromZone": "Z1",
        "toZone": "Z2",
        "name": "SIS to BPCS",
        "channels": ["hardwired", "modbus-tcp"],
        "slTargetByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
        "slTarget": 3,
        "justification": "Carries safety-relevant signals; boundary enforced both directions."
      },
      {
        "id": "C2",
        "fromZone": "Z2",
        "toZone": "EXT",
        "name": "Vendor remote access",
        "channels": ["vpn"],
        "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 2, "DC": 2, "RDF": 3, "TRE": 2, "RA": 2 },
        "slTarget": 3,
        "justification": "To be brokered via jump host; standing tunnel to be removed."
      }
    ]
  },
  "importContract": {
    "consumedByAssessment": "zones[].{id,name,slTarget,slTargetByFR,justification,safetyRelated} and conduits[].{id,fromZone,toZone,slTarget,slTargetByFR}",
    "behaviour": "On import, the 3-3 assessment offers per-zone assessment scoping with each zone's SL-T pre-set from slTarget (a scalar) or, where the importer supports it, per-foundational-requirement from slTargetByFR (overridable, as now). Zone justifications display read-only as target provenance. The threats/vulnerabilities/countermeasures register (including per-threat residual risk and disposition, and the existing-vs-planned countermeasure flag), highLevelAssets, basisOfAssessment, and approval are provenance/context only and never scope or auto-score the 3-3 assessment. Absence of an import file leaves current behaviour unchanged (flat default, hand-set targets).",
    "frKeys": ["IAC", "UC", "SI", "DC", "RDF", "TRE", "RA"],
    "provenanceOnly": ["highLevelAssets", "basisOfAssessment", "approval", "zones[].threats", "zones[].vulnerabilities", "zones[].countermeasures"]
  }
};
