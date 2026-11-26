/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-2-1-2010/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-2-1-2010"] = window.App.Data.instruments["iec-62443-2-1-2010"] || {};
window.App.Data.instruments["iec-62443-2-1-2010"].instrument = {
    "id":  "iec-62443-2-1-2010",
    "title":  "ISA/IEC 62443-2-1:2010 CSMS Assessment",
    "framework":  "ISA/IEC 62443-2-1",
    "edition":  "2010 (BS IEC 62443-2-1:2011)",
    "family":  "iec-62443",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "csms-conformance",
    "scoringProfileRef":  "csms-conformance",
    "targetDimension":  "site",
    "targetDimensionLabel":  "Site",
    "status":  "active-skeleton",
    "framing":  "ISA/IEC 62443-2-1:2010 defines the elements of a Cyber Security Management System (CSMS) for industrial automation and control systems. The elements sit in element groups within three categories: risk analysis, addressing risk with the CSMS, and monitoring and improving the CSMS. This is the older edition, and it is still used where existing programmes were built against it. The 2024 edition reorganises the content into a maturity-based security program. This assessment judges conformance for each element and does not rate maturity.",
    "sourceNote":  "Category / element-group / element structure extracted and verified from BS IEC 62443-2-1:2011 held in the project. Element titles are verified; assessor framing is paraphrased; \u0027verbatimText\u0027 and \u0027otLens\u0027 slots are empty for the licence holder to populate. Source: BS IEC 62443-2-1:2011 (copyright IEC/BSI).",
    "categories":  [
                       {
                           "id":  "CAT-RA",
                           "name":  "Risk analysis",
                           "summary":  "This category covers the business case for security and the identification, classification and assessment of risks to the IACS, which together justify and shape the CSMS."
                       },
                       {
                           "id":  "CAT-ADDR",
                           "name":  "Addressing risk with the CSMS",
                           "summary":  "This category covers the main body of the CSMS, including the security policy and organisation, the selected security countermeasures and their implementation."
                       },
                       {
                           "id":  "CAT-MON",
                           "name":  "Monitoring and improving the CSMS",
                           "summary":  "This category covers keeping the CSMS effective over time through conformance checks and periodic review, improvement and maintenance."
                       }
                   ],
    "elementGroups":  [
                          {
                              "id":  "EG-POL",
                              "categoryId":  "CAT-ADDR",
                              "name":  "Security policy, organization and awareness",
                              "summary":  "This group covers the organisational basis of the CSMS, including its scope, how security is organised, training and awareness, business continuity, and the policies and procedures."
                          },
                          {
                              "id":  "EG-CM",
                              "categoryId":  "CAT-ADDR",
                              "name":  "Selected security countermeasures",
                              "summary":  "This group covers the protective controls, including personnel security, physical and environmental security, network segmentation, and access control through account administration, authentication and authorisation."
                          },
                          {
                              "id":  "EG-IMPL",
                              "categoryId":  "CAT-ADDR",
                              "name":  "Implementation",
                              "summary":  "This group covers putting the CSMS into practice through risk management and implementation, system development and maintenance, information and document management, and incident planning and response."
                          }
                      ],
    "requirements":  [
                         {
                             "id":  "E422",
                             "code":  "4.2.2",
                             "title":  "Business rationale",
                             "categoryId":  "CAT-RA",
                             "elementGroupId":  null,
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The organisation has set out the business case for the CSMS, explaining why security matters to it and what is at stake.",
                             "rationale":  "A CSMS without a clear business case struggles for funding and priority and is among the first things cut under pressure. Setting out why security matters to the business gives the programme its mandate."
                         },
                         {
                             "id":  "E423",
                             "code":  "4.2.3",
                             "title":  "Risk identification, classification and assessment",
                             "categoryId":  "CAT-RA",
                             "elementGroupId":  null,
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Risks to the IACS are identified, classified and assessed, giving the picture of risk that the rest of the CSMS responds to.",
                             "rationale":  "An organisation cannot address risks it has not identified, and without a picture of risk, effort goes wherever the loudest voice points. Risk assessment justifies and shapes every control the CSMS selects."
                         },
                         {
                             "id":  "E4322",
                             "code":  "4.3.2.2",
                             "title":  "CSMS scope",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-POL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The scope of the CSMS is defined, stating which systems, sites and assets it covers.",
                             "rationale":  "Where the CSMS scope is undefined, some systems end up treated as someone else\u0027s responsibility. A defined scope means the programme covers what it should, with no important system left outside by default."
                         },
                         {
                             "id":  "E4323",
                             "code":  "4.3.2.3",
                             "title":  "Organizing for security",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-POL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Roles, responsibilities and accountability for the CSMS are assigned.",
                             "rationale":  "When nobody is organised to own security, it falls into the gap between IT and engineering, which is the most common weakness in OT. Assigning named owners means the tasks of the CSMS get done."
                         },
                         {
                             "id":  "E4324",
                             "code":  "4.3.2.4",
                             "title":  "Staff training and security awareness",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-POL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Staff receive security training and awareness suited to their roles and to the OT environment.",
                             "rationale":  "Controls depend on people doing the right thing, and OT staff need awareness material written for their environment. Training turns policy into the day-to-day behaviour that protects the system."
                         },
                         {
                             "id":  "E4325",
                             "code":  "4.3.2.5",
                             "title":  "Business continuity plan",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-POL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "A business continuity plan is maintained so that essential operations can continue, or recover, through disruption.",
                             "rationale":  "A continuity plan lets essential operations keep going through disruption without improvising in a crisis. In OT, where the disruption may be physical, planning ahead can keep an event contained."
                         },
                         {
                             "id":  "E4326",
                             "code":  "4.3.2.6",
                             "title":  "Security policies and procedures",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-POL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security policies and procedures are in place and direct how security work is done.",
                             "rationale":  "Policies and procedures record, in advance, how the organisation will protect the IACS, so that it does so consistently. Without them, protection depends on individual memory and varies by person and shift."
                         },
                         {
                             "id":  "E4332",
                             "code":  "4.3.3.2",
                             "title":  "Personnel security",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Personnel security is managed, including vetting and the handling of people in security-relevant roles.",
                             "rationale":  "People in security-relevant roles hold trust that can be abused, and contractors and vendors often have deep access to OT. Personnel security gives assurance that people granted sensitive access have been vetted and managed appropriately."
                         },
                         {
                             "id":  "E4333",
                             "code":  "4.3.3.3",
                             "title":  "Physical and environmental security",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS equipment and locations have physical and environmental protection.",
                             "rationale":  "Physical access often bypasses technical controls altogether, because someone at the cabinet can do what no network control would allow. Much of the rest of the CSMS relies on physical and environmental security."
                         },
                         {
                             "id":  "E4334",
                             "code":  "4.3.3.4",
                             "title":  "Network segmentation",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The network is segmented to separate the IACS from other networks and limit how far a compromise can spread.",
                             "rationale":  "Segmentation limits how far a compromise can spread from the routes attackers usually use, and it is one of the most effective controls in OT. On a flat network, a single foothold can reach the whole environment."
                         },
                         {
                             "id":  "E4335",
                             "code":  "4.3.3.5",
                             "title":  "Access control: Account administration",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Accounts are administered through their lifecycle, from creation through change to removal.",
                             "rationale":  "Accounts that are created and never managed build up into a standing risk, with dormant logins and those of former staff left active for years. Disciplined account administration keeps the list of people who can log in in line with the people who should."
                         },
                         {
                             "id":  "E4336",
                             "code":  "4.3.3.6",
                             "title":  "Access control: Authentication",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Users and devices are authenticated before they are given access.",
                             "rationale":  "Authentication establishes that a user or device is who it claims to be, and the shared logins common in OT undermine it. The rest of access control depends on sound authentication."
                         },
                         {
                             "id":  "E4337",
                             "code":  "4.3.3.7",
                             "title":  "Access control: Authorization",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-CM",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Access is authorised so that authenticated users and devices can do only what their role permits.",
                             "rationale":  "Authentication establishes identity, and authorisation governs what that identity may do. Enforcing authorisation stops a valid or compromised account acting beyond what its role needs."
                         },
                         {
                             "id":  "E4342",
                             "code":  "4.3.4.2",
                             "title":  "Risk management and implementation",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-IMPL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Risk treatment is managed and implemented, turning the results of the risk assessment into controls that are in place.",
                             "rationale":  "A risk assessment protects nothing until its results become controls in place on the system."
                         },
                         {
                             "id":  "E4343",
                             "code":  "4.3.4.3",
                             "title":  "System development and maintenance",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-IMPL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security is applied through system development and maintenance, so that change does not weaken the CSMS.",
                             "rationale":  "Uncontrolled change to systems wears the CSMS down over time and brings back weaknesses the programme had closed. Building security into development and maintenance keeps protection in place as the system changes."
                         },
                         {
                             "id":  "E4344",
                             "code":  "4.3.4.4",
                             "title":  "Information and document management",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-IMPL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Information and documents are managed securely, including their classification, handling and retention.",
                             "rationale":  "Information about the IACS, such as configuration, designs and credentials, helps an attacker if it is mishandled. Managing documents and information securely limits exposure and keeps sensitive material under control."
                         },
                         {
                             "id":  "E4345",
                             "code":  "4.3.4.5",
                             "title":  "Incident planning and response",
                             "categoryId":  "CAT-ADDR",
                             "elementGroupId":  "EG-IMPL",
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Incidents are planned for and responded to through a defined capability.",
                             "rationale":  "Every organisation will face incidents, and one without a planned response has to improvise when there is least time to think. A defined incident capability allows fast, coordinated action, including the OT-specific decisions that an IT plan leaves out."
                         },
                         {
                             "id":  "E442",
                             "code":  "4.4.2",
                             "title":  "Conformance",
                             "categoryId":  "CAT-MON",
                             "elementGroupId":  null,
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Conformance is checked to confirm that the CSMS is followed as intended.",
                             "rationale":  "A CSMS that is assumed to work and never checked drifts out of conformance unnoticed. Conformance checks show whether the programme is followed in practice."
                         },
                         {
                             "id":  "E443",
                             "code":  "4.4.3",
                             "title":  "Review, improve and maintain the CSMS",
                             "categoryId":  "CAT-MON",
                             "elementGroupId":  null,
                             "evidencePrompt":  "Record the documented policy or procedure, the evidence that it is followed, and the basis for your conformance judgement.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The CSMS is reviewed, improved and maintained so that it stays effective as the organisation and the threats change.",
                             "rationale":  "A CSMS that is never reviewed falls out of date as the organisation and the threats around it change. Regular review, improvement and maintenance keep it effective."
                         }
                     ],
    "_contentNote":  "19 CSMS elements across 3 categories and 3 element groups, verified from BS IEC 62443-2-1:2011. Conformance scoring (csms-conformance), not maturity. Paraphrased hint (what it is) and rationale (why it matters) on each; verbatimText and otLens empty for population from the licensed standard.",
    "_editionNote":  "PEER instrument to iec-62443-2-1-2024, not an edition toggle. An engagement uses one edition or the other. 2010 = CSMS element conformance; 2024 = Security Program maturity (SPRs, ML1-4).",
    "targetDimensionLabelPlural":  "Sites"
};
