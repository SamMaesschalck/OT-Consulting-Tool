/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-2-1-2010/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-2-1-2010"] = window.App.Data.instruments["iec-62443-2-1-2010"] || {};
window.App.Data.instruments["iec-62443-2-1-2010"].narrative = {
    "_note":  "Narrative for the ISA/IEC 62443-2-1:2010 CSMS conformance assessment. Boilerplate inserted VERBATIM; the executive summary is composed by slot-substitution only (no free-writing). The instrument framing supplies 'About this assessment'; this pack adds the composed executive summary, a caveat box and the consultant blocks. Aim: a conformance PROFILE by category and element group - never a single CSMS grade - with Not-in-place / Partially-in-place elements surfaced as the gap roadmap.",
    "boilerplate":  {
                        "report_intro":  "This report presents a conformance and gap analysis of the organisation's Cyber Security Management System (CSMS) against ISA/IEC 62443-2-1:2010. It records, for each CSMS element, whether it is Not in place, Partially in place, Largely in place or In place, and sets out a prioritised roadmap for the elements not yet in place.",
                        "not_certification_caveat":  "This is a conformance and gap analysis of the CSMS against ISA/IEC 62443-2-1:2010. The consultant has judged each element to be Not in place, Partially in place, Largely in place or In place. The results are a conformance profile by category and element group, with no single CSMS grade. The analysis does not certify the CSMS or state conformance with the standard. The 2024 edition restructures the CSMS into a maturity-based Security Program and is assessed separately, so its results should not be read as a later view of this assessment. The judgements reflect what could be demonstrated at the time and should be confirmed during remediation.",
                        "series_context":  "ISA/IEC 62443 is a series of standards, divided according to who is responsible for what. This part, 62443-2-1:2010, deals with the organisation and the cyber security management system it is expected to establish and maintain. The 3-x parts address the system as designed and operated, and the 4-x parts the products it is built from. A technical assessment against 62443-3-3 answers a different question from this one, and a complete picture needs both."
                    },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only; boilerplate VERBATIM; consultant blocks seeded with data-derived facts plus a marked placeholder. No free-writing. Order: verdict, scope + profile, gap-shape, conformance-method + stakes, path forward + confidence.",
                             "templates":  {
                                               "exec_verdict":  "This assessment finds that {clientName}'s cyber security management system {verdictPhrase} against ISA/IEC 62443-2-1:2010. {weakestCategoryLead}{weakestCategoryName}{weakestDetail}.",
                                               "exec_verdict_nogaps":  "This assessment finds that {clientName}'s cyber security management system {verdictPhrase} against ISA/IEC 62443-2-1:2010, with every applicable element In place or Largely in place.",
                                               "exec_scope":  "The assessment covered {answeredCount} applicable CSMS elements across the standard's three categories: Risk analysis, Addressing risk with the CSMS, and Monitoring and improving the CSMS.",
                                               "exec_profile":  "Of these, {inPlace} are In place, {largely} Largely in place, {partially} Partially in place and {notInPlace} Not in place.",
                                               "exec_gap_shape":  "{gapConcentrationSentence}",
                                               "exec_path_forward":  "The roadmap in this report takes account of OT operating constraints. It deals first with the elements that are Not in place, then works towards full conformance of the CSMS.",
                                               "exec_confidence":  "Coverage is {coveragePct} of the applicable elements ({confidenceLabel}). The overall conformance index, {conformancePct}, is shown for context only. A Not-in-place element is reported separately as a floor finding, so the average cannot hide it.",
                                               "verdictPhrases":  {
                                                                      "substantial":  "has substantial gaps in conformance",
                                                                      "recognised":  "is partly conformant",
                                                                      "strong":  "is largely conformant"
                                                                  },
                                               "gapConcentrationFragments":  {
                                                                                 "notInPlace":  "",
                                                                                 "partially":  ""
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_conformance_method":  "ISA/IEC 62443-2-1:2010 defines a Cyber Security Management System as a set of elements in three categories. The first establishes why security matters and assesses the risk. The second addresses that risk through policy, organisation, countermeasures and implementation, and the third monitors and improves the system over time. Conformance is judged for each element, and there is no single grade. A CSMS can be strong in one area and missing in another, and a blended score would hide the gaps that most need attention.",
                                                 "stakes":  "An element that is Not in place is missing from the management system. Partially in place means the element exists but is incomplete, and Largely in place means it is close to conformant. The CSMS keeps OT security planned and maintained, so a gap in it makes it more likely that security lapses over time.",
                                                 "not_determination":  ""
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_seed":  "",
                                                      "consultant_exposure_floor_clause":  " Not-in-place elements mean parts of the management system are absent, and the organisation is less prepared for an incident in those areas.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note on what the weakest CSMS categories mean operationally for this organisation, and any safety or availability implications.]",
                                                      "consultant_top_priorities_seed":  "The most urgent priorities are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this CSMS.]"
                                                  }
                         }
};
