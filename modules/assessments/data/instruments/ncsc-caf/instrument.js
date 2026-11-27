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
    "framing":  "This assessment checks alignment with the NCSC CAF 4.0 indicators of good practice and identifies the gaps, with a focus on operational technology. The consultant judges each contributing outcome as Achieved, Partially Achieved or Not Achieved against the indicators. It is not a formal CAF assessment or a regulatory submission.",
    "sourceNote":  "Structure and the verbatim Indicators of Good Practice (Achieved / Partially Achieved / Not Achieved) are transcribed from the NCSC Cyber Assessment Framework version 4.0. Contains public sector information licensed under the Open Government Licence v3.0. NCSC CAF material is Crown copyright. The IGP statements are reproduced verbatim as the authoritative reference the consultant judges against; the OT context notes, state summaries and rationale are SolutionsPT commentary and are not part of the CAF.",
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
                                        "framing":  "Board ownership must cover OT and safety risk explicitly, as well as IT risk. In many organisations OT risk never reaches the board.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "PM-1",
                                                             "PM-2"
                                                         ],
                                        "gotchas":  "OT risk often sits with engineering or operations, outside the CISO's remit, and the board frequently has no view of it."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "The board sets and owns the approach to cyber security and resilience, discusses it and bases its decisions on it.",
                                              "partially":  "The board has some awareness and ownership of cyber risk, but this is inconsistent or does not carry through into decisions.",
                                              "notAchieved":  "The board takes little or no ownership of cyber risk to the essential function and seldom if ever discusses it.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Board ownership gives cyber and resilience work its mandate, funding and priority. Without direction from the board, OT security tends to lose out to other demands. In many organisations OT risk never reaches the board, so nobody at that level owns it."
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
                                        "framing":  "Establish who owns OT security, and how responsibility is split between engineering and security.",
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
                                              "partially":  "Security roles exist, but they are unclear or under-resourced, or the competence of the people in them is not assured.",
                                              "notAchieved":  "Roles and responsibilities for security are not established.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Clear roles stop security falling into the gap between IT and engineering, which is the most common organisational weakness in OT. When everyone assumes someone else owns a control, nobody owns it, and accountability is missing when an incident calls for quick decisions."
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
                                        "framing":  "Decisions that affect OT, such as new connectivity or remote access, need senior sign-off informed by risk.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "PM-1"
                                                         ],
                                        "gotchas":  "OT changes are often decided on operational grounds without anyone from security involved."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Senior people are accountable for the security of the essential function, and their decisions are informed by risk.",
                                              "partially":  "Accountability exists, but decisions are not consistently informed by risk.",
                                              "notAchieved":  "Nobody at senior level is clearly accountable for decisions that affect the security of the essential function.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Decisions about the essential function must be made by people who understand both the cyber risk and the operational consequences. When security decisions are taken without operational input, or operational changes are made without security input, the result is controls that do not fit the plant or risks that nobody has accepted."
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
                                        "framing":  "Risk assessment must judge consequence in OT terms, where safety and availability come before confidentiality.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "RA-1",
                                                             "RA-3",
                                                             "Section 5 (Risk Management)"
                                                         ],
                                        "gotchas":  "Generic IT risk methods understate physical and safety consequences. Use a consequence-driven OT method."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A defined, repeated risk management process identifies and prioritises risks to the essential function.",
                                              "partially":  "A risk management process exists, but it is incomplete, applied ad hoc or not maintained.",
                                              "notAchieved":  "There is no effective risk management process for the essential function.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A defined risk process turns a list of possible threats into prioritised, justified action. Without one, effort goes where the loudest voice points and can miss where the consequences are greatest. In OT the most serious consequences usually concern safety and availability more than data loss."
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
                                        "framing":  "The threat picture should include threats specific to OT, such as ICS malware, compromise of a vendor and attacks aimed at safety systems.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "RA-3"
                                                         ],
                                        "gotchas":  "There is less threat intelligence for OT than for IT. Use ICS-specific sources and past ICS incidents."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Threats to the essential function are understood and inform risk decisions.",
                                              "partially":  "Threats are partly understood, or the picture is out of date.",
                                              "notAchieved":  "Threats to the essential function are not understood.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "An organisation cannot defend against threats it does not understand. A current picture of who might target the essential function, and how, lets it prepare for the attacks it is likely to face. Generic IT threats may not apply to a control environment."
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
                                        "framing":  "Assurance in OT must not disrupt the live process. Use passive methods, or methods already shown to be safe.",
                                        "relatedSRs":  [
                                                           "SR3.3"
                                                       ],
                                        "related80082":  [
                                                             "CA-2",
                                                             "CA-7"
                                                         ],
                                        "gotchas":  "Active testing on live OT systems can cause outages, so assurance methods must protect availability."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Testing or validation suited to the function gives assurance that controls work as intended.",
                                              "partially":  "Some assurance takes place, but there are gaps or areas that have not been verified.",
                                              "notAchieved":  "There is little or no assurance that controls are effective.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Assurance tests whether the risk picture holds in practice. Without independent challenge, an organisation can believe its risk is well managed until an incident shows otherwise. Assurance finds the gaps between what is documented and what happens on site."
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
                                        "framing":  "The OT asset inventory underpins other controls and is often the weakest area. It should include firmware and PLC detail.",
                                        "relatedSRs":  [
                                                           "SR7.8"
                                                       ],
                                        "related80082":  [
                                                             "CM-8",
                                                             "Section 6.2"
                                                         ],
                                        "gotchas":  "Use passive discovery where possible, because active scanning can disrupt fragile OT devices."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Assets supporting the essential function are identified, inventoried and managed through life.",
                                              "partially":  "Knowledge of the assets is incomplete or out of date.",
                                              "notAchieved":  "Assets are not adequately identified or managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Assets that nobody knows about cannot be protected, patched or monitored. A complete, current asset inventory underpins almost every other control. In OT it is often the weakest area, because legacy, undocumented and vendor-installed equipment builds up over decades."
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
                                        "framing":  "OT vendors often have deep remote access, so integrator and OEM risk is central to this outcome.",
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
                                              "partially":  "Some supplier risk management is in place, but it is incomplete.",
                                              "notAchieved":  "Supply chain risk is not managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Suppliers and integrators often have deep, standing access to OT, and they supply firmware and software that the asset owner cannot fully inspect. A supply chain compromise turns a trusted route into an attack path, and that route is one of the most direct ways into the environment."
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
                                        "framing":  "This covers OEM firmware and application support, including patch availability and the support lifecycle.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "SA-3",
                                                             "SA-10"
                                                         ],
                                        "gotchas":  "Many OT products are still in service after their support has ended. Record the compensating controls."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Software and products are developed and supported securely across the supply relationship.",
                                              "partially":  "There is some assurance of secure development and support, but it is incomplete.",
                                              "notAchieved":  "There is no assurance of secure development or support.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Software built or maintained without regard to security brings vulnerabilities straight into the control system. Secure development and support practices, in-house or required of suppliers, stop weaknesses entering through the work that keeps the system running."
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
                                        "framing":  "Policies must deal with conditions in OT, such as limits on patching, remote access and removable media.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "Section 6 (Program)"
                                                         ],
                                        "gotchas":  "IT policies copied across to OT often cannot be followed, so staff ignore them. Adapt them to OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Security policies, processes and procedures are developed to protect the essential function.",
                                              "partially":  "Policies exist, but they are incomplete or do not address OT.",
                                              "notAchieved":  "Security policies and processes are inadequate.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Policy sets out in advance how the organisation will protect the essential function, so the approach is consistent. Without it, protection depends on individual memory and goodwill, which varies by person and shift and cannot be assured or audited."
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
                                        "framing":  "Check what happens on the plant floor as well as what the documents say.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [

                                                         ],
                                        "gotchas":  "Plant practice often differs from corporate policy, so verify it on site."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Policies and processes are followed and embedded in practice.",
                                              "partially":  "Policies are partly followed, and there are gaps between policy and practice.",
                                              "notAchieved":  "Policies are not followed in practice.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A policy that exists only on paper protects nothing. It starts to protect the function once it is built into how people work. Many assessments find the main exposure in the gap between written policy and practice."
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
                                        "framing":  "Shared HMI and engineering logins are normal in OT and are the main weakness for this outcome.",
                                        "relatedSRs":  [
                                                           "SR1.1",
                                                           "SR1.2",
                                                           "SR2.1"
                                                       ],
                                        "related80082":  [
                                                             "IA-2",
                                                             "AC-3"
                                                         ],
                                        "gotchas":  "Individual authentication is hard on legacy HMIs. Where MFA is impossible, note the compensating controls."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Access to the essential function\u0027s systems is reliably verified, authenticated and authorised.",
                                              "partially":  "Authentication and authorisation are incomplete or inconsistent.",
                                              "notAchieved":  "Identity verification and authentication are weak or absent.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Access control rests on verifying who and what is connecting. In OT, shared logins and unauthenticated access are common because they are convenient, which makes identity, authentication and authorisation both important and hard to put in place."
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
                                        "framing":  "This covers engineering laptops and transient and vendor devices on the OT network.",
                                        "relatedSRs":  [
                                                           "SR1.2",
                                                           "SR2.3"
                                                       ],
                                        "related80082":  [
                                                             "CM-8"
                                                         ],
                                        "gotchas":  "Transient and contractor devices are a common route into OT and are often unmanaged."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Devices accessing the essential function are managed and trusted.",
                                              "partially":  "Devices are only partly managed.",
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
                                        "gotchas":  "Standing admin rights on engineering workstations are common, and least privilege is rare in OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Privileged access is tightly controlled and monitored.",
                                              "partially":  "Privileged access is partly controlled, with gaps.",
                                              "notAchieved":  "Privileged access is uncontrolled.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Privileged accounts can change the process itself, so their compromise is among the most serious events in OT. Tight control over who holds elevated rights, and when, makes those accounts harder for an attacker to obtain and limits the damage a single mistake can cause."
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
                                        "framing":  "OT often has no central IdAM, and accounts are held locally on each device.",
                                        "relatedSRs":  [
                                                           "SR1.3",
                                                           "SR1.4",
                                                           "SR1.5"
                                                       ],
                                        "related80082":  [
                                                             "AC-2",
                                                             "IA-4"
                                                         ],
                                        "gotchas":  "Central IdAM may be impractical for legacy OT. Record a realistic target."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Identity and access management is coherent and managed across the function.",
                                              "partially":  "IdAM is incomplete or fragmented.",
                                              "notAchieved":  "There is no coherent IdAM.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Access that is granted and never reviewed builds into a standing risk, with old accounts and excess rights left in place for years. Managing identity and access across the whole lifecycle keeps each person's rights in line with what they need."
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
                                        "framing":  "In OT, data includes process values, recipes, logic, configuration and historian records.",
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
                                              "partially":  "The important data is only partly understood.",
                                              "notAchieved":  "Important data is not understood.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Data cannot be protected properly until the organisation knows what it holds and why it matters. In OT this includes process values, configuration and logic whose integrity affects physical operation, as well as conventional records. Misjudging their importance leads to too much or too little protection."
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
                                        "framing":  "Many OT protocols are unauthenticated and send data in clear text, so protection is often applied at the network layer.",
                                        "relatedSRs":  [
                                                           "SR3.1",
                                                           "SR4.1"
                                                       ],
                                        "related80082":  [
                                                             "SC-8"
                                                         ],
                                        "gotchas":  "Legacy protocols such as Modbus and DNP3 have no built-in protection. Segmenting the network is usually more practical than encrypting these protocols in place."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Data in transit is protected appropriately.",
                                              "partially":  "Data in transit is only partly protected.",
                                              "notAchieved":  "Data in transit is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Data moving across the network can be read or altered in transit, and in OT an altered setpoint or command has physical consequences. Protection in transit covers confidentiality where that matters, and integrity, which matters more for control systems."
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
                                        "framing":  "This covers the historian, engineering file stores and backups of logic and configuration.",
                                        "relatedSRs":  [
                                                           "SR4.1",
                                                           "SR3.4"
                                                       ],
                                        "related80082":  [
                                                             "SC-28"
                                                         ],
                                        "gotchas":  "Backups of configuration and logic are sensitive. Protect where they are stored and check their integrity."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Stored data is protected appropriately.",
                                              "partially":  "Stored data is only partly protected.",
                                              "notAchieved":  "Stored data is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Stored data, such as configuration, credentials and historian records, is a target for theft and for tampering that could hide or enable an attack. Protecting it at rest limits what an intruder gains from reaching a data store and what they can change without being noticed."
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
                                        "framing":  "The main concern is engineering laptops that carry project files and logic off site.",
                                        "relatedSRs":  [
                                                           "SR4.1"
                                                       ],
                                        "related80082":  [
                                                             "MP-5"
                                                         ],
                                        "gotchas":  "Project files on engineering laptops are an easily overlooked route for data loss or theft."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Mobile data is protected.",
                                              "partially":  "Mobile data is only partly protected.",
                                              "notAchieved":  "Mobile data is not protected.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Data on mobile devices and removable media leaves the controlled environment and goes where the organisation\u0027s controls do not reach. Managing it limits the loss of sensitive configuration and the familiar OT risk of removable media bringing malware back in."
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
                                        "framing":  "Decommissioned controllers and drives may still hold logic, credentials and network detail.",
                                        "relatedSRs":  [
                                                           "SR4.2"
                                                       ],
                                        "related80082":  [
                                                             "MP-6"
                                                         ],
                                        "gotchas":  "Old OT kit that is sold or scrapped with its configuration intact can leak information."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Media and equipment are sanitised before disposal or reuse.",
                                              "partially":  "Sanitisation is carried out inconsistently.",
                                              "notAchieved":  "Media and equipment are not reliably sanitised.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Equipment and media reach end of life still holding configuration, credentials and network detail that would help an attacker. Proper sanitisation stops decommissioned kit from giving away a map of the environment when it leaves the organisation\u0027s control."
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
                                        "framing":  "This covers segmentation, zones and conduits, and secure architecture such as the Purdue model.",
                                        "relatedSRs":  [
                                                           "SR5.1",
                                                           "SR5.2"
                                                       ],
                                        "related80082":  [
                                                             "SA-8",
                                                             "Section 5"
                                                         ],
                                        "gotchas":  "Brownfield OT is rarely designed securely, so assess it against a realistic target architecture."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are designed to be secure for the essential function.",
                                              "partially":  "Security is only partly designed into the systems.",
                                              "notAchieved":  "Systems are not securely designed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Security designed in from the start costs far less and works better than security added later. In OT, systems run for decades, so early design choices stay in place for a long time. Secure design, including sound segmentation, sets the resilience of everything built on it."
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
                                        "framing":  "OT hosts should run only the functions they need, with unused services and ports disabled.",
                                        "relatedSRs":  [
                                                           "SR7.6",
                                                           "SR7.7"
                                                       ],
                                        "related80082":  [
                                                             "CM-6",
                                                             "CM-7"
                                                         ],
                                        "gotchas":  "Vendor-default builds are common in OT, and support terms may limit hardening."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are securely configured and hardened.",
                                              "partially":  "Systems are only partly hardened.",
                                              "notAchieved":  "Systems run default or insecure configurations.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Default configurations favour ease of setup over security and leave enabled services and access that the function never needs. Secure configuration cuts the attack surface down to what is required. It is one of the few hardening measures that can be applied widely, even on constrained OT devices."
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
                                        "framing":  "Remote access and change control are central to this outcome in OT.",
                                        "relatedSRs":  [
                                                           "SR1.13",
                                                           "SR2.6"
                                                       ],
                                        "related80082":  [
                                                             "MA-4",
                                                             "CM-3"
                                                         ],
                                        "gotchas":  "The main management risks in OT are vendor remote access and uncontrolled change."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are managed securely, including changes, maintenance and remote access.",
                                              "partially":  "Systems are only partly managed securely.",
                                              "notAchieved":  "Systems are managed insecurely.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "The system is configured and controlled through its management and administration interfaces, so an attacker who compromises them gains control of the system. Securing management access, especially remote access and access across networks, protects the most powerful routes into the environment."
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
                                        "framing":  "Patching in OT is limited, so risk-based mitigation and compensating controls matter most.",
                                        "relatedSRs":  [
                                                           "SR2.3",
                                                           "SR3.2"
                                                       ],
                                        "related80082":  [
                                                             "RA-5",
                                                             "SI-2"
                                                         ],
                                        "gotchas":  "Patching is often impossible without an outage. Assess the mitigation strategy as well as the patch rate."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Vulnerabilities are managed across the function\u0027s systems.",
                                              "partially":  "Vulnerabilities are only partly managed.",
                                              "notAchieved":  "Vulnerabilities are not managed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Most breaches exploit known, unpatched vulnerabilities. A managed process to find, assess and address them shortens the window that attackers rely on. In OT, where patching is often limited, assessment and mitigation carry as much weight as the patching itself."
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
                                        "framing":  "This covers the resilience of the physical process as well as the IT systems.",
                                        "relatedSRs":  [
                                                           "SR7.1",
                                                           "SR7.2"
                                                       ],
                                        "related80082":  [
                                                             "CP-2"
                                                         ],
                                        "gotchas":  "OT resilience includes safe states and manual fallback as well as system redundancy."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "The organisation has prepared to keep the essential function resilient.",
                                              "partially":  "Preparation for resilience is incomplete.",
                                              "notAchieved":  "The organisation has not prepared for resilience.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Resilience depends on preparation before a disruption. Knowing in advance what the essential function needs to keep running, and what to do when it cannot, can stop a contained event from growing into a crisis."
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
                                        "framing":  "This covers redundancy, island-mode operation and fail-safe behaviour.",
                                        "relatedSRs":  [
                                                           "SR5.2",
                                                           "SR7.1"
                                                       ],
                                        "related80082":  [
                                                             "CP-2"
                                                         ],
                                        "gotchas":  "The ability to run isolated, in island mode, is an important resilience property in OT."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Systems are designed for resilience.",
                                              "partially":  "Systems are only partly designed for resilience.",
                                              "notAchieved":  "Systems are not designed for resilience.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A system designed to fail safe and degrade gracefully limits how far any single failure or attack can spread. In OT this includes keeping the process running, or bringing it to a safe state, without relying on supporting systems that are compromised or unavailable."
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
                                        "framing":  "Backups of controller logic, configurations and HMIs should be stored securely and tested by restoring them.",
                                        "relatedSRs":  [
                                                           "SR7.3",
                                                           "SR7.4"
                                                       ],
                                        "related80082":  [
                                                             "CP-9",
                                                             "CP-10"
                                                         ],
                                        "gotchas":  "In OT, backups of logic and configuration are often missing or have never been tested by a restore."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Complete, secured and tested backups allow recovery from extreme events.",
                                              "partially":  "Backups exist, but they are incomplete, unsecured or untested.",
                                              "notAchieved":  "Backups are inadequate or absent.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Backups are the last line of defence against ransomware, destructive attacks and serious error. In OT, the backups most often missing are of controller logic and configuration. Recovery can only be relied on when backups are sound, verified and restorable."
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
                                        "framing":  "The culture has to bring the engineering and security outlooks together.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "AT-2"
                                                         ],
                                        "gotchas":  "Engineering culture puts uptime first, and security messages need to take account of that."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A positive cyber security culture supports the essential function.",
                                              "partially":  "The security culture is uneven across the organisation.",
                                              "notAchieved":  "The security culture is poor.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Culture determines what people do when nobody is watching and no procedure fits. A workforce that values security catches what controls miss. Where staff treat security as someone else\u0027s problem, even well-designed defences are weakened."
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
                                        "framing":  "OT staff need training relevant to OT. Generic IT awareness training is not enough.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "AT-3"
                                                         ],
                                        "gotchas":  "Generic phishing training misses risks specific to OT. Adapt it for operators and engineers."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Staff have appropriate cyber security training for their roles.",
                                              "partially":  "Training is incomplete or does not cover every role.",
                                              "notAchieved":  "Training is inadequate.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "People act securely when they know how. OT staff need training set in the operational environment they work in, which generic office IT material does not cover. Training turns good intentions into the right action, in routine work and in an emergency."
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
                                        "framing":  "Monitoring must be able to read OT protocols, which an IT SIEM on its own rarely does.",
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
                                              "partially":  "Monitoring covers only some of the systems supporting the essential function.",
                                              "notAchieved":  "Monitoring coverage is inadequate.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Attacks cannot be detected in parts of the environment that are not monitored. Monitoring coverage of the parts that matter is a precondition for noticing an attack, and gaps in coverage are blind spots an intruder can move through unseen."
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
                                        "gotchas":  "Many OT devices log poorly or not at all, so capture what is feasible."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Logs are securely collected and protected.",
                                              "partially":  "Logs are only partly secured.",
                                              "notAchieved":  "Logs are not secured.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Logs are useful only if they are complete and trustworthy, and attackers often alter or delete them early on. Securing logs keeps the evidence intact for an investigation."
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
                                        "framing":  "Alerting should be tuned to OT baselines and anomalies.",
                                        "relatedSRs":  [
                                                           "SR6.2"
                                                       ],
                                        "related80082":  [
                                                             "SI-4"
                                                         ],
                                        "gotchas":  "OT traffic is repetitive, so anomaly-based alerting can work well once a baseline is set."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Alerts are generated from monitoring data.",
                                              "partially":  "Alerting is only partly in place.",
                                              "notAchieved":  "There is no effective alerting.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Collecting monitoring data achieves nothing unless something prompts a person to look at it. Timely, meaningful alerts give the organisation a chance to respond before an intrusion becomes an incident."
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
                                        "framing":  "Triage needs OT context, meaning knowledge of what is normal for the process.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-4"
                                                         ],
                                        "gotchas":  "IT analysts without OT context misjudge OT alerts. Pair them with engineers who know the process."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Security alerts are triaged with context.",
                                              "partially":  "Only some alerts are triaged.",
                                              "notAchieved":  "Alerts are not triaged.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Monitoring is only useful if real security incidents can be picked out from the constant background of events. Without reliable identification, real attacks are lost in the noise and the response never starts."
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
                                        "framing":  "OT detection needs a mix of OT and security skills, which is often scarce.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-2"
                                                         ],
                                        "gotchas":  "Detection staff who understand OT are rare. Record any resourcing gap."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Personnel have the skills for monitoring and detection.",
                                              "partially":  "The necessary skills are only partly available.",
                                              "notAchieved":  "Monitoring skills are inadequate.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Monitoring is only as good as the tools deployed and the people reading them. Detection works when the tooling is adequate and the analysts are skilled. In OT, those skills must cover both security and the process."
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
                                        "gotchas":  "OT behaviour is predictable, so baselining normal behaviour works well and is worth using."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "User and system behaviour is understood, and threat intelligence informs monitoring.",
                                              "partially":  "Behaviour is partly understood, or threat intelligence is used only in part.",
                                              "notAchieved":  "Behaviour is not understood, and threat intelligence is not used.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Refining detection as new threats emerge keeps monitoring relevant as attackers change their methods. Detection that is tuned once and never revisited falls behind attackers who adapt."
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
                                        "framing":  "This outcome is new in CAF 4.0. Threat hunting in OT must not disrupt operations and should be driven by data.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "Section 6"
                                                         ],
                                        "gotchas":  "Threat hunting is mature in IT but new in OT. Expect most operators to be at a low level here."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Proactive threat hunting is carried out, documented and drives improvement.",
                                              "partially":  "Some threat hunting takes place, but it is ad hoc or undocumented.",
                                              "notAchieved":  "No threat hunting is carried out.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Threat hunting looks for intruders who have evaded automated detection, on the assumption that prevention sometimes fails. It is still new in OT and hard to do well, but it can find a capable attacker who is deliberately avoiding alerts."
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
                                        "framing":  "The plan must cover OT and safety scenarios and involve engineering.",
                                        "relatedSRs":  [
                                                           "SR6.1"
                                                       ],
                                        "related80082":  [
                                                             "IR-1",
                                                             "IR-8"
                                                         ],
                                        "gotchas":  "IT incident response plans rarely cover plant shutdown or safe-state decisions, so OT scenarios need to be added."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "A response plan covers incidents affecting the essential function.",
                                              "partially":  "The plan is incomplete or does not address OT.",
                                              "notAchieved":  "There is no adequate response plan.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "A response plan prepared in advance allows fast, coordinated action under pressure, when there is no time to write one. In OT the plan must include engineering and safe-state decisions that an IT playbook does not cover, such as whether and how to shut the process down."
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
                                        "framing":  "Establish who has authority to stop a process. Engineering and security need to coordinate closely.",
                                        "relatedSRs":  [
                                                           "SR7.4"
                                                       ],
                                        "related80082":  [
                                                             "IR-4",
                                                             "CP-10"
                                                         ],
                                        "gotchas":  "Authority to halt production during an incident is often unclear and should be settled in advance."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "The capability and roles to respond and recover are in place, with authority to act.",
                                              "partially":  "The capability or the authority to act is only partly in place.",
                                              "notAchieved":  "Response and recovery capability is inadequate.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Plans help only if the organisation can carry them out. Response and recovery need people, tools and rehearsed procedures to restore operation, and the recovery capability limits how long the essential function stays degraded."
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
                                        "framing":  "Exercises should include OT and safety scenarios and engineering staff.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-3",
                                                             "CP-4"
                                                         ],
                                        "gotchas":  "Tabletop exercises that include OT are uncommon, and their absence is a frequent finding."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Response and recovery are tested and exercised.",
                                              "partially":  "Response and recovery are exercised only in part.",
                                              "notAchieved":  "Response and recovery are not tested.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "An untested plan tends to fail the first time it is used. Exercising the response under realistic conditions exposes gaps, wrong assumptions and missing contacts while they are still cheap to fix."
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
                                        "framing":  "Root cause analysis must consider OT and process factors as well as IT.",
                                        "relatedSRs":  [

                                                       ],
                                        "related80082":  [
                                                             "IR-4"
                                                         ],
                                        "gotchas":  "Finding the root cause of an OT incident needs engineering input."
                                    },
                         "response":  {
                                          "state":  null,
                                          "evidence":  "",
                                          "notes":  ""
                                      },
                         "stateSummary":  {
                                              "achieved":  "Incident root causes are analysed.",
                                              "partially":  "Root causes are analysed only in part.",
                                              "notAchieved":  "Root causes are not analysed.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "Understanding why an incident happened helps stop it happening again. Root cause analysis leads to a fix for the underlying weakness. Treating only the symptom leaves that weakness in place for the next attacker."
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
                                              "partially":  "Lessons are only partly used to drive improvement.",
                                              "notAchieved":  "Lessons from incidents are not used.",
                                              "_note":  "Paraphrased memory-jog, NOT verbatim CAF text. Judge against the authoritative CAF IGPs."
                                          },
                         "rationale":  "An organisation that learns from incidents improves its defences, and one that does not tends to repeat the same failures. Lessons need to be fed back into controls and the response capability."
                     }
                 ],
    "_contentNote":  "State summaries are paraphrased memory-jogs (NOT verbatim CAF IGPs); each outcome retains empty \u0027igps\u0027 verbatim slots for the licence holder to populate from the authoritative CAF 4.0. OT lens (framing, related 62443-3-3 SRs, NIST 800-82 areas, gotchas) is a consultant-refinable first draft. Source: CAF 4.0 (NCSC, Crown copyright, OGL).",
    "profileRegistry":  "profiles/_registry.json",
    "defaultProfile":  "caf-general",
    "_rationaleNote":  "Per-outcome \u0027rationale\u0027 is a plain-language \u0027why this matters\u0027 (2-3 sentences, practitioner voice, with the OT angle where relevant). It is original explanatory text, not reproduced CAF wording. Companion to stateSummary (what good looks like) and otLens (OT specifics).",
    "targetDimensionLabelPlural":  "Sites"
};
