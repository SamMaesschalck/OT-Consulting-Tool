/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-4-2/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-4-2"] = window.App.Data.instruments["iec-62443-4-2"] || {};
window.App.Data.instruments["iec-62443-4-2"].narrative = {
    "_note":  "Narrative pack for ISA/IEC 62443-4-2. Boilerplate is inserted verbatim into the Word report; templates are composed by {slot} substitution only. Written by the author in plain language; no text is reproduced from the standard. Mirrors the 62443-3-3 pack structure, reframed from the system to the individual component and from SL to capability security level (SL-C).",
    "boilerplate":  {
                        "report_intro":  "This report gives the results of a component security assessment against ISA/IEC 62443-4-2, the standard that sets technical security requirements for the individual components that make up an industrial automation and control system. For each Foundational Requirement it sets out the capability security level the component achieves against the target, the requirements that fell short and a prioritised view of where to act first. It is written for management and for the engineering or product teams who will carry out the remediation.",
                        "about_instrument":  "ISA/IEC 62443-4-2 defines what an individual component must be able to do, expressed as component requirements grouped under the same seven Foundational Requirements used across the 62443 series. Requirements are common to all components where they carry a CR code, and specific to a component type where they carry SAR (software application), EDR (embedded device), HDR (host device) or NDR (network device). Because each assessment target is a single component, requirements written for other component types are marked not applicable and excluded from the result.",
                        "security_levels":  "A capability security level describes the strength of protection a component is able to provide against a defined class of threat: SL 1 protects against casual or coincidental violation, SL 2 against intentional violation using simple means, SL 3 against sophisticated means with moderate resources, and SL 4 against sophisticated means with extended resources. The achieved capability security level for a Foundational Requirement is set by its weakest applicable requirement; there is no averaging, so a single shortfall holds the level down.",
                        "method":  "Each applicable component requirement was judged against the target security level for the engagement and recorded at the level the component demonstrably achieves, from 0 (not provided) to 4. Requirements written for a different component type, or genuinely outside the component's scope, were marked not applicable and excluded from the denominator. Requirement enhancements raise a requirement from one security level to the next, so the level recorded depends on which enhancements are present as well as on the base capability.",
                        "how_to_read":  "Results are reported per Foundational Requirement as an achieved capability security level against the target, alongside a closeness figure. The achieved level is that of the weakest applicable requirement in the Foundational Requirement. Closeness is the mean of the per-requirement scores and is shown for context only; a high closeness never offsets an open gap. Requirements that are floor-flagged, meaning at level 0 against a positive target or two or more levels below it, are treated as priorities in the roadmap.",
                        "limitations":  "This assessment reflects the component as supplied and configured at the time of the engagement, and rests on the evidence recorded in the basis of assessment. As a capability assessment, it establishes what the component is able to enforce. It does not establish whether the surrounding system, its integration or operational practice makes use of that capability. Assessing the deployed system is the subject of ISA/IEC 62443-3-3, and the supplier's development process is the subject of ISA/IEC 62443-4-1.",
                        "not_certification_caveat":  "This is a capability assessment of an individual component against ISA/IEC 62443-4-2. It records the capability security level each Foundational Requirement demonstrably achieves against its target, with the achieved level set by the weakest applicable requirement. The assessment is not a certification, is not an ISASecure or comparable conformity assessment, and does not by itself constitute conformance with ISA/IEC 62443. The achieved levels reflect what could be demonstrated at the time of the engagement and should be confirmed during remediation.",
                        "series_context":  "ISA/IEC 62443 is a series of standards, with its parts divided by who is responsible for what. The 2-x parts address the organisation that runs the system. The 3-x parts cover the system as designed and operated: 62443-3-2 divides it into zones and conduits and sets a target Security Level for each, and 62443-3-3 judges what those zones achieve. The 4-x parts address the products the system is built from. 62443-4-1 covers how a supplier develops a product, and 62443-4-2, used for this assessment, covers the security capability of the component itself. This report covers 62443-4-2 only. It describes what the component is capable of. What a system built from it achieves depends on how that system is designed and operated, and is assessed against 62443-3-3."
                    },
    "templates":  {
                      "scope_assessed_line":  "{assessedCount} of 7 Foundational Requirements were assessed; {notAssessedCount} were not assessed in this engagement.",
                      "default_target_flag":  "All Foundational Requirements were assessed against the default target of {targetSL}; no per-FR target overrides were set.",
                      "na_clause":  ", with {naCount} requirement(s) not applicable to this component type or scope",
                      "fr_result_assessed":  "FR{frNum} {frName} achieved {achievedSL} against a target of {targetSL}, meeting {metCount} of {applicableCount} applicable requirement(s){naClause}.",
                      "fr_not_assessed":  "FR{frNum} {frName} was not assessed in this engagement.",
                      "fr_all_met":  "All applicable requirements in this Foundational Requirement met their target capability security level.",
                      "fr_shortfall_intro":  "The following component requirements fell short of the target capability security level:",
                      "fr_shortfall_item":  "{srCode} {srTitle}: achieved {achievedSL} against target {targetSL}.",
                      "fr_floor_note":  "{floorCount} requirement(s) in this Foundational Requirement are floor-flagged and should be treated as priorities."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only; boilerplate inserted VERBATIM; consultant blocks seeded with data-derived facts plus a marked placeholder. No free-writing.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that the component assessed for {clientName} {verdictPhrase}, with the weakest capability in {weakestFRName}. The component requirements that fall short of the target capability security level are the focus of the roadmap in this report.",
                                               "exec_verdict_nogaps":  "This assessment finds that the component assessed for {clientName} {verdictPhrase}.",
                                               "exec_scope":  "The assessment covered {assessedFRCount} of the seven Foundational Requirements, across {answeredReqCount} applicable component requirements{notAssessedClause}, each judged against the target capability security level for the environment.",
                                               "exec_profile":  "Of the assessed Foundational Requirements, {metFRCount} met the target capability security level and {belowFRCount} fell short; {floorClause}.",
                                               "exec_profile_partly":  "Of the assessed Foundational Requirements, {metFRCount} met the target capability security level, {belowFRCount} fell short and {partlyFRCount} ({partlyFRList}) {partlyFRVerb} not yet fully assessed, with nothing short so far; {floorClause}.",
                                               "exec_gap_shape":  "The shortfalls are not evenly spread. {gapConcentrationSentence} The weakest Foundational Requirement is {weakestFRName}, where {weakestFRDetail}.",
                                               "exec_path_forward":  "The requirements below the target capability security level can be addressed. The OT-aware roadmap in this report deals with the floor findings first and then raises each Foundational Requirement to its target. Where a gap is inherent to the product rather than its configuration, closing it is a matter for the product supplier's roadmap or for compensating controls in the surrounding system.",
                                               "exec_confidence":  "These findings rest on {coveragePct} of applicable requirements being assessable ({confidenceLabel}). Overall closeness to target across the assessed Foundational Requirements is {closenessPct}. Because the achieved capability security level is set by the weakest applicable requirement, closeness is shown for context only and never substitutes for meeting the target.",
                                               "verdictPhrases":  {
                                                                      "met":  "meets the target capability security level across all assessed Foundational Requirements",
                                                                      "close":  "is approaching the target capability security level but does not yet meet it across all Foundational Requirements",
                                                                      "short":  "falls short of the target capability security level"
                                                                  },
                                               "floorFragments":  {
                                                                      "some":  "{floorCount} requirement(s) are floor-flagged (at SL 0 against a positive target, or two or more levels below it) and are treated as priorities",
                                                                      "none":  "no requirements are floor-flagged"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "nearClause":  "requirements fall one capability security level short of the target",
                                                                                 "floorClause":  "requirements are floor-flagged and offer little or no capability where it is required"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_weakest_link":  "The achieved capability security level for a Foundational Requirement is set by its weakest applicable requirement; there is no averaging, so a single requirement at a low level holds the whole Foundational Requirement down. The roadmap therefore targets individual component requirements, and a small number of product changes can be enough to raise an achieved level.",
                                                 "stakes":  "Capability security levels describe the strength of attacker the component is expected to withstand: SL 1 protects against casual or coincidental violation, SL 2 against intentional violation using simple means, SL 3 against sophisticated means with moderate resources, and SL 4 against sophisticated means with extended resources. A Foundational Requirement below its target therefore provides capability against a weaker class of threat than the environment calls for, and a floor-flagged requirement offers little or no capability where it is required.",
                                                 "not_determination":  "This is a capability assessment of an individual component against ISA/IEC 62443-4-2. It is not a certification, is not an ISASecure or comparable conformity assessment, and does not by itself constitute conformance with the standard; the achieved capability security levels reflect what could be demonstrated during the engagement and should be confirmed during remediation."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the weakest capability is in {weakestFRName}.{floorExposureClause}",
                                                      "consultant_exposure_floor_clause":  " Floor-flagged requirements mean the component currently offers little or no capability against the threat class the target capability security level assumes.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on exposure: where this component sits in the architecture, what a shortfall in its capability means for the zone it serves, and any safety or availability implications.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this component, and to note which are fixable by configuration and which need the product supplier.]"
                                                  }
                         },
    "fr_narrative":  {
                         "FR1":  {
                                     "purpose":  "Ensures the component identifies and authenticates all human users, software processes and devices before granting access to it.",
                                     "why_it_matters":  "A component that cannot tell who or what is talking to it cannot enforce anything else. Shared logins, unchangeable default credentials and unauthenticated peer connections are common in OT products, and each one turns a small foothold into control of the component."
                                 },
                         "FR2":  {
                                     "purpose":  "Ensures the component enforces the privileges assigned to an authenticated user, and records what was done.",
                                     "why_it_matters":  "Authentication establishes identity. Use control decides what that identity may do and keeps the evidence of what it did. Without enforcement and auditable events at the component, every authenticated user is effectively an administrator and no action can be attributed afterwards."
                                 },
                         "FR3":  {
                                     "purpose":  "Ensures the component's firmware, software, configuration and communications are protected against unauthorised change.",
                                     "why_it_matters":  "Verified boot, signed updates, validated input and protected communications stop a device being turned into an attacker's instrument while it continues to look healthy."
                                 },
                         "FR4":  {
                                     "purpose":  "Ensures information held or handled by the component is protected from unauthorised disclosure, including when the component leaves service.",
                                     "why_it_matters":  "Configuration, logic and credentials extracted from a component give an attacker a map of the plant. The exposure is often at the end of life, when equipment is returned or disposed of still carrying its data."
                                 },
                         "FR5":  {
                                     "purpose":  "Ensures the component supports the segmentation of the control network into zones and conduits.",
                                     "why_it_matters":  "A component that demands broad reachability, or a boundary device that permits more than the architecture intends, defeats the zone and conduit model the rest of the site depends on, and does so without any obvious sign."
                                 },
                         "FR6":  {
                                     "purpose":  "Ensures security events on the component can be seen and acted on in time to matter.",
                                     "why_it_matters":  "Detection is the weakest area of most OT programmes. A component whose logs cannot be read, or read only by disturbing the process, forces the whole zone back to periodic inspection and lengthens every incident."
                                 },
                         "FR7":  {
                                     "purpose":  "Ensures the component remains available and recoverable, including under attack and after failure.",
                                     "why_it_matters":  "Availability is the priority in OT, and many control components fall over under loads an IT device would ignore. Resilience, backup, recovery and least functionality keep a security event from becoming a production or safety event."
                                 }
                     }
};
