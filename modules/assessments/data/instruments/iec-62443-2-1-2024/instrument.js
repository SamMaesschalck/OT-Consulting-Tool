/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-2-1-2024/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-2-1-2024"] = window.App.Data.instruments["iec-62443-2-1-2024"] || {};
window.App.Data.instruments["iec-62443-2-1-2024"].instrument = {
    "id":  "iec-62443-2-1-2024",
    "display":  {
                    "standardRef":  "ISA/IEC 62443-2-1:2024",
                    "elementNoun":  "Security Program Element",
                    "elementNounTitle":  "Security Program Element",
                    "elementNounPlural":  "Security Program Elements",
                    "requirementNoun":  "Security Program Requirement",
                    "programmeNoun":  "security programme"
                },
    "title":  "ISA/IEC 62443-2-1:2024 Security Program Assessment",
    "framework":  "ISA/IEC 62443-2-1",
    "edition":  "2024",
    "family":  "iec-62443",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "program-maturity-ml",
    "scoringProfileRef":  "program-maturity-ml",
    "targetDimension":  "site",
    "targetDimensionLabel":  "Site",
    "status":  "active",
    "framing":  "ISA/IEC 62443-2-1:2024 sets out Security Program Requirements (SPRs) for IACS asset owners, grouped into Security Program Elements (SPEs). Each requirement is assessed at a maturity level from ML1 to ML4, and the level required for each one is chosen according to risk. The 2024 edition replaces the CSMS structure of the 2010 edition with a maturity-based security programme.",
    "sourceNote":  "SPE structure and the ML maturity model are extracted and verified from the 62443-2-1:2024 document held in the project. The full per-requirement list (codes, titles, requirement text) is to be populated in a verified extraction pass; theme groups are known but individual requirements are not yet complete. ML anchors are paraphrased (single-user licensed source); not verbatim IEC text. Source: ISA/IEC 62443-2-1:2024 (copyright IEC).",
    "maturityModel":  {
                          "basis":  "CMMI-SVC; MLs apply independently per requirement; documentation required from ML2 upward",
                          "levels":  [
                                         {
                                             "id":  "ML1",
                                             "name":  "Initial",
                                             "anchor":  "The process is performed, but ad hoc and often without full documentation, so it is hard to show that it is done consistently over time.",
                                             "shortAnchor":  "Performed ad hoc, with little or no documentation.",
                                             "readAs":  "ad hoc",
                                             "glossary":  "The process is ad hoc, if it is performed at all, and depends on the individuals involved."
                                         },
                                         {
                                             "id":  "ML2",
                                             "name":  "Managed",
                                             "anchor":  "Written procedures or training describe how to manage and perform the process. Practice is repeatable and follows documented plans. ML2 is the first level that requires documentation.",
                                             "shortAnchor":  "Documented procedures or training, repeatable and managed to plan.",
                                             "readAs":  "documented and repeatable",
                                             "glossary":  "The process is documented and can be repeated. ML2 is the first level that requires documentation."
                                         },
                                         {
                                             "id":  "ML3",
                                             "name":  "Defined / Practiced",
                                             "anchor":  "The ML2 process is actively practised on the IACS, and its performance is shown to repeat over time.",
                                             "shortAnchor":  "Documented process actively practised on the IACS, repeatable over time.",
                                             "readAs":  "actively practised on the IACS",
                                             "glossary":  "The documented process is practised on the industrial automation and control system and is shown to repeat over time."
                                         },
                                         {
                                             "id":  "ML4",
                                             "name":  "Improving",
                                             "anchor":  "Process metrics show that the process is effective or that its performance is improving. The programme improves the process through technical, procedural or management changes.",
                                             "shortAnchor":  "Measured with metrics and improved over time.",
                                             "readAs":  "metrics-driven improvement",
                                             "glossary":  "The process is measured, and the measurements are used to improve it."
                                         }
                                     ],
                          "_display":  "Show these full definitions ONCE in a help/reference panel, not inline on every requirement. The per-requirement selector uses achievedScale.ordered[].short labels only."
                      },
    "elements":  [
                     {
                         "id":  "SPE1",
                         "name":  "Organizational security measures",
                         "themes":  [
                                        "ORG"
                                    ],
                         "summary":  "This element covers the organisational side of the security programme, including governance, roles, risk handling, personnel security, training, the supply chain and physical access. These processes give security named owners and keep it going."
                     },
                     {
                         "id":  "SPE2",
                         "name":  "Configuration management",
                         "themes":  [
                                        "CM"
                                    ],
                         "summary":  "This element covers knowing and controlling the IACS configuration through an accurate asset inventory, current infrastructure documentation, defined configuration settings and change control."
                     },
                     {
                         "id":  "SPE3",
                         "name":  "Network and communications security",
                         "themes":  [
                                        "NET"
                                    ],
                         "summary":  "This element covers segmentation of the IACS network and protection of its communications, including separation from non-IACS and safety networks, zone documentation, external connections, accessible services, wireless and remote access."
                     },
                     {
                         "id":  "SPE4",
                         "name":  "Component security",
                         "themes":  [
                                        "COMP"
                                    ],
                         "summary":  "This element covers securing the components themselves through hardening, control of portable media, malware protection and security patching that works in an OT environment."
                     },
                     {
                         "id":  "SPE5",
                         "name":  "Data security",
                         "themes":  [
                                        "DATA"
                                    ],
                         "summary":  "This element covers protection of the data important to the IACS, including classification, confidentiality, integrity, safety-related configuration data, retention and the use of cryptography."
                     },
                     {
                         "id":  "SPE6",
                         "name":  "User access control",
                         "themes":  [
                                        "USER"
                                    ],
                         "summary":  "This element covers control of access to the IACS by people and systems, including identities and their lifecycle, authentication with MFA, least privilege, sessions and authorisation with separation of duties."
                     },
                     {
                         "id":  "SPE7",
                         "name":  "Event and incident management",
                         "themes":  [
                                        "EVENT"
                                    ],
                         "summary":  "This element covers detecting, recording and acting on events, including event reporting, logging and log access, event analysis, incident response and vulnerability handling."
                     },
                     {
                         "id":  "SPE8",
                         "name":  "System integrity and availability",
                         "themes":  [
                                        "AVAIL"
                                    ],
                         "summary":  "This element covers keeping the IACS running and recoverable through continuity planning, resource availability, safe failure states and backups that are verified and can be restored."
                     }
                 ],
    "themeNames":  {
                       "ORG":  "Organizational security measures",
                       "CM":  "Configuration management",
                       "NET":  "Network and communications security",
                       "COMP":  "Component security",
                       "DATA":  "Data security",
                       "USER":  "User access control",
                       "EVENT":  "Event and incident management",
                       "AVAIL":  "System integrity and availability"
                   },
    "requirements":  [
                         {
                             "id":  "ORG1.1",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.1",
                             "title":  "Information security management system (ISMS)",
                             "evidencePrompt":  "Record whether an ISMS exists and its documented scope, and check whether that scope includes the IACS. Record how the security programme and the ISMS are coordinated where they share interfaces or, if there is no ISMS, how the programme carries the equivalent management processes. Base the ML on how deliberately that coordination is set up and maintained.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "Assess how the programme and the ISMS are coordinated. A certificate on its own proves little. Check that the IACS sits inside a management system with an owned scope, roles and a review cycle, and that the interfaces it shares with corporate IT are managed jointly.",
                                            "gotchas":  "A corporate ISO/IEC 27001 ISMS often excludes the OT environment from its scope, so \"yes, we have an ISMS\" can hide an IACS that no management system covers. The standard\u0027s Annex A cross-references point to ISO/IEC 27001:2013, so mapping to a current 27001:2022 ISMS has to be done by hand."
                                        },
                             "allowNA":  true,
                             "hint":  "Where the organisation already runs an ISMS, often ISO/IEC 27001, the IACS security programme is coordinated with it on scope, ownership, review cycles and shared interfaces such as firewalls, the DMZ and remote access. Where there is no ISMS, the programme carries those management processes itself.",
                             "rationale":  "This requirement links OT security to the management system the organisation already runs. Done well, it keeps the programme from duplicating or contradicting the ISMS and gives IT and OT an agreed interface. Without it, the plant either sits outside the ISMS altogether or is governed by IT rules written without availability and safety in mind."
                         },
                         {
                             "id":  "ORG1.2",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.2",
                             "title":  "Background checks",
                             "evidencePrompt":  "Record the vetting policy and evidence that it is applied to contractors and vendor staff as well as employees. Check whether checks are done before access is granted and how third-party staff are covered. Base the ML on how consistently and how early vetting is done for everyone with access.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Everyone is vetted before they get IACS access, including employees, contractors, subcontractors, consultants and supplier staff. Where the law allows, vetting includes identity verification and criminal record checks.",
                             "rationale":  "Most OT compromise starts with legitimate access, so the choice of who is allowed near the plant matters as much as any technical control. Vendors and contractors often get the deepest access with the least scrutiny, and background checks are meant to close that gap."
                         },
                         {
                             "id":  "ORG1.3",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.3",
                             "title":  "Security roles and responsibilities",
                             "evidencePrompt":  "Record the documented security roles and who holds them, and check that each person is competent for the role. Record how responsibilities extend to third parties. Base the ML on whether roles are named, understood and kept up to date.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security responsibilities are defined and assigned to people qualified to hold them, both employees and third parties, so each one has a named owner.",
                             "rationale":  "When roles are vague, OT security comes down to whatever one committed engineer does, and it lapses when that person leaves. Assigned responsibilities keep the programme running through staff turnover and shift changes."
                         },
                         {
                             "id":  "ORG1.4",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.4",
                             "title":  "Security awareness training",
                             "evidencePrompt":  "Record the awareness training content, its audience and how often it is refreshed, with records showing that contractors and vendor staff take part. Base the ML on coverage, how current the training is and whether completion is tracked.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Everyone who works on the IACS, contractors and vendor staff included, receives general cyber security awareness training that is refreshed on a schedule.",
                             "rationale":  "Awareness training is the cheapest control that reaches the most people. In OT those people include contractors and operators, who are frequent targets of phishing and social engineering. One-off or IT-only training leaves the plant floor exposed."
                         },
                         {
                             "id":  "ORG1.5",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.5",
                             "title":  "Security responsibilities training",
                             "evidencePrompt":  "Record the role-specific training provided or accepted for each IACS security responsibility, and check that it matches the roles defined under ORG 1.3. Base the ML on whether people are trained for the duties they hold and how that is checked.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "People receive training for the IACS security duties of their role, or training they already hold is formally accepted. This is in addition to general awareness training.",
                             "rationale":  "An operator, an engineer and a vendor technician each need different security skills, and general awareness training does not provide them. Role-specific training gives people the skills to carry out the responsibilities assigned to them."
                         },
                         {
                             "id":  "ORG1.6",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 1.6",
                             "title":  "Supply chain security",
                             "evidencePrompt":  "Record the security requirements set for suppliers and where they appear, such as contracts, RFQs and purchase orders, and check whether suppliers must pass them on to their own suppliers. Base the ML on how consistently requirements are set and whether supplier conformance is followed up.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Cyber security requirements are set for suppliers of products and services and, where possible, suppliers must pass equivalent requirements on to their own suppliers.",
                             "rationale":  "Most OT equipment, and much of its maintenance, comes through a supply chain the asset owner does not control, so the requirements placed on that chain set the level of protection. Passing requirements down matters because the risk often sits two or three tiers away, with a sub-supplier the owner never deals with."
                         },
                         {
                             "id":  "ORG2.1",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 2.1",
                             "title":  "Security risk mitigation",
                             "evidencePrompt":  "Record the risk method, a current risk register or equivalent, the defined tolerable risk level, and evidence that risks above it are being treated. Base the ML on whether risk management is a repeated, current practice or a one-off document.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS cyber security risks are identified, documented and treated against a defined tolerable risk level, and anything above that level is acted on.",
                             "rationale":  "The rest of the programme exists to reduce risk, and without an owned method for judging what is tolerable, control decisions become arbitrary. In OT the tolerable level has to account for safety and availability as well as data loss, which sets it apart from an IT risk register."
                         },
                         {
                             "id":  "ORG2.2",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 2.2",
                             "title":  "Processes for discovery of security anomalies",
                             "evidencePrompt":  "Record how and how often anomaly discovery is done, covering unauthorised components, unexpected traffic and undocumented vulnerabilities, with examples of findings and the follow-up. Base the ML on whether discovery is scheduled and its findings acted on.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The asset owner periodically searches, manually or with tools, for undocumented or unauthorised devices and software, unexpected network traffic, new vulnerabilities and other anomalies.",
                             "rationale":  "OT environments drift. Rogue laptops, forgotten remote links and equipment added without record go unseen unless someone looks for them. Regular discovery finds the difference between the documented system and the real one before an attacker does."
                         },
                         {
                             "id":  "ORG2.3",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 2.3",
                             "title":  "Secure development and support",
                             "evidencePrompt":  "Record whether a secure development lifecycle exists for in-house development and support, and how it is applied. Where development is outsourced, record how the requirement is placed on suppliers. Base the ML on how formal the lifecycle is and how consistently it is followed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Systems and components that the asset owner develops or supports itself follow a secure development lifecycle, and the same is expected of what it buys in.",
                             "rationale":  "Where the asset owner develops or maintains its own IACS software, it faces the same secure development weaknesses as vendors do. A defined lifecycle stops locally built tools and integrations becoming the easiest way in."
                         },
                         {
                             "id":  "ORG2.4",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 2.4",
                             "title":  "SP reviews",
                             "evidencePrompt":  "Record how often the programme is reviewed, what the review covers and the improvements made as a result. Base the ML on whether reviews are regular, cover substance and lead to closed actions.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The security programme is reviewed on a schedule to check that it is applied, that its controls still meet the security requirements and that it keeps up with organisational, technical and threat changes. The findings are used to improve it.",
                             "rationale":  "A programme that is never reviewed falls behind as the plant, the organisation and the threats change. Periodic review keeps the documentation in line with what happens on site and stops maturity slipping back unnoticed."
                         },
                         {
                             "id":  "ORG3.1",
                             "elementId":  "SPE1",
                             "theme":  "ORG",
                             "code":  "ORG 3.1",
                             "title":  "Physical access control",
                             "evidencePrompt":  "Record how physical access to IACS areas, equipment and cabling is controlled and monitored, and check that it reflects the assessed risk. Base the ML on whether physical controls are defined, enforced and matched to the sensitivity of what they protect.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Physical access to IACS facilities, equipment and cabling is controlled to meet the asset owner\u0027s risk targets.",
                             "rationale":  "In OT, physical access usually means full access. A USB port, a console, a spare switch port or an exposed cable run can bypass segmentation and authentication altogether. Controlling who can reach the equipment is one of the most effective protections available."
                         },
                         {
                             "id":  "CM1.1",
                             "elementId":  "SPE2",
                             "theme":  "CM",
                             "code":  "CM 1.1",
                             "title":  "Asset inventory baseline",
                             "evidencePrompt":  "Record the inventory and how it is maintained, and test its completeness against what is on the network. Base the ML on accuracy, coverage and whether change keeps the baseline current after it is first built.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "An inventory baseline of every IACS device and hardware and software component, protocol and open port is built and maintained for the whole lifecycle. It records ownership, make, model, versions, serial numbers and network details.",
                             "rationale":  "Patching, segmentation, incident response and most other parts of the programme depend on the asset inventory. In OT it is also the hardest thing to get right, because legacy equipment, undocumented additions and passive-only visibility all get in the way of a complete record."
                         },
                         {
                             "id":  "CM1.2",
                             "elementId":  "SPE2",
                             "theme":  "CM",
                             "code":  "CM 1.2",
                             "title":  "Infrastructure drawings/documentation",
                             "evidencePrompt":  "Record the current drawings and documentation and check them against the real topology. Base the ML on how accurate they are and how well they are maintained, especially after changes.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Current drawings and documentation show the physical and logical connectivity of every IACS device and software component, and they match the live system.",
                             "rationale":  "Out-of-date network diagrams can be worse than none, because people rely on them during an incident when there is no time to check. Accurate connectivity documentation lets staff make segmentation decisions and respond to incidents under pressure."
                         },
                         {
                             "id":  "CM1.3",
                             "elementId":  "SPE2",
                             "theme":  "CM",
                             "code":  "CM 1.3",
                             "title":  "Configuration settings",
                             "evidencePrompt":  "Record the documented configuration baselines and the process for checking running systems against them. Base the ML on whether the checks are routine and whether drift is found and corrected.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Configuration settings for IACS devices and applications are documented, and the running configuration is checked against them to detect drift or tampering.",
                             "rationale":  "Configuration that is undocumented and unchecked is where drift and compromise both go unnoticed. Comparing live settings with a documented baseline gives evidence that a system is configured as intended."
                         },
                         {
                             "id":  "CM1.4",
                             "elementId":  "SPE2",
                             "theme":  "CM",
                             "code":  "CM 1.4",
                             "title":  "Change control",
                             "evidencePrompt":  "Record the change control workflow and records of changes that went through it, and check whether separation of duties is applied. Base the ML on how consistently changes are authorised, validated and documented.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Changes to the configuration baseline, drawings and documentation, including revision and patch levels, are authorised, validated and approved through a change control process. The good practice target is that different people make, check and approve each change.",
                             "rationale":  "Uncontrolled change is the most common way an OT system moves away from its known good state, whether the change is well meant or malicious. Change control keeps the inventory, drawings and baselines accurate over time."
                         },
                         {
                             "id":  "NET1.1",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.1",
                             "title":  "Segmentation from non-IACS zones",
                             "evidencePrompt":  "Record how the IACS is segmented from non-IACS zones, which interconnections exist and the justification for each. Base the ML on how few, how well documented and how well enforced the interconnections are.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS is segmented from non-IACS zones, and interconnections are kept to the minimum the operation needs within tolerable risk.",
                             "rationale":  "Most external threats have to cross the IT/OT boundary, so a small number of controlled, well-understood interconnections is one of the strongest protections available. On a flat or loosely connected network, an attacker who gets in anywhere has a clear path to the process."
                         },
                         {
                             "id":  "NET1.2",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.2",
                             "title":  "Documentation of zones and network zone interconnections",
                             "evidencePrompt":  "Record the zone and conduit baseline with its risk and trust designations, and check it against the deployed architecture. Base the ML on how complete, accurate and well maintained that baseline is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "A baseline is maintained of all IACS zones and their interconnections or conduits, with the risk attached to each and whether each is trusted or untrusted.",
                             "rationale":  "Zones and conduits protect the IACS only if the asset owner knows where they are and which can be relied on. Recording the trust designation of each interconnection shows where an attacker could move and where monitoring is needed."
                         },
                         {
                             "id":  "NET1.3",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.3",
                             "title":  "Network segmentation from safety systems",
                             "evidencePrompt":  "Record how the safety system network is separated from other networks and how the separation is enforced and verified. Flag any path by which a non-safety device could affect the SIS. Base the ML on the strength of the separation and the assurance behind it. Mark not applicable if there is no safety system network.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where a safety system network exists, it is protected from interference by non-safety networks and devices, so that ordinary network faults and attacks cannot reach the safety instrumented systems.",
                             "rationale":  "Safety systems are the last protection before physical harm. A path from a compromised control or business network to the safety system turns a possible outage into a possible injury. Interference can be dangerous even when nobody intends harm."
                         },
                         {
                             "id":  "NET1.4",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.4",
                             "title":  "Network autonomy",
                             "evidencePrompt":  "Record how the IACS behaves when isolated from external networks and whether it keeps to the intended operating modes. Base the ML on how well autonomy is designed, tested and understood.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS keeps operating as designed when cut off from external networks, whether that means normal running, restricted operation, safe shutdown or a fail-safe state.",
                             "rationale":  "If removing the external connection stops the process, disconnection cannot be used as a defence, and that is one of the most effective responses to an active attack. Building autonomy into the design keeps the option open."
                         },
                         {
                             "id":  "NET1.5",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.5",
                             "title":  "Network disconnection from external networks",
                             "evidencePrompt":  "Record the means and procedure for disconnecting from external networks, who can trigger it and in what circumstances. Base the ML on whether the capability is defined, rehearsed and ready to use.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS can be disconnected from external networks to protect itself or those networks when a threat is confirmed or suspected.",
                             "rationale":  "During an attack, cutting external connections cleanly can keep an incident contained. This works only if the mechanism exists, people know about it and it can be used quickly."
                         },
                         {
                             "id":  "NET1.6",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.6",
                             "title":  "Internal network access control",
                             "evidencePrompt":  "Record how communication between internal segments is controlled and how its risks are assessed and treated. Base the ML on how deliberately internal flows are restricted and reviewed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Risks from communication between internal IACS segments are identified, documented and treated against a tolerable level, in the same way as risks at the external boundary.",
                             "rationale":  "Once an attacker is inside, internal segmentation stops one compromised device leading to the whole plant. Managing internal flows as risks, with no implicit trust, limits lateral movement."
                         },
                         {
                             "id":  "NET1.7",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.7",
                             "title":  "Network accessible services",
                             "evidencePrompt":  "Record how network-accessible services are inventoried and protected from unauthorised access. Base the ML on how well the exposure is understood and controlled.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Network-accessible services are known and protected from unauthorised network access.",
                             "rationale":  "Every exposed service is a possible way in, and OT systems collect listening services that nobody remembers enabling. Restricting access to them reduces the attack surface directly."
                         },
                         {
                             "id":  "NET1.8",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.8",
                             "title":  "User messaging",
                             "evidencePrompt":  "Record how messaging on IACS networks is prevented from carrying active or executable content. Base the ML on how consistently that restriction is applied.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "User-to-user messages on IACS networks cannot carry content such as attachments, links or scripts that could be used to attack the IACS.",
                             "rationale":  "Messaging that can carry executable content becomes a delivery route for malware. On OT networks, where endpoints are fragile and slow to patch, that route is worth closing."
                         },
                         {
                             "id":  "NET1.9",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 1.9",
                             "title":  "Network time distribution",
                             "evidencePrompt":  "Record how time is sourced, distributed and protected across the IACS. Base the ML on how reliable and trustworthy the time source and distribution are.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Trusted time is distributed and synchronised across the IACS, so logs can be correlated and time-dependent security functions work.",
                             "rationale":  "Without synchronised time, logs from different systems cannot be pieced together into an account of an incident, and time-dependent security functions fail. Detection and response both depend on a trusted time source."
                         },
                         {
                             "id":  "NET2.1",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 2.1",
                             "title":  "Wireless protocols",
                             "evidencePrompt":  "Record whether wireless is authorised, which protocols are allowed, and the documented baseline and security features for each. Where wireless is not used, record that. Base the ML on how deliberately wireless use is decided and documented.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The asset owner decides whether wireless is used in the IACS and which industry-accepted protocols are authorised. Each authorised protocol is documented with its baseline configuration, data exchanges between segments and security features. Not authorising wireless at all is a valid answer.",
                             "rationale":  "Wireless removes the physical barrier that protects much of OT, so using it has to be a conscious, documented decision. Knowing which protocols are allowed is the starting point for securing or excluding them."
                         },
                         {
                             "id":  "NET2.2",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 2.2",
                             "title":  "Wireless network segmentation",
                             "evidencePrompt":  "Record how authorised wireless is segmented from other IACS segments. Base the ML on the strength of that separation. Mark not applicable if wireless is not authorised.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where wireless is authorised, it is segmented from other IACS network segments and treated as a zone of its own.",
                             "rationale":  "Wireless can be reached from outside the site fence, so a wireless segment connected directly to control networks gives an attacker a way past physical and perimeter controls. Segmenting it contains that exposure."
                         },
                         {
                             "id":  "NET2.3",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 2.3",
                             "title":  "Wireless properties and addresses",
                             "evidencePrompt":  "Record how authorised wireless is configured to limit the information it exposes. Base the ML on how deliberately that hardening is applied. Mark not applicable if wireless is not authorised.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where wireless is authorised, its properties and network addresses are set to give attackers as little useful information as possible.",
                             "rationale":  "Wireless networks broadcast, so default names, revealing addresses and verbose configurations help anyone in range plan an attack. Limiting that information makes the network harder to target."
                         },
                         {
                             "id":  "NET3.1",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 3.1",
                             "title":  "Remote access applications",
                             "evidencePrompt":  "Record which remote access applications are authorised and how that is enforced. Base the ML on how tightly the set of tools is controlled. Mark not applicable if remote access is not authorised.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where remote access is used, it is limited to commonly accepted remote access applications suited to the purpose.",
                             "rationale":  "Remote access is one of the most common routes into OT, and each extra vendor tool adds to the risk. Limiting the applications in use is the first step in controlling the channel."
                         },
                         {
                             "id":  "NET3.2",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 3.2",
                             "title":  "Remote access connections",
                             "evidencePrompt":  "Record how remote connections are authorised, authenticated, encrypted, logged and monitored, and check the documentation for each connection. Base the ML on how completely and consistently these controls are applied. Mark not applicable if remote access is not authorised.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where remote access is used, every interactive remote connection is authorised, authenticated, encrypted, documented, logged and monitored. The record for each connection gives its purpose, tools, encryption and authentication.",
                             "rationale":  "Remote access lets an outside party operate on the plant, so each connection has to be accountable from end to end. Logging and monitoring let the asset owner supervise remote sessions and reconstruct them later."
                         },
                         {
                             "id":  "NET3.3",
                             "elementId":  "SPE3",
                             "theme":  "NET",
                             "code":  "NET 3.3",
                             "title":  "Remote access termination",
                             "evidencePrompt":  "Record the inactivity timeout for remote sessions and how it is enforced. Base the ML on whether sessions are reliably ended automatically. Mark not applicable if remote access is not authorised.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where remote access is used, interactive remote sessions end automatically after a set period of inactivity.",
                             "rationale":  "An idle remote session is an unattended way in, and OT sessions are often left connected for convenience. Ending them automatically closes that gap without relying on people to remember."
                         },
                         {
                             "id":  "COMP1.1",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 1.1",
                             "title":  "Component hardening",
                             "evidencePrompt":  "Record the hardening standards used, evidence that they are applied before deployment, and how the hardened state is maintained and documented. Base the ML on how consistently hardening is applied and whether it survives maintenance.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Components are hardened before they go into the IACS and stay hardened for their whole life, and the hardening applied is documented.",
                             "rationale":  "Each unused service, open port and default setting left in place is a possible way in, and OT components ship with many of them. Hardening each device, and keeping it hardened through maintenance, is one of the most direct protections available."
                         },
                         {
                             "id":  "COMP1.2",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 1.2",
                             "title":  "Dedicated portable media",
                             "evidencePrompt":  "Record the portable media policy and the technical controls that enforce approved and prohibited uses. Base the ML on how clearly and strictly media use is controlled.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The asset owner defines which uses and functions of portable media are approved or prohibited in the IACS.",
                             "rationale":  "USB sticks and other removable media have carried some of the most damaging OT infections because they cross air gaps that networks cannot. A clear decision on what is allowed is the control for that route."
                         },
                         {
                             "id":  "COMP2.1",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 2.1",
                             "title":  "Malware free",
                             "evidencePrompt":  "Record how components and media are checked for malware before use, and the tools or process used. Base the ML on how consistently the check is done and recorded.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Components, and portable media where its use is authorised, are checked for known malware before they are used in the IACS.",
                             "rationale":  "Equipment and media can arrive already infected from a supplier, a staging area or a technician\u0027s laptop. Once inside the IACS, the infection is far harder and costlier to catch, so the check before use is the last cheap opportunity."
                         },
                         {
                             "id":  "COMP2.2",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 2.2",
                             "title":  "Malware protection",
                             "evidencePrompt":  "Record where malware protection is deployed, where it is not feasible and why, and what compensates for the gaps. Base the ML on coverage of the systems where it is feasible and how the rest are handled.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Malware protection is installed, running and maintained wherever it is feasible. Where a device cannot host it, other measures compensate.",
                             "rationale":  "Anti-malware software is standard in IT but only partly usable in OT, where controllers and legacy hosts often cannot run it. The requirement is to protect what can be protected and to record the gaps honestly."
                         },
                         {
                             "id":  "COMP2.3",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 2.3",
                             "title":  "Malware protection software validation and installation",
                             "evidencePrompt":  "Record how anti-malware updates are tested, approved and rolled out, and how quickly. Base the ML on whether updates are both controlled and current.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Malware protection software and its signature updates are tested for compatibility, approved and installed promptly after release.",
                             "rationale":  "Signature and engine updates pushed straight onto OT hosts have caused outages of their own, so automatic updating without testing is unsafe. Out-of-date protection does little, so updates have to be both tested and timely."
                         },
                         {
                             "id":  "COMP3.1",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 3.1",
                             "title":  "Security patch authenticity/integrity",
                             "evidencePrompt":  "Record how the authenticity and integrity of patches are verified before installation. Base the ML on whether verification is routine and covers every patch.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Patches are checked for authenticity and integrity before installation, confirming their source and that they have not been altered in transit.",
                             "rationale":  "A patch is code with deep access, so a forged or altered patch leads directly to compromise. Checking authenticity and integrity first stops the update process being used for an attack."
                         },
                         {
                             "id":  "COMP3.2",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 3.2",
                             "title":  "Security patch validation and installation",
                             "evidencePrompt":  "Record the patch testing, approval and deployment process, typical timescales and how operational windows are used. Base the ML on how controlled and how current patching is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security patches are tested for compatibility, approved and installed in good time after release, scheduled around operational windows.",
                             "rationale":  "Patching a running plant can disrupt it, so patches have to be tested and scheduled. Leaving known vulnerable components unpatched indefinitely is also a hazard. The requirement is for a disciplined, timely process."
                         },
                         {
                             "id":  "COMP3.3",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 3.3",
                             "title":  "Security patch status",
                             "evidencePrompt":  "Record how patch status is recorded and kept current for every component. Base the ML on how complete and current that record is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The security patch status of every component is documented and kept current, showing what is patched, what is not and what has been deferred.",
                             "rationale":  "The asset owner cannot judge its exposure without knowing each component\u0027s patch level. An up-to-date patch status record turns patching into a managed risk decision."
                         },
                         {
                             "id":  "COMP3.4",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 3.4",
                             "title":  "Security patching retention of security",
                             "evidencePrompt":  "Record how the security state of a component is checked after patching to confirm nothing was weakened. Base the ML on whether this check is routine.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "After a security patch is installed, the component is checked to confirm the patch has not reduced its security, for example by re-enabling services or resetting hardening.",
                             "rationale":  "Patches sometimes undo hardening or restore default settings, so a component can be weaker after a patch that was meant to fix it. A check after patching catches this."
                         },
                         {
                             "id":  "COMP3.5",
                             "elementId":  "SPE4",
                             "theme":  "COMP",
                             "code":  "COMP 3.5",
                             "title":  "Security patch mitigation",
                             "evidencePrompt":  "Record how the risk of not patching is assessed and how cases above the tolerable level are mitigated and recorded. Base the ML on whether decisions to defer are deliberate, justified and documented.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where a patch will not be installed, the risk of leaving it out is assessed. If that risk is not tolerable, it is treated another way and the treatment is documented.",
                             "rationale":  "Much of OT cannot be patched on a normal timetable, so the discipline lies in deciding, for each unpatched vulnerability, whether the remaining risk is acceptable and how to mitigate it if not. Deferrals that nobody records are how known vulnerabilities stay open for years."
                         },
                         {
                             "id":  "DATA1.1",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.1",
                             "title":  "Data classification",
                             "evidencePrompt":  "Record the data classification scheme and how IACS data has been classified under it. Base the ML on how complete the classification is and how consistently it is applied.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "All IACS data that needs protecting is identified and classified according to its protection requirements.",
                             "rationale":  "Data cannot be protected in proportion to its value until someone has decided what matters and how much. In OT, classification has to consider the integrity and availability of operational and safety data as well as confidentiality, which IT-style schemes often overlook."
                         },
                         {
                             "id":  "DATA1.2",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.2",
                             "title":  "Data confidentiality",
                             "evidencePrompt":  "Record how confidentiality is protected for each classification of data. Base the ML on whether protection matches the classification and is applied consistently.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The confidentiality of IACS data is protected in line with its classification and the risk of disclosure.",
                             "rationale":  "Some OT data, such as network diagrams, control logic and credentials, is exactly what an attacker needs to plan an attack. Protecting it in line with its classification denies the attacker that information."
                         },
                         {
                             "id":  "DATA1.3",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.3",
                             "title":  "Safety system configuration mode",
                             "evidencePrompt":  "Record how the safety configuration mode is controlled, who can enable it and when, and how the system is returned to its run state. Flag any way configuration could be changed with the mode disabled. Base the ML on the strength of that control. Mark not applicable if there are no safety systems.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where safety systems are used, safety configuration can be changed only while configuration mode is enabled, and the mode is enabled only when a change is needed.",
                             "rationale":  "A safety system that can be reconfigured at any time can be pushed into a dangerous state, whether by an attacker or by mistake. Allowing changes only in a deliberately enabled mode protects safety directly."
                         },
                         {
                             "id":  "DATA1.4",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.4",
                             "title":  "Data retention policy",
                             "evidencePrompt":  "Record the retention policy, including purging, and how it is applied through the data lifecycle. Base the ML on whether retention and disposal are managed deliberately.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS data retention is managed across the whole lifecycle, and data that is no longer needed is purged securely.",
                             "rationale":  "Data kept indefinitely becomes a liability, and data purged carelessly can leak operational detail through decommissioned equipment and media. A retention policy puts both keeping and disposing of data under control."
                         },
                         {
                             "id":  "DATA1.5",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.5",
                             "title":  "Cryptographic mechanisms",
                             "evidencePrompt":  "Record where cryptographic mechanisms are used, whether they are current and accepted, and how OT constraints affected the choices. Base the ML on whether the mechanisms suit their use and are applied consistently.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Commonly accepted cryptographic mechanisms are used in the IACS where they are warranted, chosen with the performance and compatibility limits of OT devices in mind.",
                             "rationale":  "Cryptography protects data and authenticates the parties to a connection. OT devices vary widely in what they can support, and forcing cryptography onto them can disrupt real-time behaviour. The requirement is for accepted mechanisms used where they fit."
                         },
                         {
                             "id":  "DATA1.6",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.6",
                             "title":  "Key management",
                             "evidencePrompt":  "Record how keys are generated, protected, rotated and retired. Base the ML on how disciplined key management is. Mark not applicable if keyed cryptography is not used.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where keyed cryptography is approved, the keys are managed through their use, protection and enforced lifetime, following practices accepted in both the industrial and security communities.",
                             "rationale":  "Encryption is only as strong as its keys, and badly stored or never-rotated keys are a common failure that often goes unnoticed. Without sound key management, the cryptographic controls give little protection."
                         },
                         {
                             "id":  "DATA1.7",
                             "elementId":  "SPE5",
                             "theme":  "DATA",
                             "code":  "DATA 1.7",
                             "title":  "Data integrity",
                             "evidencePrompt":  "Record how the integrity of data at rest and in transit is protected and how tampering would be detected. Base the ML on coverage and on how well integrity is protected where it matters most.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The integrity of IACS data, at rest and in transit, is protected against electronic and physical compromise in line with the risks. In OT this often matters more than keeping data secret.",
                             "rationale":  "In control systems, altered data can drive wrong actions with physical consequences, so integrity often comes before confidentiality. Operators can trust what the system reports and does only if integrity is protected and tampering can be detected."
                         },
                         {
                             "id":  "USER1.1",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.1",
                             "title":  "User identity assignment",
                             "evidencePrompt":  "Record how identities are assigned to human users, software processes and devices. Base the ML on how consistently each one receives its own identity and how well identities are managed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS-specific identifiers, authenticators and roles are assigned to every user, where users include people, software processes and devices.",
                             "rationale":  "Accountability starts with identity. OT has many shared and anonymous accounts that make it impossible to say who did what. Separate identities for people, services and devices are the basis for all access control."
                         },
                         {
                             "id":  "USER1.2",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.2",
                             "title":  "User identity removal",
                             "evidencePrompt":  "Record the joiner, mover and leaver process for IACS access and evidence that access is removed in practice, including for contractors and services. Base the ML on how promptly and reliably access is revoked.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Identifiers, authenticators, roles and access rights are removed or disabled promptly for any user, service or device that no longer needs access.",
                             "rationale":  "Orphaned accounts are a common way in, and OT environments often leave old operator, contractor and vendor accounts active long after they are needed. Removing them promptly reduces that standing exposure."
                         },
                         {
                             "id":  "USER1.3",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.3",
                             "title":  "User identity persistence",
                             "evidencePrompt":  "Record how essential operational accounts are protected from automatic disabling while still being controlled. Base the ML on whether the trade-off between lockout controls and operational availability has been worked through.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Identities and access rights that essential operations depend on, such as operator accounts, are set up so they are not disabled automatically.",
                             "rationale":  "Controls that disable accounts automatically can lock operators out at the worst moment, and in OT that is a safety and availability problem. This requirement protects the accounts the process cannot run without."
                         },
                         {
                             "id":  "USER1.4",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.4",
                             "title":  "Access rights assignment",
                             "evidencePrompt":  "Record how access rights are granted, reviewed periodically and removed. Base the ML on whether entitlement management is an ongoing practice with evidence behind it.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Access rights are assigned to and removed from IACS roles and users through a defined process, and reviewed so they stay matched to what each role needs.",
                             "rationale":  "Access builds up as people change jobs, and entitlements that are never reviewed grow beyond what people need. A regular assignment and review cycle keeps rights in line with current duties."
                         },
                         {
                             "id":  "USER1.5",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.5",
                             "title":  "Least privilege",
                             "evidencePrompt":  "Record how least privilege is applied and checked against the tasks each role performs. Base the ML on how tightly and how routinely privilege is kept to the minimum.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Users, including services and devices, hold only the access rights they need for their assigned tasks.",
                             "rationale":  "Excess access makes any compromise worse, and OT accounts often hold far more privilege than their tasks require. Limiting rights to what is needed reduces the harm that mistakes and attacks can do."
                         },
                         {
                             "id":  "USER1.6",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.6",
                             "title":  "Software service authentication",
                             "evidencePrompt":  "Record how software services are identified and authenticated before they run. Base the ML on how consistently service authentication is enforced.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Software services are identified and authenticated before they run.",
                             "rationale":  "An unauthenticated service lets malicious code pass itself off as a legitimate function. Authenticating services before they run removes that route."
                         },
                         {
                             "id":  "USER1.7",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.7",
                             "title":  "Software services interactive login rights",
                             "evidencePrompt":  "Record how interactive login is denied to service accounts. Base the ML on how consistently this is enforced across services.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Software services cannot log in interactively, so a service account cannot be used to open a session for a person.",
                             "rationale":  "Service accounts with interactive login rights are a well-known way for attackers to gain a foothold under a trusted identity. Removing those rights closes it."
                         },
                         {
                             "id":  "USER1.8",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.8",
                             "title":  "Human user authentication",
                             "evidencePrompt":  "Record which interfaces people can use and how each one authenticates them, including application and remote interfaces. Base the ML on how complete the authentication coverage is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Every human user is identified and authenticated on every interface they can use to reach the IACS, including device logins, application interfaces such as web services, file transfer and OPC, and remote desktop.",
                             "rationale":  "Every unauthenticated interface allows anonymous access, and OT systems expose many interfaces beyond the console login. Covering all of them is needed for full accountability."
                         },
                         {
                             "id":  "USER1.9",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.9",
                             "title":  "Multifactor authentication (MFA)",
                             "evidencePrompt":  "Record where MFA is used for remote interactive login and for devices in public areas. Base the ML on coverage of those entry points and the strength of the second factor.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Multifactor authentication is used for remote interactive login to devices that support it, and for devices in publicly accessible areas.",
                             "rationale":  "Stolen single credentials do the most damage at remote and publicly reachable logins, and these are the points this requirement covers. MFA there makes a stolen password far less useful to an attacker."
                         },
                         {
                             "id":  "USER1.10",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.10",
                             "title":  "Mutual authentication",
                             "evidencePrompt":  "Record where mutual authentication is used for access to servers. Base the ML on how widely and how well it is applied.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Access to server applications hosted on IACS devices, including web servers, uses mutual authentication, so the server proves its identity as well as the client.",
                             "rationale":  "With one-way authentication, a client can be fooled by an impostor server, which opens the way to interception and spoofing. Mutual authentication stops clients connecting to a fake service."
                         },
                         {
                             "id":  "USER1.11",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.11",
                             "title":  "Password protection",
                             "evidencePrompt":  "Record the password rules in force and where device limitations restrict them. Base the ML on how consistently strong password practice is applied across the systems in use.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Where passwords are used, complexity, lifetime and reuse rules make them harder to compromise, within what each OT device supports.",
                             "rationale":  "Passwords are still the norm in much of OT, including on devices with real limitations, so the practical aim is to make them as strong as each device allows. Weak, shared and never-changed passwords are among the most exploited weaknesses in OT."
                         },
                         {
                             "id":  "USER1.12",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.12",
                             "title":  "Shared and disclosed/compromised passwords",
                             "evidencePrompt":  "Record how shared passwords are managed and how disclosed or compromised passwords are handled and changed. Base the ML on whether the process exists and has been used.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "There is a process for managing shared passwords and for changing and containing passwords that are disclosed or compromised.",
                             "rationale":  "Shared passwords are common in OT and rarely changed, so one disclosure can expose many systems at once. A defined response to a compromised password limits the damage."
                         },
                         {
                             "id":  "USER1.13",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.13",
                             "title":  "User login display information",
                             "evidencePrompt":  "Record whether and how login information is shown to users to help them detect misuse. Base the ML on how useful and consistent that information is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Users are shown login information, such as details of their last login, so they can spot use of their account that was not theirs.",
                             "rationale":  "The account holder is often the first person able to recognise misuse, provided the system shows enough to notice it. Showing recent login details gives the asset owner a cheap means of detection."
                         },
                         {
                             "id":  "USER1.14",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.14",
                             "title":  "User login failure displays",
                             "evidencePrompt":  "Record what is shown when a login fails and whether it avoids giving away useful detail. Base the ML on how consistently that feedback is kept minimal.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "After a failed login, the system shows as little as possible that would help an attacker, and does not say whether the username or the password was wrong.",
                             "rationale":  "Detailed failure messages let attackers find valid accounts and refine their guesses. Keeping failure messages uninformative slows that reconnaissance."
                         },
                         {
                             "id":  "USER1.15",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.15",
                             "title":  "Consecutive login failures",
                             "evidencePrompt":  "Record the lockout threshold and behaviour, and how they are weighed against operational access needs. Base the ML on whether the control is in place and sensibly set.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Accounts are locked after a set number of consecutive failed logins, for a defined period or until an administrator unlocks them, with the threshold weighed against operational risk.",
                             "rationale":  "Unlimited login attempts allow brute-force guessing, while aggressive lockout can deny an operator access when it is needed. The requirement is for a threshold chosen with the operational context in mind."
                         },
                         {
                             "id":  "USER1.16",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.16",
                             "title":  "Session integrity",
                             "evidencePrompt":  "Record how sessions are protected against hijacking and modification. Base the ML on the strength and coverage of those protections.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "User sessions are protected from hijacking and unauthorised modification once established.",
                             "rationale":  "An authenticated session is a trusted channel. If it can be hijacked or altered, the authentication that opened it counts for little. Protecting session integrity keeps the session trustworthy until it ends."
                         },
                         {
                             "id":  "USER1.17",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.17",
                             "title":  "Concurrent sessions",
                             "evidencePrompt":  "Record the limits on concurrent sessions for each interface and how they are enforced. Base the ML on whether limits are set and work.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The number of concurrent sessions any single user, service or device can hold on each interface is limited.",
                             "rationale":  "Without a limit, a stolen identity can be used in many places at once, which also makes detection harder. Limiting concurrent sessions restricts misuse and makes anomalies easier to spot."
                         },
                         {
                             "id":  "USER1.18",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.18",
                             "title":  "Screen lock",
                             "evidencePrompt":  "Record the screen lock policy, the need to re-authenticate, and where locking is disabled on purpose because of operational risk. Base the ML on how well those decisions are reasoned and applied.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Screens lock on request or after a set idle period and need re-authentication to unlock, except where locking would create greater risk to the IACS, such as an operator who needs immediate control.",
                             "rationale":  "An unattended, unlocked HMI is easy to misuse, but a screen that locks at the wrong moment can block an urgent operator action. The requirement allows exceptions where locking would increase risk, a judgement specific to OT."
                         },
                         {
                             "id":  "USER1.19",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 1.19",
                             "title":  "Component authentication",
                             "evidencePrompt":  "Record how connected components are identified and authenticated. Base the ML on how consistently component authentication is applied across the IACS.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "All components connected to the IACS are identified and authenticated before they are trusted on the network.",
                             "rationale":  "Without component authentication, rogue or spoofed devices can join the network and be trusted, which gives direct access to control networks. Authenticating components keeps unknown equipment out."
                         },
                         {
                             "id":  "USER2.1",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 2.1",
                             "title":  "Authorization",
                             "evidencePrompt":  "Record how systems enforce the access rights that have been assigned, beyond recording them. Base the ML on how consistently authorisation is enforced.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The access rights assigned to each user are enforced by the systems they use.",
                             "rationale":  "Rights that are assigned and not enforced exist only on paper, and OT systems often let an authenticated user do far more than their role allows. Least privilege and role assignment take effect on the running system only when the rights are enforced."
                         },
                         {
                             "id":  "USER2.2",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 2.2",
                             "title":  "Separation of duties",
                             "evidencePrompt":  "Record where separation of duties is applied and how concentration of privilege is avoided. Base the ML on how deliberately duties are separated for sensitive functions.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Duties are separated so that no single IACS user holds more privilege than needed and no one person can carry out sensitive functions alone.",
                             "rationale":  "Concentrated privilege makes insider abuse and the compromise of a single account far more dangerous. Separating duties limits what any one identity can do alone, whether its owner is honest or the account has been taken over."
                         },
                         {
                             "id":  "USER2.3",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 2.3",
                             "title":  "Multiple approvals",
                             "evidencePrompt":  "Record which high-impact actions need more than one approval and how the safety exception is defined. Base the ML on how well the control and its exception are set. Mark not applicable if there are no such actions.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Actions that could seriously affect the industrial process need approval from two or more users, except where not acting could cause greater harm.",
                             "rationale":  "For actions that could damage the process or hurt people, a second approver guards against both error and coercion. Under the safety exception, an approval step never stops a necessary protective action."
                         },
                         {
                             "id":  "USER2.4",
                             "elementId":  "SPE6",
                             "theme":  "USER",
                             "code":  "USER 2.4",
                             "title":  "Manual elevation of privileges",
                             "evidencePrompt":  "Record how privilege elevation and overrides are made explicit and logged. Base the ML on whether elevation is deliberate and traceable.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Any operation that needs elevated rights, including supervisor overrides, requires the user to elevate privilege explicitly, with no silent or standing elevation.",
                             "rationale":  "Standing elevated privilege is a large risk that is easy to overlook, and overrides that leave no trace cannot be controlled or reviewed. Explicit elevation keeps high-privilege actions visible and accountable."
                         },
                         {
                             "id":  "EVENT1.1",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.1",
                             "title":  "Event detection",
                             "evidencePrompt":  "Record how security events are detected, logged, analysed and responded to from start to finish. Base the ML on how well the steps connect and how often they are used.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Detected IACS security events are reported, logged, analysed and responded to, immediately or later, so security management has the information it needs. The other requirements in this element expand on this one.",
                             "rationale":  "An organisation cannot respond to events it never detects, and OT has historically had little visibility of security events. When detection, logging and response work together, a compromise that would have gone unseen becomes an incident that can be managed."
                         },
                         {
                             "id":  "EVENT1.2",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.2",
                             "title":  "Event reporting",
                             "evidencePrompt":  "Record how, how quickly and to whom security events are reported. Base the ML on the timeliness and reliability of reporting.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS security events reach the people and systems that need them quickly enough for them to act.",
                             "rationale":  "A detected event that is never reported might as well have gone undetected, and in OT a delay can let an incident spread. Timely reporting makes the rest of the response possible."
                         },
                         {
                             "id":  "EVENT1.3",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.3",
                             "title":  "Event reporting interfaces",
                             "evidencePrompt":  "Record the interfaces used to report security events and how well they connect to monitoring and SOC tools. Base the ML on how standard and usable those interfaces are.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security events are reported through interfaces commonly accepted in the industrial and security communities.",
                             "rationale":  "Common interfaces let OT events feed into wider monitoring and IT security operations without fragile custom integration. Standard interfaces allow detection to extend beyond a single system."
                         },
                         {
                             "id":  "EVENT1.4",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.4",
                             "title":  "Logging",
                             "evidencePrompt":  "Record what is logged, how logs are protected and how long they are kept. Base the ML on coverage, protection and whether retention is long enough.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS security events are written to one or more event or audit logs that are protected from tampering and kept for an adequate period.",
                             "rationale":  "Logs are the raw material for detection and investigation. Logs that are unprotected or kept only briefly are missing when an incident has to be reconstructed. Protected, retained logs make later analysis possible."
                         },
                         {
                             "id":  "EVENT1.5",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.5",
                             "title":  "Log entries",
                             "evidencePrompt":  "Record what log entries contain and whether that supports attribution and correlation in time. Base the ML on how complete and analysable the entries are.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Log entries hold enough information to support non-repudiation and analysis across systems by time, recording who or what did what, and when.",
                             "rationale":  "Log entries with too little detail cannot be tied to the people or systems involved or placed in sequence across systems, which makes investigation very difficult. Detailed, time-stamped entries let investigators reconstruct an attack."
                         },
                         {
                             "id":  "EVENT1.6",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.6",
                             "title":  "Log access",
                             "evidencePrompt":  "Record how logs are accessed for analysis and whether the interfaces are standard and practical. Base the ML on how usable log access is in practice.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Security audit and event logs can be accessed for analysis through commonly accepted interfaces.",
                             "rationale":  "Logs that cannot be reached and read by standard means tend to go unused, and then they add nothing to detection or response."
                         },
                         {
                             "id":  "EVENT1.7",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.7",
                             "title":  "Event analysis",
                             "evidencePrompt":  "Record how events are analysed, by whom and how quickly, with examples of incidents that were characterised. Base the ML on whether timely analysis takes place in practice.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "IACS security events are analysed promptly to identify and characterise attacks, compromises and incidents.",
                             "rationale":  "Collected events are of no use until someone interprets them, and timely analysis can catch an intrusion while it is under way. Without it, the intrusion is found only after the damage is done."
                         },
                         {
                             "id":  "EVENT1.8",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.8",
                             "title":  "Incident handling and response",
                             "evidencePrompt":  "Record the incident response process, how current it is and evidence that it is exercised, including OT-specific considerations. Base the ML on how developed and practised the capability is.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "A current, maintained process exists for evaluating and responding to IACS security incidents, adapted to the conditions of OT.",
                             "rationale":  "OT incident response differs from IT because safety and availability come first and taking a system offline may not be possible. A rehearsed process designed for OT keeps the response from making the incident worse."
                         },
                         {
                             "id":  "EVENT1.9",
                             "elementId":  "SPE7",
                             "theme":  "EVENT",
                             "code":  "EVENT 1.9",
                             "title":  "Vulnerability handling",
                             "evidencePrompt":  "Record how vulnerabilities are received, assessed, tracked and resolved or accepted. Base the ML on whether vulnerability handling is systematic and timely.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Existing and newly found IACS vulnerabilities are identified and dealt with promptly, each one tracked until it is resolved or its risk is accepted.",
                             "rationale":  "New vulnerabilities appear all the time, and in OT they often cannot be patched quickly. A process that tracks each one to a decision stops them piling up unmanaged, and it links directly to risk management and patching."
                         },
                         {
                             "id":  "AVAIL1.1",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 1.1",
                             "title":  "Continuity management",
                             "evidencePrompt":  "Record the disaster recovery plan, business continuity plan or both, whether they cover cyber scenarios, and how current and tested they are. Base the ML on how complete, maintained and exercised the plans are.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "A current disaster recovery plan, business continuity plan or both cover disaster scenarios, the handling of failures and how the required level of operational continuity is maintained, with cyber incidents among the scenarios.",
                             "rationale":  "A cyber attack can stop a plant as surely as a fire or flood, and continuity plans written before that was widely recognised often leave it out. A current plan returns the process to a safe, running state after serious disruption."
                         },
                         {
                             "id":  "AVAIL1.2",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 1.2",
                             "title":  "Resource availability management",
                             "evidencePrompt":  "Record how risks from power failure, capacity limits, hardware failure and denial of service are managed, along with the remediation and spares arrangements. Base the ML on how thoroughly these threats to availability are anticipated and covered.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS is protected from failures caused by power problems, capacity or processing overload, hardware faults and deliberate denial of service, with remediation such as device replacement planned in advance.",
                             "rationale":  "Availability is the top priority in OT, and it can be lost to a power failure or an overloaded link as easily as to an attack. Managing these failures, with spares and replacement plans in place, keeps the process running."
                         },
                         {
                             "id":  "AVAIL1.3",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 1.3",
                             "title":  "Failure-state",
                             "evidencePrompt":  "Record the predetermined failure states and how the system is brought to them when a compromise is detected. Base the ML on how well those states are defined, implemented and understood.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "If normal operation cannot continue after a detected security compromise, the IACS goes to a state decided in advance.",
                             "rationale":  "An unplanned collapse after a compromise can be dangerous, while a predetermined safe state protects people and equipment. Defining that state in advance means the safety and availability decision is taken when there is time to think."
                         },
                         {
                             "id":  "AVAIL2.1",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 2.1",
                             "title":  "Backup",
                             "evidencePrompt":  "Record what is backed up, how often and to what recovery point. Base the ML on the coverage and regularity of backups.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS is backed up at regular intervals so it can be recovered to a stable state.",
                             "rationale":  "Backups are the last resort when prevention fails. Without them, OT recovery can mean rebuilding controllers and logic from scratch under pressure. With regular backups, recovery becomes a restore."
                         },
                         {
                             "id":  "AVAIL2.2",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 2.2",
                             "title":  "Backup non-interference",
                             "evidencePrompt":  "Record how the backup process is checked for any effect on normal operation, including timing and resource use. Base the ML on how deliberately that is confirmed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The backup process does not disturb normal IACS operation.",
                             "rationale":  "A backup job that uses too many resources or touches live systems at the wrong time can cause the outage it is meant to help recover from. Confirming that backups do not interfere stops a safeguard becoming a hazard."
                         },
                         {
                             "id":  "AVAIL2.3",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 2.3",
                             "title":  "Backup verification",
                             "evidencePrompt":  "Record how backup integrity is checked when each backup completes and periodically afterwards. Base the ML on whether the check is routine and would catch a bad backup before it is needed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The integrity of backup data is checked when the backup completes and periodically afterwards, to confirm the backup can be used.",
                             "rationale":  "Corrupted or incomplete backups are often discovered only at the moment of recovery, when it is too late. Verification gives confidence that a backup can be relied on."
                         },
                         {
                             "id":  "AVAIL2.4",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 2.4",
                             "title":  "Backup media",
                             "evidencePrompt":  "Record how backup media is stored, protected and kept available, including offsite storage and confidentiality. Base the ML on how well the media is protected.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "Backup media is handled and stored securely, protecting its integrity, authenticity and availability as well as the confidentiality of its contents.",
                             "rationale":  "A backup is a full copy of the system, so badly stored media is a recovery risk and an attractive target for theft. Careful handling protects recovery and stops the backup becoming a source of leaks."
                         },
                         {
                             "id":  "AVAIL2.5",
                             "elementId":  "SPE8",
                             "theme":  "AVAIL",
                             "code":  "AVAIL 2.5",
                             "title":  "Backup restoration",
                             "evidencePrompt":  "Record how restoration is performed and tested, and typical recovery times compared with operational needs. Base the ML on whether restoration is proven, timely and rehearsed.",
                             "verbatimText":  "",
                             "otLens":  {
                                            "framing":  "",
                                            "gotchas":  ""
                                        },
                             "allowNA":  true,
                             "hint":  "The IACS can be restored from backup to a stable state in good time, and restoration is practised.",
                             "rationale":  "A backup that cannot be restored promptly is little better than none, and in OT the recovery time often decides how much an incident costs. Proven, timely restoration limits how long a serious incident keeps the plant down."
                         }
                     ],
    "_requirementsNote":  "Requirement codes/titles extracted and verified from the body of 62443-2-1:2024. Questions are paraphrased assessor prompts (NOT verbatim IEC text); \u0027verbatimText\u0027 slots are empty for the licence holder to populate. OT lens is an empty first-draft slot per requirement for the consultant. ML anchors are paraphrased.",
    "achievedScale":  {
                          "_note":  "ONE control per requirement. Consultant picks one value. \u0027not-met\u0027 is the bottom of the scale; ML1-4 are increasing maturity; \u0027unknown\u0027 and \u0027na\u0027 are non-scoring states shown alongside.",
                          "ordered":  [
                                          {
                                              "value":  "not-met",
                                              "label":  "Not met",
                                              "short":  "Not met",
                                              "scored":  true,
                                              "rank":  0
                                          },
                                          {
                                              "value":  "ML1",
                                              "label":  "ML1",
                                              "short":  "ML1 · ad hoc",
                                              "scored":  true,
                                              "rank":  1
                                          },
                                          {
                                              "value":  "ML2",
                                              "label":  "ML2",
                                              "short":  "ML2 · documented",
                                              "scored":  true,
                                              "rank":  2
                                          },
                                          {
                                              "value":  "ML3",
                                              "label":  "ML3",
                                              "short":  "ML3 · practised",
                                              "scored":  true,
                                              "rank":  3
                                          },
                                          {
                                              "value":  "ML4",
                                              "label":  "ML4",
                                              "short":  "ML4 · improving",
                                              "scored":  true,
                                              "rank":  4
                                          }
                                      ],
                          "nonScoring":  [
                                             {
                                                 "value":  "unknown",
                                                 "label":  "Unknown",
                                                 "effect":  "reduces coverage + confidence; not scored"
                                             },
                                             {
                                                 "value":  "na",
                                                 "label":  "N/A",
                                                 "effect":  "excluded from score and coverage"
                                             }
                                         ]
                      },
    "targetOverlay":  {
                          "enabled":  false,
                          "_note":  "Optional. Off by default. When enabled, each requirement gains an optional target ML (from risk / 62443-3-2). Report then adds achieved-vs-target gap and the roadmap targets shortfalls. When off, the report shows the achieved-ML profile only.",
                          "targetScale":  [
                                              "ML1",
                                              "ML2",
                                              "ML3",
                                              "ML4"
                                          ]
                      },
    "_captureNote":  "One selection per requirement from achievedScale (not-met / ML1-4 / unknown / na). Each requirement shows its title and the maturity selector; no filler question. SPE summaries orient the consultant. Populate \u0027verbatimText\u0027 per requirement from the licensed standard for the full requirement wording. Target ML overlay is optional (per-SPE when enabled).",
    "_hintNote":  "Per-requirement \u0027hint\u0027 is a paraphrased, closely-aligned memory jog in plain language (NOT IEC verbatim). Intended for a collapsible panel. \u0027verbatimText\u0027 remains the slot for authoritative requirement wording from the licensed standard.",
    "_rationaleNote":  "Per-requirement \u0027rationale\u0027 is a plain-language \u0027why this matters\u0027 (2-3 sentences, practitioner voice, OT consequence where relevant). Original explanatory text, not reproduced IEC wording. Companion to \u0027hint\u0027 (what it is) and to the empty \u0027verbatimText\u0027/\u0027otLens\u0027 slots.",
    "targetDimensionLabelPlural":  "Sites"
};
