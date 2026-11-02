/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/general-ot-posture/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["general-ot-posture"] = window.App.Data.instruments["general-ot-posture"] || {};
window.App.Data.instruments["general-ot-posture"].instrument = {
    "id":  "general-ot-posture",
    "title":  "General OT Security Posture",
    "edition":  "1.0",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "domain-letter",
    "targetDimension":  "site",
    "targetDimensionLabel":  "Site",
    "scoringProfileRef":  "posture-domain-letter",
    "notes":  "High-level, interview-based OT posture assessment. Every scored question\u0027s band is set by the consultant using their judgement of the answer; the tool never derives the band from the captured fields. scored:false questions capture context only and are excluded from grading. Indicative, not a conformance or regulatory assessment.",
    "responseModel":  {
                          "bandScale":  [
                                            {
                                                "value":  0,
                                                "label":  "Not in place"
                                            },
                                            {
                                                "value":  1,
                                                "label":  "Partial / ad hoc"
                                            },
                                            {
                                                "value":  2,
                                                "label":  "Largely in place"
                                            },
                                            {
                                                "value":  3,
                                                "label":  "Fully in place and managed"
                                            }
                                        ],
                          "specialStates":  [
                                                {
                                                    "value":  "unknown",
                                                    "label":  "Unknown",
                                                    "effect":  "reduces coverage; not scored"
                                                },
                                                {
                                                    "value":  "na",
                                                    "label":  "Not applicable",
                                                    "effect":  "excluded from grading and coverage"
                                                }
                                            ],
                          "rule":  "The band is always set by the consultant. Capture fields (text, checklist, choice, boolean) inform and evidence the band but never set it."
                      },
    "domains":  [
                    {
                        "id":  "gov",
                        "name":  "Governance and risk"
                    },
                    {
                        "id":  "assets",
                        "name":  "Asset visibility"
                    },
                    {
                        "id":  "arch",
                        "name":  "Architecture and segmentation"
                    },
                    {
                        "id":  "access",
                        "name":  "Access control"
                    },
                    {
                        "id":  "protect",
                        "name":  "Protective controls"
                    },
                    {
                        "id":  "monitor",
                        "name":  "Monitoring and detection"
                    },
                    {
                        "id":  "respond",
                        "name":  "Response and recovery"
                    }
                ],
    "questions":  [
                      {
                          "id":  "gov.1",
                          "prompt":  "Is there a named person accountable for OT/ICS cyber security?",
                          "shortTitle":  "Accountability for OT security",
                          "rationale":  "In OT, accountability is often split between plant engineering and IT, so cyber risk to safety and availability falls through the gap. A single named owner with real authority ensures OT risk is actually managed rather than assumed to be someone else\u0027s job.",
                          "goodLooksLike":  "A named individual is accountable for OT cyber security with a clear mandate, influence over budget and a route to senior management, working alongside plant and engineering leadership rather than under generic IT.",
                          "references":  [
                                             "NCSC CAF A1 (Governance)",
                                             "ISA/IEC 62443-2-1 (CSMS)",
                                             "NIST CSF Govern"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No one owns it",
                                              "1":  "Informal or shared with IT, unclear",
                                              "2":  "Named owner but limited authority or time",
                                              "3":  "Named owner with a clear mandate and resources"
                                          },
                          "capture":  [
                                          {
                                              "id":  "owner",
                                              "type":  "choice",
                                              "label":  "Who owns it?",
                                              "options":  [
                                                              "No one",
                                                              "IT security",
                                                              "Plant / engineering",
                                                              "Dedicated OT security role",
                                                              "Other"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.2",
                          "prompt":  "Has an OT-specific cyber risk assessment been carried out?",
                          "shortTitle":  "OT-specific risk assessment",
                          "rationale":  "IT risk assessments rarely capture OT consequences such as loss of view, loss of control, or impact to safety and production. Without an OT-specific assessment, controls are not prioritised against the risks that actually matter on the plant.",
                          "goodLooksLike":  "A documented OT risk assessment, refreshed periodically and after major change, that weighs safety and availability impact and drives a prioritised improvement plan (in the spirit of ISA/IEC 62443-3-2).",
                          "references":  [
                                             "NCSC CAF A2 (Risk management)",
                                             "ISA/IEC 62443-3-2 (risk assessment)",
                                             "NIST CSF Identify"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Informal, or IT risk assessment assumed to cover OT",
                                              "2":  "Done once, not maintained",
                                              "3":  "Done, maintained, and used to drive decisions"
                                          },
                          "capture":  [
                                          {
                                              "id":  "seen",
                                              "type":  "boolean",
                                              "label":  "Document seen?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.3",
                          "prompt":  "Are there OT security policies or standards that staff actually follow?",
                          "shortTitle":  "OT security policies in practice",
                          "rationale":  "Policies written for IT often cannot be met in OT (forced patching, account lockouts) and get quietly ignored, leaving no real standard. Practical, followed OT policies set consistent expectations across shifts and contractors.",
                          "goodLooksLike":  "OT-specific policies and standards exist, are realistic for the plant environment, are known by staff and contractors, and are actually followed and periodically reviewed.",
                          "references":  [
                                             "NCSC CAF A1 / B1",
                                             "ISA/IEC 62443-2-1 (CSMS)",
                                             "NIST CSF Govern"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "IT policies assumed to cover OT",
                                              "2":  "OT policies exist but adoption is patchy",
                                              "3":  "OT-specific, known, and followed"
                                          },
                          "capture":  [
                                          {
                                              "id":  "which",
                                              "type":  "checklist",
                                              "label":  "Which exist?",
                                              "options":  [
                                                              "Acceptable use",
                                                              "Remote access",
                                                              "Change management",
                                                              "Patching",
                                                              "Backup",
                                                              "Incident response",
                                                              "None"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.4",
                          "prompt":  "Does OT security feature in budgeting and management reporting?",
                          "shortTitle":  "Budgeting and management reporting",
                          "rationale":  "Without visibility in budgeting and management reporting, OT security improvements compete poorly for funding and degrade over time. Regular reporting keeps leadership aware of the residual risk they are carrying.",
                          "goodLooksLike":  "OT cyber risk and remediation progress are reported to management on a regular cadence, with funding allocated through the normal budgeting cycle.",
                          "references":  [
                                             "NCSC CAF A1 (Governance)",
                                             "NIST CSF Govern"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Not at all",
                                              "1":  "Ad hoc only",
                                              "2":  "Occasionally",
                                              "3":  "Regularly, with management visibility"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.6",
                          "prompt":  "Do OT changes go through a process that considers security, not just safety and availability?",
                          "shortTitle":  "Security in change management",
                          "rationale":  "OT change control is usually mature for safety and silent on security, so rules, accounts and connections get approved on operational grounds alone. It is the control that stops every other control decaying between assessments.",
                          "goodLooksLike":  "Management of change asks the security question explicitly for OT changes, with security input on higher-risk changes and a record of what was decided and why.",
                          "references":  [
                                             "ISA/IEC 62443-2-1 (CSMS)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No change process for OT",
                                              "1":  "Change control, security not considered",
                                              "2":  "Security considered informally",
                                              "3":  "Security a defined step in change control"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.7",
                          "prompt":  "Do OT staff and contractors get security training relevant to the plant, beyond corporate e-learning?",
                          "shortTitle":  "OT security awareness and training",
                          "rationale":  "Operators and engineers make the decisions that decide the outcome: the USB stick, the vendor connection, the control bypassed to keep the plant running. Corporate phishing training covers none of it.",
                          "goodLooksLike":  "Operators, engineers and contractors receive OT-specific awareness covering the risks and behaviours particular to the plant, refreshed periodically and actually reaching shift teams.",
                          "references":  [
                                             "ISA/IEC 62443-2-1 (CSMS)",
                                             "NCSC CAF B6",
                                             "NIST CSF Protect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Corporate training only",
                                              "2":  "Some OT-specific awareness",
                                              "3":  "Role-based OT training, kept current"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.8",
                          "prompt":  "Are security expectations set with OT suppliers, and are they checked?",
                          "shortTitle":  "Supplier security expectations",
                          "rationale":  "Most work on an OT system is done by somebody else\u0027s engineer on somebody else\u0027s laptop. Ask nothing and verify nothing, and the plant inherits the practices of its weakest supplier.",
                          "goodLooksLike":  "Security requirements are written into OT contracts and specifications, suppliers are asked to evidence them, and the answers carry weight in who gets used.",
                          "references":  [
                                             "ISA/IEC 62443-2-4 (service provider requirements)",
                                             "NCSC CAF A4",
                                             "NIST CSF Identify"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Nothing asked of suppliers",
                                              "1":  "Expectations set ad hoc",
                                              "2":  "Requirements set, lightly checked",
                                              "3":  "Specified, evidenced and reviewed"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "gov.5",
                          "prompt":  "Who are the key OT security stakeholders and contacts on site?",
                          "shortTitle":  "Key stakeholders and contacts",
                          "rationale":  "Knowing who owns, operates and supports each part of the OT estate is essential for everyday decisions and critical during an incident, when the right people must be reached quickly.",
                          "goodLooksLike":  "Key OT stakeholders and contacts (operations, engineering, safety, IT security, vendors) are identified and kept current, with escalation routes understood by all parties.",
                          "references":  [
                                             "NCSC CAF A1 / D1",
                                             "NIST CSF Govern / Respond"
                                         ],
                          "scored":  false,
                          "allowNA":  true,
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "gov"
                      },
                      {
                          "id":  "assets.1",
                          "prompt":  "Is there an inventory of OT assets?",
                          "shortTitle":  "OT asset inventory",
                          "rationale":  "You cannot protect, patch or monitor what you do not know exists. OT estates accumulate legacy and undocumented devices, and an incomplete inventory is one of the most common root causes of OT exposure.",
                          "goodLooksLike":  "A maintained inventory of OT assets (controllers, HMIs, network devices, software and firmware versions) kept current through change management, ideally supported by passive discovery.",
                          "references":  [
                                             "NCSC CAF A3 (Asset management)",
                                             "NIST CSF Identify",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Partial or outdated",
                                              "2":  "Reasonably complete, manually maintained",
                                              "3":  "Complete and kept current"
                                          },
                          "capture":  [
                                          {
                                              "id":  "form",
                                              "type":  "choice",
                                              "label":  "Form",
                                              "options":  [
                                                              "None",
                                                              "Spreadsheet",
                                                              "CMDB",
                                                              "Automated discovery tool"
                                                          ]
                                          },
                                          {
                                              "id":  "seen",
                                              "type":  "boolean",
                                              "label":  "Seen?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "assets"
                      },
                      {
                          "id":  "assets.2",
                          "prompt":  "Is there an up-to-date network diagram for the OT environment?",
                          "shortTitle":  "OT network diagram",
                          "rationale":  "An accurate, current network diagram underpins segmentation, incident response and change decisions. Out-of-date drawings lead to wrong assumptions about what is connected and how.",
                          "goodLooksLike":  "An up-to-date OT network diagram showing zones, conduits, interconnections and external links, version-controlled and updated as part of change management.",
                          "references":  [
                                             "NCSC CAF A3 (Asset management)",
                                             "NIST CSF Identify",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Outdated or partial",
                                              "2":  "Reasonably current",
                                              "3":  "Current and validated"
                                          },
                          "capture":  [
                                          {
                                              "id":  "seen",
                                              "type":  "boolean",
                                              "label":  "Seen?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "assets"
                      },
                      {
                          "id":  "assets.3",
                          "prompt":  "Do staff know what is actually connected to the OT network, including transient and contractor devices?",
                          "shortTitle":  "Awareness of connected devices",
                          "rationale":  "Transient laptops, contractor devices and forgotten connections are a frequent route for malware into OT. If staff cannot say what is connected, unauthorised or risky devices go unnoticed.",
                          "goodLooksLike":  "There is confidence, and ideally technical visibility, over what is connected to the OT network, with controls governing transient and contractor devices.",
                          "references":  [
                                             "NCSC CAF A3 / A4",
                                             "ISA/IEC 62443-3-3 FR1 (Identification \u0026 Authentication Control)",
                                             "NIST CSF Identify / Detect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No",
                                              "1":  "Rough idea only",
                                              "2":  "Mostly known",
                                              "3":  "Known and controlled"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "assets"
                      },
                      {
                          "id":  "assets.4",
                          "prompt":  "Are external and vendor connections into OT documented and understood?",
                          "shortTitle":  "External and vendor connections",
                          "rationale":  "Vendor and external links bypass perimeter controls and are a leading vector for OT compromise. Undocumented connections cannot be risk-assessed, controlled or monitored.",
                          "goodLooksLike":  "All external and vendor connections into OT are documented, justified, access-controlled, monitored and reviewed; unused links are removed.",
                          "references":  [
                                             "NCSC CAF A4 (Supply chain) / B4",
                                             "ISA/IEC 62443-3-3 FR5 (Restricted Data Flow)",
                                             "NIST CSF Identify"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Unknown",
                                              "1":  "Some known",
                                              "2":  "Mostly documented",
                                              "3":  "Fully documented and reviewed"
                                          },
                          "capture":  [
                                          {
                                              "id":  "types",
                                              "type":  "checklist",
                                              "label":  "Connection types",
                                              "options":  [
                                                              "Vendor remote access",
                                                              "Site-to-site VPN",
                                                              "Cellular / 4G routers",
                                                              "Cloud services",
                                                              "Historian to IT",
                                                              "None known"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "assets"
                      },
                      {
                          "id":  "arch.1",
                          "prompt":  "Is the OT network separated from the corporate / IT network?",
                          "shortTitle":  "OT and IT network separation",
                          "rationale":  "A flat network lets an IT compromise such as ransomware spread directly into OT and halt production or threaten safety. Separation is the single most effective OT control.",
                          "goodLooksLike":  "OT is segmented from corporate IT by firewalls with a controlled DMZ, default-deny rules and no direct routable path; the separation is enforced and monitored.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR5 (Restricted Data Flow)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82 (segmentation)"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Flat or shared network",
                                              "1":  "Some separation, for example VLAN only",
                                              "2":  "Firewalled boundary",
                                              "3":  "Firewalled boundary with a DMZ and controlled data exchange"
                                          },
                          "capture":  [
                                          {
                                              "id":  "sep",
                                              "type":  "choice",
                                              "label":  "Separation",
                                              "options":  [
                                                              "None (flat)",
                                                              "VLAN only",
                                                              "Firewall",
                                                              "Firewall + DMZ"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "arch"
                      },
                      {
                          "id":  "arch.2",
                          "prompt":  "Is the OT environment divided into zones reflecting criticality, for example Purdue levels, cells, or safety?",
                          "shortTitle":  "Zoning by criticality",
                          "rationale":  "Internal zoning limits how far an intruder or malware can move and protects the most critical and safety-related functions. A single large OT zone offers no internal containment.",
                          "goodLooksLike":  "OT is divided into zones and conduits reflecting criticality (Purdue levels, cells, safety), with controlled and monitored conduits between them, in line with ISA/IEC 62443-3-2.",
                          "references":  [
                                             "ISA/IEC 62443-3-2 (zones \u0026 conduits) / 62443-3-3 FR5",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No zoning",
                                              "1":  "Implicit only",
                                              "2":  "Some zones defined",
                                              "3":  "Zones defined and enforced with controlled conduits"
                                          },
                          "capture":  [
                                          {
                                              "id":  "diag",
                                              "type":  "boolean",
                                              "label":  "Diagram reflects zones?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "arch"
                      },
                      {
                          "id":  "arch.3",
                          "prompt":  "How is data exchanged between IT and OT, for example historian or file transfer?",
                          "shortTitle":  "IT to OT data exchange",
                          "rationale":  "Historian, file-transfer and similar flows are necessary but create paths between IT and OT that attackers reuse. Uncontrolled exchange quietly undermines segmentation.",
                          "goodLooksLike":  "IT/OT data exchange goes through a DMZ with brokered, one-way-where-possible flows (for example a data diode or replicated historian), with no direct OT access from IT.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR5 (Restricted Data Flow)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Direct and uncontrolled",
                                              "1":  "Ad hoc",
                                              "2":  "Via a defined path",
                                              "3":  "Via a brokered or controlled mechanism, for example DMZ historian or data diode"
                                          },
                          "capture":  [
                                          {
                                              "id":  "mech",
                                              "type":  "checklist",
                                              "label":  "Mechanisms",
                                              "options":  [
                                                              "Direct DB connection",
                                                              "Shared file server",
                                                              "DMZ historian",
                                                              "Data diode",
                                                              "Manual transfer",
                                                              "Unknown"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "arch"
                      },
                      {
                          "id":  "arch.4",
                          "prompt":  "Is remote access into OT controlled, for both vendors and staff?",
                          "shortTitle":  "Controlled remote access",
                          "rationale":  "Remote access for vendors and staff is convenient and dangerous: it is consistently a top OT attack vector. Uncontrolled or always-on access exposes the plant directly.",
                          "goodLooksLike":  "Remote access is brokered through a hardened gateway with MFA, least privilege, per-session approval and full logging; vendor access is time-bound and monitored.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 (IAC) / FR2 (Use Control)",
                                             "NCSC CAF B2",
                                             "NIST SP 800-82 (remote access)"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Uncontrolled or always-on",
                                              "1":  "Shared credentials or ad hoc",
                                              "2":  "Controlled but broad",
                                              "3":  "Brokered, per-session, and monitored, for example jump host with MFA and time limits"
                                          },
                          "capture":  [
                                          {
                                              "id":  "method",
                                              "type":  "choice",
                                              "label":  "Method",
                                              "options":  [
                                                              "None",
                                                              "Direct VPN",
                                                              "Jump host",
                                                              "Vendor-managed",
                                                              "Brokered access tool"
                                                          ]
                                          },
                                          {
                                              "id":  "mfa",
                                              "type":  "boolean",
                                              "label":  "MFA in use?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "arch"
                      },
                      {
                          "id":  "arch.5",
                          "prompt":  "Are safety systems (SIS) separated from the basic process control network?",
                          "shortTitle":  "Safety system separation",
                          "rationale":  "Safety instrumented systems are the last line of defence for people and plant. If they share a network with basic process control, a single cyber event can degrade safety and control together.",
                          "goodLooksLike":  "Safety systems are separated from the basic process control network by segmentation or air-gap, with strictly controlled and monitored interfaces, consistent with IEC 61511 and ISA/IEC 62443.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR5 (Restricted Data Flow)",
                                             "IEC 61511 (functional safety)",
                                             "NCSC CAF B4"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Integrated with no separation",
                                              "1":  "On the same network",
                                              "2":  "Logically separated",
                                              "3":  "Separated or independent in line with accepted practice"
                                          },
                          "capture":  [
                                          {
                                              "id":  "sis",
                                              "type":  "boolean",
                                              "label":  "SIS present?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "guidance":  "Safety-critical. If no SIS is present, mark not applicable.",
                          "safetyFlag":  true,
                          "domainId":  "arch"
                      },
                      {
                          "id":  "access.1",
                          "prompt":  "Are individual user accounts used, or are shared and generic logins common?",
                          "shortTitle":  "Individual user accounts",
                          "rationale":  "Shared and generic logins are common in OT for operational speed, but they destroy accountability and make misuse impossible to detect or attribute. One compromised shared credential can expose everything.",
                          "goodLooksLike":  "Individual accounts are used wherever the technology allows, with shared operational accounts minimised, justified, vaulted and monitored.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 (Identification \u0026 Authentication Control)",
                                             "NCSC CAF B2",
                                             "NIST CSF Protect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Shared logins everywhere",
                                              "1":  "Mostly shared",
                                              "2":  "Mostly individual",
                                              "3":  "Individual accounts with accountability"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "access.2",
                          "prompt":  "Is access limited to what roles actually need (least privilege)?",
                          "shortTitle":  "Least privilege",
                          "rationale":  "Broad access means a single compromised account can change logic, settings or safety parameters. OT roles are usually narrow, so least privilege is both achievable and high-value.",
                          "goodLooksLike":  "Access is restricted to what each role needs, so an operator account cannot change logic or configuration, and rights are reviewed periodically. Whether administrators hold a separate account for that work is covered by its own question.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR2 (Use Control)",
                                             "NCSC CAF B2",
                                             "NIST CSF Protect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Everyone effectively admin",
                                              "1":  "Broad access",
                                              "2":  "Some role separation",
                                              "3":  "Least privilege enforced"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "access.3",
                          "prompt":  "Are default and vendor passwords changed on OT devices?",
                          "shortTitle":  "Default and vendor passwords",
                          "rationale":  "Default and vendor credentials are publicly known and routinely targeted. In OT they often persist for years on devices that are rarely revisited.",
                          "goodLooksLike":  "Default and vendor passwords are changed at commissioning where supported, recorded in a vault, and checked during audits; compensating controls cover devices that cannot change them.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 (IAC)",
                                             "NCSC CAF B2 / B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Defaults in use",
                                              "1":  "Some changed",
                                              "2":  "Mostly changed",
                                              "3":  "Managed, including credential vaulting"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "access.4",
                          "prompt":  "Is there a process to remove access when people leave or change role?",
                          "shortTitle":  "Access removal on leaver or role change",
                          "rationale":  "Leavers and movers who keep access, especially contractors and vendors, are a persistent insider and supply-chain risk. OT accounts are often never reviewed once created.",
                          "goodLooksLike":  "A joiners, movers and leavers process promptly removes or adjusts OT access, including vendor accounts, backed by periodic access reviews.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 / FR2",
                                             "NCSC CAF B2",
                                             "NIST CSF Protect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Informal",
                                              "2":  "Mostly followed",
                                              "3":  "Reliable joiner, mover, leaver process"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "access.5",
                          "prompt":  "Do OT administrators use a separate account for administrative work, rather than their everyday login?",
                          "shortTitle":  "Separate administrative accounts",
                          "rationale":  "Where one account both reads email and administers a controller, an ordinary phishing click hands over administrative control of the plant.",
                          "goodLooksLike":  "Administrators hold a distinct privileged account used only for administrative work, with no mail or web browsing from it, and everyday accounts hold no standing administrative rights.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 / FR2",
                                             "NCSC CAF B2",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "One account for everything",
                                              "1":  "Separated for some people",
                                              "2":  "Separated for most administrators",
                                              "3":  "Enforced, with no standing rights"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "access.6",
                          "prompt":  "Can highly privileged accounts log on to ordinary OT servers and workstations?",
                          "shortTitle":  "Where privileged accounts can log on",
                          "rationale":  "An administrator who signs in to an engineering workstation leaves credentials there for whoever compromises it next. This is the usual route by which an ordinary foothold in IT becomes control of OT.",
                          "goodLooksLike":  "Privileged accounts are tiered, so the most privileged sign in only to the systems that hold the directory itself and to dedicated admin workstations. OT authenticates separately from corporate IT, or across a controlled one-way trust. On sites with no central directory, the equivalent is that shared administrative credentials are not reused across OT machines.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR1 / FR2",
                                             "NCSC CAF B2",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Privileged accounts log on anywhere",
                                              "1":  "Unrestricted, but recognised as a risk",
                                              "2":  "Restricted in practice",
                                              "3":  "Tiered and technically enforced"
                                          },
                          "capture":  [
                                          {
                                              "id":  "authn",
                                              "type":  "choice",
                                              "label":  "How does OT authenticate?",
                                              "options":  [
                                                              "Shares the corporate directory",
                                                              "Separate OT directory, trusted by corporate",
                                                              "Separate OT directory, no trust",
                                                              "Local accounts only",
                                                              "Mixed",
                                                              "Unknown"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "access"
                      },
                      {
                          "id":  "protect.1",
                          "prompt":  "How are OT systems patched or updated in practice?",
                          "shortTitle":  "OT patching and updates",
                          "rationale":  "OT systems are hard to patch because of uptime, vendor approval and legacy constraints, so unpatched vulnerabilities accumulate. The goal is a safe, risk-based approach, not blind patching.",
                          "goodLooksLike":  "A risk-based patch and update process aligned to maintenance windows and vendor guidance, with compensating controls (segmentation, hardening, monitoring) where patching is not feasible.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR3 (System Integrity)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82 (patch management)"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Never",
                                              "1":  "Rarely or ad hoc",
                                              "2":  "During outages where possible",
                                              "3":  "Risk-based, with compensating controls where patching is not possible"
                                          },
                          "capture":  [
                                          {
                                              "id":  "cadence",
                                              "type":  "choice",
                                              "label":  "Cadence",
                                              "options":  [
                                                              "Never",
                                                              "Ad hoc",
                                                              "Scheduled outages",
                                                              "Risk-based"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.2",
                          "prompt":  "Is malware protection in place where appropriate and supported?",
                          "shortTitle":  "Malware protection",
                          "rationale":  "Malware, including commodity ransomware, remains a leading cause of OT outages. Where endpoints are unsupported, traditional anti-virus may be unsafe, so the approach must suit OT.",
                          "goodLooksLike":  "Appropriate, supported malware protection is deployed where it is safe to do so and kept current, complemented by application allow-listing on fixed-function devices.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR3 (System Integrity)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Partial or outdated",
                                              "2":  "Mostly, with care for OT",
                                              "3":  "Managed and OT-appropriate, including allow-listing where AV is unsuitable"
                                          },
                          "capture":  [
                                          {
                                              "id":  "approach",
                                              "type":  "checklist",
                                              "label":  "Approach",
                                              "options":  [
                                                              "AV on Windows",
                                                              "Application allow-listing",
                                                              "None",
                                                              "Unsupported OS present"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.3",
                          "prompt":  "Is removable media, such as USB, controlled in the OT environment?",
                          "shortTitle":  "Removable media control",
                          "rationale":  "USB and removable media bridge air gaps and are a classic OT infection route, even for isolated systems. Uncontrolled media undermines every other control.",
                          "goodLooksLike":  "Removable media use is restricted and controlled, with scanning or sanitisation stations, port control or allow-listing, and a clear policy for vendors and engineers.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR3 (System Integrity)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Uncontrolled",
                                              "1":  "Policy only",
                                              "2":  "Some technical control",
                                              "3":  "Controlled, for example scanning kiosk or port control"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.4",
                          "prompt":  "Are backups of critical OT systems taken, protected, and tested?",
                          "shortTitle":  "Backups of critical OT systems",
                          "rationale":  "When an OT incident occurs, the ability to restore controllers, HMIs and configurations quickly determines downtime. Backups that are untested, or reachable by ransomware, fail exactly when needed.",
                          "goodLooksLike":  "Critical OT configurations and systems are backed up regularly, stored offline or immutable and segregated from OT, and restoration is tested so recovery time is known.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR7 (Resource Availability)",
                                             "NCSC CAF D1 / B5",
                                             "NIST CSF Recover"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Some, untested",
                                              "2":  "Regular but rarely tested",
                                              "3":  "Regular, protected (offline or immutable), and restore-tested"
                                          },
                          "capture":  [
                                          {
                                              "id":  "restore",
                                              "type":  "boolean",
                                              "label":  "Restore ever tested?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.5",
                          "prompt":  "Are OT endpoints and servers hardened, with unneeded services and ports removed?",
                          "shortTitle":  "Endpoint and server hardening",
                          "rationale":  "OT devices ship with unneeded services, ports and software that widen the attack surface. Hardening reduces exposure on systems that are otherwise difficult to patch.",
                          "goodLooksLike":  "OT endpoints and servers are hardened to a baseline (unneeded services and ports removed, secure configuration), with the baseline maintained through change management.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR3 (System Integrity)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82 / CIS Benchmarks"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Default builds",
                                              "1":  "Minimal",
                                              "2":  "Some hardening",
                                              "3":  "Hardened to a defined standard"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.6",
                          "prompt":  "Is it known which OT systems are unsupported or end-of-life, and is that risk managed?",
                          "shortTitle":  "Legacy and unsupported systems",
                          "rationale":  "Unsupported systems are normal in OT and often cannot be replaced on a security timescale. The risk is rarely that they exist; it is that nobody has written down where they are, so nothing is ever placed around them.",
                          "goodLooksLike":  "End-of-life and unsupported OT systems are identified, the risk is accepted at the right level, and each carries either a compensating control or a funded replacement plan.",
                          "references":  [
                                             "ISA/IEC 62443-2-1 (CSMS)",
                                             "NCSC CAF B4",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Not known",
                                              "1":  "Partly known",
                                              "2":  "Known, managed informally",
                                              "3":  "Known, with a funded plan"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "protect.7",
                          "prompt":  "Is physical access to OT equipment controlled: control rooms, cabinets, and live network ports?",
                          "shortTitle":  "Physical access to OT equipment",
                          "rationale":  "Every logical control assumes nobody can reach the hardware. An unlocked cabinet or a live port in an accessible area bypasses the lot, and this is usually the cheapest gap on a site to close.",
                          "goodLooksLike":  "Control rooms and equipment cabinets are secured and access is limited to those who need it, unused network ports are disabled or protected, and contractor access to plant areas is supervised.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR2 (Use Control)",
                                             "NCSC CAF B2 (Device and physical security)",
                                             "NIST SP 800-82"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Open access",
                                              "1":  "Some areas secured",
                                              "2":  "Mostly controlled",
                                              "3":  "Controlled, including ports and contractors"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "protect"
                      },
                      {
                          "id":  "monitor.1",
                          "prompt":  "Are logs collected from OT systems?",
                          "shortTitle":  "OT log collection",
                          "rationale":  "Without logs from OT systems there is no way to investigate an incident or prove what happened. OT devices often have logging disabled or unretained by default.",
                          "goodLooksLike":  "Relevant logs (controllers where possible, HMIs, jump hosts, OT network devices and security tools) are centrally collected, time-synchronised and retained.",
                          "references":  [
                                             "ISA/IEC 62443-3-3 FR6 (Timely Response to Events)",
                                             "NCSC CAF C1",
                                             "NIST CSF Detect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Local only, unreviewed",
                                              "2":  "Some central collection",
                                              "3":  "Centralised and retained"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "monitor"
                      },
                      {
                          "id":  "monitor.2",
                          "prompt":  "Is there monitoring that would detect an intrusion or abnormal activity in OT?",
                          "shortTitle":  "Intrusion and anomaly detection",
                          "rationale":  "OT intrusions can persist for months unnoticed. Passive OT monitoring detects abnormal activity and new devices without disrupting the process.",
                          "goodLooksLike":  "OT-aware monitoring, such as passive network detection, is in place and tuned for the environment, with alerts triaged by someone who has OT context.",
                          "references":  [
                                             "NCSC CAF C1 / C2",
                                             "ISA/IEC 62443-3-3 FR6",
                                             "NIST CSF Detect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "Reliant on operators noticing",
                                              "2":  "Some monitoring",
                                              "3":  "OT-aware monitoring with alerting"
                                          },
                          "capture":  [
                                          {
                                              "id":  "tool",
                                              "type":  "choice",
                                              "label":  "Tooling",
                                              "options":  [
                                                              "None",
                                                              "IT SIEM only",
                                                              "OT network monitoring",
                                                              "OT NDR + SIEM"
                                                          ]
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "monitor"
                      },
                      {
                          "id":  "monitor.3",
                          "prompt":  "If something happened tonight, would anyone notice, and who?",
                          "shortTitle":  "Out-of-hours awareness and ownership",
                          "rationale":  "Detection only matters if someone is positioned to see and act on it out of hours. Many sites have tools but no one watching, so events go unanswered.",
                          "goodLooksLike":  "Alerts reach a defined team (SOC or on-call) around the clock with OT escalation paths, so abnormal activity is noticed and acted on at any time.",
                          "references":  [
                                             "NCSC CAF C1 (Security monitoring)",
                                             "NIST CSF Detect / Respond"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No",
                                              "1":  "Maybe, by chance",
                                              "2":  "Likely during working hours",
                                              "3":  "Yes, with defined alerting and on-call"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "monitor"
                      },
                      {
                          "id":  "monitor.4",
                          "prompt":  "Does anyone look at OT security events, or are the logs only opened after something goes wrong?",
                          "shortTitle":  "Review of collected events",
                          "rationale":  "Collection without review is a filing cabinet, not detection. Plenty of sites hold OT logs that nobody has ever read until an investigation forced it.",
                          "goodLooksLike":  "OT events are reviewed on a defined cadence, alerts are triaged by a named team, and staff have an easy route to raise something that looks wrong.",
                          "references":  [
                                             "NCSC CAF C2 (Proactive security event discovery)",
                                             "NIST CSF Detect"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Never reviewed",
                                              "1":  "Only after an incident",
                                              "2":  "Reviewed periodically",
                                              "3":  "Triaged routinely, with a reporting route"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "monitor"
                      },
                      {
                          "id":  "monitor.5",
                          "prompt":  "If something were discovered a month later, would enough be recorded to reconstruct it?",
                          "shortTitle":  "Retention and investigability",
                          "rationale":  "OT intrusions are usually found long after they begin. Retention decides whether an investigation can establish what happened, or only that something did.",
                          "goodLooksLike":  "OT records are kept long enough to investigate a late discovery, protected from tampering, and cover the systems that would actually matter.",
                          "references":  [
                                             "NCSC CAF C1 / D2",
                                             "NIST CSF Detect / Respond"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Nothing retained",
                                              "1":  "Days, and patchy",
                                              "2":  "Weeks or months, partial coverage",
                                              "3":  "Retained, protected and complete enough"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "monitor"
                      },
                      {
                          "id":  "respond.1",
                          "prompt":  "Is there an incident response plan that explicitly covers OT?",
                          "shortTitle":  "OT incident response plan",
                          "rationale":  "Generic IT incident plans assume actions (isolate, wipe, reboot) that can be unsafe in OT. An OT-specific plan protects safety and production during the response.",
                          "goodLooksLike":  "An incident response plan explicitly covers OT scenarios, roles, safe containment actions and decision authority, and remains accessible during an outage.",
                          "references":  [
                                             "NCSC CAF D1 (Response \u0026 recovery planning)",
                                             "ISA/IEC 62443-3-3 FR6",
                                             "NIST CSF Respond"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "None",
                                              "1":  "IT-only plan",
                                              "2":  "OT mentioned",
                                              "3":  "OT-specific plan with roles and contacts"
                                          },
                          "capture":  [
                                          {
                                              "id":  "seen",
                                              "type":  "boolean",
                                              "label":  "Plan seen?"
                                          },
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "respond"
                      },
                      {
                          "id":  "respond.2",
                          "prompt":  "Do plant or engineering and security know how to work together in an incident?",
                          "shortTitle":  "Plant and security working together",
                          "rationale":  "OT incidents need plant or engineering and security to act together; if they have never worked out how, response is slow and decisions conflict, risking safety and uptime.",
                          "goodLooksLike":  "Plant or engineering and security have defined, rehearsed ways of working together in an incident, with clear roles and a shared communication route.",
                          "references":  [
                                             "NCSC CAF D1 (Response \u0026 recovery planning)",
                                             "NIST CSF Respond"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No relationship",
                                              "1":  "Ad hoc",
                                              "2":  "Some coordination",
                                              "3":  "Defined roles and joint working"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "respond"
                      },
                      {
                          "id":  "respond.3",
                          "prompt":  "Can critical OT systems be recovered to a known good state, and how quickly?",
                          "shortTitle":  "Recovery to a known good state",
                          "rationale":  "The key OT question is how fast critical systems can be returned to a known-good state. Unknown or slow recovery means extended downtime and pressure to take unsafe shortcuts.",
                          "goodLooksLike":  "Critical OT systems can be recovered to a known-good state from protected backups within a known, acceptable timeframe, and this has been demonstrated rather than assumed.",
                          "references":  [
                                             "NCSC CAF D1",
                                             "ISA/IEC 62443-3-3 FR7 (Resource Availability)",
                                             "NIST CSF Recover"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "No, or unknown",
                                              "1":  "Lengthy and uncertain",
                                              "2":  "Possible with effort",
                                              "3":  "Documented and tested recovery within a known time"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "respond"
                      },
                      {
                          "id":  "respond.4",
                          "prompt":  "Have any exercises or tabletops been run for an OT incident?",
                          "shortTitle":  "OT incident exercises",
                          "rationale":  "Plans that are never exercised fail under pressure. Tabletops surface gaps in roles, contacts and safe actions before a real OT incident does.",
                          "goodLooksLike":  "OT incident scenarios are exercised periodically (tabletop or live), involving operations and engineering, with lessons fed back into the plan.",
                          "references":  [
                                             "NCSC CAF D1 / D2 (Lessons learned)",
                                             "NIST CSF Respond / Recover"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Never",
                                              "1":  "IT-only",
                                              "2":  "Once",
                                              "3":  "Regular, OT-inclusive exercises"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "respond"
                      },
                      {
                          "id":  "respond.5",
                          "prompt":  "Could the plant keep running, or come down safely, with the control system unavailable?",
                          "shortTitle":  "Operating without the control system",
                          "rationale":  "Recovery says how the system is rebuilt; this asks what happens meanwhile. A site that can fall back to manual or safe shutdown has hours or days to recover properly, and one that cannot is forced into decisions it will regret.",
                          "goodLooksLike":  "Degraded and manual modes of operation are identified and documented, operators are practised in them, and the fallback does not depend on the systems that would be unavailable.",
                          "references":  [
                                             "NCSC CAF D1 (Response and recovery planning)",
                                             "NIST SP 800-82",
                                             "NIST CSF Recover"
                                         ],
                          "scored":  true,
                          "allowNA":  true,
                          "bandAnchors":  {
                                              "0":  "Not considered",
                                              "1":  "Assumed, never tested",
                                              "2":  "Documented for key areas",
                                              "3":  "Documented and practised"
                                          },
                          "capture":  [
                                          {
                                              "id":  "notes",
                                              "type":  "text",
                                              "label":  "Notes / evidence"
                                          }
                                      ],
                          "domainId":  "respond"
                      }
                  ],
    "targetDimensionLabelPlural":  "Sites"
};
