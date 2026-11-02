/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-full/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-full"] = window.App.Data.instruments["onr-syaps-full"] || {};
window.App.Data.instruments["onr-syaps-full"].instrument = {
    "id":  "onr-syaps-full",
    "title":  "ONR SyAPs Nuclear Security Posture Assessment (all 10 FSyP)",
    "framework":  "ONR SyAPs",
    "edition":  "2022 Edition, Version 1",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "caf-achieved",
    "scoringProfileRef":  "caf-achieved",
    "targetDimension":  "organisation",
    "targetDimensionLabel":  "Dutyholder / site",
    "framing":  "An informal, whole-of-security posture gap assessment against all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs 2022): Leadership \u0026 Management, Organisational Culture, Human Performance, Nuclear Supply Chain, Reliability/Resilience/Sustainability, Physical Protection Systems, Cyber Security \u0026 Information Assurance, Workforce Trustworthiness, Policing \u0026 Guarding, and Emergency Preparedness \u0026 Response. Each regulatory expectation is judged Achieved, Partially achieved or Not achieved against a dutyholder profile. Coverage is deepest where an ONR Technical Assessment Guide exists (FSyP 1 to 5 and 7); the physical, personnel, policing and emergency principles are assessed at the level published in the SyAPs (the categorisation and posture annexes are redacted). This is not an ONR assessment and does not approve a security plan.",
    "sourceNote":  "Fundamental Security Principles (FSyP), Security Delivery Principles (SyDP) and their regulatory expectations are transcribed and lightly condensed from the ONR SyAPs (2022) and the published CNS-TAST-GD Technical Assessment Guides. Where no TAG was available for a Security Delivery Principle, the expectations are drawn from the SyAPs master document. This is an informal alignment and gap tool, not an ONR assessment.",
    "attribution":  "Contains public sector information published by the Office for Nuclear Regulation (ONR) and licensed under the Open Government Licence v3.0. Source: Security Assessment Principles for the Civil Nuclear Industry (2022 Edition, Version 1) and the associated Civil Nuclear Security Technical Assessment Guides (CNS-TAST-GD).",
    "criticalCaveats":  [
                            "This is not an ONR assessment, inspection, or determination of compliance with the Nuclear Industries Security Regulations 2003 (NISR). It is an informal, consultant-led gap assessment to support improvement.",
                            "It does not constitute, replace, or approve a security plan. Only ONR can assess and approve a dutyholder\u0027s security plan under NISR.",
                            "The public SyAPs has its Annexes (the categorisation and security-posture tables) redacted, so this tool uses only the published Security Delivery Principle expectations and cannot reproduce the graded posture thresholds.",
                            "Do not enter Sensitive Nuclear Information (SNI) or any classified or protectively-marked material into this tool."
                        ],
    "display":  {
                    "subtitle":  "Informal whole-of-security posture assessment against all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs). Capture engagement details, pick the dutyholder profile below, then work through the Fundamental Security Principles from the sidebar.",
                    "reportSubline":  "ONR SyAPs nuclear security posture assessment (all 10 FSyP)",
                    "reportDescription":  "ONR SyAPs whole-of-security informal posture gap analysis",
                    "profileTitle":  "Dutyholder profile",
                    "profileStep1Label":  "Dutyholder profile",
                    "objectiveTitle":  "Fundamental Security Principle",
                    "principleNoun":  "Security Delivery Principle",
                    "outcomesTitle":  "Expectations",
                    "about":  "This is an informal, whole-of-security posture gap assessment against all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs): leadership and management, culture, human performance, supply chain, reliability/resilience/sustainability, physical protection, cyber and information assurance, workforce trustworthiness, policing and guarding, and emergency preparedness and response. It gives a structured read on the dutyholder\u0027s security posture across every principle and a prioritised improvement roadmap. Coverage is deepest for the management and cyber principles (which have detailed Technical Assessment Guides); the physical, personnel, policing and emergency principles are assessed at the level published in SyAPs, since ONR\u0027s categorisation and posture annexes are redacted. It is advisory only: not an ONR assessment, not a determination of NISR compliance, and it neither constitutes nor approves a security plan.",
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
                                            "id":  "1",
                                            "name":  "Leadership and Management for Security"
                                        },
                                        {
                                            "id":  "2",
                                            "name":  "Organisational Culture"
                                        },
                                        {
                                            "id":  "3",
                                            "name":  "Management of Human Performance"
                                        },
                                        {
                                            "id":  "4",
                                            "name":  "Nuclear Supply Chain Management"
                                        },
                                        {
                                            "id":  "5",
                                            "name":  "Reliability, Resilience and Sustainability"
                                        },
                                        {
                                            "id":  "6",
                                            "name":  "Physical Protection Systems"
                                        },
                                        {
                                            "id":  "7",
                                            "name":  "Cyber Security and Information Assurance"
                                        },
                                        {
                                            "id":  "8",
                                            "name":  "Workforce Trustworthiness"
                                        },
                                        {
                                            "id":  "9",
                                            "name":  "Policing and Guarding"
                                        },
                                        {
                                            "id":  "10",
                                            "name":  "Emergency Preparedness and Response"
                                        }
                                    ],
                     "principles":  [
                                        {
                                            "id":  "1.1",
                                            "name":  "Governance and Leadership",
                                            "objectiveId":  "1"
                                        },
                                        {
                                            "id":  "1.2",
                                            "name":  "Capable Organisation",
                                            "objectiveId":  "1"
                                        },
                                        {
                                            "id":  "1.3",
                                            "name":  "Decision Making",
                                            "objectiveId":  "1"
                                        },
                                        {
                                            "id":  "1.4",
                                            "name":  "Organisational Learning",
                                            "objectiveId":  "1"
                                        },
                                        {
                                            "id":  "1.5",
                                            "name":  "Assurance Processes",
                                            "objectiveId":  "1"
                                        },
                                        {
                                            "id":  "2.1",
                                            "name":  "Maintenance of a Robust Security Culture",
                                            "objectiveId":  "2"
                                        },
                                        {
                                            "id":  "3.1",
                                            "name":  "Identification and Analysis of Security Tasks and Roles",
                                            "objectiveId":  "3"
                                        },
                                        {
                                            "id":  "3.2",
                                            "name":  "Sufficiency and Competence of Personnel Delivering Security",
                                            "objectiveId":  "3"
                                        },
                                        {
                                            "id":  "3.3",
                                            "name":  "Suitable and Sufficient Workspaces, Equipment and User Interfaces",
                                            "objectiveId":  "3"
                                        },
                                        {
                                            "id":  "3.4",
                                            "name":  "Suitable and Sufficient Procedures and Administrative Controls",
                                            "objectiveId":  "3"
                                        },
                                        {
                                            "id":  "4.1",
                                            "name":  "Procurement and Intelligent Customer Capability",
                                            "objectiveId":  "4"
                                        },
                                        {
                                            "id":  "4.2",
                                            "name":  "Supplier Capability",
                                            "objectiveId":  "4"
                                        },
                                        {
                                            "id":  "4.3",
                                            "name":  "Oversight of Suppliers of Items or Services of Nuclear Security Significance",
                                            "objectiveId":  "4"
                                        },
                                        {
                                            "id":  "4.4",
                                            "name":  "Commissioning of Security Systems and Infrastructure",
                                            "objectiveId":  "4"
                                        },
                                        {
                                            "id":  "5.1",
                                            "name":  "Reliability and Resilience of the Security System",
                                            "objectiveId":  "5"
                                        },
                                        {
                                            "id":  "5.2",
                                            "name":  "Examination, Inspection, Maintenance and Testing of Physical Protection Systems",
                                            "objectiveId":  "5"
                                        },
                                        {
                                            "id":  "5.3",
                                            "name":  "Sustainability of Nuclear Security Arrangements",
                                            "objectiveId":  "5"
                                        },
                                        {
                                            "id":  "6.1",
                                            "name":  "Categorisation for Theft",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.2",
                                            "name":  "Categorisation for Sabotage",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.3",
                                            "name":  "Physical Protection System Design",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.4",
                                            "name":  "Vulnerability Assessments",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.5",
                                            "name":  "Adjacent or Enclave Nuclear Premises",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.6",
                                            "name":  "Nuclear Construction Sites",
                                            "objectiveId":  "6"
                                        },
                                        {
                                            "id":  "6.7",
                                            "name":  "Protection of Nuclear Material During Offsite Transportation",
                                            "objectiveId":  "6"
                                        },
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
                                        },
                                        {
                                            "id":  "8.1",
                                            "name":  "Cooperation of Departments Delivering Screening, Vetting and Ongoing Personnel Security",
                                            "objectiveId":  "8"
                                        },
                                        {
                                            "id":  "8.2",
                                            "name":  "Pre-employment Screening and National Security Vetting",
                                            "objectiveId":  "8"
                                        },
                                        {
                                            "id":  "8.3",
                                            "name":  "Ongoing Personnel Security",
                                            "objectiveId":  "8"
                                        },
                                        {
                                            "id":  "9.1",
                                            "name":  "CNC Response Force",
                                            "objectiveId":  "9"
                                        },
                                        {
                                            "id":  "9.2",
                                            "name":  "Local Police Operations in Support of the Dutyholder",
                                            "objectiveId":  "9"
                                        },
                                        {
                                            "id":  "9.3",
                                            "name":  "Security Guard Services",
                                            "objectiveId":  "9"
                                        },
                                        {
                                            "id":  "10.1",
                                            "name":  "Counter Terrorism Measures, Emergency Preparedness and Response Planning",
                                            "objectiveId":  "10"
                                        },
                                        {
                                            "id":  "10.2",
                                            "name":  "Testing and Exercising the Security Response",
                                            "objectiveId":  "10"
                                        },
                                        {
                                            "id":  "10.3",
                                            "name":  "Clarity of Command, Control and Communications During and Post a Nuclear Security Event",
                                            "objectiveId":  "10"
                                        }
                                    ]
                 },
    "outcomes":  [
                     {
                         "id":  "1.1.1",
                         "principleId":  "1.1",
                         "title":  "Security plan identifies governance arrangements",
                         "controlText":  "The dutyholder should ensure that the security plan identifies clear security governance arrangements, a commitment to maintaining security at all times and programmes that support strong security governance and leadership.\n\nThis is the overarching regulatory expectation placed upon the dutyholder in support of SyDP 1.1. The security plan should reference the dutyholder\u0027s management of the Nuclear Security Policy and commitment to maintain security at all times.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)"
                     },
                     {
                         "id":  "1.1.2",
                         "principleId":  "1.1",
                         "title":  "Board roles and responsibilities defined",
                         "controlText":  "Dutyholder boards should have clear roles and responsibilities, both collectively and individually. They should also be questioning and challenging and effective at holding the senior management to account.\n\nThe board is responsible for the governance of the company, including setting the strategic aims, providing leadership to put them into effect, and supervising the management of the business.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Does the board have clearly defined roles and responsibilities?"
                                             ]
                     },
                     {
                         "id":  "1.1.3",
                         "principleId":  "1.1",
                         "title":  "Security prioritised in strategic direction",
                         "controlText":  "It is essential that dutyholder boards treat security as an appropriate priority when providing strategic direction and leadership.\n\nBoards should give security due priority alongside other strategic considerations when directing and leading the organisation.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is security treated as a priority when providing strategic direction and leadership?"
                                             ]
                     },
                     {
                         "id":  "1.1.4",
                         "principleId":  "1.1",
                         "title":  "Board informed and competent on security",
                         "controlText":  "Board members must have access to good quality, current security information regarding threats and risks in addition to operational performance information, and boards must have appropriate membership and competence (either through direct experience or readily accessed subject matter experts) to interpret the security information and use it to validate the efficacy of security programmes.\n\nAccess to current threat and risk information, including metrics, together with the competence to interpret it, enables the board to provide effective strategic direction and to validate security programmes.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Are there mechanisms in place to ensure the board receive current, quality security information on threats and risks?",
                                                 "Has the board got appropriate membership and competence to assess and act effectively on security information?"
                                             ]
                     },
                     {
                         "id":  "1.1.5",
                         "principleId":  "1.1",
                         "title":  "Structured, integrated and diverse oversight",
                         "controlText":  "Effective oversight should be facilitated through structured, integrated and diverse means such as self-assessments at facility/department level, internal independent oversight or regulation, robust governance structure, external assessments or peer reviews, with the level and rigour applied using a graded approach.\n\nOversight of security should be an integral part of line management responsibilities, not solely delegated to the security department; department managers should continually monitor and question security performance.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is oversight facilitated through structured, integrated and diverse means in line with the graded approach?"
                                             ]
                     },
                     {
                         "id":  "1.1.6",
                         "principleId":  "1.1",
                         "title":  "Oversight data from diverse sources",
                         "controlText":  "Oversight is dependent on information; reports on performance should include qualitative discussion of trends and issues, supplemented by other sources such as feedback from staff, event investigations and assessments/audits, recognising the limitations of performance indicators.\n\nData should be drawn from a range of sources because performance indicators alone have known limitations. Self-assessments should be supplemented by robust independent internal challenge.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is data collected from a range of sources such as performance indicators, staff feedback, event investigations, independent and self-assessment?"
                                             ]
                     },
                     {
                         "id":  "1.1.7",
                         "principleId":  "1.1",
                         "title":  "Independent oversight / internal regulation function",
                         "controlText":  "Self-assessments should be supplemented by a robust internal challenge capability that is independent of the operational line management; such independent oversight or internal regulation function should be adequately equipped with the skills and resources required to perform its role effectively.\n\nThe independent function should be valued and supported by senior management even when it is conveying bad news. Further information is in the Independent Oversight Good Practice Guide.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is there an independent oversight or internal regulation function with the capability, capacity and authority to perform its role effectively?"
                                             ]
                     },
                     {
                         "id":  "1.1.8",
                         "principleId":  "1.1",
                         "title":  "Nuclear Security Policy (NSyP) in place",
                         "controlText":  "All dutyholders should develop a Nuclear Security Policy (NSyP) that is clear, concise and focused on nuclear security; its existence and purpose should be communicated and understood across the dutyholder\u0027s managers, staff and contractors.\n\nThe NSyP is an essential document that influences the behaviours, actions and decisions of the board, leaders and managers. Security plans should reference the dutyholder\u0027s management of the NSyP and commitment to maintain security at all times.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is there a clear and concise NSyP in place together with commitment to adhere to it?"
                                             ]
                     },
                     {
                         "id":  "1.1.9",
                         "principleId":  "1.1",
                         "title":  "Roles and standards linked to NSyP and communicated",
                         "controlText":  "Dutyholders should ensure that roles, accountabilities, standards and expectations of behaviour for nuclear security are clear, linked to the NSyP and apply to all from the board down, and are effectively communicated.\n\nCommunication is essential and the standards and expectations should form an integral part of induction and training programmes, including leadership selection/development and key contractors.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Are roles, accountabilities, standards and expectations of behaviour for nuclear security clear, linked to the NSyP and apply to all from the board down?",
                                                 "Are the NSyP, standards and expectations effectively communicated?"
                                             ]
                     },
                     {
                         "id":  "1.1.10",
                         "principleId":  "1.1",
                         "title":  "Compliance monitored from board down",
                         "controlText":  "Everyone should adhere to the standards and expectations, so compliance should be monitored and reinforced; dutyholders should demonstrate how assurance is sought that board members and senior/facility managers (in addition to front-line staff) are acting in accordance with the company\u0027s standards and expectations.\n\nLessons from major events show that inappropriate attitudes and behaviours at the highest levels can undermine security. Often a top-level review is missing where senior managers only perform \u0027look down\u0027 monitoring.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Does the dutyholder reinforce and monitor compliance with the NSyP, standards and expectations from the board down?"
                                             ]
                     },
                     {
                         "id":  "1.1.11",
                         "principleId":  "1.1",
                         "title":  "Management commitment and staff engagement",
                         "controlText":  "The actions and decisions taken by senior management should demonstrate clearly their overriding commitment to maintaining nuclear security, and dutyholders should encourage frequent, face-to-face engagement between board members, senior management and staff, recording the outcome and seeking improvement where it has been negative.\n\nManagement should regularly visit work areas to observe conditions first hand, model and reinforce standards and expectations, and interact with staff. Reward systems should promote positive security behaviours without introducing perverse drivers; staff should be genuinely consulted and involved so their skills and knowledge inform senior decision making.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Does dutyholder management demonstrate clearly their commitment to maintaining nuclear security?",
                                                 "Does the dutyholder encourage regular face-to-face engagement between the board, the senior management team and staff? (such as visits to work areas to observe conditions first hand, model and reinforce standards and expectations)",
                                                 "Is there a performance management system in place that promotes nuclear security without inadvertently introducing perverse drivers?",
                                                 "Are staff routinely consulted and engaged on security issues such that their skills and knowledge are used to inform decision making at senior levels?"
                                             ]
                     },
                     {
                         "id":  "1.1.12",
                         "principleId":  "1.1",
                         "title":  "Integrated management system in place",
                         "controlText":  "Dutyholders should implement an integrated management system that ensures security is considered in all their activities and is not confined to the quality management system, using effective, efficient and dynamic management systems to engender strong, positive security cultures.\n\nAn integrated management system promotes a consistent approach across environment, safety, transport, safeguards and other business activities and reduces the likelihood of incompatible arrangements. It should reflect the four principles of ownership and leadership; integration/focus/optimisation; effective processes; and being visible, accessible and used.",
                         "controlTextLabel":  "SyDP 1.1 expectation (CNS-TAST-GD-1.1)",
                         "promptQuestions":  [
                                                 "Is there an integrated management system in place that adheres to current relevant good practice?"
                                             ]
                     },
                     {
                         "id":  "1.2.1",
                         "principleId":  "1.2",
                         "title":  "Governance structure and arrangements for security",
                         "controlText":  "The dutyholder should ensure the security plan includes the governance structure and arrangements for security, and should demonstrate that corporate governance arrangements are clearly documented and that the board gives appropriate priority to security matters.\n\nCorporate governance for security is the combination of the company\u0027s corporate governance arrangements and the activities undertaken by its board in ensuring adequate direction and control over security. Board decision-making should consider the quality of board reporting and information, the questioning of assumptions, exploration of relevant scenarios that may threaten security, health/safety/environmental/security/quality/economic requirements, and the relative priorities of options to minimise overall risk.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.2",
                         "principleId":  "1.2",
                         "title":  "Clear security organisational structure and resilience",
                         "controlText":  "The security plan should include a clear security organisational structure with corresponding roles and responsibilities, including how organisational resilience will be achieved.\n\nThe dutyholder determines its organisational structure based on the needs of its business; inspectors assess whether the proposed structure is fit for purpose and meets the regulatory expectations for maintaining security throughout the full range of business activities.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.3",
                         "principleId":  "1.2",
                         "title":  "Security management arrangements in management system",
                         "controlText":  "Security management arrangements should be clearly articulated in the management system and reflect those described in the approved security plan.\n\nIt is good practice for dutyholders to have a single management system covering all aspects of the business; for example a safety management prospectus may include security to become a Safety and Security Management Prospectus. The most effective organisations integrate security with their routine business delivery strategy and plans.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.4",
                         "principleId":  "1.2",
                         "title":  "Core security capability and control retained",
                         "controlText":  "The dutyholder should maintain a core security capability of staff to ensure effective control and management for nuclear security, and should retain overall responsibility for, and control and oversight of, the nuclear and radiological safety and security of all its business, including work carried out on its behalf by contractors.\n\nThe dutyholder should be able to show that it understands the security roles that need to be delivered and that these roles will be carried out by suitable and sufficient competent resource; it is not sufficient just to show that all roles are covered, but that individuals in post can realistically carry them out to the required standard and capacity.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.5",
                         "principleId":  "1.2",
                         "title":  "Nuclear Baseline established and maintained",
                         "controlText":  "The dutyholder should have in place a process through which the Nuclear Baseline (NB) is derived and managed, demonstrating that the organisation has sufficient staff and competencies to discharge its responsibilities for delivery and oversight of nuclear security in accordance with the approved security plan.\n\nThe NB should consider all activities with the potential to impact upon nuclear security, address steady state, periods of change and potential emergency situations, and be maintained as a living document providing an accurate, current reference point against which nuclear safety and security implications of proposed changes can be assessed. Dutyholders should develop indicators that provide evidence the NB has the right organisation, staffing levels and competences and is being managed effectively.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.6",
                         "principleId":  "1.2",
                         "title":  "Management of organisational change controls security",
                         "controlText":  "The dutyholder\u0027s management of change arrangements should ensure that the nuclear security implications of a proposed change to the organisational nuclear security baseline posts are fully considered and that risks arising from inadequate impact assessment and implementation of the change are recognised and suitably controlled.\n\nThe full implications of a proposed change or series of changes should be assessed prior to implementation to guard against failure to consider dependencies and against \u0027salami slicing\u0027 where a major change is decomposed into lesser changes treated independently. All changes to the organisation specified in the approved security plan must be submitted to ONR for approval unless notifications under Regulation 7(2) have been issued.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.7",
                         "principleId":  "1.2",
                         "title":  "Board and Executive oversight of change",
                         "controlText":  "Board, Executive and Lead Team members should understand and visibly commit to management of organisational change as a key business process, ensuring the implications of significant and complex changes are formally assessed using a consistent methodology prior to implementation and that the objectives of changes are met.\n\nThis applies to changes at all levels including the very top of the organisation, where changes in the composition and knowledge of the Board or Executive team can have a significant influence over security. The organisation should be regularly monitored to ensure security is not progressively degraded by a succession of changes, and SQEPs should hold key management-of-change roles.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.8",
                         "principleId":  "1.2",
                         "title":  "Security Design Authority (DA) capability",
                         "controlText":  "A dutyholder should have a formal process to understand and maintain design knowledge and design integrity, with a suitable and sufficient Design Authority (DA) capability that has the responsibility for, and the requisite knowledge to maintain, the design integrity and the overall basis for security of its nuclear facilities throughout their full lifecycle.\n\nThe DA should have sufficient knowledge to understand the security arrangements for the site, to assess the impact of proposed design changes on the functionality, reliability and availability claims made in the security plan, and to understand the need to protect against the cyber threat. Organisations seeking approval of a security plan should have credible programmes to develop this capability in a timely manner.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.9",
                         "principleId":  "1.2",
                         "title":  "Core Security and Intelligent Customer (CS\u0026IC) capability",
                         "controlText":  "The dutyholder should retain sufficient knowledge of all aspects of the design to act as a Design Authority and Intelligent Customer (IC), enabling it to understand the results of Responsible Designers\u0027 work and the security implications of that work for the life of the plant.\n\nWhere responsibilities for some parts of the security equipment are assigned to Responsible Designers, the dutyholder must retain sufficient knowledge to act as the Intelligent Customer for equipment and services provided to it. The roles of DA and IC should be part of the dutyholder\u0027s core capability and included in their Nuclear Baseline.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.10",
                         "principleId":  "1.2",
                         "title":  "Knowledge management processes",
                         "controlText":  "The security plan should include arrangements to retain and manage the use of knowledge to ensure security arrangements are understood and risks controlled through all activities; a capable organisation will be able to demonstrate knowledge management in its strategic planning, analysis and decision-making, implementation of plans, and evaluation of results.\n\nKnowledge management is an integrated, systematic approach to identifying, acquiring, transforming, developing, disseminating, using, sharing and preserving knowledge relevant to achieving specific objectives; it is a vital component of change management and a fundamental element of a capable organisation, with a spirit of knowledge sharing ingrained in the organisation\u0027s culture.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.2.11",
                         "principleId":  "1.2",
                         "title":  "Adequacy of financial resources",
                         "controlText":  "Dutyholders should be able to demonstrate prudent fiscal planning and articulate how they will be able to achieve and maintain the security arrangements specified in the security plan, and the security plan should set out the split in the security budget between operations, maintenance, asset management and investment.\n\nThe security budget split should be reviewed during the dutyholder\u0027s annual review of security. Inspectors should be alert to indirect evidence of a reduction in the ability or willingness to maintain adequate financial resources, such as failure to implement security improvements, unfilled security staff shortages, or delays in maintenance of security equipment. The dutyholder retains an absolute responsibility for site security even where its budget is controlled by another body.",
                         "controlTextLabel":  "SyDP 1.2 expectation (CNS-TAST-GD-1.2)"
                     },
                     {
                         "id":  "1.3.1",
                         "principleId":  "1.3",
                         "title":  "Prudent, timely decisions at appropriate level",
                         "controlText":  "The security plan should detail how decisions with the potential to affect security are taken, using a prudent, rational process that incorporates diversity, transparency and challenge, enabling prudent, timely decisions to be made at the appropriate level by Suitably Qualified and Experienced Persons (SQEP).\n\nThe process must permit decision-making to be transferred elsewhere within the organisation should the situation require it. Not all security decisions need to be referred upwards, but senior managers, individual directors and the governing board should be involved in strategic-level security decisions.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Does the process enable prudent and timely decisions to be made at the appropriate level by competent personnel?"
                                             ]
                     },
                     {
                         "id":  "1.3.2",
                         "principleId":  "1.3",
                         "title":  "Conservative under uncertainty; not outsourced",
                         "controlText":  "Security-related decisions should cater for the potential for error, uncertainty and the unexpected and be appropriately and demonstrably conservative; they should not be out-sourced to a third party such as contractors, but should demonstrably incorporate diversity of view.\n\nOperational decisions may have to be made quickly with imprecise and incomplete information. Where civilian guard forces make operational decisions, their authority should be bounded and subject to appropriate oversight by SQEP personnel, and their decisions suitably prudent and conservative. Diversity of view can be achieved by involving individuals from other business units in the peer review process.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)"
                     },
                     {
                         "id":  "1.3.3",
                         "principleId":  "1.3",
                         "title":  "Decision-makers have authority and competence",
                         "controlText":  "Decision makers should have both the necessary organisational authority to make their decisions and the means to ensure they are implemented, and should be able to demonstrate they can make balanced, rational decisions taking account of vital areas and associated hazards, operational impacts, safety needs, the graded approach to security, and the needs of the business.\n\nUnqualified, inexperienced or temperamentally unsuitable personnel should not be in roles where they will be required to make significant and/or time-critical security-related decisions.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Do decision-makers have the necessary authority and the means to ensure that their decisions are implemented?",
                                                 "Are decision-makers demonstrably able to make rational, prudent and timely decisions?"
                                             ]
                     },
                     {
                         "id":  "1.3.4",
                         "principleId":  "1.3",
                         "title":  "Inexperienced decision-makers trained and mentored",
                         "controlText":  "Inexperienced decision makers should be supported through a structured programme of training/mentoring, and at the operational level decision-makers should have the opportunity to learn and practice decision-making processes under realistic conditions within the context of the Design Basis Threat (DBT).\n\nDecision makers should be able to obtain appropriate situational awareness and understanding, engage effectively with stakeholders, listen to the advice of SQEP personnel and develop alternative potential options.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Are inexperienced decision-makers suitably trained and mentored and do they have the opportunity to realistically, but safely, practice their decision-making skills and learn from the experience?"
                                             ]
                     },
                     {
                         "id":  "1.3.5",
                         "principleId":  "1.3",
                         "title":  "Situational awareness and understanding",
                         "controlText":  "There should always be sufficient numbers of SQEP personnel within an organisation\u0027s security staff who can understand what might affect security-related decisions, identify potential solutions and advise senior decision-makers, with decisions based on the best available information within the timescale.\n\nThis should not be out-sourced to contractors. At the operational level decision-makers must have appropriate local knowledge of a site, situational awareness and required security responses; at the strategic level they must understand the broader context, including the desired outcomes, nuclear safety requirements, knowledge of the DBT, security risks and vulnerabilities, legal and regulatory requirements and potential reputational impacts.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Are there processes to ensure senior decision-makers are provided with adequate situational awareness and understanding to ensure decisions are informed by the best available information in the time at hand?"
                                             ]
                     },
                     {
                         "id":  "1.3.6",
                         "principleId":  "1.3",
                         "title":  "Stakeholders identified and involved",
                         "controlText":  "Internal and external stakeholders should be identified and involved in the decision-making process, where appropriate, and when time allows, with decision-making processes at both operational and strategic levels enabling stakeholders to be easily identified and informed.\n\nAt the strategic level key internal stakeholders could include the senior information risk officer, senior business managers and directors; key external stakeholders could include the CNC and the civil police.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Are mechanisms in place, where appropriate, to involve internal and external stakeholders in the decision making process?"
                                             ]
                     },
                     {
                         "id":  "1.3.7",
                         "principleId":  "1.3",
                         "title":  "Options developed and tested",
                         "controlText":  "Where time allows, potential options which could achieve the desired outcome should be developed and tested, and assessed or tested utilising SQEP personnel who are independent from the individual or group that developed them.\n\nThere is rarely only one possible solution to a particular problem or issue, so potential alternative options should be developed and assessed to ensure they can achieve the required outcome within any identified constraints.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Where time is available to do so, does the decision-making process allow for a range of potential solutions to be developed and tested?"
                                             ]
                     },
                     {
                         "id":  "1.3.8",
                         "principleId":  "1.3",
                         "title":  "Accountability and auditability",
                         "controlText":  "Designated individuals within the organisation should be accountable for the security decisions that are made and the actions subsequently taken (or not taken); the decision-making process should be suitably transparent and auditable, and relevant records should be kept for an appropriate period of time.\n\nIndividual responsibility for security decision-making should not be outsourced, diluted or concealed.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Is the process appropriately transparent, auditable and require designation of individuals who are accountable for decisions taken?"
                                             ]
                     },
                     {
                         "id":  "1.3.9",
                         "principleId":  "1.3",
                         "title":  "Consistency and simplicity of processes",
                         "controlText":  "Organisations should use consistent and simple decision-making processes and methodologies which aid decision-makers, avoiding unnecessary complexity and bureaucracy and enabling appropriate decisions in the time available.\n\nThe National Protective Security Authority (NPSA) Operational Requirement process (or similar) is one potential option to identify physical security requirements, constraints and potential solutions.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Does the process employ consistent, simple processes and methodologies that assist decision-makers?"
                                             ]
                     },
                     {
                         "id":  "1.3.10",
                         "principleId":  "1.3",
                         "title":  "Reassessment and learning",
                         "controlText":  "Organisations should demonstrate they are sufficiently flexible to reassess decisions and amend potential solutions if relevant factors change to the extent they could affect the desired outcome, and should demonstrate the ability to assimilate relevant good practice and learn from the experiences of others.\n\nRelevant changes may include the identification of new assets, vulnerabilities or the changing nature of the threat.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Is the process adequately flexible to allow for reassessment of decisions and incorporate learning?"
                                             ]
                     },
                     {
                         "id":  "1.3.11",
                         "principleId":  "1.3",
                         "title":  "Challenge and protection from negative behaviours",
                         "controlText":  "Challenge should be part of decision-making throughout the organisation, including at Board and senior management levels, with appropriate active challenge mechanisms designed into all decision-making processes affecting security; organisations should demonstrate that security related decisions are not negatively influenced by behaviours such as group-think, bias and organisational culture.\n\nActive challenge should occur routinely from a questioning attitude, occur by design and transparently, not originate solely from independent assessment or peer review, assume that failure is possible, apply to technical and management decisions, and be used in operational decision making in normal, threat and security event situations. Particular caution is needed over complacency such as a belief that \u0027it could never happen here\u0027 or underestimating a potential adversary.",
                         "controlTextLabel":  "SyDP 1.3 expectation (CNS-TAST-GD-1.3)",
                         "promptQuestions":  [
                                                 "Is the process protected from negative influences and behaviours and allows for appropriate challenge?"
                                             ]
                     },
                     {
                         "id":  "1.4.1",
                         "principleId":  "1.4",
                         "title":  "Framework and processes for organisational learning",
                         "controlText":  "The dutyholder should ensure that the security plan identifies a clear structure, framework and processes which support organisational learning, incorporating the three essential components of leadership and cultural aspects, diverse sources of learning, and learning opportunities realised through managed change.\n\nOrganisational learning is the engine which drives improvement; there are two important aspects, an ability to identify learning opportunities and the commitment to take action, both significantly influenced by the working environment and culture set by the leadership within the organisation.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder has a framework for organisational learning that incorporates the three essential components."
                                             ]
                     },
                     {
                         "id":  "1.4.2",
                         "principleId":  "1.4",
                         "title":  "Leadership and cultural aspects for learning",
                         "controlText":  "Effective learning starts with the Board and senior management; senior management commitment should take the form of a policy statement explaining the dutyholder\u0027s commitment to the prevention of security events by applying lessons learned, underpinned by adequate resourcing, management prioritisation of lessons identified and ongoing monitoring of action plans.\n\nComponent One of the framework requires reviewing and changing processes and behaviours at all levels. The culture is set by leadership, and policies should focus on corrective action rather than blame of personnel who report security deficiencies, with the Board informed of findings, analysis and emerging trends.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder\u0027s policies focus on corrective action, rather than blame of personnel who report security deficiencies.",
                                                 "Whether the dutyholder\u0027s process informs their Board on the findings of identified security deficiencies including analysis of the event and emerging trends."
                                             ]
                     },
                     {
                         "id":  "1.4.3",
                         "principleId":  "1.4",
                         "title":  "Diverse sources of learning identified and used",
                         "controlText":  "A learning organisation should seek out broad, diverse opportunities for learning from a wide range of sources (internal and external) and bring these together to draw out the learning and make improvements, including actively seeking advice or benchmarks through peer reviews.\n\nComponent Two of the framework requires tapping into the ideas, energy and concerns of those at all levels, continually scanning across sectors for learning and good practice, and where possible aligning security and safety OpEx policies.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder\u0027s security and safety OPEX policies are effectively aligned.",
                                                 "Whether the dutyholder encourages a learning organisation through actively seeking lessons learned from other organisations and, where appropriate, apply them to their organisation."
                                             ]
                     },
                     {
                         "id":  "1.4.4",
                         "principleId":  "1.4",
                         "title":  "Learning opportunities realised through managed change",
                         "controlText":  "To complete the learning cycle, organisations must invest the resources necessary to implement changes and then apply the lessons, integrating diverse sources of information and defining effective and prioritised actions that improve security.\n\nComponent Three recognises that having information that can drive learning and having the willingness and ability to use it effectively are distinctly different attributes; effort is needed to integrate diverse sources of information into prioritised actions.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)"
                     },
                     {
                         "id":  "1.4.5",
                         "principleId":  "1.4",
                         "title":  "Operational Experience (OpEx) system",
                         "controlText":  "Dutyholders should have a system that identifies and collects pertinent information on security events and adverse conditions in a timely manner, and a policy for systematically identifying and correcting deficiencies in security.\n\nThe objective of OpEx is to proactively collect, document, organise, analyse and apply previous learning relating to equipment, personnel or procedures. Adverse conditions include any deviation, abnormality, equipment/human failure or non-conformity to procedure, and information relating to breakdowns that reduced the layers of defence.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder has a policy for systematically identifying and correcting deficiencies in security."
                                             ]
                     },
                     {
                         "id":  "1.4.6",
                         "principleId":  "1.4",
                         "title":  "Event and adverse condition reporting and tracking",
                         "controlText":  "The dutyholder should establish a process for all employees to identify security deficiencies and improvement suggestions, with a confidential means for security staff to identify and track events and adverse conditions, and clear reporting criteria with low tolerability thresholds so all events including low-level events and near misses are reported and tracked.\n\nAll personnel (staff, contractors, agency workers) should be expected to report all security events and adverse conditions, and managers should constantly reinforce the requirement. Dutyholders have a legal obligation to report security events as required by NISR 2003 Regulations 10, 18 and 22 and the ONR reporting process, with adequate resources allocated to managing and reporting deficiencies.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder encourages staff to report security deficiencies and security improvement opportunities.",
                                                 "Whether the dutyholder has adequate resources allocated to managing and reporting security deficiencies and whether they are compliant with legislation and the ONR mandated reporting process."
                                             ]
                     },
                     {
                         "id":  "1.4.7",
                         "principleId":  "1.4",
                         "title":  "Screening for significance",
                         "controlText":  "The dutyholder should screen event information to ensure all security significant matters are considered and all applicable lessons learned are taken into account, using a categorisation system which grades events and conditions and prioritises them according to security significance and the identification of adverse trends.\n\nThe screening process should be used to select events for detailed investigation and analysis.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)"
                     },
                     {
                         "id":  "1.4.8",
                         "principleId":  "1.4",
                         "title":  "Investigation and analysis",
                         "controlText":  "Dutyholders should have a policy and procedures specifying the type of investigation appropriate for an event of a particular category; highly significant events should be evaluated by a formally qualified multi-disciplinary team using structured root cause investigation methods, with sufficient trained staff to assess all reported security deficiencies fully.\n\nInvestigations should be performed promptly so information and physical evidence are not lost, and event participants interviewed while memories are fresh. The objective is to identify root causes so that when corrected the event or condition should not be repeated; adverse trends such as backlogs in event investigations should be monitored.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder has sufficient training for staff and management to recognise and report problems and enough experienced staff trained in root cause analysis to assess all security deficiencies that are reported fully."
                                             ]
                     },
                     {
                         "id":  "1.4.9",
                         "principleId":  "1.4",
                         "title":  "Corrective action management",
                         "controlText":  "Actions taken in response to events should be specific and practical, address fundamental causes and not symptoms, include immediate and long term actions, and focus on strengthening existing security arrangements; actions should be tracked and responsible persons held accountable for completing them to agreed timescales.\n\nRecurring events warrant special attention, such as increasing their significance level, and the reason a previous corrective action was ineffective should be addressed as part of the follow up. Dates assigned should be commensurate with the importance of the action and avoiding recurrence, and indicators of backlogs in corrective action closure should be monitored for adverse trends.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether there are indicators regarding backlogs in event investigations and corrective action closure, looking particularly for adverse trends."
                                             ]
                     },
                     {
                         "id":  "1.4.10",
                         "principleId":  "1.4",
                         "title":  "Use and dissemination of information",
                         "controlText":  "Information on operational experience should be readily accessible to all security staff and, where appropriate, all employees, with effective use of feedback encouraged and reinforced by the management chain and lessons identified included in refresher training material.\n\nDissemination can be done in a number of ways such as team briefings and regular debriefs of staff on recent security issues. Where an event has resulted in a reportable event under NISR 2003 (as amended), a follow up report should be sent to ONR.",
                         "controlTextLabel":  "SyDP 1.4 expectation (CNS-TAST-GD-1.4)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder regularly debriefs staff on recent security issues that have occurred at the facility and draw on lessons identified to refresh staff understanding."
                                             ]
                     },
                     {
                         "id":  "1.5.1",
                         "principleId":  "1.5",
                         "title":  "Clear assurance arrangements and resourced challenge function",
                         "controlText":  "The dutyholder should ensure that the security plan identifies clear security assurance arrangements, including a challenge function that is adequately resourced.\n\nTo deliver a mature objectives-focused and risk-based approach to nuclear security, the dutyholder should have a well-developed strategy and process for internal assurance, including a challenge function that is suitably resourced and may be part of a wider integrated management system.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)"
                     },
                     {
                         "id":  "1.5.2",
                         "principleId":  "1.5",
                         "title":  "Strong governance underpinning assurance",
                         "controlText":  "A strong internal assurance process should be underpinned by strong governance that makes clear responsibilities and expectations at all levels within an organisation.\n\nThis is the first of the prerequisites of a strong internal assurance process; it emphasises the importance of the dutyholder\u0027s governance arrangements and their ownership of risk management, placing less reliance on external regulation to provide assurance.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)"
                     },
                     {
                         "id":  "1.5.3",
                         "principleId":  "1.5",
                         "title":  "Challenge culture at all levels",
                         "controlText":  "There should be a challenge culture that is part of a wider organisational culture to encourage self-awareness, a willingness to give and receive advice, a questioning attitude and accountability for risk management, such that at all levels personnel adopt a challenge and security culture with self-awareness and internal challenge at its core.\n\nChallenge and advice are linked but distinct; ideally separate organisational teams should deliver the advisory function and the internal independent challenge function, and the dutyholder should remain an intelligent customer with sufficient internal expertise to do this work without relying on contractor support.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)"
                     },
                     {
                         "id":  "1.5.4",
                         "principleId":  "1.5",
                         "title":  "Board evidence-based feedback and competence",
                         "controlText":  "Board members and senior managers need to have objective evidence-based feedback on security performance to understand risk and the effectiveness of its management, and the Board needs to have security competence, perhaps supported by an expert non-executive director or nuclear security committee, with oversight through some form of Audit, Risk and Assurance committee.\n\nFeedback that shapes Board direction is usually based on indicators and metrics drawn from audits, incident reports, penetration testing, exercises, competence testing, security cultural surveys, systems data and organisational learning, linked to a robust close-out arrangement that confirms effective action has taken place with an audit trail.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)"
                     },
                     {
                         "id":  "1.5.5",
                         "principleId":  "1.5",
                         "title":  "Security performance assured against the SyDPs",
                         "controlText":  "Security performance, based on the security delivery principles, should be assured in order to provide evidence to senior leadership and key stakeholders that risks are being effectively controlled and compliance with regulatory requirements is being achieved.\n\nIndependent assurance should be Board-level led. The outcome of assurance is to certify compliance with the security plan and its delivery as well as demonstrating a mind-set of continuous improvement, so the expectations of stakeholders including the regulator and public are addressed.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)"
                     },
                     {
                         "id":  "1.5.6",
                         "principleId":  "1.5",
                         "title":  "Independent internal assurance function with clear terms of reference",
                         "controlText":  "There should be an independent internal assurance function with clearly defined terms of reference (including responsibility, accountability and authority) that is valued by and used at Board level and understood and accepted at all levels of management as providing an independent assessment of performance.\n\nWhere a dutyholder has an internal regulation team covering environment, health, safety, security and quality, all aspects including protective and cyber security should be adequately resourced with suitably competent personnel; a competency matrix should be available to assess the objectivity and integrity of those carrying out internal assurance.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Is there an independent internal assurance function with clearly defined terms of reference (including responsibility, accountability and authority)?"
                                             ]
                     },
                     {
                         "id":  "1.5.7",
                         "principleId":  "1.5",
                         "title":  "Assurance personnel independent of line management",
                         "controlText":  "Personnel undertaking assurance should be demonstrably independent from the operational line of management and have sufficient authority and high level support together with credibility with the regulator, including a route to escalate concerns to Board level.\n\nThis independence and authority ensures the assurance function can provide an objective assessment of performance and escalate concerns effectively.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Are personnel undertaking assurance demonstratively independent from the operational line of management and have sufficient authority and high level support together with credibility with the regulator? (including a route to escalate concerns to Board level)."
                                             ]
                     },
                     {
                         "id":  "1.5.8",
                         "principleId":  "1.5",
                         "title":  "Assurance framework and Performance Indicator framework",
                         "controlText":  "There should be a suitable framework and lexicon, drawing on SyAPs, on which to judge and communicate performance based on an assessment of security delivery, planning and culture, and a Performance Indicator framework that reflects industry good practice.\n\nIn carrying out assurance, the assessment of performance should be evidence-based, not simple assertions, and drawn from analysing both qualitative and quantitative data.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Is there a suitable framework and lexicon, drawing on SyAPs, on which to judge and communicate performance based on an assessment of security delivery, planning and culture?",
                                                 "Does a Performance Indicator framework exist and does it reflect industry good practice?"
                                             ]
                     },
                     {
                         "id":  "1.5.9",
                         "principleId":  "1.5",
                         "title":  "Scope of internal assurance covers whole security regime",
                         "controlText":  "The scope of internal assurance should be explained and should cover the whole security regime, confirm it reflects the SyAPs, and have a performance indicator framework, being targeted as necessary based on inspections and audits, review of documentation and assessment of routine surveillance and incident reporting.\n\nInternal investigations to establish the causes of events, together with corrective actions and dissemination of organisational learning, could be included as appropriate within the assurance function.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Is the scope of internal assurance explained?"
                                             ]
                     },
                     {
                         "id":  "1.5.10",
                         "principleId":  "1.5",
                         "title":  "Board and Executive ownership as standing agenda item",
                         "controlText":  "There should be ownership and understanding at Board and Executive Management level, with security assurance considered a key business delivery and a standing agenda item at their meetings to ensure security is given adequate consideration in decision making.\n\nSenior leadership should ensure the assurance capability is independent, authorised, resourced, integrated into business practices and reports regularly at Board level; if the capability is immature there should be a plan to develop it, and the Board should be an intelligent customer with sufficient security competence/advice.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Is there ownership and understanding at Board and Executive Management level? Security assurance is considered a key business delivery and is a standing agenda item at their meetings to ensure security is given adequate consideration in decision making?"
                                             ]
                     },
                     {
                         "id":  "1.5.11",
                         "principleId":  "1.5",
                         "title":  "SQEP internal assessor team",
                         "controlText":  "There should be an internal, independent, suitably qualified and experienced team of assessors, organised to provide the necessary expertise across security functions, with access to all levels of management.\n\nThe team should understand what is assessed and how to deliver assurance, be sufficiently questioning and able to approach an issue from alternative perspectives and challenge the underlying logic for an idea or action, demonstrating knowledge of assurance good practice; their competence should be measured against technical, behavioural and influencing skills.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Is there an internal, independent, suitably qualified and experienced team of assessors, organised to provide the necessary expertise across security functions, with access to all levels of management?"
                                             ]
                     },
                     {
                         "id":  "1.5.12",
                         "principleId":  "1.5",
                         "title":  "Reporting, quality, feedback and inspection programme",
                         "controlText":  "There should be mechanisms to identify under-performance, gaps in good practice and the causes with a reporting process to make different levels of management aware of findings; quality checks to ensure assurance reporting is evidence based, timely, complete and proportionate; a process for sharing feedback with other stakeholders including ONR; and a programme for internal inspections based on a coherent plan with clearly identified priorities.\n\nAssurance teams may provide guidance on how issues might be addressed but they do not own the risk. Feedback to ONR might be through Level 4 meetings or copies of inspection reports, and a dutyholder normally holds a formal annual review for safety, security and environment. The internal assurance regime should add value and visibly support improvements to the dutyholder\u0027s performance, documented within the management system.",
                         "controlTextLabel":  "SyDP 1.5 expectation (CNS-TAST-GD-1.5)",
                         "promptQuestions":  [
                                                 "Are there mechanisms in place to identify under-performance, gaps in good practice and the causes?",
                                                 "Whether there are quality checks to ensure assurance reporting meets internal and external expectations and needs, in terms of understanding, timeliness, completeness, and value?",
                                                 "Do the internal assurance team have a process for sharing their feedback with other stakeholders?",
                                                 "Is there a programme for internal inspections based on a coherent plan and with clearly identified priorities?"
                                             ]
                     },
                     {
                         "id":  "2.1.1",
                         "principleId":  "2.1",
                         "title":  "Nuclear security policy statement",
                         "controlText":  "The dutyholder\u0027s security plan should contain a nuclear security policy statement that declares a sound commitment to quality and high performance in all nuclear security activities and makes it clear that security has a high priority, potentially overriding operational demands where necessary. The policy should be endorsed by the Board (or equivalent), be clear and available to all staff, and be communicated to and understood by everyone affected.\n\nA risk driven security programme which takes due consideration of proportionality is a key element of an adequate security culture. This policy underpins the management systems that are an integral part of a company/organisation\u0027s security culture. An operating company/organisation has full responsibility for nuclear security in all the activities under its control.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have a security policy that incorporates a commitment to quality and high performance in all nuclear security activities?",
                                                 "Are there mechanisms in place to ensure that the policy is communicated to, and understood by personnel at all levels of the organisation?"
                                             ]
                     },
                     {
                         "id":  "2.1.2",
                         "principleId":  "2.1",
                         "title":  "Board-led governance and management systems",
                         "controlText":  "An appropriate, independent governance regime, led by the Board, should exist to ensure that an adequate nuclear security culture is in place and maintained by the use of appropriate management systems/structures. Security expectations and standards should be set out and communicated to all staff, and the dutyholder should define the roles, responsibilities and accountability for each level within the company/organisation.\n\nManagement systems should be in place for each security function to define expectations, determine trustworthiness, implement and maintain processes, measure progress, assess compliance, improve performance through learning from experience, and manage change. All staff should be accountable for complying with all aspects of the site\u0027s nuclear security regime, as detailed in the security plan.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Is there an appropriate, independent governance regime, led by the Board, to ensure that a robust nuclear security culture is in place and supported by management systems and structures?",
                                                 "Are security expectations and standards clearly set out and mechanisms in place to ensure they are communicated and understood by all staff?"
                                             ]
                     },
                     {
                         "id":  "2.1.3",
                         "principleId":  "2.1",
                         "title":  "Appointed individual responsible for security",
                         "controlText":  "Management should appoint an individual who is responsible for nuclear security, with sufficient authority, autonomy and resources to implement and oversee all nuclear security activities, with sufficient resilience to ensure continuity. Where appropriate, management should establish procedures to facilitate the timely resolution of any conflict between nuclear and radiological safety, security and operations.\n\nWhere there is any conflict regarding the relative priorities of safety, security or operations, senior management should be authorised to resolve the conflict taking into account the overall impact of the risk.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Is there an individual appointed responsible for nuclear security, who has sufficient authority, autonomy and resources to implement and oversee all nuclear security activities?",
                                                 "Are there procedures in place to facilitate timely identification and resolution of conflict between safety, security, environment and operations?"
                                             ]
                     },
                     {
                         "id":  "2.1.4",
                         "principleId":  "2.1",
                         "title":  "Sufficient resources for security",
                         "controlText":  "The company/organisation should allocate sufficient financial, technical and human resources to implement assigned security responsibilities. It should ensure that all security personnel have the necessary qualifications and that these are maintained by an appropriate training and development programme, and that personnel have the necessary equipment, adequate work areas, up to date information and other support to effectively discharge their security responsibilities.\n\nAdequate resourcing underpins the ability of security personnel to discharge their responsibilities effectively and is a key element of an adequate security culture.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Is there sufficient allocation of financial, technical and human resources to implement security responsibilities?",
                                                 "Do security personnel have the necessary skills, experience and qualifications to perform their role?"
                                             ]
                     },
                     {
                         "id":  "2.1.5",
                         "principleId":  "2.1",
                         "title":  "Monitoring, review and improvement",
                         "controlText":  "The security plan should cover the requirement for security performance to be monitored at all levels in the company/organisation from Board level to delivery, ensure that learning and performance processes for security are in place and subject to continued improvement, and provide for regular reviews of nuclear security practices taking into account lessons learned from internal and external reviews, security exercises or incidents, and changes in the threat.\n\nA dutyholder should ensure that any weakness that relates to nuclear security is comprehensively analysed and expeditiously corrected. As appropriate, experience should be shared with other organisations in the civil nuclear sector and with ONR.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Is security performance monitored across all levels of the organisation?",
                                                 "Are there regular reviews of security practices that take into account any lessons learned?"
                                             ]
                     },
                     {
                         "id":  "2.1.6",
                         "principleId":  "2.1",
                         "title":  "Leadership commitment and role modelling",
                         "controlText":  "A dutyholder\u0027s leaders, including Board members (or equivalent) and managers, should demonstrate their commitment to nuclear security through their behaviour, leadership, example and management practices, employing the incentives and disincentives at their disposal to establish appropriate patterns of behaviour. Leaders and managers should ensure people understand that a credible threat exists and that effective and proportionate nuclear security is of vital importance in countering it.\n\nLeaders and managers should serve as positive role models through their attention and adherence to nuclear security practices, and reinforce appropriate behaviour through constructive feedback.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Do leaders, including Board members, demonstrate their commitment to nuclear security through their behaviours (leading by example) and management practices?",
                                                 "Does the organisation employ appropriate incentives and disincentives to establish appropriate patterns of behaviour?",
                                                 "Do leaders and managers ensure that all staff understand that a credible threat exists and that effective and proportionate security is essential in countering it?"
                                             ]
                     },
                     {
                         "id":  "2.1.7",
                         "principleId":  "2.1",
                         "title":  "Inclusive decision making",
                         "controlText":  "Leaders and managers should carefully consider the views of others and establish a formal decision-making mechanism that is well understood and involves all staff. The quality of a decision is improved when the individuals involved are able to contribute their knowledge and ideas and take ownership for addressing a problem or implementing the solution.\n\nDecisions should be made by those who are SQEP and authorised to do so. Leaders should take account of dissenting views and different perspectives and should not shorten or bypass decision-making processes.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Do leaders and managers carefully consider the views of others within a formal decision-making mechanism that is well-understood and involves all staff?"
                                             ]
                     },
                     {
                         "id":  "2.1.8",
                         "principleId":  "2.1",
                         "title":  "Training and development for culture",
                         "controlText":  "At all levels of an organisation, managers should ensure training is conducted to develop skills and provide tools to promote and implement a strong security culture. Managers should ensure that temporary and permanent staff, including contractors and service providers, understand the importance of protecting NM/ORM (including transport), associated facilities and SNI.\n\nTraining and professional development are essential in supporting the expected cultural behaviour and enabling all personnel to understand their part in managing and mitigating security risks.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Do leaders and managers ensure that training is conducted across all levels of the organisation to develop skills and provide tools to promote and implement a strong security culture?"
                                             ]
                     },
                     {
                         "id":  "2.1.9",
                         "principleId":  "2.1",
                         "title":  "Reporting of events and matters",
                         "controlText":  "As part of a good security culture, leaders and managers should encourage personnel to report any event or matter that could affect nuclear security. There should be a well-publicised process in place for reporting, which should be reviewed from time to time to maintain a reporting system that is effective whilst being simple to use.\n\nReporting is a legal requirement in accordance with NISR 2003, Regulations 10, 18 and 22, and also enables dutyholders to monitor trends and address any systemic problems.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Do leaders and managers encourage personnel to report any event or matter that could affect nuclear security?"
                                             ]
                     },
                     {
                         "id":  "2.1.10",
                         "principleId":  "2.1",
                         "title":  "Continual improvement and preventing complacency",
                         "controlText":  "Leaders and managers should seek continual improvement in nuclear security culture and work to prevent complacency from compromising overall security objectives, considering all sources of relevant experience, research, technical developments, operational data and events of security significance, which should be carefully evaluated and used to enhance nuclear security culture.\n\nThis includes ensuring that experience and events that affect security are analysed and corrective actions implemented; conducting self-assessments and independent audits; establishing a programme of exercises to test security systems and human factors; and analysing patterns and trends arising from known deficiencies.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Does the organisation seek continual improvement in nuclear security culture and employ programmes designed to prevent complacency?"
                                             ]
                     },
                     {
                         "id":  "2.1.11",
                         "principleId":  "2.1",
                         "title":  "Engagement and accountability of all personnel",
                         "controlText":  "All personnel should be accountable for their behaviour and properly motivated to assist in ensuring effective nuclear security, adopting a rigorous and prudent approach to their security responsibilities. There should be a culture of compliance with regulations and associated instructions/procedures, with constant vigilance and a proactive questioning attitude, and personnel should understand how their particular roles and relationships contribute to maintaining security.\n\nAll personnel should recognise the importance of protecting SNI, not share site access badges, and avoid divulging any information that has the potential to undermine security. An adequate nuclear security culture also depends upon teamwork and cooperation among all staff, extending beyond the security team itself.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)",
                         "promptQuestions":  [
                                                 "Are all personnel accountable for their behaviour and motivated to assist in ensuring effective nuclear security?",
                                                 "Is there evidence of a culture of compliance with regulations, associated instructions and procedures?",
                                                 "Do personnel understand how their particular role contributes to maintaining security?"
                                             ]
                     },
                     {
                         "id":  "2.1.12",
                         "principleId":  "2.1",
                         "title":  "Assurance and governance of security culture",
                         "controlText":  "The methods used by a company/organisation to develop and maintain a nuclear security culture should be subject to an internal assurance and governance process by Suitably Qualified and Experienced (SQEP) security and operational staff, to ensure that the security culture in place is considered appropriate, effective and proportionate.\n\nThe extent of this process may vary, taking into account site specific considerations. It is important that the Board member (or equivalent) with Board responsibility for security is aware of all aspects of the nuclear security culture and has endorsed the approach used for its development and maintenance.",
                         "controlTextLabel":  "SyDP 2.1 expectation (CNS-TAST-GD-2.1)"
                     },
                     {
                         "id":  "3.1.1",
                         "principleId":  "3.1",
                         "title":  "Systematic identification of security-important tasks",
                         "controlText":  "Dutyholders should systematically identify all tasks important to security and subject these to proportionate analysis to demonstrate that they are achievable, taking into account likely operational conditions and requisite timescales.\n\nThis should apply to all personnel who deliver security functions, not only the security team.",
                         "controlTextLabel":  "SyDP 3.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "3.1.2",
                         "principleId":  "3.1",
                         "title":  "Analysis of task demands on personnel",
                         "controlText":  "The analysis should evaluate the demands these tasks place upon personnel in terms of perception, decision making and action.\n\nIt should provide evidence to underpin the decision to allocate security functions to humans and support a balanced design between human and engineered security measures, avoiding an over-reliance on the human to deliver security functions.",
                         "controlTextLabel":  "SyDP 3.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "3.1.3",
                         "principleId":  "3.1",
                         "title":  "Human capabilities and limitations considered",
                         "controlText":  "Task analysis should demonstrate that tasks are designed taking account of human physical, physiological and psychological capabilities and limitations in order to achieve reliable and effective human performance.",
                         "controlTextLabel":  "SyDP 3.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "3.1.4",
                         "principleId":  "3.1",
                         "title":  "Workload achievable, tested and reviewed",
                         "controlText":  "The workload of personnel required to undertake tasks important to security should be analysed and demonstrated to be achievable.\n\nThe ability of personnel to manage the workload required to maintain security during safety and security events should be demonstrated as part of security exercises and should be included in periodic security reviews.",
                         "controlTextLabel":  "SyDP 3.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "3.2.1",
                         "principleId":  "3.2",
                         "title":  "Staffing arrangements and levels",
                         "controlText":  "The dutyholder\u0027s security plan should include a description, with rationale, of the staffing levels (numbers of personnel) required to carry out roles that have the potential to impact on nuclear security, ensuring an appropriate number of Suitably Qualified and Experienced Persons (SQEPs) are in place under all foreseeable circumstances. Staffing levels can be derived from task and workload analysis or from evidence gathered from operating experience, predecessor or similar facilities, and the analysis should cover government response levels and security event conditions.\n\nStaffing arrangements must recognise that staff numbers should provide sufficient resources to cover time for training and development and to cover for absences such as holidays and sickness, and should account for staff supporting the regime (e.g. workforce trustworthiness and aftercare) and oversight of contract staff. Dutyholders should provide evidence to validate the adequacy of staffing levels, for example through operating experience reviews, security contingency exercises and site emergency exercises.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has the dutyholder carried out task and workload analysis where appropriate to determine the necessary staffing arrangements for nuclear security tasks and roles identified in the security plan?",
                                                 "In cases where staffing levels are based on operating experience, predecessor or similar facilities, has the dutyholder systematically considered and addressed any differences that might impact on the appropriateness of the staffing arrangements?",
                                                 "Do the dutyholder\u0027s staffing arrangements consider periods of normal operation, periods of heightened security threat levels, nuclear safety events, and requirements of the security contingency plan?",
                                                 "How has time for training and personnel development as well as the impact of leave and sickness absence been factored into the determination of staffing levels?",
                                                 "Does evidence from safety and security exercises support claims that staffing arrangements are adequate to respond to challenging and resource intensive scenarios?",
                                                 "Do qualitative and quantitative indicators support claims regarding adequacy of staffing levels?"
                                             ]
                     },
                     {
                         "id":  "3.2.2",
                         "principleId":  "3.2",
                         "title":  "Team design and spans of control",
                         "controlText":  "The dutyholder should demonstrate that they have considered the factors contributing to effective team design, including team size and composition, clarity of roles and responsibilities, communication and supervision, and appropriate spans of control (the number of subordinates that can be effectively managed by a supervisor or manager), as well as the level of competency of the supervisor and team members, culture and task characteristics.\n\nInadequacies in team design have been implicated in major events in the nuclear and other industries. There are advantages and disadvantages to both wide and narrow spans of control, and the dutyholder should establish appropriate spans of control and clearly define roles, responsibilities, accountabilities and interfaces between teams (including contractors and Home Office Police where applicable).",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Does the composition of teams involved in nuclear security related work include the necessary mix of skills, in sufficient numbers to effectively carry out the functions and tasks required of them?",
                                                 "Has the dutyholder established appropriate spans of control?",
                                                 "Have supervisory requirements for security claims on control room and field teams been systematically identified?",
                                                 "Are roles, responsibilities and accountabilities within teams, interfaces between teams, and interfaces between CGF, CNC and Home Office Police clearly defined for different operating conditions where applicable?",
                                                 "Are there effective formal and informal mechanisms in place for communication between teams?"
                                             ]
                     },
                     {
                         "id":  "3.2.3",
                         "principleId":  "3.2",
                         "title":  "Design of shift work systems",
                         "controlText":  "The design of shift systems should be managed as an important part of staffing design that impacts on human performance, adopting good practices for shift design (such as those in HSE guidance) to reduce fatigue. Where dutyholders propose changes to shift patterns or durations, ONR expects this to be managed via a systematic process such as Management of Change, including staff involvement, pilot testing, review of lessons learned and tracking of Key Performance Indicators.\n\nPoorly designed shift systems can increase fatigue, which makes it harder to concentrate, reduces vigilance and situational awareness, impairs decision making and slows reaction time. The dutyholder should have management arrangements to monitor and control hours worked, including overtime, shift swapping and second jobs, and a process for managing resource shortfalls with suitable compensatory measures.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has the dutyholder carried out an assessment of proposed or existing shift schedules using an appropriate tool such as the HSE fatigue/risk index?",
                                                 "Does the proposed or existing shift system adopt the good practices for shift design identified in HSE guidance?",
                                                 "Does the dutyholder have management arrangements in place to monitor and control hours worked including overtime?",
                                                 "Does the dutyholder\u0027s management arrangement for control of hours worked control shift swapping and second jobs?",
                                                 "Does the dutyholder have a process for managing resource shortfalls, does this include identification and implementation of suitable compensatory measures?",
                                                 "Are adequate arrangements in place to plan, control and implement changes to shift schedules?"
                                             ]
                     },
                     {
                         "id":  "3.2.4",
                         "principleId":  "3.2",
                         "title":  "Analysis of workload",
                         "controlText":  "The dutyholder should undertake an assessment of workload for key roles involved in the delivery of security functions, using recognised methods of workload assessment, to demonstrate that tasks allocated to humans are within their capabilities and that an appropriate number of competent staff are available to complete all tasks important to security. Workload analysis should be performed when new tasks, equipment, or team or shift structures are introduced.\n\nExcessive workload can increase the likelihood of human failure and degrade performance, while too little workload can reduce vigilance and situational awareness and increase the likelihood of violation. Workload assessment should show that demand during normal operation is neither too high nor too low and that sufficient capacity is available to cope during periods of increased demand such as security events.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has the dutyholder undertaken an assessment of workload for key roles involved in the delivery of security functions?",
                                                 "Does the dutyholder\u0027s approach for the assessment of workload use recognised methods of workload assessment?",
                                                 "Is the dutyholder\u0027s assessment of workload supported by evidence gained from exercises or reviews of security events?"
                                             ]
                     },
                     {
                         "id":  "3.2.5",
                         "principleId":  "3.2",
                         "title":  "Analysis of roles and competencies",
                         "controlText":  "The dutyholder should carry out job/task and competency analysis to understand the set of competencies required to deliver each role necessary for security, and for each role and associated task(s) determine and document both the competencies needed and the level or standard those competencies must meet. Personnel whose activities have the potential to impact on nuclear security must be SQEP, and any roles requiring appointment of Duly Authorised Persons for Security Purposes (DAPSyPs) should be specified in the security plan with a register kept.\n\nThe set of competencies should include both technical elements and less tangible ones such as decision making, challenge, management and leadership, communication and behavioural skills, and an awareness of the importance of sustaining a strong security culture. Analysis should also consider team and organisational performance and circumstances where an individual may deputise for another.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has a suitable analysis been carried out to identify those roles that may impact on security, including corporate as well as security operations staff?",
                                                 "Is the analysis sufficiently detailed to provide confidence that all security-related roles and responsibilities have been identified?",
                                                 "Does the analysis include consideration of the full range of operating states, including during periods on increased alert or response level and when security events identified in the security plan occur?",
                                                 "Is the analysis current (i.e., has it been maintained to take account of plant, equipment, procedural or organisational changes)?",
                                                 "Have the competencies required to carry out the tasks or activities associated with each role in an efficient and effective manner to the designated standards been formally identified?",
                                                 "Do the identified competencies include managerial, leadership and behavioural factors?",
                                                 "Have any DAPSyP roles been identified and are their associated competencies clearly defined?"
                                             ]
                     },
                     {
                         "id":  "3.2.6",
                         "principleId":  "3.2",
                         "title":  "Learning objectives and training needs",
                         "controlText":  "The dutyholder should use a systematic approach incorporating job, task or competency analysis to identify a set of learning objectives associated with each role necessary for the delivery of nuclear security, distil these into a set of training needs, and define the standards which should be achieved for a person to be considered competent. Where learning objectives are deemed met on the basis of existing qualifications or experience, the dutyholder should record evidence of the basis for this decision.\n\nA training need is identified where analysis or data demonstrates that a required competence is not found in current role holders or is unlikely to be found in new appointees. It is reasonable to conduct a gap analysis and target training effort on those objectives where the person is not demonstrably competent.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has the dutyholder used a systematic approach incorporating job, task or competency analysis to identify a set of learning objectives associated with each role necessary for the delivery of nuclear security?",
                                                 "Have the identified learning objectives been distilled into an outline set of training needs?",
                                                 "Does the set of training needs take account of the required qualifications, skills and experience of the role holder and the need for these to be refreshed?",
                                                 "Have the standards which should be achieved in order for a person to be considered competent been defined?"
                                             ]
                     },
                     {
                         "id":  "3.2.7",
                         "principleId":  "3.2",
                         "title":  "Design of training",
                         "controlText":  "The dutyholder should establish initial and continuation training programmes, designed by a SQEP individual, for all personnel whose duties might impact upon security, including the board, managers and contractors. Programmes should address the totality of competencies needed for each role, identify activities which are security-significant, complex or infrequent that warrant particular attention, and select training media and methods based on how best to achieve the learning objectives.\n\nInitial training should include basic induction covering security hazards, secure working practices and actions in response to security events, as well as job-specific training. Continuation training should maintain competence and reinforce a positive security culture, and training programmes should build in and promote awareness of security culture and its attributes.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Has the dutyholder established an initial training programme for all personnel whose duties might impact upon security, including the board, managers and contractors, as well as other staff?",
                                                 "Does the initial training programme include induction training to ensure a basic understanding of the employee\u0027s responsibilities, secure working practices, generic security-related matters and the threat?",
                                                 "Does the training programme identify activities which are security-significant, complex or infrequent and which warrant particular attention during training?",
                                                 "Does the training programme recognise the need to address leadership, managerial, behavioural, communication and security culture issues as well as individual competence?",
                                                 "Has the dutyholder established a continuation training programme for all personnel whose activities at work might impact upon security?",
                                                 "Are the dutyholder\u0027s chosen training media and training methods based upon a consideration of how best to achieve the learning objectives?"
                                             ]
                     },
                     {
                         "id":  "3.2.8",
                         "principleId":  "3.2",
                         "title":  "Assessment of competence",
                         "controlText":  "The dutyholder should have formally defined provisions for assessing the competencies of all personnel whose activities impact upon security, using assessment methods appropriate to the competency being assessed that can be demonstrated to be valid, objective and reliable. Assessment should not be a one-off activity; the periodicity of re-assessment appropriate for each job or task should be defined, and the dutyholder should act on deficiencies identified.\n\nEach person carrying out activities which may affect security should be demonstrably competent to perform their role. Training records and assessments of competence should be actively used as a management tool when making operational decisions on deployment, not simply to demonstrate compliance with SQEP requirements. Where contractors are not subject to the dutyholder\u0027s own assessments, robust processes should confirm their competence.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have formally defined provisions for assessing the competencies of all personnel whose activities impact upon security?",
                                                 "Has the dutyholder put in place robust processes to confirm its contractors are competent where they are not subject to the dutyholder\u0027s own competence assessments?",
                                                 "Does the choice of assessment method reflect the nature of the competencies which are being assessed, and the training methods and media which are used?",
                                                 "Can the dutyholder demonstrate that their assessment methods provide a valid, objective and reliable basis for determining competence?",
                                                 "Has the dutyholder defined the periodicity of re-assessment which is appropriate for each job or task?",
                                                 "Does the dutyholder act, in a timely manner, upon deficiencies in performance identified through the assessment or during training?",
                                                 "Does the dutyholder have a defined strategy for addressing failures to meet the required standards following training?"
                                             ]
                     },
                     {
                         "id":  "3.2.9",
                         "principleId":  "3.2",
                         "title":  "Evaluation of training effectiveness",
                         "controlText":  "The dutyholder should have in place a formal process to evaluate the effectiveness of training, drawing on a suitable range of sources of information (such as assessments and trainee feedback, self-assessments by the training function, operational experience feedback and internal and external reviews), and should be seen to be closing the loop so that the findings demonstrably influence the specification or implementation of the training arrangements.\n\nTraining is effective only in as much as the learning acquired transfers into the real situation. Dutyholders should have a well-defined system for monitoring the effectiveness of training and for identifying areas where training may need to be augmented or revised, and demonstrate how identified shortfalls have been addressed and how the training system itself has been strengthened.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have in place a formal process to evaluate the effectiveness of training?",
                                                 "Does the evaluation process use a suitable range of sources of information to judge effectiveness?",
                                                 "Is the way in which training is specified, delivered and assessed monitored regularly?",
                                                 "Do the findings of the evaluation process demonstrably influence the specification or implementation of the training arrangements?"
                                             ]
                     },
                     {
                         "id":  "3.2.10",
                         "principleId":  "3.2",
                         "title":  "Organisation and support of the training function",
                         "controlText":  "The training and competence assurance of personnel with nuclear security roles should be regarded as a priority, supported by commitment from senior levels, an appropriate management structure and a training policy. Responsibilities for training should be clearly defined, the function should be adequately resourced with suitably qualified trainers, contractors\u0027 competence should be assured, and accurate training and competence records should be designed, controlled and maintained.\n\nThere should be a clear reporting route so that training issues can be raised at board level if necessary. Placing work with external contractors does not negate the dutyholder\u0027s responsibility for ensuring all personnel are suitably qualified and experienced, and training records should be subject to suitable quality management processes.",
                         "controlTextLabel":  "SyDP 3.2 expectation (CNS-TAST-GD-3.2)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have a training policy which sets out the company\u0027s commitment to training?",
                                                 "Does the dutyholder have a management system for training personnel whose actions may impact upon security?",
                                                 "Is the training function adequately resourced, in terms of staff numbers and capabilities?",
                                                 "Are personnel who conduct training provided with instructional skills and guidance so that they can perform their roles effectively?",
                                                 "If contractors are not subject to the dutyholder\u0027s own training and assessment practices, do the dutyholders ensure that the contractor\u0027s own arrangements for maintaining and demonstrating the competence of its staff are adequate?",
                                                 "Are training records available and up to date, and are they controlled in an appropriate manner?",
                                                 "Are the training records reviewed periodically so as to identify training or competence shortfalls or omissions?"
                                             ]
                     },
                     {
                         "id":  "3.3.1",
                         "principleId":  "3.3",
                         "title":  "Workspace design for security tasks",
                         "controlText":  "Workspaces in which tasks important for security are completed should be designed taking proportionate account of the capabilities, characteristics and numbers of the intended users and the operational requirements relevant to the workspace. The dutyholder should demonstrate that the physical arrangement of workspaces (internal and external) has taken account of, and is compatible with, human perceptual and physical characteristics and limitations, as well as task demands, and provides sufficient space to carry out all tasks important to security under all conditions.\n\nIt is good practice to accommodate the widest possible range of the population, typically spanning the 5th percentile female to the 95th percentile male, often captured in a Target Audience Description. The layout should co-locate equipment and HMIs used together, allow personnel who must work together to be co-located, support effective communication, and account for the most demanding scenarios requiring the largest number of people in the shortest times.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder considered and taken into account the capabilities, characteristics and numbers of the target users who will use the workspaces?",
                                                 "Has the dutyholder declared and justified appropriate ergonomic standards/references for the design/modification and substantiation of its workspaces?",
                                                 "Has the dutyholder incorporated appropriate anthropometric and biomechanical (range of movement) considerations and data into its workplace/space and equipment design, dimensions and layout?",
                                                 "Has the dutyholder ensured that workers are not cramped or obstructed in any way that would cause distraction or discomfort and encourage hurrying of a task leading to increased potential for human error?",
                                                 "Has the dutyholder ensured that the workspace dimensions take account of the full range of tasks that need to be undertaken including maintenance and any requirements for the wearing of protective clothing, carrying of equipment and movement of tooling and components?",
                                                 "Has the dutyholder employed suitable task analysis methods, e.g., link analysis to determine the relative layout of different HMIs and equipment within individual workspaces?",
                                                 "Has the dutyholder conducted a suitable human factors/ergonomics evaluation and testing/trials of the design, development and use of its workplaces/spaces or alternatively can demonstrate suitability and sufficiency of provision using OPEX?"
                                             ]
                     },
                     {
                         "id":  "3.3.2",
                         "principleId":  "3.3",
                         "title":  "Thermal environment (temperature and humidity)",
                         "controlText":  "The dutyholder should demonstrate how environmental conditions in workspaces are controlled, paying particular attention to the thermal environment. In indoor environments temperature and humidity should be controlled by HVAC systems capable of sustaining an adjustable range of comfortable air temperatures and desirable relative humidity, and where security tasks are conducted outdoors appropriate provision should be made to reduce the cognitive and physical stress effects of the thermal conditions.\n\nExcessive heat or cold can reduce concentration, vigilance, problem solving and dexterity and increase task completion times. Where PPE is used to reduce the impact of adverse conditions it must be assured that this does not reduce the reliability with which tasks are completed, acknowledging that PPE may reduce signal detection, dexterity and speed of movement.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Is the dutyholder\u0027s HVAC system capable of sustaining an adjustable range of comfortable air temperatures and desirable relative humidity?",
                                                 "Has the dutyholder used appropriate design standards and guidance to derive the most appropriate thermal environment e.g., within security control rooms to support reliable human performance and provided suitable evidence that these standards have been met?",
                                                 "Has the dutyholder provided as much physical shelter as practicable where operational tasks, maintenance or emergency tasks are required in exposed/outdoor positions?",
                                                 "Has the dutyholder identified the need for and provided appropriate PPE for tasks that need to be completed in outdoor environment?",
                                                 "Has the dutyholder taken into account potential adverse environmental conditions and the impact of PPE when making claims for task feasibility and completion times?"
                                             ]
                     },
                     {
                         "id":  "3.3.3",
                         "principleId":  "3.3",
                         "title":  "Lighting",
                         "controlText":  "The dutyholder should demonstrate adequate lighting provision for all operational tasks, their demands and foreseeable working conditions, including tasks required during emergencies, using appropriate design standards and guidance to derive the lighting levels required to support reliable human performance. The impact of degraded lighting should be considered and alternative sources provided, and factors such as contrast, glare and reflections identified and appropriately considered.\n\nAppropriate lighting is critical for visual work, including monitoring and detecting tasks, and the maintenance of situational awareness. Wide variation in light levels across a room and glare should be avoided, and where lighting sources may be reduced (e.g. during security events) head or equipment mounted sources should be provided.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder demonstrated adequate lighting provision for all operational tasks, their demands and foreseeable working conditions, including any tasks required to be performed during emergencies?",
                                                 "Has the dutyholder considered the impact of degraded lighting on safety and security tasks and provided alternative sources of lighting for such occasions?",
                                                 "Has adequate provision been made for any requirements for equipment identification, reading textual information, detailed inspection tasks and any fine precision work?",
                                                 "Is adequate back-up or portable illumination available for maintenance tasks or during emergencies and is there evidence that this equipment is periodically tested?",
                                                 "Has the impact of factors such as contrast, glare and reflections been identified and appropriately considered in the lighting design?",
                                                 "Where the dutyholder exploits advanced technologies to display information within control rooms, has the legibility and visibility of information displayed by these devices been carefully considered taking into account lighting arrangements?",
                                                 "Where tasks are completed outdoors has the dutyholder provided adequate lighting for night time and adverse weather conditions?"
                                             ]
                     },
                     {
                         "id":  "3.3.4",
                         "principleId":  "3.3",
                         "title":  "Noise",
                         "controlText":  "The dutyholder should ensure that noise levels are controlled so that security critical communications are not disrupted or masked by background noise, that background noise in control rooms does not impair speech comprehension, and that all audible alarms and warnings can be heard or otherwise detected at all working locations and in all foreseeable conditions.\n\nNoise in the workplace can be a source of distraction and discomfort, lead to decrements in human performance and ineffective communication, and cause an individual to modify their style of task performance, increasing human error potential. Where tasks depend on detection of auditory signals, background noise should not be so high as to mask the signals to be detected.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder ensured that the background noise level in control rooms does not impair speech comprehension?",
                                                 "Is the dutyholder able to demonstrate that all audible alarms and warnings can be heard, or otherwise detected, at all working locations and in all foreseeable conditions?",
                                                 "Is the dutyholder able to demonstrate that noise levels are controlled in order that security critical communications are not disrupted or masked by background noise?",
                                                 "Where there is reliance on Public Address (PA) for communication, is its intelligibility regularly checked in all necessary areas?"
                                             ]
                     },
                     {
                         "id":  "3.3.5",
                         "principleId":  "3.3",
                         "title":  "Equipment and user interface design",
                         "controlText":  "The dutyholder should complete a proportionate level of task analysis to inform the design of equipment and user interfaces required to complete tasks important to security, identifying user needs, operational requirements and performance standards (including required speed of action), applying relevant ergonomic standards, involving end users in usability testing, and conducting trials to demonstrate the system can be operated reliably across normal operation, heightened threat levels and security event conditions.\n\nConsistency in the presentation of information and enactment of controls across interfaces reduces the likelihood of human error, particularly where users operate under stress or in short timescales. Where dutyholders rely on Commercial Off the Shelf (COTS) equipment, suppliers should provide assurance that it meets ergonomic standards and relevant good practice, and design should be used as input to procedures and operator training/competence requirements.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder completed a proportionate level of task analysis to inform the design of equipment and user interfaces required to complete tasks important to security?",
                                                 "Has the dutyholder employed relevant ergonomics standards to the design of equipment and user interfaces?",
                                                 "Has the dutyholder provided evidence of end user involvement in the design and usability testing of equipment and user interface important for security?",
                                                 "Has the dutyholder conducted a proportionate HF / ergonomics evaluation and testing / trials of the design, development and use of equipment and user interfaces and has this demonstrated that the HMI is effective in supporting personnel in all operational states?",
                                                 "Is there a clear documented process that demonstrates how the dutyholder has managed and resolved any conflicts and trade-offs associated with equipment and user interfaces e.g. between security constraints and ergonomics best practice?",
                                                 "Has the design and use of equipment and user interfaces been used as input to the development of procedures and operator training needs / competence requirements?",
                                                 "Has the dutyholder applied appropriate and consistent coding, labelling, grouping, navigation and layout principles to the design of all relevant user interface controls, communications equipment and displays?"
                                             ]
                     },
                     {
                         "id":  "3.3.6",
                         "principleId":  "3.3",
                         "title":  "Surveillance, alarms and HMI resilience",
                         "controlText":  "Where dutyholders employ surveillance equipment such as CCTV and alarm systems (e.g. Intruder Detection Systems), they should undertake sufficient analysis to determine factors such as camera placement, the number of images and screens, and alarm set points, and demonstrate these do not overload operators or result in a high rate of false alarms. Alarms should alert operators only to situations where a response is required, and where reliance is placed on HMIs the dutyholder should consider how they might fail and provide back-up or alternative means of supporting the operator\u0027s task.\n\nCamera maps should guide operators to the best camera and support spatial awareness, and labelling should allow operators to identify which camera view they are looking at. Alarms should alert, inform and guide required user action, with control over alarm level settings kept secure to reduce the likelihood a hostile actor can reduce or remove alarm functionality, and dutyholders should have protocols to inform personnel of HMI failure and transfer between HMIs.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder ensured that the design of the equipment and user interfaces provides sufficient and unambiguous information to personnel to maintain situational awareness?",
                                                 "Do the dutyholder\u0027s user interfaces ensure that the presentation of information and placement of controls is appropriate for their purpose, support required response times and minimise the potential for errors?",
                                                 "Where dutyholders employ CCTV systems as part of their security systems, have they undertaken sufficient analysis to determine factors such as the placement of camera, the number of images, number of screens and demonstrated that decisions in relation to these do not overload operators?",
                                                 "Does the dutyholder use alarms to alert operators only to situations where responses are required?",
                                                 "Does the dutyholder\u0027s analysis of the alarm system demonstrate that factors such as the number of alarms and the setting of alarm set points does not overload the operator nor result in a high rate of false alarms?",
                                                 "Has the dutyholder carried out an operational experience review to demonstrate that equipment and user interfaces do not result in human failure during the performance of security tasks and during security exercises?"
                                             ]
                     },
                     {
                         "id":  "3.3.7",
                         "principleId":  "3.3",
                         "title":  "Communication tools",
                         "controlText":  "The dutyholder should justify and demonstrate the adequacy of the communication tools used for different types of communication, providing primary and secondary forms of communication that will work in a range of situations (e.g. during power outages and security events). Communication devices should be tested regularly, designed or procured with attention to consistency of operation and interface, and human performance tools should be employed to reduce the likelihood of communication errors.\n\nCommunication is important to maintain shared situational awareness. Dutyholders should consider the form and content of messages, use standard and scripted messages where communication may be required in high stress situations, demonstrate appropriate use of human performance tools such as pre-job briefs, three-way communication and the phonetic alphabet, and employ recording aids such as logs using consistent, formal vocabulary shared by all users.",
                         "controlTextLabel":  "SyDP 3.3 expectation (CNS-TAST-GD-3.3)",
                         "promptQuestions":  [
                                                 "Has the dutyholder justified and demonstrated the adequacy of the communication tools used for different types of communication, e.g., person to person, person to site, between sites, etc?",
                                                 "Does the dutyholder design and/or procure communications equipment paying attention to issues such as the consistency of the method of operation, design of the interface and the workload associated with communication tasks?",
                                                 "Does the dutyholder employ human performance tools to reduce the likelihood of communication errors and ensure all staff are fully trained in their use?",
                                                 "Does the dutyholder use appropriately designed methods for the recording and communication of information in order to improve shared situational awareness across teams and shifts?"
                                             ]
                     },
                     {
                         "id":  "3.4.1",
                         "principleId":  "3.4",
                         "title":  "Written procedures and use classification",
                         "controlText":  "All activities which may affect nuclear security should be carried out in accordance with written procedures. The dutyholder\u0027s management arrangements for procedures should stipulate how procedures are intended to be used during task completion, for example through a procedure classification system that categorises procedures for level of use (such as continuous use, reference use and information use) based on the importance of the task, its complexity and how often it is performed.\n\nCarrying out activities in accordance with procedures does not necessarily mean a procedure must be in hand and followed step by step for every task. Decisions on how procedures are used must be based on the nature of the task, its security significance, the potential for error, and the experience and training of the user, and should result in a useable set of procedures at the point of work.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Is there a process in place by which procedures are categorised for level of use and does this result in a useable set of procedures at the point of work?",
                                                 "Is the level of use of the procedure clearly identified?"
                                             ]
                     },
                     {
                         "id":  "3.4.2",
                         "principleId":  "3.4",
                         "title":  "Procedure use, adherence and oversight",
                         "controlText":  "Procedures should document the way in which tasks are required to be performed, and the dutyholder should have arrangements in place to demonstrate that procedures are used in the way intended and are adhered to at all times. Managers and supervisors play an important role through appropriate oversight in ensuring procedure use and adherence, and evidence of the effectiveness of this should be collected.\n\nUsers should recognise the importance of adherence to procedures. Evidence of procedure use and adherence forms part of, and provides evidence for, a robust security culture, and may take the form of performance indicators, results of event investigations or other metrics.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Can the dutyholder provide evidence to demonstrate high levels of procedure use and adherence?",
                                                 "Do personnel have the necessary procedures at the work site and are they being used appropriately during task completion?",
                                                 "Do personnel understand the dutyholder\u0027s expectations regarding procedure use and adherence?"
                                             ]
                     },
                     {
                         "id":  "3.4.3",
                         "principleId":  "3.4",
                         "title":  "Production, review, amendment and version control",
                         "controlText":  "The dutyholder\u0027s arrangements should provide a controlled and effective process for the production, maintenance, review, amendment and version control of procedures. The arrangements should detail the process by which users are informed of procedure amendments and ensure that all users understand and comply with the amended requirements, and provide for rapid update in response to identified shortfalls.\n\nIt is important for procedural use and adherence that users perceive procedures to be accurate, and rapid update in response to identified shortfalls is an important component of this. The period for review and update should be clearly identified so operators can confirm a procedure is in date.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have an adequate process for the production, maintenance, review, amendment and version control of procedures?",
                                                 "Is the period for review and update clearly identified in order that operators can confirm a procedure is in date?",
                                                 "Seek evidence from personnel that the procedure amendment process is effective and that changes to procedures are adequately tested and communicated."
                                             ]
                     },
                     {
                         "id":  "3.4.4",
                         "principleId":  "3.4",
                         "title":  "Verification and validation of procedures",
                         "controlText":  "The dutyholder\u0027s process for the production and amendment of procedures should include a process of verification and validation to ensure that procedures are technically accurate, can be used as intended at the point of work, and are fully understood by end users. The arrangements should specify when different forms of verification and validation exercises are required.\n\nIn some cases it may be appropriate that procedures are designed on the basis of a formal task analysis process, and procedures benefit from the involvement of end users during their development. Verification and validation can be undertaken as a tabletop exercise or by conducting a walkthrough at the point of work.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have processes in place to ensure technically correct and useable procedures are produced and an effective process for the amendment of procedures in response to user feedback?",
                                                 "Do personnel understand what to do if they identify an error in the procedure or they do not fully understand its content?"
                                             ]
                     },
                     {
                         "id":  "3.4.5",
                         "principleId":  "3.4",
                         "title":  "Roles, responsibilities and resourcing",
                         "controlText":  "The dutyholder\u0027s organisational arrangements should clearly identify those with roles and responsibilities for the development and maintenance of procedures, and adequate resources should be provided for these roles, including both dedicated resources for procedure production and management (including version control) and more ad hoc resources such as access to personnel from other disciplines who can contribute timely review, validation and verification.\n\nThe organisational arrangements should allow for an effective and efficient process by which procedure users can identify the need for procedure updates. Interfaces between roles involved in procedures, training and the production of security documentation such as the security plan and security risk assessments should be adequately managed.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Are the resources assigned to the production and management of procedures adequate? Consider both the number of personnel assigned to the role and their competence.",
                                                 "Are the interfaces between different roles involved in the production and use of procedures adequately managed?"
                                             ]
                     },
                     {
                         "id":  "3.4.6",
                         "principleId":  "3.4",
                         "title":  "Procedure presentation, format and consistency",
                         "controlText":  "Procedures should be developed according to dutyholder arrangements that specify how procedures should be presented, the level of detail contained within procedures of different types, the structure and language used for the presentation of task steps and how task completion is recorded. Content should be clear and unambiguous, describe how tasks will be carried out with all necessary prerequisites, checks, precautions and actions, and provide information necessary to recover from equipment malfunctions, faults or human failures.\n\nConsistency is important as a means of reducing error and improving human performance, and dutyholders may develop a procedure writer\u0027s guide to ensure consistency in format and presentation. Different formats (flowchart, tabular, check list, etc.) are likely to be required for procedures of different types, such as normal operations, security events and maintenance activities.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Is content clear and unambiguous?",
                                                 "Do procedures clearly describe how tasks will be carried out and contain all necessary prerequisites, checks, precautions, and actions to be taken in the interests of nuclear security?",
                                                 "Are procedures consistent with the directions contained within procedure writers\u0027 guides where these are used?",
                                                 "Do procedures provide information necessary to recover from equipment malfunctions, faults, or human failures during security operations?"
                                             ]
                     },
                     {
                         "id":  "3.4.7",
                         "principleId":  "3.4",
                         "title":  "Learning from experience and support to training",
                         "controlText":  "The dutyholder should demonstrate learning from experience in relation to procedures, for example implementing appropriate improvements following events, feedback from personnel following use during operation, training and drills, and cross-dutyholder comparisons. Training should be conducted using only approved procedures, requiring close cooperation between those with roles and responsibilities for procedures and training.\n\nWhilst the primary role of procedures is to support the conduct of operations, procedures are also an important component in the conduct of training and assurance of competence. Security role holders should demonstrate knowledge of and an ability to conduct tasks consistent with procedural requirements.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Do security/operations/maintenance personnel understand the conditions for use and the meaning of the procedure, and whether they consider it provides a clear and adequate understanding of their task?"
                                             ]
                     },
                     {
                         "id":  "3.4.8",
                         "principleId":  "3.4",
                         "title":  "Substantiation of administrative controls",
                         "controlText":  "Where the achievement of security functions is dependent on human based processes identified as administrative controls, claims made on such controls should be substantiated in the dutyholder\u0027s security plan or supporting documentation. Appropriate methods for substantiation include Task Analysis, Allocation of Function, Human Failure Analysis and Assessment of Performance Influencing Factors, demonstrating that the tasks are feasible, that the potential for human failure has been reduced, and that human performance is supported by the design of workspaces, equipment and procedures.\n\nAdministrative controls are a subset of tasks important to nuclear security, being those human based processes that provide the delivery of security functions, and are the people and procedural components of the protective security arrangements. Examples include controlling access by confirming identity, controlling and monitoring the movement of NM/ORM, escorting, and the use of patrols and monitoring where CCTV may be unavailable.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)",
                         "promptQuestions":  [
                                                 "Has the potential for error and violation and malicious acts during implementation of the administrative controls been identified and guarded against?",
                                                 "Does the design of working environments, equipment and interfaces support completion of the administrative control?",
                                                 "Are administrative controls adequately covered by the dutyholder\u0027s training and competency assurance arrangements?",
                                                 "Are the requirements of administrative controls adequately presented to personnel in written procedures?",
                                                 "Has the effective completion of administrative controls been demonstrated by processes of validation, exercise or operational experience review?"
                                             ]
                     },
                     {
                         "id":  "3.4.9",
                         "principleId":  "3.4",
                         "title":  "Administrative controls during system outages",
                         "controlText":  "Administrative controls with an impact on nuclear security can extend beyond those directly identified for the delivery of security functions, including temporary security plans or arrangements required to maintain legal compliance during planned or unplanned engineered security system outages. Where such administrative controls are used, dutyholders should demonstrate the robustness and reliability of the control.\n\nThese controls provide continuity of security function and legal compliance during periods when engineered systems are unavailable, and their robustness and reliability must be substantiated.",
                         "controlTextLabel":  "SyDP 3.4 expectation (CNS-TAST-GD-3.4)"
                     },
                     {
                         "id":  "4.1.1",
                         "principleId":  "4.1",
                         "title":  "Intelligent customer capability maintained",
                         "controlText":  "Dutyholders should maintain an \u0027intelligent customer\u0027 capability for all work carried out on their behalf by suppliers that may impact upon nuclear security.\n\nThe intelligent customer capability enables the dutyholder to specify work, supervise its delivery and judge the adequacy of what is supplied.",
                         "controlTextLabel":  "SyDP 4.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "4.1.2",
                         "principleId":  "4.1",
                         "title":  "Retained responsibility and oversight of contracted work",
                         "controlText":  "In addition to maintaining an \u0027intelligent customer\u0027 approach, dutyholders should retain overall responsibility for, and oversight of, all work carried out on their behalf by contractors.",
                         "controlTextLabel":  "SyDP 4.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "4.1.3",
                         "principleId":  "4.1",
                         "title":  "Recognise security-impacting work and procure it properly",
                         "controlText":  "Dutyholders should develop and maintain the capability to recognise work that may impact on nuclear security so that it is subject to the appropriate procurement procedures, underpinned by an effective commercial and/or supply chain strategy capable of delivering security plan requirements.\n\nThe supply chain strategy, policy and arrangements should be appropriately resourced and subject to routine review to ensure they remain effective and proportionate to the identified risks.",
                         "controlTextLabel":  "SyDP 4.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "4.1.4",
                         "principleId":  "4.1",
                         "title":  "Adequate specifications for procured items or services",
                         "controlText":  "When procuring items or services that may impact on nuclear security, dutyholders should develop and issue specifications that adequately describe the items or services, meet the security plan requirements and identify the required level of quality assurance.\n\nFor example, the CPNI \u0027Guide to Producing Operational Requirements for Security Measures\u0027 can be used to structure such specifications.",
                         "controlTextLabel":  "SyDP 4.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "4.2.1",
                         "principleId":  "4.2",
                         "title":  "Confirm supplier capability before contract",
                         "controlText":  "For work that may impact on nuclear security, the dutyholder (or purchaser on their behalf) should evaluate and confirm that suppliers have the organisational and technical capability, capacity and culture to deliver items or services to specification, prior to placing any contract for items or services identified as being of nuclear security significance.\n\nThis expectation is in addition to the normal personnel security screening necessary for any contractor to gain access to a site or operation, which aims to counter the insider threat. The dutyholder describes in the security plan how it seeks assurance of supplier capability to support effective nuclear supply chain management arrangements.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)"
                     },
                     {
                         "id":  "4.2.2",
                         "principleId":  "4.2",
                         "title":  "Weighted supplier selection criteria",
                         "controlText":  "Suppliers should be selected by the purchaser after evaluation against pre-defined criteria appropriate to the contract, appropriately weighted to evaluate the supplier\u0027s ability to meet the required security performance (for example, protection of SNI) of the contract.\n\nThe criteria will test the supplier\u0027s ability to meet the specified intent and should include information from the supplier that provides objective evidence of their capability and capacity to deliver the required item or service.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Is the purchaser\u0027s process for evaluating suppliers of security significant items and services appropriately weighted to consider the quality and security requirements as a key part of the contract selection and award criteria?"
                                             ]
                     },
                     {
                         "id":  "4.2.3",
                         "principleId":  "4.2",
                         "title":  "Organisational and technical capability to deliver",
                         "controlText":  "Purchasers are expected to ensure the supply chain has the organisational and technical capability to deliver items or services in line with their requirements, with documented management system arrangements appropriate to the items or services being supplied that meet the requirements of any relevant national or international management system standard for quality, environment and security management.\n\nSuppliers\u0027 organisational arrangements should include documented management system arrangements which are implemented and able to meet relevant management system standards. The supplier should also have the capacity to provide an enduring source of high-risk items or services throughout the contract period.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Does the supplier have the capacity to provide an enduring source of high-risk items or services throughout the contract period?"
                                             ]
                     },
                     {
                         "id":  "4.2.4",
                         "principleId":  "4.2",
                         "title":  "Evaluate supplier nuclear security culture",
                         "controlText":  "An evaluation of a potential supplier should include the potential supplier\u0027s nuclear security culture, ensuring that the organisation and its leaders understand, or have the potential to understand, the importance of nuclear security and the contribution of any high-risk item or service they may supply in supporting the dutyholder or purchaser\u0027s security plan and the described outcomes.\n\nThe purchasing organisation should promulgate the required nuclear security culture with key suppliers, and suppliers should understand the role of their products in achieving the outcomes described in the dutyholder\u0027s security plan and be well-coordinated with the purchasers\u0027 staff.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Has the purchasing organisation promulgated the required nuclear security culture with key suppliers?",
                                                 "Do suppliers of security significant items or services understand the role of their products in achieving outcomes described in the dutyholder\u0027s security plan and are well-coordinated with the purchasers\u0027 staff?"
                                             ]
                     },
                     {
                         "id":  "4.2.5",
                         "principleId":  "4.2",
                         "title":  "Oversight and certification through the supply chain",
                         "controlText":  "As part of the supplier selection process, the purchaser should confirm suppliers have adequate oversight and assurance arrangements for their own suppliers, and the purchaser and suppliers should hold certification in accordance with recognised management system requirements, issued by the UK Accreditation Service (UKAS), or international equivalent, to ensure appropriate quality management arrangements are in place and applied throughout the supply chain.\n\nThis approach should not preclude purchasers from directly evaluating any level of the supply chain or carrying out oversight and assurance when work is in progress. All contracts should detail this right of access by the purchaser.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)"
                     },
                     {
                         "id":  "4.2.6",
                         "principleId":  "4.2",
                         "title":  "Competent SQEP personnel for key functions",
                         "controlText":  "Purchasers should assure themselves that suppliers have competent personnel, particularly those carrying out key functions such as contract review, fabrication and inspection, with a responsible person within the supplier organisation assessing each person involved for their SQEP against the post profiles and recording acceptance and/or limitations.\n\nThe judgement on competency should be based on qualifications, training and experience using the supplier organisation\u0027s own criteria and any applicable design code requirements for selection, employment and training of employees. Suppliers should currently have, and be able to maintain, sufficient SQEP personnel throughout the contract period, and their performance should be monitored.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Do suppliers of security significant items and services currently have, and can maintain, sufficient SQEP personnel throughout the contract period?",
                                                 "Does the purchasing organisation and/or its suppliers monitor the performance of key individuals who are responsible for providing security significant high-risk items or services?"
                                             ]
                     },
                     {
                         "id":  "4.2.7",
                         "principleId":  "4.2",
                         "title":  "Proportionate quality management arrangements",
                         "controlText":  "The purchaser should ensure that suppliers have quality management arrangements appropriate and consistent with the security significance of the procured items or services, with supply organisations having management system arrangements that are implemented, able to meet relevant national or international quality, environment and security management system requirements, and certified by UKAS or an equivalent international organisation.\n\nThe purchaser\u0027s management system arrangements should ensure that effective SCM, procurement, oversight and assurance arrangements are applied and are proportionate to the nuclear security significance of the items or services being procured, including comprehensive measures for the generation and control of quality plans and records.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Are the supplier\u0027s management system arrangements appropriate to the risks of the items of services being supplied?"
                                             ]
                     },
                     {
                         "id":  "4.2.8",
                         "principleId":  "4.2",
                         "title":  "Quality plans agreed and used",
                         "controlText":  "The purchaser should make clear in the contract the extent to which quality plans will be utilised, and quality plans developed by the supplier should be agreed with the purchaser prior to their use to ensure that items are fabricated, manufactured, erected, tested and inspected in a planned and controlled manner and that the required levels of integrity are achieved and can be demonstrated.\n\nQuality plans should include the full sequence of steps to deliver the item or service and details of hold point release, and allow the purchaser, supplier, third party inspection personnel and in some instances ONR to insert inspection, witness, review or hold points into the manufacturing sequence. Proposed changes to quality plans should be formally controlled and agreed by all inspecting parties.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Are Quality Plans comprehensive and inclusive of the full sequence of steps required to deliver the item or service, including references to assurance activities and applicable codes and standards?",
                                                 "Do Quality Plans identify inspection/witness/review and hold points for all the required inspection parties?",
                                                 "Are Quality Plans being adhered to and are they fully signed off after each step has been completed?"
                                             ]
                     },
                     {
                         "id":  "4.2.9",
                         "principleId":  "4.2",
                         "title":  "Identification and retention of records",
                         "controlText":  "The purchaser should identify all the records required to be delivered during or on completion of the contract, with the identification, generation, timely completion, handover and retention of records associated with the supply of items or services forming part of the contractual arrangements between purchaser and supplier at all levels of the supply chain.\n\nRecords form part of the demonstration that structures, systems and components meet the design intent and nuclear security requirements and ultimately support the security plan. Particular attention should be given to material traceability and inspection, test and surveillance activities, and the purchaser should develop the lifetime record package tracking process.",
                         "controlTextLabel":  "SyDP 4.2 expectation (CNS-TAST-GD-4.2)",
                         "promptQuestions":  [
                                                 "Has the Purchaser put adequate contractual arrangements in place to ensure that relevant records are identified and provided by the supply chain in the correct form and to the required timescale?"
                                             ]
                     },
                     {
                         "id":  "4.3.1",
                         "principleId":  "4.3",
                         "title":  "Effective commercial and supply chain strategy",
                         "controlText":  "The dutyholder (or purchaser on their behalf) should establish an effective commercial and/or supply chain strategy, deployed through the organisation\u0027s business planning process, to enable effective delivery of items and/or services and ensure delivery of an effective security solution with appropriate oversight and assurance.\n\nThe purchaser\u0027s commercial and/or supply chain strategy will influence all arrangements associated with the procurement of security items or services. Oversight arrangements should include measures to review contracts, how relationships are managed and performance analysis of vendors.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Do the dutyholder\u0027s oversight and assurance processes allow them control of their supply chain management and procurement process arrangements for security significant items, from specification of requirement and sourcing a supplier including contract award, through to manufacture of item, construction of facility or provision of item or service?"
                                             ]
                     },
                     {
                         "id":  "4.3.2",
                         "principleId":  "4.3",
                         "title":  "Oversight of supplier performance and quality",
                         "controlText":  "The dutyholder should establish effective arrangements for the oversight of supplier performance throughout the contract period and their quality assurance to ensure that items or services will meet the specified intent, including the inspection, test, release, acceptance and storage of security significant items and services.\n\nThe dutyholder should conduct effective oversight and assurance of the supply chain, including the acceptance of items or services for work with security significance, and should ensure it has sufficient capability to oversee and assure performance throughout the tiers of the supply chain.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)"
                     },
                     {
                         "id":  "4.3.3",
                         "principleId":  "4.3",
                         "title":  "Retain sufficient Intelligent Customer capability",
                         "controlText":  "Dutyholders should develop and retain sufficient Intelligent Customer (IC) capability to specify, conduct oversight and assurance, monitor manufacturing, fabrication and testing, and acceptance for technical adequacy of the items or services being purchased.\n\nThe dutyholder should have sufficient capability to oversee and assess performance throughout the supply chain. These quality assurance arrangements for the supply chain may be delivered by the principal contractor employed by the dutyholder.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder have sufficient capability to oversee and assess performance throughout the supply chain, and confirm that the level of oversight and assurance deployed by the supplier post contract award is commensurate with the risk of the item or service failing to meet the specified intent?"
                                             ]
                     },
                     {
                         "id":  "4.3.4",
                         "principleId":  "4.3",
                         "title":  "Review supplier security culture post-award",
                         "controlText":  "The dutyholder\u0027s oversight and assurance arrangements should review the supplier\u0027s security culture and procedures, during and post contract award, to ensure the supply chain organisations and their leaders continue to understand and promote the importance of nuclear security and the contribution of any security significant equipment or service they supply, to achieving the requirements of the dutyholder.\n\nThe dutyholder should confirm that its expectations are understood, communicated throughout the supply chain and routinely reviewed so that suppliers have appropriate understanding of the security application and importance of their high consequence items or services.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder confirm through its oversight and assurance processes that its expectations are understood, communicated throughout the supply chain and routinely reviewed to ensure that suppliers have appropriate understanding of the security application and importance of their high consequence items or services?"
                                             ]
                     },
                     {
                         "id":  "4.3.5",
                         "principleId":  "4.3",
                         "title":  "Level of oversight commensurate with impact and performance",
                         "controlText":  "The level of oversight deployed by the dutyholder should be commensurate with the impact of the item or service if it fails to meet the specified intent and be guided by the performance of the supplier or supply chain, increasing engagement, oversight and assurance controls where performance is below expectation until performance meets expectations or the contract is completed or terminated.\n\nThe dutyholder\u0027s approach should be influenced by the type of contract, the performance of the supplier and their suppliers, and the implications to security of poor performance. Where a supplier demonstrates routine delivery right first time, every time, the dutyholder may consider changing the method and extent of oversight (for example from release inspection at the manufacturer\u0027s works to receipt inspection at the purchaser\u0027s facility). Approaches include contract review, supplier relationship management, vendor analysis and review of the supplier\u0027s quality assurance arrangements.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)"
                     },
                     {
                         "id":  "4.3.6",
                         "principleId":  "4.3",
                         "title":  "Performance data and remedial measures",
                         "controlText":  "The dutyholder\u0027s supply chain oversight arrangements should generate quantitative and qualitative performance data to demonstrate that suppliers of security significant items or services will meet specified target levels, and the dutyholder should instigate remedial measures as appropriate, which may include withdrawal of a contract, to address sub-standard performance that may adversely affect nuclear security.\n\nVendor analysis may be utilised to target and demonstrate improvements, rank and rate suppliers and maintain a dutyholder\u0027s preferred suppliers listing.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder utilise qualitative and quantitative data to demonstrate supplier performance during contract execution and instigate remedial measures where appropriate?"
                                             ]
                     },
                     {
                         "id":  "4.3.7",
                         "principleId":  "4.3",
                         "title":  "Proportionate assurance and acceptance processes",
                         "controlText":  "The dutyholder should have suitable assurance and acceptance processes for items or services being supplied or undertaken by others on its behalf, with the level of assurance, inspection and test deployed upon item or service completion commensurate with the security significance of the item or service being supplied.\n\nAcceptance of items or services may include verification or independent assessment using second or independent third-party organisations, planned and executed in part through the application of quality plans, providing essential levels of assurance additional to the supplier\u0027s own quality arrangements. In deciding levels of assurance the dutyholder should also consider the level normally applied for the intended use, the code/standard requirements, and the difficulty of inspection and testing post-manufacture or installation.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Is the dutyholder carrying out adequate and appropriate assurance and acceptance of items or services being supplied or undertaken by others on its behalf?",
                                                 "Are any Inspection Agencies used competent to provide third party assurance and verification of items or services significant to security?"
                                             ]
                     },
                     {
                         "id":  "4.3.8",
                         "principleId":  "4.3",
                         "title":  "Review of quality activities, hold points and TQs",
                         "controlText":  "The dutyholder\u0027s assurance processes should undertake regular reviews of the supplier\u0027s quality activities, including the release of hold points with the level of evidence to support hold point release defined and tested, and reviews of Technical Queries (TQs) with a specific focus on the aggregation of multiple TQs or those considered security significant.\n\nIt is important that ONR has access to all parties carrying out quality related activities, if requested, including lower-tier suppliers, with access normally arranged through the dutyholder.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Do the dutyholder\u0027s assurance processes undertake regular reviews of the supplier\u0027s quality activities including the release of hold points, with the level of evidence to support hold point release defined and tested?",
                                                 "Do the dutyholder\u0027s assurance processes undertake regular reviews of supplier\u0027s quality activities for Technical Queries (TQs), with a specific focus on the aggregation of multiple TQs or those considered security significant?"
                                             ]
                     },
                     {
                         "id":  "4.3.9",
                         "principleId":  "4.3",
                         "title":  "Guard against counterfeit items and back doors",
                         "controlText":  "Assurance activities should include a focus on the application of processes to prevent Counterfeit, Fraudulent or Suspect Items (CFSIs) from entering the supply chain, and dutyholders should give specific consideration to mitigating the introduction of back doors or latent defects to Operational Technology or Information Technology (OT/IT), and seek assurance from suppliers that such measures are in place and effective.\n\nParties may wish to substitute CFSIs for genuine items for commercial gain, incorporate a back door to OT/IT to allow subsequent ease of access following installation, or introduce latent defects (for example by installing malware) for subsequent exploitation. Dutyholders and their supply chain should recognise these issues and have appropriate arrangements to mitigate them.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder seek assurance from suppliers that the measures introduced to prevent CSFI from entering supply chain are in place and effective?"
                                             ]
                     },
                     {
                         "id":  "4.3.10",
                         "principleId":  "4.3",
                         "title":  "Secure transport, receipt and storage of items",
                         "controlText":  "The dutyholder\u0027s assurance activities should examine the effectiveness of arrangements for the transport, receipt and storage of items or assembly sub-components within the dutyholder\u0027s facilities prior to delivery from the supplier, with storage arrangements sufficient to maintain item traceability and prevent damage, loss, deterioration, tampering or inadvertent use.\n\nAssurance activities should ensure appropriate arrangements are in place for all contracts involving security classified information or equipment, including that considered SNI in accordance with FSyP7 and its associated delivery principles.",
                         "controlTextLabel":  "SyDP 4.3 expectation (CNS-TAST-GD-4.3)"
                     },
                     {
                         "id":  "4.4.1",
                         "principleId":  "4.4",
                         "title":  "Proportionate commissioning plans",
                         "controlText":  "Dutyholders should implement proportionate commissioning plans which include clear definition of roles and responsibilities, performance indicators, availability of resources and clearly defined decision points (to be met prior to moving to the next phase), as appropriate, with the scale of the commissioning activity proportionate to the level of complexity and degree of impact that the project will have on the site or facility\u0027s ability to meet its security outcome.\n\nCommissioning is the activity of setting to work systems and associated infrastructure, including assuring all systems and components are designed, installed, tested, operated and maintained according to the Operational Requirements (ORs) of the owner, and may be applied to new projects and existing systems subject to modifications or significant maintenance.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Are there appropriate plans and procedures in place to support the commissioning process and the introduction of any new or amended processes or procedures?"
                                             ]
                     },
                     {
                         "id":  "4.4.2",
                         "principleId":  "4.4",
                         "title":  "Risk assessment where part of existing infrastructure",
                         "controlText":  "Where the plant and systems form part of an existing infrastructure, a risk assessment should be undertaken to review the potential impact on security caused by the commissioning of the new (or refurbished) equipment, and planned mitigation of any associated risks should be evidenced.\n\nThis TAG should also be used to consider circumstances when security equipment is being removed at a dutyholder\u0027s site, when the site is being progressively decommissioned.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)"
                     },
                     {
                         "id":  "4.4.3",
                         "principleId":  "4.4",
                         "title":  "Early and appropriate stakeholder engagement",
                         "controlText":  "The commissioning process should be underpinned by appropriate levels of internal and external stakeholder engagement and adequate ORs or equivalent, with early engagement with dutyholders essential to fully understand proposals, assess the quality and completeness of activities and measure the compliance of plant and systems with the Physical Protection System (PPS) outcome and postures.\n\nThis engagement should have been on-going throughout the development of the project, and all appropriate stakeholders should be involved during the actual commissioning process. The commissioning activity is the first opportunity to confirm the performance of the installation and its contribution to meeting relevant security objectives.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Is the commissioning process underpinned by appropriate levels of internal and external stakeholder engagement and adequate ORs or equivalent?",
                                                 "Are all appropriate stakeholders involved during the actual commissioning process?"
                                             ]
                     },
                     {
                         "id":  "4.4.4",
                         "principleId":  "4.4",
                         "title":  "Cold and hot commissioning demonstrate performance",
                         "controlText":  "Commissioning should provide evidence and demonstrate that all aspects of the wider infrastructure operate as planned in both normal and fault conditions to confirm operational resilience, with cold commissioning demonstrating completeness of the plant and systems and hot commissioning demonstrating and confirming the actual performance of individual components against their specified performance and their integration into the overall infrastructure.\n\nCold commissioning confirms all components are installed, connections made and plant labelled, with appropriate snagging expedited or completed. Hot commissioning energises the plant and systems, proving the effectiveness of the installation and whether it meets the intent and achieves the success criteria described in the ORs or equivalent. The final combination of systems, including human response elements, should prove the effectiveness of the installation.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Does the new equipment enable the dutyholder to achieve the required PPS outcome?",
                                                 "Does the commissioned equipment meet defined performance requirements and if not, what is the response of the dutyholder?",
                                                 "Is commissioned equipment appropriately reliable and resilient?"
                                             ]
                     },
                     {
                         "id":  "4.4.5",
                         "principleId":  "4.4",
                         "title":  "Comprehensive commissioning records and handover package",
                         "controlText":  "Comprehensive records should be kept of the hot commissioning phase, capturing the settings for plant components to deliver the system performance, together with a package of information that includes a set of as built drawings, operating, test and maintenance procedures and requirements, a recommended spares holding and other pertinent information.\n\nThe base settings are important in confirming equipment remains fit for purpose, enabling straightforward fault finding and system re-commissioning later in its life, and may need to correlate with the as tested settings in the case of National Protective Security Authority (NPSA) approved security equipment. The inspector should seek evidence that the original ORs, or equivalent, are met throughout the different phases of commissioning, with evidence of any changes and associated justifications available.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)"
                     },
                     {
                         "id":  "4.4.6",
                         "principleId":  "4.4",
                         "title":  "Update and re-approval of the security plan",
                         "controlText":  "The introduction of new or revised security equipment and systems represents a change to the approved security plan, and the dutyholder should prepare the appropriate submission to seek approval for modifying the security plan (and the Security Improvement Schedule) to reflect the changes, and subject the introduction of new plant and systems to extant local facility modification procedures prior to hot commissioning.\n\nIt would be expected that these changes are, as necessary, captured in any Security Improvement Schedule (SIS), itself a part of the approved security plan. Extant local facility modification procedures ensure the impact of new equipment on both existing safety and security systems is understood and approved, and the inspector should seek evidence of this being done prior to hot commissioning.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Where necessary, has security equipment being commissioned been incorporated within extant security plans, and has re-approval of the plan been sought?"
                                             ]
                     },
                     {
                         "id":  "4.4.7",
                         "principleId":  "4.4",
                         "title":  "SQEP personnel to manage and operate equipment",
                         "controlText":  "The dutyholder should identify Suitably Qualified and Experienced (SQEP) human resource to manage and operate the new equipment necessary to deliver the capability, and seek evidence that all these aspects are being, or have been, addressed in the commissioning programme.\n\nPlant and equipment are material parts of the security infrastructure, but personnel and associated processes are similarly important.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Is the commissioning process supported by adequate numbers of SQEP personnel (managers, operators and maintainers)?"
                                             ]
                     },
                     {
                         "id":  "4.4.8",
                         "principleId":  "4.4",
                         "title":  "EIMT regime and long-term maintenance funding",
                         "controlText":  "The dutyholder should be able to demonstrate that an Examination, Inspection, Maintenance and Testing (EIMT) strategy has been developed and is in place, underpinned by appropriate spares holdings and operating and maintenance manuals, with appropriate funding identified to support the long-term operation and maintenance of the equipment or plant being commissioned.\n\nThe long-term reliability of systems must be underpinned by an appropriate EIMT regime and spares holdings, which may include provision of in-house resources or contracted services. Often the manufacturer will provide a recommended spares holding to support system reliability.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Have whole life maintenance and training requirements been adequately considered during the commissioning process?"
                                             ]
                     },
                     {
                         "id":  "4.4.9",
                         "principleId":  "4.4",
                         "title":  "Training and readiness review of operational staff",
                         "controlText":  "Where appropriate, the training of staff linked to delivery of security outputs associated with the plant, equipment and systems being commissioned should be demonstrated, with the cold commissioning phase used as a readiness review of the adequacy of training, availability of operating procedures and proposed integration of the plant and systems into the existing security infrastructure.\n\nThe inspector should expect a positive decision point within the dutyholder\u0027s plan that approves a move to the next phase of commissioning and written justification of such a decision.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)"
                     },
                     {
                         "id":  "4.4.10",
                         "principleId":  "4.4",
                         "title":  "Contingency plans for commissioning failures",
                         "controlText":  "There should be contingency plans in place if security equipment is not commissioned on schedule or fails to achieve the specified level of performance.\n\nCommissioning plant represents the penultimate step towards operation, and the effectiveness of security equipment to meet PPS postures and outcomes requires the integration of a wider range of assets, which may include uninterruptable and possibly alternative power supplies such as diesel generators, to secure reliable performance.",
                         "controlTextLabel":  "SyDP 4.4 expectation (CNS-TAST-GD-4.4)",
                         "promptQuestions":  [
                                                 "Are there contingency plans if security equipment is not commissioned on schedule or fails to achieve the specified level of performance?"
                                             ]
                     },
                     {
                         "id":  "5.1.1",
                         "principleId":  "5.1",
                         "title":  "Reliability demonstrated proportionate to risk",
                         "controlText":  "The reliability of plant and systems to provide the security effect should be demonstrated by the dutyholder to be consistent with the risks associated with the loss of this capability, informed by the Category of the security function and the Classification of the Security Structure, System or Component (SySSC) concerned.\n\nIt is particularly important to ensure, so far as possible, that the security system is capable of performing its function with an adequate level of reliability. This objective may be achieved by the adoption of a number of different provisions, together with the use of techniques to demonstrate the adequacy of the specified measures. Security plans should clearly identify the security function of all SySSCs so that this assessment can be carried out.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Has reliability, resilience and sustainability been considered throughout the design stage for any new facility or SySSC and incorporated within relevant operational requirements or equivalent?",
                                                 "Are requirements for SySSCs regularly reassessed in conjunction with all stakeholders?"
                                             ]
                     },
                     {
                         "id":  "5.1.2",
                         "principleId":  "5.1",
                         "title":  "Design delivers redundancy, diversity and segregation",
                         "controlText":  "There is a regulatory expectation that dutyholders demonstrate in the security plan how they ensure that the design and operation of the security system delivers appropriate levels of redundancy, diversity and segregation.\n\nThe security system design should incorporate an appropriate level of redundancy to reduce the effects of random failure, and diversity and segregation to reduce the effects of common cause failure and malicious actions. This should take account of the site or facility the system is protecting and its vulnerability to threats described in the Design Basis Threat (DBT).",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Does the design and operation of the SySSC display appropriate levels of redundancy, diversity and segregation?"
                                             ]
                     },
                     {
                         "id":  "5.1.3",
                         "principleId":  "5.1",
                         "title":  "Sufficient resources and contingency for continuity",
                         "controlText":  "Dutyholders should provide sufficient resources (including personnel) to inform the design, to maintain/repair and to operate SySSCs, thus building resilience to enable an appropriate and effective incident response, and a recovery programme that reflects the risk of any loss of service.\n\nResilience should enable an appropriate and effective incident response and a recovery programme that reflects the risk of any loss of service. The response to the failure or loss of part or all of a SySSC should be demonstrably maintained and rehearsed.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Is the response to the failure or loss of part of or all of a SySSC regularly exercised or rehearsed?"
                                             ]
                     },
                     {
                         "id":  "5.1.4",
                         "principleId":  "5.1",
                         "title":  "Redundancy in security provisions",
                         "controlText":  "The design should display adequate levels of system redundancy to ensure it is fit for purpose and can perform the required security function, providing more than the minimum number of equipment items, components or elements required to perform a specific security function.\n\nRedundancy allows a specified security function to be delivered when one or more items (but not all) are unavailable, due to a variety of unspecified potential failure mechanisms or maintenance. There are deterministic and probabilistic arguments to justify the provision of redundancy in SySSCs. Reliability does not necessarily increase indefinitely in proportion to levels of redundancy, primarily due to common origin or common cause effects.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)"
                     },
                     {
                         "id":  "5.1.5",
                         "principleId":  "5.1",
                         "title":  "Protection against dependent and common cause failure",
                         "controlText":  "The dutyholder should identify and, where necessary and practicable, implement measures in design, construction and operation to eliminate dependent failures or reduce their potential effect, so that the risk from dependent failures is reduced to a level acceptable within the limits set by design requirements.\n\nDependent failures, in particular common-cause failures (CCF) and common mode failures (CMF), have the potential to prevent the performance of a required security function through simultaneous loss of redundancy provisions. Dependencies may be functional, spatial, inherent or human error related. Measures include segregation to eliminate spatial and functional dependencies, provision of alternative and independent equipment, and procedures to minimise failure dependencies arising during design, manufacture, construction and operation.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Have potential dependencies and/or vulnerabilities of the SySSC been identified and mitigated?"
                                             ]
                     },
                     {
                         "id":  "5.1.6",
                         "principleId":  "5.1",
                         "title":  "Diversity in security provisions",
                         "controlText":  "A dutyholder should consider appropriate measures to include diversity within the components of the system designed to deliver an individual effect and/or across SySSCs in their entirety, providing dissimilar means of achieving the same objective.\n\nWhere a component of the security system is at potential risk from common cause failures, one means of reducing the susceptibility is to employ diverse provisions in separate redundant trains or systems. Diversity particularly provides protection against inherent dependencies and human error related dependencies. The physical co-location or functional support of diverse systems could lead to dependencies that defeat the objective of providing diversity and should be addressed through layout and functional design.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)"
                     },
                     {
                         "id":  "5.1.7",
                         "principleId":  "5.1",
                         "title":  "Segregation of security equipment",
                         "controlText":  "Appropriate levels of segregation should be present in a dutyholder\u0027s provisions in order to maximise the likelihood that a security function will be performed, despite the occurrence of faults and hazards, possibly in combination.\n\nSegregation is the separation of redundant and/or diverse components by distance or by barriers in order to prevent all (or sufficient to enable system failure) of the components being damaged, particularly in the event of common hazards or malicious action. A system\u0027s design should ensure that internal hazards, such as fire, and certain external threats do not damage separate chains of security equipment to the extent that its functional reliability is unacceptably reduced.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)"
                     },
                     {
                         "id":  "5.1.8",
                         "principleId":  "5.1",
                         "title":  "System independence and isolation",
                         "controlText":  "Measures should be employed by the dutyholder to ensure that, wherever possible, SySSCs are not adversely affected by the spurious operation or failure of other systems, especially through any potential for hidden dependency.\n\nSySSC may be subject to spurious operation in addition to operational failures where a system component does not possess a sufficient level of independence from other separate systems (for example, by having a single system responsible for fire and security response). This is best achieved by designing in both functional and physical isolation.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)"
                     },
                     {
                         "id":  "5.1.9",
                         "principleId":  "5.1",
                         "title":  "SQEP personnel to support security systems",
                         "controlText":  "The dutyholder\u0027s security organisation should possess adequate Suitably Qualified and Experienced (SQEP) personnel to support SySSCs, including sufficient personnel with the necessary competences and knowledge to manage, operate, maintain and repair security systems at all times.\n\nSufficient SQEP and other resources are required to manage, operate, maintain and repair the SySSC at all times.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Are there sufficient SQEP and other resources to manage, operate, maintain and repair the SySSC?"
                                             ]
                     },
                     {
                         "id":  "5.1.10",
                         "principleId":  "5.1",
                         "title":  "Essential services resilient and secure",
                         "controlText":  "Where essential services (such as computer-based security systems) are necessary to support the functioning of a Physical Protection System (PPS), then these services should be sufficiently resilient and secure to ensure that their loss or interruption does not adversely affect the ability of the PPS to achieve the required outcome as defined in SyAPs Annexes C and D.\n\nEssential services critical to the correct functioning of the security system should be given the same priority as the system itself and as such are required to have appropriate levels of reliability and resilience.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Do essential services (such as power) necessary for the correct functioning of the SySSC have the appropriate levels of security, reliability and resilience?"
                                             ]
                     },
                     {
                         "id":  "5.1.11",
                         "principleId":  "5.1",
                         "title":  "Fail secure behaviour",
                         "controlText":  "SySSCs should \u0027fail secure\u0027, and where they do not, security requirements should be appropriately balanced against safety requirements and adequate compensatory security measures made available.\n\nThe security plan should demonstrate how design incorporates reliability and resilience through \u0027fail secure\u0027 behaviour, with any trade-off against safety requirements justified and compensated.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Do SySSCs \u0027fail secure\u0027 and, if they do not, are security requirements appropriately balanced against safety requirements and are adequate compensatory security measures available?"
                                             ]
                     },
                     {
                         "id":  "5.1.12",
                         "principleId":  "5.1",
                         "title":  "Continuous improvement, learning and quality assurance",
                         "controlText":  "The dutyholder should demonstrate the ability to learn from experience in maintaining a SySSC, operate a process of continuous improvement in relation to SySSCs\u0027 reliability, resilience and sustainability, and apply appropriate quality performance and assurance mechanisms.\n\nA quality assurance policy and programme for physical protection should ensure that a physical protection system is designed, implemented, operated and maintained in a condition capable of effectively responding to the threat assessment or design basis threat.",
                         "controlTextLabel":  "SyDP 5.1 expectation (CNS-TAST-GD-5.1)",
                         "promptQuestions":  [
                                                 "Does the dutyholder demonstrate the ability to learn from their experience in maintaining a SySSC?",
                                                 "Is there a process of continuous improvement in place in relation to SySSCs\u0027 reliability, resilience and sustainability?",
                                                 "Are appropriate quality performance and assurance mechanisms applied to SySSC?"
                                             ]
                     },
                     {
                         "id":  "5.2.1",
                         "principleId":  "5.2",
                         "title":  "Security plan identifies EIMT nature and intervals",
                         "controlText":  "The security plan should identify the nature and intervals of EIMT for critical elements of the security system and provide appropriate justification for any long-term performance claims without EIMT. EIMT activities should take account of any reliability claims in the security plan and be appropriate for the life cycle and/or PPS outcome required of the site.\n\nWhere any part of the PPS is claimed without an EIMT programme, the inspector should confirm the adequacy of the additional design measures incorporated to justify the absence of EIMT, or the arguments and evidence cited in support of such a claim. Physical Protection Systems should be designed on the basis that the supporting security equipment infrastructure will achieve the standards of reliability claimed in the security plan.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Is the EIMT programme adequate to maintain the current (and/or future) PPS posture, outcome and the associated nuclear security functions identified in security plans?",
                                                 "Does the proposed EIMT strategy support security plan reliability claims?",
                                                 "Does the dutyholder have adequate arrangements for maintaining any installed SySSC prior to it being put into operational service?"
                                             ]
                     },
                     {
                         "id":  "5.2.2",
                         "principleId":  "5.2",
                         "title":  "Traceability from plan to maintenance instructions",
                         "controlText":  "There should be traceability of EIMT requirements from the security plans through the plant maintenance schedule to maintenance instructions, with consistency at all stages including the ability to readily identify the categorisation and classification for a SySSC from anywhere within the chain of documents.\n\nA key element of the arrangements should be consistency at all stages from the identification of SySSCs in the security plan through to the plant maintenance schedule, or equivalent, and the maintenance instructions (which may be termed job plans). This consistency should include clear SySSC cross-references between documents. Where an EIMT activity satisfies a security requirement, cross references to its security role definition, unique test document numbers, maintenance instruction number and commissioning documents should be provided as appropriate.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are security plan assumptions regarding component reliability, which can influence \"mean time between failures\" and therefore tests and performance, along with unavailability for EIMT, adequately reflected in implementation documentation such as Maintenance Schedules and Instructions?",
                                                 "Do dutyholders have a process for capturing project assumptions related to EIMT generated by the on-going design and security analyses, along with an auditable record of where these assumptions are recorded in operational documents?"
                                             ]
                     },
                     {
                         "id":  "5.2.3",
                         "principleId":  "5.2",
                         "title":  "Systematic identification of SySSCs in schedule",
                         "controlText":  "A systematic approach to identifying SySSCs through their categorisation and classification for inclusion in the plant maintenance schedule should be adopted, and where a schedule includes other plant, anything that may affect nuclear security should be clearly identified.\n\nInspectors should note dutyholders may produce a plant maintenance schedule that includes other plant. In such instances, the inspector should determine whether anything that may affect nuclear security is clearly identified.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are the dutyholder\u0027s arrangements for developing a catalogue of all facility EIMT adequate and are relevant SySSC placed on the plant maintenance schedule?",
                                                 "Whether it is appropriate for the EIMT programme for SySSC to be aligned with any other EIMT programme on site?",
                                                 "Whether the security classification is appropriate for the EIMT specified, and standards selected, for the various SySSCs it covers?"
                                             ]
                     },
                     {
                         "id":  "5.2.4",
                         "principleId":  "5.2",
                         "title":  "Works tests documented as baseline",
                         "controlText":  "Relevant works tests (Factory Acceptance Tests) should be formally documented and captured in the dutyholder\u0027s operational documentation (for example, quality plans) as the baseline for ongoing demonstration that the design intent of any SySSC is achieved.\n\nReference data should be taken from type-testing to establish a baseline for comparison against in-service performance. Adequate development work should be undertaken on novel systems or components between concept design and manufacturing, as such work may have significant impact on the EIMT tasks defined within the evolving maintenance schedules.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Is adequate development work undertaken on novel systems or components between concept design and manufacturing? Such work may have significant impact on the EIMT tasks defined within the evolving maintenance schedules."
                                             ]
                     },
                     {
                         "id":  "5.2.5",
                         "principleId":  "5.2",
                         "title":  "Installation and commissioning changes assessed",
                         "controlText":  "Plant changes during installation and testing should be adequately assessed in terms of identifying resultant effects on the proposed EIMT arrangements, with the maintenance schedule and maintenance instructions modified and documented along with records of consideration and agreement by all relevant project, security and operations disciplines.\n\nFor key SySSCs, and where it is not possible for tests to confirm the ability to operate under the most onerous design conditions, the inspector should seek justification of the components\u0027 performance and reliability from additional analysis utilising data from commissioning or rig-testing. Dutyholders should consider the extent to which the commissioning will demonstrate the proposed in-service test regime for each part of a SySSC, as well as the whole system itself.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Where in-situ testing is not possible, are alternative arrangements made by the dutyholder adequate? Such alternative arrangements may be necessary for issues such as the removal and offline testing of a device."
                                             ]
                     },
                     {
                         "id":  "5.2.6",
                         "principleId":  "5.2",
                         "title":  "EIMT in operations and out-of-service protection",
                         "controlText":  "During operations, EIMT for the various SySSCs should be specified, standards selected and the work undertaken to a level of quality commensurate with their security Classification, ensuring staggered testing requirements and minimum operational configurations justified in the security plan are maintained, and that temporary security plans are in place where a SySSC is taken out of service.\n\nWhere a SySSC is taken out of service for EIMT, temporary security plans should be in place to provide commensurate levels of protection or provide adequate mitigation where this is not possible. The potential for the EIMT to initiate a fault or generate vulnerability should be analysed and the associated risks appropriately assessed and managed.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Does the EIMT strategy ensure that adequate compensatory measures have been identified and implemented to allow SySSC to be released for EIMT?",
                                                 "Has the dutyholder adequately incorporated human factors assessments of EIMT tasks during testing and commissioning? Looking in particular, for error traps, and common cause failure mechanisms created by the procedures or by operators\u0027 actions."
                                             ]
                     },
                     {
                         "id":  "5.2.7",
                         "principleId":  "5.2",
                         "title":  "Inspection based maintenance with written procedures",
                         "controlText":  "Dutyholders should establish that the programme of work provides the necessary EIMT for the PPS within an overall long-term plan, assessed by SQEP from the operational and design authority organisations, with all EIMT activities carried out using written procedures and appropriate arrangements for independent checking (by sampling) of EIMT activity.\n\nThe EIMT programme should include additional work following, or arising from, the identification of any specific security concerns during operation of a facility or SySSC. Procedures should be sampled to confirm they contain clear and adequate instructions, guidance on reporting criteria, and provide adequate means of identifying and recording items inspected and any features or defects observed.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are all relevant stakeholders involved in developing an appropriate EIMT programme for SySSC?",
                                                 "Does the dutyholder have adequate EIMT arrangements for equipment provided to support the site\u0027s and facility\u0027s security response?"
                                             ]
                     },
                     {
                         "id":  "5.2.8",
                         "principleId":  "5.2",
                         "title":  "Reporting, defect sentencing and return to service",
                         "controlText":  "The dutyholder\u0027s arrangements for the reporting and reviewing of results, and the prioritisation and sentencing of defects (including independent assessment where appropriate), should be assessed to confirm overall acceptability, and all findings pertinent to the security justification for a return to service should be provided in good time for consideration and, if necessary, assessment by inspectors.\n\nSQEP staff should review the final outage inspection reports, or any equivalent reports, and advise whether any of the matters reported raise new concerns which should at least be considered before equipment is brought back into service. EIMT instructions should provide for full and accurate reporting, including recording and reporting of defects and any properties or parameters needing monitoring, with clear criteria for successful completion and provision for reporting and rectification of non-conformances.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Do EIMT instructions provide for full and accurate reporting? This should include the recording and reporting of any defects and of any properties or parameters which may need to be monitored to confirm continuing effective operation. Clear criteria for successful completion of the work should be stated and the procedures should provide for the reporting and rectification of non-conformances."
                                             ]
                     },
                     {
                         "id":  "5.2.9",
                         "principleId":  "5.2",
                         "title":  "Verification of EIMT completion",
                         "controlText":  "The dutyholder should have a process for confirming maintenance has taken place and for recording any repairs or modifications, protectively marked to reflect the importance of that equipment to nuclear security, specifically including an appropriate level of physical verification of EIMT on the facility.\n\nAppropriate arrangements should be in place for the independent checking (by sampling) of EIMT activity to confirm it is conducted to the specified standard.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)"
                     },
                     {
                         "id":  "5.2.10",
                         "principleId":  "5.2",
                         "title":  "Periodic security reviews confirm reliability claims",
                         "controlText":  "Periodic reviews of security by both the dutyholder\u0027s plant and security directorate(s)/department(s), as part of the overarching internal assurance programme, should demonstrate the ongoing adequacy of EIMT regimes and confirm that cumulative data from EIMT continues to support the reliability claims made within security plans.\n\nThese periodic reviews should describe plant failures, anomalies and the means of rectification, and identify trends in failures or gradual degradation of SySSC over time.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are arrangements in place to identify trends in failures or gradual degradation of SySSC over time?",
                                                 "Are the EIMT arrangements for SySSCs fully integrated into the sites wider operational maintenance and ageing management and obsolescence arrangements?"
                                             ]
                     },
                     {
                         "id":  "5.2.11",
                         "principleId":  "5.2",
                         "title":  "Justified EIMT reductions on decommissioning",
                         "controlText":  "Any reduction in EIMT justified for the various phases of facility decommissioning, where site categorisation for theft and sabotage decreases and a less onerous outcome may be required of the PPS, should be supported by amended security plans that demonstrate the revised arrangements are adequate.\n\nSuch plans will require approval and possibly assessment by ONR before they can be implemented.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are both security plan and plant changes adequately assessed by appropriate SQEP staff to identify commensurate effects on the existing EIMT arrangements and the need for any additional or revised EIMT? Such changes may result in the need to modify the maintenance schedules and maintenance instructions.",
                                                 "Are there adequate provisions for the secure, quarantined storage of overhauled security equipment prior to it being re-installed on the facility?"
                                             ]
                     },
                     {
                         "id":  "5.2.12",
                         "principleId":  "5.2",
                         "title":  "Good practice and learning from experience",
                         "controlText":  "Dutyholders should adopt the latest relevant good practices for EIMT and have a formal process for EIMT staff to identify shortfalls, inconsistencies or discrepancies in EIMT procedures, with a mechanism for dealing with observations raised and learning from experience.\n\nThe dutyholder\u0027s maintenance arrangements may be based on generic approaches such as reliability-centered maintenance, condition monitoring, planned maintenance, preventative maintenance, risk-based maintenance and run-to-failure (corrective) maintenance.",
                         "controlTextLabel":  "SyDP 5.2 expectation (CNS-TAST-GD-5.2)",
                         "promptQuestions":  [
                                                 "Are dutyholders adopting the latest relevant good practices for EIMT?",
                                                 "Do dutyholders have a formal process for EIMT staff to identify shortfalls, inconsistencies or discrepancies in EIMT procedures, along with evidence that staff are encouraged to use the process and that the process provides a mechanism for dealing with the observations raised and learning from experience?",
                                                 "Are the dutyholder\u0027s maintenance arrangements based on generic approaches?"
                                             ]
                     },
                     {
                         "id":  "5.3.1",
                         "principleId":  "5.3",
                         "title":  "Security plan identifies sustainability arrangements",
                         "controlText":  "The security plan should identify how the dutyholder\u0027s arrangements ensure sustainability of the nuclear security regime at their site and/or facilities, so that the constituent parts of the regime are sustained and supported over time to continue to achieve the required outcomes.\n\nSustainability is defined by the set of objectives and implementing actions incorporated into the nuclear security regime to support its continuing effectiveness. If the nuclear security regime is to remain effective, it needs to be sustained over time. Inspection and assessment activities should be proportionate and applied taking account of the graded approach.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)"
                     },
                     {
                         "id":  "5.3.2",
                         "principleId":  "5.3",
                         "title":  "Management and planning for sustainable operations",
                         "controlText":  "The dutyholder\u0027s senior managers should set priorities, identify long-term financial resources, and define roles, responsibilities and accountabilities for nuclear security in order to ensure the continuing effectiveness of the organisation\u0027s nuclear security system, documenting these management decisions.\n\nSQEP at senior management levels set priorities and identify the long-term financial resources needed for ongoing operational expenses related to personnel, training, exercises, performance testing, procurement, EIMT and replacement of equipment, and for configuration management. Plans enable dutyholders to demonstrate conformity with applicable requirements and provide guidance to their own personnel for the operation, maintenance and continuous improvement of nuclear security systems and measures, and must be re-evaluated when any relevant change may impact the objectives being achieved.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Are relevant management decisions documented as part of a formal approval process?"
                                             ]
                     },
                     {
                         "id":  "5.3.3",
                         "principleId":  "5.3",
                         "title":  "Risk management and ageing management",
                         "controlText":  "Risk management should be applied to security related risks as a comprehensive, robust and ongoing process that is part of a risk informed approach, and the arrangements for the management of ageing SySSCs should be fully integrated into the site\u0027s wider operational maintenance and ageing management plans.\n\nRisk management includes identification of assets and risks, planning and executing risk reduction actions, assessing the effectiveness of the actions and acceptability of residual risks, and repetition and improvement of the process.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Is risk management applied to security related risks, as a comprehensive, robust and ongoing process that is part of a risk informed approach?",
                                                 "Are the arrangements for the management of ageing SySSCs fully integrated into the sites wider operational maintenance and ageing management plans?"
                                             ]
                     },
                     {
                         "id":  "5.3.4",
                         "principleId":  "5.3",
                         "title":  "Identifying and applying current threat information",
                         "controlText":  "Dutyholders should establish and maintain regular liaison with sources of threat information and establish a documented process for ensuring the threat information they receive is systematically and promptly addressed through modifying nuclear security systems and measures as necessary, documented in their security/contingency plans.\n\nEnsuring that nuclear security systems and measures remain effective depends upon periodic review and adjustment of such systems and measures to address updated information on relevant current threats. Relevant threat information may be provided through a variety of sources, such as the national threat assessment process, the Design Basis Threat (DBT), the police and other operators. Dutyholders should also establish mechanisms to address increases in the Response Level.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Does the security plan incorporate consideration of appropriate threat information and application of a risk informed approach?",
                                                 "Does the security plan include appropriate agreements and identify relevant external organisations that may need to be contacted or informed in the case of a nuclear security event?",
                                                 "Does the security plan include a process for regular review and revision, based on operational feedback and changes in requirements?",
                                                 "Has the dutyholder established and documented a systematic process for exchanging, maintaining and acting on current threat information in a timely manner, including establishing and maintaining relationships with relevant authorities to facilitate information exchange?"
                                             ]
                     },
                     {
                         "id":  "5.3.5",
                         "principleId":  "5.3",
                         "title":  "Adapting to threat changes and insider risk",
                         "controlText":  "The dutyholder should adapt nuclear security systems and measures as necessary to counter the current threat, implement appropriate compensatory measures in response to a specific, emerging or increased threat, and review and mitigate potential insider threats.\n\nPotential insider threats should be reviewed and mitigated through such means as the personnel security programme, information security measures and security training. The dutyholder should have a mechanism for reporting updated threat or system effectiveness information to the responsible competent authorities.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder review and mitigate potential insider threats through such means as the personnel security programme, information security measures and security training?",
                                                 "Does the dutyholder adapt nuclear security systems and measures as necessary, to counter the current threat?",
                                                 "Does the dutyholder implement appropriate compensatory measures in response to a specific, emerging or increased threat?",
                                                 "Does the dutyholder have a mechanism for reporting updated threat or system effectiveness information to the responsible competent authorities?"
                                             ]
                     },
                     {
                         "id":  "5.3.6",
                         "principleId":  "5.3",
                         "title":  "Developing and maintaining security competences",
                         "controlText":  "Sustainability depends on the dutyholder having sufficient staff with the competences necessary for effective operation and maintenance of its nuclear security systems, and the dutyholder should establish systems and processes for recruiting qualified staff and/or training staff to attain these competences.\n\nThe dutyholder should establish programmes for providing the necessary training, either using internal resources or external training providers, including specific mechanisms for career development. Competence management is explicitly covered by FSyP 3, and inspectors may consider that competence related aspects of sustainability have been addressed where a dutyholder\u0027s security plan has been assessed as meeting the regulatory expectations of SyDP 3.2, with the competencies to undertake EIMT of SySSCs reflected in the arrangements.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)"
                     },
                     {
                         "id":  "5.3.7",
                         "principleId":  "5.3",
                         "title":  "Establishing and implementing a maintenance programme",
                         "controlText":  "The dutyholder should establish and implement an effective, formal maintenance programme against an appropriate schedule (including repair, replacement and calibration) to ensure related systems and equipment perform reliably and effectively over time, taking into account equipment lifecycles and providing for compensatory measures when systems are out of service.\n\nRegular, planned system checks and preventive maintenance can optimise performance and provide advance warning of possible system outages so that timely mitigating actions can be taken. Dutyholders should take into account equipment lifecycles, including upgrading or replacing equipment as it fails or becomes obsolete, and assess systems to ensure any significant \u0027Single Points of Failure\u0027 are identified and mitigated. Maintenance is explicitly covered in the EIMT TAG (SyDP 5.2), and inspectors may consider maintenance related aspects of sustainability addressed where a security plan meets the regulatory expectations of SyDP 5.2.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)"
                     },
                     {
                         "id":  "5.3.8",
                         "principleId":  "5.3",
                         "title":  "Applying configuration management",
                         "controlText":  "The dutyholder should apply configuration management to document the physical, procedural and training elements of its critical nuclear security systems, ensuring information is accurate, available in a timely manner and appropriately protected, and that only authorised changes are made in accordance with local control arrangements.\n\nConfiguration management ensures that changes to a nuclear security system are properly developed, implemented, verified and documented. Critical nuclear security systems should be identified in the security plan along with any relevant protection required. Having immediate access to this information can help the operating organisation recover rapidly from hardware or software failures and ensure equipment is operating as intended when returned to service.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder apply configuration management to document the physical, procedural and training elements of its critical nuclear security systems?",
                                                 "Does the dutyholder ensure configuration management information is accurate, available in a timely manner and appropriately protected?",
                                                 "Does the dutyholder ensure the security implications of changes in the nuclear security systems subject to configuration management are reviewed prior to implementation and are documented appropriately?",
                                                 "Does the dutyholder ensure the security implications of changes in other systems that have an impact on nuclear security are reviewed prior to implementation and are documented appropriately?",
                                                 "Does the dutyholder identify critical nuclear security systems in the security plan along with any relevant protection required?"
                                             ]
                     },
                     {
                         "id":  "5.3.9",
                         "principleId":  "5.3",
                         "title":  "Promoting robust nuclear security culture",
                         "controlText":  "The dutyholder should promote a robust nuclear security culture at the operational level so that management and staff, including contractors, understand and appreciate the need to maintain an effective nuclear security regime and recognise that effective security is everyone\u0027s responsibility.\n\nA robust nuclear security culture, with strong leadership and employee recognition, motivates staff at all levels to meet their responsibilities, including reliable operation and maintenance of nuclear security systems and measures. Organisational culture is explicitly covered by FSyP 2, and inspectors may consider culture related aspects of sustainability addressed where a security plan meets the regulatory expectations of SyDP 2.1.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)"
                     },
                     {
                         "id":  "5.3.10",
                         "principleId":  "5.3",
                         "title":  "Conducting compliance and performance evaluations",
                         "controlText":  "The dutyholder should implement formalised and documented compliance and performance evaluations, recording any shortcomings together with the timescale for corrective action within the Site Security Plan\u0027s Security Improvement Schedule (SIS) or equivalent, and implementing interim compensatory security measures where necessary.\n\nCompliance evaluations should be designed to assess the dutyholder\u0027s security systems and measures against regulatory requirements, while performance evaluations assess performance in meeting applicable performance objectives and addressing the defined nuclear security threats. When any element is deficient, corrective action, including compensatory measures if required, should be taken, and where appropriate reported to ONR in accordance with NISR 2003 Regulation 10. The rigour of the evaluation should be based on the graded approach.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Does the dutyholder implement formalised and documented compliance and performance evaluations?",
                                                 "Is the SIS, or equivalent, within the security plan up to date?",
                                                 "Are shortcomings noted in the SIS addressed by the dutyholder through compensatory measures such as a TSP?",
                                                 "Does the dutyholder document results of evaluations, including corrective actions and, where appropriate, report the results and findings to ONR?"
                                             ]
                     },
                     {
                         "id":  "5.3.11",
                         "principleId":  "5.3",
                         "title":  "Performance testing and exercises",
                         "controlText":  "The dutyholder should ensure that performance tests and exercises are conducted regularly, including tests and exercises with external response organisations, with the security plan validating the functional requirements and performance of the systems and providing the basis for the design, frequency and performance criteria for the testing programme.\n\nPerformance testing should include the investigation, measurement, validation and verification of nuclear security systems and measures against a measurable outcome, through both limited scope tests focusing on an individual component and system-wide tests of the entire security system. Tests should be conducted rotationally to verify that all human factor contributions to security sustainability are assessed, and the dutyholder should engage with other organisations to share lessons learned and best practices.",
                         "controlTextLabel":  "SyDP 5.3 expectation (CNS-TAST-GD-5.3)",
                         "promptQuestions":  [
                                                 "Does the security plan validate functional requirements and performance of the systems?",
                                                 "Does the dutyholder ensure that performance tests and exercises are conducted regularly, including tests and exercises with external response organisations?",
                                                 "Does the dutyholder engage with other organisations to share lessons learned and best practices?",
                                                 "Does the dutyholder ensure that tests are conducted rotationally to verify that all human factor contributions to security sustainability are assessed?"
                                             ]
                     },
                     {
                         "id":  "6.1.1",
                         "principleId":  "6.1",
                         "title":  "Categorise site and facilities for theft",
                         "controlText":  "Dutyholders should categorise their site and facilities for theft according to the quantities and forms of all Nuclear Material (NM) and Other Radioactive Material (ORM) held or used.\n\nFor NM this includes categorisation in relation to proliferation and a security group in relation to dispersal; for ORM only the dispersal security group is relevant. This is essential to determine the required outcome for the protective security system and to allow the graded approach to be applied. (The categorisation tables are at redacted Annex A.)",
                         "controlTextLabel":  "SyDP 6.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.1.2",
                         "principleId":  "6.1",
                         "title":  "Manage changes to the theft categorisation",
                         "controlText":  "Dutyholders should have processes in place to identify and manage potential planned or unplanned changes to the categorisation so that the appropriate physical protection system outcome is always achieved.\n\nInventories can change for a variety of reasons, so the categorisation must be kept current.",
                         "controlTextLabel":  "SyDP 6.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.2.1",
                         "principleId":  "6.2",
                         "title":  "Categorise for sabotage via vital area identification",
                         "controlText":  "Dutyholders should categorise their site and facilities for sabotage by undertaking a process of vital area identification.\n\nThis is essential to determine the required outcome for the protective security system and to allow the graded approach to be applied. Vital areas may be identified where there is no NM/ORM present, for example on generating power stations where systems are essential to maintain control, containment or cooling.",
                         "controlTextLabel":  "SyDP 6.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.2.2",
                         "principleId":  "6.2",
                         "title":  "Manage changes affecting sabotage categorisation",
                         "controlText":  "Dutyholders should have processes in place to identify and manage potential planned or unplanned changes to operations so that the appropriate physical protection system outcome is always achieved.\n\nInventories and/or vulnerabilities can change for a variety of reasons.",
                         "controlTextLabel":  "SyDP 6.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.3.1",
                         "principleId":  "6.3",
                         "title":  "Design a graded, defence-in-depth PPS",
                         "controlText":  "Dutyholders should design and implement a physical protection system (incorporating functions such as deterrence, delay, detection, response and insider threat mitigation) that achieves the relevant security outcome, graded according to the consequence for theft and sabotage.\n\nThe required security outcomes are determined by the redacted Annexes C and D of the SyAPs.",
                         "controlTextLabel":  "SyDP 6.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.3.2",
                         "principleId":  "6.3",
                         "title":  "Achieve the required outcome (solutions may be bespoke)",
                         "controlText":  "Dutyholders should ensure the physical protection system achieves the required security outcome, with flexibility for innovative, bespoke solutions where they have demonstrated with confidence that the required outcome is achieved.\n\nIndicative security postures describe typical qualities a compliant PPS may comprise but are complementary guidance, not a prescribed solution.",
                         "controlTextLabel":  "SyDP 6.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.3.3",
                         "principleId":  "6.3",
                         "title":  "Facility-level plans support the overall PPS outcome",
                         "controlText":  "Dutyholders may develop and implement appropriate facility-level, detailed security plans and procedures that support the overall physical protection system outcome.\n\nSecurity plans demonstrate how the overall security outcome is achieved and are underpinned by secure operations at the facility level.",
                         "controlTextLabel":  "SyDP 6.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.4.1",
                         "principleId":  "6.4",
                         "title":  "Performance based VA validates PPS effectiveness",
                         "controlText":  "The dutyholder should demonstrate within their security plan how the effectiveness of the PPS has been validated through the conduct of performance based vulnerability assessments. Such assessments could comprise one or more proven methodologies such as force-on-force exercises, table top exercises, war gaming, simulation, computer based modelling or expert analysis.\n\nA performance based vulnerability assessment should be carried out at all sites against the security outcome required from the physical protection system (PPS). The Manual Forced Entry Standard (MFES) should be used by dutyholders to assist validation of claims, arguments and evidence in the vulnerability assessment that the PPS meets the required outcome as defined in SyAPs Annexes C and D.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment incorporate the nine key features of a good submission?"
                                             ]
                     },
                     {
                         "id":  "6.4.2",
                         "principleId":  "6.4",
                         "title":  "Identification of targets",
                         "controlText":  "The vulnerability assessment should accurately identify buildings or facilities holding NM, ORM and those identified as Vital Areas (VAs), taking into account the NM and VA categories and associated PPS Security Posture and Outcome.\n\nSubmissions should be complete: all foreseeable threats (as defined in the UK DBT) are identified and evidence provided that shows the site/plant has adequate protection in place to protect them, their inventory and key supporting infrastructure against theft and sabotage, taking account of the PPS outcomes for protecting Category I to Category IV quantities of NM/ORM against theft and the graded approach for the prevention of sabotage.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment accurately reflect all buildings and facilities as categorised by target identification for theft and sabotage processes detailed in SyDPs 6.1 and 6.2?"
                                             ]
                     },
                     {
                         "id":  "6.4.3",
                         "principleId":  "6.4",
                         "title":  "Confirmation of malicious capabilities and insider threat",
                         "controlText":  "Relevant malicious capabilities should be confirmed (for example, intruders, vehicle-borne improvised explosive device, insider theft of NM and insider sabotage), with adequate consideration given to the insider threat.\n\nAnalysis of the insider threat is important as this threat is particularly difficult to counter given an insider has authorised access and is in a position of trust. Insiders could use methods and opportunities not available to external attackers, may choose an optimum time, extend the malicious act over a long period, and may be in collusion with external attackers. Scenario analysis should consider where an insider could act to minimise the likelihood of success for the response force.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Is the vulnerability assessment based on all relevant malicious capabilities described in the DBT document and has adequate consideration been given to the insider threat?"
                                             ]
                     },
                     {
                         "id":  "6.4.4",
                         "principleId":  "6.4",
                         "title":  "Scenario analysis",
                         "controlText":  "The vulnerability assessment should provide scenario analysis giving a basis for the confident evaluation of the PPS design, developing a small number of distinct, different and unique scenarios that are credible, consistent, challenging, transparent, documented and consistent with the DBT.\n\nScenarios should consider the possibility of a sub-optimal response by the response force, for example by introducing an element of confusion, incapacitation or communication failures. The scenarios should comprise detailed plans of the adversary attack strategies allowing confidence to be gained in the adequacy of the physical protection system design against a variety of worst-case incidents.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment include scenario analysis that is credible, challenging, transparent and considers the possibility of sub-optimal performance by the response force?"
                                             ]
                     },
                     {
                         "id":  "6.4.5",
                         "principleId":  "6.4",
                         "title":  "Adversarial approach path analysis",
                         "controlText":  "The vulnerability assessment should include adversarial approach path analysis identifying the path(s) that are the most vulnerable and least likely to result in the response force interrupting the malicious activity, and should identify the Primary and Critical Detection Points (PDP/CDP).\n\nThis includes adversary path(s) that have the minimum likelihood of initial detection, then once detection occurs, the minimum delay time to support an effective interdiction by the response force. All methods rely upon the reaction time of the response force being known, coupled with detection and delay times. Taking account of the analysis, a graphical representation of the PPS design layers and elements, and the routes an adversary could take, should be produced using flowcharts and/or diagrams.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment include adversarial path analysis that identifies the most vulnerable paths and utilises accurate detection and delay times?",
                                                 "Does the vulnerability assessment include aspects such as graphical representation, modelling, flow charts or diagrams to assist understanding and interpretation?"
                                             ]
                     },
                     {
                         "id":  "6.4.6",
                         "principleId":  "6.4",
                         "title":  "Interruption analysis (PPS Outcome 1 or 2)",
                         "controlText":  "Dutyholders on sites required to meet PPS Outcome 1 or 2 (see SyAPs Annexes C and D) must take account of any armed response force\u0027s Concept of Operations (ConOps), containment or denial strategies, pre-determined intervention points and final denial points, as appropriate, when conducting interruption analysis.\n\nResponse times should take account of the time taken for the alarm signal from a detector to be transmitted, displayed and assessed, and for it to be communicated to the response force. Interruption analysis then allows the CDP to be determined.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Where the PPS is required to achieve Outcome 1 or 2, does the vulnerability assessment incorporate interruption analysis?"
                                             ]
                     },
                     {
                         "id":  "6.4.7",
                         "principleId":  "6.4",
                         "title":  "Neutralisation analysis (PPS Outcome 1)",
                         "controlText":  "Dutyholders on sites required to meet PPS Outcome 1 will need to undertake a neutralisation analysis which incorporates key factors including the number, tactics and weapons of both the adversary and the armed response force.\n\nAdversarial capabilities are detailed in the DBT document and the armed response force capabilities should be included in a ConOps. Several methodologies can be used to determine the likely probability of the armed response force preventing the adversary carrying out a malicious act, including expert opinion, table top analysis, numerical methods such as Markov Chain, computer simulations and modelling, force on force exercises, and operational experience from real engagements.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Where the PPS in required to achieve Outcome 1, does the vulnerability assessment incorporate neutralisation analysis?"
                                             ]
                     },
                     {
                         "id":  "6.4.8",
                         "principleId":  "6.4",
                         "title":  "Real world performance considerations",
                         "controlText":  "The vulnerability assessment should incorporate real world performance considerations of armed and unarmed response force capabilities, bearing in mind that the adversary will initially have the initiative and the response force will initially respond to a developing incident rather than commanding the situation.\n\nThe adversary can determine the time and location of the attack, knows their plans and likely strengths and weaknesses, and may have insider assistance. The posture of the response force pre-event should be realistic and analysis of historical response force locations/deployment data should be used. This includes unarmed response forces, who may be dispatched to verify alarms in support of achieving a PPS outcome.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment incorporate real world performance considerations of armed and unarmed response force capabilities?"
                                             ]
                     },
                     {
                         "id":  "6.4.9",
                         "principleId":  "6.4",
                         "title":  "Identify and record vulnerabilities and risks",
                         "controlText":  "Taking the analysis into account, the vulnerability assessment should identify the potential vulnerabilities in existing security arrangements and produce a submission ensuring all risks are recorded for validation by ONR.\n\nOnce completed, dutyholders are expected to submit completed vulnerability assessments to ONR for validation. The submission should support and confirm that the effects required from the PPS are met or justify the reasons why this is not the case.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Does the vulnerability assessment record all potential vulnerabilities in the PPS and any associated risks?"
                                             ]
                     },
                     {
                         "id":  "6.4.10",
                         "principleId":  "6.4",
                         "title":  "Peer review, assurance and governance",
                         "controlText":  "During production, a vulnerability assessment submission should undergo an internal peer review, including an assurance and governance process by suitably qualified security and operational staff before it is submitted, and the Board member (or equivalent) for security should be briefed on all aspects and endorse the approach used.\n\nAs part of the approval process it is important that appropriate methods and relevant security standards and specifications have been used and calculations are correct; that where necessary there has been independent verification or advice by suitably qualified and experienced staff including the armed response force, CPNI and the Centre for Applied Science and Technology; that other third parties can demonstrate their competence; and that the assessment is complete with all key security assumptions valid.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)",
                         "promptQuestions":  [
                                                 "Has the vulnerability assessment been subject to appropriate internal assurance and Governance arrangements?"
                                             ]
                     },
                     {
                         "id":  "6.4.11",
                         "principleId":  "6.4",
                         "title":  "Quality of submission (nine key features)",
                         "controlText":  "A vulnerability assessment submission should exhibit the nine key features of a good submission: it should be complete, clear, rational, accurate, objective, appropriate, integrated, current and forward looking.\n\nSubmissions should be clear (identifying associated PPS outcomes and giving the basis for all assumptions, conclusions and recommendations), rational, accurate (reflecting the \u0027as is\u0027 state), objective (supported by factual evidence and demonstrating defence-in-depth), appropriate (using fit-for-purpose analytical methods with verification and validation), integrated, current, and forward looking (reviewed throughout the lifetime of the site and revalidated when the DBT is reviewed). The dutyholder is responsible for the submission, but the armed response force or guard force who deliver security should be involved and have a comprehensive understanding of it.",
                         "controlTextLabel":  "SyDP 6.4 expectation (CNS-TAST-GD-6.4)"
                     },
                     {
                         "id":  "6.5.1",
                         "principleId":  "6.5",
                         "title":  "Consider effects of adjacent or enclave premises",
                         "controlText":  "Where sites are adjacent to, or tenants within, another nuclear premises, dutyholders should give consideration to any shared services or shared contingency/emergency arrangements and to the impact that one may have, as an external hazard, on the other.\n\nThis requires the establishment of arrangements to ensure the sharing of information to achieve relevant and mutual outcomes.",
                         "controlTextLabel":  "SyDP 6.5 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.5.2",
                         "principleId":  "6.5",
                         "title":  "Maintain a coordinated security and response approach",
                         "controlText":  "Dutyholders should demonstrate that a coherent, coordinated approach is being maintained towards all aspects of security (and emergency response) that may be influenced by the adjacent or enclave nature of the sites.",
                         "controlTextLabel":  "SyDP 6.5 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.6.1",
                         "principleId":  "6.6",
                         "title":  "PPS counters construction-site threat and latent defects",
                         "controlText":  "Dutyholders should implement a physical protection system for a construction site that counters the threat posed by the site to an adjoining operating nuclear site, and should identify and mitigate against the introduction of defects or vulnerabilities that could compromise the security or safety of the nuclear facility once it starts operating.",
                         "controlTextLabel":  "SyDP 6.6 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.6.2",
                         "principleId":  "6.6",
                         "title":  "Phased, incremental PPS aligned to construction",
                         "controlText":  "Dutyholders should have in place phased, incremental enhancements to the physical protection system aligned with construction progress, as larger construction plant is introduced, more workers are present and the sensitivity of the work increases.\n\nThe graded approach is equally relevant for construction activities.",
                         "controlTextLabel":  "SyDP 6.6 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.6.3",
                         "principleId":  "6.6",
                         "title":  "Embed arrangements before sensitivity increases",
                         "controlText":  "Dutyholders should ensure that the security arrangements for each phase (or facility on an existing site) are implemented for a period which allows them to be fully embedded and functioning with high reliability prior to the associated increase in site sensitivity or categorisation.\n\nThe appropriate security outcome (per redacted Annexes C and D) must be achieved as the categorisation for theft and sabotage increases.",
                         "controlTextLabel":  "SyDP 6.6 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.7.1",
                         "principleId":  "6.7",
                         "title":  "Protect NM in transit to the required outcome",
                         "controlText":  "Dutyholders should implement a physical protection system that achieves the outcome appropriate to the categorisation for theft and sabotage of the nuclear material being transported, with these arrangements detailed in a Transport Security Statement (TSS) and qualified, where appropriate, in a transport security plan.\n\nAs a signatory to the CPPNM, the UK is obliged to ensure the protection of NM against theft and sabotage whilst in transit (per NISR 2003 and the redacted Annexes C and D).",
                         "controlTextLabel":  "SyDP 6.7 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "6.7.2",
                         "principleId":  "6.7",
                         "title":  "Comply with wider transport regulations",
                         "controlText":  "Dutyholders should comply with UK and international regulations for the transportation of NM/ORM that does not fall under the schedule to NISR 2003.\n\nAdditional guidance for Class B carriers is available in the ONR publication \u0027Nuclear Transport Security Guidance for Class B Approved Carriers\u0027.",
                         "controlTextLabel":  "SyDP 6.7 expectation (SyAPs 2022 master)"
                     },
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
                     },
                     {
                         "id":  "8.1.1",
                         "principleId":  "8.1",
                         "title":  "HR, occupational health and security cooperate",
                         "controlText":  "Dutyholders should ensure that their supply chain and their own HR, occupational health and security departments appropriately cooperate when dealing with pre-employment screening, induction programmes, cessation of employment, national security vetting and ongoing personnel security.\n\nEffective personnel security controls require close cooperation between multiple departments and line managers.",
                         "controlTextLabel":  "SyDP 8.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "8.1.2",
                         "principleId":  "8.1",
                         "title":  "Communicate security-significant information",
                         "controlText":  "Dutyholders should ensure that relevant information which may be of security significance is communicated and managed effectively between the responsible departments.\n\nSecurity, HR and occupational health departments are \u0027relevant personnel\u0027 within NISR and have a legal responsibility, in their respective specialisms, to effectively communicate and address concerns that may pose a risk to nuclear security (for example medical conditions with the potential to cause a loss of consciousness, or the application and management of caveats).",
                         "controlTextLabel":  "SyDP 8.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "8.2.1",
                         "principleId":  "8.2",
                         "title":  "Evaluate insider-risk roles to set the vetting level",
                         "controlText":  "Dutyholders should establish and maintain processes to evaluate areas and roles of particular insider risk (for example those with access to certain categories of NM, vital areas, classifications of SNI, or assigned security responsibilities) in order to determine the appropriate level of vetting an individual requires.",
                         "controlTextLabel":  "SyDP 8.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "8.2.2",
                         "principleId":  "8.2",
                         "title":  "Robust screening and vetting delivery",
                         "controlText":  "Dutyholders should establish robust arrangements that manage delivery of pre-employment screening and national security vetting sponsorship in compliance with extant Cabinet Office guidance and any additional ONR requirements.\n\nOnly the dutyholder\u0027s duly authorised personnel should be authorised to approve pre-employment check applications (and only where applications fall within ONR signing authorities) and to sponsor applications for national security vetting.",
                         "controlTextLabel":  "SyDP 8.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "8.2.3",
                         "principleId":  "8.2",
                         "title":  "Appropriate checks for short-term visitors",
                         "controlText":  "Dutyholders should undertake appropriate checks for short-term visitors to site and report any relevant visits, even though such visitors are not necessarily personnel requiring screening or national security vetting.",
                         "controlTextLabel":  "SyDP 8.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "8.3.1",
                         "principleId":  "8.3",
                         "title":  "Clear ongoing personnel security arrangements",
                         "controlText":  "The dutyholder will ensure the security plan identifies clear ongoing personnel security arrangements, including seeking assurance in respect of the contracted component of the workforce. Arrangements should include regular security appraisals (which may be part of a wider appraisal process), promote an organisational culture that understands and supports security, track issues to their conclusion, submit aftercare incident reports as appropriate, and drive workforce and line management engagement.\n\nEffective ongoing personnel security arrangements are assessed against three subject areas: ongoing personnel security culture; compliance with mandated reporting requirements; and dutyholder oversight and reporting arrangements. Dutyholders should implement and maintain robust aftercare arrangements, including the submission of Aftercare Incident Reports (AIRs) as appropriate, to manage the insider risk effectively.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholders arrangements allow for aftercare incident reporting to be tracked to its conclusion?"
                                             ]
                     },
                     {
                         "id":  "8.3.2",
                         "principleId":  "8.3",
                         "title":  "Ongoing personnel security culture",
                         "controlText":  "The dutyholder should promote an ongoing personnel security culture in which the workforce feels valued and is likely to demonstrate acceptable behaviours, treating the workforce fairly, providing guidance on good security behaviour, addressing concerns through support mechanisms, keeping security policies accessible and transparent, and providing security awareness training with updates.\n\nInspectors will review dutyholders\u0027 policies and practices including those publicised on the NPSA website and its associated guidance, and the warning flags identified in the Technical Inspection Guide (TIG) on organisational culture. Dutyholders should consider whether their own employment policies adequately support an ongoing personnel security culture.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder\u0027s employment practices are likely to encourage the workforce to feel valued, demonstrate acceptable behaviours and feel able to report unacceptable conduct;",
                                                 "Whether the dutyholder arrangements considers the TIG on organisational culture."
                                             ]
                     },
                     {
                         "id":  "8.3.3",
                         "principleId":  "8.3",
                         "title":  "Impact of employment and supply chain policies",
                         "controlText":  "The dutyholder should consider the impact of its own employment policies and those of its supply chain on their ongoing personnel security culture, including awareness of policies and practice in its supply chain.\n\nExamples of relevant policies are those relating to harassment and bullying, equal opportunities, employee assistance programmes, drug and alcohol testing, reporting hotlines, and exit procedures. Dutyholders\u0027 oversight of ongoing personnel security should also include those publicised in the NPSA document \u0027Supply Chain Security Collection\u0027.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder has considered the impact of its employment policies and those of its supply chain, on their ongoing personnel security culture.",
                                                 "Whether the dutyholder has established where personnel security responsibility sits within its supply chain organisations and how those organisations promote ongoing personnel security."
                                             ]
                     },
                     {
                         "id":  "8.3.4",
                         "principleId":  "8.3",
                         "title":  "Change of Personal Circumstances reporting",
                         "controlText":  "The dutyholder\u0027s arrangements should ensure their vetted community is reminded of their obligations as to when they are required to submit a Change of Personal Circumstances (CPC) questionnaire, and that relevant incidents reported to them are reported by the dutyholder as an Aftercare Incident Report to address how associated risks are being managed.\n\nHolders of an NSV clearance are required to report relevant changes in their personal circumstances. As CPC submission is an online process undertaken by the vetted individual, the dutyholder is unlikely to be aware of when CPCs are submitted, so internal processes should remind individuals to follow the mandated reporting process.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder\u0027s arrangements ensure that its vetted community is reminded as to when they are required to submit Change of Personnel Circumstances questionnaires.",
                                                 "Whether the dutyholders arrangements ensure that relevant incidents reported to them, which are to be reported using the Change of Personnel Circumstances questionnaires are reported by the dutyholder as an Aftercare Incident Report to address how associated risks are being managed."
                                             ]
                     },
                     {
                         "id":  "8.3.5",
                         "principleId":  "8.3",
                         "title":  "DV Annual Security Appraisal Form process",
                         "controlText":  "The dutyholder\u0027s arrangements should ensure that the mandated DV Annual Security Appraisal Form (ASAF) is used for Developed Vetting holders (though it may be tailored), completed and sent to ONR annually, and that non-compliance by the subject is reported to ONR through an Aftercare Incident Report.\n\nAlternatively the dutyholder may submit a return to ONR advising both parts of the ASAF have been completed and there was nothing of note to report. Where the line manager fails to complete Part 2, it is for the dutyholder to determine any appropriate sanction. DV clearances shared from another Vetting Authority are not subject to the ASAF process by the requesting dutyholder. The dutyholder may also promote personnel security through non-mandated ASAFs for CTC and SC holders.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder uses the DV ASAF process to forward the completed forms to ONR; and whether non-compliance is being reported to ONR using the Aftercare Information Report arrangements?",
                                                 "Whether the dutyholder promotes effective personnel security through using non-mandated ASAFs and by delivering personnel security themed campaigns/awareness sessions."
                                             ]
                     },
                     {
                         "id":  "8.3.6",
                         "principleId":  "8.3",
                         "title":  "Drug and alcohol testing reporting",
                         "controlText":  "The dutyholder\u0027s drug and alcohol testing arrangements should explicitly include the requirement to notify ONR, through the submission of an AIR via UKSV, where NSV clearance holders test positive for alcohol and drug misuse, or falsify (or attempt to falsify) a test result.\n\nThat includes reports of any positive tests for unlawful substances, reports of the misuse of prescription drugs, or any indicator that an individual has sought to circumvent the process. The report is to include the date of the test, the substance(s) found, the circumstances, any proposed mitigation, and the individual\u0027s current employment status. For positive alcohol tests, unless already on a targeted testing programme, ONR need only be notified once an individual has tested positive twice within a five-year period.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the dutyholder\u0027s drug and alcohol testing arrangements explicitly include the reporting requirement to ONR via UKSV where tests are positive or where the individual has sought to circumvent arrangements."
                                             ]
                     },
                     {
                         "id":  "8.3.7",
                         "principleId":  "8.3",
                         "title":  "Removal of access rights on leaving or role change",
                         "controlText":  "The dutyholder\u0027s arrangements should include a process to remove access rights to particular buildings or the site as a whole when someone ceases to be a member of the workforce or if their role or access requirements change, and any change to an individual\u0027s access rights should be acted upon immediately.\n\nA clearance will cease to be valid when there is no longer a dutyholder to sponsor it, and will lapse when the holder resigns, retires, is dismissed or comes to the end of a contract (reinstatable within twelve months if a period remains within the clearance lifetime). This information is also relevant to maintaining the integrity of local security records and access control systems.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)"
                     },
                     {
                         "id":  "8.3.8",
                         "principleId":  "8.3",
                         "title":  "Maintaining NSVS record accuracy",
                         "controlText":  "The dutyholder is required to follow processes to help ensure the ongoing accuracy of the National Security Vetting Solution (NSVS) and to report directly to UKSV using the appropriate NSVS template, including lapsing clearances via the leaver reporting facility in real time.\n\nReportable items include changes in an NSV holder\u0027s employment type (staff to contractor or vice-versa), downgrading a clearance to a lower level where the higher level is no longer required (with downgrade to BPSS reflected as a leaver), and reinstatement requests within twelve months of a clearance lapsing. Where a lapse may indicate a potential security concern, this should be identified within the notification.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether there is a process to report information that affects the clearance record on the NSVS to ONR/UKSV."
                                             ]
                     },
                     {
                         "id":  "8.3.9",
                         "principleId":  "8.3",
                         "title":  "Reporting dismissal, suspension or exclusion",
                         "controlText":  "The dutyholder is required to immediately inform ONR through the submission of an AIR of the dismissal, suspension or exclusion of an individual, clearly stating the employment action taken or being taken.\n\nONR will then consider whether the dismissal or exclusion may be due to behaviours that are incompatible with the Statement of HMG Personnel Security and National Security Vetting Policy and any consequence for the individual\u0027s national security vetting clearance.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)"
                     },
                     {
                         "id":  "8.3.10",
                         "principleId":  "8.3",
                         "title":  "Interdepartmental cooperation and overseas travel",
                         "controlText":  "Effective ongoing personnel security arrangements involve close cooperation between Human Resources (including welfare), Occupational Health and Personnel Security departments so that any information of potential security significance is passed to the Personnel Security Manager, and the dutyholder is required to ensure that overseas travel arrangements for NSV holders comply with the Personnel Security Policy (PSP).\n\nWhere medical matters may have security significance, Occupational Health departments should refer to the \u0027Limitations\u0027 section in the TAG on Responsibility for Delivering Vetting and Personnel Security Arrangements. The PSP guidance provides advice on appropriate briefing arrangements for overseas travel.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)",
                         "promptQuestions":  [
                                                 "Whether the relevant dutyholder departments, i.e., Security, HR, OH and line managers (including those in the contractor community), recognise which events have the potential to raise a security concern and/or which require reporting to ONR/UKSV through the NSVS AIR facility, to establish the ongoing suitability of the individual to continue holding an NSV clearance."
                                             ]
                     },
                     {
                         "id":  "8.3.11",
                         "principleId":  "8.3",
                         "title":  "Reporting concerning behaviours and managing caveats",
                         "controlText":  "The dutyholder should facilitate the reporting to ONR (through the NSVS AIR or CPC portal) of matters affecting NSV clearance holders that suggest incompatibility with the expected behaviours in the Statement of HMG Personnel Security and National Security Vetting Policy, applying a proportionate risk assessment, and their arrangements must be capable of effectively managing any caveats applied and ensuring all relevant parties are notified.\n\nReportable matters include serious criminal offences, relevant illnesses, disciplinary issues, financial difficulties, general changes (new partner, divorce, change of name, co-resident) and nationality changes. Changes in circumstances should be subject to a proportionate risk assessment, mindful that seemingly minor matters can be a security concern. Concerns may be addressed through the application of caveats (the most frequently used are listed in the TAG), and anything of security interest on a shared clearance is to be raised through the AIR process.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)"
                     },
                     {
                         "id":  "8.3.12",
                         "principleId":  "8.3",
                         "title":  "Line manager briefing and remote/overseas working",
                         "controlText":  "The dutyholder\u0027s arrangements should allow for line managers, including those in the supply chain, to be briefed and updated on their responsibilities, and should adequately cover remote and overseas working for members of the workforce who work away from the organisation\u0027s main site.\n\nThis should include circulating relevant documents at appropriate intervals, for example the Line Manager\u0027s Guide in the PSP, and taking account of the NPSA document \u0027Remote and Overseas Working\u0027.",
                         "controlTextLabel":  "SyDP 8.3 expectation (CNS-TAST-GD-8.3)"
                     },
                     {
                         "id":  "9.1.1",
                         "principleId":  "9.1",
                         "title":  "Acknowledge CNC statutory role and liaise",
                         "controlText":  "Dutyholders should understand and acknowledge the statutory responsibilities of the Civil Nuclear Constabulary (CNC) and liaise closely on tactical and operational policing matters with other dutyholders who have a call on the same complement of CNC.",
                         "controlTextLabel":  "SyDP 9.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.1.2",
                         "principleId":  "9.1",
                         "title":  "Integrated policing plans and command/control",
                         "controlText":  "Dutyholders should participate fully in a process to create and maintain integrated plans covering operational and tactical policing matters, clarifying command and control arrangements during a security event, and maintain a Service Level Agreement, memorandum of understanding or similar covering commercial and contractual obligations with the CNC.\n\nThese plans should be based upon a shared understanding of risks and threats with the CNC, relevant police forces and other dutyholders sharing the same CNC complement, and inform performance management activity.",
                         "controlTextLabel":  "SyDP 9.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.1.3",
                         "principleId":  "9.1",
                         "title":  "Facilitate and support CNC operations",
                         "controlText":  "Dutyholders should facilitate and support CNC operational activity (including training and exercising) required to deliver their contribution to the relevant physical protection system outcome, and provide an appropriate level of support to the CNC and other police forces under the Coordinated Policing Protocol.",
                         "controlTextLabel":  "SyDP 9.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.2.1",
                         "principleId":  "9.2",
                         "title":  "Acknowledge local police statutory role",
                         "controlText":  "Dutyholders should understand and acknowledge the statutory responsibilities of the relevant local police force(s).",
                         "controlTextLabel":  "SyDP 9.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.2.2",
                         "principleId":  "9.2",
                         "title":  "Integrated plans with local police",
                         "controlText":  "Dutyholders should participate fully in a process to create and maintain integrated plans covering tactical and operational policing matters with local police forces, clarifying command and control arrangements during a security event, and facilitate and support their operational activity (including training and exercising).\n\nThe plans should be based upon a shared understanding of risks and threats and the capability of the relevant police force to respond.",
                         "controlTextLabel":  "SyDP 9.2 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.3.1",
                         "principleId":  "9.3",
                         "title":  "Resourced, integrated guard services",
                         "controlText":  "Dutyholders should establish arrangements such that security guard services are appropriately resourced, fully integrated with the wider security, safety and event response (including clarity over command and control arrangements), and driven by a shared understanding of threat and vulnerability assessments.",
                         "controlTextLabel":  "SyDP 9.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.3.2",
                         "principleId":  "9.3",
                         "title":  "SLA underpins guard service delivery",
                         "controlText":  "The operations of security guard services should be underpinned by a Service Level Agreement, contract of employment or similar, covering commercial and contractual obligations to maintain service delivery at all Government Response Levels, shift resilience, and defined metrics that inform performance management.",
                         "controlTextLabel":  "SyDP 9.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "9.3.3",
                         "principleId":  "9.3",
                         "title":  "Facilitate and support guard operations",
                         "controlText":  "Dutyholders should facilitate and support security guard service operational activity (including training and exercising) required to deliver their contribution to the relevant physical protection system outcome.",
                         "controlTextLabel":  "SyDP 9.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.1",
                         "principleId":  "10.1",
                         "title":  "Threat-driven CT measures and EP\u0026R planning",
                         "controlText":  "Counter terrorism measures and EP\u0026R planning for nuclear security events should be driven by threat assessments and the Design Basis Threat (DBT), incorporating security contingency planning, immediate response, event and consequence management, situational awareness, and effective command, control and communications, with an appropriate incremental response to changes in the government response level system.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.2",
                         "principleId":  "10.1",
                         "title":  "Contingency plan integrated with site emergency plans",
                         "controlText":  "The dutyholder\u0027s arrangements should be set out primarily in a nuclear security contingency plan (or similar) which forms part of the security plan but is integrated with other site emergency plans to deliver a coherent, timely and effective response.\n\nPlanning should be driven by the legal requirement, threat assessments, the DBT, and the assets to be protected from theft and sabotage.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.3",
                         "principleId":  "10.1",
                         "title":  "Event management strategies to restore control",
                         "controlText":  "Dutyholders should develop nuclear security event management strategies to manage escalation and restore control, with the ultimate aim of returning the facility and/or site to a stable, safe and secure state.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.4",
                         "principleId":  "10.1",
                         "title":  "Integrated procedures, roles and responsibilities",
                         "controlText":  "Plans and procedures should define all the roles, responsibilities and procedural support needed for an effective response, be fully integrated with supporting agencies participating in their design and acceptance, and be readily available through effective storage arrangements in security event conditions.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.5",
                         "principleId":  "10.1",
                         "title":  "Robust, maintained response infrastructure",
                         "controlText":  "The infrastructure, systems and equipment identified for the delivery of emergency arrangements should be of appropriate robustness, suitably maintained and tested, and readily available at all times, with emergency operating procedures written recognising the practical difficulties that could be encountered in security event conditions.\n\nExamples of practical difficulties include adversary action, radiation levels, poor lighting, access issues and communication system failures.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.1.6",
                         "principleId":  "10.1",
                         "title":  "Beyond-DBT and long-lasting events catered for",
                         "controlText":  "The EP\u0026R arrangements should be designed to consider severe security events beyond the Design Basis Threat, cater for long-lasting nuclear security events (including severe local infrastructure disruption), and, on multi-facility sites, describe how resources will be shared across the site.",
                         "controlTextLabel":  "SyDP 10.1 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.2.1",
                         "principleId":  "10.2",
                         "title":  "Effective programme to test and exercise the SCP",
                         "controlText":  "The dutyholder should demonstrate within their security plan how they maintain an effective programme to test and exercise the Security Contingency Plan (SCP).\n\nMaintenance of an exercise programme, stringent self-evaluation via post security contingency exercise reports and decisively acting on lessons identified are key indicators of a dutyholder\u0027s understanding of the importance of an effective security response. Security response drills should be undertaken regularly if staff and contractors are to be familiar with procedures, the actions to be taken and their responsibilities in the event of a real or suspected NSE.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Does the security plan define an effective REDE delivery process and training programme for the Site Emergency Organisation (SEO)?"
                                             ]
                     },
                     {
                         "id":  "10.2.2",
                         "principleId":  "10.2",
                         "title":  "Training programme for the SEO",
                         "controlText":  "The dutyholder should deliver a training programme that ensures members of the Site Emergency Organisation (SEO) are trained and remain competent as suitably qualified and experienced persons (SQEP) for their role under the SCP, demonstrates SEO integration and interoperability to deliver the required PPS Response and Required Effect, and conducts an appropriate combination of \u0027live\u0027 and \u0027table-top\u0027 Security Contingency Exercises (SCXs) at regular intervals throughout the year.\n\nThe training programme should demonstrate SEO integration and interoperability in order to deliver the required PPS Response and Required Effect in an effective and timely manner, with SCXs conducted at regular intervals comparable to safety exercise activities and, wherever possible, including off-site first responders.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Are all relevant stakeholders involved in the exercise and training programme planning process?"
                                             ]
                     },
                     {
                         "id":  "10.2.3",
                         "principleId":  "10.2",
                         "title":  "Assurance regime for exercises and training",
                         "controlText":  "The dutyholder should implement an assurance regime for SCXs and associated training so that activities are recorded at individual and collective level and performance is assessed and reviewed objectively and documented, with good practice and learning points incorporated into the SCP and used to inform future training needs and plans.\n\nPerformance should be assessed and reviewed objectively and documented, with good practice and learning points incorporated into the SCP and used to inform future training needs and plans.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Is there an audit in place that records individual and collective training in delivering roles, responsibilities and required effects of the SCP?",
                                                 "Is there an audit of performance assessment of the SEO undertaking SCXs?",
                                                 "Does the security plan require that a formal review of SCXs is undertaken and that good practice and learning points are disseminated to relevant stakeholders?"
                                             ]
                     },
                     {
                         "id":  "10.2.4",
                         "principleId":  "10.2",
                         "title":  "Regular delivery of a REDE",
                         "controlText":  "The dutyholder is expected to deliver a Regulator Evaluated Demonstration Exercise (REDE) on a regular basis; while there is no automatic expectation to demonstrate annually, delivering a \u0027regular\u0027 demonstration (as specified in NISR) is an expectation, and these are a demonstration of capability that should not be used for training or exercising.\n\nRegulatory judgements about the frequency of REDEs are likely to be delivered on a site-by-site basis based on the graded approach and the ONR site inspection team\u0027s analysis. The form of demonstration can be either a full practical REDE or a combination of a tabletop/command-post exercise. Expectations are based on NM/ORM holdings and VAs, the risk and threat profile of the site, outstanding regulatory issues and the adequacy of extant training, testing and exercising arrangements.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)"
                     },
                     {
                         "id":  "10.2.5",
                         "principleId":  "10.2",
                         "title":  "REDE planning process",
                         "controlText":  "The dutyholder should deliver a planning process that secures agreement from the appropriate ONR inspector for an observed \u0027live play\u0027 or \u0027table-top\u0027 REDE in a timely manner, ensures the CNC (where deployed) give prior agreement to the date, conducts an initial planning meeting no less than six months before the exercise, ensures all elements of the SEO plus a meaningful proportion of the workforce are exercised, produces an exercise instruction reaching ONR no later than four weeks before the exercise, and undertakes a review meeting no later than six months after the REDE.\n\nThe initial planning meeting (excluding exercise participants) should be attended by the ONR security inspector and/or ONR emergency preparedness and response security inspector, with draft objectives and success criteria forwarded beforehand and, where appropriate, a CNC representative and other relevant internal and external stakeholders attending.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Is there a structured and informed planning process to facilitate a REDE?"
                                             ]
                     },
                     {
                         "id":  "10.2.6",
                         "principleId":  "10.2",
                         "title":  "Objectives, success criteria and scenarios",
                         "controlText":  "The dutyholder should maintain a record/matrix to ensure all aspects of the SCP are exercised against relevant threats within a reasonable period, and ensure the objectives, success criteria and scenario for the SCX are agreed with ONR in advance; objectives and success criteria should be decided first and applied to a scenario that is challenging, reflects multiple aspects of the SCP, challenges the Command, Control and Communication (C3) of the SEO, and is driven by the required security outcome of the PPS as defined in Annex C and D of SyAPs.\n\nScenarios should fully expose security contingency planning and response to a NSE, require participation at all levels from OPERATIONAL first responders to TACTICAL command roles, consider previous REDEs (using differing DBT actors than previous demonstrations unless required by ONR), and be agreed by all stakeholders. Suggested objectives include maintaining situational understanding, mobilising and directing resources, mitigating threats, receiving off-site first responders, preserving a crime scene, notifying external agencies, and recording events and decisions for investigations.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Are a range of SCX scenarios, objectives and success criteria developed that are specific to the site characteristics?"
                                             ]
                     },
                     {
                         "id":  "10.2.7",
                         "principleId":  "10.2",
                         "title":  "Phased response demonstration",
                         "controlText":  "The dutyholder could consider a flexible, phased approach to demonstrate a range of capabilities in responding to an NSE across immediate response (Phase 1), event management (Phase 2) and consequence management (Phase 3).\n\nPhase 1 (Immediate Response) demonstrates operational capability against a credible threat, involving the CNC (where deployed), the Civilian Guard Force, local police first responders and all C3 elements of the SEO. Phase 2 (Event Management) demonstrates effective management of the event integrated with supporting agencies. Phase 3 (Consequence Management) demonstrates post-incident recovery and crime scene management, typically exercised via a table-top exercise.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Does the security plan ensure that the dutyholder\u0027s REDE and SCXs demonstrate their arrangements across the immediate response, event management and consequence management phases of a response to a NSE?"
                                             ]
                     },
                     {
                         "id":  "10.2.8",
                         "principleId":  "10.2",
                         "title":  "Malicious actors drawn from the UKDBT",
                         "controlText":  "The dutyholder should include malicious capabilities drawn from the extant United Kingdom Design Basis Threat (UKDBT), identifying malicious actor(s) with target objectives that accord with the category of the site, and ensure REDEs are conducted using \u0027live-play\u0027 malicious actors whose scenario(s) properly reflect the consequence of compromise (theft and sabotage) of the NM/ORM/VAs and facilities on the site.\n\nThe arrangements should demonstrate that the Physical Protection System (PPS) Response and Required Effect can consistently and effectively be delivered to achieve the required security outcome. On sites required to meet PPS Outcome 4, a malicious presence on site may not be required and, subject to approval from ONR, the malicious actor could be simulated.",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Does the security plan require realistic SCX scenarios that reflect relevant UKDBT capabilities and the required PPS Response and Required Effect for the site?"
                                             ]
                     },
                     {
                         "id":  "10.2.9",
                         "principleId":  "10.2",
                         "title":  "Maintaining site security during exercises",
                         "controlText":  "The dutyholder should ensure the security of the site is maintained whilst the REDE and associated training is being conducted.\n\nMeasures that could be considered include compensating for the abstraction of personnel attending training by deploying additional SQEP staff to undertake their roles, and developing temporary security plans, where appropriate, for approval by ONR before any activity takes place (for example, for buildings left insecure post-evacuation).",
                         "controlTextLabel":  "SyDP 10.2 expectation (CNS-TAST-GD-10.2)",
                         "promptQuestions":  [
                                                 "Does the security plan ensure that the PPS of the site and key facilities is maintained throughout a SCX /REDE?"
                                             ]
                     },
                     {
                         "id":  "10.3.1",
                         "principleId":  "10.3",
                         "title":  "Robust, resilient command and control capability",
                         "controlText":  "Dutyholders should establish a robust and resilient command, control and communications capability, integrated with all relevant stakeholders, including as appropriate a central alarm station, emergency control room, main control room and security force control centre.\n\nThe on-site emergency control room should be located to minimise the likelihood of its non-availability due to the event, and dutyholders should be capable of delivering emergency management from any location where movement is limited.",
                         "controlTextLabel":  "SyDP 10.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.3.2",
                         "principleId":  "10.3",
                         "title":  "Coordinated multi-facility arrangements",
                         "controlText":  "On multi-facility sites, appropriate command, control and communication arrangements should be put in place to ensure a coordinated response where one or more such centres are provided.",
                         "controlTextLabel":  "SyDP 10.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.3.3",
                         "principleId":  "10.3",
                         "title":  "Integrated post-event recovery",
                         "controlText":  "Dutyholders should plan to facilitate and support an integrated multi-agency post-event recovery, including the management of post-event crime scenes in support of the CNC, local police and other deployed agencies and responders.",
                         "controlTextLabel":  "SyDP 10.3 expectation (SyAPs 2022 master)"
                     },
                     {
                         "id":  "10.3.4",
                         "principleId":  "10.3",
                         "title":  "Strategic centre coordination",
                         "controlText":  "Where strategic centres are provided (on or off site), the security plan should recognise the need for coordinated interactions to support responding agencies during nuclear security events, to receive information and briefings, and to support the response with government.",
                         "controlTextLabel":  "SyDP 10.3 expectation (SyAPs 2022 master)"
                     }
                 ]
};
