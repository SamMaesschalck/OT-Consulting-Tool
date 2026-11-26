/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* Fixture: the risk-context file the current risk tool exports for its demo
 * project (modules/risk-assessment, index.html?tour=1), as Export risk context
 * writes it, with the provenance added in phase 6 of
 * docs/risk-tool-redesign.md and the consequence-first provenance (each
 * threat's consequenceId and via, the consequences list) and the depth each
 * zone and conduit was assessed at (assessment), on the same
 * spt-risk-context/1.4 string. The 3-2 fixes, step 5, add the demo's
 * engineering VLAN (C4) and keyed SIS connection (C5) as conduits, which
 * flow in as any conduit does, and T4's remaining risk acceptance in its
 * acceptance text; the ranked systems' in-SUC mark does not flow.
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
    "description": "The basic process control system, safety instrumented system and supporting OT infrastructure for the Unit 300 alkylation unit at the Teesport refinery. The system comprises redundant SCADA/DCS servers and operator HMIs in the central control room, unit PLCs and remote I/O in the field auxiliary rooms, the SIS that performs the unit's safety instrumented functions, the engineering workstations, and the plant DMZ, which carries the historian and the vendor access paths.",
    "scopeStatement": "The scope covers all Unit 300 control, safety and engineering systems from the field controllers up to and including the plant DMZ, and the conduits that cross the boundary for historian replication, vendor remote access and corporate reporting. The corporate IT network beyond the DMZ firewall, the other process units and the terminal loading systems are out of scope. The loading systems are assessed separately."
  },
  "securityRequirements": {
    "tolerableRisk": "medium",
    "knownThreats": [
      "Capable criminal and ransomware groups reaching OT through corporate IT or vendor access",
      "State-capable adversaries with an interest in the refining sector (adversary class 3 assumed for this SUC)",
      "Insider misuse of engineering access, with a high turnover of contractors at turnarounds",
      "Commodity malware brought in on removable media and engineering laptops"
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
      "note": "The primary control layer. Its loss forces a manual shutdown, and its manipulation is the path to an acid release. Assigned to Z1 and assessed in detail."
    },
    {
      "id": "A2",
      "name": "Safety Instrumented System (SIS)",
      "functionLocation": "Emergency depressurisation and acid isolation - field aux room 2",
      "consequence": "severe",
      "likelihood": "low",
      "risk": "high",
      "note": "The last layer of protection, so any compromise is intolerable whatever its likelihood. Assigned to Z2 and assessed in detail."
    },
    {
      "id": "A3",
      "name": "Plant DMZ & process historian",
      "functionLocation": "Data brokerage between OT and corporate - server room",
      "consequence": "serious",
      "likelihood": "medium",
      "risk": "high",
      "note": "Every external path passes through the DMZ, and a foothold here gives a route into the BPCS. Assigned to Z3 and assessed in detail."
    },
    {
      "id": "A4",
      "name": "Engineering workstations & config management",
      "functionLocation": "DCS/PLC/SIS configuration - control building office",
      "consequence": "serious",
      "likelihood": "medium",
      "risk": "high",
      "note": "These workstations can change every controller, and removable media and legacy tools are in routine use. Assigned to Z4 and assessed in detail."
    },
    {
      "id": "A5",
      "name": "Laboratory information system link",
      "functionLocation": "Sample results feed to the historian - lab",
      "consequence": "serious",
      "likelihood": "low",
      "risk": "medium",
      "note": "A one-way feed with no control path, ranked medium. The feed ends at the historian, which Z3 covers."
    },
    {
      "id": "A6",
      "name": "CCTV & physical security systems",
      "functionLocation": "Site perimeter and unit cameras - site-wide",
      "consequence": "negligible",
      "likelihood": "high",
      "risk": "low",
      "note": "Commodity IP equipment that is often probed but has no process consequence. It is ranked low."
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
      },
      {
        "id": "I5",
        "name": "H. Okafor",
        "role": "Group Insurance Manager",
        "date": "2026-07-03",
        "notes": "Business interruption cover, cyber extension, transfer of lost production"
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
        "notes": "Session activation, attribution and recording observed from start to finish"
      }
    ]
  },
  "assumptions": [
    "Physical access to the control room and field auxiliary rooms is badge-controlled and logged",
    "The corporate network is treated as untrusted and assumed compromised for this assessment",
    "Unit 300 runs continuously, and a control system outage forces a manual shutdown of the unit within 30 minutes",
    "Vendor support for the DCS is contractually required and uses the remote access path assessed here"
  ],
  "approval": {
    "name": "R. Calder",
    "role": "Asset Owner - Unit 300",
    "date": "2026-07-04",
    "statement": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the two recorded risk acceptances (legacy configuration tooling, and the remaining risk on the SIS until its dedicated engineering workstation is in place), the one transferred risk (lost production, through business interruption insurance), and the per-FR SL-T vectors as the target for the security programme.",
    "approved": true
  },
  "approvals": [
    {
      "name": "R. Calder",
      "role": "Asset Owner - Unit 300",
      "organisation": "Acme Petrochemicals Ltd",
      "date": "2026-07-04",
      "scope": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the two recorded risk acceptances (legacy configuration tooling, and the remaining risk on the SIS until its dedicated engineering workstation is in place), the one transferred risk (lost production, through business interruption insurance), and the per-FR SL-T vectors as the target for the security programme."
    },
    {
      "name": "D. Hargreaves",
      "role": "Operations Manager, Teesport Refinery",
      "organisation": "Acme Petrochemicals Ltd",
      "date": "2026-07-04",
      "scope": "The SL-T of the Safety Instrumented System zone (Z2), and the remaining risk on the SIS accepted until its dedicated engineering workstation is in place."
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
      "justification": "The worst unmitigated risks in this zone are High against a Medium tolerable risk (an attacker riding the vendor remote access path, and malware brought in over an engineering connection). The permanent remote access path also raises the likelihood of attacks on IAC, UC and RDF. IAC, SI and RDF are therefore set to SL3. UC stays at SL2 because procedures limit use control inside the control room and no High risk bears on it directly. DC is set to SL1, as process data has a low confidentiality consequence. TRE and RA at SL2 support forensic investigation and the resilience the unit needs, as an outage forces a manual shutdown within 30 minutes.",
      "assets": [
        {
          "id": "AS1",
          "name": "DCS server pair (redundant)",
          "type": "server",
          "criticality": "high"
        },
        {
          "id": "AS2",
          "name": "Operator HMIs x4",
          "type": "hmi",
          "criticality": "high"
        },
        {
          "id": "AS3",
          "name": "Unit PLCs x6 (reactor, acid feed, depropaniser)",
          "type": "plc",
          "criticality": "high"
        }
      ],
      "accessPoints": [
        "Vendor VPN via jump host (C2)",
        "Historian replication to DMZ (C1)",
        "Engineering VLAN from Z4 (C4)"
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
          "acceptance": "",
          "consequenceId": "K1",
          "via": [
            "Z3",
            "C2"
          ]
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
          "disposition": "accepted",
          "acceptance": "Lost production from a cyber-caused shutdown of the unit is covered by the group's business interruption insurance, which has a cyber extension (policy GBI-2026-114). The cover is reviewed annually at the policy renewal.",
          "decision": "transfer",
          "transferTo": "Acme group insurers, through the group business interruption policy",
          "consequenceId": "K2",
          "via": [
            "Z4",
            "C4"
          ]
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
          "acceptance": "",
          "consequenceId": "K3"
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
      "assessment": {
        "depth": "detailed"
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
      "justification": "A zone containing safety instrumented functions takes the SIS floor of SL3 on every foundational requirement, whatever the individual threat ratings would suggest. The SIS is the last layer of protection, and its risk is dominated by events of severe consequence and low likelihood. An unauthorised change to the safety logic is treated through these targets, with the hardwired keyswitch for program mode in place and a dedicated SIS engineering workstation planned. The vector is not averaged down, and any relaxation requires the asset owner to reopen the sign-off.",
      "assets": [
        {
          "id": "AS4",
          "name": "SIS logic solver",
          "type": "safety-plc",
          "criticality": "high"
        },
        {
          "id": "AS5",
          "name": "Safety I/O and final elements",
          "type": "other",
          "criticality": "high"
        }
      ],
      "accessPoints": [
        "Keyed engineering connection from Z4 (C5), normally disconnected"
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
          "acceptance": "The consequence stays severe, so no countermeasure brings the risk within tolerable risk. Until the dedicated SIS engineering workstation is in place, process safety authorisation, the keyed bypass record and the program-mode keyswitch limit the remaining risk. It is accepted at High until the review.",
          "consequenceId": "K1",
          "via": [
            "Z4",
            "C5"
          ]
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
          "description": "Hardwired keyswitch required for SIS program mode, with its position alarmed in the control room",
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
      "assessment": {
        "depth": "detailed"
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
        "IAC": 3,
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
      "justification": "The zone's worst unmitigated risk is High (a compromised corporate client using the historian as a pivot toward the BPCS), and internet adjacency and exposure through many conduits bear on RDF and SI. The DMZ is there to absorb that exposure, and the planned restriction of historian web access to the reporting subnet addresses the vulnerability behind the risk. SL2 on the access, integrity and data-flow FRs reflects the zone's brokerage role. RA stays at SL1 because losing the DMZ does not remove operator view or control, and the unit runs through a DMZ outage. Operator view and manual command are among the security functions that must be kept. Exfiltration of process data from the historian is within tolerable risk and needs no treatment decision. IAC stays at SL2 although the vendor remote access scenarios pass through this zone on their way to the BPCS, because C2 and Z1, which they reach, already hold SL3 on IAC.",
      "assets": [
        {
          "id": "AS6",
          "name": "Process historian (primary)",
          "type": "historian",
          "criticality": "medium"
        },
        {
          "id": "AS7",
          "name": "Vendor jump host",
          "type": "server",
          "criticality": "medium"
        },
        {
          "id": "AS8",
          "name": "DMZ firewall pair",
          "type": "network",
          "criticality": "high"
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
        "All exchange between OT and corporate passes through the DMZ, with no direct paths",
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
          "description": "Historian web interface reachable from the whole corporate network, where only the reporting subnet needs it"
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
      "assessment": {
        "depth": "detailed"
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
        "IAC": 3,
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
      "justification": "SI is set to SL3 because every controller change passes through the engineering zone, and malware carried on removable media or a vendor laptop is a High risk there. The existing media kiosk and workstation allow-listing reduce that risk in day-to-day operation. Misuse of the legacy configuration tool's shared account exceeds tolerable risk. The asset owner accepts it until its review at the end of June 2027, and the SL-T is not raised for it, because a compensating procedure covers the risk until the shared account is retired. IAC stays at SL2 although the engineering scenario against the SIS passes through this zone and suggests SL3, because the SIS zone already holds SL3 on IAC. The other FRs sit at SL1 or SL2, consistent with no external paths into this zone.",
      "assets": [
        {
          "id": "AS9",
          "name": "Engineering workstations x3",
          "type": "engineering-workstation",
          "criticality": "medium"
        },
        {
          "id": "AS10",
          "name": "Config management server (backups, versioning)",
          "type": "server",
          "criticality": "medium"
        },
        {
          "id": "AS11",
          "name": "Vendor laptops (turnarounds)",
          "type": "engineering-workstation",
          "criticality": "low"
        }
      ],
      "accessPoints": [
        "Removable media (controlled USB process)",
        "Engineering VLAN to the BPCS (C4)",
        "Keyed engineering connection to the SIS (C5)"
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
          "acceptance": "",
          "consequenceId": "K2"
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
          "acceptance": "The tool is retired at the Q2-2027 turnaround with the PLC upgrade. Until then the workstation is isolated on the engineering VLAN, and the account password is held by the shift supervisor and issued per use with a written record. The risk is accepted at High for this limited period."
        }
      ],
      "vulnerabilities": [
        {
          "id": "V5",
          "description": "Legacy configuration tool for the depropaniser PLCs requires a shared local account and runs unsupported"
        },
        {
          "id": "V6",
          "description": "Vendor laptops are built and patched by the vendor, outside Acme's control, and arrive with the vendor's own tools"
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
      "assessment": {
        "depth": "detailed"
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
        "IAC": 3,
        "UC": 2,
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": 2,
        "RA": 2
      },
      "slTarget": 3,
      "justification": "The conduit is assessed with Z3 because a pivot from the DMZ historian toward the BPCS would follow this data flow. IAC, SI and RDF are set to SL3 to match the BPCS targets it connects to, so that the replication path is not the weak link. The broker also enforces one-way replication. DC at SL2 follows the historian's process data, and RA at SL2 follows the 30-minute window before a manual shutdown. UC and TRE at SL2 match the zones on either side.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "assessment": {
        "depth": "grouped",
        "withId": "Z3"
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
        "SI": 3,
        "DC": 2,
        "RDF": 3,
        "TRE": 2,
        "RA": 2
      },
      "slTarget": 3,
      "justification": "This conduit is the most exposed path into the BPCS. A hijacked vendor credential or session starts at High, and the existing per-session controls (MFA, per-ticket activation, recording and auto-disconnect) bring it within tolerable risk today. The SL-T is still held at SL3 on IAC and RDF to match the Z1 targets it reaches, so that the conduit is not the weak link. SI at SL3 also matches the BPCS, UC at SL2 matches both zones, DC at SL2 follows the DMZ and RA at SL2 follows the BPCS. TRE at SL2 keeps the session recordings usable as evidence.",
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
          "acceptance": "",
          "consequenceId": "K1",
          "via": [
            "Z3"
          ]
        }
      ],
      "vulnerabilities": [
        {
          "id": "V7",
          "description": "Vendor support accounts are issued by the vendor, and Acme learns of a leaver only when the vendor reports one"
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
      "assessment": {
        "depth": "detailed"
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
        "IAC": 3,
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
      "justification": "C3 is the boundary conduit to the untrusted corporate network and carries no control traffic. Its targets match the DMZ it serves. It is SL2 on every foundational requirement except RA, for the read-only brokerage and the confidentiality of throughput data, and SL1 on RA, because losing corporate reporting does not affect operator view or control. The house method suggests SL3 on IAC, SI and RDF because the DMZ's own suggestion is SL3, and the DMZ holds those at SL2 for the reasons in its justification.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "assessment": {
        "depth": "proportionate",
        "considered": "A compromised client on the out-of-scope corporate network using the read-only reporting service as a foothold, and exfiltration of throughput data. Both are assessed at the Z3 boundary as T5 and T6."
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    },
    {
      "id": "C4",
      "fromZone": "Z4",
      "toZone": "Z1",
      "name": "Engineering VLAN",
      "channels": [
        "DCS engineering protocol",
        "PLC programming protocol"
      ],
      "slSuggestedByFR": {
        "IAC": 3,
        "UC": 3,
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
      "justification": "The engineering VLAN carries configuration downloads into the BPCS, so it takes the BPCS targets. IAC, SI and RDF are SL3, because malware brought in over an engineering connection is a High risk there and the path into the controllers must not be the weak link. UC stays at SL2, as on both zones it joins, and misuse of the shared account on the legacy configuration tool is accepted until that tool is retired. DC at SL1 reflects the low confidentiality of configuration data, and TRE and RA at SL2 follow the BPCS.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "assessment": {
        "depth": "grouped",
        "withId": "Z4"
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    },
    {
      "id": "C5",
      "fromZone": "Z4",
      "toZone": "Z2",
      "name": "Keyed SIS engineering connection",
      "channels": [
        "SIS engineering protocol"
      ],
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
      "justification": "The keyed engineering connection reaches the SIS, so it takes the SIS zone's SL3 on every foundational requirement and does not become the weak link. It is connected only for an authorised change, with the program-mode keyswitch turned and a keyed bypass record.",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "assessment": {
        "depth": "grouped",
        "withId": "Z2"
      },
      "initialRisk": {
        "risk": "high",
        "source": "zones"
      }
    }
  ],
  "consequences": [
    {
      "id": "K1",
      "title": "Loss of containment of HF acid from an unsafe process state",
      "impact": "severe"
    },
    {
      "id": "K2",
      "title": "Unplanned shutdown of the unit and lost production",
      "impact": "serious"
    },
    {
      "id": "K3",
      "title": "Loss of view of the unit at the control room",
      "impact": "serious"
    }
  ]
};
