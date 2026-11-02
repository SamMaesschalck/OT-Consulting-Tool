/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/supplier-screener/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["supplier-screener"] = window.App.Data.instruments["supplier-screener"] || {};
window.App.Data.instruments["supplier-screener"].instrument = {
  "id": "supplier-screener",
  "title": "Supplier Cyber Exposure Screener",
  "edition": "2026",
  "contentVersion": "1.0.0",
  "scoringFamily": "domain-letter",
  "targetDimension": "supplier",
  "targetDimensionLabel": "Supplier",
  "scoringProfileRef": "posture-domain-letter",
  "docxCover": {
    "titleLines": ["Supplier Cyber", "Exposure Screener"],
    "description": "Executive supplier cyber exposure screening"
  },
  "notes": "High-level, interview-based screener of the cyber exposure a supplier brings: their corporate security, development practice, product security, vulnerability handling, regulatory readiness and the operational dependency you carry. Two stances share the same questions: assess-a-supplier (you screening a vendor, from their answers and evidence) or self-assess (a supplier screening itself before its customers do, where 'the supplier' means your own organisation). Every scored question's band is set by the consultant using judgement of the answer; the tool never derives the band from captured fields. Indicative and deliberately shallow: each weak domain routes into the deep assessment that establishes the real position.",
  "responseModel": {
    "bandScale": [
      { "value": 0, "label": "Not in place" },
      { "value": 1, "label": "Partial / ad hoc" },
      { "value": 2, "label": "Largely in place" },
      { "value": 3, "label": "Fully in place and managed" }
    ],
    "specialStates": [
      { "value": "unknown", "label": "Unknown", "effect": "reduces coverage; not scored" },
      { "value": "na", "label": "Not applicable", "effect": "excluded from grading and coverage" }
    ],
    "rule": "The band is always set by the consultant. Capture fields (text, checklist, choice, boolean) inform and evidence the band but never set it."
  },
  "domains": [
    { "id": "corp",  "name": "Corporate security & assurance" },
    { "id": "dev",   "name": "Secure development practice" },
    { "id": "prod",  "name": "Product security capability" },
    { "id": "vuln",  "name": "Vulnerability handling & support" },
    { "id": "reg",   "name": "Regulatory exposure & readiness" },
    { "id": "chain", "name": "Supply chain & operational exposure" }
  ],
  "followUpRoutes": {
    "intro": "This screener is deliberately shallow: it shows where a supplier is weak, and each weak or ungradeable domain routes into the deep assessment that establishes the real position. Grades here are indicative reads of supplier answers, not verified findings.",
    "noneTriggered": "No domain graded low enough to trigger a deep-dive recommendation on this screen. Re-screen when the supplier's products, regulatory position or your dependency on them changes materially.",
    "routes": [
      {
        "domainId": "dev",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-1 Secure Product Development Lifecycle Assessment",
        "instrumentId": "iec-62443-4-1",
        "detail": "Assess the supplier's development practice in depth against 62443-4-1: security requirements, secure design and implementation, verification testing and defect management. The screener's read of their SDL is answers-based only."
      },
      {
        "domainId": "vuln",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-1 (defect & update management), and the EU CRA Gap Assessment Part II layer for CRA-scoped products",
        "instrumentId": "iec-62443-4-1",
        "detail": "Weak vulnerability handling is where supplier risk turns operational: verify the disclosure, remediation and update practices in depth, and for products in CRA scope assess the Annex I Part II obligations directly."
      },
      {
        "domainId": "prod",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-2 Component Security Assessment, or the EU CRA Annex I Part I layer",
        "instrumentId": "iec-62443-4-2",
        "detail": "Assess the product's own security capabilities in depth against the component requirements of ISA/IEC 62443-4-2, establishing the capability security level it can honestly claim per foundational requirement. For CRA-scoped products the Annex I Part I layer of the CRA gap assessment covers the essential requirements directly."
      },
      {
        "domainId": "reg",
        "grades": ["C", "D", "E", "F"],
        "title": "EU CRA Gap Assessment / EU Machinery Regulation Gap Assessment",
        "instrumentId": "eu-cra",
        "detail": "Establish the supplier's real regulatory position with the deep gap assessment that matches their products: the CRA for products with digital elements, the Machinery Regulation for machinery with digital control. Classification and conformity routes decide market access: too consequential to leave at screener depth."
      }
    ]
  },
  "questions": [
    {
      "id": "corp.1",
      "domainId": "corp",
      "prompt": "Does the supplier have a named security lead and a functioning security organisation?",
      "shortTitle": "Security lead and organisation",
      "rationale": "A supplier without anyone owning security cannot sustain any of the practices the rest of this screener asks about. The presence, seniority and reachability of a security function is the fastest single indicator of how the supplier will behave when something goes wrong with their product in your plant.",
      "goodLooksLike": "A named security officer or product-security lead with a route to management, a security function that answers questions directly (not via sales), and evidence the role survives reorganisations: policies signed, advisories authored, a contactable team.",
      "references": ["ISO/IEC 27001 (organisation of information security)", "ISA/IEC 62443-2-1", "NIS2 Art 21 (governance)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No identifiable security function or owner",
        "1": "Someone answers security questions, role informal or buried in IT",
        "2": "Named lead and team, but limited authority or product reach",
        "3": "Named, senior, reachable security function covering the products you buy"
      },
      "capture": [
        { "id": "who", "type": "choice", "label": "Who answers for security?", "options": ["No one identified", "Sales / account team", "IT security team", "Named security officer / PSIRT", "Other"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "corp.2",
      "domainId": "corp",
      "prompt": "Does the supplier hold security certifications, and do the scopes actually cover what you buy?",
      "shortTitle": "Certification scope",
      "rationale": "Certificates are the cheapest assurance a supplier can offer, and the most commonly mis-sold. An ISO 27001 certificate scoped to the corporate office says nothing about the product line, and a 62443 certificate for one product family is routinely presented as covering all of them. The scope statement, not the logo, is the evidence.",
      "goodLooksLike": "Current certificates (ISO 27001, IEC 62443-4-1/-4-2 or SDL certification, SOC 2 for services) with scope statements that name the products, development sites or services you actually consume: offered unprompted, with the certificate body verifiable.",
      "references": ["ISO/IEC 27001", "IEC 62443-4-1 / 62443-4-2 (ISASecure)", "SOC 2"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No certifications, or refuses to evidence them",
        "1": "Certificates exist but scopes are unclear or corporate-only",
        "2": "Relevant certificates, scope partially covers what you buy",
        "3": "Current certificates whose scopes verifiably cover the products/services you buy"
      },
      "capture": [
        { "id": "certs", "type": "checklist", "label": "Certifications sighted", "options": ["ISO/IEC 27001", "IEC 62443 (any part)", "SOC 2", "Cyber Essentials (Plus)", "Other", "None"] },
        { "id": "notes", "type": "text", "label": "Scope notes / evidence" }
      ]
    },
    {
      "id": "corp.3",
      "domainId": "corp",
      "prompt": "Will the supplier commit to security contractually, and is it transparent when asked?",
      "shortTitle": "Contractual commitment and transparency",
      "rationale": "What a supplier will sign predicts what it will do. Suppliers who accept security clauses, incident-notification duties and evidence rights have usually built the machinery to honour them; suppliers who strike every clause are telling you what to expect during an incident. Responsiveness to this screener itself is evidence.",
      "goodLooksLike": "Security schedule accepted in contract: incident and vulnerability notification to you within defined times, right to security evidence or audit, secure development commitments, and support/patch commitments for the products in use. Questionnaires answered substantively and promptly.",
      "references": ["NIS2 Art 21(2)(d) (supply chain security)", "NCSC supply chain security guidance", "ISA/IEC 62443-2-4 (service provider requirements)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Refuses security clauses and questionnaires",
        "1": "Answers selectively; contracts carry no security commitments",
        "2": "Some clauses accepted (e.g. notification), evidence rights limited",
        "3": "Substantive security schedule in contract and open, prompt transparency"
      },
      "capture": [
        { "id": "clauses", "type": "checklist", "label": "Commitments in place", "options": ["Incident notification to customer", "Vulnerability notification", "Evidence / audit rights", "Secure development commitment", "Patch/support commitment", "None"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },

    {
      "id": "dev.1",
      "domainId": "dev",
      "prompt": "Does the supplier follow a defined secure development lifecycle for the products you buy?",
      "shortTitle": "Secure development lifecycle",
      "rationale": "Product security is manufactured, not bolted on: threat modelling, security requirements and secure design decisions happen during development or not at all. A supplier that cannot describe its SDL in concrete terms for YOUR product line is describing an aspiration, and both the CRA and 62443-4-1 make the process itself the assessable object.",
      "goodLooksLike": "A documented SDL applied to the product line in question (security requirements, threat modelling, secure coding standards, defined security gates in the release process) with artefacts the supplier can show (redacted threat model, gate records), ideally aligned or certified to IEC 62443-4-1.",
      "references": ["IEC 62443-4-1", "EU CRA Annex I Part I (design, development and production)", "Microsoft SDL / OWASP SAMM"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No discernible secure development practice",
        "1": "Claims an SDL, cannot evidence it for this product line",
        "2": "SDL evidenced but partial (e.g. no threat modelling or gates)",
        "3": "Documented, evidenced SDL for this product line, aligned to 62443-4-1"
      },
      "capture": [
        { "id": "sdl", "type": "choice", "label": "SDL evidence", "options": ["None", "Claimed only", "Described with some artefacts", "Documented + artefacts", "Certified (e.g. 62443-4-1)"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "dev.2",
      "domainId": "dev",
      "prompt": "Is security testing built into the supplier's releases?",
      "shortTitle": "Security testing in releases",
      "rationale": "Testing is where an SDL either exists or doesn't: static analysis, dependency scanning and penetration testing leave artefacts that are easy to evidence and hard to fake. A supplier that ships OT products without security testing is outsourcing its test programme to your plant.",
      "goodLooksLike": "Static analysis and dependency/vulnerability scanning in the build pipeline, security-focused testing per release, and periodic independent penetration tests of the product (not just the website) with findings tracked to closure: summaries shareable under NDA.",
      "references": ["IEC 62443-4-1 (SVV practices)", "EU CRA Annex I Part I (testing)", "OWASP ASVS"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No security testing evident",
        "1": "Ad hoc or claimed testing, no artefacts",
        "2": "Pipeline scanning routine; independent product testing irregular",
        "3": "Layered testing per release incl. periodic independent product pen tests"
      },
      "capture": [
        { "id": "testing", "type": "checklist", "label": "Testing evidenced", "options": ["Static analysis", "Dependency scanning", "Fuzzing", "Product pen test (independent)", "None evidenced"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "dev.3",
      "domainId": "dev",
      "prompt": "Are releases built and delivered with integrity?",
      "shortTitle": "Build and release integrity",
      "rationale": "Build and delivery is the supply-chain attack surface: a compromised build server or update channel turns the supplier's every customer into a victim simultaneously. Signed artefacts and a controlled pipeline are what stand between you and the next 3CX or SolarWinds arriving with a valid supplier logo.",
      "goodLooksLike": "A controlled build environment with access control and provenance, signed firmware/installers verified on installation, delivery over authenticated channels, and integrity guidance (hashes, signatures) published so customers can verify what they received.",
      "references": ["IEC 62443-4-1 (SM practices)", "EU CRA Annex I (integrity, secure updates)", "SLSA / NIST SSDF"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unsigned artefacts, uncontrolled distribution",
        "1": "Some artefacts signed, build controls unclear",
        "2": "Signed releases; pipeline controls asserted, not evidenced",
        "3": "Controlled, evidenced pipeline with signed, verifiable releases"
      },
      "capture": [
        { "id": "integrity", "type": "checklist", "label": "Integrity measures", "options": ["Signed firmware/installers", "Published hashes", "Authenticated delivery portal", "Build provenance evidence", "None"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },

    {
      "id": "prod.1",
      "domainId": "prod",
      "prompt": "Do the products arrive securely configured by default, with real hardening guidance?",
      "shortTitle": "Secure by default and hardening guidance",
      "rationale": "Default credentials and open services on delivery move the security burden onto every customer, and in OT that burden is rarely picked up: the commissioning configuration IS the production configuration for years. Secure-by-default is also now a legal expectation for CRA-scoped products, not a differentiator.",
      "goodLooksLike": "No default or shared credentials (forced individual set-up), unnecessary services off on delivery, secure protocol options on by default, and a product-specific hardening guide the supplier maintains, not a generic 'apply your own policy' disclaimer.",
      "references": ["EU CRA Annex I Part I (secure by default)", "IEC 62443-4-2 (CR 1.5, CR 7.6, CR 7.7)", "CISA Secure by Design"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Default credentials / wide-open services on delivery",
        "1": "Hardening possible but manual and poorly documented",
        "2": "Reasonable defaults, gaps in guidance or residual open services",
        "3": "Secure by default with maintained product-specific hardening guidance"
      },
      "capture": [
        { "id": "defaults", "type": "checklist", "label": "Observed on delivery", "options": ["No default credentials", "Unused services disabled", "Secure protocols default", "Hardening guide provided", "None of these"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "prod.2",
      "domainId": "prod",
      "prompt": "Do the products support per-user access control and usable security logging?",
      "shortTitle": "Access control and logging",
      "rationale": "If the product cannot distinguish users or record what happened, no amount of customer-side control compensates: shared engineering logins and silent devices are how OT incidents become unreconstructable. These capabilities have to exist in the product before your policies can use them.",
      "goodLooksLike": "Individual accounts with role-based privileges (integrating with your directory where feasible), no hard-coded accounts, and security-relevant events (logons, configuration changes, failures) logged in a form that can be exported or forwarded to your monitoring.",
      "references": ["IEC 62443-4-2 (CR 1.x, CR 2.x, CR 6.x)", "EU CRA Annex I Part I (access control, logging)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Shared/hard-coded accounts, no security logging",
        "1": "Basic accounts or logs, not both, with real limitations",
        "2": "Per-user access and logging present, integration weak",
        "3": "Role-based per-user access and exportable security logging that fits OT monitoring"
      },
      "capture": [
        { "id": "caps", "type": "checklist", "label": "Product capabilities", "options": ["Per-user accounts", "Role-based privileges", "Directory integration", "Exportable security logs", "Hard-coded account present"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "prod.3",
      "domainId": "prod",
      "prompt": "Can the products be updated securely and practically in an OT environment?",
      "shortTitle": "Secure, practical updates",
      "rationale": "An update mechanism that needs a site visit, breaks certification or cannot be scheduled around production will not be used, and an insecure one is an attack channel. Update practicality is where product security meets plant reality, and it decides whether the supplier's fixes ever reach your estate.",
      "goodLooksLike": "Cryptographically signed updates verified by the device, rollback on failure, offline/staged installation options for air-gapped or windowed environments, clear compatibility statements, and no forced cloud dependency for security fixes.",
      "references": ["EU CRA Annex I Part I (secure updates)", "IEC 62443-4-2 (CR 3.10)", "IEC 62443-2-3 (patch management)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No viable update path for fielded units",
        "1": "Updates possible but unsigned or operationally impractical",
        "2": "Signed updates, practicality gaps (no rollback / no offline path)",
        "3": "Signed, verifiable, rollback-capable updates deployable within OT constraints"
      },
      "capture": [
        { "id": "updates", "type": "checklist", "label": "Update mechanism", "options": ["Signed + device-verified", "Rollback", "Offline/staged install", "Requires vendor visit", "Forced cloud dependency"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },

    {
      "id": "vuln.1",
      "domainId": "vuln",
      "prompt": "Does the supplier run a real vulnerability-handling process: disclosure route, triage and structured advisories?",
      "shortTitle": "Vulnerability handling process",
      "rationale": "Every product has vulnerabilities; what differentiates suppliers is whether they can receive, fix and tell you about them. A supplier with no disclosure route or advisory history either isn't finding vulnerabilities or isn't telling anyone: both are worse than a published CVE list. For CRA-scoped products this is a legal obligation (Annex I Part II).",
      "goodLooksLike": "A published coordinated vulnerability disclosure policy with a reachable contact (security.txt), a PSIRT or equivalent that triages on defined timelines, and a history of structured advisories (CVE/CSAF, affected versions, severity, fixed version) for the product line.",
      "references": ["EU CRA Annex I Part II", "ISO/IEC 29147 / 30111", "IEC 62443-4-1 (DM practices)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No disclosure route; no advisory history",
        "1": "Contactable but ad hoc; advisories rare or unstructured",
        "2": "CVD policy and advisories exist, cadence or structure inconsistent",
        "3": "Published CVD, functioning PSIRT and consistent structured advisories"
      },
      "capture": [
        { "id": "cvd", "type": "checklist", "label": "Evidenced", "options": ["Published CVD policy", "Reachable security contact", "CVE/CSAF advisories", "Advisory history for this product", "None found"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "vuln.2",
      "domainId": "vuln",
      "prompt": "Are security fixes produced on severity-driven timelines, separately from feature releases?",
      "shortTitle": "Severity-driven fix timelines",
      "rationale": "A critical fix that ships 'in the next annual release' (or only bundled with a paid upgrade) is not vulnerability handling, it is a sales motion. OT operators need fixes they can take without absorbing feature risk, and the fix cadence for past advisories is verifiable evidence of what you will actually get.",
      "goodLooksLike": "Documented remediation SLAs by severity, security patches decoupled from feature/major releases, fixes free of charge for supported versions, and a track record (advisory-to-fix intervals) that matches the policy.",
      "references": ["EU CRA Annex I Part II (security updates without delay, free of charge)", "IEC 62443-4-1 (DM-4)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Fixes only via major/paid upgrades, no timelines",
        "1": "Fixes happen, cadence unpredictable and bundled",
        "2": "Severity SLAs stated, record mostly supports them",
        "3": "Decoupled, free, severity-driven fixes with a verifiable track record"
      },
      "capture": [
        { "id": "cadence", "type": "choice", "label": "Fix delivery", "options": ["No pattern", "Bundled with releases", "Separate patches, irregular", "Separate patches on SLA"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "vuln.3",
      "domainId": "vuln",
      "prompt": "Are support periods defined and long enough for OT service life, with a managed end-of-support?",
      "shortTitle": "Support period and end of support",
      "rationale": "OT equipment runs for 15-25 years; a product supported for five leaves you a decade of unpatched exposure or a forced replacement project on the supplier's schedule. The support commitment (and how end-of-support is announced and managed) is one of the largest cost and risk terms in the relationship, and it is negotiable at purchase and rarely after.",
      "goodLooksLike": "Published support periods per product with security-fix commitments for the whole period, proportionate to OT lifespans (or extendable by agreement), advance end-of-support notice measured in years, and migration paths that do not orphan fielded estates.",
      "references": ["EU CRA (support period determination)", "IEC 62443-2-3", "Procurement security clauses"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No support commitment; EOL at supplier's whim",
        "1": "Support informal or short with abrupt EOL history",
        "2": "Published periods, adequate but inflexible or thinly noticed",
        "3": "Published OT-proportionate support with managed, long-notice end-of-support"
      },
      "capture": [
        { "id": "support", "type": "choice", "label": "Support commitment", "options": ["None stated", "< 5 years", "5-10 years", "> 10 years / extendable"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },

    {
      "id": "reg.1",
      "domainId": "reg",
      "prompt": "Does the supplier know which EU product regulations apply to what it sells you?",
      "shortTitle": "Regulatory scope awareness",
      "rationale": "A supplier that cannot say whether its product is in CRA scope, what its Annex III class is, or whether the Machinery Regulation's digital requirements bite, has not started the work those answers trigger. Their regulatory ignorance becomes your procurement risk: non-conforming products cannot lawfully be supplied, mid-contract.",
      "goodLooksLike": "The supplier states, per product: CRA scope and class (default/important/critical), Machinery Regulation applicability for machinery with digital control, RED/EMC positions, and its own NIS2 role where relevant (unprompted or on first asking, consistent with the product reality).",
      "references": ["EU CRA (Reg 2024/2847)", "EU Machinery Regulation (Reg 2023/1230)", "NIS2 (Dir 2022/2555)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unaware of or dismisses the applicable regulations",
        "1": "General awareness, no per-product position",
        "2": "Scope and class stated for main products, gaps or uncertainty at edges",
        "3": "Clear, credible per-product regulatory map incl. class and dates"
      },
      "capture": [
        { "id": "regs", "type": "checklist", "label": "Positions stated", "options": ["CRA scope + class", "Machinery Regulation position", "RED/EMC position", "NIS2 role", "None"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "reg.2",
      "domainId": "reg",
      "prompt": "Is the supplier on a credible path to conformity by the applicable dates?",
      "shortTitle": "Path to conformity",
      "rationale": "Knowing the obligations is not meeting them: the CRA's full obligations apply from 11 December 2027 and the Machinery Regulation from 14 January 2027, and notified-body capacity is the industry's shared bottleneck. A supplier that has not booked its route will not conjure one in the final year, and its products may become unsupplyable to you exactly when replacements are hardest.",
      "goodLooksLike": "Per product: conformity route chosen (self-assessment vs notified body, correctly derived from class), notified body engaged where required, technical documentation in progress, and dated plans that land before the applicable deadlines (shareable as a roadmap even if summarised).",
      "references": ["EU CRA Arts 32/Annex VIII (routes)", "EU Machinery Regulation Art 25/Annex I", "Notified-body engagement lead times"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No conformity plan; deadlines unacknowledged",
        "1": "Intends to comply, no route or dates",
        "2": "Route chosen and started, timeline tight or partially evidenced",
        "3": "Credible dated route per product, notified body engaged where required"
      },
      "capture": [
        { "id": "route", "type": "choice", "label": "Conformity route status", "options": ["None", "Claimed, unevidenced", "Route chosen, in progress", "Route complete / certified"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "reg.3",
      "domainId": "reg",
      "prompt": "Could the supplier meet its incident and exploited-vulnerability reporting duties, and would you hear about it?",
      "shortTitle": "Incident and vulnerability reporting duties",
      "rationale": "The CRA's Article 14 clock (24-hour early warning from 11 September 2026) is unmeetable without a rehearsed process, and a supplier that cannot notify a regulator in 24 hours will not notify you faster. Your own NIS2 and incident-response obligations depend on the supplier's willingness to tell you promptly that their product is being exploited in the wild.",
      "goodLooksLike": "A stood-up reporting process with named owners and out-of-hours cover for the statutory routes, plus a contractual commitment to notify affected customers of actively exploited vulnerabilities and product-relevant incidents within defined hours, with any exercise or live history as evidence.",
      "references": ["EU CRA Art 14", "NIS2 Art 23 (your own reporting dependencies)", "Contractual notification clauses"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No reporting process; no customer notification commitment",
        "1": "Ad hoc notification, nothing rehearsed or committed",
        "2": "Process defined; customer notification informal or slow",
        "3": "Rehearsed statutory reporting plus committed, timed customer notification"
      },
      "capture": [
        { "id": "notify", "type": "choice", "label": "Customer notification commitment", "options": ["None", "Best efforts", "Committed, untimed", "Committed within defined hours"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },

    {
      "id": "chain.1",
      "domainId": "chain",
      "prompt": "Will the supplier show you what is inside the product: components, open source and fourth parties?",
      "shortTitle": "Product composition transparency",
      "rationale": "Most of any modern product is someone else's code, and the supplier's suppliers are invisible to you unless surfaced deliberately. When the next Log4j lands, an SBOM is the difference between a two-hour exposure check and a two-month vendor correspondence, and willingness to share one is a proxy for whether the supplier knows its own contents.",
      "goodLooksLike": "A machine-readable SBOM (SPDX/CycloneDX) available per product version, at least under NDA, covering third-party and open-source components; awareness of significant fourth parties (ODM hardware, cloud dependencies, licensed stacks) and upstream advisory monitoring.",
      "references": ["EU CRA Annex I Part II (SBOM)", "NTIA/CISA SBOM guidance", "IEC 62443-4-1 (component management)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Refuses component transparency",
        "1": "Component list partial, on insistence only",
        "2": "SBOM available but incomplete (top-level only) or stale",
        "3": "Current machine-readable SBOM per version, fourth parties understood"
      },
      "capture": [
        { "id": "sbom", "type": "choice", "label": "SBOM availability", "options": ["Refused", "Partial list", "SBOM on request (NDA)", "SBOM per release"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "chain.2",
      "domainId": "chain",
      "prompt": "Is the supplier's access into your estate known, minimised and controlled?",
      "shortTitle": "Supplier access to your estate",
      "rationale": "Supplier remote access is the most common uninventoried pathway into OT estates: support VPNs, cellular modems in cabinets and standing TeamViewer accounts accumulate per project and outlive it. Whatever the supplier's own security, its access is part of YOUR attack surface, and several landmark OT incidents began exactly there.",
      "goodLooksLike": "A complete, current picture of what access the supplier holds (accounts, tunnels, embedded modems), access that is individually attributed, time-bounded and activated per session with your approval, session recording or monitoring, and prompt deprovisioning evidenced when personnel change.",
      "references": ["ISA/IEC 62443-2-4 / 62443-3-3 (SR 1/2)", "NCSC remote access guidance", "Your own access-control policy"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unknown or standing unmanaged access paths",
        "1": "Access known in outline, standing and shared",
        "2": "Controlled access, gaps in attribution, session control or review",
        "3": "Fully inventoried, per-session, attributed and monitored access"
      },
      "capture": [
        { "id": "access", "type": "checklist", "label": "Access reality", "options": ["Inventoried fully", "Per-session activation", "Individual attribution", "Session monitoring/recording", "Standing access exists", "Embedded modem/cellular found"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "chain.3",
      "domainId": "chain",
      "prompt": "Are you protected if the supplier fails, is acquired or exits the product line?",
      "shortTitle": "Supplier failure and exit protection",
      "rationale": "Supplier risk includes the supplier disappearing: insolvency, acquisition by a competitor or a quiet product-line exit can strand safety-relevant systems with no updates, no licence server and no documentation, mid-lifecycle. Continuity terms cost little at signature and are near-impossible to obtain during the event itself.",
      "goodLooksLike": "Escrow (source, build instructions, signing capability or update continuity) with defined release triggers, contractual data return/portability, documentation sufficient for third-party maintenance, licence terms that survive supplier failure, and change-of-control notification.",
      "references": ["Escrow agreements (e.g. NCC-style)", "Procurement continuity clauses", "NIS2 Art 21(2)(d)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No continuity protections at all",
        "1": "Discussed, nothing contractual",
        "2": "Partial (e.g. data return but no escrow or triggers)",
        "3": "Escrow with triggers, survivable licences and exit-tested terms"
      },
      "capture": [
        { "id": "continuity", "type": "checklist", "label": "Protections in place", "options": ["Source/build escrow", "Update continuity arrangement", "Data return/portability", "Survivable licences", "Change-of-control clause", "None"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    }
  ]
};
