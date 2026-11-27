/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/eu-machinery/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["eu-machinery"] = window.App.Data.instruments["eu-machinery"] || {};
window.App.Data.instruments["eu-machinery"].instrument = {
    "id":  "eu-machinery",
    "title":  "EU Machinery Regulation Gap Assessment",
    "framework":  "Regulation (EU) 2023/1230 (Machinery Regulation)",
    "edition":  "2023",
    "family":  "regulation",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "csms-conformance",
    "scoringProfileRef":  "cra-conformance",
    "targetDimension":  "product-manufacturer",
    "targetDimensionLabel":  "Machine",
    "status":  "active",
    "indicative":  true,
    "framing":  "This is a gap assessment against the EU Machinery Regulation (Regulation (EU) 2023/1230) for a manufacturer of machinery or related products. The Regulation applies from 14 January 2027 and repeals Directive 2006/42/EC. The assessment has three layers, each scored separately. The first covers the essential health and safety requirements for each machine and concentrates on the new digital and control-system content. The second covers the manufacturer\u0027s process obligations across the organisation. The third covers conformity and market placement for each machine, where the Annex I classification sets the conformity route. The general machine-safety areas are covered at summary level only, and the assessment is not a machinery-safety inspection.",
    "sourceNote":  "The assessment is built from Regulation (EU) 2023/1230 (Machinery Regulation), OJ L 165, 29.6.2023: the Annex III essential health and safety requirements, the economic operator obligations in Articles 10 to 25, and the documentation and conformity annexes. The requirement text is phrased by the assessor, because most items call for a judgement across several provisions. Where one provision maps to one item, as with the digital and self-evolving control-system provisions of Annex III 1.2.1 and 1.2.6, the item carries its Official Journal wording. The text is reproduced with attribution to the Official Journal of the European Union.",
    "criticalCaveats":  [
                            "This gap assessment concentrates on digital content and conformity and is not a machinery-safety inspection. The general essential health and safety areas (guarding, mechanical risks, mobility, lifting, underground work and lifting of persons) are covered at summary level only, and their In place judgements rely on the manufacturer\u0027s own safety engineering evidence.",
                            "The Regulation applies from 14 January 2027. Directive 2006/42/EC governs machinery placed on the market before that date, and EC type-examination certificates issued under it remain valid until they expire. Each finding should be read against the placement date of the machine concerned.",
                            "Machinery whose safety functions rely on fully or partially self-evolving (machine-learning) systems falls under Annex I Part A. Third-party conformity assessment is mandatory for those systems, and internal control (Module A) is not available.",
                            "This assessment informs conformity but does not determine or certify it. The manufacturer, or a notified body where the Annex I classification requires one, remains responsible for the conformity decision."
                        ],
    "scoringNote":  "Each layer is scored on the conformance scale: In place, Partially in place, Not in place, Unknown or Not applicable.",
    "display":  {
                    "shortName":  "Machinery",
                    "productNoun":  "machine",
                    "referenceTag":  "EU Machinery Regulation (Regulation (EU) 2023/1230)",
                    "captureBanner":  "This assessment is indicative and informs conformity. It is not a conformity assessment or a machinery-safety inspection, and it does not certify the machine. Requirements are phrased by the assessor from Regulation (EU) 2023/1230, or quoted where one provision maps to one question, and the Regulation text governs.",
                    "reportBannerTitle":  "EU Machinery Regulation gap assessment (indicative)",
                    "reportBannerBody":  "This is a gap assessment against the EU Machinery Regulation (Regulation (EU) 2023/1230). The three layers are scored separately and shown side by side, with no combined readiness score, because missing conformity work blocks placing on the market however good the machine engineering is. The assessment informs conformity but does not determine or certify it.",
                    "productsCardNote":  "Add, rename or remove machines here, and select one to set its classification below. M1 and most of M3 are answered for each machine. M2 and the organisation-level conformity obligations are answered once and shared by every machine, including new ones.",
                    "wizardOrgNote":  "These organisation-wide obligations cover the manufacturer\u0027s processes and the organisation-level conformity items. They apply to every machine, so answer them once, before you switch to By machine.",
                    "wizardProductNote":  "These obligations cover each machine\u0027s essential health and safety requirements and its own conformity work. Pick a machine below, work through it, then pick the next one."
                },
    "docx":  {
                 "regName":  "the EU Machinery Regulation (Regulation (EU) 2023/1230)",
                 "coverSubLine":  "EU Machinery Regulation: indicative gap assessment",
                 "docDescription":  "EU Machinery Regulation (2023/1230) indicative gap assessment",
                 "layersSentence":  "Three layers were assessed separately and are reported side by side. They cover the essential health and safety requirements (assessed in most depth on the digital and control-system content), the manufacturer\u0027s process obligations, and conformity and market placement. They are not combined into a single readiness score, because a machine with sound engineering but unfinished conformity work is not ready for the market.",
                 "keyDatesNote":  "The Machinery Regulation applies from 14 January 2027, when Directive 2006/42/EC is repealed. Machinery placed on the market before that date remains governed by the Directive, and existing EC type-examination certificates remain valid until they expire. Readiness should be judged against the placement date that applies to each machine.",
                 "seqPlaceholder":  "Consultant: in one short paragraph, set out what must close before machines are placed on the market under the Regulation from 14 January 2027, what must be in place before each machine can be CE marked, and what can run in parallel.",
                 "exposurePlaceholder":  "Consultant: in one paragraph, describe which machine sales and markets depend on CE marking under the Machinery Regulation, and what non-conformity would mean for them.",
                 "glanceTitle":  "Machinery Regulation readiness summary",
                 "misclassFinding":  "The machine may be misclassified. The matched Annex I category indicates a stricter conformity route than the class set, which changes the required conformity assessment module. A later section sets out the finding.",
                 "howToRead":  "Each requirement is judged In place, Partially in place or Not in place. Most requirements are paraphrased from the Machinery Regulation, and where the roadmap quotes its text it says so. Unknown reduces coverage and confidence, and Not applicable requirements are excluded. The Recommendations section lists every open gap with its evidence, impact, recommended action and owner.",
                 "limitations":  [
                                     "The consultant sets the conformance state of each requirement on the three-point scale (Not in place, Partially in place, In place), based on the evidence gathered. The conformance index for each layer is shown for context only. Unknown answers reduce coverage and confidence, and Not applicable requirements are excluded. A requirement that is Not in place is reported as a floor finding and is never averaged away.",
                                     "This is an indicative gap assessment against the EU Machinery Regulation. It is not a conformity assessment or a machinery-safety inspection, and it does not certify the machine. The requirement text is paraphrased, and the Regulation text governs. The general machine-safety areas are assessed at summary level on the manufacturer\u0027s own evidence. The manufacturer, or a notified body where the Annex I classification requires one, remains responsible for the conformity decision."
                                 ],
                 "categoryRowLabel":  "Matched Annex I category (classification aid)",
                 "defaultClassLabel":  "Not listed in Annex I (internal control)",
                 "noBlendPhrase":  "a single readiness score",
                 "blockerTail":  " cannot be lawfully CE-marked or placed on the EU market until those obligations are met, however complete its engineering.",
                 "blockerTailMulti":  " cannot be lawfully CE-marked or placed on the EU market until those obligations are met, however complete their engineering.",
                 "multiOrgSentence":  "The organisation-wide obligations (the manufacturer\u0027s process obligations and the organisation-level conformity items covering sales-channel duties) were assessed once for the manufacturer and apply to every machine. The essential health and safety requirements and the remaining conformity obligations were assessed for each machine. The layers are reported side by side and are not combined into a single readiness score.",
                 "seqPlaceholderMulti":  "Consultant: in one short paragraph, set out what must close before machines are placed on the market under the Regulation from 14 January 2027, what must be in place before each machine can be CE marked, and what can run in parallel.",
                 "xlsxTitle":  "EU Machinery Regulation: indicative gap assessment",
                 "xlsxReadMe":  [
                                    "The three layers are scored separately against the Machinery Regulation and shown side by side, with no combined readiness score. M1 covers the essential requirements, in most depth on the digital and control content. M2 covers the manufacturer\u0027s process obligations, and M3 covers conformity and market placement.",
                                    "Layers out of scope are left out. This is an indicative assessment. It is not a conformity assessment or a machinery-safety inspection, and it does not certify the machine. The general machine-safety areas are covered at summary level only. The Regulation applies from 14 January 2027."
                                ]
             },
    "setup":  [
                  {
                      "id":  "setup.layers",
                      "type":  "layer-select",
                      "question":  "Which layers are in scope for this assessment?",
                      "multi":  true,
                      "options":  [
                                      {
                                          "value":  "M1",
                                          "label":  "M1 Essential requirements: digital, control \u0026 safety (per machine)"
                                      },
                                      {
                                          "value":  "M2",
                                          "label":  "M2 Manufacturer process obligations (organisation)"
                                      },
                                      {
                                          "value":  "M3",
                                          "label":  "M3 Conformity \u0026 market placement (per machine)"
                                      }
                                  ],
                      "default":  [
                                      "M1",
                                      "M2",
                                      "M3"
                                  ],
                      "effect":  "Layers left out are not assessed, scored or reported."
                  },
                  {
                      "id":  "setup.class",
                      "type":  "classification-lookup",
                      "question":  "Classify the machine against Machinery Regulation Annex I",
                      "lookupRef":  "shared/machinery-classification.json",
                      "lookupKey":  "machineryClassification",
                      "method":  "Pick the Annex I category that matches the machine or its safety components. Part A, which includes self-evolving safety systems, requires third-party assessment. Part B allows internal control only with full harmonised standard coverage. Unlisted machinery uses Module A.",
                      "deriveClass":  true,
                      "drives":  "The machine\u0027s class decides which conformity route the M3 layer expects: internal control or a notified-body module.",
                      "flagMisclassification":  "An Annex I category matches although the machine is set as unlisted. This changes the conformity route."
                  },
                  {
                      "id":  "setup.product",
                      "type":  "text",
                      "question":  "Machine under assessment (name / model)",
                      "drives":  "M1 and most of M3 are assessed for each machine, so record which machine this covers."
                  }
              ],
    "layers":  [
                   {
                       "id":  "M1",
                       "name":  "Essential requirements: digital, control \u0026 safety",
                       "scope":  "per-product",
                       "summary":  "This layer covers the Annex III essential health and safety requirements for the machine itself. It goes deepest on the new digital content: protection against corruption (1.1.9), safety and reliability of control systems (1.2.1), and self-evolving and autonomous machinery. The general machine-safety areas are covered at summary level."
                   },
                   {
                       "id":  "M2",
                       "name":  "Manufacturer process obligations",
                       "scope":  "organisation",
                       "summary":  "These are the manufacturer\u0027s organisation-wide obligations under Article 10 and related Articles: series conformity, post-market monitoring, corrective action, documentation and instructions, traceability, governance of substantial modifications and the transition from Directive 2006/42/EC."
                   },
                   {
                       "id":  "M3",
                       "name":  "Conformity \u0026 market placement",
                       "scope":  "organisation-and-product",
                       "summary":  "Each machine needs the formal conformity work: Annex I classification and conformity route, technical documentation, standards strategy, EU declaration of conformity, CE marking, machine marking and instructions, and partly completed machinery where relevant. The route depends on the machine\u0027s Annex I class."
                   }
               ],
    "layerInterlock":  "The declaration and CE marking rest on the essential requirements and process obligations in M1 and M2. Assessed on its own, M3 checks the paperwork without showing that those requirements are met.",
    "interlockSpec":  {
                          "conformityLayer":  "M3",
                          "technicalLayers":  [
                                                  "M1",
                                                  "M2"
                                              ]
                      },
    "states":  [
                   {
                       "value":  "in-place",
                       "label":  "In place",
                       "colour":  "green"
                   },
                   {
                       "value":  "partially",
                       "label":  "Partially in place",
                       "colour":  "amber"
                   },
                   {
                       "value":  "not-in-place",
                       "label":  "Not in place",
                       "colour":  "red"
                   }
               ],
    "items":  [
                  {
                      "id":  "MRM1a",
                      "code":  "MR-M1.1",
                      "layerId":  "M1",
                      "title":  "Risk assessment for the machine",
                      "requirement":  "A documented, iterative risk assessment determines which essential health and safety requirements apply and drives the design (Annex III General Principles): limits incl. intended use and reasonably foreseeable misuse, hazards identified, risks estimated and evaluated, and hazards eliminated or reduced in the mandated order of priority. It covers the whole lifecycle and foreseen software updates or evolution of behaviour.",
                      "rationale":  "The whole conformity claim rests on the risk assessment. It decides which EHSRs apply, and it must itself appear in the technical documentation. Under the new Regulation it must also cover digital hazards, because foreseen software updates and the intended evolution of self-evolving behaviour are in scope when the machine is placed on the market.",
                      "evidencePrompt":  "Risk assessment file for this machine: method, hazard list, EHSR applicability mapping, lifecycle and software-update coverage, revision history.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, General Principles"
                  },
                  {
                      "id":  "MRM1b",
                      "code":  "MR-M1.2",
                      "layerId":  "M1",
                      "title":  "Protection against corruption: hardware and connections",
                      "requirement":  "Connecting another device to the machine (directly or remotely) cannot lead to a hazardous situation, and hardware components transmitting safety-relevant signal or data are protected against accidental or intentional corruption, with the machine collecting evidence of legitimate or illegitimate intervention in such hardware (Annex III 1.1.9).",
                      "rationale":  "This provision deals with malicious third parties who reach the machine through its connections. The Regulation treats corruption of a safety-relevant hardware path as a health and safety matter. The provision is new compared with Directive 2006/42/EC, and it brings OT security work into the scope of CE marking.",
                      "evidencePrompt":  "Interface inventory (physical, wireless, remote), hardening of safety-relevant hardware paths, tamper-evidence / intervention logging for those components.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.1.9 (protection against corruption)"
                  },
                  {
                      "id":  "MRM1c",
                      "code":  "MR-M1.3",
                      "layerId":  "M1",
                      "title":  "Protection against corruption: software and data",
                      "requirement":  "Software and data critical for compliance with the essential requirements are identified as such and protected against accidental or intentional corruption; the machine identifies the software installed on it that is necessary for safe operation and can present that information at all times; and it collects evidence of interventions in, or modification of, that software or its configuration (Annex III 1.1.9).",
                      "rationale":  "The machine itself must list its safety-critical software, protect its integrity and record changes to it. Software identification and tamper evidence therefore have to be designed into the product, because adding them later is rarely credible. Market surveillance can ask for the evidence.",
                      "evidencePrompt":  "Safety-software inventory function on the machine, integrity protection (signing/secure boot or equivalent), intervention/modification evidence capture.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.1.9 (protection against corruption)"
                  },
                  {
                      "id":  "MRM1d",
                      "code":  "MR-M1.4",
                      "layerId":  "M1",
                      "title":  "Safety and reliability of control systems",
                      "requirement":  "Control systems prevent hazardous situations: they withstand the intended operating stresses and intended and unintended external influences including reasonably foreseeable malicious attempts by third parties; hardware faults, logic errors and reasonably foreseeable human error do not lead to hazardous situations (Annex III 1.2.1).",
                      "rationale":  "Point 1.2.1 now names malicious third parties alongside conventional faults. Under the Regulation, a cyber attack that can put the machine into a hazardous state is a design deficiency in the control system, so the functional safety case and the security case have to form one argument.",
                      "evidencePrompt":  "Control-system safety case (such as ISO 13849 or IEC 62061) extended with the security threat analysis for hazard-capable functions; test or assessment evidence.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.2.1 (safety and reliability of control systems)"
                  },
                  {
                      "id":  "MRM1e",
                      "code":  "MR-M1.5",
                      "layerId":  "M1",
                      "title":  "Safety-function limits and protected settings",
                      "requirement":  "The limits of the safety functions are established in the manufacturer\u0027s risk assessment, and modifications to settings or rules (whether generated by the machine or by operators, including during a learning phase) are prevented where they could lead to hazardous situations (Annex III 1.2.1(c)-(d)).",
                      "rationale":  "Changes to parameters and rules are a common way for a machine to become dangerous, and with learning systems the machine itself can make such changes. The Regulation requires the design to prevent hazardous modification. A procedure that only discourages it does not meet that requirement.",
                      "evidencePrompt":  "Safety-function limit definitions in the risk assessment; access control / interlocks on safety-relevant settings; learning-phase constraints where applicable.",
                      "verbatimText":  "the parameters of the machinery or related product shall not change in an uncontrolled way, where such change could lead to hazardous situations;",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.2.1, point (b)"
                  },
                  {
                      "id":  "MRM1f",
                      "code":  "MR-M1.6",
                      "layerId":  "M1",
                      "title":  "Safety-software tracing log",
                      "requirement":  "The machine enables a tracing log of the data generated in relation to interventions and of the versions of safety software uploaded after placing on the market, retained for five years after each upload, exclusively to demonstrate conformity to a competent authority on reasoned request (Annex III 1.2.1(f)).",
                      "rationale":  "Software changes made to safety systems after placement must be traceable for five years. Without a versioned upload log in the machine or its management system, the manufacturer cannot answer a market surveillance request, and the obligation usually outlasts the project team.",
                      "evidencePrompt":  "Safety-software version/upload logging mechanism, retention arrangement (5 years per upload), access path for responding to an authority request.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1.2 (control systems)"
                  },
                  {
                      "id":  "MRM1g",
                      "code":  "MR-M1.7",
                      "layerId":  "M1",
                      "title":  "Self-evolving control systems: containment and records",
                      "requirement":  "Where the machine has fully or partially self-evolving behaviour or logic operating with varying autonomy: it cannot perform actions beyond its defined task and movement space; data on the safety-related decision-making of software-based safety systems is recorded and retained for one year after collection; and it remains possible at all times to correct the machine to maintain its inherent safety (Annex III 1.2.1, self-evolving provisions).",
                      "rationale":  "These provisions set the limits for machine-learning behaviour in safety roles. The machine must stay within its defined task and movement space, keep records of its safety decisions and remain open to human correction at all times. They also affect classification, because self-evolving safety systems put the machine into Annex I Part A and third-party assessment.",
                      "evidencePrompt":  "Task/movement-space envelope enforcement, safety-decision data recording (1-year retention), correction/override mechanism. N/A if the machine has no self-evolving behaviour.",
                      "verbatimText":  "modifications to the settings or rules, generated by the machinery or related product or by operators, including during the machinery or related product learning phase, shall be prevented, where such modifications could lead to hazardous situations;",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.2.1, point (c)"
                  },
                  {
                      "id":  "MRM1h",
                      "code":  "MR-M1.8",
                      "layerId":  "M1",
                      "title":  "Wireless, remote and network-dependent operation",
                      "requirement":  "For wireless control, a communication or connection failure, or a faulty connection, does not lead to a hazardous situation; and interruption, re-establishment or fluctuation of the power supply or communication network connection does not create hazards: no unexpected start, no prevented stop, protective devices remain effective (Annex III 1.2.1 last para, 1.2.6). Remote-controlled machinery stops automatically on loss of control, stop signal, safety fault or missing validation signal (3.3.3).",
                      "rationale":  "The Regulation treats loss of connection in the same way as loss of power, and the machine must fail to a safe state. For remotely driven and mobile machinery the stop conditions are explicit and can be tested.",
                      "evidencePrompt":  "Failure-mode behaviour for comms/network/power loss (design + test evidence); remote-control watchdog/validation-signal implementation.",
                      "verbatimText":  "For wireless control, a failure of the communication or connection or a faulty connection shall not lead to a hazardous situation.",
                      "allowNA":  true,
                      "reference":  "Annex III, 1.2.1 (wireless control) and 1.2.6"
                  },
                  {
                      "id":  "MRM1i",
                      "code":  "MR-M1.9",
                      "layerId":  "M1",
                      "title":  "Human-machine interaction for autonomy",
                      "requirement":  "Ergonomics and the human-machine interface account for machines with self-evolving behaviour or varying autonomy: the HMI is adapted to foreseeable operator characteristics, and where relevant the machine responds to people adequately (verbally or non-verbally) and communicates its planned actions comprehensibly to operators (Annex III 1.1.6(f)-(g)).",
                      "rationale":  "When a machine\u0027s behaviour cannot be fully predicted from the manual, the machine must make its intentions clear to the people around it. This is a new design requirement aimed at collaborative and autonomous machinery, and failures to meet it show up in operator safety incidents.",
                      "evidencePrompt":  "HMI design rationale for autonomous/evolving behaviour, planned-action communication (signals, displays, gestures), operator trials or usability evidence. N/A if no such behaviour.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1.2 (control systems)"
                  },
                  {
                      "id":  "MRM1j",
                      "code":  "MR-M1.10",
                      "layerId":  "M1",
                      "title":  "Autonomous mobile machinery: supervision and detection",
                      "requirement":  "Autonomous mobile machinery has a supervisory function where relevant: remote receipt of information, alerts on dangerous situations, and remote actions limited to stop/start/move-to-safe-state, permitted only with visibility of the movement and working area and operational protective devices; without the active supervisory function the machinery cannot operate. It moves in a protected enclosed zone and/or detects persons, animals and obstacles in its vicinity (Annex III 3.2.4, 3.3.2, 3.3.3).",
                      "rationale":  "The autonomy provisions define what remote supervision must involve before an AMR, AGV or other autonomous machine can lawfully be placed on the market: limited remote authority, situational awareness and protective detection.",
                      "evidencePrompt":  "Supervisory-function specification and limits, detection-system coverage, enclosed-zone/peripheral protection design. N/A if the machine is not autonomous mobile machinery.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 3 (mobility)"
                  },
                  {
                      "id":  "MRM1k",
                      "code":  "MR-M1.11",
                      "layerId":  "M1",
                      "title":  "General machine safety: summary judgement (Annex III Chapter 1)",
                      "requirement":  "As a summary judgement, the chapter 1 essential requirements are met on the manufacturer\u0027s evidence (safety integration principles, materials, lighting, handling, ergonomics, operating positions and seating, starting/stopping and emergency stop, mode selection, protection against mechanical and other risks, guards and protective devices, maintenance and access, isolation of energy, information/warnings/marking and instructions content).",
                      "rationale":  "This assessment goes into depth on the digital content, but conventional machine-safety engineering still decides conformity. This summary item records the manufacturer\u0027s own safety engineering position, which is typically design to standards with internal or third-party verification. The report therefore covers the full scope of the Regulation without claiming to be a safety inspection.",
                      "evidencePrompt":  "Design-standard mapping (harmonised standards applied), internal verification reports, safety sign-off for this machine. Judge this on the manufacturer\u0027s evidence without inspecting the machine.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1"
                  },
                  {
                      "id":  "MRM1l",
                      "code":  "MR-M1.12",
                      "layerId":  "M1",
                      "title":  "Supplementary EHSR chapters: summary judgement (Annex III Chapters 2-6)",
                      "requirement":  "As a summary judgement, where the machine falls under a supplementary chapter, those additional essential requirements are met on the manufacturer\u0027s evidence. The supplementary chapters cover foodstuffs, cosmetics or pharmaceutical machinery, portable hand-held or fixing machinery, woodworking machinery, plant-protection application, mobility (Ch 3), lifting operations (Ch 4), underground work (Ch 5) and lifting of persons (Ch 6).",
                      "rationale":  "The supplementary chapters cover the most severe conventional hazards, such as mobility, lifting and lifting of persons, and carry their own marking and instruction duties. The summary judgement keeps them in the gap roadmap although this engagement does not assess them in depth.",
                      "evidencePrompt":  "Which chapters apply and the manufacturer\u0027s conformity evidence for each (standards, calculations, tests such as ROPS/FOPS or lifting coefficients). N/A if no supplementary chapter applies.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapters 2 to 6"
                  },
                  {
                      "id":  "MRM1m",
                      "code":  "MR-M1.13",
                      "layerId":  "M1",
                      "title":  "Residual risks: warnings and user information",
                      "requirement":  "Residual risks that remain after inherently safe design and safeguarding are communicated: required warnings and warning devices are provided on the machine, and users are informed of residual risks, required training and any personal protective equipment (Annex III 1.1.2(b), 1.7.2, 1.7.3).",
                      "rationale":  "Market surveillance usually checks first that residual risks are carried from the risk assessment into the warnings and instructions, because a mismatch is visible on paper. For connected machinery this includes digital residual risks such as degraded modes, update states and the limits of remote operation.",
                      "evidencePrompt":  "Residual-risk register traced to warnings on the machine and to the instructions for use, including digital/connectivity residual risks.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1 (information and warnings)"
                  },
                  {
                      "id":  "MRM2a",
                      "code":  "MR-M2.1",
                      "layerId":  "M2",
                      "title":  "Series-production conformity procedures",
                      "requirement":  "Procedures keep machinery in series production in conformity: changes in the production process, in the design or characteristics of the machine, and changes in the harmonised standards, common specifications or other technical specifications by reference to which conformity is declared, are all adequately taken into account (Art 10(4)).",
                      "rationale":  "A conformity assessment shows the position at one point in time, and this obligation keeps conformity under review. Standards change and designs drift, so a manufacturer without a conformity review triggered by change gradually falls out of conformity across every machine it ships.",
                      "evidencePrompt":  "Change-management procedure linking design/production/standards changes to conformity review; examples of its use.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (economic operator obligations)"
                  },
                  {
                      "id":  "MRM2b",
                      "code":  "MR-M2.2",
                      "layerId":  "M2",
                      "title":  "Post-market monitoring: sampling, complaints and recalls register",
                      "requirement":  "Where appropriate to the risks, the manufacturer sample-tests machinery made available on the market, investigates, and keeps a register of complaints, non-conforming machinery and recalls, keeping distributors informed of such monitoring (Art 10(4) second subparagraph).",
                      "rationale":  "Market surveillance asks for the register, and it gives early warning for corrective action. Whether sampling is appropriate is judged against risk, and for connected machinery the monitoring should include how the software behaves in the field.",
                      "evidencePrompt":  "Complaints/non-conformity/recall register, sampling rationale and results, distributor communication records.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (economic operator obligations)"
                  },
                  {
                      "id":  "MRM2c",
                      "code":  "MR-M2.3",
                      "layerId":  "M2",
                      "title":  "Corrective action and authority notification",
                      "requirement":  "On reason to believe a machine placed on the market is not in conformity, the manufacturer immediately takes the corrective action necessary to bring it into conformity, withdraw or recall it; where the machine presents a risk, it immediately informs the competent national authorities of the Member States where it was made available, with details of the non-conformity and corrective actions; and it cooperates with authorities on request (Art 10(9)-(10)).",
                      "rationale":  "The duty is to act immediately and to inform each Member State concerned, which cannot be improvised. A rehearsed decision path from field report to authority notification lets the manufacturer manage a correction before it becomes an enforcement case.",
                      "evidencePrompt":  "Corrective-action/recall procedure with authority-notification step, Member State contact mapping, any exercised cases.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (economic operator obligations)"
                  },
                  {
                      "id":  "MRM2d",
                      "code":  "MR-M2.4",
                      "layerId":  "M2",
                      "title":  "Documentation retention: technical file, declarations, source code",
                      "requirement":  "Technical documentation and the EU declaration of conformity are kept at the disposal of market surveillance authorities for at least 10 years after placing on the market or putting into service; where relevant, the source code or programming logic in the technical documentation is made available to competent national authorities on reasoned request where necessary to check compliance with the essential requirements (Art 10(3)).",
                      "rationale":  "Ten years is longer than most products, teams and repositories last, and under this Regulation the retained material can include source code for safety software. Retention needs a named owner and a defined arrangement, with escrow-level handling for source code, which a project file share does not provide.",
                      "evidencePrompt":  "Retention regime (what, where, 10-year clock per machine), source-code/programming-logic availability arrangement and its access controls.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25, and Annex IV"
                  },
                  {
                      "id":  "MRM2e",
                      "code":  "MR-M2.5",
                      "layerId":  "M2",
                      "title":  "Instructions and information regime: digital delivery",
                      "requirement":  "Machines are accompanied by instructions for use and Annex III information, which may be digital: how to access them is marked on the machine, they are printable/downloadable and storable, remain accessible online for the machine\u0027s expected lifetime and at least 10 years after placing on the market; paper instructions are provided free within one month at the purchaser\u0027s request; and essential safety information is in paper form for (reasonably foreseeable) non-professional users. They are in the language each Member State requires (Art 10(7)).",
                      "rationale":  "The Regulation now allows digital instructions under strict conditions, and a broken link ten years later is a formal non-conformity (Art 46). Meeting the conditions needs an organisation-wide publishing process that covers hosting for the full period, paper copies on request and language coverage.",
                      "evidencePrompt":  "Digital-instructions platform and its 10-year availability arrangement, on-machine access marking convention, paper-on-request process, language matrix.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (instructions and information)"
                  },
                  {
                      "id":  "MRM2f",
                      "code":  "MR-M2.6",
                      "layerId":  "M2",
                      "title":  "Traceability and economic-operator records",
                      "requirement":  "Machines carry the required identification (model/type, series or serial number, and year of construction, meaning completion of manufacturing) and the manufacturer\u0027s name, registered trade name, postal address and website/email or other digital contact, at a single contact point (Art 10(5)-(6)). Economic operators can identify who supplied them and whom they supplied, retaining that information for 10 years (Art 19).",
                      "rationale":  "Traceability limits a field problem to a defined recall and avoids recalling the whole fleet. The year of construction marked on the machine also shows which regime, the Directive or the Regulation, governs each machine during the transition.",
                      "evidencePrompt":  "Marking convention (nameplate content incl. digital contact), supply-chain records regime and its 10-year retention.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (traceability)"
                  },
                  {
                      "id":  "MRM2g",
                      "code":  "MR-M2.7",
                      "layerId":  "M2",
                      "title":  "Substantial-modification governance",
                      "requirement":  "A process assesses whether a physical or digital modification of a machine already on the market (not foreseen or planned by the manufacturer) is a \u0027substantial modification\u0027 (creates a new hazard or increases a risk, requiring new protective measures): whoever carries it out becomes the manufacturer, with a new conformity assessment and declaration before further making available or putting into service (Art 3(16), Art 18).",
                      "rationale":  "Digital modification is explicitly in scope, and a software update that changes capability can reopen conformity. The manufacturer needs governance for its own updates, to decide whether each is foreseen or substantial, and for the retrofit and rebuild services it offers on machines in the field.",
                      "evidencePrompt":  "Substantial-modification decision procedure (incl. software updates), records of assessments made, contractual position for customer-modified machines.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 3 (substantial modification) and Articles 10 to 25"
                  },
                  {
                      "id":  "MRM2h",
                      "code":  "MR-M2.8",
                      "layerId":  "M2",
                      "title":  "Transition planning from Directive 2006/42/EC",
                      "requirement":  "The organisation has a transition plan for 14 January 2027. It sets out which machine models will be placed on the market under the Directive before that date and which under the Regulation after it, and how long existing EC type-examination certificates and approvals remain valid (until expiry). It also tracks harmonised standards and common specifications as they are cited under the Regulation, and plans re-assessment for models that continue beyond the date (Art 51-54).",
                      "rationale":  "The Regulation applies in full from 14 January 2027, with no grace period for machines placed on the market after that date. A transition plan for each model costs little now and much more if it has to be improvised in 2027.",
                      "evidencePrompt":  "Transition register by machine model (placement plans, certificate expiry dates, standards watch, re-assessment schedule).",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 53 (transitional provisions)"
                  },
                  {
                      "id":  "MRM3a",
                      "code":  "MR-M3.1",
                      "layerId":  "M3",
                      "title":  "Annex I classification and conformity route",
                      "requirement":  "The machine (and any safety components placed with it) is checked against the Annex I categories, including Part A points 5-6 for self-evolving (machine-learning) safety systems, and the correct conformity-assessment procedure under Art 25 is selected and followed: Part A = Module B+C, H or G only; Part B = Module A only with full harmonised-standard/common-specification coverage of all relevant EHSRs, else B+C, H or G; unlisted = Module A. A notified body is engaged where the route requires one.",
                      "rationale":  "The classification decides who assesses the machine, what documentation is needed and whose number appears beside the CE marking. The new Part A entries for machine-learning safety systems are easy to miss. One learning component can bring a machine that has self-assessed for years into mandatory third-party assessment.",
                      "evidencePrompt":  "Classification decision record for this machine, chosen module, notified-body engagement (identity, certificate) where required.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex I and the conformity assessment articles"
                  },
                  {
                      "id":  "MRM3b",
                      "code":  "MR-M3.2",
                      "layerId":  "M3",
                      "title":  "Technical documentation (Annex IV Part A)",
                      "requirement":  "Technical documentation is drawn up before placement and includes the Annex IV Part A elements: description and intended use, the risk-assessment documentation with the applicable EHSR list and protective measures, drawings and design information, applied harmonised standards or common specifications (or other solutions), test and verification results, series-conformity measures, a copy of the instructions, and for sensor-fed, remotely driven or autonomous machinery, a description of the system\u0027s characteristics, capabilities, limitations, data and development/testing/validation processes.",
                      "rationale":  "The digital additions have the greatest effect on the technical file. Autonomous and sensor-driven machines must document their data and validation processes, which most machine builders have never had to record. An incomplete technical file is a formal non-conformity even for a safe machine.",
                      "evidencePrompt":  "Technical file index for this machine against Annex IV Part A, incl. the autonomous/sensor-system descriptions where applicable.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex IV, Part A (technical documentation)"
                  },
                  {
                      "id":  "MRM3c",
                      "code":  "MR-M3.3",
                      "layerId":  "M3",
                      "title":  "Standards strategy and presumption of conformity",
                      "requirement":  "The harmonised standards (or Commission common specifications) applied are identified per EHSR, with parts applied specified; where standards are absent or partial, the alternative technical solutions demonstrating conformity are documented (Art 20). For protection against corruption (1.1.9) and control-system safety/reliability (1.2.1), a cybersecurity certificate or statement under a Regulation (EU) 2019/881 scheme gives presumption of conformity to the extent it covers those requirements (Art 20(9)).",
                      "rationale":  "Presumption of conformity is the cheapest evidence available, and the 2019/881 route is the first formal link between EU cybersecurity certification and machinery CE marking. A notified body or authority will first look at which EHSRs each standard covers and which are argued directly.",
                      "evidencePrompt":  "EHSR-to-standard mapping (editions, cited status), gaps argued by alternative solutions, any cybersecurity certification relied on for 1.1.9/1.2.1.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Harmonised standards and presumption of conformity"
                  },
                  {
                      "id":  "MRM3d",
                      "code":  "MR-M3.4",
                      "layerId":  "M3",
                      "title":  "EU declaration of conformity",
                      "requirement":  "An EU declaration of conformity per Annex V Part A is drawn up for the machine, kept continuously updated, translated as required, and covers all applicable Union acts in a single declaration; it accompanies the machine or is accessible via an internet address or machine-readable code kept available for the machine\u0027s expected lifetime and at least 10 years (Art 10(8), Art 21).",
                      "rationale":  "One declaration must cover every applicable act, so the machinery declaration has to be reconciled with EMC, RED and any others in a single document. That takes coordination across compliance teams. A declaration provided digitally must stay available for as long as digital instructions.",
                      "evidencePrompt":  "DoC for this machine (all acts listed, current revision), digital-access arrangement and its availability horizon.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex V (EU declaration of conformity)"
                  },
                  {
                      "id":  "MRM3e",
                      "code":  "MR-M3.5",
                      "layerId":  "M3",
                      "title":  "CE marking: affixed and correct",
                      "requirement":  "The CE marking is affixed visibly, legibly and indelibly to the machine (or, where not possible, its packaging/accompanying documents) before placing on the market; where the conformity route involved a notified body, the body\u0027s identification number follows the CE marking; and no other marking liable to mislead as to the CE marking\u0027s meaning is used (Art 23-24).",
                      "rationale":  "CE marking is a simple step, but it is the visible end of the whole chain and the first thing an inspector checks. A missing notified-body number beside the CE mark on a Part A machine is an immediate formal non-conformity (Art 46).",
                      "evidencePrompt":  "Nameplate/marking drawing for this machine, notified-body number placement where applicable.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "CE marking articles"
                  },
                  {
                      "id":  "MRM3f",
                      "code":  "MR-M3.6",
                      "layerId":  "M3",
                      "title":  "Instructions for use: content for this machine",
                      "requirement":  "The instructions for use for this machine contain the Annex III 1.7.4 content: intended use and reasonably foreseeable misuse, assembly/installation/connection, putting into service and operator training needs, residual-risk information and protective measures, maintenance and adjustment with safety measures, spare-part specifications affecting health and safety, noise (and where relevant vibration) emission values with uncertainties, and the declaration of conformity or where to access it.",
                      "rationale":  "Misuse warnings, emission data and residual risks are mandatory content of the instructions, with case law behind them. For connected machinery the instructions should also cover operating states introduced by software, such as degraded modes, update behaviour and remote operation.",
                      "evidencePrompt":  "Instructions for this machine checked against the 1.7.4.2 content list; noise/vibration data provenance.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1 (instructions for use)"
                  },
                  {
                      "id":  "MRM3g",
                      "code":  "MR-M3.7",
                      "layerId":  "M3",
                      "title":  "Type-examination certificate currency",
                      "requirement":  "Where the route uses EU type-examination (Module B): the certificate is within its five-year validity, renewal is applied for in the 12-to-6-month window before expiry, the notified body is informed of all modifications to the approved type and of relevant state-of-the-art changes, and additions/renewals are obtained where required (Annex VII points 6-7).",
                      "rationale":  "Type-examination certificates now expire, whereas under the Directive they could in practice run on. Missing the renewal window reduces the renewal to a review of additions against the original expiry date, and an expired type approval invalidates the conformity of every machine shipped under it.",
                      "evidencePrompt":  "Certificate register with expiry/renewal dates for this machine\u0027s type, modification notifications to the notified body. N/A where no Module B route.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Conformity assessment modules, Annexes VI to XI"
                  },
                  {
                      "id":  "MRM3h",
                      "code":  "MR-M3.8",
                      "layerId":  "M3",
                      "title":  "Partly completed machinery: declaration and assembly instructions",
                      "requirement":  "Where partly completed machinery is placed on the market: technical documentation per Annex IV Part B is drawn up, an EU declaration of incorporation per Annex V Part B accompanies it (stating which EHSRs are applied and fulfilled, and that it must not be put into service until the final machinery is declared in conformity), and assembly instructions per Annex XI accompany it in the appropriate language (Art 11, Art 22).",
                      "rationale":  "Much equipment used in OT ships as partly completed machinery. Its paperwork, a declaration of incorporation with assembly instructions, is often confused with the declaration of conformity and instructions for use of complete machinery. The integrator\u0027s conformity case depends on receiving it from the manufacturer.",
                      "evidencePrompt":  "DoI and assembly instructions for the partly completed machinery in scope; Annex IV Part B file. N/A if none placed on the market.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex VII (partly completed machinery)"
                  },
                  {
                      "id":  "MRM3i",
                      "code":  "MR-M3.9",
                      "layerId":  "M3",
                      "title":  "Safety information for non-professional users",
                      "requirement":  "Where the machine is intended for, or reasonably foreseeably used by, non-professional users: the instructions\u0027 wording and layout account for their expected general education and acumen, and the safety information essential for putting into service and safe use is provided in paper form even where instructions are digital (Art 10(7), Annex III 1.7.4.1(b)).",
                      "rationale":  "The duties towards non-professional users apply to machine builders whose products end up with such users. Reasonably foreseeable use decides this, whatever the catalogue says. A manufacturer that has moved its instructions online can easily miss the paper safety information.",
                      "evidencePrompt":  "User-population analysis for this machine, paper safety-information leaflet where the duty applies. N/A for strictly professional machinery with no foreseeable non-professional use.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III (information for non-professional users)"
                  },
                  {
                      "id":  "MRM3j",
                      "code":  "MR-M3.10",
                      "layerId":  "M3",
                      "scope":  "organisation",
                      "title":  "Sales-channel obligations: importers and distributors",
                      "requirement":  "Where machines reach the EU market through importers or distributors, the channel obligations are covered: importers place only compliant machinery, verify the conformity assessment/CE marking/documentation, add their own name and contact details, ensure storage and transport do not jeopardise conformity, and keep the DoC 10 years; distributors verify CE marking, accompanying documents and language before making available (Art 13-16). Where a partner sells under its own name or modifies the machine, it assumes the manufacturer\u0027s obligations (Art 17).",
                      "rationale":  "How the manufacturer sets up its sales channels decides whether these duties are met, including importer marking, document packs for each language and storage requirements. An own-brand (OEM) deal transfers the full manufacturer obligations to the partner, which both sides often miss.",
                      "evidencePrompt":  "Channel map (importers/distributors per market), contractual allocation of Art 13-16 duties, own-brand arrangements reviewed against Art 17.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (importers and distributors)"
                  }
              ],
    "_relatedWork":  "Sibling of the eu-cra layered instrument; both share the layered conformance machinery (scoring-cra.js). MR 1.1.9/1.2.1 overlaps CRA Annex I Part I and 62443-4-1/-4-2 - candidate cross-references. Art 20(9) bridges EU cybersecurity certification (2019/881) into machinery CE marking.",
    "_classificationNote":  "Machine classification uses the Annex I lookup (shared/machinery-classification.json): Part A (third party mandatory, incl. ML safety systems), Part B (Module A only with full harmonised-standard coverage), unlisted (Module A). The lookup derives class -\u003e conformity route. Annex I is a classification input, not assessable items.",
    "seriesContext":  "The Machinery Regulation (EU) 2023/1230 is an EU Regulation, so unlike a standard it applies directly. It replaces the Machinery Directive. Alongside long-standing safety requirements it introduces digital ones, because software and connectivity can now defeat a protective function. This assessment works from the essential health and safety requirements that deal with those digital risks. It is a gap analysis to support preparation. It is not a conformity assessment and confers no presumption of conformity.",
    "_contentNote":  "13 + 8 + 10 items across three independently-scored layers, with depth on the provisions that make this a cyber-relevant regulation: Annex III 1.1.9 (protection against corruption), 1.2.1 (safety and reliability of control systems, including the learning-phase and wireless-control provisions) and 1.2.6 (loss of power supply or network connection). Items citing a whole chapter are summary judgements by design."
};
