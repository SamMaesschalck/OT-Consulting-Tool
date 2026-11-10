/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/checklists.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.checklists = {
  "_note": "The review checklist. Draft wording for the team to agree: edit it here, then run scripts/build-data.ps1. 'common' applies to every report; 'families' adds items by the pack's scoringFamily, and 'instruments' by its instrumentId. 'skip' names, per instrumentId, family items that do not fit that framework, so they are left out of its checklist. Each item's id must stay stable: the answers in a review file are keyed by it.",
  "common": [
    { "id": "common-evidence", "text": "The evidence supports the findings." },
    { "id": "common-scope", "text": "The scope and exclusions are right." },
    { "id": "common-details", "text": "The client details and document control are correct." },
    { "id": "common-actions", "text": "The recommendations are specific and can be acted on." },
    { "id": "common-language", "text": "The language is fit for the client." },
    { "id": "common-sensitive", "text": "Sensitive technical detail, such as addresses, credentials and exploitable weaknesses, suits the document's confidentiality marking and the people it is issued to." },
    { "id": "common-standard", "text": "The standard and its edition are named correctly wherever the report cites them." }
  ],
  "families": {
    "capability-sl": [
      { "id": "sl-targets", "text": "The target security levels are justified for each zone, conduit or component assessed, and the source of each target is stated." },
      { "id": "sl-shared", "text": "Answers shared across zones or components apply to each one that inherits them." }
    ],
    "caf-achieved": [
      { "id": "caf-profile", "text": "The profile chosen is the right one for this organisation, and the report says why." },
      { "id": "caf-not-formal", "text": "The report does not read as a formal regulator's assessment, an audit or a certification." }
    ],
    "domain-letter": [
      { "id": "posture-grades", "text": "The headline grade matches what the findings say." }
    ],
    "program-maturity-ml": [
      { "id": "ml-levels", "text": "Each maturity level claimed has evidence of the process running, not only of it being written down." }
    ],
    "nis2-conformance": [
      { "id": "nis2-caveat", "text": "The report says it is not a legal determination of NIS2 compliance." },
      { "id": "nis2-entity", "text": "The entity classification and competent authority are stated correctly." }
    ],
    "csms-conformance": [
      { "id": "csms-elements", "text": "Elements marked as in place have evidence of use, not only of a document." }
    ],
    "risk-appetite-coherence": [
      { "id": "ra-judgement", "text": "The verdict is the consultant's judgement, with the reasoning stated." },
      { "id": "ra-board", "text": "The decision put to the board is clear." }
    ],
    "risk-assessment": [
      { "id": "risk-tolerable", "text": "The tolerable risk has been agreed with the asset owner." },
      { "id": "risk-slt", "text": "Each zone and conduit's target level follows from its risk assessment." },
      { "id": "risk-residual", "text": "Risks above the tolerable level each have a disposition: a countermeasure, the target level, or a recorded acceptance." },
      { "id": "risk-coverage", "text": "Every zone has its threats identified, and each conduit has threats or a stated reason why it needs none." },
      { "id": "risk-consequence", "text": "The impact ratings take account of safety, environmental and production consequences, not only the loss of information." },
      { "id": "risk-consistency", "text": "Where a section's wording has been edited, the high-level and detailed reports still give the same tolerable risk, bands and ranking." }
    ]
  },
  "instruments": {
    "iec-62443-4-2": [
      { "id": "cr-component-type", "text": "Each component's type (software application, embedded device, host device or network device) is stated, and requirements marked not applicable say why." },
      { "id": "cr-constraints", "text": "The common component security constraints the component relies on, and what its environment must provide, are stated." }
    ],
    "iec-62443-4-1": [
      { "id": "sdl-scope", "text": "The products, development teams and lifecycle activities in scope are stated." }
    ],
    "eu-cra": [
      { "id": "cra-caveat", "text": "The report says it is not a conformity assessment or a legal determination under the CRA." },
      { "id": "cra-class", "text": "The product classification and the conformity route are right." },
      { "id": "cra-evidence", "text": "Each essential requirement marked as met is supported by the technical documentation or test evidence." }
    ],
    "eu-machinery": [
      { "id": "mr-caveat", "text": "The report says it is not a conformity assessment or a legal determination under the Machinery Regulation." },
      { "id": "mr-class", "text": "The machine's Annex I classification and the conformity route are right." },
      { "id": "mr-evidence", "text": "Each essential requirement marked as met is supported by the technical documentation or test evidence." }
    ],
    "nist-800-53": [
      { "id": "nist-tailoring", "text": "Any tailoring of the baseline, such as controls added, scoped out or marked not applicable, is stated with the reason." }
    ],
    "nist-800-82": [
      { "id": "nist-tailoring", "text": "Any tailoring of the baseline, such as controls added, scoped out or marked not applicable, is stated with the reason." },
      { "id": "nist82-overlay", "text": "Where a control cannot be applied to an OT system as written, the report says which compensating control is in place." }
    ],
    "supplier-screener": [
      { "id": "screener-verified", "text": "The report makes clear which answers the supplier declared and which were checked against evidence." }
    ],
    "onr-syaps-management": [
      { "id": "onr-caveat", "text": "The report says it is not an ONR assessment and carries no regulatory standing." }
    ],
    "onr-syaps-cyber": [
      { "id": "onr-caveat", "text": "The report says it is not an ONR assessment and carries no regulatory standing." }
    ],
    "onr-syaps-full": [
      { "id": "onr-caveat", "text": "The report says it is not an ONR assessment and carries no regulatory standing." }
    ]
  },
  "skip": {
    "eu-cra": ["csms-elements"],
    "eu-machinery": ["csms-elements"],
    "onr-syaps-management": ["caf-not-formal"],
    "onr-syaps-cyber": ["caf-not-formal"],
    "onr-syaps-full": ["caf-not-formal"]
  }
};
