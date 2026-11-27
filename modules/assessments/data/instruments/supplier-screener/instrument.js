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
  "notes": "This high-level screener uses interviews to judge the cyber exposure a supplier brings: its corporate security, development practice, product security, vulnerability handling, regulatory readiness and the operational dependency the customer carries. The same questions serve two stances. In a supplier assessment the customer screens a vendor from its answers and evidence. In a self-assessment a supplier screens itself before its customers do, and 'the supplier' means the assessed organisation. The consultant sets every scored band by judging the answer, and the captured fields never set it. The screening is indicative and shallow on purpose, and each weak domain points to the deep assessment that establishes the real position.",
  "responseModel": {
    "bandScale": [
      { "value": 0, "label": "Not in place" },
      { "value": 1, "label": "Partial / ad hoc" },
      { "value": 2, "label": "Largely in place" },
      { "value": 3, "label": "Fully in place and managed" }
    ],
    "specialStates": [
      { "value": "unknown", "label": "Unknown", "effect": "reduces coverage and is not scored" },
      { "value": "na", "label": "Not applicable", "effect": "excluded from grading and coverage" }
    ],
    "rule": "The consultant always sets the band. Capture fields (text, checklist, choice, boolean) inform and evidence the band but never set it."
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
    "intro": "The screening shows where a supplier is weak. Each domain that is weak, or that could not be graded, points to the deeper assessment that would establish the real position. The grades here are indicative judgements of the supplier's answers and have not been verified.",
    "noneTriggered": "No domain graded low enough to call for a deeper assessment. The supplier should be screened again if its products, its regulatory position or the customer's dependency on it change materially.",
    "routes": [
      {
        "domainId": "dev",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-1 Secure Product Development Lifecycle Assessment",
        "instrumentId": "iec-62443-4-1",
        "detail": "Assess the supplier's development practice in depth against 62443-4-1, covering security requirements, secure design and implementation, verification testing and defect management. The screening relied on the supplier's own account of its SDL."
      },
      {
        "domainId": "vuln",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-1 (defect & update management), and the EU CRA Gap Assessment Part II layer for CRA-scoped products",
        "instrumentId": "iec-62443-4-1",
        "detail": "Weak vulnerability handling turns supplier risk into operational risk. Verify the supplier's disclosure, remediation and update practices in depth, and for products in CRA scope assess the Annex I Part II obligations directly."
      },
      {
        "domainId": "prod",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-4-2 Component Security Assessment, or the EU CRA Annex I Part I layer",
        "instrumentId": "iec-62443-4-2",
        "detail": "Assess the product's security capabilities in depth against the component requirements of ISA/IEC 62443-4-2, to establish the capability security level it can claim for each foundational requirement. For products in CRA scope, the Annex I Part I layer of the CRA gap assessment covers the essential requirements directly."
      },
      {
        "domainId": "reg",
        "grades": ["C", "D", "E", "F"],
        "title": "EU CRA Gap Assessment / EU Machinery Regulation Gap Assessment",
        "instrumentId": "eu-cra",
        "detail": "Establish the supplier's regulatory position with the gap assessment that matches its products. That is the CRA assessment for products with digital elements and the Machinery Regulation assessment for machinery with digital control. Classification and the conformity route decide market access, so they need more than a screening to settle."
      },
      {
        "domainId": "chain",
        "grades": ["C", "D", "E", "F"],
        "title": "ISA/IEC 62443-2-4:2023 Service Provider Security Program Assessment",
        "instrumentId": "iec-62443-2-4",
        "detail": "Where the supplier also integrates, maintains or supports the customer's systems, assess its service provider security program in depth against 62443-2-4. That covers remote access, accounts and passwords, staffing and the other processes its people use on those systems. The screening relied on the supplier's own account of its access."
      }
    ]
  },
  "questions": [
    {
      "id": "corp.1",
      "domainId": "corp",
      "prompt": "Does the supplier have a named security lead and a functioning security organisation?",
      "shortTitle": "Security lead and organisation",
      "rationale": "If nobody at the supplier owns security, none of the other practices in this screening can last. Whether a security function exists, how senior it is and whether it can be reached is the quickest guide to how the supplier will behave when something goes wrong with its product on the customer's site.",
      "goodLooksLike": "The supplier has a named security officer or product security lead with a route to management, and a security function that answers questions directly, without going through sales. There is evidence that the role survives reorganisations, such as signed policies, published advisories and a team that can be contacted.",
      "references": ["ISO/IEC 27001 (organisation of information security)", "ISA/IEC 62443-2-1", "NIS2 Art 21 (governance)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No identifiable security function or owner",
        "1": "Someone answers security questions, role informal or buried in IT",
        "2": "Named lead and team, but limited authority or product reach",
        "3": "Named, senior, reachable security function covering the products the customer buys"
      },
      "capture": [
        { "id": "who", "type": "choice", "label": "Who answers for security?", "options": ["No one identified", "Sales / account team", "IT security team", "Named security officer / PSIRT", "Other"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "corp.2",
      "domainId": "corp",
      "prompt": "Does the supplier hold security certifications, and do their scopes cover what the customer buys?",
      "shortTitle": "Certification scope",
      "rationale": "Certificates are the cheapest assurance a supplier can offer, and the most often mis-sold. An ISO 27001 certificate scoped to the corporate office says nothing about the product line, and a 62443 certificate for one product family is often presented as if it covered them all. The evidence is in the scope statement.",
      "goodLooksLike": "Current certificates (ISO 27001, IEC 62443-4-1/-4-2 or SDL certification, SOC 2 for services) have scope statements that name the products, development sites or services the customer uses. The supplier offers them without being asked, and the certification body can be verified.",
      "references": ["ISO/IEC 27001", "IEC 62443-4-1 / 62443-4-2 (ISASecure)", "SOC 2"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No certifications, or refuses to evidence them",
        "1": "Certificates exist but scopes are unclear or corporate-only",
        "2": "Relevant certificates whose scope partly covers what the customer buys",
        "3": "Current certificates whose scopes verifiably cover the products or services the customer buys"
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
      "rationale": "What a supplier will sign predicts what it will do. Suppliers that accept security clauses, incident notification duties and evidence rights have usually built the processes to honour them. A supplier that strikes out every clause is showing the customer what to expect during an incident. How readily the supplier responds to this screening is evidence too.",
      "goodLooksLike": "The contract includes an accepted security schedule. It covers incident and vulnerability notification to the customer within defined times, the right to security evidence or audit, secure development commitments, and support and patch commitments for the products in use. The supplier answers questionnaires fully and promptly.",
      "references": ["NIS2 Art 21(2)(d) (supply chain security)", "NCSC supply chain security guidance", "ISA/IEC 62443-2-4 (service provider requirements)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Refuses security clauses and questionnaires",
        "1": "Answers selectively, and contracts carry no security commitments",
        "2": "Some clauses accepted, such as notification, but evidence rights limited",
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
      "prompt": "Does the supplier follow a defined secure development lifecycle for the products the customer buys?",
      "shortTitle": "Secure development lifecycle",
      "rationale": "Product security is built in during development. Threat modelling, security requirements and secure design decisions happen then or not at all. A supplier that cannot describe its SDL in concrete terms for the product line the customer buys is describing an aspiration. Both the CRA and 62443-4-1 assess the development process itself.",
      "goodLooksLike": "A documented SDL is applied to the product line in question, covering security requirements, threat modelling, secure coding standards and defined security gates in the release process. The supplier can show artefacts such as a redacted threat model or gate records, and the SDL is ideally aligned with or certified to IEC 62443-4-1.",
      "references": ["IEC 62443-4-1", "EU CRA Annex I Part I (design, development and production)", "Microsoft SDL / OWASP SAMM"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No discernible secure development practice",
        "1": "Claims an SDL, cannot evidence it for this product line",
        "2": "SDL evidenced but partial, for example without threat modelling or gates",
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
      "rationale": "Testing shows whether an SDL exists. Static analysis, dependency scanning and penetration testing leave artefacts that are easy to evidence and hard to fake. A supplier that ships OT products without security testing leaves its customers to find the problems in their own plants.",
      "goodLooksLike": "The build pipeline includes static analysis and dependency and vulnerability scanning, and each release gets security-focused testing. Independent penetration tests cover the product itself as well as the website and take place periodically, with findings tracked to closure and summaries shared under NDA.",
      "references": ["IEC 62443-4-1 (SVV practices)", "EU CRA Annex I Part I (testing)", "OWASP ASVS"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No security testing evident",
        "1": "Ad hoc or claimed testing, no artefacts",
        "2": "Routine pipeline scanning, but irregular independent product testing",
        "3": "Layered testing for each release, including periodic independent product pen tests"
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
      "rationale": "Build and delivery are where supply chain attacks happen. A compromised build server or update channel makes every one of the supplier's customers a victim at once. Signed artefacts and a controlled pipeline are the main protection against the next 3CX or SolarWinds arriving as a genuine supplier update.",
      "goodLooksLike": "The build environment is controlled, with access control and provenance. Firmware and installers are signed and verified on installation, delivery uses authenticated channels, and the supplier publishes hashes and signatures so customers can verify what they received.",
      "references": ["IEC 62443-4-1 (SM practices)", "EU CRA Annex I (integrity, secure updates)", "SLSA / NIST SSDF"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unsigned artefacts, uncontrolled distribution",
        "1": "Some artefacts signed, build controls unclear",
        "2": "Signed releases, but pipeline controls asserted without evidence",
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
      "prompt": "Do the products arrive securely configured by default, with product-specific hardening guidance?",
      "shortTitle": "Secure by default and hardening guidance",
      "rationale": "Default credentials and open services on delivery pass the security burden to every customer, and in OT that burden is rarely taken up, because the configuration set at commissioning often stays in production for years. For products in CRA scope, secure by default is now a legal expectation.",
      "goodLooksLike": "The product has no default or shared credentials and forces individual set-up. Unnecessary services are off on delivery and secure protocol options are on by default. The supplier maintains a hardening guide for the product. A generic note telling customers to apply their own policy does not count.",
      "references": ["EU CRA Annex I Part I (secure by default)", "IEC 62443-4-2 (CR 1.5, CR 7.6, CR 7.7)", "CISA Secure by Design"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Default credentials or wide-open services on delivery",
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
      "rationale": "If the product cannot tell users apart or record what happened, no control on the customer's side can make up for it. Shared engineering logins and devices that log nothing make an OT incident impossible to reconstruct. The capabilities have to exist in the product before the customer's policies can use them.",
      "goodLooksLike": "The product supports individual accounts with role-based privileges, integrated with the customer's directory where feasible, and has no hard-coded accounts. Security-relevant events such as logons, configuration changes and failures are logged in a form that can be exported or forwarded to the customer's monitoring.",
      "references": ["IEC 62443-4-2 (CR 1.x, CR 2.x, CR 6.x)", "EU CRA Annex I Part I (access control, logging)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Shared or hard-coded accounts, and no security logging",
        "1": "Basic accounts or basic logs, but not both, with significant limitations",
        "2": "Per-user access and logging present, but weak integration",
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
      "rationale": "An update mechanism that needs a site visit, breaks certification or cannot be scheduled around production will not be used, and an insecure one is a route for attack. Whether updates are practical on site decides whether the supplier's fixes ever reach the customer's plant.",
      "goodLooksLike": "Updates are cryptographically signed, verified by the device and rolled back on failure. Offline or staged installation is possible for air-gapped sites and those with limited maintenance windows. Compatibility statements are clear, and security fixes do not force a cloud dependency.",
      "references": ["EU CRA Annex I Part I (secure updates)", "IEC 62443-4-2 (CR 3.10)", "IEC 62443-2-3 (patch management)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No viable update path for fielded units",
        "1": "Updates possible but unsigned or operationally impractical",
        "2": "Signed updates, with practical gaps such as no rollback or no offline path",
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
      "prompt": "Does the supplier run a working vulnerability handling process, with a disclosure route, triage and structured advisories?",
      "shortTitle": "Vulnerability handling process",
      "rationale": "Every product has vulnerabilities. Suppliers differ in whether they can receive reports, fix the problems and tell their customers. A supplier with no disclosure route or advisory history is either not finding vulnerabilities or not telling anyone, and both are worse than a published CVE list. For products in CRA scope this is a legal obligation under Annex I Part II.",
      "goodLooksLike": "The supplier publishes a coordinated vulnerability disclosure policy with a reachable contact (security.txt), and a PSIRT or equivalent triages reports to defined timelines. There is a history of structured advisories for the product line, giving CVE or CSAF identifiers, affected versions, severity and the fixed version.",
      "references": ["EU CRA Annex I Part II", "ISO/IEC 29147 / 30111", "IEC 62443-4-1 (DM practices)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No disclosure route and no advisory history",
        "1": "Contactable but ad hoc, with rare or unstructured advisories",
        "2": "CVD policy and advisories exist, but cadence or structure is inconsistent",
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
      "rationale": "A critical fix that ships in the next annual release, or only with a paid upgrade, is a sales tactic and does not count as vulnerability handling. OT operators need fixes they can apply without taking on the risk of new features. The time taken to fix past advisories is verifiable evidence of what the customer can expect.",
      "goodLooksLike": "The supplier has documented remediation SLAs by severity and ships security patches separately from feature and major releases. Fixes are free of charge for supported versions, and the time from advisory to fix in past cases matches the policy.",
      "references": ["EU CRA Annex I Part II (security updates without delay, free of charge)", "IEC 62443-4-1 (DM-4)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Fixes only through major or paid upgrades, with no timelines",
        "1": "Fixes happen, but unpredictably and bundled with releases",
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
      "prompt": "Are support periods defined and long enough for the service life of OT equipment, with a managed end of support?",
      "shortTitle": "Support period and end of support",
      "rationale": "OT equipment runs for 15 to 25 years. A product supported for five leaves the customer with a decade of unpatched exposure or a forced replacement on the supplier's schedule. The support commitment, including how the end of support is announced and managed, is one of the largest cost and risk terms in the relationship. It can be negotiated at purchase but rarely afterwards.",
      "goodLooksLike": "Each product has a published support period with security fixes committed for the whole period, in proportion to OT lifespans or extendable by agreement. End of support is announced years in advance, and migration paths do not leave installed equipment stranded.",
      "references": ["EU CRA (support period determination)", "IEC 62443-2-3", "Procurement security clauses"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No support commitment, and end of life at the supplier's discretion",
        "1": "Support informal or short, with a history of abrupt end of life",
        "2": "Published periods, adequate but inflexible or with short notice",
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
      "prompt": "Does the supplier know which EU product regulations apply to what it sells the customer?",
      "shortTitle": "Regulatory scope awareness",
      "rationale": "A supplier that cannot say whether its product is in CRA scope, what its Annex III class is, or whether the Machinery Regulation's digital requirements apply has not started the work those answers lead to. The gap becomes the customer's procurement risk, because non-conforming products cannot lawfully be supplied, even partway through a contract.",
      "goodLooksLike": "For each product the supplier states its CRA scope and class (default, important or critical), whether the Machinery Regulation applies to machinery with digital control, its RED and EMC positions, and its own NIS2 role where relevant. It does so unprompted or when first asked, and the statements match the products.",
      "references": ["EU CRA (Reg 2024/2847)", "EU Machinery Regulation (Reg 2023/1230)", "NIS2 (Dir 2022/2555)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unaware of or dismisses the applicable regulations",
        "1": "General awareness, no per-product position",
        "2": "Scope and class stated for main products, gaps or uncertainty at edges",
        "3": "Clear, credible regulatory map for each product, including class and dates"
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
      "rationale": "Knowing the obligations is only the first step. The CRA's full obligations apply from 11 December 2027 and the Machinery Regulation from 14 January 2027, and notified body capacity is limited across the industry. A supplier that has not booked its route will struggle to find one in the final year, and its products may become impossible to supply just when replacements are hardest to find.",
      "goodLooksLike": "For each product the supplier has chosen a conformity route, either self-assessment or a notified body, correctly derived from the class. A notified body is engaged where required, technical documentation is in progress, and dated plans finish before the applicable deadlines. The supplier can share these as a roadmap, even in summary.",
      "references": ["EU CRA Arts 32/Annex VIII (routes)", "EU Machinery Regulation Art 25/Annex I", "Notified-body engagement lead times"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No conformity plan, and deadlines not acknowledged",
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
      "prompt": "Could the supplier meet its incident and exploited-vulnerability reporting duties, and would the customer hear about it?",
      "shortTitle": "Incident and vulnerability reporting duties",
      "rationale": "The CRA's Article 14 deadlines, starting with a 24-hour early warning from 11 September 2026, cannot be met without a rehearsed process. A supplier that cannot notify a regulator within 24 hours will not notify its customers any faster. The customer's own NIS2 and incident response obligations depend on hearing promptly from the supplier when its product is being exploited.",
      "goodLooksLike": "The supplier has a working reporting process for the statutory routes, with named owners and out-of-hours cover. The contract commits it to notify affected customers of actively exploited vulnerabilities and relevant product incidents within defined hours, and exercises or past cases provide evidence.",
      "references": ["EU CRA Art 14", "NIS2 Art 23 (the customer's own reporting dependencies)", "Contractual notification clauses"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No reporting process and no commitment to notify customers",
        "1": "Ad hoc notification, with nothing rehearsed or committed",
        "2": "Process defined, but customer notification informal or slow",
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
      "prompt": "Will the supplier show the customer what is inside the product, including components, open source and fourth parties?",
      "shortTitle": "Product composition transparency",
      "rationale": "Most of any modern product is other people's code, and the supplier's own suppliers stay hidden from the customer unless the supplier discloses them. When the next Log4j appears, an SBOM turns a two-month exchange with the vendor into a two-hour exposure check. A supplier willing to share one usually knows what is in its own products.",
      "goodLooksLike": "A machine-readable SBOM (SPDX or CycloneDX) is available for each product version, at least under NDA, and covers third-party and open-source components. The supplier knows its significant fourth parties, such as ODM hardware, cloud dependencies and licensed software stacks, and monitors upstream advisories.",
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
      "prompt": "Is the supplier's access into the customer's estate known, minimised and controlled?",
      "shortTitle": "Supplier access to the estate",
      "rationale": "Supplier remote access is the most common unrecorded route into OT estates. Support VPNs, cellular modems in cabinets and standing TeamViewer accounts build up with each project and outlast it. Whatever the supplier's own security, its access is part of the customer's attack surface, and several well-known OT incidents began there.",
      "goodLooksLike": "There is a complete, current record of the access the supplier holds, including accounts, tunnels and embedded modems. Each connection is attributed to an individual, limited in time and activated per session with the customer's approval. Sessions are recorded or monitored, and access is removed promptly, with evidence, when supplier staff change.",
      "references": ["ISA/IEC 62443-2-4 / 62443-3-3 (SR 1/2)", "NCSC remote access guidance", "The customer's access control policy"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "Unknown or standing unmanaged access paths",
        "1": "Access known in outline, standing and shared",
        "2": "Controlled access, with gaps in attribution, session control or review",
        "3": "Fully inventoried, per-session, attributed and monitored access"
      },
      "capture": [
        { "id": "access", "type": "checklist", "label": "Access arrangements", "options": ["Inventoried fully", "Per-session activation", "Individual attribution", "Session monitoring/recording", "Standing access exists", "Embedded modem/cellular found"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    },
    {
      "id": "chain.3",
      "domainId": "chain",
      "prompt": "Is the customer protected if the supplier fails, is acquired or withdraws from the product line?",
      "shortTitle": "Supplier failure and exit protection",
      "rationale": "Supplier risk includes the supplier disappearing. Insolvency, acquisition by a competitor or an unannounced withdrawal from a product line can leave safety-relevant systems partway through their life with no updates, no licence server and no documentation. Continuity terms cost little when the contract is signed and are almost impossible to obtain once the event happens.",
      "goodLooksLike": "An escrow or update continuity arrangement covers source code, build instructions and signing capability, with defined release triggers. The contract provides for data return and portability, documentation is good enough for a third party to maintain the product, licence terms survive supplier failure, and the supplier must give notice of a change of control.",
      "references": ["Escrow agreements (e.g. NCC-style)", "Procurement continuity clauses", "NIS2 Art 21(2)(d)"],
      "scored": true,
      "allowNA": true,
      "bandAnchors": {
        "0": "No continuity protections at all",
        "1": "Discussed, nothing contractual",
        "2": "Partial protection, for example data return but no escrow or triggers",
        "3": "Escrow with triggers, survivable licences and exit-tested terms"
      },
      "capture": [
        { "id": "continuity", "type": "checklist", "label": "Protections in place", "options": ["Source/build escrow", "Update continuity arrangement", "Data return/portability", "Survivable licences", "Change-of-control clause", "None"] },
        { "id": "notes", "type": "text", "label": "Notes / evidence" }
      ]
    }
  ]
};
