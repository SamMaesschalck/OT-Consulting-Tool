/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* Fixture: the risk-context file the current risk tool exports for its demo
 * project (modules/risk-assessment, index.html?tour=1), as Export risk context
 * writes it, with the provenance added in phase 6 of
 * docs/risk-tool-redesign.md on the same spt-risk-context/1.4 string.
 * modules/risk-assessment/scripts/test-risk-interchange.html fails when the
 * export and this copy part (generatedOn and generatedBy aside); regenerate
 * it only when the demo or the export changes on purpose. Used by
 * scripts/test-risk-context-phase6.html. */
window.RiskContextFixtures = window.RiskContextFixtures || {};
window.RiskContextFixtures["demo"] =
{
  "schema": "spt-risk-context/1.4",
  "generatedBy": "spt-risk-tool/0.7.0",
  "generatedOn": "2026-11-14",
  "suc": {
    "name": "Acme Petrochemicals - Unit 300 Alkylation Control System",
    "description": "The basic process control system, safety instrumented system and supporting OT infrastructure for the Unit 300 alkylation unit at the Teesport refinery: redundant SCADA/DCS servers and operator HMIs in the central control room, unit PLCs and remote I/O in the field auxiliary rooms, the SIS performing the unit's safety instrumented functions, engineering workstations, and the plant DMZ carrying the historian and vendor access paths.",
    "scopeStatement": "In scope: all Unit 300 control, safety and engineering systems from the field controllers up to (and including) the plant DMZ, plus the conduits that cross the boundary (historian replication, vendor remote access, corporate reporting). Out of scope: the corporate IT network beyond the DMZ firewall, other process units, and the terminal loading systems (separately assessed)."
  },
  "securityRequirements": {
    "tolerableRisk": "medium",
    "knownThreats": [
      "Capable criminal/ransomware adversary reaching OT via corporate IT or vendor access",
      "State-capable adversary interest in refining sector (assumed class 3 for this SUC)",
      "Insider misuse of engineering access (contractor churn on turnarounds)",
      "Commodity malware ingress via removable media and engineering laptops"
    ],
    "mandatorySecurityFunctions": [
      "SIS must remain capable of safe shutdown independent of BPCS state",
      "Operator view and manual command must survive loss of the DMZ and corporate links",
      "All remote access must be individually attributed and time-bounded"
    ],
    "regulatory": [
      "COMAH upper tier (major accident hazard) - HSE",
      "NIS Regulations as designated OES for fuel supply"
    ]
  },
  "highLevelAssets": [
    {
      "id": "A1",
      "name": "Unit 300 BPCS (DCS servers, HMIs, unit PLCs)",
      "functionLocation": "Closed-loop control and operator interface - control room / field aux rooms",
      "consequence": "serious",
      "likelihood": "medium",
      "risk": "high",
      "note": "Primary control layer; loss forces manual shutdown, manipulation is the acid-release path. Assigned to Z1, where a detailed assessment is required."
    },
    {
      "id": "A2",
      "name": "Safety Instrumented System (SIS)",
      "functionLocation": "Emergency depressurisation and acid isolation - field aux room 2",
      "consequence": "severe",
      "likelihood": "low",
      "risk": "high",
      "note": "Last line of defence; any compromise is intolerable regardless of likelihood. Assigned to Z2, where a detailed assessment is required."
    },
    {
      "id": "A3",
      "name": "Plant DMZ & process historian",
      "functionLocation": "Data brokerage between OT and corporate - server room",
      "consequence": "serious",
      "likelihood": "medium",
      "risk": "high",
      "note": "Every external path transits here; a foothold pivots into the BPCS. Assigned to Z3, where a detailed assessment is required."
    },
    {
      "id": "A4",
      "name": "Engineering workstations & config management",
      "functionLocation": "DCS/PLC/SIS configuration - control building office",
      "consequence": "serious",
      "likelihood": "medium",
      "risk": "high",
      "note": "Holds the keys to every controller; removable media and legacy tooling in routine use. Assigned to Z4, where a detailed assessment is required."
    },
    {
      "id": "A5",
      "name": "Laboratory information system link",
      "functionLocation": "Sample results feed to the historian - lab",
      "consequence": "serious",
      "likelihood": "low",
      "risk": "medium",
      "note": "One-way feed, no control path; ranked medium, monitored at high level only."
    },
    {
      "id": "A6",
      "name": "CCTV & physical security systems",
      "functionLocation": "Site perimeter and unit cameras - site-wide",
      "consequence": "negligible",
      "likelihood": "high",
      "risk": "low",
      "note": "Commodity IP kit, frequently probed, but no process consequence; ranked low, so not taken to a detailed assessment."
    }
  ],
  "basisOfAssessment": {
    "interviews": [
      {
        "id": "I1",
        "name": "R. Calder",
        "role": "Asset Owner - Unit 300",
        "date": "2026-07-01",
        "notes": "Tolerable risk, worst case, business context"
      },
      {
        "id": "I2",
        "name": "J. Whitmore",
        "role": "Lead Control Systems Engineer",
        "date": "2026-07-01",
        "notes": "Architecture, engineering practice, vendor access"
      },
      {
        "id": "I3",
        "name": "S. Adeyemi",
        "role": "Process Safety Engineer",
        "date": "2026-07-02",
        "notes": "SIS functions, safety requirement spec, LOPA linkage"
      },
      {
        "id": "I4",
        "name": "M. Kowalski",
        "role": "OT/IT Network Engineer",
        "date": "2026-07-02",
        "notes": "DMZ design, firewall rules, historian replication"
      }
    ],
    "documents": [
      {
        "id": "D1",
        "title": "Unit 300 P&IDs and cause & effect matrix",
        "reference": "U300-CE-014 r7",
        "source": "Process safety files",
        "relevance": "SIS functions and safety-relevant control loops"
      },
      {
        "id": "D2",
        "title": "OT network diagram - Teesport",
        "reference": "NET-OT-002 r4",
        "source": "OT engineering",
        "relevance": "Zone and conduit partitioning baseline"
      },
      {
        "id": "D3",
        "title": "Vendor remote access procedure",
        "reference": "OPS-PROC-118",
        "source": "Operations",
        "relevance": "Remote access threat scenarios and existing countermeasures"
      },
      {
        "id": "D4",
        "title": "COMAH safety report extract - Unit 300",
        "reference": "COMAH-U300-2025",
        "source": "HSE submission",
        "relevance": "Worst-case consequence calibration"
      }
    ],
    "observations": [
      {
        "id": "O1",
        "description": "Control room and field auxiliary room walkdown",
        "location": "Unit 300",
        "date": "2026-07-01",
        "notes": "Badge control verified; unlocked engineering cabinet noted and raised"
      },
      {
        "id": "O2",
        "description": "DMZ firewall rule review at the console",
        "location": "Server room",
        "date": "2026-07-02",
        "notes": "Rules match diagram; two stale vendor rules removed during review"
      },
      {
        "id": "O3",
        "description": "Vendor remote access session demonstration",
        "location": "Control building",
        "date": "2026-07-02",
        "notes": "Session activation, attribution and recording observed end-to-end"
      }
    ]
  },
  "assumptions": [
    "Physical access to the control room and field auxiliary rooms is badge-controlled and logged",
    "The corporate network is assumed compromised for the purposes of this assessment (untrusted)",
    "Unit 300 operates continuously; a control-system outage forces a manual unit shutdown within 30 minutes",
    "Vendor support for the DCS is contractually required and uses the remote access path assessed here"
  ],
  "approval": {
    "name": "R. Calder",
    "role": "Asset Owner - Unit 300",
    "date": "2026-07-04",
    "statement": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the one recorded risk acceptance (legacy configuration tooling), and the per-FR SL-T vectors as the target for the security programme.",
    "approved": true
  },
  "approvals": [
    {
      "name": "R. Calder",
      "role": "Asset Owner - Unit 300",
      "organisation": "Acme Petrochemicals Ltd",
      "date": "2026-07-04",
      "scope": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the one recorded risk acceptance (legacy configuration tooling), and the per-FR SL-T vectors as the target for the security programme."
    },
    {
      "name": "S. Adeyemi",
      "role": "Process Safety Engineer",
      "organisation": "Acme Petrochemicals Ltd",
      "date": "2026-07-04",
      "scope": "The SL-T of the Safety Instrumented System zone (Z2)."
    }
  ],
  "zones": [
    {
      "id": "Z1",
      "name": "Unit 300 BPCS",
      "safetyRelated": false,
      "fromHighLevelAsset": "A1",
      "slSuggestedByFR": {
        "IAC": 3,
        "UC": null,
        "SI": 3,
        "DC": null,
        "RDF": 3,
        "TRE": null,
        "RA": 2
      },
      "slTargetByFR": {
        "IAC": 3,
        "UC": 2,
        "SI": 3,
        "DC": 1,
        "RDF": 3,
        "TRE": 2,
        "RA": 2
      },
      "slTarget": 3,
      "worstUnmitigatedRisk": "high",
      "justification": "The worst unmitigated risks in this zone are High (an attacker riding the vendor remote access path, and malware brought in over an engineering connection) against a Medium tolerable risk, and the standing remote access materially raises likelihood on IAC/UC/RDF, so IAC, SI and RDF are set to SL3. UC is held at SL2 because use control inside the control room is procedurally constrained and no High risk hits it directly. DC reflects the low confidentiality consequence of process data (SL1). TRE and RA at SL2 support forensics and the 30-minute manual-shutdown resilience requirement.",
      "assets": [
        {
          "id": "AS1",
          "name": "DCS server pair (redundant)",
          "type": "server"
        },
        {
          "id": "AS2",
          "name": "Operator HMIs x4",
          "type": "hmi"
        },
        {
          "id": "AS3",
          "name": "Unit PLCs x6 (reactor, acid feed, depropaniser)",
          "type": "plc"
        }
      ],
      "accessPoints": [
        "Vendor VPN via jump host (C2)",
        "Historian replication to DMZ (C1)"
      ],
      "externalDependencies": [
        "DCS vendor support contract (remote diagnostics)",
        "Time sync from DMZ NTP"
      ],
      "securityPolicies": [
        "No engineering changes without MoC approval",
        "Vendor sessions activated per ticket, time-bounded"
      ],
      "threats": [
        {
          "id": "T1",
          "statement": "An external attacker hijacks or rides the vendor remote access path to reach the DCS servers and issue control changes.",
          "source": "External attacker via vendor access",
          "affectedFR": [
            "IAC",
            "RDF"
          ],
          "likelihood": "high",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": "low",
          "residualImpact": "serious",
          "residualRisk": "medium",
          "exceedsTolerable": true,
          "disposition": "mitigated",
          "acceptance": ""
        },
        {
          "id": "T2",
          "statement": "Malware introduced through an engineering connection executes on a DCS server and corrupts control logic or displays.",
          "source": "Commodity malware via engineering path",
          "affectedFR": [
            "SI"
          ],
          "likelihood": "medium",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": "low",
          "residualImpact": "serious",
          "residualRisk": "medium",
          "exceedsTolerable": true,
          "disposition": "countermeasure",
          "acceptance": ""
        },
        {
          "id": "T3",
          "statement": "A flooding or resource-exhaustion event on the control network degrades operator view of the unit.",
          "source": "Network fault or deliberate DoS",
          "affectedFR": [
            "RA"
          ],
          "likelihood": "low",
          "impact": "serious",
          "unmitigatedRisk": "medium",
          "residualLikelihood": null,
          "residualImpact": null,
          "residualRisk": null,
          "exceedsTolerable": false,
          "disposition": null,
          "acceptance": ""
        }
      ],
      "vulnerabilities": [
        {
          "id": "V1",
          "description": "DCS servers on an extended-support OS awaiting the vendor's qualified upgrade path"
        },
        {
          "id": "V2",
          "description": "OPC DA (legacy) still enabled alongside OPC UA for two displaced clients"
        }
      ],
      "countermeasures": [
        {
          "id": "M1",
          "description": "Per-session vendor access activation with MFA and session recording on the jump host",
          "addressesFR": [
            "IAC",
            "UC",
            "RDF"
          ],
          "reference": "OPS-PROC-118",
          "existing": true
        },
        {
          "id": "M2",
          "description": "Application allow-listing on DCS servers and HMIs (vendor-qualified build)",
          "addressesFR": [
            "SI",
            "RA"
          ],
          "reference": "Hardening baseline HB-DCS-03",
          "existing": true
        },
        {
          "id": "M3",
          "description": "Retire OPC DA: migrate the two remaining clients to OPC UA through the DMZ broker",
          "addressesFR": [
            "RDF",
            "SI",
            "RA"
          ],
          "reference": "Roadmap item R-12",
          "existing": false
        }
      ],
      "riskComparison": {
        "required": true
      },
      "initialRisk": {
        "risk": "high",
        "source": "systems"
      }
    },
    {
      "id": "Z2",
      "name": "Safety Instrumented System",
      "safetyRelated": true,
      "fromHighLevelAsset": "A2",
      "slSuggestedByFR": {
        "IAC": 3,
        "UC": 3,
        "SI": 3,
        "DC": 3,
        "RDF": 3,
        "TRE": 3,
        "RA": 3
      },
      "slTargetByFR": {
        "IAC": 3,
        "UC": 3,
        "SI": 3,
        "DC": 3,
        "RDF": 3,
        "TRE": 3,
        "RA": 3
      },
      "slTarget": 3,
      "worstUnmitigatedRisk": "high",
      "justification": "The SIS floor applies: a zone containing safety instrumented functions takes SL3 across every foundational requirement regardless of the per-threat arithmetic, because the SIS is the last line of defence and severe-consequence/low-likelihood events dominate. An unauthorised change to the safety logic is treated through these targets, with the hardwired keyswitch for program mode in place and a dedicated SIS engineering workstation planned. This vector is deliberately not averaged down: any relaxation requires the asset owner to re-open the sign-off.",
      "assets": [
        {
          "id": "AS4",
          "name": "SIS logic solver",
          "type": "safety-plc"
        },
        {
          "id": "AS5",
          "name": "Safety I/O and final elements",
          "type": "other"
        }
      ],
      "accessPoints": [
        "Engineering connection from Z4 (keyed, normally disconnected)"
      ],
      "externalDependencies": [
        "SIS vendor for logic changes (site visit only, no remote path)"
      ],
      "securityPolicies": [
        "SIS changes require process safety authorisation and a keyed bypass record",
        "No shared network segments with BPCS"
      ],
      "threats": [
        {
          "id": "T4",
          "statement": "An unauthorised or malicious logic change to the SIS defeats or degrades a safety instrumented function.",
          "source": "Insider or attacker with engineering access",
          "affectedFR": [
            "IAC",
            "SI"
          ],
          "likelihood": "low",
          "impact": "severe",
          "unmitigatedRisk": "high",
          "residualLikelihood": null,
          "residualImpact": null,
          "residualRisk": null,
          "exceedsTolerable": true,
          "disposition": "sl-t",
          "acceptance": ""
        }
      ],
      "vulnerabilities": [
        {
          "id": "V3",
          "description": "SIS engineering software runs on a Z4 workstation that also carries DCS tooling (shared engineering asset)"
        }
      ],
      "countermeasures": [
        {
          "id": "M4",
          "description": "Hardwired keyswitch required for SIS program mode; position alarmed to the control room",
          "addressesFR": [
            "IAC",
            "UC",
            "SI"
          ],
          "reference": "C&E U300-CE-014",
          "existing": true
        },
        {
          "id": "M8",
          "description": "Move the SIS engineering software to a dedicated workstation kept in field auxiliary room 2, off the shared engineering workstation",
          "addressesFR": [
            "IAC",
            "UC",
            "SI"
          ],
          "reference": "MoC to be raised",
          "existing": false
        }
      ],
      "riskComparison": {
        "required": true
      },
      "initialRisk": {
        "risk": "high",
        "source": "systems"
      }
    },
    {
      "id": "Z3",
      "name": "Plant DMZ & historian",
      "safetyRelated": false,
      "fromHighLevelAsset": "A3",
      "slSuggestedByFR": {
        "IAC": null,
        "UC": null,
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": null,
        "RA": null
      },
      "slTargetByFR": {
        "IAC": 2,
        "UC": 2,
        "SI": 2,
        "DC": 2,
        "RDF": 2,
        "TRE": 2,
        "RA": 1
      },
      "slTarget": 2,
      "worstUnmitigatedRisk": "high",
      "justification": "The zone's worst unmitigated risk is High (a compromised corporate client using the historian as a pivot toward the BPCS), with internet adjacency and exposure through many conduits bearing on RDF and SI, but the DMZ exists precisely to absorb that exposure, and the planned restriction of historian web access to the reporting subnet addresses the driving vulnerability. SL2 across the access, integrity and data-flow FRs reflects the brokerage role; RA stays at SL1 because loss of the DMZ does not remove operator view or control (a security function that must be kept: the unit runs through a DMZ outage). Exfiltration of process data from the historian sits within tolerable risk and needs no treatment decision.",
      "assets": [
        {
          "id": "AS6",
          "name": "Process historian (primary)",
          "type": "historian"
        },
        {
          "id": "AS7",
          "name": "Vendor jump host",
          "type": "server"
        },
        {
          "id": "AS8",
          "name": "DMZ firewall pair",
          "type": "network"
        }
      ],
      "accessPoints": [
        "Corporate reporting clients (C3)",
        "Historian replication from Z1 (C1)",
        "Vendor VPN termination (C2)"
      ],
      "externalDependencies": [
        "Corporate AD federation for jump-host MFA",
        "Vendor VPN concentrator availability"
      ],
      "securityPolicies": [
        "All OT-corporate exchange transits the DMZ; no direct paths",
        "DMZ hosts patched monthly (IT window)"
      ],
      "threats": [
        {
          "id": "T5",
          "statement": "A compromised corporate client exploits the historian and uses it as a pivot toward the BPCS replication path.",
          "source": "Attacker on corporate network",
          "affectedFR": [
            "RDF",
            "SI"
          ],
          "likelihood": "medium",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": "low",
          "residualImpact": "serious",
          "residualRisk": "medium",
          "exceedsTolerable": true,
          "disposition": "countermeasure",
          "acceptance": ""
        },
        {
          "id": "T6",
          "statement": "Process data is exfiltrated from the historian (recipe and throughput confidentiality).",
          "source": "Attacker on corporate network",
          "affectedFR": [
            "DC"
          ],
          "likelihood": "low",
          "impact": "serious",
          "unmitigatedRisk": "medium",
          "residualLikelihood": null,
          "residualImpact": null,
          "residualRisk": null,
          "exceedsTolerable": false,
          "disposition": null,
          "acceptance": ""
        }
      ],
      "vulnerabilities": [
        {
          "id": "V4",
          "description": "Historian web interface reachable from the whole corporate network, not just the reporting subnet"
        }
      ],
      "countermeasures": [
        {
          "id": "M5",
          "description": "Restrict historian web access to the reporting subnet and put it behind the corporate SSO proxy",
          "addressesFR": [
            "IAC",
            "RDF"
          ],
          "reference": "Firewall change FW-2026-041",
          "existing": false
        }
      ],
      "riskComparison": {
        "required": true
      },
      "initialRisk": {
        "risk": "high",
        "source": "systems"
      }
    },
    {
      "id": "Z4",
      "name": "Engineering workstations",
      "safetyRelated": false,
      "fromHighLevelAsset": "A4",
      "slSuggestedByFR": {
        "IAC": null,
        "UC": 3,
        "SI": 3,
        "DC": null,
        "RDF": 3,
        "TRE": null,
        "RA": null
      },
      "slTargetByFR": {
        "IAC": 2,
        "UC": 2,
        "SI": 3,
        "DC": 1,
        "RDF": 2,
        "TRE": 1,
        "RA": 1
      },
      "slTarget": 3,
      "worstUnmitigatedRisk": "high",
      "justification": "SI is set to SL3: the engineering zone is the integrity chokepoint for every controller, and malware carried on removable media or a vendor laptop is a High risk, held in day-to-day terms by the existing media kiosk and workstation allow-listing. Misuse of the legacy configuration tool's shared account exceeds tolerable risk, and the asset owner accepts it until its review at the end of June 2027 rather than raising the SL-T: a compensating procedure covers the risk until the shared account is retired. Remaining FRs sit at SL1 or SL2, consistent with no external paths into this zone.",
      "assets": [
        {
          "id": "AS9",
          "name": "Engineering workstations x3",
          "type": "engineering-workstation"
        },
        {
          "id": "AS10",
          "name": "Config management server (backups, versioning)",
          "type": "server"
        },
        {
          "id": "AS11",
          "name": "Vendor laptops (turnarounds)",
          "type": "engineering-workstation"
        }
      ],
      "accessPoints": [
        "Removable media (controlled USB process)",
        "Engineering VLAN to Z1 controllers"
      ],
      "externalDependencies": [
        "Vendor licence dongles and offline update bundles"
      ],
      "securityPolicies": [
        "USB media scanned at the kiosk before OT use",
        "Engineering accounts are individual; admin by exception"
      ],
      "threats": [
        {
          "id": "T7",
          "statement": "Malware carried on removable media or a vendor laptop executes on an engineering workstation and spreads to controllers.",
          "source": "Commodity malware via media/laptops",
          "affectedFR": [
            "SI",
            "RDF"
          ],
          "likelihood": "medium",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": "low",
          "residualImpact": "serious",
          "residualRisk": "medium",
          "exceedsTolerable": true,
          "disposition": "mitigated",
          "acceptance": ""
        },
        {
          "id": "T8",
          "statement": "The legacy depropaniser configuration tool's shared account is misused, making an unauthorised controller change unattributable.",
          "source": "Insider misuse / contractor churn",
          "affectedFR": [
            "UC"
          ],
          "likelihood": "medium",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": null,
          "residualImpact": null,
          "residualRisk": null,
          "exceedsTolerable": true,
          "disposition": "accepted",
          "acceptance": "The tool is retired at the Q2-2027 turnaround with the PLC upgrade. Until then the workstation is isolated on the engineering VLAN, and the account password is held by the shift supervisor and issued per use with a written record. Risk accepted at High for this bounded period."
        }
      ],
      "vulnerabilities": [
        {
          "id": "V5",
          "description": "Legacy configuration tool for the depropaniser PLCs requires a shared local account and runs unsupported"
        },
        {
          "id": "V6",
          "description": "Vendor laptops are built and patched by the vendor, not by Acme, and arrive with the vendor's own tooling"
        }
      ],
      "countermeasures": [
        {
          "id": "M6",
          "description": "Media kiosk scanning plus workstation allow-listing for engineering tools",
          "addressesFR": [
            "SI",
            "RDF"
          ],
          "reference": "HB-EWS-02",
          "existing": true
        },
        {
          "id": "M9",
          "description": "A separate maintenance zone for vendor laptops, with a conduit to the engineering VLAN opened only under a permit",
          "addressesFR": [
            "SI",
            "RDF"
          ],
          "reference": "Turnaround scope TA-2027-Q2",
          "existing": false
        }
      ],
      "riskComparison": {
        "required": true
      },
      "initialRisk": {
        "risk": "high",
        "source": "systems"
      }
    }
  ],
  "conduits": [
    {
      "id": "C1",
      "fromZone": "Z1",
      "toZone": "Z3",
      "name": "Historian replication",
      "channels": [
        "OPC UA"
      ],
      "slSuggestedByFR": {
        "IAC": 3,
        "UC": null,
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": null,
        "RA": 2
      },
      "slTargetByFR": {
        "IAC": 2,
        "UC": null,
        "SI": 2,
        "DC": 1,
        "RDF": 2,
        "TRE": null,
        "RA": null
      },
      "slTarget": 2,
      "justification": "Carries the risk of a pivot from the Z3 historian toward the BPCS as its data-flow path: SL2 on IAC/SI/RDF matches the zone targets either side; the broker enforces direction so no higher target is warranted.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "riskComparison": {
        "required": false,
        "reason": "One-way replication through the OPC UA broker. Its exposure is the Z3 pivot path, assessed there as T5, so the SL-T is set from the zones it joins."
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    },
    {
      "id": "C2",
      "fromZone": "Z3",
      "toZone": "Z1",
      "name": "Vendor remote access",
      "channels": [
        "VPN",
        "RDP through the jump host"
      ],
      "slSuggestedByFR": {
        "IAC": 3,
        "UC": null,
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": null,
        "RA": 2
      },
      "slTargetByFR": {
        "IAC": 3,
        "UC": 2,
        "SI": null,
        "DC": null,
        "RDF": 3,
        "TRE": 2,
        "RA": null
      },
      "slTarget": 3,
      "justification": "This conduit is the highest-exposure path into the BPCS: a hijacked vendor credential or session starts High, and the existing per-session controls (MFA, per-ticket activation, recording and auto-disconnect) bring it within tolerable risk today, but the SL-T is held at SL3 on IAC/RDF to match the Z1 targets it lands in, so the conduit is not the weak link. TRE at SL2 preserves the session-recording evidence chain.",
      "threats": [
        {
          "id": "T9",
          "statement": "A vendor credential or session is hijacked and replayed to reach the DCS outside an authorised window.",
          "source": "External attacker via vendor access chain",
          "affectedFR": [
            "IAC",
            "RDF"
          ],
          "likelihood": "medium",
          "impact": "serious",
          "unmitigatedRisk": "high",
          "residualLikelihood": "low",
          "residualImpact": "serious",
          "residualRisk": "medium",
          "exceedsTolerable": true,
          "disposition": "mitigated",
          "acceptance": ""
        }
      ],
      "vulnerabilities": [
        {
          "id": "V7",
          "description": "Vendor support accounts are issued by the vendor; Acme learns of a leaver only when the vendor reports one"
        }
      ],
      "countermeasures": [
        {
          "id": "M7",
          "description": "MFA on VPN and jump host, per-ticket session activation, session recording, auto-disconnect at window end",
          "addressesFR": [
            "IAC",
            "UC",
            "RDF"
          ],
          "reference": "OPS-PROC-118",
          "existing": true
        }
      ],
      "riskComparison": {
        "required": true
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    },
    {
      "id": "C3",
      "fromZone": "Z3",
      "toZone": "EXT",
      "name": "Corporate reporting",
      "channels": [
        "HTTPS"
      ],
      "slSuggestedByFR": {
        "IAC": null,
        "UC": null,
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": null,
        "RA": null
      },
      "slTargetByFR": {
        "IAC": 2,
        "UC": null,
        "SI": null,
        "DC": 2,
        "RDF": 2,
        "TRE": null,
        "RA": null
      },
      "slTarget": 2,
      "justification": "Boundary conduit to the untrusted corporate network: SL2 on IAC/DC/RDF reflects the read-only brokerage and the confidentiality of throughput data; no control traffic exists on this path.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "riskComparison": {
        "required": false,
        "reason": "Read-only reporting to the out-of-scope corporate network. The exposure is assessed at the Z3 boundary (T5, T6)."
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    }
  ]
};
