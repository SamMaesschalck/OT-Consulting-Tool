/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-cyber/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-cyber"] = window.App.Data.instruments["onr-syaps-cyber"] || {};
window.App.Data.instruments["onr-syaps-cyber"].instrument = {
    "id":  "onr-syaps-cyber",
    "title":  "ONR SyAPs Cyber Security \u0026 Information Assurance Gap Assessment",
    "framework":  "ONR SyAPs",
    "edition":  "2022 Edition, Version 1",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "caf-achieved",
    "scoringProfileRef":  "caf-achieved",
    "targetDimension":  "organisation",
    "targetDimensionLabel":  "Dutyholder / site",
    "framing":  "An informal, expectation-by-expectation gap assessment against FSyP 7: Cyber Security and Information Assurance of the ONR Security Assessment Principles (SyAPs 2022), covering its five Security Delivery Principles: effective cyber and information risk management, information security, protection of nuclear technology and operations, physical protection of information, and preparation for and response to cyber security incidents. Each regulatory expectation is judged Achieved, Partially achieved or Not achieved against a dutyholder profile. This is not an ONR assessment and does not approve a security plan.",
    "sourceNote":  "Fundamental Security Principles (FSyP), Security Delivery Principles (SyDP) and their regulatory expectations are transcribed and lightly condensed from the ONR SyAPs (2022) and the published CNS-TAST-GD Technical Assessment Guides. Where no TAG was available for a Security Delivery Principle, the expectations are drawn from the SyAPs master document. This is an informal alignment and gap tool, not an ONR assessment.",
    "attribution":  "Contains public sector information published by the Office for Nuclear Regulation (ONR) and licensed under the Open Government Licence v3.0. Source: Security Assessment Principles for the Civil Nuclear Industry (2022 Edition, Version 1) and the associated Civil Nuclear Security Technical Assessment Guides (CNS-TAST-GD).",
    "criticalCaveats":  [
                            "This is not an ONR assessment, inspection, or determination of compliance with the Nuclear Industries Security Regulations 2003 (NISR). It is an informal, consultant-led gap assessment to support improvement.",
                            "It does not constitute, replace, or approve a security plan. Only ONR can assess and approve a dutyholder\u0027s security plan under NISR.",
                            "The public SyAPs has its Annexes (the categorisation and security-posture tables) redacted, so this tool uses only the published Security Delivery Principle expectations and cannot reproduce the graded posture thresholds.",
                            "Do not enter Sensitive Nuclear Information (SNI) or any classified or protectively-marked material into this tool."
                        ],
    "display":  {
                    "subtitle":  "Informal gap assessment against FSyP 7 (Cyber Security \u0026 Information Assurance) of the ONR Security Assessment Principles (SyAPs). Capture engagement details, pick the dutyholder profile below, then work through the Security Delivery Principles from the sidebar.",
                    "reportSubline":  "ONR SyAPs cyber security \u0026 information assurance gap assessment (FSyP 7)",
                    "reportDescription":  "ONR SyAPs FSyP 7 (CS\u0026IA) informal gap analysis",
                    "profileTitle":  "Dutyholder profile",
                    "profileStep1Label":  "Dutyholder profile",
                    "objectiveTitle":  "Fundamental Security Principle",
                    "principleNoun":  "Security Delivery Principle",
                    "outcomesTitle":  "Expectations",
                    "about":  "This is an informal gap assessment against FSyP 7: Cyber Security and Information Assurance of the ONR Security Assessment Principles (SyAPs). It covers cyber and information risk management, information security, protection of nuclear technology and operations, physical protection of information, and incident preparation and response, weighing the dutyholder\u0027s arrangements against the published regulatory expectations and producing a prioritised improvement roadmap and a client-ready report. It is advisory only: not an ONR assessment, not a determination of NISR compliance, and it neither constitutes nor approves a security plan.",
                    "gettingStarted":  {
                                           "cardTitle":  "How this assessment works",
                                           "intro":  "This is an informal gap assessment against the ONR Security Assessment Principles (SyAPs). Each regulatory expectation is judged Achieved, Partially achieved or Not achieved. It is not an ONR assessment and does not approve a security plan.",
                                           "profileHeading":  "Dutyholder profile (sets the expected depth of demonstration)",
                                           "bullets":  [
                                                           "The framework is a three-level hierarchy: Fundamental Security Principles (FSyP) contain Security Delivery Principles (SyDP), which are assessed through discrete regulatory expectations.",
                                                           "Record each expectation as Achieved, Partially achieved or Not achieved. Unknown flags something that could not be verified (it lowers confidence); Not applicable drops the expectation.",
                                                           "The dutyholder profile sets the expected depth: Full dutyholder expects every expectation to be demonstrated; Smaller dutyholder applies the same expectations proportionately to a low-category site.",
                                                           "The roadmap lists every in-scope expectation that is not yet achieved or could not be verified. Do not enter SNI or classified material."
                                                       ]
                                       }
                },
    "states":  [
                   {
                       "value":  "achieved",
                       "label":  "Achieved",
                       "colour":  "met"
                   },
                   {
                       "value":  "partially",
                       "label":  "Partially achieved",
                       "colour":  "near"
                   },
                   {
                       "value":  "not",
                       "label":  "Not achieved",
                       "colour":  "gap"
                   },
                   {
                       "value":  "unknown",
                       "label":  "Unknown",
                       "colour":  "na",
                       "effect":  "could not be verified: lowers coverage and confidence"
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
                                            "id":  "7",
                                            "name":  "Cyber Security and Information Assurance"
                                        }
                                    ],
                     "principles":  [
                                        {
                                            "id":  "7.1",
                                            "name":  "Effective Cyber and Information Risk Management",
                                            "objectiveId":  "7"
                                        },
                                        {
                                            "id":  "7.2",
                                            "name":  "Information Security",
                                            "objectiveId":  "7"
                                        },
                                        {
                                            "id":  "7.3",
                                            "name":  "Protection of Nuclear Technology and Operations",
                                            "objectiveId":  "7"
                                        },
                                        {
                                            "id":  "7.4",
                                            "name":  "Physical Protection of Information",
                                            "objectiveId":  "7"
                                        },
                                        {
                                            "id":  "7.5",
                                            "name":  "Preparation for and Response to Cyber Security Incidents",
                                            "objectiveId":  "7"
                                        }
                                    ]
                 },
    "outcomes":  [
                     {
                         "id":  "7.1.1",
                         "principleId":  "7.1",
                         "title":  "Prepare the organisation and CS\u0026IA risk framework",
                         "controlText":  "Dutyholder senior leadership should have defined and approved a strategic approach to the management of CS\u0026IA risk, and the dutyholder should have planned and prepared all levels of the organisation to identify and manage their CS\u0026IA risks through employment of a structured risk management methodology or framework. The methodology should be documented, aligned to RGP and adapted to the dutyholder, and used to inform CS\u0026IA risk policy, processes, procedures, standards and arrangements. Roles and responsibilities to operationalise the framework should be identified, documented and approved, with adequate SQEP resources provided.\n\nCS\u0026IA risk management should be a continual process integrated into all business processes, not an isolated activity performed only periodically by specialist roles. Ownership should be anchored as a holistic business risk and not positioned exclusively as a technology risk; those owning CS\u0026IA risks should be of appropriate status and hold adequate authority. The dutyholder should consider whether CS\u0026IA risk should be classified as a principal or boardroom level organisational risk, and mechanisms to govern and manage implementation of the framework should be designed and documented.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Has a CS\u0026IA risk framework been designed, documented, and implemented? Does it align with and form part of the approved security plan?",
                                                 "Has ownership of the CS\u0026IA risk framework been correctly positioned in the business? Cyber security and information risk should be anchored as a holistic business risk and not positioned exclusively as a technology risk. Are risk/asset owners business leaders or are these roles confined to those working in technology functions?",
                                                 "Is there clear understanding across the organisation on how CS\u0026IA risks should be identified and managed (which includes oversight, escalation, tolerance, and governance)? Are there \u0027lines of defence\u0027 established in the organisational design?",
                                                 "Is there clarity over roles and responsibilities for CS\u0026IA risk? Do those with responsibilities understand them and can they evidence that they are discharged? Is there adequate SQEP resource in place?",
                                                 "Does executive leadership participate in and lead CS\u0026IA risk management and is tolerance understood and reflected in operational practices?",
                                                 "Can the dutyholder demonstrate that output from the CS\u0026IA risk framework is used to prioritise business and security investment and resource allocation? Is there evidence of use of artefacts such as risk balance cases or similar?",
                                                 "Do those with accountabilities in the risk framework have competing or conflicting objectives e.g., cost control? Where these may exist are they recognised, understood, mitigated and managed?"
                                             ]
                     },
                     {
                         "id":  "7.1.2",
                         "principleId":  "7.1",
                         "title":  "Asset identification and categorisation",
                         "controlText":  "Asset categorisation should be performed to inform the dutyholder\u0027s CS\u0026IA risk management framework by determining the adverse impact with respect to the loss of confidentiality, integrity and availability of systems and the information processed by them. There should exist a formal and documented process by which assets are identified, recorded, categorised and classified, including the information asset owner, where the asset resides and arrangements with third parties, repeated to a suitable schedule. Classification decisions should be approved by an appropriate individual or decision-making body, and a maintained inventory of organisational information assets should exist.\n\nCategorisation may involve categories such as information types, information technology, operational technology, infrastructure, systems, business processes and individual technology components, and should consider SyAPs guidance and Annexes F and G so a compliant rating can be recorded. The output should be a clear schema by which the dutyholder understands information and IT/OT assets, asset ownership and the order of importance of these assets to the safe and secure functioning of the facility, including SNI and assets involved in the management of NM or ORM.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Has the dutyholder established a clear means by which information assets have been identified and categorised and is this understood across the organisation?",
                                                 "Is there clarity over what information assets the dutyholder owns (or has responsibility for), how important they are, and where they are located (stored)/processed/accessed (including when this may be via third parties)? Is the information up to date and resilient? Has consideration been given to characteristics such as resilience, redundancy, back-up requirements etc?",
                                                 "Is SNI identified and is it understood where and how it is processed?",
                                                 "Is it clear who owns information assets across the organisation and are owners appropriate, skilled, and empowered to discharge their responsibilities?",
                                                 "Is there oversight and leadership of any process in place to determine categorisation and classification and ensure that decisions taken are valid?",
                                                 "Is it clear what assets are involved in the management of NM or ORM? This should include information, information systems, software, operational technology etc."
                                             ]
                     },
                     {
                         "id":  "7.1.3",
                         "principleId":  "7.1",
                         "title":  "Risk assessment and analysis",
                         "controlText":  "As part of the CS\u0026IA risk framework the dutyholder should have determined a structured and documented process by which risks will be assessed and analysed. The process should be threat intelligence led, identifying threats and vulnerabilities via established mechanisms of cyber threat and vulnerability analysis performed by SQEP specialists with knowledge of the facility and inputs from specialist government and industry bodies. It should include evaluation criteria to determine the type and level of impact and the likelihood of that impact, consider both inherent and residual risk, and produce a register (log) of profiled risks that are descriptively titled and rated or prioritised.\n\nThe risk assessment and analysis process should be part of change management activities and the system development lifecycle so that programmes, projects and procurement adequately consider CS\u0026IA risk as early as possible, including end of life. The dutyholder should ensure appropriate coordination between safety and security functions, identify themes and possible risk aggregation across tiers (organisation, mission/business/safety process, information system), and link risk appetite to cyber security at senior leadership and wider organisational levels.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Is the risk assessment and analysis methodology repeatable, well defined, documented, and understood? Is it appropriate/proportionate to the size of the organisation and is it operated by SQEP personnel?",
                                                 "Are the risk assessment and analysis process and outputs approved, auditable and is there oversight and assurance activity undertaken by the dutyholder?",
                                                 "Is the risk assessment and analysis process threat intelligence led? Does the dutyholder have established mechanisms to gather cyber threat analysis etc. from specialist government and industry bodies with awareness of nuclear operations?",
                                                 "Does the risk assessment and analysis process consider risks from partners, suppliers, customers, and other third parties?",
                                                 "Does risk assessment and analysis activity take place in change activity such as projects and programmes and system development? Is this activity performed at the correct points to allow early identification of security requirements?",
                                                 "Is the output from risk assessment and analysis compiled into a risk register or log and is this of suitable quality to understand currency of risks and order of significance?",
                                                 "Does the dutyholder\u0027s risk assessment and analysis process allow for the identification and communication of both strategic risk (those at an organisation or thematic level) and tactical risks (those at system or component level)?",
                                                 "Is there evidence to show that risk assessment and analysis is repeated to an appropriate cycle or when the environment/tolerances change?",
                                                 "Have safety requirements been considered as part of the risk assessment process?",
                                                 "Are processes in place to ensure upward communication if there have been material changes in the threat environment? Is there evidence that this happens?"
                                             ]
                     },
                     {
                         "id":  "7.1.4",
                         "principleId":  "7.1",
                         "title":  "Risk treatment: Select",
                         "controlText":  "As part of the CS\u0026IA risk framework the dutyholder should have determined a structured and documented process by which they will select treatment of identified risks. Selection of appropriate treatment should be prioritised and based upon achieving the determined tolerance/appetite for CS\u0026IA risk, giving consideration to both security and safety risk tolerance, and should implement an appropriate defence-in-depth approach that takes account of existing physical and personnel security measures. It should be clear which treatment option has been selected (modification, retention, avoidance or sharing) with the rationale described, decisions approved by asset/risk owners, and a documented, approved action plan created.\n\nThe action plan should as a minimum contain details of existing and additional controls (for example baselines/configurations), what level of risk reduction will be achieved and over what timeframe, the owner and required resources, with the speed and degree of risk reduction commensurate to the gap between current risk and agreed tolerance. Where risk is accepted this should be documented (including compensating controls), approved at a level proportionate to the risk and a review date set; consideration should be given to common controls applicable to asset groups.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Is there evidence of auditing and oversight of the risk treatment process and its effectiveness?",
                                                 "Are treatment selection decisions documented, appropriate and challenged/approved by SQEP resource through suitable governance mechanisms?",
                                                 "Are risks selected for treatment correctly prioritised with supporting justification? Are target dates for risk reduction proportionate and reasonable?",
                                                 "Is there evidence of risk treatment plans being in place and underway for both tactical and strategic cyber security and information risks? Are risks being reduced to clearly defined appetite/tolerance?",
                                                 "Have baseline controls and or configurations been established for asset categories, types, and environments, for example, cloud? Is there evidence that these are enforced and monitored for exceptions/changes?",
                                                 "Have adequate SQEP resources been made available to implement the risk treatment action plan?",
                                                 "Have any accepted risks been correctly documented and approved at an appropriate level? Is approval appropriate? Is there evidence that these risks have been reviewed again at an agreed date?",
                                                 "Is there evidence to show that policy, standards, and procedures are amended through use of output from the risk framework, for example, when tolerance changes or new threats emerge?",
                                                 "Do behavioural controls feature as part of treatments considered? Are cultural norms appropriate and or challenged?"
                                             ]
                     },
                     {
                         "id":  "7.1.5",
                         "principleId":  "7.1",
                         "title":  "Risk treatment: Implement",
                         "controlText":  "As part of the CS\u0026IA risk framework the dutyholder should have determined a structured and documented process by which they will implement the selected treatment of identified risks. There should exist a means to confirm that selected risk treatments have been implemented as expected and on time, reviewed by the risk owner and appropriate governance fora, and an independent means of overseeing implementation to validate that the anticipated risk reduction has been achieved and residual risk does not exceed defined organisational tolerance. Where treatment is not implemented or does not achieve the expected risk reduction, an exception process (for example a waiver or dispensation) should approve this at a level commensurate to the risk.\n\nOnce risk treatments have been implemented and validated there should exist a means to update risk treatment action plans. The exception mechanism should provide details of the exception (including a means to measure the degree of risk introduced), the activity needed to remediate and the permitted time within which to do so.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Is there evidence that risk treatment plans are being implemented and that the target residual risk has been achieved? Are risk owners involved in review and approval?",
                                                 "Is there adequately SQEP resource in place to review and validate implementation of risk treatment? Is it proportionate to the level of cyber security and information risk within the organisation?",
                                                 "Is there evidence of exceptions being reported and managed through a structured approval process? How many exceptions are there and what are their materiality? Are they in date?",
                                                 "Are risks being reassessed as a result of changes in threat level or changes to the organisational environment?"
                                             ]
                     },
                     {
                         "id":  "7.1.6",
                         "principleId":  "7.1",
                         "title":  "Assess and review",
                         "controlText":  "The CS\u0026IA risk framework should have a defined and documented process for performing continuous assessment and review of risk, containing validation processes to ensure cyber mitigations are, and remain, effective through regular reviews including cyber risk and vulnerability assessments. There should exist capability to scan and test the environment to ensure that risk treatments are in place, operating as intended and producing the required outcome (for example compliance scans to ensure baseline controls remain in effect), with compliance monitoring performed by design across all lines of defence and adequate SQEP resource performing continuous oversight against a defined, prioritised assessment plan.\n\nActions identified within assessment reports should be rated, reviewed, approved and actioned with confirmation of closure reported to appropriate governance fora, and the risk register updated to reflect output from ongoing assessment reports with risk assessment and analysis repeated if necessary. CS\u0026IA risk management should be embedded across all organisational functions and managed as an ongoing iterative activity, not a standalone task performed periodically.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Can the dutyholder produce a schedule or plan of assessment of risk action management action plans? Is there evidence that these are carried out and that any issues identified are actioned?",
                                                 "Is there evidence of oversight of cyber security and information risk performed by other lines of defence such as internal regulatory function or audit?",
                                                 "Does there exist a governance body where reports are reviewed, and actions approved? Are attendees of this forum appropriate in terms of role and seniority?",
                                                 "Is there evidence that cyber security and information risk as a process is embedded across the business and that asset and risk owners are appropriate (with the risk not being anchored in technology)?"
                                             ]
                     },
                     {
                         "id":  "7.1.7",
                         "principleId":  "7.1",
                         "title":  "Authorise, communicate and consult",
                         "controlText":  "The CS\u0026IA risk framework should have a defined and documented governance process, aligned where possible with wider business/risk governance, showing how the Board as the ultimate accountable body oversees the management of CS\u0026IA risk and delegates authority to sub-committees and individuals. The Board should review, approve and communicate organisational tolerance/appetite for CS\u0026IA risk and the suite of CS\u0026IA policies, and the framework should include a structured management information reporting model, approved by the Board, showing how performance is measured and reported (including KPIs/KRIs). Employees and other relevant personnel should be supported with structured and regular education and awareness training and mechanisms to report risks.\n\nBaseline configurations and controls should be documented, reviewed and agreed through a formal auditable process overseen by an appropriate governance body, and change activity should be reviewed and approved to ensure CS\u0026IA risks are managed to tolerance or recorded and scheduled for treatment. CS\u0026IA risks should be articulated in a way understandable by all involved up to and including Board, complex and specialist language used cautiously, and consideration given to overall CS\u0026IA culture and potential for risk bias or human factors that inhibit a mature and transparent view of posture.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Is there an effective means by which CS\u0026IA risk is governed across the organisation? Is there transparency of the risks that exist and is valid information on risk status being provided into the Board?",
                                                 "Is there evidence that senior leadership are aware CS\u0026IA risk and directing appropriate and timely response?",
                                                 "Do risk managers/owners at all levels understand their role in the governance structure, are the empowered appropriately and are there structured escalation paths?",
                                                 "Is the suite of MI reporting comprehensive and does it articulate risk clearly and to the right people? Are there clear KPIs at all levels of reporting which allow understanding of risks faced by the organisation?",
                                                 "Do risk owners understand the risks they own and levels of residual risk? Have they approved these and do they receive regular reporting to enable ongoing monitoring of risk posture?",
                                                 "Are governance meetings and management information reporting held and to an appropriate frequency? Is there evidence meetings are held, and decisions recorded? Do the governance sessions adequately measure progress of risk management and hold people to account?",
                                                 "Have risks been recorded and reported in a clear way reflecting tiering e.g., strategic and or thematic risks ranging through to operational tactical risks?",
                                                 "Does the prevalent organisational culture at all levels (i.e., leadership and operations) allow for CS\u0026IA risks to be openly communicated and recorded in a transparent and appropriate way, and without influence which may unduly suppress understanding of the degree of CS\u0026IA risk the organisation is exposed to?"
                                             ]
                     },
                     {
                         "id":  "7.1.8",
                         "principleId":  "7.1",
                         "title":  "Monitor",
                         "controlText":  "The dutyholder should perform regular monitoring to ensure that the CS\u0026IA risk framework is embedded and operating as intended, taking action where performance is found to be suboptimal. There should exist a clear and documented process defining response procedures when identified risks or key performance/risk indicators exceed agreed tolerance, and arrangements to continuously monitor the internal and external environments for changes to threats and vulnerabilities, changes to business activities and objectives, and changes to legal and regulatory requirements and RGP, updating risk assessment and analysis where these occur.\n\nWhere CS\u0026IA risks crystallise there should be post incident and root cause analysis to determine whether the risk strategy remains appropriate and whether changes to the risk framework are necessary; dutyholders are encouraged to share learning with other relevant organisations including, where appropriate, regulatory bodies such as ONR.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)",
                         "promptQuestions":  [
                                                 "Is there evidence that the dutyholder regularly reviews the risk framework and makes alterations in response to changes in legal, regulatory, and RGP?",
                                                 "Are there resources in place with adequate SQEP to assess changes to the internal and external environments (threats and vulnerabilities)?",
                                                 "Is there evidence that when tolerances are exceeded response action is successfully invoked?",
                                                 "Is post incident and root cause analysis performed and is this reflected in changes to the risk framework?"
                                             ]
                     },
                     {
                         "id":  "7.1.9",
                         "principleId":  "7.1",
                         "title":  "CS\u0026IA management for classified contracts",
                         "controlText":  "Where dutyholders have classified contracts, they should ensure there are contractual arrangements that enable both pre and in-contract assurance activities and assessment of CS\u0026IA arrangements to ensure the risk to SNI is minimised, and to support the redress of any deficiencies arising during the contract. Dutyholders should be able to satisfy themselves that delivery partners, service providers and third parties are applying adequate security controls, ensure contractors are made aware of the legal obligations arising from processing, storing and handling SNI, and make provision to manage the risks from subcontractor access to information and associated assets.\n\nDecisions by third parties to manage residual risk should be reported back and incorporated into the dutyholder\u0027s own CS\u0026IA risk framework. Risks from sub-contractors should be accommodated in the organisation\u0027s risk management process and the residual risk reporting mechanism should include summaries from sub-contractors; contractors should as a minimum be guided on the expectations of the NISR Classification Policy and relevant regulatory expectation within SyAPs.",
                         "controlTextLabel":  "SyDP 7.1 expectation (CNS-TAST-GD-7.1)"
                     },
                     {
                         "id":  "7.2.1",
                         "principleId":  "7.2",
                         "title":  "Board-driven information assurance programme",
                         "controlText":  "Dutyholders should establish an overarching programme of information assurance driven by the board.\n\nThis is identified as a key priority for maintaining the confidentiality, integrity and availability of sensitive nuclear information and associated assets.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.2.2",
                         "principleId":  "7.2",
                         "title":  "Staff trained and accountable for information",
                         "controlText":  "Dutyholders should ensure that staff are well-trained, exercise good judgement, take responsibility and are accountable for the information and associated assets they control, including all partner information.\n\nThis covers equipment, software and relevant data.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.2.3",
                         "principleId":  "7.2",
                         "title":  "Assets classified and appropriately protected",
                         "controlText":  "Dutyholders should establish mechanisms and processes to ensure assets are properly classified in accordance with all relevant Classification Policy (e.g. the NISR Classification Policy) and are appropriately protected.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.2.4",
                         "principleId":  "7.2",
                         "title":  "Effective, resilient controls that enable operations",
                         "controlText":  "Cyber security controls should be effective, resilient, and should enable nuclear operations; information assets stored, processed or transmitted by digital systems should be appropriately secured by a CPS that achieves the required outcome and posture.\n\nThis includes risks posed by portable media devices, particularly those with wireless and internet capabilities, which should be identified and appropriately managed.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.2.5",
                         "principleId":  "7.2",
                         "title":  "Proliferation risks effectively managed",
                         "controlText":  "Dutyholders should implement security arrangements that ensure proliferation risks associated with uranium enrichment technologies and equipment are effectively managed.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.2.6",
                         "principleId":  "7.2",
                         "title":  "Supply-chain information appropriately protected",
                         "controlText":  "Dutyholders should develop and maintain appropriate assurance measures to ensure that SNI and associated assets managed by contractors, as part of a classified contract, are appropriately protected wherever they are held.\n\nThe supply chain introduces additional risks to information and associated assets.",
                         "controlTextLabel":  "SyDP 7.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.3.1",
                         "principleId":  "7.3",
                         "title":  "Secure, resilient systems underpin nuclear operations",
                         "controlText":  "Dutyholders should ensure the delivery of nuclear operations relies on functional, secure and resilient systems and technology that are able to protect against, detect, respond to and recover from cyber threats.\n\nSecurity should be integrated into design, implementation, operation and maintenance activities.",
                         "controlTextLabel":  "SyDP 7.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.3.2",
                         "principleId":  "7.3",
                         "title":  "Full characterisation of operational technology",
                         "controlText":  "Dutyholders should fully characterise their technology (equipment and software utilised on nuclear premises in connection with activities involving NM/ORM) and apply appropriate risk-informed security controls.\n\nTechnology categories include Computer Based Systems Important to Safety (CBSIS), Computer Based Security Systems (CBSy), Nuclear Material Accountancy and Control (NMAC) systems, Basic Process Control \u0026 Instrumentation (BPC\u0026I), and any other digital technology systems as appropriate.",
                         "controlTextLabel":  "SyDP 7.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.3.3",
                         "principleId":  "7.3",
                         "title":  "Risk-informed, actively-managed cyber protection system",
                         "controlText":  "Following identification and characterisation, dutyholders should implement a risk-informed, current and actively-managed Cyber Protection System (CPS) that achieves the required outcome.\n\nRefer to the categorisation and outcome guidance at Annexes F, G and H of the SyAPs.",
                         "controlTextLabel":  "SyDP 7.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.4.1",
                         "principleId":  "7.4",
                         "title":  "Physical security requirements from design and risk assessment",
                         "controlText":  "Dutyholders should put processes and plans in place, including those developed from the early stages of design, to determine appropriate physical security requirements through planning and risk assessment.\n\nThis should inform the layered implementation of internal and external security controls that deter, detect and/or prevent unauthorised access and protect information and associated assets against forcible or surreptitious attack, integrated with the CPS to achieve the required outcome.",
                         "controlTextLabel":  "SyDP 7.4 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.4.2",
                         "principleId":  "7.4",
                         "title":  "Substantial controls for high-risk technology and information",
                         "controlText":  "Dutyholders should implement substantial controls for controlling access and proximity to high-risk operational technology (which may have been identified as a vital area) and information assets.",
                         "controlTextLabel":  "SyDP 7.4 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "7.5.1",
                         "principleId":  "7.5",
                         "title":  "Incident response policy and plan",
                         "controlText":  "Dutyholders should develop a sound and clear incident response policy and supporting documentation, and an effective response plan that typically prioritises incidents by level of impact on nuclear safety and security as well as wider business impact and clearly defines the most appropriate actions to deal with them. Incident response plans should be in place for both IT and OT (as one plan or separate plans with appropriate interfaces), determine CIRT team membership and rotation, clearly articulate the command and control structure and roles and responsibilities of senior leadership, and be informed by threat assessment information from organisations such as the NCSC. A system of independent testing (for example penetration testing, purple team testing or cyber-attack simulation) should be designed and documented in the approved security plan.\n\nPreparation is arguably the most important phase as it determines how well the CIRT can respond in a crisis. Knowing when to use internal teams or when to \u0027break glass\u0027 and engage an external CIRT provider should be defined ahead of time and documented in the policy, and the dutyholder should have policies (for example a ransomware policy) so there is no delay in senior leadership and legal decision making during a live incident. The frequency and level of assurance of testing should be commensurate to the categorisation and classification of the associated assets and system functions, with shortfalls logged, risk assessed and mitigated.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Is the incident response plan based on a clear understanding of the security risks to the networks and information (IT/OT) systems supporting their essential function?",
                                                 "Is the incident response plan comprehensive (i.e. covers the complete lifecycle of an incident, roles and responsibilities, and reporting) and covers likely impacts of both known attack patterns and of possible attacks, previously unseen?",
                                                 "Does the incident response plan consider the risk from supply chain and customers and have supporting documentation to deal with such an incident?",
                                                 "Does the incident response plan have senior management sponsorship, including the necessary approvals, authorities, and resources to execute the plan?",
                                                 "Is there sufficient cover for each IR team role?",
                                                 "Does the plan cover the relevant personnel required to inform the IR team for niche functions, e.g. OT specialists?",
                                                 "Are there offline copies of the incident response plan and policies (e.g. in the event of a ransomware incident)?",
                                                 "Is the response plan reviewed on a periodic basis or when there is a significant change to the threat landscape?",
                                                 "Are arrangements for engaging external support documented in the incident response policy?",
                                                 "Is there regular testing of the environment which simulates a threat actor such as pen testing, purple team testing or attack simulation?",
                                                 "Is assurance activity of the highest category systems completed at least annually or is appropriate justification provided for alternative frequencies in the security plan?",
                                                 "Has the dutyholder considered the guidance or advice from HMG or NCSC with respect to paying ransomware?"
                                             ]
                     },
                     {
                         "id":  "7.5.2",
                         "principleId":  "7.5",
                         "title":  "Incident reporting and notification",
                         "controlText":  "The dutyholder should have a formal cyber incident reporting system for staff and external security researchers that aids the identification of incidents, and staff should know the process to report a suspected cyber security incident. When an incident is identified, the incident response team must make notifications both within the dutyholder organisation and external to it, and incident response policies should include provisions for incident reporting - at a minimum, what must be reported, to whom and at what times (including time critical legislative reporting requirements).\n\nParties typically notified include individuals in the organisation\u0027s security vertical and relevant executives, other internal incident response team members, external incident response support, system owner, communications team, the National Cyber Security Centre, ONR and/or other regulators (e.g. ICO) as appropriate, National Cyber Crime Unit/Police, and any party with whom a contractual or parent body ownership arrangement exists.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have a process that details when and how to inform relevant regulatory authorities and how to engage the National Technical Authority?",
                                                 "Do the dutyholder\u0027s staff know the process to report a suspected cyber security incident?",
                                                 "Is the dutyholder familiar with the incident reporting requirements and processes to inform regulators and third parties?"
                                             ]
                     },
                     {
                         "id":  "7.5.3",
                         "principleId":  "7.5",
                         "title":  "Training and exercising",
                         "controlText":  "Ongoing cyber security training and information sessions should be a central pillar supporting any cyber security regime, and regular exercising should test the roles and responsibilities of those involved in incident response as well as the arrangements in place with third party providers, parent body and other stakeholders. Training and exercising should not be limited to technical skills (media and PR, privacy and legal all require specific training), senior managers and executives should periodically be involved, and dutyholders should carry out exercises to test response plans using past incidents and scenarios that draw on threat intelligence and their risk assessment.\n\nWhere third parties, parent body organisations or other stakeholders are used as part of response efforts, their roles and responsibilities should be clearly understood, exercised and documented as part of overall IR arrangements. Findings from exercises should be documented and used to refine incident response plans and protective security in line with lessons learnt.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Can the dutyholder evidence that CIRT staff have received recent and relevant response training?",
                                                 "How often is training provided and how often is a training needs analysis conducted?",
                                                 "Are the dutyholder\u0027s exercise scenarios based on experience and/or composed using relevant threat intelligence?",
                                                 "Are exercise scenarios documented, regularly reviewed, and validated?",
                                                 "Does the dutyholder ensure that exercises are routinely run, with the findings documented and used to refine incident response plans and protective security, in line with the lessons learnt?",
                                                 "Do the dutyholder\u0027s exercises test all parts of their response cycle relating to their essential functions (e.g. Restoration of normal function levels)?",
                                                 "Are third party, parent body organisations and other stakeholders roles and responsibilities clearly understood, exercised and documented?",
                                                 "Does the dutyholder have a schedule for cyber exercising and have they invited the inspector to observe?"
                                             ]
                     },
                     {
                         "id":  "7.5.4",
                         "principleId":  "7.5",
                         "title":  "Communications planning",
                         "controlText":  "There are a number of different types of communication that are important in the event of a cyber incident and all should be included in a communications plan. IR teams need a secure, out-of-band communication capability that cannot be monitored by an attacker or insider, and an external communication plan for communicating the incident to external agencies, supply chain, customers etc. External activities such as public relations require clear and timely communications and should be limited to those with proper crisis training.\n\nFor example, everyone on the IR team should have a work mobile phone and a secondary external email account, and the IR team should know the correct people within the business to help triage an incident.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Has an out-of-band communications capability been established?",
                                                 "Have internal and external communications plans been established?",
                                                 "Does the dutyholder have a mechanism for sharing a journal of the incident status?"
                                             ]
                     },
                     {
                         "id":  "7.5.5",
                         "principleId":  "7.5",
                         "title":  "Environment preparation",
                         "controlText":  "There are several technical measures that can be established ahead of time to support efficient and timely incident resolution, including ensuring Network Time Protocol (NTP) is enabled for all networked devices, appropriate network segregation is in place to aid the containment phase, and network redundancy for the recovery phase. A protected logging aggregation point with multiple terabytes of storage should be established with all systems instrumented to detect an incident and report both locally and to the central server, and an accurate asset inventory is essential, with ownership for all generic, shared service and system accounts established ahead of time.\n\nAn incident journal to track the who, what, where, when and why of an incident can aid internal communication of incident status and later review as part of lessons learnt. Potential key decisions should be identified and worked through in advance, for example system changes that may need to be made during an incident being pre-negotiated.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Can the dutyholder identify the data, personnel, software applications, devices, systems, and facilities that enable the organisation to achieve business purposes and are managed consistent with their relative importance to organisational objectives and risk strategy?",
                                                 "Has a central logging capability been established, are networked systems instrumented to detect an incident and are they configured to report locally and to the central server and is the logging capability resilient?",
                                                 "Is NTP enabled on all networked devices, synchronised across the estate and, in the corporate environment, are all windows clients synchronised with Active Directory?",
                                                 "Have potential key decisions been identified and worked through in advance, for example, have system changes that may need to be made during an incident been pre-negotiated?",
                                                 "Is there an accurate asset inventory and has ownership of all generic, shared, service and system accounts been established?"
                                             ]
                     },
                     {
                         "id":  "7.5.6",
                         "principleId":  "7.5",
                         "title":  "Response and recovery capability",
                         "controlText":  "Dutyholders should have the capability and resources to enact their incident response plan, including effective limitation of impact on the operation of their essential function, and access to timely information on which to base their response decisions. To support recovery, dutyholders should have adequate backups of systems with agreed Recovery Time Objectives (RTOs) and Recovery Point Objectives (RPOs), a defined methodology for prioritisation of recovery of services, fail-over mechanisms that can be readily activated, and the capability to deal with a protracted incident extending into weeks.\n\nA common principle is the 3-2-1 backup strategy that states there should be 3 copies of data (production data and 2 backup copies) on two different media with one copy off-site for disaster recovery. Arrangements should exist to augment the dutyholder\u0027s incident response capabilities with external support if necessary and such arrangements should have been tested.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Does the dutyholder understand the resources that will likely be needed to carry out any required response activities, and ensure that arrangements are in place to make these resources available?",
                                                 "Do they understand the types of information that will likely be needed to inform response decisions and ensure that arrangements are in place to make this information available?",
                                                 "Do their response team members have the skills and knowledge required to decide on the response actions necessary to limit harm, and do they have the authority to carry them out?",
                                                 "Does the dutyholder have a defined methodology for the prioritisation of recovery of services? Have systems been prioritised based on their importance?",
                                                 "Are fail-over mechanisms available that can be readily activated to allow continued operation of their essential function (although possibly at a reduced level) if primary networks and information systems fail or are unavailable?",
                                                 "Do arrangements exist to augment the dutyholder\u0027s incident response capabilities with external support if necessary (e.g. specialist cyber incident responders) and have such arrangements been tested?",
                                                 "Does the dutyholder backup and test the recovery of key IT and OT systems?",
                                                 "Does the recovery process include data integrity checks at completion of the recovery activity?",
                                                 "What is the backup strategy, plan and testing regime for cloud systems?"
                                             ]
                     },
                     {
                         "id":  "7.5.7",
                         "principleId":  "7.5",
                         "title":  "Security monitoring and log integrity",
                         "controlText":  "Dutyholders should ensure that capabilities exist to detect and identify cyber security incidents affecting, or with the potential to affect, categorised functions defined within SyAPs, including those systems affecting the protection of SNI. The organisation or third party provider should monitor the security status of networks and systems supporting the operation of categorised functions to detect potential security problems, and dutyholders should hold logging data securely with read only access limited to accounts with business need, protecting the integrity of logs and retaining them long enough for incident response analysts to inspect during an incident. Monitoring staff must have the skills, tools and defined roles that reflect governance and reporting requirements, expected threats and the complexity of the network or system data.\n\nThe data sources included in monitoring should allow for timely identification of security events to achieve the associated CPS outcome, and monitoring should provide multi-layer coverage including host-based monitoring and network gateways plus arrangements for out of hours monitoring and escalation. Log data analysis and normalisation should be performed only on copies keeping the master copy unaltered, datasets synchronised using an accurate common time source, and all actions on logging data traceable to a unique user.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Is the dutyholder\u0027s monitoring based on an understanding of their network\u0027s baseline characteristics, common cyber-attack methods and what they need awareness of in order to detect potential security incidents that could affect the operation of their essential function?",
                                                 "If monitoring is provided by a third party then does the dutyholder have the people, processes and technology in place to adequately respond to the incident?",
                                                 "Does the dutyholder have multi-layer monitoring coverage that includes host-based monitoring and network gateways?",
                                                 "Does the dutyholder have arrangements in place for out of hours monitoring and incident escalation?",
                                                 "Is the integrity of logging data protected, or is any modification detected and attributed?",
                                                 "Is access to logging data limited to those with business need and no others?",
                                                 "Can all actions involving all logging data (e.g. copying, deleting or modification, or even viewing) be traced back to a unique user?",
                                                 "Are logs retained long enough for incident response analysts to inspect during an incident?",
                                                 "Do monitoring staff have defined roles and skills that cover all parts of the monitoring and investigation process?",
                                                 "Are there playbooks to ensure consistency and to enable monitoring staff to make the determination regarding the initial validity of the alert in front of them as quickly as possible?"
                                             ]
                     },
                     {
                         "id":  "7.5.8",
                         "principleId":  "7.5",
                         "title":  "Alert generation and incident triage",
                         "controlText":  "Dutyholders should ensure that evidence of potential security incidents contained in their monitoring data is reliably identified and triggers alerts, and should contextualise alerts with knowledge of the threat and their systems to identify those security incidents that require a response. Dutyholders should have a process of categorisation based on the type and severity (impact on confidentiality, integrity and availability) to allow quick and efficient triaging of incidents, determining urgency and escalation thresholds, with processes for initial determination of who declares an incident, assigning an initial handler and responders.\n\nAlerts should be tested to ensure they are generated reliably and that genuine security incidents can be distinguished from false alarms, with rules reviewed regularly against evolving TTPs (for example aligned with the MITRE ATT\u0026CK framework). A useful resource for establishing a triage framework is the NCSC Incident Management Guidance severity matrix and categorisation table, and checklists should be pre-prepared, for example to check asset state against a known good baseline.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Are a wide range of signatures and indicators of compromise used for investigations of suspicious activity and alerts?",
                                                 "Are security alerts relating to all essential functions prioritised and this information is used to support incident management?",
                                                 "Are alerts tested to ensure that they are generated reliably and that it is possible to distinguish genuine security incidents from false alarms?",
                                                 "Are rules reviewed on a regular basis to ensure they are effectively able to identify malicious tactics, techniques and procedures (TTP\u0027s) aligned with the MITRE ATT\u0026CK framework or other applicable frameworks and the evolving threat landscape?",
                                                 "Does the dutyholder gauge the severity of impact of the incident in order to deliver a proportionate response?",
                                                 "Is there a process for initial determination i.e. who declares an incident based on observable events?",
                                                 "Is there a process for assigning an initial handler and assigning responders?",
                                                 "Have checklists been pre-prepared, for example, to check asset state against a known good baseline?",
                                                 "Does the IR team have up to date network architecture diagrams?"
                                             ]
                     },
                     {
                         "id":  "7.5.9",
                         "principleId":  "7.5",
                         "title":  "Proactive attack and abnormality discovery",
                         "controlText":  "The dutyholder should detect, within networks and information systems, malicious activity affecting, or with the potential to affect, the operation of essential functions even when the activity evades standard signature based security solutions (or when standard solutions are not deployable). The dutyholder should define examples of abnormalities in system behaviour that provide practical ways of detecting malicious activity that is otherwise hard to identify, and use an informed understanding of more sophisticated attack methods and of normal system behaviour to monitor proactively for malicious activity, generating alerts based on the results of such searches.\n\nThis requires the dutyholder to fully understand normal system behaviour (which systems should and should not communicate and when), to update abnormality descriptions to reflect changes in their networks and current threat intelligence, and to routinely test the capability of the monitoring service to detect cyber incidents based on new and existing threats.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Does the dutyholder fully understand normal system behaviour to such an extent that searching for system abnormalities is a potentially effective way of detecting malicious activity (i.e. do they fully understand which systems should and should not communicate and when)?",
                                                 "Are system abnormality descriptions from past attacks and threat intelligence, on dutyholder and other networks, used to signify malicious activity?",
                                                 "Are the system abnormality descriptions they use updated to reflect changes in their networks and information systems and current threat intelligence?",
                                                 "Does the dutyholder routinely search for system abnormalities indicative of malicious activity on the networks and information systems supporting the operation of their essential function, generating alerts based on the results of such searches?",
                                                 "Does the dutyholder have justified confidence in the effectiveness of their searches for system abnormalities indicative of malicious activity?",
                                                 "Does the dutyholder routinely test the capability of the monitoring service to detect cyber incidents based on new and existing threats?"
                                             ]
                     },
                     {
                         "id":  "7.5.10",
                         "principleId":  "7.5",
                         "title":  "Containment, eradication and recovery",
                         "controlText":  "The containment phase sees responders work to limit any system damage caused by an incident and take measures to prevent further damage occurring, using predetermined strategies and procedures for containing the incident (for example isolating an endpoint, shutting down a system, disconnecting from a network or disabling functions). Dutyholders should have separate containment strategies for each major incident type with criteria documented clearly, a defined risk appetite for incident handling, pre-agreed containment procedures, and processes to record temporary changes. Affected systems should then be eradicated and recovered, bringing systems back into the production environment in a controlled way with testing, monitoring and validation to verify they are not re-infected.\n\nEradication is usually necessary to eliminate components of the incident such as deleting malware, disabling breached accounts and identifying and mitigating all exploited vulnerabilities, identifying all affected hosts as threat actors often attempt persistence beyond the initial incident. RGP is to restore systems from clean disk images or backups, install patches, disable unused services and scan affected systems with anti-malware; dutyholders should have pre-prepared plans for rebuilding critical systems to a known good state and arrangements to ensure continuity of critical operations during a prolonged containment stage.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Has the dutyholder identified the major incident types that could impact its operations?",
                                                 "Has the dutyholder created separate containment strategies for each major incident type, with criteria documented clearly to facilitate decision-making?",
                                                 "Has the dutyholder defined risk appetite for incident handling? Do the containment strategies enable the organisation to remain within that risk tolerance?",
                                                 "Does the dutyholder have means to monitor for potential re-infection during the containment, eradication and recovery phase?",
                                                 "Does the dutyholder have pre-agreed procedures for containment (e.g. disconnecting networks)?",
                                                 "Does the dutyholder have in place arrangements to ensure the continuity of critical operations during a prolonged containment stage?",
                                                 "Does the dutyholder have pre-prepared plans for rebuilding critical systems to a known good state and returning them to service in appropriate timescales?",
                                                 "Does the dutyholder have long-term containment plans that identify network segregation options, system and asset isolation strategies etc?",
                                                 "Does the dutyholder have procedures in place for restoring key systems to a known good state?",
                                                 "Where third party system vendors are involved does the dutyholder have SLAs in place to recover systems?"
                                             ]
                     },
                     {
                         "id":  "7.5.11",
                         "principleId":  "7.5",
                         "title":  "Forensic tooling and evidence handling",
                         "controlText":  "The dutyholder should ensure the response team or third party has the appropriate hardware, software and licensing (such as forensic tools, memory analysis, log parsers and timeline generation), with appropriate training invested, and forensic supplies audited periodically and refreshed after use. Evidence should be collected according to procedures that meet all applicable laws and regulations, using a write blocker so data is not inadvertently changed, making a master copy and a working copy of imaged data in line with best forensic practice, and maintaining a documented chain of custody whenever evidence is transferred. Before wiping and reimaging any system it is necessary to take a forensic image of the affected system(s) to preserve evidence.\n\nAny forensic services provider should be accredited to ISO17025, the legal standard for admissible evidence, as a minimum, and a detailed log should be kept for all evidence including identifying information, the name/title of each individual who handled it, the time and date of each occurrence of handling, and storage locations. Staff should be suitably qualified and experienced for preserving evidence in line with the four principles in the ACPO Good Practice Guide for Digital Evidence.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Has the dutyholder identified digital forensic tools needed for use in a computer security incident response and ensured their availability?",
                                                 "Are digital forensic tools and supplies audited on a periodic basis to ensure kits are up to date and complete?",
                                                 "Are digital forensic tools and supplies refreshed after use?",
                                                 "Do incident response tools and supplies include an incident journal, evidence forms, evidence bags etc?",
                                                 "Has the dutyholder performed the appropriate assurance activities (e.g. audit) for the digital forensic tools held by the third party?",
                                                 "Has the dutyholder considered when law enforcement would be contacted and is this recorded in relevant procedures?",
                                                 "Are dutyholder staff suitably qualified and experienced for preserving evidence in line with the four principles in the ACPO Good Practice Guide for Digital Evidence?",
                                                 "Do dutyholders have forensic capability or arrangements to call on a third party?"
                                             ]
                     },
                     {
                         "id":  "7.5.12",
                         "principleId":  "7.5",
                         "title":  "Lessons learnt",
                         "controlText":  "Dutyholders should ensure that when an incident occurs, steps are taken to understand its root causes and to ensure appropriate remediating action is taken to protect against future incidents. Dutyholders should use lessons learnt from incidents to improve their security measures, either during an incident to inform the containment and eradication phase or post incident to improve security controls, and should have a documented incident review process or policy which ensures that lessons learnt from each incident are identified, captured and acted upon.\n\nRoot cause analysis should be conducted routinely and be comprehensive, covering organisational process issues as well as vulnerabilities in networks, systems or software, with all relevant incident data made available to the analysis team. Security improvements identified should be prioritised, with the highest priority improvements completed quickly, and because lessons learnt may reveal vulnerabilities they should be handled on a need to know basis as part of policy.",
                         "controlTextLabel":  "SyDP 7.5 expectation (CNSS-TAST-GD-7.5)",
                         "promptQuestions":  [
                                                 "Does the dutyholder ensure that root cause analysis is conducted routinely as a key part of their lessons learnt activities following an incident?",
                                                 "Is the root cause analysis comprehensive, covering organisational process issue, as well as vulnerabilities in their networks, systems or software?",
                                                 "Is all relevant incident data made available to the analysis team to perform root cause analysis?",
                                                 "Does the dutyholder have a documented incident review process/policy which ensures that lessons learnt from each incident are identified, captured, and acted upon?",
                                                 "Does the dutyholder\u0027s lessons learnt process/policy cover issues with reporting, roles, governance, skills and organisational processes as well as technical aspects of networks and information systems?",
                                                 "Do they use lessons learnt to improve security measures, including updating and retesting response plans when necessary?",
                                                 "Are security improvements identified as a result of lessons learnt prioritised, with the highest priority improvements completed quickly?",
                                                 "Is lessons learnt on a \u0027need to know\u0027 basis and part of policy?"
                                             ]
                     }
                 ]
};
