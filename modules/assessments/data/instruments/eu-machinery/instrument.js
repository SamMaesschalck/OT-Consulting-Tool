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
    "framing":  "A gap assessment against the EU Machinery Regulation (Regulation (EU) 2023/1230, applying from 14 January 2027 and repealing Directive 2006/42/EC) for a manufacturer of machinery or related products. Three independently-scored layers: the essential health and safety requirements with the depth on the NEW digital and control-system content (per machine), the manufacturer\u0027s process obligations (organisation-wide), and conformity \u0026 market placement (per machine; the Annex I classification drives the conformity route). The general machine-safety areas are covered at summary level: this is a digital-and-conformity-focused gap assessment, not a machinery-safety inspection.",
    "sourceNote":  "Built from Regulation (EU) 2023/1230 (Machinery Regulation), OJ L 165, 29.6.2023: Annex III essential health and safety requirements, the economic-operator obligations in Articles 10 to 25, and the documentation and conformity annexes. Requirement text is assessor-phrased, because most items ask for a judgement spanning several provisions rather than restating one. Where a single provision does map to one item, its Official Journal wording is carried in verbatimText: the digital and self-evolving control-system provisions of Annex III 1.2.1 and 1.2.6. Reproduced with attribution to the Official Journal of the European Union; the tool carries the text itself and does not read the PDF.",
    "criticalCaveats":  [
                            "This is a digital-and-conformity-focused gap assessment, not a machinery-safety inspection: the general essential health and safety areas (guarding, mechanical risks, mobility, lifting, underground, person-lifting) are covered at summary level only and their In-place judgements rely on the manufacturer\u0027s own safety engineering evidence.",
                            "The Regulation applies from 14 January 2027; Directive 2006/42/EC governs machinery placed on the market before that date, and EC type-examination certificates under it remain valid until they expire. Read every finding against the placement date of each machine.",
                            "Machinery whose safety functions rely on fully or partially self-evolving (machine-learning) systems falls under Annex I Part A: third-party conformity assessment is mandatory for those systems and internal control (Module A) is not available.",
                            "This assessment informs conformity; it does not determine or certify it. The manufacturer, or a notified body where the Annex I classification requires one, remains responsible for the conformity decision."
                        ],
    "scoringNote":  "Each of the three layers rolls up INDEPENDENTLY (conformance: in place / partially / not in place / unknown / na). The three positions are presented side by side and never blended into one readiness score: strong machine engineering with unfinished conformity work is not market readiness; missing conformity is a hard blocker to placing on the market, not a partial shortfall.",
    "display":  {
                    "shortName":  "Machinery",
                    "productNoun":  "machine",
                    "referenceTag":  "EU Machinery Regulation (Regulation (EU) 2023/1230)",
                    "captureBanner":  "Indicative. Requirement text is assessor-phrased from Regulation (EU) 2023/1230 where a question spans several provisions, and carries the Regulation\u0027s own wording where one provision maps to it; the Regulation text governs. This informs conformity; it is not a conformity assessment, certification or machinery-safety inspection.",
                    "reportBannerTitle":  "EU Machinery Regulation gap assessment (indicative, not a conformity assessment)",
                    "reportBannerBody":  "A gap assessment against the EU Machinery Regulation (Regulation (EU) 2023/1230). Three layers are scored independently and presented side by side; they are never blended into one readiness score, because e.g. strong machine engineering with no conformity work is not market readiness: missing conformity is a hard blocker to placing on the market. This informs conformity; it does not determine or certify it.",
                    "productsCardNote":  "Rename, add or remove machines here; select one to set its classification below. The essential requirements (M1) and most of the conformity layer are assessed per machine; the manufacturer\u0027s process obligations (M2) and the organisation-level conformity obligations are organisation-wide and shared across all machines. New machines inherit the shared answers.",
                    "wizardOrgNote":  "Organisation-wide obligations (the manufacturer\u0027s process obligations, plus the organisation-level conformity items). Answered once: these apply to every machine. Do this first, then switch to By machine.",
                    "wizardProductNote":  "Per-machine obligations (the essential health and safety requirements and the machine\u0027s own conformity work). Pick a machine below, walk it, then pick the next machine to redo the wizard for it."
                },
    "docx":  {
                 "regName":  "the EU Machinery Regulation (Regulation (EU) 2023/1230)",
                 "coverSubLine":  "EU Machinery Regulation: indicative gap assessment",
                 "docDescription":  "EU Machinery Regulation (2023/1230) indicative gap assessment",
                 "layersSentence":  "Three layers were assessed independently and are reported side by side: the essential health and safety requirements (with the assessment depth on the digital and control-system content), the manufacturer\u0027s process obligations, and the conformity and market-placement layer; they are never blended into a single readiness score, because strong machine engineering with unfinished conformity work is not market readiness.",
                 "keyDatesNote":  "The Machinery Regulation applies from 14 January 2027, when Directive 2006/42/EC is repealed; machinery placed on the market before that date remains governed by the Directive, and existing EC type-examination certificates remain valid until they expire. Readiness should be judged against the placement date that applies to each machine.",
                 "seqPlaceholder":  "Consultant: one short paragraph on sequencing (what must close before machines are placed on the market under the Regulation from 14 January 2027, what gates CE marking for which machine, and what can run in parallel).",
                 "exposurePlaceholder":  "Consultant: the commercial exposure in one paragraph (which machine sales and markets depend on CE marking under the Machinery Regulation, and what non-conformity would mean for them).",
                 "glanceTitle":  "Machinery Regulation readiness at a glance",
                 "misclassFinding":  "Finding: possible machinery misclassification (the matched Annex I category indicates a stricter conformity route than the class set, which changes the required conformity-assessment module). See the dedicated section below.",
                 "howToRead":  "Each requirement is judged In place, Partially in place or Not in place against the paraphrased Machinery Regulation requirement, with Unknown reducing coverage and confidence and Not applicable excluded. The three layers roll up independently and are presented side by side: there is deliberately no single readiness score, because missing conformity work is a hard blocker to placing on the market rather than a partial shortfall. The Recommendations section lists every open gap with its evidence, impact, recommended action and owner.",
                 "limitations":  [
                                     "Conformance states are set per requirement by the consultant against the three-point scale (Not in place / Partially in place / In place), informed by the captured evidence. Each layer rolls up independently; the conformance index is presented for context only and the three layers are never blended into a single readiness score. Unknown answers reduce coverage and confidence; Not applicable requirements are excluded. A Not-in-place requirement is surfaced as a floor finding and is not averaged away.",
                                     "This is an indicative gap assessment against the EU Machinery Regulation, not a conformity assessment, certification or machinery-safety inspection. Requirement text is paraphrased; the Regulation text governs. The general machine-safety areas are assessed at summary level on the manufacturer\u0027s own evidence. The manufacturer, or a notified body where the Annex I classification requires one, remains responsible for the conformity decision."
                                 ],
                 "categoryRowLabel":  "Matched Annex I category (aid)",
                 "defaultClassLabel":  "Not listed in Annex I (internal control)",
                 "noBlendPhrase":  "a single readiness score",
                 "blockerTail":  " cannot yet be lawfully CE-marked or placed on the EU market, however complete its engineering. Closing these is a market-access matter.",
                 "blockerTailMulti":  " cannot yet be lawfully CE-marked or placed on the EU market, however complete their engineering. Closing those gaps is a market-access matter.",
                 "multiOrgSentence":  "The organisation-wide obligations (the manufacturer\u0027s process obligations and the organisation-level conformity items covering sales-channel duties) were assessed once for the manufacturer and apply to every machine; the essential health and safety requirements and the remaining conformity obligations were assessed per machine. Layers are reported side by side and never blended into a single readiness score.",
                 "seqPlaceholderMulti":  "Consultant: one short paragraph on sequencing (what must close before machines are placed on the market under the Regulation from 14 January 2027, what gates CE marking for which machine, and what can run in parallel).",
                 "xlsxTitle":  "EU Machinery Regulation: indicative gap assessment (not a conformity assessment or certification)",
                 "xlsxReadMe":  [
                                    "Three layers (M1 essential requirements: digital \u0026 control depth, M2 manufacturer process obligations, M3 conformity \u0026 market placement) are each scored independently against the Machinery Regulation and presented side by side. They are never blended into one readiness score.",
                                    "Out-of-scope layers are omitted entirely. This is an indicative assessment, not a conformity assessment, certification or machinery-safety inspection; the general machine-safety areas are covered at summary level only. The Regulation applies from 14 January 2027."
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
                      "effect":  "Out-of-scope layers are not assessed, not scored, and absent from the report: distinct from an in-scope item left unanswered."
                  },
                  {
                      "id":  "setup.class",
                      "type":  "classification-lookup",
                      "question":  "Classify the machine against Machinery Regulation Annex I",
                      "lookupRef":  "shared/machinery-classification.json",
                      "lookupKey":  "machineryClassification",
                      "method":  "Match the machine (or its safety components) to a category in Annex I. Part A (including self-evolving machine-learning safety systems) makes third-party conformity assessment mandatory; Part B permits internal control only with full harmonised-standard coverage; unlisted machinery self-assesses under Module A.",
                      "deriveClass":  true,
                      "drives":  "Sets the machine\u0027s class, which drives the conformity route the M3 layer expects (internal control vs notified-body modules).",
                      "flagMisclassification":  "Where the consultant expected an unlisted machine but an Annex I category matches, surface that as a finding: it changes the conformity route."
                  },
                  {
                      "id":  "setup.product",
                      "type":  "text",
                      "question":  "Machine under assessment (name / model)",
                      "drives":  "M1 and most of M3 are assessed per machine; record which machine this run covers."
                  }
              ],
    "layers":  [
                   {
                       "id":  "M1",
                       "name":  "Essential requirements: digital, control \u0026 safety",
                       "scope":  "per-product",
                       "summary":  "The Annex III essential health and safety requirements the machine itself must meet, with the assessment depth on the new digital content: protection against corruption (1.1.9), safety and reliability of control systems (1.2.1), self-evolving and autonomous machinery. The general machine-safety areas are covered at summary level."
                   },
                   {
                       "id":  "M2",
                       "name":  "Manufacturer process obligations",
                       "scope":  "organisation",
                       "summary":  "The manufacturer\u0027s organisation-wide obligations under Article 10 and related articles: series conformity, post-market monitoring, corrective action, documentation and instructions regimes, traceability, substantial-modification governance and the transition from Directive 2006/42/EC."
                   },
                   {
                       "id":  "M3",
                       "name":  "Conformity \u0026 market placement",
                       "scope":  "organisation-and-product",
                       "summary":  "The formal conformity work per machine: Annex I classification and conformity route, technical documentation, standards strategy, EU declaration of conformity, CE marking, machine marking and instructions, plus partly completed machinery where relevant. Route depends on the machine\u0027s Annex I class."
                   }
               ],
    "layerInterlock":  "If M3 is assessed without M1 and/or M2, flag that a conformity claim (declaration, CE marking) rests on the essential requirements and process obligations those layers cover; assessed alone, M3 is a paperwork check, not a substantiated one.",
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
                      "rationale":  "The risk assessment is the root document of the whole conformity claim: it decides which EHSRs apply and must itself appear in the technical documentation. Under the new Regulation it must explicitly reach digital hazards: foreseen software updates and intended evolution of self-evolving behaviour are in scope at placement time.",
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
                      "rationale":  "This is the Regulation\u0027s answer to malicious third parties reaching the machine through its connectivity: the corruption of a safety-relevant hardware path is treated as a health-and-safety matter, not an IT matter. It is new relative to Directive 2006/42/EC and is where OT security work becomes CE-marking work.",
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
                      "rationale":  "Safety-critical software must be inventoried, integrity-protected and change-evidenced on the machine itself. This forces software identification and tamper evidence into the product design: retrofit after design is rarely credible, and market surveillance can ask for the evidence trail.",
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
                      "requirement":  "Control systems prevent hazardous situations: they withstand the intended operating stresses and intended and unintended external influences INCLUDING reasonably foreseeable malicious attempts by third parties; hardware faults, logic errors and reasonably foreseeable human error do not lead to hazardous situations (Annex III 1.2.1).",
                      "rationale":  "1.2.1 now names malicious third parties alongside classical faults: a cyber attack that can produce a hazardous machine state is a control-system design deficiency under the Regulation. The functional-safety case and the security case must meet in one argument.",
                      "evidencePrompt":  "Control-system safety case (e.g. ISO 13849 / IEC 62061) extended with the security threat analysis for hazard-capable functions; test or assessment evidence.",
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
                      "rationale":  "Parameter and rule changes are a classic path to a dangerous machine, and with learning systems the machine itself becomes a source of modification. The Regulation requires hazardous modification to be designed out, not just procedurally discouraged.",
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
                      "rationale":  "Post-market software changes to safety systems must be reconstructable for five years. Without a versioned upload log designed into the machine or its management system, the manufacturer cannot answer a market-surveillance request: an obligation that outlives most project teams.",
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
                      "rationale":  "These are the Regulation\u0027s guardrails for machine-learning behaviour in safety roles: hard containment, decision-record accountability and a permanent human correction path. They also interact with classification: self-evolving SAFETY systems put the machine into Annex I Part A and third-party assessment.",
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
                      "rationale":  "Connectivity loss is the digital analogue of power loss, and the Regulation treats it identically: the machine must fail to a safe state. For remotely driven and mobile machinery the stop conditions are explicit and testable.",
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
                      "rationale":  "When behaviour is not fully predictable from a manual, the machine itself must make its intentions legible: a genuinely new design requirement aimed at collaborative and autonomous machinery, and one that surfaces in operator-safety incidents when missed.",
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
                      "rationale":  "The autonomy provisions define what \u0027remote supervision\u0027 must mean before an AMR/AGV or autonomous machine is lawful: bounded remote authority, mandatory situational awareness and protective detection. These are conformity requirements, not integration niceties.",
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
                      "requirement":  "SUMMARY ITEM: the chapter 1 essential requirements are met on the manufacturer\u0027s evidence (safety integration principles, materials, lighting, handling, ergonomics, operating positions and seating, starting/stopping and emergency stop, mode selection, protection against mechanical and other risks, guards and protective devices, maintenance and access, isolation of energy, information/warnings/marking and instructions content).",
                      "rationale":  "This assessment\u0027s depth is the digital content; the classical machine-safety engineering still decides conformity. This summary item records the manufacturer\u0027s own safety-engineering position (typically standards-based design plus internal or third-party verification) so the report is honest about full-Regulation scope without claiming a safety inspection.",
                      "evidencePrompt":  "Design-standard mapping (harmonised standards applied), internal verification reports, safety sign-off for this machine. Judge on the manufacturer\u0027s evidence, not on inspection.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex III, Chapter 1"
                  },
                  {
                      "id":  "MRM1l",
                      "code":  "MR-M1.12",
                      "layerId":  "M1",
                      "title":  "Supplementary EHSR chapters: summary judgement (Annex III Chapters 2-6)",
                      "requirement":  "SUMMARY ITEM: where the machine falls under a supplementary chapter (foodstuffs, cosmetics or pharma machinery; portable hand-held or fixing machinery; woodworking; plant-protection application; mobility, Ch 3; lifting operations, Ch 4; underground work, Ch 5; lifting of persons, Ch 6), those additional essential requirements are met on the manufacturer\u0027s evidence.",
                      "rationale":  "The supplementary chapters carry the highest-severity classical hazards (mobility, lifting, person-lifting) and their own marking and instruction duties. The summary judgement keeps them visible in the gap roadmap even though this engagement does not assess them in depth.",
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
                      "rationale":  "The residual-risk chain from risk assessment to warnings to instructions is what market surveillance walks first, because a mismatch is visible on paper. For connected machinery this includes residual risks of the digital kind: degraded modes, update states, remote-operation limits.",
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
                      "requirement":  "Procedures ensure machinery in series production remains in conformity: changes in the production process, in the design or characteristics of the machine, and changes in the harmonised standards, common specifications or other technical specifications by reference to which conformity is declared, are all adequately taken into account (Art 10(4)).",
                      "rationale":  "A conformity assessment is a snapshot; this obligation makes conformity a process. Standards move and designs drift: a manufacturer without change-triggered conformity review is non-conforming in slow motion across every machine it ships.",
                      "evidencePrompt":  "Change-management procedure linking design/production/standards changes to conformity review; examples of it firing.",
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
                      "rationale":  "The register is the organisational memory that market surveillance asks for, and the early-warning input to corrective action. \u0027Where appropriate\u0027 is judged against risk: for connected machinery, field software behaviour belongs in this monitoring.",
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
                      "rationale":  "The duty is \u0027immediately\u0027 and per Member State: impossible to improvise. A rehearsed decision path from field signal to authority notification is the difference between a managed correction and an enforcement case.",
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
                      "rationale":  "Ten years outlives products, teams and repositories, and for this Regulation the retained material can include source code for safety software. Retention needs an owned regime with escrow-grade handling for the code path, not a project share.",
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
                      "requirement":  "Machines are accompanied by instructions for use and Annex III information, which may be digital: how to access them is marked on the machine, they are printable/downloadable and storable, remain accessible online for the machine\u0027s expected lifetime and at least 10 years after placing on the market; paper instructions are provided free within one month at the purchaser\u0027s request; and essential safety information is in paper form for (reasonably foreseeable) non-professional users. Language per Member State (Art 10(7)).",
                      "rationale":  "Digital instructions are a new permission with sharp conditions: a broken URL ten years on is a formal non-conformity (Art 46). This is an organisation-wide publishing regime: hosting lifetime, print-on-request fulfilment and language coverage.",
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
                      "rationale":  "Traceability is what turns a field problem into a bounded recall instead of a fleet-wide one. The year-of-construction marking also anchors which regime (Directive or Regulation) governs each machine through the transition.",
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
                      "rationale":  "Digital modification is explicitly in scope: a capability-changing software update can re-open conformity. The manufacturer needs governance both for its own updates (foreseen vs substantial) and for the retrofit/rebuild services it offers on fielded machines.",
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
                      "requirement":  "The organisation has a transition plan for 14 January 2027: which machine models will be placed on the market under the Directive before that date and which under the Regulation after it; the validity horizon of existing EC type-examination certificates and approvals (valid until expiry); tracking of harmonised standards and common specifications as they are cited under the Regulation; and re-assessment plans for models that continue beyond the date (Art 51-54).",
                      "rationale":  "There is no sell-through grace for placing on the market after the date: the Regulation applies in full. A model-by-model transition plan is the cheapest compliance work available now and the most expensive to improvise in 2027.",
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
                      "rationale":  "The classification decides everything downstream: who assesses, what documentation, whose number goes beside the CE marking. The new Part A entries for ML safety systems are the trap: a machine that self-assessed for years can be pulled into mandatory third-party assessment by one learning component.",
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
                      "rationale":  "The technical file is where the digital additions land hardest: autonomous and sensor-driven machines must document their data and validation processes, which most machine builders have never filed. An incomplete technical file is formal non-conformity even for a safe machine.",
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
                      "rationale":  "Presumption of conformity is the cheapest evidence there is, and the 2019/881 route is the first formal bridge between EU cybersecurity certification and machinery CE marking. Knowing exactly which EHSRs are covered by which standard (and which are argued directly) is what a notified body or authority reads first.",
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
                      "rationale":  "The single-DoC rule means the machinery declaration must reconcile with EMC, RED and any other applicable acts in one document: a coordination task across compliance silos. The digital-access option carries the same long-availability duty as digital instructions.",
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
                      "rationale":  "Mechanical, but it is the visible end of the whole chain and the first thing an inspector checks: a missing notified-body number beside the CE mark on a Part A machine is instant formal non-conformity (Art 46).",
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
                      "requirement":  "The instructions for use for this machine contain the Annex III 1.7.4 content: intended use AND reasonably foreseeable misuse, assembly/installation/connection, putting into service and operator training needs, residual-risk information and protective measures, maintenance and adjustment with safety measures, spare-part specifications affecting health and safety, noise (and where relevant vibration) emission values with uncertainties, and the declaration of conformity or where to access it.",
                      "rationale":  "Instructions are assessed content, not marketing collateral: misuse warnings, emission data and residual risks are mandatory elements with case law behind them. For connected machinery the operating states introduced by software (degraded modes, update behaviour, remote operation) belong here too.",
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
                      "rationale":  "Type certificates now expire: a change from the Directive era, where EC type-examination certificates could in practice run on. Missing the renewal window degrades it to an addition-only review against the original expiry, and an out-of-date type approval invalidates the conformity of every machine shipped against it.",
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
                      "rationale":  "Much OT-relevant equipment ships as partly completed machinery. Its paperwork chain (DoI, not DoC; assembly instructions, not instructions for use) is routinely confused with complete machinery, and the integrator\u0027s conformity case depends on getting it from the manufacturer.",
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
                      "requirement":  "Where the machine is intended for, or reasonably foreseeably used by, non-professional users: the instructions\u0027 wording and layout account for their expected general education and acumen, and the safety information essential for putting into service and safe use is provided in PAPER form even where instructions are digital (Art 10(7), Annex III 1.7.4.1(b)).",
                      "rationale":  "The consumer-facing duties bite machine builders whose products leak into non-professional hands: the \u0027reasonably foreseeable\u0027 test, not the catalogue positioning, decides. Paper safety information is an easy formal miss once a manufacturer has gone digital-first.",
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
                      "rationale":  "The manufacturer\u0027s channel design decides whether these duties are met: importer marking, document packs per language, storage requirements. An own-brand (OEM) deal quietly transfers full manufacturer obligations, which both sides routinely miss.",
                      "evidencePrompt":  "Channel map (importers/distributors per market), contractual allocation of Art 13-16 duties, own-brand arrangements reviewed against Art 17.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 10 to 25 (importers and distributors)"
                  }
              ],
    "_relatedWork":  "Sibling of the eu-cra layered instrument; both share the layered conformance machinery (scoring-cra.js). MR 1.1.9/1.2.1 overlaps CRA Annex I Part I and 62443-4-1/-4-2 - candidate cross-references. Art 20(9) bridges EU cybersecurity certification (2019/881) into machinery CE marking.",
    "_classificationNote":  "Machine classification uses the Annex I lookup (shared/machinery-classification.json): Part A (third party mandatory, incl. ML safety systems), Part B (Module A only with full harmonised-standard coverage), unlisted (Module A). The lookup derives class -\u003e conformity route. Annex I is a classification input, not assessable items.",
    "seriesContext":  "The Machinery Regulation (EU) 2023/1230 is an EU Regulation, not a standard: it applies directly and replaces the Machinery Directive. Alongside long-standing safety requirements it introduces digital ones, because software and connectivity can now defeat a protective function. This assessment reads the Regulation\u0027s essential health and safety requirements that bear on that. It is a gap analysis to support preparation; it is not a conformity assessment and confers no presumption of conformity.",
    "_contentNote":  "13 + 8 + 10 items across three independently-scored layers, with depth on the provisions that make this a cyber-relevant regulation: Annex III 1.1.9 (protection against corruption), 1.2.1 (safety and reliability of control systems, including the learning-phase and wireless-control provisions) and 1.2.6 (loss of power supply or network connection). Items citing a whole chapter are summary judgements by design."
};
