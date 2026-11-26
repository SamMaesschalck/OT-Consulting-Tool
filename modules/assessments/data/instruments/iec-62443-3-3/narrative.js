/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-3-3/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-3-3"] = window.App.Data.instruments["iec-62443-3-3"] || {};
window.App.Data.instruments["iec-62443-3-3"].narrative = {
    "_note":  "Narrative for the ISA/IEC 62443-3-3 System Security Assessment (capability-sl). Boilerplate is inserted VERBATIM; data lines are composed ONLY by substituting values into the templates. The generator never free-writes prose. fr_narrative carries the per-Foundational-Requirement purpose and why-it-matters text used in the Findings section.",
    "boilerplate":  {
                        "report_intro":  "This report sets out the results of a security assessment against ISA/IEC 62443-3-3, the standard that defines system security requirements and security levels for industrial automation and control systems. For each Foundational Requirement it gives the Security Level achieved against the target and lists the requirements that fell short, in priority order. The report is for management and for the engineering teams who will carry out the remediation.",
                        "about_instrument":  "ISA/IEC 62443-3-3 defines system security requirements grouped into seven Foundational Requirements, each assessed against four Security Levels (SL 1 to SL 4). For each requirement, this assessment records the Security Level the system was shown to achieve and compares it with the target Security Level for the environment. The assessment covers the system as configured and operated. It is not a certification and does not on its own establish conformance.",
                        "security_levels":  "Each Security Level sets the strength of protection needed against a class of threat. SL 1 protects against casual or coincidental violation, SL 2 against intentional violation using simple means, SL 3 against sophisticated means with moderate resources, and SL 4 against sophisticated means with extended resources. The achieved Security Level for a Foundational Requirement is that of its weakest applicable requirement. Scores are not averaged, so one shortfall holds the level down.",
                        "method":  "Each requirement was assessed against the target Security Level using the evidence available at the time, from configuration review, interviews and observation. The achieved Security Level reflects what could be demonstrated. Stated intent or documentation alone did not count. [Consultant to confirm or adjust this description so it matches how the assessment was run.]",
                        "how_to_read":  "Each Foundational Requirement shows the Security Level achieved against its target. The achieved level is that of the weakest applicable requirement within it, so a Foundational Requirement meets its target only when every applicable requirement in it does. Requirements assessed as not applicable are excluded, and requirements not assessed are reported separately. Closeness figures give context and do not change the achieved Security Level. A requirement is floor-flagged when it is at SL 0 against a positive target, or two or more levels below target. Floor-flagged requirements are listed as priorities.",
                        "limitations":  "This assessment describes the system at the time of the engagement, based on the evidence available then. It cannot predict how the system will behave under all conditions, and it does not certify the system against ISA/IEC 62443. Requirements that could not be assessed are listed and counted as neither met nor unmet, because their status is unknown. Findings should be confirmed during remediation.",
                        "not_certification_caveat":  "This assessment measures the system, as configured and operated, against ISA/IEC 62443-3-3. It records the Security Level each Foundational Requirement was shown to achieve against its target, taking the level of the weakest applicable requirement. It does not certify the system and does not on its own establish conformance with ISA/IEC 62443. The achieved Security Levels reflect what could be demonstrated at the time of the engagement and should be confirmed during remediation.",
                        "series_context":  "ISA/IEC 62443 is a series of standards whose parts are divided by who is responsible for what. The 2-x parts apply to the organisation that runs the system, and 62443-2-1 sets out the security programme it is expected to operate. The 3-x parts cover the system itself. 62443-3-2 divides it into zones and conduits and gives each a target Security Level based on risk, and 62443-3-3, used for this assessment, defines what a system must do to reach those levels. The 4-x parts apply to the products the system is built from. 62443-4-1 covers how a supplier develops them, and 62443-4-2 covers the security capability of an individual component. This report covers 62443-3-3 only. It takes the zones, conduits and target Security Levels as given and reports what each of them achieves."
                    },
    "templates":  {
                      "scope_assessed_line":  "{assessedCount} of 7 Foundational Requirements were assessed, and {notAssessedCount} were not assessed in this engagement.",
                      "default_target_flag":  "All Foundational Requirements were assessed against the default target of {targetSL}. No Foundational Requirement had a separate target.",
                      "na_clause":  ", with {naCount} requirement(s) not applicable",
                      "fr_result_assessed":  "FR{frNum} {frName} achieved {achievedSL} against a target of {targetSL}, meeting {metCount} of {applicableCount} applicable requirement(s){naClause}.",
                      "fr_not_assessed":  "FR{frNum} {frName} was not assessed in this engagement.",
                      "fr_all_met":  "All applicable requirements in this Foundational Requirement met their target Security Level.",
                      "fr_shortfall_intro":  "The following requirements fell short of the target Security Level:",
                      "fr_shortfall_item":  "{srCode} {srTitle}: achieved {achievedSL} against target {targetSL}.",
                      "fr_floor_note":  "{floorCount} requirement(s) in this Foundational Requirement are floor-flagged and should be treated as priorities."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only; boilerplate inserted VERBATIM; consultant blocks seeded with data-derived facts plus a marked placeholder. No free-writing. SL aim: the Security Level each Foundational Requirement achieves against its target, set by the weakest applicable requirement, with floor findings as priorities. Order: verdict, scope_and_profile, gap_shape, weakest-link + stakes, path_forward + confidence.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that the control system at {clientName} {verdictPhrase}, with the weakest protection in {weakestFRName}. The roadmap in this report concentrates on the requirements that fall short of the target Security Level.",
                                               "exec_verdict_nogaps":  "This assessment finds that the control system at {clientName} {verdictPhrase}.",
                                               "exec_scope":  "The assessment covered {assessedFRCount} of the seven Foundational Requirements, across {answeredReqCount} applicable system requirements{notAssessedClause}, each judged against the target Security Level for the environment.",
                                               "exec_profile":  "Of the assessed Foundational Requirements, {metFRCount} met the target Security Level and {belowFRCount} fell short; {floorClause}.",
                                               "exec_profile_partly":  "Of the assessed Foundational Requirements, {metFRCount} met the target Security Level, {belowFRCount} fell short and {partlyFRCount} ({partlyFRList}) {partlyFRVerb} not yet fully assessed, with nothing short so far; {floorClause}.",
                                               "exec_gap_shape":  "The shortfalls are not evenly spread. {gapConcentrationSentence} The weakest Foundational Requirement is {weakestFRName}, where {weakestFRDetail}.",
                                               "exec_path_forward":  "The roadmap in this report deals with the floor findings first, then raises each Foundational Requirement to its target in an order that fits OT operating constraints.",
                                               "exec_confidence":  "These findings rest on {coveragePct} of applicable requirements being assessable ({confidenceLabel}). Overall closeness to target across the assessed Foundational Requirements is {closenessPct}. The achieved Security Level is set by the weakest applicable requirement, so closeness is given for context and does not count towards meeting the target.",
                                               "verdictPhrases":  {
                                                                      "met":  "meets the target Security Level across all assessed Foundational Requirements",
                                                                      "close":  "is approaching the target Security Level but does not yet meet it across all Foundational Requirements",
                                                                      "short":  "falls short of the target Security Level"
                                                                  },
                                               "floorFragments":  {
                                                                      "some":  "{floorCount} requirement(s) are floor-flagged (at SL 0 against a positive target, or two or more levels below it) and are treated as priorities",
                                                                      "none":  "no requirements are floor-flagged"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "nearClause":  "requirements fall one Security Level short of the target",
                                                                                 "floorClause":  "requirements are floor-flagged and offer little or no protection where it is required"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_weakest_link":  "The achieved Security Level for a Foundational Requirement is set by its weakest applicable requirement. Levels are not averaged, so one requirement at a low level holds the whole Foundational Requirement down. For this reason the roadmap works at the level of individual requirements, and a few fixes can be enough to raise an achieved Security Level.",
                                                 "stakes":  "Security Levels describe the strength of attacker the system is expected to withstand, from casual or coincidental violation at SL 1 to sophisticated attacks with extended resources at SL 4. A Foundational Requirement below its target is protected against a weaker class of threat than the environment calls for. A floor-flagged requirement offers little or no protection where protection is required.",
                                                 "not_determination":  "This assessment measures the system as configured and operated against ISA/IEC 62443-3-3. It is not a certification and does not on its own establish conformance with the standard. The achieved Security Levels reflect what could be demonstrated during the engagement and should be confirmed during remediation."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the weakest protection is in {weakestFRName}.{floorExposureClause}",
                                                      "consultant_exposure_floor_clause":  " Floor-flagged requirements mean parts of the control system currently offer little or no protection against the threat class the target Security Level assumes.",
                                                      "consultant_exposure":  "[Consultant to add a short note on this client's exposure: the threat environment behind the chosen target Security Level, what the weakest Foundational Requirements mean for this process, and any safety or availability implications.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this system.]"
                                                  }
                         },
    "fr_narrative":  {
                         "FR1":  {
                                     "purpose":  "All human users, software processes and devices are identified and authenticated before they are given access to the control system.",
                                     "why_it_matters":  "Shared and generic accounts and unauthenticated device connections are common in OT, and they let a small foothold become control of the process. Identification and authentication are the basis for accountability and for every other access control."
                                 },
                         "FR2":  {
                                     "purpose":  "Authenticated users and processes are limited to the actions and privileges their role needs, and those limits are enforced and recorded.",
                                     "why_it_matters":  "Broad or standing privileges mean one compromised account can alter logic, setpoints or safety parameters. Enforcing least privilege on the control system limits both accidental and malicious change."
                                 },
                         "FR3":  {
                                     "purpose":  "The control system and its information are protected against unauthorised change, including malware, unapproved firmware and tampering.",
                                     "why_it_matters":  "OT systems are long-lived and hard to patch, so hardening, malware protection, change control and removable media control are often the only barrier between a known weakness and an outage."
                                 },
                         "FR4":  {
                                     "purpose":  "Information is kept confidential at rest and in transit, both inside the control system and when it leaves it.",
                                     "why_it_matters":  "Availability and integrity usually come first in OT, but exposed engineering data, credentials or process information helps an attacker and can breach contractual or regulatory obligations."
                                 },
                         "FR5":  {
                                     "purpose":  "The control system is segmented into zones, and data flows between zones and to other networks are limited to what is necessary.",
                                     "why_it_matters":  "Segmentation does more than any other control to limit how far a compromise spreads. Controlled conduits between IT and OT, and between zones, keep an incident contained and protect the most critical and safety functions."
                                 },
                         "FR6":  {
                                     "purpose":  "The system records security-relevant events so that they can be detected, analysed and responded to in good time.",
                                     "why_it_matters":  "Many OT intrusions go undetected for months. Logging, monitoring and a response capability are how a compromise is found and dealt with, and the logs are the evidence any investigation depends on."
                                 },
                         "FR7":  {
                                     "purpose":  "The availability of the control system is protected against degradation and denial of service, including under attack, and the system can be recovered.",
                                     "why_it_matters":  "Availability is usually the priority in OT, because loss of control or view can stop production or threaten safety. Resilience, backups and tested recovery determine how quickly operations return after an incident."
                                 }
                     }
};
