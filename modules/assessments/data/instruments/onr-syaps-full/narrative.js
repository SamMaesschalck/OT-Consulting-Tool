/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-full/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-full"] = window.App.Data.instruments["onr-syaps-full"] || {};
window.App.Data.instruments["onr-syaps-full"].narrative = {
    "_note":  "ONR SyAPs gap-analysis narrative for onr-syaps-full. Composed by slot substitution; 3-band Achieved / Partially achieved / Not achieved; objectives = Fundamental Security Principles.",
    "boilerplate":  {
                        "report_intro":  "This report is an informal gap assessment, taken expectation by expectation, against all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs). Each regulatory expectation is recorded as Achieved, Partially achieved or Not achieved against the selected dutyholder profile, and the report sets out a roadmap, based on the evidence, towards those that are not yet achieved or could not be verified.",
                        "not_formal_caveat":  "This is an alignment and gap analysis intended to support improvement. It is not an ONR assessment or inspection, it does not determine compliance with the Nuclear Industries Security Regulations 2003, and it neither constitutes nor approves a security plan. The judgements here are the consultant's, made against the published SyAPs expectations, and should be confirmed through the dutyholder's own arrangements and ONR engagement where required.",
                        "how_to_read":  "Each regulatory expectation is assessed as Achieved, Partially achieved or Not achieved, and the results are reported as a profile for each Fundamental Security Principle, with no overall score. An expectation that could not be verified is marked Unknown, which lowers confidence in the results. The selected dutyholder profile sets the depth of demonstration expected. The roadmap lists every in-scope expectation that is not yet achieved or could not be verified.",
                        "series_context":  "The Security Assessment Principles (SyAPs) are published by the Office for Nuclear Regulation and set out what ONR expects of a dutyholder's security arrangements across the whole of security, from leadership and culture to physical protection, cyber, policing and emergency preparedness. This report is an informal gap assessment against all ten principles. It is not an ONR assessment or inspection, and it neither constitutes nor approves a security plan."
                    },
    "templates":  {
                      "profile_line":  "{objName} ({objId}): {achievedCount} achieved, {notCount} not achieved, of {totalCount} expectations.",
                      "outcome_result":  "{code} {title}: {stateLabel}.",
                      "roadmap_item":  "{code} {title}: currently {stateLabel} against an expected {expectedLabel}."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot substitution. Objectives = Fundamental Security Principles; 3-band Achieved / Partially achieved / Not achieved.",
                             "templates":  {
                                               "exec_verdict":  "This assessment covers all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs). It was carried out for the {profileName} profile and finds that {clientName} {verdictPhrase}, with the weakest coverage in {weakestObjectiveName}. The roadmap in this report concentrates on the expectations that are not yet achieved.",
                                               "exec_verdict_nogaps":  "This assessment covers all ten Fundamental Security Principles of the ONR Security Assessment Principles (SyAPs). It was carried out for the {profileName} profile and finds that {clientName} {verdictPhrase}, with every in-scope expectation assessed as Achieved.",
                                               "exec_scope":  "In all, {applicableCount} regulatory expectations applied across the Fundamental Security Principles in scope for the {profileName} profile.",
                                               "exec_profile":  "Of these, {achievedCount} were assessed as Achieved, {partiallyCount} as Partially achieved and {notAchievedCount} as Not achieved, and {unknownCount} could not be verified (Unknown). The roadmap is made up of the expectations below the expected state, {belowCount} in all.",
                                               "exec_gap_shape":  "The gaps are not evenly spread. {gapConcentrationSentence} The weakest Fundamental Security Principle is {weakestObjectiveName}, where {weakestObjectiveDetail}.",
                                               "exec_path_forward":  "The {belowCount} expectations below the expected state can be addressed, and this report sets out a prioritised roadmap for closing them, aligned to the relevant Technical Assessment Guides.",
                                               "exec_confidence":  "This picture is based on {coveragePct} of applicable expectations being answerable ({confidenceLabel}). SyAPs does not produce a single grade; results are reported as a profile of Achieved, Partially achieved and Not achieved expectations by Fundamental Security Principle.",
                                               "verdictPhrases":  {
                                                                      "foundations":  "demonstrates strong alignment with the selected dutyholder profile",
                                                                      "recognised":  "shows alignment that is recognised but not yet fully demonstrated",
                                                                      "substantial":  "has substantial gaps against the selected dutyholder profile"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "partialClause":  "expectations are partly demonstrated",
                                                                                 "absentClause":  "the expectations are not yet demonstrated"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_partial_vs_absent":  "An expectation marked Partially achieved is recognised, with some elements in place and others not, so closing it extends work already begun. An expectation marked Not achieved is not yet demonstrated and needs to be established. The two differ in cost and effort, since the first builds on what exists and the second starts from new.",
                                                 "regulatory_stakes":  "The Security Assessment Principles are the framework ONR uses to make regulatory judgements on the effectiveness of a dutyholder's security arrangements under the Nuclear Industries Security Regulations 2003. Expectations below the expected state are where ONR engagement, a security plan review or an internal assurance activity would focus. This report is an informal alignment and gap analysis to support improvement. It is not an ONR assessment and does not approve a security plan.",
                                                 "not_determination":  "This is an informal alignment and gap analysis against the published SyAPs expectations. It is not an ONR assessment or a determination of NISR compliance. The judgements here are the consultant's and should be confirmed through the dutyholder's own arrangements and engagement with ONR where required."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the weakest Fundamental Security Principle is {weakestObjectiveName}.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on the drivers for this assessment (regulatory engagement, security plan development, incident, re-categorisation) and any specific exposure arising from the weakest areas identified.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this dutyholder.]"
                                                  }
                         }
};
