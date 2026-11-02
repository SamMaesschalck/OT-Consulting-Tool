/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/eu-cra/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["eu-cra"] = window.App.Data.instruments["eu-cra"] || {};
window.App.Data.instruments["eu-cra"].instrument = {
    "id":  "eu-cra",
    "title":  "EU Cyber Resilience Act (CRA) Gap Assessment",
    "framework":  "Regulation (EU) 2024/2847 (CRA)",
    "edition":  "2024",
    "family":  "regulation",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "csms-conformance",
    "scoringProfileRef":  "cra-conformance",
    "targetDimension":  "product-manufacturer",
    "targetDimensionLabel":  "Manufacturer / product with digital elements",
    "status":  "active",
    "indicative":  true,
    "framing":  "A gap assessment against the EU Cyber Resilience Act for a manufacturer of products with digital elements. Three independently-scored layers: the Annex I Part I product requirements (per product), the Annex I Part II vulnerability-handling requirements (organisation-wide process), and the conformity and obligations layer (declaration, CE marking, conformity route, reporting). Each layer can be selected or omitted per engagement. This informs conformity; it is not a conformity assessment or certification.",
    "sourceNote":  "Requirements transcribed from Regulation (EU) 2024/2847 (Cyber Resilience Act), OJ L, 20.11.2024. Layers P1 and P2 are Annex I Part I points (2)(a)-(m) and Part II points (1)-(8); each item carries the Official Journal wording in verbatimText alongside the assessor-phrased requirement. The conformity layer is built from Articles 13, 14, 28, 29, 30 and 32 and Annexes II, V, VII and VIII; those items cite their article rather than quoting it, because each spans several provisions. Reproduced with attribution to the Official Journal of the European Union; the tool carries the text itself and does not read the PDF.",
    "criticalCaveats":  [
                            "No harmonised standard has yet been cited in the Official Journal under the CRA, so presumption of conformity via a standard is not formally available, and a 62443 (or other) certificate does not equal CRA conformity.",
                            "This assessment informs conformity; it does not determine or certify it. The manufacturer, or a notified body where required by class, remains responsible for the conformity decision.",
                            "CRA obligation dates: Article 14 reporting applies from 11 September 2026; full obligations from 11 December 2027. Assess readiness against the applicable date."
                        ],
    "scoringNote":  "Each of the three layers rolls up INDEPENDENTLY (conformance: in place / partially / not in place / unknown / na). The three positions are presented side by side and never blended into one CRA score, since e.g. strong product security with no conformity work is not proportional CRA-readiness: missing conformity is a hard blocker to market placement, not a partial shortfall.",
    "setup":  [
                  {
                      "id":  "setup.layers",
                      "type":  "layer-select",
                      "question":  "Which layers are in scope for this assessment?",
                      "multi":  true,
                      "options":  [
                                      {
                                          "value":  "P1",
                                          "label":  "Annex I Part I: product requirements (per product)"
                                      },
                                      {
                                          "value":  "P2",
                                          "label":  "Annex I Part II: vulnerability handling (organisation)"
                                      },
                                      {
                                          "value":  "P3",
                                          "label":  "Conformity \u0026 obligations (declaration, CE, route, reporting)"
                                      }
                                  ],
                      "default":  [
                                      "P1",
                                      "P2",
                                      "P3"
                                  ],
                      "effect":  "Out-of-scope layers are not assessed, not scored, and absent from the report: distinct from an in-scope item left unanswered."
                  },
                  {
                      "id":  "setup.class",
                      "type":  "classification-lookup",
                      "question":  "Classify the product against CRA Annex III / IV",
                      "lookupRef":  "shared/cra-product-classification.json",
                      "method":  "Match the product under assessment to a category in the lookup. If it matches an Annex III Class I or II category, it is an important product; if Annex IV, critical; if none, default. The tool derives the class and the applicable conformity route from the match.",
                      "deriveClass":  true,
                      "drives":  "Sets the product class, which drives the conformity route the P3 layer expects (internal control vs notified-body routes). Do not ask the consultant to pre-judge the class; the match determines it.",
                      "flagMisclassification":  "Where the consultant expected Default but a category matches, surface that as a finding: it changes the conformity route and is a common CRA error."
                  },
                  {
                      "id":  "setup.product",
                      "type":  "text",
                      "question":  "Product under assessment (name / model)",
                      "drives":  "Part I is assessed per product; record which product this run covers."
                  }
              ],
    "layers":  [
                   {
                       "id":  "P1",
                       "name":  "Annex I Part I: Product requirements",
                       "scope":  "per-product",
                       "summary":  "The essential cybersecurity properties the product itself must have."
                   },
                   {
                       "id":  "P2",
                       "name":  "Annex I Part II: Vulnerability handling",
                       "scope":  "organisation",
                       "summary":  "The manufacturer\u0027s vulnerability-handling processes, applied across products."
                   },
                   {
                       "id":  "P3",
                       "name":  "Conformity \u0026 obligations",
                       "scope":  "organisation-and-product",
                       "summary":  "The formal conformity work: risk assessment, technical documentation, conformity route, declaration, CE marking, reporting readiness. Route depends on product class."
                   }
               ],
    "layerInterlock":  "If P3 is assessed without P1 and/or P2, flag that a conformity claim (declaration, CE) rests on the technical/process requirements those layers cover; assessed alone, P3 is a paperwork check, not a substantiated one.",
    "states":  [
                   {
                       "value":  "in-place",
                       "label":  "In place",
                       "colour":  "green"
                   },
                   {
                       "value":  "partially",
                       "label":  "Partially in place",
                       "colour":  "amber"
                   },
                   {
                       "value":  "not-in-place",
                       "label":  "Not in place",
                       "colour":  "red"
                   }
               ],
    "items":  [
                  {
                      "id":  "CRAP1a",
                      "code":  "CRA-P1.a",
                      "layerId":  "P1",
                      "title":  "No known exploitable vulnerabilities",
                      "requirement":  "The product is placed on the market without known exploitable vulnerabilities.",
                      "rationale":  "Placing a product with known exploitable vulnerabilities puts every user at immediate risk and is the clearest failure the CRA targets. For OT products, a shipped vulnerability can sit in a plant for years because the device is rarely patched, so getting it right at market entry matters more than in IT.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "be made available on the market without known exploitable vulnerabilities;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(a)"
                  },
                  {
                      "id":  "CRAP1b",
                      "code":  "CRA-P1.b",
                      "layerId":  "P1",
                      "title":  "Secure by default configuration",
                      "requirement":  "The product ships with a secure default configuration, with the ability to reset to original state (tailor-made products excepted by agreement).",
                      "rationale":  "Default configurations built for easy setup leave products exposed out of the box, and OT devices are often deployed exactly as shipped. A secure default is frequently the only hardening a device receives, which makes it the single most consequential property here.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "be made available on the market with a secure by default configuration, unless otherwise agreed between manufacturer and business user in relation to a tailor-made product with digital elements, including the possibility to reset the product to its original state;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(b)"
                  },
                  {
                      "id":  "CRAP1c",
                      "code":  "CRA-P1.c",
                      "layerId":  "P1",
                      "title":  "Security updates mechanism",
                      "requirement":  "Vulnerabilities can be addressed through security updates, including automatic updates by default where applicable, with user notification and an opt-out.",
                      "rationale":  "A product with no sound update mechanism cannot be fixed once a vulnerability emerges, leaving users stuck with a known-bad device. In OT the mechanism must also let operators control timing, since an unplanned update to a running process can be as damaging as the flaw.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "ensure that vulnerabilities can be addressed through security updates, including, where applicable, through automatic security updates that are installed within an appropriate timeframe enabled as a default setting, with a clear and easy-to-use opt-out mechanism, through the notification of available updates to users, and the option to temporarily postpone them;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(c)"
                  },
                  {
                      "id":  "CRAP1d",
                      "code":  "CRA-P1.d",
                      "layerId":  "P1",
                      "title":  "Protection from unauthorised access",
                      "requirement":  "The product protects against unauthorised access through appropriate control mechanisms (authentication, identity/access management) and reports possible unauthorised access.",
                      "rationale":  "Access control is the gate that keeps unauthorised parties out of the product\u0027s functions, and shared or unauthenticated access is common in OT precisely because it is convenient. Reporting attempted access also gives operators the visibility they usually lack.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "ensure protection from unauthorised access by appropriate control mechanisms, including but not limited to authentication, identity or access management systems, and report on possible unauthorised access;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(d)"
                  },
                  {
                      "id":  "CRAP1e",
                      "code":  "CRA-P1.e",
                      "layerId":  "P1",
                      "title":  "Confidentiality of data",
                      "requirement":  "The product protects the confidentiality of stored, transmitted or processed data, for example by state-of-the-art encryption at rest and in transit.",
                      "rationale":  "Confidentiality is a lower OT priority than integrity and availability, but exposed credentials, keys and configuration still hand an attacker the means to do harm. Protecting the data that matters denies reconnaissance and reuse.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "protect the confidentiality of stored, transmitted or otherwise processed data, personal or other, such as by encrypting relevant data at rest or in transit by state of the art mechanisms, and by using other technical means;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(e)"
                  },
                  {
                      "id":  "CRAP1f",
                      "code":  "CRA-P1.f",
                      "layerId":  "P1",
                      "title":  "Integrity of data and configuration",
                      "requirement":  "The product protects the integrity of data, commands, programs and configuration against unauthorised manipulation, and reports corruptions.",
                      "rationale":  "In OT the integrity of commands, programs and configuration is the property that most directly affects physical operation, since altered instructions move equipment. Detecting and reporting corruption is what stops a tampered device acting on false data.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "protect the integrity of stored, transmitted or otherwise processed data, personal or other, commands, programs and configuration against any manipulation or modification not authorised by the user, and report on corruptions;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(f)"
                  },
                  {
                      "id":  "CRAP1g",
                      "code":  "CRA-P1.g",
                      "layerId":  "P1",
                      "title":  "Data minimisation",
                      "requirement":  "The product processes only data adequate, relevant and limited to what is necessary for its intended purpose.",
                      "rationale":  "Collecting only necessary data limits both privacy exposure and the value of the product as a target. A device that hoards data becomes a richer prize and a larger liability than its function requires.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "process only data, personal or other, that are adequate, relevant and limited to what is necessary in relation to the intended purpose of the product with digital elements (data minimisation);",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(g)"
                  },
                  {
                      "id":  "CRAP1h",
                      "code":  "CRA-P1.h",
                      "layerId":  "P1",
                      "title":  "Availability and resilience",
                      "requirement":  "The product protects the availability of essential and basic functions, including resilience and mitigation against denial-of-service attacks.",
                      "rationale":  "Availability is the top OT priority because the product runs a physical process, and denial-of-service resilience keeps it running under attack or load. A product that fails available functions under stress can mean loss of control, not just loss of service.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "protect the availability of essential and basic functions, also after an incident, including through resilience and mitigation measures against denial-of-service attacks;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(h)"
                  },
                  {
                      "id":  "CRAP1i",
                      "code":  "CRA-P1.i",
                      "layerId":  "P1",
                      "title":  "Minimise impact on other systems",
                      "requirement":  "The product minimises its own or connected devices\u0027 negative impact on the availability of services provided by other devices or networks.",
                      "rationale":  "A product that degrades other devices or networks, through excessive traffic or poor behaviour, spreads its problems across the environment. Limiting that impact keeps one weak component from undermining the systems around it.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "minimise the negative impact by the products themselves or connected devices on the availability of services provided by other devices or networks;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(i)"
                  },
                  {
                      "id":  "CRAP1j",
                      "code":  "CRA-P1.j",
                      "layerId":  "P1",
                      "title":  "Limited attack surface",
                      "requirement":  "The product is designed to limit attack surfaces, including external interfaces.",
                      "rationale":  "Every exposed interface and service is a potential way in, and OT devices often ship with far more enabled than any deployment needs. A limited attack surface is one of the few hardening properties achievable even on constrained hardware.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "be designed, developed and produced to limit attack surfaces, including external interfaces;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(j)"
                  },
                  {
                      "id":  "CRAP1k",
                      "code":  "CRA-P1.k",
                      "layerId":  "P1",
                      "title":  "Incident impact mitigation",
                      "requirement":  "The product reduces the impact of an incident using appropriate exploitation mitigation mechanisms and techniques.",
                      "rationale":  "Exploitation mitigation techniques reduce how much an attacker gains even when a vulnerability is present, buying resilience against the flaws no one has found yet. For long-lived OT products, that in-built resistance matters across a long service life.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "be designed, developed and produced to reduce the impact of an incident using appropriate exploitation mitigation mechanisms and techniques;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(k)"
                  },
                  {
                      "id":  "CRAP1l",
                      "code":  "CRA-P1.l",
                      "layerId":  "P1",
                      "title":  "Security logging and monitoring",
                      "requirement":  "The product records and monitors relevant internal activity (access to or modification of data, services or functions), with a user opt-out.",
                      "rationale":  "Security logging is the basis for detecting and investigating attacks on the product, and OT devices are notorious for logging poorly or not at all. What the product does not record cannot later be detected or proven.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "provide security related information by recording and monitoring relevant internal activity, including the access to or modification of data, services or functions, with an opt-out mechanism for the user;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(l)"
                  },
                  {
                      "id":  "CRAP1m",
                      "code":  "CRA-P1.m",
                      "layerId":  "P1",
                      "title":  "Secure data removal",
                      "requirement":  "Users can securely and easily remove all data and settings on a permanent basis, and transfer them securely where supported.",
                      "rationale":  "Secure data removal ensures a decommissioned or transferred product does not leak configuration, credentials or network detail. In OT, where equipment is repurposed and resold across long lifecycles, this closes a common and overlooked exposure.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "provide the possibility for users to securely and easily remove on a permanent basis all data and settings and, where such data can be transferred to other products or systems, ensure that this is done in a secure manner.",
                      "allowNA":  true,
                      "reference":  "Annex I, Part I, point (2)(m)"
                  },
                  {
                      "id":  "CRAP21",
                      "code":  "CRA-P2.1",
                      "layerId":  "P2",
                      "title":  "Vulnerability and component identification (SBOM)",
                      "requirement":  "The manufacturer identifies and documents vulnerabilities and components, including a software bill of materials covering at least top-level dependencies, in a machine-readable format.",
                      "rationale":  "You cannot manage vulnerabilities or components you have not identified, and an SBOM is what makes the product\u0027s true composition visible. For OT products built on layers of third-party and legacy code, the SBOM often reveals exposure the manufacturer did not know it carried.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "identify and document vulnerabilities and components contained in products with digital elements, including by drawing up a software bill of materials in a commonly used and machine-readable format covering at the very least the top-level dependencies of the products;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (1)"
                  },
                  {
                      "id":  "CRAP22",
                      "code":  "CRA-P2.2",
                      "layerId":  "P2",
                      "title":  "Address vulnerabilities without delay",
                      "requirement":  "The manufacturer addresses and remediates vulnerabilities without delay, including via security updates, with security updates provided separately from functionality updates where technically feasible.",
                      "rationale":  "A vulnerability known but not remediated is a live risk in every deployed product. Addressing issues without delay, and separating security from functionality updates, lets operators take the fix without being forced to accept unrelated change to a running system.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "in relation to the risks posed to products with digital elements, address and remediate vulnerabilities without delay, including by providing security updates; where technically feasible, new security updates shall be provided separately from functionality updates;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (2)"
                  },
                  {
                      "id":  "CRAP23",
                      "code":  "CRA-P2.3",
                      "layerId":  "P2",
                      "title":  "Regular security testing",
                      "requirement":  "The manufacturer applies effective and regular tests and reviews of the security of the product.",
                      "rationale":  "Vulnerabilities the manufacturer does not find through testing, an attacker will find in the field. Regular security testing is what surfaces weaknesses before release rather than after exploitation.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "apply effective and regular tests and reviews of the security of the product with digital elements;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (3)"
                  },
                  {
                      "id":  "CRAP24",
                      "code":  "CRA-P2.4",
                      "layerId":  "P2",
                      "title":  "Disclose fixed vulnerabilities",
                      "requirement":  "Once a security update is available, the manufacturer shares and publicly discloses information about fixed vulnerabilities (description, affected products, impact, severity, remediation), with justified-case delay permitted.",
                      "rationale":  "Disclosing fixed vulnerabilities lets users understand their exposure and apply remediation, and hiding them leaves operators unable to protect themselves. The justified-delay provision balances that against arming attackers before a patch can be applied.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "once a security update has been made available, share and publicly disclose information about fixed vulnerabilities, including a description of the vulnerabilities, information allowing users to identify the product with digital elements affected, the impacts of the vulnerabilities, their severity and clear and accessible information helping users to remediate the vulnerabilities; in duly justified cases, where manufacturers consider the security risks of publication to outweigh the security benefits, they may delay making public information regarding a fixed vulnerability until after users have been given the possibility to apply the relevant patch;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (4)"
                  },
                  {
                      "id":  "CRAP25",
                      "code":  "CRA-P2.5",
                      "layerId":  "P2",
                      "title":  "Coordinated vulnerability disclosure policy",
                      "requirement":  "The manufacturer puts in place and enforces a policy on coordinated vulnerability disclosure.",
                      "rationale":  "A coordinated disclosure policy gives researchers and users a defined route to report issues and the manufacturer a defined way to handle them. Without it, vulnerabilities surface chaotically or not at all.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "put in place and enforce a policy on coordinated vulnerability disclosure;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (5)"
                  },
                  {
                      "id":  "CRAP26",
                      "code":  "CRA-P2.6",
                      "layerId":  "P2",
                      "title":  "Facilitate vulnerability reporting",
                      "requirement":  "The manufacturer takes measures to facilitate sharing of information about potential vulnerabilities, including a contact address for reporting, covering third-party components.",
                      "rationale":  "Making it easy to report vulnerabilities, including in third-party components, widens the manufacturer\u0027s view of its real exposure. A missing or hidden reporting channel means issues go unreported until they are exploited.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "take measures to facilitate the sharing of information about potential vulnerabilities in their product with digital elements as well as in third-party components contained in that product, including by providing a contact address for the reporting of the vulnerabilities discovered in the product with digital elements;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (6)"
                  },
                  {
                      "id":  "CRAP27",
                      "code":  "CRA-P2.7",
                      "layerId":  "P2",
                      "title":  "Secure update distribution",
                      "requirement":  "The manufacturer provides mechanisms to securely distribute updates to ensure timely fixing or mitigation, automatically where applicable.",
                      "rationale":  "A fix that cannot be delivered securely and reliably protects no one, and a compromised update channel is itself a supply-chain attack. Secure distribution is what gets the remediation to the deployed product intact.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "provide for mechanisms to securely distribute updates for products with digital elements to ensure that vulnerabilities are fixed or mitigated in a timely manner and, where applicable for security updates, in an automatic manner;",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (7)"
                  },
                  {
                      "id":  "CRAP28",
                      "code":  "CRA-P2.8",
                      "layerId":  "P2",
                      "title":  "Timely, free security updates with advisories",
                      "requirement":  "Available security updates are disseminated without delay and, unless otherwise agreed for tailor-made products, free of charge, with advisory messages informing users of relevant action.",
                      "rationale":  "Timely, free security updates with clear advisories are what let operators act on a fix rather than fear it, and charging for security updates would price some users out of protection. For OT, the advisory detail is what lets an operator schedule the update around the process safely.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "ensure that, where security updates are available to address identified security issues, they are disseminated without delay and, unless otherwise agreed between a manufacturer and a business user in relation to a tailor-made product with digital elements, free of charge, accompanied by advisory messages providing users with the relevant information, including on potential action to be taken.",
                      "allowNA":  true,
                      "reference":  "Annex I, Part II, point (8)"
                  },
                  {
                      "id":  "CRAC1",
                      "code":  "CRA-C.1",
                      "layerId":  "P3",
                      "title":  "Cybersecurity risk assessment",
                      "requirement":  "A cybersecurity risk assessment for the product is carried out and documented, and drives which Annex I requirements apply (Art 13(2)).",
                      "rationale":  "The risk assessment drives which Annex I requirements apply to the product, so without it the manufacturer cannot know what it must meet. It is the foundation the rest of the conformity work is built on.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 13(2)"
                  },
                  {
                      "id":  "CRAC2",
                      "code":  "CRA-C.2",
                      "layerId":  "P3",
                      "title":  "Technical documentation (Annex VII)",
                      "requirement":  "The manufacturer draws up and maintains the technical documentation required by Annex VII, kept for 10 years or the support period.",
                      "rationale":  "Technical documentation is the evidence that the product meets the requirements, and authorities can demand it for a decade. A manufacturer that cannot produce it cannot demonstrate conformity regardless of how secure the product actually is.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex VII (technical documentation)"
                  },
                  {
                      "id":  "CRAC3",
                      "code":  "CRA-C.3",
                      "layerId":  "P3",
                      "title":  "Correct conformity assessment route",
                      "requirement":  "The manufacturer applies the conformity assessment procedure appropriate to the product\u0027s class (internal control, EU-type examination, or full quality assurance) per Annex VIII.",
                      "rationale":  "The conformity route depends on the product\u0027s class, and applying the wrong one, self-assessing a product that needs a notified body, invalidates the conformity claim. Getting the route right is a precondition for a valid declaration.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 32 and Annex VIII"
                  },
                  {
                      "id":  "CRAC4",
                      "code":  "CRA-C.4",
                      "layerId":  "P3",
                      "title":  "EU declaration of conformity",
                      "requirement":  "A written EU declaration of conformity is drawn up per product and kept available to authorities (Art 28).",
                      "rationale":  "The EU declaration of conformity is the manufacturer\u0027s formal legal claim that the product meets the CRA. Without it, the product cannot lawfully carry CE marking or be placed on the market.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 28 and Annex V"
                  },
                  {
                      "id":  "CRAC5",
                      "code":  "CRA-C.5",
                      "layerId":  "P3",
                      "title":  "CE marking",
                      "requirement":  "The CE marking is affixed to products satisfying the applicable requirements.",
                      "rationale":  "CE marking is the visible signal of conformity that lets the product move in the EU market. Affixing it without the underlying conformity work is a false declaration; withholding it blocks market access.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Articles 29 and 30"
                  },
                  {
                      "id":  "CRAC6",
                      "code":  "CRA-C.6",
                      "layerId":  "P3",
                      "title":  "Support and update period",
                      "requirement":  "A support period is determined and communicated, during which vulnerabilities are handled, reflecting the expected product use.",
                      "rationale":  "The support period defines how long the manufacturer will handle vulnerabilities, and OT products in service for decades stress this obligation hard. An unclear or too-short period leaves operators exposed once support lapses.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 13 (support period)"
                  },
                  {
                      "id":  "CRAC7",
                      "code":  "CRA-C.7",
                      "layerId":  "P3",
                      "scope":  "organisation",
                      "title":  "Vulnerability reporting readiness (Art 14)",
                      "requirement":  "The manufacturer can report actively exploited vulnerabilities and severe incidents to the CSIRT/ENISA within the CRA\u0027s early-warning and notification timelines.",
                      "rationale":  "The CRA imposes tight timelines for reporting actively exploited vulnerabilities and severe incidents, and a manufacturer without the process cannot meet them. This is often the least-prepared area, since it demands operational readiness, not just product properties.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 14"
                  },
                  {
                      "id":  "CRAC8",
                      "code":  "CRA-C.8",
                      "layerId":  "P3",
                      "title":  "User information and instructions",
                      "requirement":  "The product is accompanied by the information and instructions to users required by Annex II (secure use, support period, reporting contact).",
                      "rationale":  "Users can only operate a product securely if told how, including its support period and reporting contact. The required user information is what turns a secure product into one that is also securely deployed.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Annex II (information and instructions to the user)"
                  },
                  {
                      "id":  "CRAC9",
                      "code":  "CRA-C.9",
                      "layerId":  "P3",
                      "scope":  "organisation",
                      "title":  "Due diligence on third-party components",
                      "requirement":  "The manufacturer exercises due diligence on integrated third-party components so they do not compromise the product (Art 13(5)).",
                      "rationale":  "A product is only as secure as the third-party and open-source components built into it, and the manufacturer carries the duty to exercise due diligence over them. This is where a manufacturer\u0027s own good practice is most often undone by what it did not write.",
                      "evidencePrompt":  "Record the evidence and the basis for the conformance state.",
                      "verbatimText":  "",
                      "allowNA":  true,
                      "reference":  "Article 13 (due diligence on third-party components)"
                  }
              ],
    "_relatedWork":  "The deep CRA assessment the supplier screener\u0027s regulatory section routes into. Part II overlaps 62443-4-1 (secure development / vulnerability handling) - candidate cross-references, sourced from both requirement texts.",
    "_classificationNote":  "Product classification uses the verified Annex III/IV lookup (shared/cra-product-classification.json), not a free choice. The lookup derives class -\u003e conformity route. Annex III/IV are classification inputs, not assessable items; only Annex I content is scored.",
    "seriesContext":  "The Cyber Resilience Act is an EU Regulation, not a standard: it applies directly, and conformity is a legal obligation for products with digital elements placed on the EU market. It sets essential requirements for the product itself and for the manufacturer\u0027s vulnerability handling process, and it requires certain incidents to be reported. Harmonised standards giving presumption of conformity are still being developed, so this assessment reads the Regulation\u0027s own requirements. It is a gap analysis to support preparation; it is not a conformity assessment and confers no presumption of conformity.",
    "_contentNote":  "13 + 8 + 9 items across three independently-scored layers. Coverage verified against Annex I: Part I has exactly 13 lettered requirements and Part II exactly 8 numbered ones. Selectable layers; product classification drives the conformity route.",
    "docx":  {
                 "noun":  "product",
                 "regName":  "the EU Cyber Resilience Act (Regulation (EU) 2024/2847)",
                 "coverSubLine":  "EU Cyber Resilience Act: indicative gap assessment",
                 "docDescription":  "EU Cyber Resilience Act (CRA) indicative gap assessment",
                 "glanceTitle":  "CRA readiness at a glance",
                 "layersSentence":  "Three layers were assessed independently (the Annex I Part I product requirements, the Annex I Part II vulnerability-handling requirements, and the conformity and obligations layer) and are reported side by side; they are never blended into a single CRA score, because strong product security with unfinished conformity work is not market readiness.",
                 "keyDatesNote":  "The CRA\u0027s Article 14 reporting obligations apply from 11 September 2026 and the full obligations from 11 December 2027; readiness should be judged against the date that applies to each finding.",
                 "misclassFinding":  "Finding: possible product misclassification (the matched Annex III/IV category indicates a higher class than the one set, which changes the required conformity route). See the dedicated section below.",
                 "howToRead":  "Each requirement is judged In place, Partially in place or Not in place, with Unknown reducing coverage and confidence and Not applicable excluded. The Annex I requirements are quoted in the Regulation\u0027s own words; the conformity obligations, which each span several Articles, are shown in assessor phrasing with the Article or Annex cited. The three layers roll up independently and are presented side by side: there is deliberately no single CRA score, because missing conformity work is a hard blocker to market placement rather than a partial shortfall. The Recommendations section lists every open gap with its evidence, impact, recommended action and owner.",
                 "limitations":  [
                                     "Conformance states are set per requirement by the consultant against the three-point scale (Not in place / Partially in place / In place), informed by the captured evidence. Each layer rolls up independently; the conformance index is presented for context only and the three layers are never blended into a single CRA score. Unknown answers reduce coverage and confidence; Not applicable requirements are excluded. A Not-in-place requirement is surfaced as a floor finding and is not averaged away.",
                                     "This is an indicative gap assessment against the EU CRA, not a conformity assessment or certification. The Annex I essential requirements are reproduced from Regulation (EU) 2024/2847 as published in the Official Journal of the European Union; the Regulation text governs. No harmonised standard has yet been cited in the Official Journal under the CRA, so presumption of conformity via a standard is not formally available and a 62443 (or other) certificate does not equal CRA conformity. The manufacturer, or a notified body where required by class, remains responsible for the conformity decision."
                                 ],
                 "categoryRowLabel":  "Matched Annex III/IV category (aid)",
                 "defaultClassLabel":  "Default (self-assessment / internal control)",
                 "noBlendPhrase":  "a single CRA score",
                 "blockerTail":  " cannot yet be lawfully CE-marked or placed on the EU market, however strong its technical security. Closing these is a market-access matter, not a security-engineering one.",
                 "blockerTailMulti":  " cannot yet be lawfully CE-marked or placed on the EU market, however strong their technical security. Closing those gaps is a market-access matter, not a security-engineering one.",
                 "multiOrgSentence":  "The organisation-wide obligations (the Annex I Part II vulnerability-handling process, Article 14 reporting readiness and component due diligence) were assessed once for the manufacturer and apply to every product; the Annex I Part I product requirements and the remaining conformity obligations were assessed per product. Layers are reported side by side and never blended into a single CRA score.",
                 "seqPlaceholder":  "Consultant: one short paragraph on sequencing (what must close before the Article 14 date, what gates CE marking, and what can run in parallel).",
                 "seqPlaceholderMulti":  "Consultant: one short paragraph on sequencing (what must close before the Article 14 date, what gates CE marking for which product, and what can run in parallel).",
                 "exposurePlaceholder":  "Consultant: the commercial exposure in one paragraph (which markets and revenue depend on CE marking under the CRA, and what non-conformity would mean for them).",
                 "xlsxTitle":  "EU Cyber Resilience Act: indicative gap assessment (not a conformity assessment or certification)",
                 "xlsxReadMe":  [
                                    "Three layers (P1 product, P2 vulnerability handling, P3 conformity) are each scored independently against the CRA and presented side by side. They are never blended into one CRA score.",
                                    "Out-of-scope layers are omitted entirely. This is an indicative assessment, not a conformity assessment or certification; no harmonised CRA standard is yet cited, so a 62443 certificate does not equal CRA conformity."
                                ]
             }
};
