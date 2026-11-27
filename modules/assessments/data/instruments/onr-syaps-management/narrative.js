/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-management/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-management"] = window.App.Data.instruments["onr-syaps-management"] || {};
window.App.Data.instruments["onr-syaps-management"].narrative = {
    "_note":  "ONR SyAPs gap-analysis narrative for onr-syaps-management. Composed by slot substitution; 3-band Achieved / Partially achieved / Not achieved; objectives = Fundamental Security Principles.",
    "boilerplate":  {
                        "report_intro":  "This report sets out an informal gap assessment against the ONR Security Assessment Principles (SyAPs). It covers Fundamental Security Principles 1 to 5 (the security-management and organisational principles) together with cyber and information risk management (SyDP 7.1). Each regulatory expectation is recorded as Achieved, Partially achieved or Not achieved against the selected dutyholder profile. The roadmap, drawn from the evidence gathered, covers the expectations that are not yet achieved or could not be verified.",
                        "not_formal_caveat":  "This gap analysis is intended to support improvement. It is not an ONR assessment or inspection and does not determine compliance with the Nuclear Industries Security Regulations 2003. It neither constitutes nor approves a security plan. The judgements are the consultant's, made against the published SyAPs expectations, and should be confirmed through the dutyholder's own arrangements and, where required, with ONR.",
                        "how_to_read":  "Each regulatory expectation is assessed as Achieved, Partially achieved or Not achieved. The results are reported for each Fundamental Security Principle as counts of these states, and there is no overall score. An expectation that could not be verified is marked Unknown, which lowers confidence in the results. The selected dutyholder profile sets how much demonstration is expected. The roadmap lists every in-scope expectation that is not yet achieved or could not be verified.",
                        "series_context":  "The Security Assessment Principles (SyAPs) are published by the Office for Nuclear Regulation and set out what ONR expects of a dutyholder's security arrangements. ONR's Technical Assessment Guides describe in more detail what each principle expects, and this assessment draws on both."
                    },
    "templates":  {
                      "profile_line":  "{objName} ({objId}): {achievedCount} achieved, {notCount} not achieved, of {totalCount} expectations.",
                      "outcome_result":  "{code} {title}: {stateLabel}.",
                      "roadmap_item":  "{code} {title}: currently {stateLabel} against an expected {expectedLabel}."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot substitution. Objectives = Fundamental Security Principles; 3-band Achieved / Partially achieved / Not achieved.",
                             "templates":  {
                                               "exec_verdict":  "This assessment covers Fundamental Security Principles 1 to 5 of the ONR Security Assessment Principles (SyAPs), the security-management and organisational principles, together with cyber and information risk management (SyDP 7.1). Against the {profileName} profile, {clientName} {verdictPhrase}. The weakest coverage is in {weakestObjectiveName}, where {weakestObjectiveDetail}.",
                                               "exec_verdict_nogaps":  "This assessment covers Fundamental Security Principles 1 to 5 of the ONR Security Assessment Principles (SyAPs), the security-management and organisational principles, together with cyber and information risk management (SyDP 7.1). Against the {profileName} profile, {clientName} {verdictPhrase}, and every in-scope expectation was assessed as Achieved.",
                                               "exec_scope":  "For the {profileName} profile, {applicableCount} regulatory expectations applied across the Fundamental Security Principles in scope.",
                                               "exec_profile":  "Of these, {achievedCount} were assessed as Achieved, {partiallyCount} as Partially achieved and {notAchievedCount} as Not achieved.{unknownSentence} {belowCount|expectation below the expected state makes|expectations below the expected state make} up the roadmap.",
                                               "exec_unknown":  "{unknownCount|expectation|expectations} could not be verified and {unknownCount?is|are} marked Unknown.",
                                               "exec_gap_shape":  "{gapConcentrationSentence}",
                                               "exec_path_forward":  "This report sets out a prioritised roadmap for closing these gaps, with reference to the relevant Technical Assessment Guides.",
                                               "exec_confidence":  "These findings rest on answers for {coveragePct} of applicable expectations ({confidenceLabel}). SyAPs does not produce a single grade, so the results are reported as counts of Achieved, Partially achieved and Not achieved expectations for each Fundamental Security Principle.",
                                               "verdictPhrases":  {
                                                                      "foundations":  "demonstrates strong alignment with the expectations",
                                                                      "recognised":  "is partly aligned with the expectations",
                                                                      "substantial":  "has substantial gaps"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "mostlyClause":  "most expectations are achieved but some are not",
                                                                                 "partialClause":  "expectations are partly demonstrated",
                                                                                 "absentClause":  "the expectations are not yet demonstrated"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_partial_vs_absent":  "An expectation marked Partially achieved has some elements in place, so closing it extends work already begun. An expectation marked Not achieved has not yet been demonstrated and needs new arrangements, which usually take more time and money.",
                                                 "regulatory_stakes":  "ONR uses the Security Assessment Principles to judge the effectiveness of a dutyholder's security arrangements under the Nuclear Industries Security Regulations 2003. ONR engagement, a security plan review or internal assurance would focus on the expectations below the expected state.",
                                                 "not_determination":  ""
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on the drivers for this assessment (regulatory engagement, security plan development, incident, re-categorisation) and any specific exposure arising from the weakest areas identified.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this dutyholder.]"
                                                  }
                         }
};
