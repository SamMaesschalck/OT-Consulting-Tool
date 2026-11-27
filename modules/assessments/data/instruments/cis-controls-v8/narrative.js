/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/cis-controls-v8/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["cis-controls-v8"] = window.App.Data.instruments["cis-controls-v8"] || {};
window.App.Data.instruments["cis-controls-v8"].narrative = {
    "_note":  "CIS Controls v8.1.2 gap-analysis narrative. The executiveSummary block drives the expanded Word exec summary; single objective, so the docx gap-shape falls back to the 18 Controls (principle level). 3-band Implemented / Partially / Not Implemented.",
    "boilerplate":  {
                        "report_intro":  "This report sets out a gap assessment against the CIS Critical Security Controls Version 8.1.2, published by the Center for Internet Security. Each Safeguard in the selected Implementation Group is recorded as Implemented, Partially Implemented or Not Implemented. The report then gives a roadmap, based on the evidence gathered, for the Safeguards that are not yet implemented or could not be verified.",
                        "not_formal_caveat":  "This alignment and gap analysis is intended to support improvement. It is not a certified CIS Controls assessment, and it is not a CIS SecureSuite or Controls Self Assessment Tool (CSAT) result. The judgements are the consultant's, made against the CIS Safeguard descriptions, and should be confirmed through the enterprise's own validation where required.",
                        "how_to_read":  "Each Safeguard is assessed as Implemented, Partially Implemented or Not Implemented, and the results are reported for each CIS Control with no overall score. A Safeguard that could not be verified, or that no one tracks, is marked Unknown. A Safeguard that cannot be demonstrated is reported as a finding, so Unknown counts as below the expected state, appears on the roadmap and lowers confidence. The selected Implementation Group (IG1, IG2 or IG3, or the full set with no target) sets which Safeguards are expected. The roadmap lists every in-scope Safeguard that is not yet implemented or could not be verified.",
                        "series_context":  "The CIS Critical Security Controls are published by the Center for Internet Security. They are a prioritised set of safeguards drawn from observed attack patterns and have no legal force. The Controls are arranged in Implementation Groups so that a smaller organisation can start with the highest-priority safeguards."
                    },
    "templates":  {
                      "profile_line":  "{objName} ({objId}): {achievedCount} implemented, {notCount} not implemented, of {totalCount} Safeguards.",
                      "outcome_result":  "{code} {title}: {stateLabel}.",
                      "roadmap_item":  "{code} {title} is currently {stateLabel}. The recommended actions follow.",
                      "unknown_finding":  "{unknownCount} Safeguards could not be established and are marked unknown. Confidence is {confidenceLabel}."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only. Single objective, so the docx gap-shape uses the 18 Controls; 3-band Implemented / Partially / Not Implemented.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that {clientName} {verdictPhrase} against {profileName} of the CIS Critical Security Controls v8.1.2. The weakest coverage is in {weakestObjectiveName}, where {weakestObjectiveDetail}.",
                                               "exec_verdict_nogaps":  "This assessment finds that {clientName} {verdictPhrase} against {profileName} of the CIS Critical Security Controls v8.1.2, with every in-scope Safeguard assessed as Implemented.",
                                               "exec_scope":  "The assessment covered {applicableCount} applicable Safeguards across the 18 CIS Controls, judged against {profileName}.",
                                               "exec_profile":  "Of these, {achievedCount} were assessed as Implemented, {partiallyCount} as Partially Implemented and {notAchievedCount} as Not Implemented.{unknownSentence} The roadmap covers the {belowCount|Safeguard|Safeguards} that {belowCount?is|are} Partially Implemented, Not Implemented or Unknown.",
                                               "exec_unknown":  "{unknownCount|Safeguard|Safeguards} could not be verified and {unknownCount?is|are} marked Unknown. A Safeguard that cannot be verified counts as a finding.",
                                               "exec_gap_shape":  "{gapConcentrationSentence}",
                                               "exec_path_forward":  "This report sets out a prioritised roadmap for the Safeguards below the expected state.",
                                               "exec_confidence":  "These findings rest on answers for {coveragePct} of applicable Safeguards ({confidenceLabel}). Results are reported as the spread of Implemented, Partially Implemented and Not Implemented Safeguards for each Control, with no overall grade or pass mark.",
                                               "verdictPhrases":  {
                                                                      "foundations":  "demonstrates strong implementation",
                                                                      "recognised":  "has partly implemented the Safeguards expected",
                                                                      "substantial":  "has substantial gaps"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "mostlyClause":  "most Safeguards are implemented but some are not",
                                                                                 "partialClause":  "Safeguards are partly in place",
                                                                                 "absentClause":  "the Safeguards are not yet implemented"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_partial_vs_absent":  "A Safeguard marked Partially Implemented has some of its elements in place, so the remaining work extends what has already begun. A Safeguard marked Not Implemented is not yet in place and has to be established. Closing a Not Implemented gap usually takes more effort and cost, because there is nothing in place to build on.",
                                                 "regulatory_stakes":  "The CIS Critical Security Controls are a widely used, prioritised set of safeguards. The chosen Implementation Group reflects the enterprise's risk profile, and IG1 is the baseline of essential cyber hygiene expected of every organisation. A cyber-insurance review, a payment-card assessment (PCI DSS) or a customer security questionnaire would focus on the Safeguards below the expected state.",
                                                 "not_determination":  ""
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on the drivers for this assessment (cyber insurance, PCI DSS, customer requirements) and any specific exposure arising from the weakest Controls identified.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this organisation.]"
                                                  }
                         }
};
