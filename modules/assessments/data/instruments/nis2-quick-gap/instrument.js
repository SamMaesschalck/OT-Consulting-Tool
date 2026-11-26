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
    "framing":  "This is a short, high-level gap check against the EU NIS2 Directive (Directive (EU) 2022/2555). It asks one question on governance (Article 20), one on each of the ten risk-management measures in Article 21(2)(a)-(j) and one on incident reporting (Article 23). Each answer is judged Achieved, Partially Achieved or Not Achieved. The result shows where to look first, and the full NIS2 Assessment covers each obligation in detail. The check supports readiness work and does not determine legal compliance with NIS2 or its national transposition.",
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
                      "rationale":  "When the management body approves and oversees the measures, is accountable for them and is trained, cybersecurity is governed as a business risk with the authority and funding to be enforced. NIS2 places this responsibility on management explicitly.",
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
                      "rationale":  "Risk analysis directs effort at the threats that matter most to the entity. An approved security policy sets a consistent baseline for everyone to follow.",
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
                      "rationale":  "Every entity should expect a serious incident at some point. A defined capability to detect, respond and recover shortens the time an attacker goes unnoticed and limits the impact. An improvised response usually adds to the damage and the cost.",
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
                      "rationale":  "Tested backups, defined recovery objectives and rehearsed crisis arrangements largely decide how much harm a major attack does. Backups that are protected and tested are the main defence against ransomware.",
                      "evidencePrompt":  "Record the business continuity, disaster recovery, backup and crisis management arrangements.",
                      "articleRef":  "Art 21(2)(c)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.D",
                      "categoryId":  "RM",
                      "code":  "D",
                      "title":  "Supply chain security",
                      "requirement":  "Supply chain security, including the security of relationships with direct suppliers and service providers, is managed.",
                      "rationale":  "Attackers increasingly get in through trusted suppliers and service providers, a route that perimeter controls do not cover. Managing that risk is central to the NIS2 requirements on the supply chain.",
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
                      "rationale":  "Security built into buying and developing systems stops weaknesses being designed in. Managed vulnerability handling shortens the time that known, unpatched vulnerabilities stay open to attackers.",
                      "evidencePrompt":  "Record the secure acquisition and development practices and how vulnerabilities are handled.",
                      "articleRef":  "Art 21(2)(e)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.F",
                      "categoryId":  "RM",
                      "code":  "F",
                      "title":  "Assessing effectiveness",
                      "requirement":  "Policies and procedures to assess the effectiveness of the cybersecurity risk-management measures are in place.",
                      "rationale":  "Controls that are never tested can give false assurance. Audits, tests and metrics show whether the measures work, and they provide the evidence for continual improvement.",
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
                      "rationale":  "Patching, secure configuration, least privilege and regular training stop a large share of attacks, because they remove the easy openings that many attackers rely on.",
                      "evidencePrompt":  "Record the cyber hygiene baseline and the training programme.",
                      "articleRef":  "Art 21(2)(g)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.H",
                      "categoryId":  "RM",
                      "code":  "H",
                      "title":  "Cryptography and encryption",
                      "requirement":  "Policies and procedures on the use of cryptography and, where appropriate, encryption are in place.",
                      "rationale":  "Encryption protects confidentiality and integrity in transit, at rest and on lost devices, including when other controls fail. It does so only when it is applied consistently and its keys are managed soundly.",
                      "evidencePrompt":  "Record the cryptography and encryption policy and where encryption is used.",
                      "articleRef":  "Art 21(2)(h)",
                      "allowNA":  true
                  },
                  {
                      "id":  "RM.I",
                      "categoryId":  "RM",
                      "code":  "I",
                      "title":  "HR security, access control and asset management",
                      "requirement":  "Human resources security, access control policies and asset management are in place.",
                      "rationale":  "An up-to-date asset inventory, least-privilege access and well-run joiner, mover and leaver processes remove the most common causes of serious breaches.",
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
                      "rationale":  "MFA, especially on remote and privileged access, blocks the great majority of account-takeover attacks. Secured and resilient communications let the entity coordinate during an incident.",
                      "evidencePrompt":  "Record MFA coverage and secured communications.",
                      "articleRef":  "Art 21(2)(j)",
                      "allowNA":  true
                  },
                  {
                      "id":  "REP.1",
                      "categoryId":  "REP",
                      "code":  "REP",
                      "title":  "Incident reporting readiness",
                      "requirement":  "The entity can identify significant incidents and meet the deadlines for the early warning (24 hours), the incident notification (72 hours) and the final report (one month), and it notifies service recipients where appropriate.",
                      "rationale":  "NIS2 sets fixed reporting deadlines of 24 hours for the early warning, 72 hours for the notification and one month for the final report. These are too short to improvise, so the entity needs to rehearse identifying a significant incident and meeting each deadline.",
                      "evidencePrompt":  "Record the reporting process and the entity\u0027s ability to meet the timeline.",
                      "articleRef":  "Art 23",
                      "allowNA":  true
                  }
              ],
    "_contentNote":  "Quick triage: one item per NIS2 area (Art 20, each Art 21(2) measure, Art 23). Paraphrased, not verbatim. The full NIS2 Assessment breaks each into obligation-level items.",
    "seriesContext":  "The NIS2 Directive (EU) 2022/2555 is European law, but it does not apply directly. Each member state transposes it into national law, so the detail an entity must meet is set nationally and can differ between states. This short screening of the Directive\u0027s obligations is used to decide where a full assessment is needed. It is a gap analysis. It is not a legal opinion and is not a determination by a competent authority."
};
