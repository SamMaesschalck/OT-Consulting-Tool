/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/ncsc-caf/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["ncsc-caf"] = window.App.Data.instruments["ncsc-caf"] || {};
window.App.Data.instruments["ncsc-caf"].instrument = {
    "id":  "ncsc-caf",
    "title":  "NCSC CAF 4.0 Alignment Assessment (OT focus)",
    "framework":  "NCSC Cyber Assessment Framework",
    "edition":  "4.0",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "caf-achieved",
    "targetDimension":  "site",
    "targetDimensionLabel":  "Site",
    "scoringProfileRef":  "caf-achieved",
    "framing":  "This is an alignment and gap analysis against the NCSC CAF 4.0 indicators of good practice, with an OT focus. It is not a formal CAF assessment and is not a regulatory submission. Contributing outcomes are judged Achieved / Partially Achieved / Not Achieved by the consultant against the IGPs.",
    "sourceNote":  "Structure and the verbatim Indicators of Good Practice (Achieved / Partially Achieved / Not Achieved) are transcribed from the NCSC Cyber Assessment Framework version 4.0. Contains public sector information licensed under the Open Government Licence v3.0. NCSC CAF material is Crown copyright. The IGP statements are reproduced verbatim as the authoritative reference the consultant judges against; the OT lens, state summaries and rationale are SolutionsPT commentary and are not part of the CAF.",
    "attribution":  "Contains public sector information licensed under the Open Government Licence v3.0. Cyber Assessment Framework (CAF) v4.0, National Cyber Security Centre (Crown copyright).",
    "states":  [
                   {
                       "value":  "achieved",
                       "label":  "Achieved",
                       "colour":  "met"
                   },
                   {
                       "value":  "partially",
                       "label":  "Partially Achieved",
                       "colour":  "near"
                   },
                   {
                       "value":  "not",
                       "label":  "Not Achieved",
                       "colour":  "gap"
                   },
                   {
                       "value":  "unknown",
                       "label":  "Unknown",
                       "effect":  "coverage+confidence, not scored"
                   },
                   {
                       "value":  "na",
                       "label":  "Not applicable",
                       "effect":  "excluded"
                   }
               ],
    "taxonomy":  {
                     "objectives":  [
                                        {
                                            "id":  "A",
                                            "name":  "Managing security risk"
                                        },
                                        {
                                            "id":  "B",
                                            "name":  "Protecting against cyber attack"
                                        },
                                        {
                                            "id":  "C",
                                            "name":  "Detecting cyber security events"
                                        },
                                        {
                                            "id":  "D",
                                            "name":  "Minimising the impact of cyber security incidents"
                                        }
                                    ],
                     "principles":  [
                                        {
                                            "id":  "A1",
                                            "objectiveId":  "A",
                                            "name":  "Governance"
                                        },
                                        {
                                            "id":  "A2",
                                            "objectiveId":  "A",
                                            "name":  "Risk Management"
                                        },
                                        {
                                            "id":  "A3",
                                            "objectiveId":  "A",
                                            "name":  "Asset Management"
                                        },
                                        {
                                            "id":  "A4",
                                            "objectiveId":  "A",
                                            "name":  "Supply Chain"
                                        },
                                        {
                                            "id":  "B1",
                                            "objectiveId":  "B",
                                            "name":  "Service Protection Policies, Processes and Procedures"
                                        },
                                        {
                                            "id":  "B2",
                                            "objectiveId":  "B",
                                            "name":  "Identity and Access Control"
                                        },
                                        {
                                            "id":  "B3",
                                            "objectiveId":  "B",
                                            "name":  "Data Security"
                                        },
                                        {
                                            "id":  "B4",
                                            "objectiveId":  "B",
                                            "name":  "System Security"
                                        },
                                        {
                                            "id":  "B5",
                                            "objectiveId":  "B",
                                            "name":  "Resilient Networks and Systems"
                                        },
                                        {
                                            "id":  "B6",
                                            "objectiveId":  "B",
                                            "name":  "Staff Awareness and Training"
                                        },
                                        {
                                            "id":  "C1",
                                            "objectiveId":  "C",
                                            "name":  "Security Monitoring"
                                        },
                                        {
                                            "id":  "C2",
                                            "objectiveId":  "C",
                                            "name":  "Threat Hunting"
                                        },
                                        {
                                            "id":  "D1",
                                            "objectiveId":  "D",
                                            "name":  "Response and Recovery Planning"
                                        },
                                        {
                                            "id":  "D2",
                                            "objectiveId":  "D",
                                            "name":  "Lessons Learned"
                                        }
                                    ]
                 },
    "outcomes":  [
                     {
                         "id":  "A1.a",
                         "principleId":  "A1",
                         "title":  "Board Direction",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "Your organisation\u0027s approach and policy relating to the security of network and information systems supporting the operation of your essential function(s) are owned and managed at board-level. These are communicated, in a meaningful way, to risk management decision-makers across the organisation.",
                                                       "Regular board-level discussions on the security of network and information systems supporting the operation of your essential function(s) take place, based on timely and accurate information and informed by expert guidance.",
                                                       "There is a board-level individual who has overall accountability for the security of network and information systems and drives regular discussion at board-level.",
                                                       "Direction set at board-level is translated into effective organisational practices that direct and control the security of network and information systems supporting your essential function(s).",
                                                       "The board has the information and understanding needed in order to effectively discuss how the security and resilience of network and information systems contributes to the delivery of essential function(s) and what the potential impact from compromise of those systems would be.",
                                                       "Security is recognised as an important enabler for the resilience of your essential function(s) and considered in all relevant discussions."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "The security of network and information systems related to the operation of essential function(s) is not discussed or reported on regularly at board-level.",
                                                  "Board-level discussions on the security of network and information systems are based on partial or out-of-date information, without the benefit of expert guidance.",
                                                  "The security of network and information systems supporting your essential function(s) are not driven effectively by the direction set at board-level.",
                                                  "Senior management or other pockets of the organisation consider themselves exempt from some policies or expect special accommodations to be made."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Board ownership must explicitly cover OT/safety risk, not just IT. In many orgs OT risk never reaches the board.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "PM-1",
                                                             "PM-2"
                                                         ],
                                        "gotchas":  "OT risk is often owned by engineering/operations, not the CISO; board sight of it is frequently absent."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Board sets and owns the cyber/resilience approach; it is discussed and drives decisions at board level.",
                                              "partially":  "Some board awareness and ownership, but not consistent or not translated into decisions.",
                                              "notAchieved":  "Little or no board-level ownership or discussion of cyber risk to the essential function.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Board-level ownership is what gives cyber and resilience work its mandate, funding and priority. Without direction from the top, OT security competes for attention and loses; in many organisations OT risk never reaches the board at all, so it is never genuinely owned."
                     },
                     {
                         "id":  "A1.b",
                         "principleId":  "A1",
                         "title":  "Roles and Responsibilities",
                         "igps":  {
                                      "achieved":  [
                                                       "Key roles and responsibilities for the security of network and information systems supporting your essential function(s) have been identified. These are reviewed regularly to ensure they remain fit for purpose.",
                                                       "Appropriately capable and knowledgeable staff fill those roles and are given the time, authority, and resources to carry out their duties.",
                                                       "There is clarity on who in your organisation has overall accountability for the security of network and information systems supporting your essential function(s)."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "Key roles are missing, left vacant, or fulfilled on an ad-hoc or informal basis.",
                                                  "Staff are assigned security responsibilities but without adequate authority or resources to fulfil them.",
                                                  "Staff are unsure what their responsibilities are for the security of the essential function(s)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Clarify who owns OT security specifically, and the engineering/security split.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "PM-2"
                                                         ],
                                        "gotchas":  "OT security ownership commonly falls between IT security and plant engineering."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Security roles and responsibilities are defined, resourced and held by competent people.",
                                              "partially":  "Roles exist but are unclear, under-resourced, or competence is not assured.",
                                              "notAchieved":  "Roles and responsibilities for security are not established.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Clear roles stop security falling into the gap between IT and engineering, which is the single most common organisational weakness in OT. When everyone assumes someone else owns a control, no one does, and accountability evaporates exactly when an incident needs decisive action."
                     },
                     {
                         "id":  "A1.c",
                         "principleId":  "A1",
                         "title":  "Decision-making",
                         "igps":  {
                                      "achieved":  [
                                                       "Senior management have visibility of key risk decisions made throughout the organisation.",
                                                       "Risk management decision-makers understand their responsibilities for making effective and timely decisions in the context of the risk appetite regarding the essential function(s), as set by senior management.",
                                                       "Risk management decision-making is delegated and escalated where necessary, across the organisation, to people who have the skills, knowledge, tools and authority they need.",
                                                       "Risk management decisions are regularly reviewed to ensure their continued relevance and validity."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "What should be relatively straightforward risk decisions are constantly referred up the chain, or not made.",
                                                  "Risks are resolved informally (or ignored) at a local level when the use of a more formal risk reporting mechanism would be more appropriate.",
                                                  "Decision-makers are unsure of what senior management\u0027s risk appetite is, or only understand it in vague terms such as \"averse\" or \"cautious\".",
                                                  "Decision-makers are unable to justify their risk management decisions.",
                                                  "Organisational structure causes risk decisions to be made in isolation. (e.g. engineering and IT do not talk to each other about risk).",
                                                  "Risk priorities are too vague to make meaningful distinctions between them. (e.g. almost all risks are rated \u0027medium\u0027 or \u0027amber\u0027)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Decisions affecting OT (e.g. connectivity, remote access) need risk-informed senior sign-off.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "PM-1"
                                                         ],
                                        "gotchas":  "OT change decisions are often made on operational grounds with security absent from the table."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Senior accountability for the essential function\u0027s security, with decision-making informed by risk.",
                                              "partially":  "Accountability exists but decision-making is not consistently risk-informed.",
                                              "notAchieved":  "No clear senior accountability for decisions affecting the essential function\u0027s security.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Decisions about the essential function must be made by people who understand both the cyber risk and the operational consequence. Where security decisions are taken without operational input, or operational changes without security input, the result is controls that don\u0027t fit the plant or risks no one signed off."
                     },
                     {
                         "id":  "A2.a",
                         "principleId":  "A2",
                         "title":  "Risk Management Process",
                         "igps":  {
                                      "achieved":  [
                                                       "Your organisational process ensures that security risks to network and information systems relevant to essential function(s) are identified, analysed, prioritised, and managed.",
                                                       "Your approach to risk is focused on the possibility of adverse impact to your essential function(s), leading to a detailed understanding of how such impact might arise as a consequence of possible threat actor actions and the security properties of network and information systems supporting your essential function(s).",
                                                       "Your risk assessments are based on a clearly understood set of threat assumptions, informed by an up-to-date understanding of threats to network and information systems supporting your essential function(s), your sector and wider national infrastructure.",
                                                       "Your risk assessments are informed by an understanding of the vulnerabilities in network and information systems supporting your essential function(s).",
                                                       "The output from your risk management process is a clear set of traceable and prioritised security requirements that will address the risks in line with your organisational approach to security.",
                                                       "Significant conclusions reached in the course of your risk management process are communicated to key security decision-makers and accountable individuals.",
                                                       "Your risk assessments are dynamic and readily updated in the light of relevant changes which may include technical changes to network and information systems supporting your essential function(s), change of use, the introduction of new or emergent technologies or new threat information.",
                                                       "The effectiveness of your risk management process is reviewed regularly, and improvements made as required.",
                                                       "You anticipate technological developments that could be used to adversely impact network and information systems supporting your essential function(s)."
                                                   ],
                                      "partially":  [
                                                        "Your organisational process ensures that security risks to network and information systems relevant to essential function(s) are identified, analysed, prioritised, and managed.",
                                                        "Your risk assessments are informed by an understanding of known and well understood threats and vulnerabilities in network and information systems supporting your essential function(s).",
                                                        "The output from your risk management process is a clear set of security requirements that will address the risks in line with your organisational approach to security.",
                                                        "Significant conclusions reached in the course of your risk management process are communicated to key security decision-makers and accountable individuals.",
                                                        "You conduct risk assessments when significant events potentially affect the essential function(s), such as replacing a system, introducing new or emergent technologies or a change in the cyber security threat."
                                                    ],
                                      "not":  [
                                                  "Risk assessments are not based on a clearly defined set of threat assumptions.",
                                                  "Risk assessment outputs are too complex or unwieldy to be consumed by decision-makers and are not effectively communicated in a clear and timely manner.",
                                                  "Risk assessments for network and information systems supporting your essential function(s) are a \"one-off\" activity or not done at all.",
                                                  "The security elements of projects or programmes are solely dependent on the completion of a risk management assessment without any regard to the outcomes.",
                                                  "There is no systematic process in place to ensure that identified security risks are managed effectively.",
                                                  "Systems are assessed in isolation, without consideration of dependencies and interactions with other systems. (e.g. interactions between IT and OT environments).",
                                                  "Security requirements and mitigations are arbitrary or are applied from a control catalogue without consideration of how they contribute to the security of network and information systems supporting your essential function(s).",
                                                  "Risks remain unresolved on a register for prolonged periods of time awaiting senior decision-making or resource allocation to resolve."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Risk assessment must use OT consequence thinking (safety, availability), not IT CIA priorities.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "RA-1",
                                                             "RA-3",
                                                             "Section 5 (Risk Management)"
                                                         ],
                                        "gotchas":  "Generic IT risk methods understate physical/safety consequence; use consequence-driven OT methods."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A defined, repeated risk management process identifies and prioritises risks to the essential function.",
                                              "partially":  "Risk process exists but is incomplete, ad hoc, or not maintained.",
                                              "notAchieved":  "No effective risk management process for the essential function.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A defined risk process is what turns a list of possible threats into prioritised, justified action. Without it, effort goes wherever the loudest voice points rather than where the consequence is greatest, and in OT the greatest consequence is usually safety and availability, not data loss."
                     },
                     {
                         "id":  "A2.b",
                         "principleId":  "A2",
                         "title":  "Understanding Threat",
                         "igps":  {
                                      "achieved":  [
                                                       "You perform detailed threat analysis and understand how this applies to network and information systems supporting your essential function(s), in the context of your sector and wider national infrastructure.",
                                                       "Your detailed understanding of threat includes the methods and techniques available to capable and well-resourced threat actors and how they could be used systematically against network and information systems supporting your essential function(s).",
                                                       "You use appropriate techniques to develop an understanding of network and information systems supporting your essential function(s) from a threat actor\u0027s perspective. You anticipate probable attack methods and techniques, targets and objectives, and develop plausible scenarios.",
                                                       "You understand the different steps a capable and well-resourced threat actor would need to take to reach the probable target(s).",
                                                       "You identify and justify what measures can be used at each step to reduce the likelihood of the threat actor reaching the probable target(s) or achieving their objective(s).",
                                                       "You maintain a detailed understanding of current threats (e.g. by threat intelligence and proactive research).",
                                                       "You apply your detailed understanding of threat to inform your risk management decision-making.",
                                                       "You have documented the steps required to undertake detailed threat analysis."
                                                   ],
                                      "partially":  [
                                                        "You perform threat analysis and understand how common threats apply to network and information systems supporting your essential function(s).",
                                                        "You understand common types of cyber attacks, including the methods and techniques, and how these might apply to network and information systems supporting your essential function(s). This understanding is kept up to date.",
                                                        "You anticipate what threat actors might target in network and information systems to cause an adverse impact to your essential function(s).",
                                                        "Your understanding of threat is informed by common incidents.",
                                                        "You apply your understanding of threat to inform your risk management decision-making."
                                                    ],
                                      "not":  [
                                                  "You are unable to perform threat analysis.",
                                                  "You do not understand the threats to network and information systems supporting your essential function(s).",
                                                  "You do not have a clearly defined set of threat assumptions.",
                                                  "You do not use your understanding of threat to inform your risk management decisions."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Include OT-specific threats (ICS malware, vendor compromise, safety targeting).",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "RA-3"
                                                         ],
                                        "gotchas":  "OT threat intel is sparser than IT; reference ICS-relevant sources and historical ICS incidents."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Threats to the essential function are understood and inform risk decisions.",
                                              "partially":  "Some threat understanding, but partial or not current.",
                                              "notAchieved":  "Threats to the essential function are not understood.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "You cannot defend against threats you don\u0027t understand. Maintaining a current picture of who might target the essential function and how lets the organisation prepare for the attacks it will actually face rather than generic IT threats that may not apply to a control environment."
                     },
                     {
                         "id":  "A2.c",
                         "principleId":  "A2",
                         "title":  "Assurance",
                         "igps":  {
                                      "achieved":  [
                                                       "You validate that the security measures in place to protect network and information systems supporting your essential function(s) are effective and remain effective for the lifetime over which they are needed.",
                                                       "You understand the assurance methods available to you and choose appropriate methods to gain confidence in the security of network and information systems supporting your essential function(s).",
                                                       "Your confidence in the security as it relates to your technology, people, and processes can be justified to, and verified by, a third party.",
                                                       "Security deficiencies uncovered by assurance activities are assessed, prioritised and remedied when necessary in a timely and effective way.",
                                                       "The methods used for assurance are reviewed to ensure they are working as intended and remain the most appropriate method to use."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "A particular product or service is seen as a \"silver bullet\" and vendor claims are taken at face value.",
                                                  "Assurance methods are applied without appreciation of their strengths and limitations.",
                                                  "Assurance is assumed because there have been no known problems to date."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Assurance in OT must avoid disrupting live process; favour passive/validated methods.",
                                        "relatedSRs":  [
                                                           "SR3.3"
                                                       ],
                                        "related80082":  [
                                                             "CA-2",
                                                             "CA-7"
                                                         ],
                                        "gotchas":  "Active testing on live OT can cause outages; assurance methods must respect availability."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Assurance that controls work as intended, through testing/validation appropriate to the function.",
                                              "partially":  "Some assurance activity but gaps or unverified areas.",
                                              "notAchieved":  "Little or no assurance that controls are effective.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Assurance confirms that the risk picture is real rather than assumed. Without independent challenge, an organisation can believe its risk is well managed right up until an incident proves otherwise; assurance is what catches the gap between the paper position and the operational reality."
                     },
                     {
                         "id":  "A3.a",
                         "principleId":  "A3",
                         "title":  "Asset Management",
                         "igps":  {
                                      "achieved":  [
                                                       "All assets relevant to the secure operation of network and information systems supporting your essential function(s) are identified and inventoried (at a suitable level of detail). The inventory is kept up-to-date.",
                                                       "Dependencies on supporting infrastructure (e.g. power, cooling etc) are recognised and recorded.",
                                                       "You have prioritised your assets according to their importance to the operation of network and information systems supporting your essential function(s).",
                                                       "You have assigned responsibility for managing all assets, including physical assets, relevant to the operation of network and information systems supporting your essential function(s).",
                                                       "Assets relevant to network and information systems supporting your essential function(s) are managed with cyber security in mind throughout their lifecycle, from creation through to eventual decommissioning or disposal."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "Inventories of assets relevant to network and information systems supporting your essential function(s) are incomplete, non-existent or inadequately detailed.",
                                                  "Only certain domains or types of asset are documented and understood. Dependencies between assets are not understood (such as the dependencies between IT and OT).",
                                                  "Information assets, which could include personally identifiable information and / or important / critical data, are stored for long periods of time with no clear business need or retention policy.",
                                                  "Knowledge critical to the management, operation, or recovery of network and information systems supporting your essential function(s) is held by one or two key individuals with no succession plan.",
                                                  "Asset inventories are neglected and out of date."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT asset inventory is foundational and often the weakest area; include firmware/PLC detail.",
                                        "relatedSRs":  [
                                                           "SR7.8"
                                                       ],
                                        "related80082":  [
                                                             "CM-8",
                                                             "Section 6.2"
                                                         ],
                                        "gotchas":  "Passive discovery preferred; active scanning can disrupt fragile OT devices."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Assets supporting the essential function are identified, inventoried and managed through life.",
                                              "partially":  "Partial or outdated asset knowledge.",
                                              "notAchieved":  "Assets are not adequately identified or managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "You cannot protect, patch or monitor what you don\u0027t know is there. A complete, current asset inventory underpins almost every other control, and in OT it is frequently the weakest area, because legacy, undocumented and vendor-installed equipment accumulates over decades."
                     },
                     {
                         "id":  "A4.a",
                         "principleId":  "A4",
                         "title":  "Supply Chain",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "You have a deep understanding of your supply chain, including sub-contractors, and the wider risks it faces.",
                                                       "You consider factors such as your supplier\u0027s ownership, nationality, partnerships, competitors, other organisations with which they sub-contract and their approach to cyber security. These factors inform your risk assessment and are fully considered in your procurement lifecycle processes and purchasing decisions.",
                                                       "Your approach to supply chain risk management considers the risks to network and information systems supporting your essential function(s) arising from supply chain subversion by capable and well-resourced threat actors.",
                                                       "Critical suppliers to network and information systems supporting your essential functions(s) can demonstrate appropriate and proportionate levels of cyber security within the context of capable and well-resourced threat actors.",
                                                       "You have confidence that information held by suppliers that is essential to the operation of network and information systems supporting your essential function(s) is appropriately protected from capable and well-resourced threat actors.",
                                                       "You understand which contracts are relevant and you include appropriate security obligations, in relevant contracts.",
                                                       "You have a proactive approach to contract management which may include a contract management plan for relevant contracts.",
                                                       "Customer / supplier ownership of responsibilities is defined in contracts.",
                                                       "All network connections and data sharing with third parties are managed effectively and proportionately.",
                                                       "When appropriate, your incident management process and that of your suppliers provide mutual support in the resolution of incidents."
                                                   ],
                                      "partially":  [
                                                        "You understand the general risks suppliers may pose to network and information systems supporting your essential function(s).",
                                                        "You know the extent of your supply chain that supports network and information systems supporting your essential function(s), including sub-contractors.",
                                                        "Suppliers to network and information systems that support your essential function(s) can demonstrate appropriate and proportionate levels of cyber security within the context of common threats.",
                                                        "You understand which contracts are relevant and you include appropriate security obligations, in relevant contracts.",
                                                        "You are aware of all third-party connections and have assurance that they meet your organisation\u0027s security requirements.",
                                                        "Your approach to security incident management considers incidents that might arise in your supply chain.",
                                                        "You have confidence that information held by suppliers that is necessary for the operation of network and information systems supporting your essential function(s) is appropriately protected from common threats."
                                                    ],
                                      "not":  [
                                                  "You do not know what data belonging to you is held by suppliers, or how it is managed.",
                                                  "Elements of the supply chain for network and information systems supporting your essential function(s) are subcontracted and you have little or no visibility of the sub-contractors.",
                                                  "You have no understanding of which contracts are relevant and / or relevant contracts do not specify appropriate security obligations.",
                                                  "Suppliers have access to network and information systems that support your essential function(s) that is unrestricted, not monitored or bypasses your own security controls."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT vendors often have deep remote access; integrator and OEM risk is central.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "SR-1",
                                                             "SA-12"
                                                         ],
                                        "gotchas":  "OT maintenance contracts frequently grant standing vendor access that is rarely reviewed."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Supply chain risk to the essential function is understood and managed.",
                                              "partially":  "Some supplier risk management but incomplete.",
                                              "notAchieved":  "Supply chain risk is not managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Suppliers and integrators often hold deep, standing access to OT and supply the firmware and software the asset owner cannot fully inspect. Supply chain compromise turns a trusted route into an attack path, so managing supplier risk is managing one of the most direct ways into the environment."
                     },
                     {
                         "id":  "A4.b",
                         "principleId":  "A4",
                         "title":  "Secure Software Development and Support",
                         "igps":  {
                                      "achieved":  [
                                                       "Your software supplier(s) leverages an established secure software development framework (e.g. NIST Secure Software Development Framework (SSDF), Microsoft Secure Development Lifecycle (SDL)).",
                                                       "Your software supplier can demonstrate a thorough understanding of the composition and provenance of software provided to you, including any third-party components used in the development of that software, and those components are being monitored for new vulnerabilities throughout the lifespan of the product.",
                                                       "You consider the security of environments (e.g. development, test, and production), including source code and repositories, used in the production of software to be appropriate and proportionate within the context of capable and well-resourced threat actors.",
                                                       "The software development lifecycle is informed by a detailed and up to date understanding of threat and applies appropriate techniques, such as threat modelling, to identify and assess potential vulnerabilities and attack vectors.",
                                                       "You can attest to the authenticity and integrity of software, including updates and patches."
                                                   ],
                                      "partially":  [
                                                        "Your software supplier leverages secure development principles and practices.",
                                                        "Your software supplier(s) can demonstrate a limited understanding of the composition and provenance of software provided to you.",
                                                        "You consider the security of environments (e.g. development, test and production), including source code and repositories, used in the production of software to be appropriate and proportionate within the context of common threats.",
                                                        "The testing regime uses a range of different approaches (e.g. static and dynamic analysis, unit and integration testing and point in time assessments) that verify all aspects of the development lifecycle covering both functional and non-functional testing.",
                                                        "You have arrangements in place with your software supplier to receive timely security updates, patches and notifications.",
                                                        "Software, including updates and patches, is obtained from your supplier(s) via secure channels.",
                                                        "Your software supplier(s) has processes in place to identify, report and mitigate security vulnerabilities.",
                                                        "You have arrangements in place with your software supplier to be notified of any significant events that may adversely impact network and information systems supporting your essential function(s).",
                                                        "If open-source software is used, you have taken appropriate and proportionate steps to establish and maintain sufficient confidence in its security for its use.",
                                                        "You have appropriate support and maintenance arrangements in place."
                                                    ],
                                      "not":  [
                                                  "Your software supplier(s) is unaware of the composition and provenance of software provided to you.",
                                                  "Software, including updates and patches, undergoes little to no testing.",
                                                  "Updates and patches often introduce new problems or fail to address existing issues.",
                                                  "Vulnerabilities are discovered in software despite the negligible difficulty of implementing mitigations."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Covers OEM firmware and application support; patch availability and support lifecycle matter.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "SA-3",
                                                             "SA-10"
                                                         ],
                                        "gotchas":  "Many OT products are end-of-support yet still in service; document compensating controls."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Software/products are developed and supported securely across the supply relationship.",
                                              "partially":  "Partial secure development/support assurance.",
                                              "notAchieved":  "No assurance of secure development or support.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Software built or maintained without security in mind ships vulnerabilities straight into the control system. Secure development and support practices, whether in-house or demanded of suppliers, stop weaknesses being introduced through the very process meant to keep the system running."
                     },
                     {
                         "id":  "B1.a",
                         "principleId":  "B1",
                         "title":  "Policy, Process and Procedure Development",
                         "igps":  {
                                      "achieved":  [
                                                       "You fully document your overarching security governance and risk management approach, technical security practice and specific regulatory compliance.",
                                                       "Cyber security is integrated and embedded throughout policies, processes and procedures and key performance indicators are reported to your executive management.",
                                                       "Your organisation\u0027s policies, processes and procedures are developed to be practical, usable and appropriate to mitigate the risk of adverse impact to network and information systems supporting your essential function(s).",
                                                       "Policies, processes and procedures that rely on user behaviour are practical, appropriate and achievable.",
                                                       "You review and update policies, processes and procedures at suitably regular intervals to ensure they remain relevant. This is in addition to reviews following a major cyber security incident.",
                                                       "Any changes to the essential function(s) or the threat it faces triggers a review of policies, processes and procedures.",
                                                       "Your systems are designed so that they remain secure even when user security policies, processes and procedures are not always followed."
                                                   ],
                                      "partially":  [
                                                        "Your policies, processes and procedures document your overarching security governance and risk management approach, technical security practice and specific regulatory compliance.",
                                                        "You review and update policies, processes and procedures in response to major cyber security incidents."
                                                    ],
                                      "not":  [
                                                  "Your policies, processes and procedures are absent or incomplete.",
                                                  "Policies, processes and procedures are not applied universally or consistently.",
                                                  "People often or routinely circumvent policies, processes and procedures to achieve business objectives.",
                                                  "Your organisation\u0027s security governance and risk management approach has no bearing on your policies, processes and procedures.",
                                                  "System security is totally reliant on users\u0027 careful and consistent application of manual security processes.",
                                                  "Policies, processes and procedures have not been reviewed in response to major changes (e.g. technology or regulatory framework), or within a suitable period.",
                                                  "Policies, processes and procedures are not readily available to staff, too detailed to remember, or too hard to understand."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Policies must address OT realities (patching constraints, remote access, removable media).",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "Section 6 (Program)"
                                                         ],
                                        "gotchas":  "IT policies copied to OT often cannot be followed and get ignored; tailor them."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Security policies, processes and procedures are developed to protect the essential function.",
                                              "partially":  "Policies exist but are incomplete or not OT-specific.",
                                              "notAchieved":  "Inadequate security policies/processes.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Policy is where the organisation decides, in advance and consistently, how it will protect the essential function. Without developed policy, protection depends on individual memory and goodwill, which varies by person and shift and cannot be assured or audited."
                     },
                     {
                         "id":  "B1.b",
                         "principleId":  "B1",
                         "title":  "Policy, Process and Procedure Implementation",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "All your policies, processes and procedures are followed, their correct application and security effectiveness is evaluated.",
                                                       "Your policies, processes and procedures are integrated with other organisational policies, processes and procedures, including HR assessments of individuals\u0027 trustworthiness.",
                                                       "Your policies, processes and procedures are effectively and appropriately communicated across all levels of the organisation resulting in good staff awareness of their responsibilities.",
                                                       "Appropriate action is taken to address all breaches of policies, processes and procedures with potential to adversely impact the essential function(s) including aggregated breaches."
                                                   ],
                                      "partially":  [
                                                        "Most of your policies, processes and procedures are followed and their application is monitored.",
                                                        "Your policies, processes and procedures are integrated with other organisational policies, processes and procedures, including HR assessments of individuals\u0027 trustworthiness.",
                                                        "All staff are aware of their responsibilities under your policies, processes and procedures.",
                                                        "All breaches of policies, processes and procedures with the potential to adversely impact the essential function(s) are fully investigated. Other breaches are tracked, assessed for trends and action is taken to understand and address."
                                                    ],
                                      "not":  [
                                                  "Policies, processes and procedures are ignored or only partially followed.",
                                                  "How your policies, processes and procedures support the resilience of your essential function(s) is not well understood.",
                                                  "Staff are unaware of their responsibilities under your policies, processes and procedures.",
                                                  "You do not attempt to detect breaches of policies, processes and procedures.",
                                                  "Policies, processes and procedures lack integration with other organisational policies, processes and procedures.",
                                                  "Your policies, processes and procedures are not well communicated across your organisation."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Check real practice on the plant floor, not just documented intent.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [

                                                         ],
                                        "gotchas":  "Plant practice frequently diverges from corporate policy; verify on site."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Policies and processes are followed and embedded in practice.",
                                              "partially":  "Partial adherence; gaps between policy and practice.",
                                              "notAchieved":  "Policies are not followed in practice.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A policy that exists only on paper protects nothing. Implementation, embedding the policy into how people actually work, is what turns intent into protection, and the gap between written and practised is where many assessments find the real exposure."
                     },
                     {
                         "id":  "B2.a",
                         "principleId":  "B2",
                         "title":  "Identity Verification, Authentication and Authorisation",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "Your process of initial identity verification is robust enough to provide a high level of confidence of a user\u0027s identity profile before allowing an authorised user access to network and information systems that support your essential function(s).",
                                                       "Only authorised and individually authenticated users can physically access and logically connect to your network or information systems on which your essential function(s) depends.",
                                                       "The number of authorised users and systems that have access to network and information systems is limited to the minimum necessary to support your essential function(s).",
                                                       "You use additional strong authentication mechanisms, such as multi-factor authentication (MFA), for all user access, including remote access, to all network and information systems that operate or support your essential function(s).",
                                                       "The list of users and systems with access to network and information systems supporting and delivering the essential function(s) is reviewed on a regular basis, at least every six months.",
                                                       "Your approach to authenticating users, devices and systems follows up to date best practice."
                                                   ],
                                      "partially":  [
                                                        "Your process of initial identity verification is robust enough to provide a reasonable level of confidence of a user\u0027s identity profile before allowing an authorised user access to network and information systems that support your essential function(s).",
                                                        "All authorised users and systems with access to network and information systems supporting your essential function(s) are individually identified and authenticated.",
                                                        "The number of authorised users and systems that have access to network and information systems is limited to the minimum necessary to support your essential function(s).",
                                                        "You use additional strong authentication mechanisms, such as multi-factor authentication (MFA), for privileged access to all network and information systems that operate or support your essential function(s).",
                                                        "You individually authenticate and authorise all remote access to all network and information systems that support your essential function(s).",
                                                        "The list of users and systems with access to network and information systems supporting and delivering the essential function(s) is reviewed on a regular basis, at least annually.",
                                                        "Your approach to authenticating users, devices and systems follows up to date best practice."
                                                    ],
                                      "not":  [
                                                  "Initial identity verification is not robust enough to provide an acceptable level of confidence of a user\u0027s identity profile.",
                                                  "Authorised users and systems with access to networks or information systems on which your essential function(s) depends cannot be individually identified.",
                                                  "Unauthorised individuals or devices can access your network or information systems on which your essential function(s) depends.",
                                                  "The number of authorised users and systems that have access to network and information systems is not limited to the minimum necessary to support your essential function(s).",
                                                  "Your approach to authenticating users, devices and systems does not follow up to date best practice."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Shared HMI/engineering logins are the norm in OT and the key weakness here.",
                                        "relatedSRs":  [
                                                           "SR1.1",
                                                           "SR1.2",
                                                           "SR2.1"
                                                       ],
                                        "related80082":  [
                                                             "IA-2",
                                                             "AC-3"
                                                         ],
                                        "gotchas":  "Individual auth is hard on legacy HMIs; note compensating controls where MFA is impossible."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Access is robustly verified, authenticated and authorised for the essential function\u0027s systems.",
                                              "partially":  "Authentication/authorisation partial or inconsistent.",
                                              "notAchieved":  "Weak or absent identity verification/authentication.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Verifying who and what is connecting is the foundation of access control. In OT, shared logins and unauthenticated access are common and convenient, which is exactly why establishing real identity, authentication and authorisation is both important and hard."
                     },
                     {
                         "id":  "B2.b",
                         "principleId":  "B2",
                         "title":  "Device Management",
                         "igps":  {
                                      "achieved":  [
                                                       "All privileged operations performed on network and information systems supporting your essential function(s) are conducted from highly trusted devices, such as Privileged Access Workstations, dedicated solely to those operations.",
                                                       "You either obtain independent and professional assurance of the security of third-party devices or networks before they connect to network and information systems, or you only allow third-party devices or networks that are dedicated to supporting network and information systems to connect.",
                                                       "You perform certificate-based device identity management and only allow known devices to access systems necessary for the operation of your essential function(s).",
                                                       "You perform regular scans to detect unknown devices and investigate any findings."
                                                   ],
                                      "partially":  [
                                                        "Only corporately owned and managed devices can access your essential function(s) network and information systems.",
                                                        "All privileged operations are performed from corporately owned and managed devices. These devices provide sufficient separation, using a risk-based approach, from the activities of standard users.",
                                                        "You have sought to understand the security properties of third-party devices and networks before they can be connected to your systems. You have taken appropriate steps to mitigate any risks identified.",
                                                        "The act of connecting to a network port or cable does not grant access to any systems.",
                                                        "You are able to detect unknown devices being connected to network and information systems and investigate such incidents."
                                                    ],
                                      "not":  [
                                                  "Users can connect to network and information systems supporting your essential function(s) using devices that are not corporately owned and managed.",
                                                  "Privileged users can perform privileged operations from devices that are not corporately owned and managed.",
                                                  "You have not gained assurance in the security of any third-party devices or networks connected to your systems.",
                                                  "Physically connecting a device to network and information systems gives that device access without device or user authentication."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Covers engineering laptops, transient and vendor devices on the OT network.",
                                        "relatedSRs":  [
                                                           "SR1.2",
                                                           "SR2.3"
                                                       ],
                                        "related80082":  [
                                                             "CM-8"
                                                         ],
                                        "gotchas":  "Transient/contractor devices are a major OT vector and often unmanaged."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Devices accessing the essential function are managed and trusted.",
                                              "partially":  "Partial device management.",
                                              "notAchieved":  "Devices are not managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Engineering laptops, transient devices and vendor equipment move on and off the OT network carrying whatever they picked up elsewhere. Managing those devices closes one of the most common infection routes into otherwise well-isolated control environments."
                     },
                     {
                         "id":  "B2.c",
                         "principleId":  "B2",
                         "title":  "Privileged User Management",
                         "igps":  {
                                      "achieved":  [
                                                       "Privileged user access to network and information systems supporting your essential function(s) is carried out from dedicated separate accounts that are closely monitored and managed.",
                                                       "The issuing of temporary, time-bound rights for privileged user access and / or external third-party support access is in place.",
                                                       "Privileged user access rights are regularly reviewed and always updated as part of your joiners, movers and leavers process.",
                                                       "All privileged user activity is routinely reviewed, validated and recorded for offline analysis and investigation."
                                                   ],
                                      "partially":  [
                                                        "All privileged user access to network and information systems supporting your essential function(s) requires strong authentication, such as multi-factor authentication (MFA).",
                                                        "The identities of the individuals with privileged access to network and information systems (infrastructure, platforms, software, configuration etc) supporting your essential function(s) are known and managed. This includes third parties.",
                                                        "Activity by privileged users is routinely reviewed and validated (e.g. at least annually).",
                                                        "Privileged users are only granted specific privileged user access rights which are essential to their business role or function."
                                                    ],
                                      "not":  [
                                                  "The identities of the individuals with privileged access to network and information systems (infrastructure, platforms, software, configuration etc) supporting your essential function(s) are not known or not managed.",
                                                  "Privileged user access to network and information systems supporting your essential function(s) is via weak authentication mechanisms (e.g. only simple passwords).",
                                                  "The list of privileged users has not been reviewed recently (e.g. within the last 12 months).",
                                                  "Privileged user access is granted on a system-wide basis rather than by role or function(s).",
                                                  "Privileged user access to network and information systems supporting your essential function(s) is via generic, shared or default name accounts.",
                                                  "Where there are \"always on\" terminals which can perform privileged actions (such as in a control room), there are no additional controls (e.g. physical controls) to ensure access is appropriately restricted.",
                                                  "There is no logical separation between roles that an individual may have and hence the actions they perform (e.g. access to corporate email and privilege user actions)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Engineering and admin access to controllers is the highest-impact access in OT.",
                                        "relatedSRs":  [
                                                           "SR1.1",
                                                           "SR2.1"
                                                       ],
                                        "related80082":  [
                                                             "AC-6"
                                                         ],
                                        "gotchas":  "Standing admin on engineering workstations is common; least privilege is rare in OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Privileged access is tightly controlled and monitored.",
                                              "partially":  "Some privileged access control but gaps.",
                                              "notAchieved":  "Privileged access is uncontrolled.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Privileged accounts can change the process itself, so their compromise is among the most serious outcomes in OT. Tight management of who holds elevated rights, and when, limits both external attackers who seek those accounts and the damage a single mistake can cause."
                     },
                     {
                         "id":  "B2.d",
                         "principleId":  "B2",
                         "title":  "Identity and Access Management (IdAM)",
                         "igps":  {
                                      "achieved":  [
                                                       "You follow a robust procedure to verify each user and issue the minimum required access rights, and the application of the procedure is regularly audited.",
                                                       "User access rights are reviewed both when people change roles via your joiners, leavers and movers process and at regular intervals Ã¢â‚¬\" at least annually.",
                                                       "All user, device and systems access to network and information systems supporting your essential function(s) is logged and monitored.",
                                                       "You regularly review access logs and correlate this data with other access records and expected activity.",
                                                       "Attempts by unauthorised users, devices or systems to connect to network and information systems supporting your essential function(s) are alerted, promptly assessed and investigated."
                                                   ],
                                      "partially":  [
                                                        "You follow a robust procedure to verify each user and issue the minimum required access rights.",
                                                        "You regularly review access rights and those no longer needed are revoked.",
                                                        "User access rights are reviewed when users change roles via your joiners, leavers and movers process.",
                                                        "All user, device and system access to the systems supporting the essential function(s) is logged and monitored, but it is not compared to other log data or access records."
                                                    ],
                                      "not":  [
                                                  "Greater access rights are granted than necessary.",
                                                  "Identity validation and requirement for access of a user, device or systems is not carried out.",
                                                  "User access rights are not reviewed when users change roles.",
                                                  "User access rights remain active when users leave your organisation.",
                                                  "Access rights granted to devices or systems to access other devices and systems are not reviewed on a regular basis (at least annually)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT often lacks central IdAM; accounts are local to devices.",
                                        "relatedSRs":  [
                                                           "SR1.3",
                                                           "SR1.4",
                                                           "SR1.5"
                                                       ],
                                        "related80082":  [
                                                             "AC-2",
                                                             "IA-4"
                                                         ],
                                        "gotchas":  "Centralised IdAM may be impractical for legacy OT; document the realistic target."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Identity and access management is coherent and managed across the function.",
                                              "partially":  "IdAM partial or fragmented.",
                                              "notAchieved":  "No coherent IdAM.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Access that is granted and never reviewed accumulates into a standing risk, with old accounts and excess rights lingering for years. Managing identity and access across its whole lifecycle keeps the set of who-can-do-what aligned with who actually needs it."
                     },
                     {
                         "id":  "B3.a",
                         "principleId":  "B3",
                         "title":  "Understanding Data",
                         "igps":  {
                                      "achieved":  [
                                                       "You have identified and catalogued all the data important to the operation of network and information systems supporting your essential function(s), or that would assist a threat actor.",
                                                       "You have identified and catalogued who has access to the data important to the operation of network and information systems supporting your essential function(s).",
                                                       "You maintain a current understanding of the location, quantity and quality of data important to the operation of network and information systems supporting your essential function(s).",
                                                       "You take steps to remove or minimise unnecessary copies or unneeded historic data.",
                                                       "You have identified all mobile devices and media that may hold data important to the operation of network and information systems supporting your essential function(s).",
                                                       "You maintain a current understanding of the data links used to transmit data that is important to network and information systems supporting your essential function(s).",
                                                       "You understand the context, limitations and dependencies of your important data.",
                                                       "You understand and document the impact on your essential function(s) of all relevant scenarios, including unauthorised data access, uncontrolled release, modification or deletion, or when authorised users are unable to appropriately access this data.",
                                                       "You validate these documented impact statements regularly, at least annually."
                                                   ],
                                      "partially":  [
                                                        "You have identified and catalogued all the data important to the operation of network and information systems supporting your essential function(s), or that would assist a threat actor.",
                                                        "You have identified and catalogued who has access to the data important to the operation of network and information systems supporting your essential function(s).",
                                                        "You regularly review location, transmission, quantity and quality of data important to the operation of network and information systems supporting your essential function(s).",
                                                        "You have identified all mobile devices and media that hold data important to the operation of network and information systems supporting your essential function(s).",
                                                        "You understand and document the impact on your essential function(s) of all relevant scenarios, including unauthorised data access, uncontrolled release, modification or deletion, or when authorised users are unable to appropriately access this data.",
                                                        "You occasionally validate these documented impact statements."
                                                    ],
                                      "not":  [
                                                  "You have incomplete knowledge of what data is used by and produced in the operation of network and information systems supporting your essential function(s).",
                                                  "You have not identified the important data on which network and information systems supporting your essential function(s) relies.",
                                                  "You have not identified who has access to data important to the operation of network and information systems supporting your essential function(s).",
                                                  "You have not clearly articulated the impact of data compromise or lack of availability."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT \u0027data\u0027 includes process values, recipes, logic, configuration, historian data.",
                                        "relatedSRs":  [
                                                           "SR4.1"
                                                       ],
                                        "related80082":  [
                                                             "Section 6"
                                                         ],
                                        "gotchas":  "Integrity of process data usually matters more than confidentiality in OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "The data important to the essential function is understood and its protection needs known.",
                                              "partially":  "Partial understanding of important data.",
                                              "notAchieved":  "Important data is not understood.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "You cannot protect data appropriately until you know what you hold and why it matters. In OT this includes process values, configuration and logic whose integrity affects physical operation, not just conventional records, and mis-judging their importance leads to either over- or under-protection."
                     },
                     {
                         "id":  "B3.b",
                         "principleId":  "B3",
                         "title":  "Data in Transit",
                         "igps":  {
                                      "achieved":  [
                                                       "You have identified and protected (effectively and proportionately) all the data links that carry data important to the operation of your essential function(s).",
                                                       "You apply appropriate physical and / or technical means (e.g. cryptography) to protect data that travels over non-trusted or openly accessible carriers, with justified confidence in the robustness of the protection applied.",
                                                       "Suitable alternative transmission paths are available where there is a significant risk of impact on the operation of the essential function(s) due to resource limitation (e.g. transmission equipment or function failure, or important data being blocked or jammed)."
                                                   ],
                                      "partially":  [
                                                        "You have identified and protected (effectively and proportionately) all the data links that carry data important to the operation of your essential function(s).",
                                                        "You apply appropriate physical and / or technical means (e.g. cryptography) to protect data that travels over non-trusted or openly accessible carriers, but you have limited or no confidence in the robustness of the protection applied."
                                                    ],
                                      "not":  [
                                                  "You do not know what all your data links are, or which carry data important to the operation of the essential function(s).",
                                                  "Data important to the operation of the essential function(s) travels without technical protection over non-trusted or openly accessible carriers.",
                                                  "Critical data paths that could fail, be jammed, be overloaded, etc. have no alternative path."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Many OT protocols are unauthenticated/cleartext; protection is often at the network layer.",
                                        "relatedSRs":  [
                                                           "SR3.1",
                                                           "SR4.1"
                                                       ],
                                        "related80082":  [
                                                             "SC-8"
                                                         ],
                                        "gotchas":  "Legacy protocols (Modbus, DNP3) lack native protection; segment rather than encrypt in place."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Data in transit is protected appropriately.",
                                              "partially":  "Partial protection of data in transit.",
                                              "notAchieved":  "Data in transit is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Data moving across the network can be read or altered in transit, and in OT an altered setpoint or command has physical consequences. Protecting data in transit guards both its confidentiality where that matters and, more importantly for control systems, its integrity."
                     },
                     {
                         "id":  "B3.c",
                         "principleId":  "B3",
                         "title":  "Stored Data",
                         "igps":  {
                                      "achieved":  [
                                                       "All copies of data important to the operation of network and information systems supporting your essential function(s) are necessary. Where this important data is transferred to less secure systems, the data is provided with limited detail and / or as a read-only copy.",
                                                       "You have applied suitable physical and / or technical means to protect this important stored data from unauthorised access, modification or deletion.",
                                                       "If cryptographic protections are used you apply suitable technical and procedural means, and you have justified confidence in the robustness of the protection applied.",
                                                       "You have suitable, secured backups of data to allow the operation of network and information systems supporting your essential function(s) to continue should the original data not be available. This may include off-line or segregated backups, or appropriate alternative forms such as paper copies.",
                                                       "Necessary historic or archive data is suitably secured in storage."
                                                   ],
                                      "partially":  [
                                                        "All copies of data important to the operation of network and information systems supporting your essential function(s) are necessary. Where this important data is transferred to less secure systems, the data is provided with limited detail and / or as a read-only copy.",
                                                        "You have applied suitable physical and / or technical means to protect this important stored data from unauthorised access, modification or deletion.",
                                                        "If cryptographic protections are used you apply suitable technical and procedural means, but you have limited or no confidence in the robustness of the protection applied.",
                                                        "You have suitable, secured backups of data to allow the operation of network and information systems supporting your essential function(s) to continue should the original data not be available. This may include off-line or segregated backups, or appropriate alternative forms such as paper copies."
                                                    ],
                                      "not":  [
                                                  "You have no, or limited, knowledge of where data important to the operation of network and information systems supporting your essential function(s) is stored.",
                                                  "You have not protected vulnerable stored data important to the operation of network and information systems supporting your essential function(s) in a suitable way.",
                                                  "Backups are incomplete, untested, not adequately secured or could be inaccessible in a disaster recovery or business continuity situation."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Covers historian, engineering stores, backups of logic/config.",
                                        "relatedSRs":  [
                                                           "SR4.1",
                                                           "SR3.4"
                                                       ],
                                        "related80082":  [
                                                             "SC-28"
                                                         ],
                                        "gotchas":  "Config/logic backups are sensitive; protect their storage and integrity."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Stored data is protected appropriately.",
                                              "partially":  "Partial protection of stored data.",
                                              "notAchieved":  "Stored data is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Stored data, configuration, credentials, historian records, is a target both for theft and for tampering that could mask or enable an attack. Protecting it at rest limits what an intruder gains from reaching a store and what they can quietly change."
                     },
                     {
                         "id":  "B3.d",
                         "principleId":  "B3",
                         "title":  "Mobile Data",
                         "igps":  {
                                      "achieved":  [
                                                       "Mobile devices that hold data that is important to the operation of network and information systems supporting your essential function(s) are catalogued, are under your organisation\u0027s control and configured according to best practice for the platform, with appropriate technical and procedural policies in place.",
                                                       "Your organisation can remotely wipe all mobile devices holding data important to the operation of network and information systems supporting your essential function(s).",
                                                       "You have minimised this data on these mobile devices. Some data may be automatically deleted off mobile devices after a certain period."
                                                   ],
                                      "partially":  [
                                                        "You know which mobile devices hold data important to the operation of network and information systems supporting your essential function(s).",
                                                        "Data important to the operation of network and information systems supporting your essential function(s) is stored on mobile devices only when they have at least the security standard aligned to your overarching security policies.",
                                                        "Data on mobile devices is technically secured."
                                                    ],
                                      "not":  [
                                                  "You do not know which mobile devices may hold data important to the operation of network and information systems supporting your essential function(s).",
                                                  "You allow data important to the operation of network and information systems supporting your essential function(s) to be stored on devices not managed by your organisation, or to at least equivalent standard.",
                                                  "Data on mobile devices is not technically secured, or only some is secured."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Engineering laptops carrying project files/logic off-site are the main concern.",
                                        "relatedSRs":  [
                                                           "SR4.1"
                                                       ],
                                        "related80082":  [
                                                             "MP-5"
                                                         ],
                                        "gotchas":  "Project files on engineering laptops are a quiet exfiltration/loss risk."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Mobile data is protected.",
                                              "partially":  "Partial mobile data protection.",
                                              "notAchieved":  "Mobile data is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Data on mobile and removable media leaves the controlled environment and travels where the organisation\u0027s controls don\u0027t reach. Managing it limits both loss of sensitive configuration and the well-known OT risk of removable media carrying malware back in."
                     },
                     {
                         "id":  "B3.e",
                         "principleId":  "B3",
                         "title":  "Media / Equipment Sanitisation",
                         "igps":  {
                                      "achieved":  [
                                                       "You catalogue and track all devices that contain data important to the operation of network and information systems supporting your essential function(s) (whether a specific storage device or one with integral storage).",
                                                       "Data important to the operation of network and information systems supporting your essential function(s) is removed from all devices, equipment and removable media before reuse and / or disposal using an assured product or service."
                                                   ],
                                      "partially":  [
                                                        "Data important to the operations of network and information systems supporting your essential function(s) is removed from all devices, equipment and removable media before reuse and / or disposal."
                                                    ],
                                      "not":  [
                                                  "Some or all devices, equipment or removable media that hold data important to the operation of network and information systems supporting your essential function(s) are reused or disposed of without sanitisation of that data."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Decommissioned controllers/drives may retain logic, credentials, network detail.",
                                        "relatedSRs":  [
                                                           "SR4.2"
                                                       ],
                                        "related80082":  [
                                                             "MP-6"
                                                         ],
                                        "gotchas":  "Old OT kit sold/scrapped with config intact is a real leakage path."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Media and equipment are sanitised before disposal/reuse.",
                                              "partially":  "Partial sanitisation practice.",
                                              "notAchieved":  "No reliable sanitisation.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Equipment and media reach end of life still holding configuration, credentials and network detail useful to an attacker. Proper sanitisation ensures that decommissioned kit doesn\u0027t hand over a map of the environment when it leaves the organisation\u0027s control."
                     },
                     {
                         "id":  "B4.a",
                         "principleId":  "B4",
                         "title":  "Secure by Design",
                         "igps":  {
                                      "achieved":  [
                                                       "You employ appropriate expertise to design network and information systems supporting your essential function(s).",
                                                       "Network and information systems are segregated into appropriate security zones (e.g. systems supporting the essential function(s) are segregated in a highly trusted, more secure zone).",
                                                       "The network and information systems supporting your essential function(s) are designed to have simple data flows between components to support effective security monitoring.",
                                                       "The network and information systems supporting your essential function(s) are designed to be easy to recover.",
                                                       "Content-based attacks are mitigated for all inputs to network and information systems that affect the essential function(s) (e.g. via transformation and inspection / sanitisation and validation).",
                                                       "If automated decision-making technologies are in use, you design and apply appropriate restrictions to prevent actions that could have an adverse impact on network and information systems supporting your essential function(s)."
                                                   ],
                                      "partially":  [
                                                        "You employ appropriate expertise to design network and information systems supporting your essential function(s).",
                                                        "You design strong boundary defences where network and information systems interface with other organisations or the world at large.",
                                                        "You design simple data flows between network and information systems and any external interface to enable effective monitoring.",
                                                        "You design to make network and information system recovery simple.",
                                                        "All inputs to network and information systems supporting your essential function(s) are checked and validated at the network boundary where possible, or additional monitoring is in place for content-based attacks."
                                                    ],
                                      "not":  [
                                                  "Network and information systems supporting the operation of the essential function(s) are not appropriately segregated from other systems.",
                                                  "Internet services, such as browsing and email are accessible from network and information systems supporting your essential function(s).",
                                                  "Data flows between network and information systems supporting your essential function(s) and other systems are complex, making it hard to discriminate between legitimate and illegitimate / malicious traffic.",
                                                  "Remote or third-party accesses circumvent some network controls to gain more direct access to network and information systems supporting the essential function(s)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Covers segmentation, zones/conduits, secure architecture (Purdue).",
                                        "relatedSRs":  [
                                                           "SR5.1",
                                                           "SR5.2"
                                                       ],
                                        "related80082":  [
                                                             "SA-8",
                                                             "Section 5"
                                                         ],
                                        "gotchas":  "Brownfield OT is rarely securely designed; assess against a realistic target architecture."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are designed to be secure for the essential function.",
                                              "partially":  "Partial secure design.",
                                              "notAchieved":  "Systems are not securely designed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Security designed in from the start is far cheaper and more effective than security bolted on later, and in OT, where systems run for decades, early design choices persist for a very long time. Secure-by-design, including sound segmentation, shapes the resilience of everything built on top of it."
                     },
                     {
                         "id":  "B4.b",
                         "principleId":  "B4",
                         "title":  "Secure Configuration",
                         "igps":  {
                                      "achieved":  [
                                                       "You have identified, documented and actively manage (e.g. maintain security configurations, patching, updating according to good practice) the assets that need to be carefully configured to maintain the security of network and information systems supporting your essential function(s).",
                                                       "All platforms conform to your secure, defined baseline build, or the latest known good configuration version for that environment.",
                                                       "You closely and effectively manage changes in your environment, ensuring that network and information systems configurations are secure and documented.",
                                                       "You regularly review and validate that network and information systems have the expected, secure settings and configuration.",
                                                       "Only permitted software can be installed.",
                                                       "If automated decision-making technologies are in use, their operation is well understood, and decisions can be replicated.",
                                                       "Generic, shared, default name and built-in accounts have been removed or disabled. Where this is not possible, credentials to these accounts have been changed. Service accounts are appropriately protected."
                                                   ],
                                      "partially":  [
                                                        "You have identified and documented the assets that need to be carefully configured to maintain the security of network and information systems supporting your essential function(s).",
                                                        "Secure platform and device builds are used across the estate.",
                                                        "Consistent, secure and minimal system and device configurations are applied across the same types of environment.",
                                                        "Changes and adjustments to security configurations at security boundaries of network and information systems supporting your essential function(s) are approved and documented.",
                                                        "You verify software before installation is permitted.",
                                                        "Generic, shared, default name and built-in accounts have been removed or disabled. Where this is not possible, credentials to these accounts have been changed. Service accounts are appropriately protected.",
                                                        "Standard users are not able to change settings that would adversely impact the security of network and information systems supporting your essential function(s)."
                                                    ],
                                      "not":  [
                                                  "You have not identified the assets that need to be carefully configured to maintain the security of network and information systems supporting your essential function(s).",
                                                  "Policies relating to the security of operating system builds or configuration are not applied consistently across network and information systems relating to your essential function(s).",
                                                  "Configuration details are not recorded or lack enough information to be able to rebuild the system or device.",
                                                  "The recording of security changes or adjustments that affect your essential function(s) is lacking or inconsistent.",
                                                  "Generic, shared, default name and built-in accounts have not been removed or disabled.",
                                                  "Standard users are able to change settings that would adversely impact the security of network and information systems supporting your essential function(s)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Least functionality on OT hosts; disable unused services/ports.",
                                        "relatedSRs":  [
                                                           "SR7.6",
                                                           "SR7.7"
                                                       ],
                                        "related80082":  [
                                                             "CM-6",
                                                             "CM-7"
                                                         ],
                                        "gotchas":  "Vendor-default builds are common in OT; hardening may be constrained by support terms."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are securely configured and hardened.",
                                              "partially":  "Partial hardening.",
                                              "notAchieved":  "Systems run default/insecure configurations.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Default configurations are built for ease of setup, not security, and leave services and access enabled that the function never needs. Secure configuration reduces the attack surface to what is actually required, which is one of the few hardening measures broadly achievable even on constrained OT devices."
                     },
                     {
                         "id":  "B4.c",
                         "principleId":  "B4",
                         "title":  "Secure Management",
                         "igps":  {
                                      "achieved":  [
                                                       "Your systems and devices supporting the operation of the essential function(s) are only administered or maintained by authorised privileged users from highly trusted devices, such as Privileged Access Workstations, dedicated solely to those operations.",
                                                       "You regularly review and update technical knowledge about network and information systems, such as documentation and network diagrams, and ensure they are securely stored.",
                                                       "You prevent, detect and remove malware, and unauthorised software. You use technical, procedural and physical measures as necessary."
                                                   ],
                                      "partially":  [
                                                        "Your systems and devices supporting the operation of the essential function(s) are only administered or maintained by authorised privileged users from devices sufficiently separated, using a risk-based approach, from the activities of standard users.",
                                                        "Technical knowledge about network and information systems, such as documentation and network diagrams, is regularly reviewed and updated.",
                                                        "You prevent, detect and remove malware, and unauthorised software. You use technical, procedural and physical measures as necessary."
                                                    ],
                                      "not":  [
                                                  "Your systems and devices supporting the operation of the essential function(s) are administered or maintained from devices that are not corporately owned and managed.",
                                                  "You do not have good or current technical documentation of network and information systems."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Remote access and change control for OT are central here.",
                                        "relatedSRs":  [
                                                           "SR1.13",
                                                           "SR2.6"
                                                       ],
                                        "related80082":  [
                                                             "MA-4",
                                                             "CM-3"
                                                         ],
                                        "gotchas":  "Vendor remote access and uncontrolled change are the dominant OT management risks."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are securely managed (changes, maintenance, remote access).",
                                              "partially":  "Partial secure management.",
                                              "notAchieved":  "Insecure management practices.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "The management and administration plane is how the system is configured and controlled, so its compromise hands an attacker the keys. Securing management access, especially remote and cross-network access, protects the most powerful routes into the environment."
                     },
                     {
                         "id":  "B4.d",
                         "principleId":  "B4",
                         "title":  "Vulnerability Management",
                         "igps":  {
                                      "achieved":  [
                                                       "You maintain a current understanding of the exposure of network and information systems supporting your essential function(s) to publicly-known vulnerabilities.",
                                                       "Announced vulnerabilities for all software packages used in network and information systems supporting your essential function(s) are tracked, prioritised and mitigated (e.g. by patching) promptly.",
                                                       "You regularly test to fully understand the vulnerabilities of network and information systems that support the operation of your essential function(s) and verify this understanding with third-party testing.",
                                                       "You actively maximise the use of supported software, firmware and hardware in network and information systems supporting your essential function(s)."
                                                   ],
                                      "partially":  [
                                                        "You maintain a current understanding of the exposure of network and information systems supporting your essential function(s) to publicly-known vulnerabilities.",
                                                        "Announced vulnerabilities for all software packages used in network and information systems supporting your essential function(s) are tracked, prioritised and externally exposed vulnerabilities are mitigated (e.g. by patching) promptly.",
                                                        "Some vulnerabilities that are not externally exposed have temporary mitigations for an extended period.",
                                                        "You have temporary mitigations for unsupported systems and software while pursuing migration to supported technology.",
                                                        "You regularly test to fully understand the vulnerabilities of network and information systems that support the operation of your essential function(s)."
                                                    ],
                                      "not":  [
                                                  "You do not understand the exposure of network and information systems supporting your essential function(s) to publicly-known vulnerabilities.",
                                                  "You do not mitigate externally exposed vulnerabilities promptly.",
                                                  "You have not recently tested to verify your understanding of the vulnerabilities of network and information systems that support your essential function(s).",
                                                  "You have not suitably mitigated systems or software that is no longer supported.",
                                                  "You are not pursuing replacement for unsupported systems or software."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT patching is constrained; risk-based mitigation and compensating controls matter most.",
                                        "relatedSRs":  [
                                                           "SR2.3",
                                                           "SR3.2"
                                                       ],
                                        "related80082":  [
                                                             "RA-5",
                                                             "SI-2"
                                                         ],
                                        "gotchas":  "Patching often impossible without outages; assess the mitigation strategy, not just patch rate."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Vulnerabilities are managed across the function\u0027s systems.",
                                              "partially":  "Partial vulnerability management.",
                                              "notAchieved":  "Vulnerabilities are not managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Most breaches exploit known, unpatched vulnerabilities. A managed process to find, assess and address them shrinks the window attackers rely on, and in OT, where patching is often constrained, the assessment and mitigation steps carry as much weight as patching itself."
                     },
                     {
                         "id":  "B5.a",
                         "principleId":  "B5",
                         "title":  "Resilience Preparation",
                         "igps":  {
                                      "achieved":  [
                                                       "You have business continuity and disaster recovery plans that have been tested for practicality, effectiveness and completeness. Appropriate use is made of different test methods (e.g. manual fail-over, table-top exercises, or red-teaming).",
                                                       "You use your security awareness and threat intelligence sources to identify new or heightened levels of risk, which result in immediate and potentially temporary security measures to enhance the security of network and information systems supporting your essential function(s), (e.g. in response to a widespread outbreak of very damaging malware)."
                                                   ],
                                      "partially":  [
                                                        "You know all network and information systems, and underlying technologies, that are necessary to restore the operation of your essential function(s) and understand their interdependence.",
                                                        "You know the order in which systems need to be recovered to efficiently and effectively restore the operation of the essential function(s)."
                                                    ],
                                      "not":  [
                                                  "You have limited understanding of all the elements that are required to restore operation of network and information systems supporting your essential function(s).",
                                                  "You have not completed business continuity and disaster recovery plans for network and information systems, including their dependencies, supporting the operation of the essential function(s).",
                                                  "You have not fully assessed the practical implementation of your business continuity and disaster recovery plans."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Resilience of the physical process, not just IT systems.",
                                        "relatedSRs":  [
                                                           "SR7.1",
                                                           "SR7.2"
                                                       ],
                                        "related80082":  [
                                                             "CP-2"
                                                         ],
                                        "gotchas":  "OT resilience includes safe-state and manual fallback, not just system redundancy."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "The organisation is prepared for resilience of the essential function.",
                                              "partially":  "Partial resilience preparation.",
                                              "notAchieved":  "Not prepared for resilience.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Resilience depends on having prepared before the disruption, not improvising during it. Knowing in advance what the essential function needs to keep running, and what to do when it can\u0027t, is the difference between a contained event and a crisis."
                     },
                     {
                         "id":  "B5.b",
                         "principleId":  "B5",
                         "title":  "Design for Resilience",
                         "igps":  {
                                      "achieved":  [
                                                       "Network and information systems supporting the operation of your essential function(s) are segregated from other business and external systems by appropriate technical and physical means (e.g. separate network and system infrastructure with independent user administration).",
                                                       "Internet services, such as browsing and email, are not accessible from network and information systems supporting your essential function(s).",
                                                       "You have identified and mitigated all resource limitations (e.g. bandwidth limitations and single network paths).",
                                                       "You have identified and mitigated any geographical constraints or weaknesses. (e.g. systems that your essential function(s) depends upon are replicated in another location, important network connectivity has alternative physical paths and service providers).",
                                                       "You review and update assessments of dependencies, resource and geographical limitations and mitigations when necessary."
                                                   ],
                                      "partially":  [
                                                        "Network and information systems supporting the operation of your essential function(s) are logically separated from your business systems (e.g. they reside on the same network as the rest of the organisation but within a DMZ).",
                                                        "Internet services, such as browsing and email, are not accessible from network and information systems supporting your essential function(s).",
                                                        "Resource limitations (e.g. network bandwidth, single network paths) have been identified but not fully mitigated."
                                                    ],
                                      "not":  [
                                                  "Network and information systems supporting the operation of your essential function(s) are not appropriately segregated.",
                                                  "Internet services, such as browsing and email, are accessible from network and information systems supporting your essential function(s).",
                                                  "You do not understand or lack plans to mitigate all resource limitations that could adversely affect your essential function(s)."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Redundancy, island-mode, fail-safe behaviour.",
                                        "relatedSRs":  [
                                                           "SR5.2",
                                                           "SR7.1"
                                                       ],
                                        "related80082":  [
                                                             "CP-2"
                                                         ],
                                        "gotchas":  "Ability to run isolated (island mode) is a key OT resilience property."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are designed for resilience.",
                                              "partially":  "Partial resilience design.",
                                              "notAchieved":  "Not designed for resilience.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A system designed to fail safe and degrade gracefully limits how far any single failure or attack can spread. In OT this includes the ability to keep the process running or bring it to a safe state independent of compromised or unavailable supporting systems."
                     },
                     {
                         "id":  "B5.c",
                         "principleId":  "B5",
                         "title":  "Backups",
                         "igps":  {
                                      "achieved":  [
                                                       "Your comprehensive, automatic and tested technical and procedural backups are secured at centrally accessible or secondary sites to recover from an extreme event.",
                                                       "Backups of all important data and information needed to recover the essential function(s) are made, tested, documented and routinely reviewed."
                                                   ],
                                      "partially":  [
                                                        "You have appropriately secured backups (including data, configuration information, software, equipment, processes and knowledge). These backups will be accessible to recover from an extreme event including ransomware attack.",
                                                        "You routinely test backups to ensure that the backup process function(s) correctly and the backups are usable."
                                                    ],
                                      "not":  [
                                                  "Backup coverage is incomplete and does not include all relevant data and information needed to restore the operation of your essential function(s).",
                                                  "Backups are not frequent enough for the operation of your essential function(s) to be restored effectively.",
                                                  "Your restoration process does not restore your essential function(s) in a suitable time frame."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Backups of controller logic, configs and HMI, stored securely and restore-tested.",
                                        "relatedSRs":  [
                                                           "SR7.3",
                                                           "SR7.4"
                                                       ],
                                        "related80082":  [
                                                             "CP-9",
                                                             "CP-10"
                                                         ],
                                        "gotchas":  "Logic/config backups are often missing or never restore-tested in OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Comprehensive, secured, tested backups enable recovery from extreme events.",
                                              "partially":  "Backups exist but incomplete, unsecured, or untested.",
                                              "notAchieved":  "Backups inadequate or absent.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Backups are the last line of defence against ransomware, destructive attacks and serious error, and in OT the backups most often missing are controller logic and configuration, not just data. Sound, verified, restorable backups are what make recovery possible rather than hoped-for."
                     },
                     {
                         "id":  "B6.a",
                         "principleId":  "B6",
                         "title":  "Cyber Security Culture",
                         "igps":  {
                                      "achieved":  [
                                                       "Your executive management clearly and effectively communicates the organisation\u0027s cyber security priorities and objectives to all staff.  Your organisation displays positive cyber security attitudes, behaviours, expectations.",
                                                       "People in your organisation raising potential cyber security incidents and issues are treated positively.",
                                                       "Individuals at all levels in your organisation routinely report concerns or issues about cyber security and are recognised for their contribution to keeping the organisation secure.",
                                                       "Your management is seen to be committed to and actively involved in cyber security.",
                                                       "Your organisation communicates openly about cyber security, with any concern being taken seriously.",
                                                       "People across your organisation collaborate in cyber security activities and improvements, building joint ownership and bringing knowledge of their area of expertise."
                                                   ],
                                      "partially":  [
                                                        "Your executive management understand and widely communicate the importance of a positive cyber security culture. Positive attitudes, behaviours and expectations are described for your organisation.",
                                                        "All people in your organisation understand the contribution they make to the cyber security of network and information systems supporting your essential functions(s).",
                                                        "All individuals in your organisation know who to contact and where to access more information about cyber security. They know how to raise a cyber security issue.",
                                                        "You identify and address issues that inhibit people from behaving in a manner that supports your intended cyber security outcomes."
                                                    ],
                                      "not":  [
                                                  "People in your organisation do not understand what they contribute to the cyber security of network and information systems supporting your essential function(s).",
                                                  "People in your organisation do not know how to raise a concern about cyber security.",
                                                  "People believe that reporting issues may get them into trouble.",
                                                  "Your organisation\u0027s approach to cyber security is perceived by staff as hindering the business of the organisation and may encourage poor security behaviours.",
                                                  "Formal or informal incentives and rewards conflict with the promotion of positive security outcomes."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Culture must bridge engineering and security mindsets.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "AT-2"
                                                         ],
                                        "gotchas":  "Engineering culture prioritises uptime; security framing must respect that."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A positive cyber security culture supports the essential function.",
                                              "partially":  "Partial/uneven culture.",
                                              "notAchieved":  "Poor security culture.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Culture determines what people do when no one is watching and no procedure quite fits. A workforce that genuinely values security catches what controls miss, whereas a culture that treats it as someone else\u0027s problem undermines even well-designed defences."
                     },
                     {
                         "id":  "B6.b",
                         "principleId":  "B6",
                         "title":  "Cyber Security Training",
                         "igps":  {
                                      "achieved":  [
                                                       "All people in your organisation, from the most senior to the most junior, follow appropriate cyber security training paths.",
                                                       "Each individuals cyber security training is tracked and refreshed at suitable intervals.",
                                                       "You routinely evaluate your cyber security training and awareness activities to ensure they reach the widest audience and are effective.",
                                                       "You make cyber security information and good practice guidance easily accessible, widely available and you know it is referenced and used within your organisation."
                                                   ],
                                      "partially":  [
                                                        "You have defined appropriate cyber security training and awareness activities for all roles in your organisation, from executives to the most junior roles.",
                                                        "You use a range of teaching and communication techniques for cyber security training and awareness to reach the widest audience effectively.",
                                                        "Cyber security information is easily available."
                                                    ],
                                      "not":  [
                                                  "There are teams who operate and support your essential function(s) that lack any cyber security training.",
                                                  "Cyber security training is restricted to specific roles in your organisation.",
                                                  "Cyber security training records for your organisation are lacking or incomplete.",
                                                  "Training is used as a \"silver bullet\" for all user security behaviours.",
                                                  "The success of training is only measured by the number of people reached, rather than assessing whether it has a positive impact on security behaviours.",
                                                  "Training materials contain out of date or contradictory information, or information that conflicts with other policies, processes or procedures."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT staff need OT-relevant training, not generic IT awareness.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "AT-3"
                                                         ],
                                        "gotchas":  "Generic phishing training misses OT-specific risks; tailor for operators/engineers."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Staff have appropriate cyber security training for their roles.",
                                              "partially":  "Partial/role-incomplete training.",
                                              "notAchieved":  "Inadequate training.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "People act safely when they know how, and OT staff need training framed around the operational environment rather than generic office-IT material. Training is what converts good intentions into the right action during the routine moments and the critical ones."
                     },
                     {
                         "id":  "C1.a",
                         "principleId":  "C1",
                         "title":  "Monitoring Coverage",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "Monitoring is based on a thorough understanding of network and information systems supporting your essential function(s), techniques used by threat actors, and awareness of what logging and monitoring is required to detect events and incidents that could affect the operation of your essential function(s).",
                                                       "Your monitoring data provides enough detail to promptly and reliably detect security events, incidents and support investigations. This is reviewed regularly and after a significant security event.",
                                                       "Extensive monitoring of user and system activity in relation to network and information systems that support your essential function(s) enables you to promptly detect policy violations, suspicious or undesirable user and system behaviour, deviations from normal / routine behaviour or abnormalities indicative of adverse activity.",
                                                       "Your logging and monitoring capability includes host-based and network monitoring.",
                                                       "All new network and information systems supporting your essential function(s) are considered as potential logging and monitoring data sources to maintain a comprehensive monitoring capability.",
                                                       "Log datasets are synchronised including using an accurate common time source so that separate datasets can be correlated in appropriate ways.",
                                                       "You enrich log data with other network and information systems data to provide a more comprehensive picture of actions and behaviours.",
                                                       "Your monitoring tools make use of log data to pinpoint activity.",
                                                       "You regularly review the data sources and tools included in your logging and monitoring strategy to ensure it remains effective."
                                                   ],
                                      "partially":  [
                                                        "Data relating to the security and operation of some areas of network and information systems supporting your essential function(s) is collected but coverage is not comprehensive.",
                                                        "Some user and system monitoring is done, but not covering a fully agreed list of suspicious or undesirable behaviour.",
                                                        "You monitor traffic crossing your network boundary (including IP address connections as a minimum).",
                                                        "Some but not all log datasets can be easily queried with search tools to aid in investigations.",
                                                        "Your monitoring tools work with most log data, with some configuration.",
                                                        "Your monitoring tools can make use of log data that would capture all common threats.",
                                                        "You ensure log data is available for analysis when needed."
                                                    ],
                                      "not":  [
                                                  "Data relating to the security and operation of network and information systems supporting your essential function(s) is not collected.",
                                                  "You are not able to audit the activities of users and systems in relation to network and information systems supporting your essential function(s).",
                                                  "You do not monitor traffic crossing your network boundary.",
                                                  "Log data cannot be synchronised using an accurate common time source.",
                                                  "Logs are stored in locations where they are not readily available to authorised users and systems.",
                                                  "Your monitoring tools cannot be configured to make use of new log streams as they come online.",
                                                  "Your monitoring tools are only able to make use of a fraction of the log data being collected.",
                                                  "You do not understand where log data is stored or how long it should be stored for.",
                                                  "You have no way of ensuring log data is being captured as expected and available when needed."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT-aware monitoring; IT SIEM alone rarely sees OT protocols.",
                                        "relatedSRs":  [
                                                           "SR6.2"
                                                       ],
                                        "related80082":  [
                                                             "SI-4",
                                                             "Section 6"
                                                         ],
                                        "gotchas":  "OT visibility usually needs passive network monitoring that understands ICS protocols."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Monitoring covers the systems supporting the essential function.",
                                              "partially":  "Partial monitoring coverage.",
                                              "notAchieved":  "Inadequate monitoring coverage.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "You cannot detect what you cannot see. Monitoring coverage across the parts of the environment that matter is the precondition for noticing an attack at all, and gaps in coverage are blind spots an intruder can move through unobserved."
                     },
                     {
                         "id":  "C1.b",
                         "principleId":  "C1",
                         "title":  "Securing Logs",
                         "igps":  {
                                      "achieved":  [
                                                       "Appropriate access to log data is limited to those users and systems with a business need.",
                                                       "The logging architecture has mechanisms, policies, processes and procedures to ensure that it can protect itself from threats comparable to those that it is trying to identify. This includes protecting the function itself and the data within it.",
                                                       "Log data analysis and normalisation is only performed on copies of the log data keeping the master copy unaltered.",
                                                       "All actions involving log data (e.g. copying, deleting, modification, or even viewing) can be traced back to a unique user or system.",
                                                       "The integrity of log data is protected, verified and any modification, including deletion, is detected and attributed."
                                                   ],
                                      "partially":  [
                                                        "Only authorised users and systems can access log data.",
                                                        "There is some monitoring of access to log data (e.g. copying, deleting or modification, or even viewing).",
                                                        "You have defined and implemented retention periods for log data.",
                                                        "You have given legitimate reasons for accessing log data in your policies."
                                                    ],
                                      "not":  [
                                                  "It is possible for log data to be easily edited or deleted by unauthorised users / systems or attackers.",
                                                  "There is no control of the users and systems that can access log data.",
                                                  "There is no monitoring of the access to log data.",
                                                  "There are no policies covering access to log data."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Centralise and protect OT logs where devices can produce them.",
                                        "relatedSRs":  [
                                                           "SR2.8",
                                                           "SR3.9",
                                                           "SR6.1"
                                                       ],
                                        "related80082":  [
                                                             "AU-9"
                                                         ],
                                        "gotchas":  "Many OT devices log poorly or not at all; capture what is feasible."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Logs are securely collected and protected.",
                                              "partially":  "Partial log security.",
                                              "notAchieved":  "Logs not secured.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Logs are only useful if they are complete and trustworthy, and an attacker\u0027s early move is often to alter or delete them. Securing logs preserves both the evidence needed to investigate and the integrity that lets you trust what they show."
                     },
                     {
                         "id":  "C1.c",
                         "principleId":  "C1",
                         "title":  "Generating Alerts",
                         "igps":  {
                                      "achieved":  [
                                                       "You easily detect the presence of Indicators of Compromise (IoCs) on network and information systems supporting your essential function(s), such as known malicious command and control signatures, as well as abnormalities or behaviours indicative of adverse activity.",
                                                       "You apply all updates, new signatures and IoCs promptly.",
                                                       "Security alerts relating to all network and information systems supporting your essential function(s) are prioritised and this information is used to support incident management.",
                                                       "Alerts are routinely enriched within network and information systems supporting your essential function(s). The enrichment of these alerts is performed in almost real time and as part of the original alert.",
                                                       "Alerts and the underlying detections are regularly reviewed and tested to ensure they are generated promptly and reliably, and it is possible to distinguish genuine security incidents from false alarms.",
                                                       "Alerts and the underlying detection rules are customisable and tuned to reduce false positives as well as optimising responses.",
                                                       "Detections and alerting may use off the shelf tooling and rules as well as custom tooling and / or rules.",
                                                       "You continuously monitor for user and system abnormalities indicative of adverse activity generating alerts based on the results of such monitoring.",
                                                       "Logs are monitored continuously in near real time."
                                                   ],
                                      "partially":  [
                                                        "You easily detect the presence of Indicators of Compromise (IoCs) on network and information systems supporting your essential function(s), such as known malicious command and control signatures.",
                                                        "You apply some updates, new signatures and IoCs in a timely way.",
                                                        "Security alerts relating to network and information systems that support your essential function(s) are prioritised.",
                                                        "The enrichment of alerts within network and information systems supporting your essential function(s) is performed but not as part of the original alert.",
                                                        "Detections and alerting rely on off the shelf tooling without customisation or users reporting events and potential incidents.",
                                                        "There is a documented and shared process for all users who support the operation of the essential function to report events and potential security incidents.",
                                                        "Where appropriate, detections and alerting result in automated actions being taken. (e.g. malware identified by AV is quarantined).",
                                                        "You monitor on an irregular basis for user or system abnormalities indicative of adverse activity.",
                                                        "Logs are monitored at regular intervals."
                                                    ],
                                      "not":  [
                                                  "You do not apply updates to your detection security technologies in a timely way, after receiving them (e.g. AV signature updates, other threat signatures or Indicators of Compromise (IoCs)).",
                                                  "Security alerts relating to network and information systems supporting your essential function(s) are not prioritised.",
                                                  "The enrichment of security alerts within network and information systems supporting your essential function(s) cannot be performed.",
                                                  "You do not confidently detect the presence of IoCs on network and information systems supporting your essential function(s), such as known malicious command and control signatures (e.g. because applying the indicator is difficult or your log data is not sufficiently detailed).",
                                                  "You do not monitor for user or system abnormalities indicative of adverse activity.",
                                                  "Logs are monitored infrequently."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Alerting tuned to OT baselines and anomalies.",
                                        "relatedSRs":  [
                                                           "SR6.2"
                                                       ],
                                        "related80082":  [
                                                             "SI-4"
                                                         ],
                                        "gotchas":  "OT traffic is repetitive; anomaly-based alerting can work well once baselined."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Alerts are generated from monitoring data.",
                                              "partially":  "Partial alerting.",
                                              "notAchieved":  "No effective alerting.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Collecting data achieves nothing if nothing prompts a human to look. Turning monitoring into timely, meaningful alerts is what converts visibility into the chance to respond before an intrusion becomes an incident."
                     },
                     {
                         "id":  "C1.d",
                         "principleId":  "C1",
                         "title":  "Triage of Security Alerts",
                         "igps":  {
                                      "achieved":  [
                                                       "You investigate and triage alerts from all security tools and take action.",
                                                       "You have created, made available and use when appropriate, Standard Operating Procedures (SOPs) / Playbooks / Runbooks covering all plausible use cases. These are regularly reviewed to ensure they remain effective.",
                                                       "You categorise alerts and incidents by type and priority / severity level.",
                                                       "You document all triage related activities performed by monitoring and detection personnel and these are used to drive improvements",
                                                       "Triage provides enough information for subsequent activities to be prioritised (e.g. the containment of damaging malware).",
                                                       "Your understanding of normal user and system behaviour, and threats, is sufficient for effective decision making within triage."
                                                   ],
                                      "partially":  [
                                                        "You investigate and triage alerts from some security tools and take action.",
                                                        "You have created, made available and use when appropriate, Standard Operating Procedures (SOPs) / Playbooks / Runbooks covering the most common use cases. These are regularly reviewed to ensure they remain effective.",
                                                        "You perform some triage and actions taken by monitoring and detection personnel are recorded.",
                                                        "You categorise alerts and incidents by type and priority / severity level.",
                                                        "Your understanding of normal user or system behaviour informs your decision making within triage."
                                                    ],
                                      "not":  [
                                                  "You do not triage alerts from your detection security technologies (e.g. AV, IDS).",
                                                  "You do not categorise alerts and incidents by type and priority / severity level.",
                                                  "You do not have Standard Operating Procedures (SOPs) / Playbooks / Runbooks available for use during triage.",
                                                  "You do not keep records of triage performed.",
                                                  "You do not have a sufficient understanding of normal user or system behaviour to make effective decisions within triage."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Triage needs OT context (what is normal for this process).",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-4"
                                                         ],
                                        "gotchas":  "IT analysts without OT context misjudge OT alerts; pair with engineering knowledge."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Security alerts are triaged with context.",
                                              "partially":  "Partial triage.",
                                              "notAchieved":  "Alerts not triaged.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Distinguishing a real security incident from the constant background of events is what makes monitoring actionable. Without reliable identification, genuine attacks are lost in noise and the response clock never starts."
                     },
                     {
                         "id":  "C1.e",
                         "principleId":  "C1",
                         "title":  "Personnel Skills for Monitoring and Detection",
                         "igps":  {
                                      "achieved":  [
                                                       "You have monitoring and detection personnel who are responsible for the proactive and reactive analysis, investigation and reporting of monitoring alerts including both security and performance.",
                                                       "Monitoring and detection personnel have defined roles and skills that cover all parts of the monitoring and investigation process.",
                                                       "Monitoring and detection personnel follow policies, processes and procedures that address all governance reporting requirements, internal and external.",
                                                       "Monitoring and detection personnel are empowered to look beyond the fixed process to investigate and understand non-standard threats.",
                                                       "Monitoring and detection personnel are aware of the network and information systems and your essential function(s), related assets and can identify and prioritise alerts and investigations that relate to them.",
                                                       "Monitoring and detection personnel drive and shape new log data collection and can make effective use of it.",
                                                       "Monitoring and detection personnel are capable of following all of the required workflow(s).",
                                                       "Monitoring and detection personnel have a sufficient understanding of the operational context (e.g. people, processes, network and information systems that support your essential function) to enhance the security monitoring function.",
                                                       "Monitoring and detection personnel deal with their workload and cases effectively as well as identifying areas for improvement."
                                                   ],
                                      "partially":  [
                                                        "Monitoring and detection personnel have some investigative skills and a basic understanding of the data they need to work with.",
                                                        "Monitoring and detection personnel can report to other parts of the organisation (e.g. security directors, resilience managers).",
                                                        "Monitoring and detection personnel are capable of following most of the required workflow(s).",
                                                        "Monitoring and detection personnel are aware of some of the network and information systems and your essential function(s), and can manage alerts relating to them.",
                                                        "Monitoring and detection personnel have some understanding of the operational context (e.g. people, processes, network and information systems that support your essential function(s)) to enhance the security monitoring function.",
                                                        "Monitoring and detection personnel deal with their workload and cases effectively."
                                                    ],
                                      "not":  [
                                                  "There are no personnel who perform a monitoring and detection function.",
                                                  "Monitoring and detection personnel do not have the correct specialist skills.",
                                                  "Monitoring and detection personnel are not capable of reporting against governance requirements.",
                                                  "Monitoring and detection personnel have a lack of awareness of the essential function(s) the organisation provides, what assets relate to those functions and hence the importance of the log data and security events.",
                                                  "Monitoring and detection personnel have no awareness of other roles or tasks outside of security monitoring and detection that are relevant to the operation of your essential function(s).",
                                                  "Monitoring and detection personnel are overwhelmed with the amount of data and alerts they have to work with. Alert / triage fatigue is present."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "OT detection needs blended OT+security skills, often scarce.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-2"
                                                         ],
                                        "gotchas":  "OT-capable detection staff are rare; flag the resourcing gap honestly."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Personnel have the skills for monitoring and detection.",
                                              "partially":  "Partial skills.",
                                              "notAchieved":  "Inadequate monitoring skills.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Monitoring is only as good as the tools deployed and the people reading them. Adequate tooling and skilled analysts are what make detection effective rather than a box ticked, and in OT the skills must span both security and process understanding."
                     },
                     {
                         "id":  "C1.f",
                         "principleId":  "C1",
                         "title":  "Understanding Users\u0027 and Systems\u0027 Behaviour, and Threat Intelligence",
                         "igps":  {
                                      "achieved":  [
                                                       "You track the effectiveness of your threat intelligence and actively share feedback on the usefulness of Indicators of Compromise (IoCs) and other intelligence with the threat community (e.g. sector partners, threat intelligence providers, government agencies).",
                                                       "When using threat intelligence feeds, these have been selected using risk-based and threat-informed decisions based on your business needs and sector.",
                                                       "You make relevant, reliable and actionable threat intelligence available to the necessary users and systems promptly.",
                                                       "You contextualise threat intelligence and link it to the why and / or how attacks take place for security monitoring.",
                                                       "You understand normal user and system abnormalities fully, to such an extent that searching for system abnormalities is an effective way of detecting adverse activity (e.g. you fully understand which systems should and should not communicate and when).",
                                                       "The user and system abnormalities you monitor for are based on the nature of adverse activities likely to impact network and information systems supporting the operation of your essential function(s).",
                                                       "The user and system abnormalities indicative of adverse activity you use are regularly updated to reflect changes in network and information systems supporting your essential function(s) and current threat intelligence.",
                                                       "You possess the capability to share threat intelligence (e.g. ways to effectively detect adversaries) with the threat community / defender community (sector partners, threat intelligence providers, government agencies) when required."
                                                   ],
                                      "partially":  [
                                                        "You know how effective your threat intelligence is (e.g. by tracking how threat intelligence helps you identify security incidents).",
                                                        "Your organisation may use threat intelligence services, but you do not necessarily choose sources or providers specifically because of your business needs, or specific threats in your sector (e.g. sector-based infoshare, software vendors, anti-virus providers, specialist threat intel firms, special interest groups).",
                                                        "The user and system abnormalities from past attacks and threat intelligence, on your and other network and information systems, are used to signify adverse activity.",
                                                        "You receive regular updates for all of your detection security technologies (e.g. AV, IDS)."
                                                    ],
                                      "not":  [
                                                  "Your organisation has no sources of threat intelligence.",
                                                  "You do not evaluate the usefulness of your threat intelligence or share feedback with providers or other users.",
                                                  "You have no awareness of the steps necessary to make best use of threat intelligence for security monitoring.",
                                                  "Threat intelligence is unreliable and / or is not actioned by the appropriate users or systems in a timely manner.",
                                                  "You have no established understanding of what abnormalities to look for that might signify adverse activities.",
                                                  "You do not receive updates for all your detection security technologies (e.g. AV, IDS).",
                                                  "You do not understand normal user and system behaviour sufficiently to be able to use abnormalities to detect adverse activity."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Behavioural baselining suits stable OT environments well.",
                                        "relatedSRs":  [
                                                           "SR6.2"
                                                       ],
                                        "related80082":  [
                                                             "SI-4"
                                                         ],
                                        "gotchas":  "Deterministic OT behaviour makes baselining effective; exploit that."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "User/system behaviour is understood and threat intelligence informs monitoring.",
                                              "partially":  "Partial behavioural understanding/threat intel use.",
                                              "notAchieved":  "Behaviour not understood; intel not used.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Continuously refining detection in light of new threats keeps monitoring relevant as the adversary changes. Detection tuned once and never revisited steadily loses ground to attackers who adapt, so ongoing improvement is what keeps it effective."
                     },
                     {
                         "id":  "C2.a",
                         "principleId":  "C2",
                         "title":  "Threat Hunting",
                         "igps":  {
                                      "achieved":  [
                                                       "You understand the resources required to perform threat hunting and these are deployed as part of business as usual.",
                                                       "You deploy threat hunting resources at a frequency that matches the risks posed to network and information systems supporting your essential function(s).",
                                                       "Your threat hunts follow pre-determined and documented methods (e.g. hypothesis driven, data driven, entity driven) designed to identify adverse activity not detected by automated detections.",
                                                       "You turn threat hunts into automated detections and alerting where appropriate.",
                                                       "You routinely record details of previous threat hunts and post hunt activities. You use these to drive improvements in your threat hunting and security posture.",
                                                       "You have justified confidence in the effectiveness of your threat hunts and the threat hunting process is reviewed and updated to match the risks posed to network and information systems supporting your essential function(s).",
                                                       "You leverage automation to improve threat hunts where appropriate (e.g. some stages of the threat hunting process are automated).",
                                                       "Your threat hunts focus on the tactics, techniques and procedures (TTPs) of threats over atomic IoCs (e.g. hashes, IP addresses, domain names etc)."
                                                   ],
                                      "partially":  [
                                                        "You have identified the resources required to perform threat hunting and are able to deploy these, in a timely manner, on an occasional basis.",
                                                        "You deploy an effective threat hunting capability but not frequent enough to match the risks posed to network and information systems supporting your essential function(s) (e.g. you perform threat hunts in response to a tip off from a reputable source).",
                                                        "Your threat hunts follow pre-determined and documented methods (e.g. hypothesis driven, data driven, entity driven) designed to identify adverse activity not detected by automated detections.",
                                                        "You document details of threat hunts and post hunt analysis."
                                                    ],
                                      "not":  [
                                                  "You do not know the resources required for threat hunting.",
                                                  "You do not have access to an effective threat hunting capability.",
                                                  "Your threat hunts do not follow any structure and few if any records are created."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "New in CAF 4.0. Hunting in OT must be non-disruptive and data-driven.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "Section 6"
                                                         ],
                                        "gotchas":  "Threat hunting is mature in IT but nascent in OT; expect this to be low for most operators."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Proactive threat hunting is carried out, documented and drives improvement.",
                                              "partially":  "Some hunting but ad hoc/undocumented.",
                                              "notAchieved":  "No threat hunting.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Proactive threat hunting looks for the intruder who has evaded automated detection, on the assumption that prevention sometimes fails. It is nascent in OT and demanding to do well, but it is what finds the quiet, capable attacker who is specifically trying not to trip an alert."
                     },
                     {
                         "id":  "D1.a",
                         "principleId":  "D1",
                         "title":  "Response Plan",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "Your incident response plan is based on a clear and understanding of the security risks to network and information systems supporting your essential function(s).",
                                                       "Your incident response plan is comprehensive (i.e. covers the complete lifecycle of an incident, roles and responsibilities, and reporting) and covers likely impacts of both known attack patterns and of possible attacks, previously unseen.",
                                                       "Your incident response plan is documented and integrated with wider organisational business plans and supply chain response plans, as well as dependencies on supporting infrastructure (e.g. power, cooling etc).",
                                                       "Your incident response plan is communicated and understood by the business areas involved with the operation of your essential function(s)."
                                                   ],
                                      "partially":  [
                                                        "Your incident response plan covers network and information systems supporting your essential function(s).",
                                                        "Your incident response plan comprehensively covers scenarios that are focused on likely impacts of known and well understood attacks only.",
                                                        "Your incident response plan is understood by all staff who are involved with your organisation\u0027s response function."
                                                    ],
                                      "not":  [
                                                  "Your incident response plan is not documented.",
                                                  "Your incident response plan does not include your organisations identified essential function(s).",
                                                  "Your incident response plan is not well understood by relevant staff."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Plan must cover OT/safety scenarios and engineering involvement.",
                                        "relatedSRs":  [
                                                           "SR6.1"
                                                       ],
                                        "related80082":  [
                                                             "IR-1",
                                                             "IR-8"
                                                         ],
                                        "gotchas":  "IT IR plans rarely cover plant shutdown/safe-state decisions; OT scenarios needed."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A response plan covers incidents affecting the essential function.",
                                              "partially":  "Plan partial or not OT-specific.",
                                              "notAchieved":  "No adequate response plan.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A response plan made in advance is what allows fast, coordinated action under pressure, when there is no time to invent one. In OT the plan must include engineering and safe-state decisions that an IT-only playbook never covers, such as whether and how to take the process down."
                     },
                     {
                         "id":  "D1.b",
                         "principleId":  "D1",
                         "title":  "Response and Recovery Capability",
                         "igps":  {
                                      "achieved":  [
                                                       "You understand the resources that will likely be needed to carry out any required response activities, and arrangements are in place to make these resources available.",
                                                       "You understand the types of information that will likely be needed to inform response decisions and arrangements are in place to make this information available.",
                                                       "Your response team members have the skills and knowledge required to decide on the response actions necessary to limit harm, and the authority to carry them out.",
                                                       "Key roles are duplicated, and operational delivery knowledge is shared with all individuals involved in the operations and recovery of the essential function(s).",
                                                       "Back-up mechanisms are available that can be readily activated to allow continued operation of your essential function(s), although possibly at a reduced level, if primary network and information systems fail or are unavailable.",
                                                       "Arrangements exist to augment your organisation\u0027s incident response capabilities with external support if necessary (e.g. specialist cyber incident responders)."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "Inadequate arrangements have been made to make the right resources available to implement your response plan.",
                                                  "Your response team members are not equipped to make good response decisions and put them into effect.",
                                                  "Inadequate back-up mechanisms exist to allow the continued operation of your essential function(s) during an incident."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Who has authority to stop a process? Engineering/security coordination is key.",
                                        "relatedSRs":  [
                                                           "SR7.4"
                                                       ],
                                        "related80082":  [
                                                             "IR-4",
                                                             "CP-10"
                                                         ],
                                        "gotchas":  "Authority to halt production in an incident is often unclear; clarify it."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Capability and roles exist to respond and recover, with authority to act.",
                                              "partially":  "Partial capability/authority.",
                                              "notAchieved":  "Inadequate response/recovery capability.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Plans only help if the organisation can actually execute them. A real response and recovery capability, people, tools and rehearsed procedures, is what turns the plan into restored operation, and the recovery side is what limits how long the essential function stays degraded."
                     },
                     {
                         "id":  "D1.c",
                         "principleId":  "D1",
                         "title":  "Testing and Exercising",
                         "igps":  {
                                      "achieved":  [
                                                       "Exercise scenarios are based on incidents experienced by your and other organisations or are composed using experience or threat intelligence.",
                                                       "Exercise scenarios are documented, regularly reviewed, and validated.",
                                                       "Exercises are routinely run, with the findings documented and used to refine incident response plans and protective security, in line with the lessons learned.",
                                                       "Exercises test all parts of your response cycle relating to your essential function(s) (e.g. restoration of normal function(s) levels)."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "Exercises test only a discrete part of the process (e.g. that backups are working), but do not consider all areas.",
                                                  "Incident response exercises are not routinely carried out or are carried out in an ad-hoc way.",
                                                  "Outputs from exercises are not fed into the organisation\u0027s lessons learned process.",
                                                  "Exercises do not test all parts of the response cycle."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Exercises should include OT/safety scenarios and engineering staff.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-3",
                                                             "CP-4"
                                                         ],
                                        "gotchas":  "OT-inclusive tabletops are uncommon; their absence is a frequent finding."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Response and recovery are tested and exercised.",
                                              "partially":  "Partial/limited exercising.",
                                              "notAchieved":  "Not tested.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A plan never tested is a plan that fails on first use. Exercising the response under realistic conditions surfaces the gaps, wrong assumptions and missing contacts while it is still cheap to fix them, rather than during a live incident."
                     },
                     {
                         "id":  "D2.a",
                         "principleId":  "D2",
                         "title":  "Incident Root Cause Analysis",
                         "verify":  true,
                         "igps":  {
                                      "achieved":  [
                                                       "Post incident analysis is conducted routinely as a key part of your lessons learned activities following an incident.",
                                                       "Your post incident analysis is comprehensive, considering organisational factors (e.g. policies, processes and procedures), technical factors (e.g. system design, vulnerabilities), human factors (e.g. training, security culture) and any changes to threat.",
                                                       "All relevant incident data is made available to the analysis team to perform post incident analysis.",
                                                       "Your analysis considers what could have happened under plausible, alternative circumstances (e.g. \u0027what if\u0027 / \u0027if only\u0027 scenarios)."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "You are not usually able to resolve incidents to a root cause or identify the contributing factors within a broader systems context.",
                                                  "You do not have a formal process for investigating causes.",
                                                  "Investigators form theories early in the process and only seek evidence that affirms their belief.",
                                                  "Investigations are solely focused on identifying the person(s) who can be held responsible for the incident."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Root cause must consider OT/process factors, not just IT.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-4"
                                                         ],
                                        "gotchas":  "OT incidents need engineering input to root-cause properly."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Incident root causes are analysed.",
                                              "partially":  "Partial root-cause analysis.",
                                              "notAchieved":  "Root causes not analysed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Understanding why an incident happened is what stops it happening again. Root cause analysis turns a single event into a systemic fix, whereas treating only the symptom leaves the underlying weakness in place for the next attacker to find."
                     },
                     {
                         "id":  "D2.b",
                         "principleId":  "D2",
                         "title":  "Using Incidents to Drive Improvements",
                         "igps":  {
                                      "achieved":  [
                                                       "You have a documented incident review process / policy which ensures that lessons learned from each incident, including near misses, are identified, captured, and acted upon.",
                                                       "Lessons learned cover issues with reporting, roles, governance, skills and organisational policies, processes and procedures as well as technical aspects of network and information systems.",
                                                       "You use lessons learned to improve security measures, including updating and retesting response plans when necessary.",
                                                       "Security improvements identified as a result of lessons learned are prioritised, with the highest priority improvements completed promptly.",
                                                       "Analysis is fed to senior management and incorporated into risk management and continuous improvement.",
                                                       "Your organisation maximises the lessons learned by using the analysis into \u0027what if\u0027 / \u0027if only\u0027 scenarios.",
                                                       "Your organisation learns from reported incidents in your sector and the wider national infrastructure."
                                                   ],
                                      "partially":  [

                                                    ],
                                      "not":  [
                                                  "Following incidents, lessons learned are not captured or are limited in scope.",
                                                  "Improvements arising from lessons learned following an incident are not implemented or not given sufficient organisational priority.",
                                                  "Changes are made as a \u0027knee jerk\u0027 reaction to an incident without proper analysis and testing to ensure the change is appropriate.",
                                                  "You wait until a severe or high-profile incident has occurred before you take steps to improve."
                                              ]
                                  },
                         "otLens":  {
                                        "framing":  "Feed lessons back into OT controls and the risk assessment.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-4",
                                                             "CA-7"
                                                         ],
                                        "gotchas":  "OT lessons often stay with engineering and never reach the security programme."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Lessons from incidents drive improvements.",
                                              "partially":  "Partial improvement loop.",
                                              "notAchieved":  "Lessons not used.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "An organisation that learns from incidents matures its defences; one that doesn\u0027t repeats the same failures. Feeding lessons back into controls and the response capability is what turns painful experience into lasting improvement."
                     }
                 ],
    "_contentNote":  "State summaries are paraphrased memory-jogs (NOT verbatim CAF IGPs); each outcome retains empty \u0027igps\u0027 verbatim slots for the licence holder to populate from the authoritative CAF 4.0. OT lens (framing, related 62443-3-3 SRs, NIST 800-82 areas, gotchas) is a consultant-refinable first draft. Source: CAF 4.0 (NCSC, Crown copyright, OGL).",
    "profileRegistry":  "profiles/_registry.json",
    "defaultProfile":  "caf-general",
    "_rationaleNote":  "Per-outcome \u0027rationale\u0027 is a plain-language \u0027why this matters\u0027 (2-3 sentences, practitioner voice, with the OT angle where relevant). It is original explanatory text, not reproduced CAF wording. Companion to stateSummary (what good looks like) and otLens (OT specifics).",
    "targetDimensionLabelPlural":  "Sites"
};
