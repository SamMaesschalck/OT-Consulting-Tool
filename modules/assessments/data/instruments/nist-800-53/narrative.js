/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nist-800-53/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nist-800-53"] = window.App.Data.instruments["nist-800-53"] || {};
window.App.Data.instruments["nist-800-53"].narrative = {
    "_note":  "NIST SP 800-53 Rev 5 control gap-analysis narrative. Boilerplate is fixed prose; data lines come from templates by token substitution only. The executiveSummary block drives the expanded Word exec summary (verdict, scope, gap shape, stakes, path forward) by slot-substitution; binary Satisfied / Other Than Satisfied so no partial wording.",
    "boilerplate":  {
                        "report_intro":  "This report sets out a gap assessment against the NIST SP 800-53 Revision 5 catalog of security and privacy controls. Each control in the selected NIST SP 800-53B baseline is recorded as Satisfied or Other Than Satisfied, the two determinations used in NIST SP 800-53A. The report then gives a roadmap, based on the evidence gathered, for the controls that are Other Than Satisfied.",
                        "not_formal_caveat":  "This gap analysis is intended to support improvement. It is not a formal control assessment under NIST SP 800-53A, and it is not an authorisation decision under the NIST Risk Management Framework (SP 800-37) or FISMA. The judgements are the consultant's, made against the control catalog, and should be confirmed by a formal assessment where one is required.",
                        "implementation_context":  "Where a control cannot be met as written, for example because of legacy technology, third-party dependencies or operational constraints, a compensating measure may satisfy it. Where one was relied on, or other context affected a judgement, it is noted against the control.",
                        "how_to_read":  "Each control is judged Satisfied or Other Than Satisfied, following the assessment model in NIST SP 800-53A. Results are given for each control family, with no overall score. Controls whose status could not be established are marked unknown. They lower confidence in the result and are not counted as failures. The selected baseline (Low, Moderate or High from NIST SP 800-53B, or the full catalog with no target) sets which controls are expected. The roadmap lists every in-scope control that is Other Than Satisfied.",
                        "series_context":  "NIST SP 800-53 is a catalog of security and privacy controls published by the US National Institute of Standards and Technology. It is used with SP 800-53B, which defines the Low, Moderate and High baselines, and with SP 800-53A, which defines how a formal assessment is carried out. This report uses the catalog and the baselines for a gap analysis."
                    },
    "templates":  {
                      "profile_line":  "{objName} ({objId}): {achievedCount} satisfied, {notCount} other than satisfied, of {totalCount} controls.",
                      "outcome_result":  "{code} {title}: {stateLabel}.",
                      "roadmap_item":  "{code} {title} is currently {stateLabel}. The recommended actions follow.",
                      "unknown_finding":  "{unknownCount} controls could not be established and are marked unknown. Confidence is {confidenceLabel}."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only. Binary determination (Satisfied / Other Than Satisfied), so no partial wording; exec_partial_vs_absent is intentionally omitted.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that {clientName} {verdictPhrase} against the {profileName} of NIST SP 800-53 Rev 5. The weakest coverage is in {weakestObjectiveName}, where {weakestObjectiveDetail}.",
                                               "exec_verdict_nogaps":  "This assessment finds that {clientName} {verdictPhrase} against the {profileName} of NIST SP 800-53 Rev 5, with every applicable control assessed as Satisfied.",
                                               "exec_scope":  "The assessment covered {applicableCount} applicable base controls in the 20 control families of NIST SP 800-53 (grouped as Technical, Operational and Management) and judged them against the {profileName}.",
                                               "exec_profile":  "Of these, {achievedCount} were assessed as Satisfied and {notAchievedCount} as Other Than Satisfied.",
                                               "exec_gap_shape":  "{gapConcentrationSentence}",
                                               "exec_path_forward":  "This report sets out a prioritised roadmap for the controls assessed as Other Than Satisfied.",
                                               "exec_confidence":  "These findings rest on answers for {coveragePct} of applicable controls ({confidenceLabel}). Results are reported as the spread of Satisfied and Other Than Satisfied controls across the families, with no overall grade or pass mark.",
                                               "verdictPhrases":  {
                                                                      "foundations":  "demonstrates strong implementation",
                                                                      "recognised":  "has partly implemented the controls expected",
                                                                      "substantial":  "has substantial gaps"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "mostlyClause":  "most controls are satisfied but some are not",
                                                                                 "partialClause":  "implementation is partly in place",
                                                                                 "absentClause":  "no control is satisfied yet"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "regulatory_stakes":  "NIST SP 800-53 is the control catalog for US federal information systems, and many enterprises and their customers use it as a benchmark for security controls. The selected baseline corresponds to the impact level chosen for the systems assessed. A customer security review, an auditor or an authorising official would concentrate on the controls that are Other Than Satisfied.",
                                                 "not_determination":  ""
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on the drivers for this assessment (customer or contractual security requirements, certifications in scope such as SOC 2 or ISO 27001) and any specific exposure arising from the weakest areas identified.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this organisation.]"
                                                  }
                         }
};
