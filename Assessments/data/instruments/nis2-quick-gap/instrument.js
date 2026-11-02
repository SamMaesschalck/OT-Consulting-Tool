/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nis2-quick-gap/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nis2-quick-gap"] = window.App.Data.instruments["nis2-quick-gap"] || {};
window.App.Data.instruments["nis2-quick-gap"].instrument = {
    "id":  "nis2-quick-gap",
    "title":  "EU NIS2 Quick Gap Assessment",
    "framework":  "Directive (EU) 2022/2555 (NIS2)",
    "edition":  "2022/2555",
    "family":  "regulation",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "nis2-conformance",
    "scoringProfileRef":  "nis2-conformance",
    "targetDimension":  "organisation",
    "targetDimensionLabel":  "Entity",
    "status":  "active",
    "framing":  "A rapid, high-level gap read against the EU NIS2 Directive (Directive (EU) 2022/2555): one question for governance (Article 20), one for each of the ten risk-management measures (Article 21(2)(a)-(j)), and one for incident reporting (Article 23). Each is judged Achieved / Partially Achieved / Not Achieved. It is a fast triage to show where to look first; the full NIS2 Assessment provides the obligation-by-obligation view. This is a readiness gap analysis, not a determination of legal compliance with NIS2 or its national transposition.",
    "sourceNote":  "High-level items paraphrased from Directive (EU) 2022/2555, Articles 20, 21 and 23. Confirm scope against the relevant national transposition; verify wording against the official Official Journal text. The \u0027rationale\u0027 (why this matters) for each item is best-practice interpretation (e.g. ISO/IEC 27001, NIST CSF, ENISA guidance) explaining the security intent; it is not text from, or a legal interpretation of, the Directive.",
    "states":  [
                   {
                       "value":  "achieved",
                       "label":  "Achieved",
                       "colour":  "met"
                   },
                   {
                       "value":  "partially",
                       "label":  "Partially achieved",
                       "colour":  "near"
                   },
                   {
                       "value":  "not",
                       "label":  "Not achieved",
                       "colour":  "gap"
                   },
                   {
                       "value":  "unknown",
                       "label":  "Unknown",
                       "effect":  "coverage + confidence, not scored"
                   },
                   {
                       "value":  "na",
                       "label":  "Not applicable",
                       "effect":  "excluded"
                   }
               ],
    "categories":  [
                       {
                           "id":  "GOV",
                           "name":  "Governance and accountability",
                           "article":  "Art 20"
                       },
                       {
                           "id":  "RM",
                           "name":  "Risk-management measures",
                           "article":  "Art 21(2)"
                       },
                       {
                           "id":  "REP",
                           "name":  "Incident reporting",
                           "article":  "Art 23"
                       }
                   ],
    "items":  [
                  {
                      "id":  "GOV.1",
                      "categoryId":  "GOV",
                      "code":  "GOV",
                      "title":  "Governance and accountability",
                      "requirement":  "The management body approves and oversees the cybersecurity risk-management measures, is accountable for compliance, and management and staff receive cybersecurity training.",
                      "rationale":  "Board-level approval, oversight, accountability and training turn cybersecurity into a governed business risk with the mandate and funding to be enforced. NIS2 places this responsibility explicitly on management.",
                      "evidencePrompt":  "Record evidence of management approval, oversight, accountability and training.",
                      "articleRef":  "Art 20",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.A",
                      "categoryId":  "RM",
                      "code":  "A",
                      "title":  "Risk analysis and IS security policies",
                      "requirement":  "Policies on risk analysis and information system security are in place, based on an all-hazards approach.",
                      "rationale":  "Risk-based prioritisation and an approved security policy are the foundation of a credible programme, directing effort at the threats that matter and setting a consistent baseline for everyone to follow.",
                      "evidencePrompt":  "Record the risk analysis and security policies and how they are applied.",
                      "articleRef":  "Art 21(2)(a)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.B",
                      "categoryId":  "RM",
                      "code":  "B",
                      "title":  "Incident handling",
                      "requirement":  "An incident handling capability (detection, analysis, response, recovery) is in place.",
                      "rationale":  "A defined detect-respond-recover capability limits the dwell time and impact of the serious incidents that are a matter of when, not if. Ad-hoc response multiplies damage and cost.",
                      "evidencePrompt":  "Record the incident handling capability.",
                      "articleRef":  "Art 21(2)(b)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.C",
                      "categoryId":  "RM",
                      "code":  "C",
                      "title":  "Business continuity and crisis management",
                      "requirement":  "Business continuity, including backup management and disaster recovery, and crisis management are in place.",
                      "rationale":  "Tested backups, defined recovery objectives and rehearsed crisis arrangements decide whether a major attack is an inconvenience or an existential event. Tested, protected backups are the key defence against ransomware.",
                      "evidencePrompt":  "Record BC/DR, backups and crisis management arrangements.",
                      "articleRef":  "Art 21(2)(c)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.D",
                      "categoryId":  "RM",
                      "code":  "D",
                      "title":  "Supply chain security",
                      "requirement":  "Supply chain security, including the security of relationships with direct suppliers and service providers, is managed.",
                      "rationale":  "Attackers increasingly enter through trusted third parties. Managing supplier and service-provider risk closes a blind spot that perimeter controls cannot, and is central to NIS2\u0027s emphasis on the supply chain.",
                      "evidencePrompt":  "Record how supplier security risk is assessed and managed.",
                      "articleRef":  "Art 21(2)(d)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.E",
                      "categoryId":  "RM",
                      "code":  "E",
                      "title":  "Acquisition, development and maintenance",
                      "requirement":  "Security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure, is in place.",
                      "rationale":  "Building and buying securely, with managed vulnerability handling, prevents weaknesses being designed in and shrinks the window of known, unpatched vulnerabilities that attackers exploit.",
                      "evidencePrompt":  "Record secure acquisition/development and vulnerability handling.",
                      "articleRef":  "Art 21(2)(e)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.F",
                      "categoryId":  "RM",
                      "code":  "F",
                      "title":  "Assessing effectiveness",
                      "requirement":  "Policies and procedures to assess the effectiveness of the cybersecurity risk-management measures are in place.",
                      "rationale":  "Controls that are never tested give false assurance. Assessment, testing and metrics confirm that measures actually work and provide the evidence that drives continual improvement.",
                      "evidencePrompt":  "Record how effectiveness is assessed (audit, test, metrics).",
                      "articleRef":  "Art 21(2)(f)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.G",
                      "categoryId":  "RM",
                      "code":  "G",
                      "title":  "Cyber hygiene and training",
                      "requirement":  "Basic cyber hygiene practices and cybersecurity training are in place.",
                      "rationale":  "Fundamentals (patching, secure configuration, least privilege and regular training) stop a large share of attacks by removing the easy wins attackers rely on.",
                      "evidencePrompt":  "Record cyber hygiene baseline and training.",
                      "articleRef":  "Art 21(2)(g)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.H",
                      "categoryId":  "RM",
                      "code":  "H",
                      "title":  "Cryptography and encryption",
                      "requirement":  "Policies and procedures on the use of cryptography and, where appropriate, encryption are in place.",
                      "rationale":  "Encryption protects confidentiality and integrity when other controls fail (in transit, at rest and on lost devices) provided it is applied consistently with sound key management.",
                      "evidencePrompt":  "Record cryptography/encryption use and policy.",
                      "articleRef":  "Art 21(2)(h)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.I",
                      "categoryId":  "RM",
                      "code":  "I",
                      "title":  "HR security, access control and asset management",
                      "requirement":  "Human resources security, access control policies and asset management are in place.",
                      "rationale":  "Knowing your assets, controlling identities to least privilege and managing people through the employment lifecycle remove the most common enablers of serious breaches.",
                      "evidencePrompt":  "Record HR security, access control and asset management.",
                      "articleRef":  "Art 21(2)(i)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.J",
                      "categoryId":  "RM",
                      "code":  "J",
                      "title":  "MFA and secured communications",
                      "requirement":  "Multi-factor or continuous authentication and secured (including emergency) communications are used where appropriate.",
                      "rationale":  "MFA blocks the overwhelming majority of account-takeover attacks, especially for remote and privileged access, and secured, resilient communications keep the entity able to coordinate during an incident.",
                      "evidencePrompt":  "Record MFA coverage and secured communications.",
                      "articleRef":  "Art 21(2)(j)",
                      "allowNA":  true
                  },
                  {
                      "id":  "REP.1",
                      "categoryId":  "REP",
                      "code":  "REP",
                      "title":  "Incident reporting readiness",
                      "requirement":  "The entity can identify significant incidents and meet the early-warning (24h), notification (72h) and final-report (one month) timeline, and notify recipients where appropriate.",
                      "rationale":  "NIS2 sets hard reporting deadlines: 24h early warning, 72h notification, one-month final report. The ability to identify a significant incident and meet the timeline must be rehearsed, because these windows are too short to improvise.",
                      "evidencePrompt":  "Record the reporting process and the entity\u0027s ability to meet the timeline.",
                      "articleRef":  "Art 23",
                      "allowNA":  true
                  }
              ],
    "_contentNote":  "Quick triage: one item per NIS2 area (Art 20, each Art 21(2) measure, Art 23). Paraphrased, not verbatim. The full NIS2 Assessment breaks each into obligation-level items.",
    "seriesContext":  "The NIS2 Directive (EU) 2022/2555 is European law. It does not apply directly: each member state transposes it into national law, so the detail an entity must meet is set nationally and can differ between states. This is a short screening pass over the Directive\u0027s obligations, used to decide where a full assessment is warranted. It is a gap analysis, not a legal opinion and not a determination by a competent authority."
};
