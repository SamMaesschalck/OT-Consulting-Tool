/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nist-800-82/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nist-800-82"] = window.App.Data.instruments["nist-800-82"] || {};
window.App.Data.instruments["nist-800-82"].narrative = {
    "_note":  "NIST SP 800-82 Rev 3 OT Overlay gap-analysis narrative. The executiveSummary block drives the expanded Word exec summary by slot-substitution; binary Satisfied / Other Than Satisfied so no partial wording.",
    "boilerplate":  {
                        "report_intro":  "This report sets out a gap assessment against the OT Overlay in NIST SP 800-82 Revision 3 (Appendix F), which tailors the NIST SP 800-53 Rev 5 control catalog for operational technology. Each control in the selected OT baseline is recorded as Satisfied or Other Than Satisfied, the two determinations used in NIST SP 800-53A. The report then gives a roadmap, based on the evidence gathered, for the controls that are Other Than Satisfied.",
                        "not_formal_caveat":  "This gap analysis is intended to support improvement. It is not a formal control assessment under NIST SP 800-53A, and it is not an authorisation decision under the NIST Risk Management Framework (SP 800-37). The judgements are the consultant's, made against the OT overlay with reference to the OT Discussion for each control, and should be confirmed by a formal assessment where one is required.",
                        "ot_focus":  "Operational technology differs from enterprise IT in ways that affect how controls are implemented. Availability and safety usually come before confidentiality, and legacy devices may be unable to meet a control as written. Some controls have to be met through compensating measures. The assessment drew on the OT Discussion for each control and the Tailoring Considerations for each family in NIST SP 800-82 Rev 3. Where OT context affected a judgement, it is noted against the control.",
                        "how_to_read":  "Each control is judged Satisfied or Other Than Satisfied, following the assessment model in NIST SP 800-53A. Results are given for each control family, with no overall score. Controls whose status could not be established are marked unknown. They lower confidence in the result and are not counted as failures. The selected OT baseline (Low, Moderate or High from the SP 800-82 Rev 3 overlay, or the full overlay with no target) sets which controls are expected. The roadmap lists every in-scope control that is Other Than Satisfied.",
                        "series_context":  "NIST SP 800-82 Rev 3 is the operational technology security guide published by the US National Institute of Standards and Technology. It defines no controls of its own. Its overlay takes the SP 800-53 Rev 5 controls, tailors the baselines for OT and explains what each control means where availability and safety come first. This report assesses the OT overlay, and the underlying catalog is SP 800-53."
                    },
    "templates":  {
                      "profile_line":  "{objName} ({objId}): {achievedCount} satisfied, {notCount} other than satisfied, of {totalCount} controls.",
                      "outcome_result":  "{code} {title}: {stateLabel}.",
                      "roadmap_item":  "{code} {title} is currently {stateLabel}. The recommended OT-aware actions follow.",
                      "unknown_finding":  "{unknownCount} controls could not be established and are marked unknown. Confidence is {confidenceLabel}."
                  },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only. Binary determination (Satisfied / Other Than Satisfied), so no partial wording.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that {clientName} {verdictPhrase} against the {profileName} of the NIST SP 800-82 Rev 3 OT Overlay, with the weakest coverage in {weakestObjectiveName}. The controls assessed as Other Than Satisfied are the focus of the roadmap in this report.",
                                               "exec_verdict_nogaps":  "This assessment finds that {clientName} {verdictPhrase} against the {profileName} of the NIST SP 800-82 Rev 3 OT Overlay, with every applicable control assessed as Satisfied.",
                                               "exec_scope":  "The assessment covered {applicableCount} applicable base controls in the 19 control families of the NIST SP 800-82 Rev 3 OT Overlay (grouped as Technical, Operational and Management) and judged them against the {profileName}.",
                                               "exec_profile":  "Of these, {achievedCount} were assessed as Satisfied and {notAchievedCount} as Other Than Satisfied, so {belowCount} control(s) fall short of the OT baseline.",
                                               "exec_gap_shape":  "{gapConcentrationSentence} The weakest area is {weakestObjectiveName}, where {weakestObjectiveDetail}.",
                                               "exec_path_forward":  "This report sets out a prioritised, OT-aware roadmap for closing the {belowCount} controls assessed as Other Than Satisfied.",
                                               "exec_confidence":  "These findings rest on answers for {coveragePct} of applicable controls ({confidenceLabel}). Results are reported as the spread of Satisfied and Other Than Satisfied controls across the families, with no overall grade or pass mark.",
                                               "verdictPhrases":  {
                                                                      "foundations":  "demonstrates strong implementation",
                                                                      "recognised":  "has partly implemented the controls expected",
                                                                      "substantial":  "has substantial gaps"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "partialClause":  "implementation is partly in place",
                                                                                 "absentClause":  "the controls are not yet satisfied"
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "regulatory_stakes":  "The NIST SP 800-82 OT Overlay tailors the NIST SP 800-53 Rev 5 catalog for operational technology, and the selected baseline corresponds to the impact level chosen for the control environment. Controls that are Other Than Satisfied weaken the organisation's ability to protect, detect and recover in the OT environment. An assessor, or a regulator reviewing an essential service, would concentrate on them.",
                                                 "not_determination":  "This gap analysis is made against the NIST SP 800-82 Rev 3 OT Overlay, with reference to the OT Discussion for each control. It is not a formal SP 800-53A control assessment or an authorisation decision under the NIST Risk Management Framework (SP 800-37). The judgements are the consultant's and should be confirmed by a formal assessment where one is required."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the weakest area is {weakestObjectiveName}.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on the essential service and its OT context, the relevant oversight regime, and any specific exposure arising from the weakest areas identified.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this organisation.]"
                                                  }
                         }
};
