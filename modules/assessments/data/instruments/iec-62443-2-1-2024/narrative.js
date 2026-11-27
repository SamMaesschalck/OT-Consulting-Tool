/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-2-1-2024/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-2-1-2024"] = window.App.Data.instruments["iec-62443-2-1-2024"] || {};
window.App.Data.instruments["iec-62443-2-1-2024"].narrative = {
    "_note":  "Narrative for the ISA/IEC 62443-2-1:2024 Security Program maturity assessment. Boilerplate inserted VERBATIM; the executive summary is composed by slot-substitution only (no free-writing). The instrument framing supplies the 'About this assessment' prose; this pack adds the composed executive summary, a caveat box and the consultant blocks. Aim: an achieved-maturity PROFILE across the Security Program Elements - never a single programme grade - with not-met and lowest-maturity requirements surfaced as floor findings.",
    "boilerplate":  {
                        "report_intro":  "This report presents a maturity assessment of the organisation's security programme against ISA/IEC 62443-2-1:2024. It gives the maturity each requirement achieved in each Security Program Element and sets out a prioritised roadmap for the requirements that are not met or are at the lowest maturity. Where the organisation runs an information security management system (ISMS), for example to ISO/IEC 27001, the 2024 standard expects the security programme to be coordinated with it. An existing ISMS can meet some programme requirements if its scope extends to the IACS.",
                        "not_certification_caveat":  "This is a maturity assessment of the security programme against ISA/IEC 62443-2-1:2024. The consultant placed each requirement at one maturity level using the ML anchors, taking account of the OT context. The results form an achieved-maturity profile across the Security Program Elements, with no single programme grade. The assessment is not a certification or a statement of conformance with the standard. Mean maturity is shown for context only. The achieved maturity reflects what could be demonstrated at the time of the engagement and should be confirmed during remediation.",
                        "series_context":  "ISA/IEC 62443 is a series of standards, divided according to who is responsible for what. This part, 62443-2-1:2024, deals with the organisation and the security programme it is expected to run. The assessment rates how well established each practice is. The 3-x parts address the system as designed and operated, and the 4-x parts the products it is built from."
                    },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only; boilerplate VERBATIM; consultant blocks seeded with data-derived facts plus a marked placeholder. No free-writing. Order: verdict, scope + profile, gap-shape, profile-method + stakes, path forward + confidence. Works with or without the optional target-ML overlay.",
                             "templates":  {
                                               "exec_verdict":  "This assessment maps the maturity of {clientName}'s security programme against ISA/IEC 62443-2-1:2024. Of the Security Program Elements, maturity is lowest in {weakestElementName}. The roadmap in this report concentrates on the requirements that are not met or are at the lowest maturity.",
                                               "exec_verdict_nogaps":  "This assessment maps the maturity of {clientName}'s security programme against ISA/IEC 62443-2-1:2024 and sets out the achieved-maturity profile across the Security Program Elements. Every requirement is met at some level.",
                                               "exec_scope":  "The assessment covered {answeredCount} applicable security-programme requirements across {elementCount} Security Program Elements{notMetClause}.",
                                               "exec_profile":  "The achieved-maturity profile is {ml1} at ML1, {ml2} at ML2, {ml3} at ML3 and {ml4} at ML4, with {notMet} not met.",
                                               "exec_profile_targets":  "Against the target maturity, {meeting} of {compared} assessed requirements meet their target and {below} fall short.",
                                               "exec_gap_shape":  "{gapConcentrationSentence} Maturity is uneven across the programme, and the weakest Security Program Element is {weakestElementName}{weakestDetail}.",
                                               "exec_path_forward":  "The roadmap in this report takes account of OT operating constraints. It deals first with the requirements that are not met, then raises the programme's maturity where the need is greatest.",
                                               "exec_confidence":  "These findings are based on the {coveragePct} of applicable requirements that could be assessed ({confidenceLabel}). Mean maturity is shown for context only. A not-met requirement is reported separately as a floor finding, so the mean cannot hide it.",
                                               "gapConcentrationFragments":  {
                                                                                 "notMet":  "{notMet} requirement(s) are not met, so those practices are not performed at any level.",
                                                                                 "lowMaturity":  "Maturity clusters at the lower levels in {lowMaturityList}."
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_profile_method":  "ISA/IEC 62443-2-1:2024 assesses each requirement independently at one maturity level (ML1 Initial, ML2 Managed, ML3 Defined / Practiced, ML4 Improving). The results form a maturity profile with no single grade, because a programme can be strong in one element and weak in another. An average would hide the gaps that most need attention, so the roadmap is built from specific requirements.",
                                                 "stakes":  "Maturity describes how reliably a security programme practice is performed. ML1 is ad hoc, ML2 is documented and repeatable, ML3 is actively practised on the IACS, and ML4 is measured and improving. A requirement that is Not met is not performed at any level. Low-maturity and not-met requirements are the practices most likely to fail in day-to-day OT operation.",
                                                 "not_determination":  "This is a maturity assessment of the security programme against ISA/IEC 62443-2-1:2024, set by the consultant against the ML anchors and informed by the OT context. It is not a certification and does not by itself establish conformance with the standard. The achieved maturity reflects what could be demonstrated during the engagement and should be confirmed during remediation."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "For {clientName}, the lowest programme maturity is in {weakestElementName}.{notMetExposureClause}",
                                                      "consultant_exposure_notmet_clause":  " Where requirements are not met, parts of the security programme are not performed at all, and the organisation is least prepared for an incident in those areas.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on what the weakest Security Program Elements mean operationally for this organisation, and any safety or availability implications.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this programme.]"
                                                  }
                         }
};
