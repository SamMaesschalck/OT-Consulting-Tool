/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/supplier-screener/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["supplier-screener"] = window.App.Data.instruments["supplier-screener"] || {};
window.App.Data.instruments["supplier-screener"].narrative = {
    "_note":  "Narrative for the Supplier Cyber Exposure Screener report. Boilerplate and domain text inserted VERBATIM; data lines composed ONLY from templates. The generator must not free-write prose. Same keys and slots as the posture pack.",
    "boilerplate":  {
                        "report_intro":  "This report gives management and procurement a high-level view of the cyber exposure carried through {targetName}, as an early indication of where the supplier is strong and where to act first. The screening covered six domains and drew on the supplier's answers and the evidence it offered. Where the screening was run as a self-assessment, 'the supplier' means the assessed organisation itself. The detail for each question is in the companion workbook.",
                        "about_instrument":  "The screening covers the supplier's corporate security and assurance, secure development practice, product security capability, vulnerability handling and support, regulatory readiness, and the operational dependency the customer carries through the supply chain. The consultant scores each answer on what was said and shown, so the grade reflects what the screening could establish and has not been verified. The screening is not a conformance assessment against a standard such as ISA/IEC 62443, and it is not a regulatory determination.",
                        "how_to_read":  "Each question is scored on a four-point scale, from not in place to fully in place and managed, using the consultant's judgement of the answer. The questions are grouped into six domains, and each domain receives a grade. The overall grade starts from the average across the domains. It is then capped at two grades above the weakest domain, and the top grade is given only when every domain reaches it, so one area in poor shape pulls the headline down sharply. A coverage figure shows how many questions could be answered. Where coverage is low, the grade is shown as indicative only and should be confirmed. An unknown answer reduces coverage and is not counted as a failure, and questions that do not apply are excluded. With a supplier, though, a repeated inability to answer says something about its transparency.",
                        "method":  "The screening was carried out as a structured review with the supplier's product, security and account contacts, supported by the certificates, policies, advisories and contract terms available at the time. Each scored answer reflects the consultant's judgement of the response given. [Consultant to confirm or adjust this description so it matches how the screening was run, including whether it was run as a supplier assessment or a self-assessment.]",
                        "limitations":  "This is a point-in-time screening based on the supplier's answers and the evidence it chose to share. It does not verify the supplier's controls in technical depth, which is the role of the deep assessments it points to (ISA/IEC 62443-4-1 for development practice, the EU CRA and Machinery Regulation gap assessments for the regulatory position). Where coverage was low or answers were uncertain, the grade should be treated as provisional.",
                        "indicative_grade_caveat":  "The grade in this report is an indicative, high-level judgement based on the screening and the evidence available at the time. It does not measure conformance against ISA/IEC 62443 or any other standard, and it is not a regulatory determination about the supplier or its products. It shows where the supplier's cyber position stands and where to look deeper first. Conformance can only be established by detailed assessments in the priority areas.",
                        "unknown_explained":  "An Unknown answer does not move a domain's capability score up or down. Not knowing is treated as a finding about visibility. It is not treated as a known gap in control, so the lowest band (0, Not in place) remains the worst capability score and Unknown does not sit below it. Unknown answers do reduce the coverage figure and lower confidence in the grade. Where a supplier repeatedly cannot or will not answer, that should be read as a finding about the relationship.",
                        "series_context":  "The screening is used to decide where a fuller assessment is justified. The supplier's actual position is established by the deep assessments it points to."
                    },
    "executiveSummary":  {
                             "_note":  "Composed by slot-substitution only; boilerplate inserted VERBATIM; consultant blocks seeded with data-derived facts plus a marked placeholder. No free-writing. Screener aim: an indicative capped-average headline grade showing where to look deeper first - NOT a conformance or regulatory determination.",
                             "templates":  {
                                               "exec_verdict":  "This screening gives {clientName} an indicative supplier cyber exposure grade of {headlineGrade}. The weakest domain is {weakestDomainName}, and the priorities and recommended deeper assessments in this report concentrate on the lower-scoring domains.",
                                               "exec_verdict_nogaps":  "This screening gives {clientName} an indicative supplier cyber exposure grade of {headlineGrade}, with no domain falling into the lower bands.",
                                               "exec_scope":  "The screening covered {assessedDomainCount} supplier exposure domains, and {answeredCount} of {scorableCount} applicable questions were answered.",
                                               "exec_profile":  "Each domain is graded on the consultant's judgement of the answers given, and the domain grades combine into the headline grade above.",
                                               "exec_gap_shape":  "Grades vary across the domains. {gapConcentrationSentence}{capClause}",
                                               "exec_path_forward":  "The lower-scoring areas can be addressed with the supplier directly, through the contract or through the deeper assessments recommended here. The priorities in this report show where to act first.",
                                               "exec_confidence":  "This grade is based on answers to {coveragePct} of applicable questions ({confidenceLabel}).",
                                               "capClause":  " The headline has been held down to {headlineGrade}, because it may not sit more than two grades above the weakest domain and the stronger domains cannot average it up.",
                                               "capClauseCeiling":  " With {weakestDomainName} graded {weakestGrade}, the headline could not have been higher than {headlineGrade}.",
                                               "capClauseUnanimous":  " The top grade is reserved for an assessment where every domain reaches it, so the headline is held at {headlineGrade}.",
                                               "gapConcentrationFragments":  {
                                                                                 "lowGrades":  "The lowest-graded domains are {lowGradeList}.",
                                                                                 "lowCoverage":  "Coverage was below the threshold in {lowCoverageList}, so those domains are reported as indicative only."
                                                                             }
                                           },
                             "boilerplate":  {
                                                 "exec_weakest_domain":  "The overall grade starts from the average across the graded domains and is then capped at two grades above the weakest of them. The top grade is reserved for a set of domains that are all strong, so one weak area cannot hide behind stronger ones. With a supplier, the weakest area usually decides the exposure the customer inherits, and strong development practice does not make up for an unmanaged remote access path or a missed conformity deadline. The priorities below are therefore set for each domain.",
                                                 "exec_indicative":  "The grade is an early view of where the exposure sits and where to look deeper first. It does not verify the supplier's controls in technical depth. The deeper assessments do that: 62443-4-1 for development practice, and the EU CRA and Machinery Regulation gap assessments for the regulatory position.",
                                                 "not_determination":  "This screening was carried out on the supplier's answers at a point in time. It is not a conformance assessment against a standard or a regulatory determination, and the grade should be confirmed by the more detailed assessments it recommends."
                                             },
                             "consultantBlocks":  {
                                                      "consultant_exposure_lowcov_clause":  " Coverage in one or more domains was below the threshold, so some of these findings are provisional and should be confirmed.",
                                                      "consultant_exposure":  "[Consultant to add a short, client-specific note: what this supplier provides, how dependent operations are on it, and the operational or regulatory consequence of the weakest domains for this relationship.]",
                                                      "consultant_top_priorities_seed":  "The most pressing areas are likely to be {autoTopPriorityHint}.",
                                                      "consultant_top_priorities_placeholder":  "[Consultant to confirm and refine the top one or two priorities for this supplier relationship, including which deep-dive assessment to commission first and what to fix through contract.]"
                                                  }
                         },
    "domain_narrative":  {
                             "corp":  {
                                          "purpose":  "The questions in this domain test whether the supplier's own security has an owner, whether its certificates have a meaningful scope, and whether it backs its security with contractual commitments and openness.",
                                          "why_it_matters":  "A supplier that names a security owner, evidences its certificates and signs security commitments is likely to behave the same way for the life of the relationship, including during an incident. A supplier that is evasive on these points is usually evasive elsewhere too."
                                      },
                             "dev":  {
                                         "purpose":  "This domain asks whether the products the customer buys are developed under a working secure development lifecycle, tested for security, and built and delivered with integrity.",
                                         "why_it_matters":  "Product security has to be built in during development, because it cannot be added afterwards. A compromise of the supplier's build and delivery chain reaches every customer at once. An ISA/IEC 62443-4-1 assessment examines this domain in depth."
                                     },
                             "prod":  {
                                          "purpose":  "This domain covers the security capabilities an OT operator needs in the products themselves: secure defaults, per-user access control, usable logging and a practical, secure update path.",
                                          "why_it_matters":  "Policy cannot add a capability the product lacks, so shared logins, devices that log nothing and units that cannot be patched set the customer's exposure for the equipment's whole service life. The EU CRA also makes these capabilities essential requirements and a legal condition of market access."
                                      },
                             "vuln":  {
                                          "purpose":  "The supplier has to be able to receive, fix and communicate vulnerabilities for the whole service life of the equipment, and these questions test whether it can.",
                                          "why_it_matters":  "Every product has vulnerabilities, and the supplier's handling of them decides whether the customer receives advisories and patches or hears nothing. Measured against OT lifespans, support periods are among the most important terms in the relationship, and among the most negotiable."
                                      },
                             "reg":  {
                                         "purpose":  "The questions ask whether the supplier knows which EU product regulations apply to what it sells, whether it is on a credible path to conformity by the deadlines, and whether it could meet its reporting duties.",
                                         "why_it_matters":  "From 2027 non-conforming products cannot lawfully be supplied. If a supplier misses a CRA or Machinery Regulation deadline, the procurement and continuity problem passes to the customer partway through the contract. This domain shows whether a full gap assessment is needed urgently, and that assessment establishes the actual position."
                                     },
                             "chain":  {
                                           "purpose":  "Some exposure comes through the relationship itself: what is inside the products, what access the supplier holds into the customer's estate, and what happens if the supplier fails or withdraws.",
                                           "why_it_matters":  "Supplier remote access is one of the most common unrecorded paths into OT estates. The next Log4j will appear in components nobody has listed, and continuity terms cannot be obtained once a supplier is already failing. In this domain the customer has the most direct control over supplier risk, largely through the contract."
                                       }
                         },
    "templates":  {
                      "headline":  "The overall indicative supplier exposure grade is {headlineGrade}. It starts from the average across the six domains and is held to no more than two grades above the weakest of them.",
                      "coverage_overall":  "This grade is based on answers to {overallCoveragePct} of the applicable questions.",
                      "low_confidence_flag":  "Overall coverage is below {coverageThresholdPct}, so this is a low-confidence first view that needs to be confirmed.",
                      "domain_result":  "{domainName}: graded {domainGrade} (based on {answered} of {scorable} questions answered).",
                      "domain_low_coverage":  "{domainName}: insufficient evidence to grade with confidence ({answered} of {scorable} answered). Indicative grade {domainGrade}, to be confirmed.",
                      "all_top_band":  "Every question in this domain was answered at the top band, so there are no lower-scoring points to note.",
                      "unknown_questions_intro":  "The points that could not be established in this domain were:",
                      "unknown_question_item":  "{prompt} (not established).",
                      "weakest_questions_intro":  "The lowest-scoring points in this domain were:",
                      "weakest_question_item":  "{prompt} (scored {bandLabel}).",
                      "safety_note":  "This point concerns a safety-related system and should be treated as a priority.",
                      "headline_cap_note_unanimous":  "The top grade is awarded only where every domain reaches it, so the headline is held at {headlineGrade} even though the average is higher. The domains below the top grade are named in the results.",
                      "headline_cap_note":  "The grade has been held down relative to the weakest domain, {weakestDomain} ({weakestGrade}), so a single weak area is not hidden by stronger ones.",
                      "headline_cap_note_multi":  "The grade has been held down relative to the weakest domains ({weakestDomainsList}, all {weakestGrade}), so a cluster of weak areas is not hidden by stronger ones.",
                      "weakest_named":  "The weakest domain is {weakestDomain}, graded {weakestGrade}.",
                      "weakest_named_multi":  "The weakest domains are {weakestDomainsList}, all graded {weakestGrade}.",
                      "priority_intro":  "The assessed domains in order of priority, weakest first:",
                      "priority_item":  "{rank}. {domainName}: {domainGrade}",
                      "priority_insufficient_intro":  "Domains where the coverage was below the threshold and so could not be graded with confidence:",
                      "priority_insufficient_item":  "{domainName} (coverage {coveragePct})",
                      "unknown_finding":  "{unknownCount} of {attemptedCount} attempted question(s) in this domain were answered Unknown ({unknownRatePct}). The supplier could not or would not confirm the state of those areas, and that lack of transparency is reported as a finding.",
                      "confidence_note":  "Confidence in this grade is {confidenceLabel}, because of the share of answers that were Unknown.",
                      "overall_unknown_finding":  "Across the screening, {unknownCount} of {attemptedCount} attempted question(s) were answered Unknown ({unknownRatePct}). The overall grade is reported with {confidenceLabel}."
                  }
};
