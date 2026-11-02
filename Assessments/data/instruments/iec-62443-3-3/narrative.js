/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-3-3/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-3-3"] = window.App.Data.instruments["iec-62443-3-3"] || {};
window.App.Data.instruments["iec-62443-3-3"].narrative = {
    "_note":  "Narrative for the ISA/IEC 62443-3-3 System Security Assessment (capability-sl). Boilerplate is inserted VERBATIM; data lines are composed ONLY by substituting values into the templates. The generator never free-writes prose. fr_narrative carries the per-Foundational-Requirement purpose and why-it-matters text used in the Findings section.",
    "boilerplate":  {
                        "report_intro":  "This report gives the results of a security assessment against ISA/IEC 62443-3-3, the standard that sets system security requirements and security levels for industrial automation and control systems. For each Foundational Requirement it sets out the Security Level achieved against the target, the requirements that fell short and a prioritised view of where to act first. It is written for management and for the engineering teams who will carry out the remediation.",
                        "about_instrument":  "ISA/IEC 62443-3-3 defines system security requirements grouped into seven Foundational Requirements, each assessed against four Security Levels (SL 1 to SL 4). This assessment records, for each requirement, the Security Level the system demonstrably achieves and compares it with the target Security Level for the environment. It is a capability assessment of the system as configured and operated; it is not a certification and does not by itself constitute conformance.",
                        "security_levels":  "Security Levels describe the strength of protection required against a defined class of threat: SL 1 protects against casual or coincidental violation, SL 2 against intentional violation using simple means, SL 3 against sophisticated means with moderate resources, and SL 4 against sophisticated means with extended resources. The achieved Security Level for a Foundational Requirement is set by its weakest applicable requirement; there is no averaging, so a single shortfall holds the level down.",
                        "method":  "Each requirement was assessed against the target Security Level using the evidence available at the time, including configuration review, interview and observation. The achieved Security Level reflects what could be demonstrated; intent or documentation on its own was not enough. [Consultant to confirm or adjust this description so it matches how the assessment was run.]",
                        "how_to_read":  "Each Foundational Requirement shows the Security Level achieved against its target. The achieved level is set by the weakest applicable requirement within it, so a Foundational Requirement meets its target only when every applicable requirement in it does. Requirements assessed as not applicable are excluded; those not assessed are reported separately. Closeness figures are shown for context only and never replace the achieved Security Level. A requirement is floor-flagged when it sits at SL 0 against a positive target, or two or more levels below target, and floor-flagged requirements are listed as priorities.",
                        "limitations":  "This is a point-in-time assessment based on the evidence available during the engagement. It reflects the system as assessed. It does not guarantee how the system will behave under all conditions, and it is not a certification against ISA/IEC 62443. Requirements that could not be assessed are listed and counted as neither met nor unmet, because their status is unknown. Findings should be confirmed during remediation.",
                        "not_certification_caveat":  "This is a capability assessment of the system as configured and operated, against ISA/IEC 62443-3-3. It records the Security Level each Foundational Requirement demonstrably achieves against its target, with the achieved level set by the weakest applicable requirement. The assessment is not a certification and does not by itself constitute conformance with ISA/IEC 62443. The achieved Security Levels reflect what could be demonstrated at the time of the engagement and should be confirmed during remediation.",
                        "series_context":  "ISA/IEC 62443 is a series of standards, with its parts divided by who is responsible for what. The 2-x parts address the organisation that runs the system, and 62443-2-1 sets out the security programme it is expected to operate. The 3-x parts cover the system itself. 62443-3-2 divides it into zones and conduits and assigns each a target Security Level based on the risk, and 62443-3-3, used for this assessment, defines what a system has to do to reach those levels. The 4-x parts address the products the system is built from. 62443-4-1 covers how a supplier develops them, and 62443-4-2 covers the security capability of an individual component. This report covers 62443-3-3 only. It takes the zones, conduits and target Security Levels as given and reports what each of them achieves."
                    },
    "templates":  {
                      "scope_assessed_line":  "{assessedCount} of 7 Foundational Requirements were assessed; {notAssessedCount} were not assessed in this engagement.",
                      "default_target_flag":  "All Foundational Requirements were assessed against the default target of {targetSL}; no per-FR target overrides were set.",
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
                                               "exec_verdict":  "This assessment finds that the control system at {clientName} {verdictPhrase}, with the weakest protection in {weakestFRName}. The requirements that fall short of the target Security Level are the focus of the roadmap in this report.",
                                               "exec_verdict_nogaps":  "This assessment finds that the control system at {clientName} {verdictPhrase}.",
                                               "exec_scope":  "The assessment covered {assessedFRCount} of the seven Foundational Requirements, across {answeredReqCount} applicable system requirements{notAssessedClause}, each judged against the target Security Level for the environment.",
                                               "exec_profile":  "Of the assessed Foundational Requirements, {metFRCount} met the target Security Level and {belowFRCount} fell short; {floorClause}.",
                                               "exec_profile_partly":  "Of the assessed Foundational Requirements, {metFRCount} met the target Security Level, {belowFRCount} fell short and {partlyFRCount} ({partlyFRList}) {partlyFRVerb} not yet fully assessed, with nothing short so far; {floorClause}.",
                                               "exec_gap_shape":  "The shortfalls are not evenly spread. {gapConcentrationSentence} The weakest Foundational Requirement is {weakestFRName}, where {weakestFRDetail}.",
                                               "exec_path_forward":  "The requirements below the target Security Level can be addressed. The OT-aware roadmap in this report deals with the floor findings first and then raises each Foundational Requirement to its target.",
                                               "exec_confidence":  "These findings rest on {coveragePct} of applicable requirements being assessable ({confidenceLabel}). Overall closeness to target across the assessed Foundational Requirements is {closenessPct}. Because the achieved Security Level is set by the weakest applicable requirement, closeness is shown for context only and never substitutes for meeting the target.",
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
                                                 "exec_weakest_link":  "The achieved Security Level for a Foundational Requirement is set by its weakest applicable requirement; there is no averaging, so a single requirement at a low level holds the whole Foundational Requirement down. The roadmap therefore targets individual requirements, and a small number of fixes can be enough to raise an achieved Security Level.",
                                                 "stakes":  "Security Levels describe the strength of attacker the system is expected to withstand: SL 1 protects against casual or coincidental violation, SL 2 against intentional violation using simple means, SL 3 against sophisticated means with moderate resources, and SL 4 against sophisticated means with extended resources. A Foundational Requirement below its target is therefore protected against a weaker class of threat than the environment calls for, and a floor-flagged requirement offers little or no protection where protection is required.",
                                                 "not_determination":  "This is a capability assessment of the system as configured and operated, against ISA/IEC 62443-3-3. It is not a certification and does not by itself constitute conformance with the standard; the achieved Security Levels reflect what could be demonstrated during the engagement and should be confirmed during remediation."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the weakest protection is in {weakestFRName}.{floorExposureClause}",
                                                      "consultant_exposure_floor_clause":  " Floor-flagged requirements mean parts of the control system currently offer little or no protection against the threat class the target Security Level assumes.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on exposure: the threat environment behind the chosen target Security Level, the consequence of the weakest Foundational Requirements for this process, and any safety or availability implications.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this system.]"
                                                  }
                         },
    "fr_narrative":  {
                         "FR1":  {
                                     "purpose":  "Ensures all human users, software processes and devices are identified and authenticated before being granted access to the control system.",
                                     "why_it_matters":  "In OT, shared and generic accounts and unauthenticated device connections are common, and they let a small foothold become control of the process. Reliable identification and authentication is the basis for accountability and for every other access control."
                                 },
                         "FR2":  {
                                     "purpose":  "Ensures authenticated users and processes are restricted to the actions and privileges their role requires, and that those restrictions are enforced and recorded.",
                                     "why_it_matters":  "Broad or standing privileges mean one compromised account can alter logic, setpoints or safety parameters. Enforcing least privilege on the control system limits both accidental and malicious change."
                                 },
                         "FR3":  {
                                     "purpose":  "Protects the integrity of the control system and its information against unauthorised change, including malware, unapproved firmware and tampering.",
                                     "why_it_matters":  "OT systems are long-lived and hard to patch, so integrity controls (hardening, malware protection, change control and removable-media control) are often what stand between a known weakness and an outage."
                                 },
                         "FR4":  {
                                     "purpose":  "Protects the confidentiality of information at rest and in transit, both within the control system and where it leaves it.",
                                     "why_it_matters":  "Availability and integrity usually come first in OT, but exposure of engineering data, credentials or process information aids an attacker and can breach contractual or regulatory obligations."
                                 },
                         "FR5":  {
                                     "purpose":  "Ensures the control system is segmented into zones and that data flows between zones, and to other networks, are restricted to what is necessary.",
                                     "why_it_matters":  "Segmentation is the control that most limits how far a compromise spreads. Restricted, controlled conduits between IT and OT and between zones keep an incident contained and the most critical and safety functions protected."
                                 },
                         "FR6":  {
                                     "purpose":  "Ensures the system records security-relevant events and supports their timely detection, analysis and response.",
                                     "why_it_matters":  "Many OT intrusions run undetected for months. Logging, monitoring and the ability to respond are how a compromise gets found and dealt with, and they provide the evidence any investigation depends on."
                                 },
                         "FR7":  {
                                     "purpose":  "Ensures the availability of the control system is protected against degradation or denial, including under attack, and that it can be recovered.",
                                     "why_it_matters":  "Availability is usually the priority in OT, because loss of control or view can stop production or threaten safety. Resilience, backups and tested recovery determine how quickly operations return after an incident."
                                 }
                     }
};
