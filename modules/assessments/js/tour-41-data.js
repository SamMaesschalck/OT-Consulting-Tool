/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-4-1 Secure Product Development Lifecycle
 * tour (program-maturity-ml, supplier dimension).
 *
 * A complete, realistic, FINISHED maturity assessment of a product developer's
 * secure-development practices (Meridian Control Systems, a SCADA/RTU controller
 * supplier): all 47 requirements answered with a maturity level, every not-met /
 * lowest-maturity (ML1) requirement carries a full remediation plan, consultant
 * exec-summary blocks supplied. Reasonably mature in security management and
 * requirements; weakest in verification & validation (no vulnerability or
 * penetration testing, non-independent testers). Loaded by the combined demo page.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.Tour41 = (function () {
  "use strict";

  var metadata = {
    clientName: "Meridian Control Systems",
    siteName: "Product line: SCADA / RTU controllers",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-24",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each priority in the roadmap above\nPilot the independent security testing changes (SVV3 to SVV5) on the next product release\nDocument the threat model for one product line and use it as the template for the rest\nRe-assess against 62443-4-1 in twelve months to confirm the verification gaps have closed",
    regulatoryExposure: "Meridian Control Systems is a product developer (supplier), so this assesses its secure development lifecycle, not an operator's environment. The programme is reasonably mature in security management and requirements but weakest in verification and validation: vulnerability and penetration testing are not performed, and security testing is not independent of development. For a supplier whose products run in OT, those gaps mean exploitable weaknesses can ship undetected and reach the asset owners who deploy them; they are also what a 62443-4-1 assessment would focus on first.",
    topPriorities: "The most urgent priorities are introducing vulnerability and penetration testing into the release process (SVV3, SVV4) and making security testing independent of development (SVV5), so weaknesses are caught before products ship. Establishing a documented, repeatable threat model (SR2) underpins both, because it is what tells the testing what to look for."
  };

  // { id, ml, ev } / { id, ml, ev, rem } / { id, unknown:true, note }
  var rows = [
    // ---- SM  Security management ---------------------------------------
    { id: "SM1", ml: "ML3", ev: "A documented secure development process is defined and actively practised across product lines, reviewed annually." },
    { id: "SM2", ml: "ML3", ev: "Security responsibilities are defined and assigned across the development organisation." },
    { id: "SM3", ml: "ML2" },
    { id: "SM4", ml: "ML2" },
    { id: "SM5", ml: "ML2" },
    { id: "SM6", ml: "ML2" },
    { id: "SM7", ml: "ML2" },
    { id: "SM8", ml: "ML2" },
    { id: "SM9", ml: "ML1", ev: "Security requirements are not consistently set for externally provided components.",
      rem: { rank: 9, band: "Low", owner: "Product Security Team",
        action: "Define and verify security requirements for third-party and open-source components used in the product.",
        impact: "Inherited weaknesses in dependencies become the product's own vulnerabilities." } },
    { id: "SM10", ml: "ML1", ev: "Custom components from third-party suppliers are not held to the same secure-development requirements.",
      rem: { rank: 10, band: "Low", owner: "Procurement / Supplier Management",
        action: "Require third-party suppliers of custom components to meet equivalent secure-development practices, and verify.",
        impact: "An insecure supplier becomes an insecure link in the product's lifecycle." } },
    { id: "SM11", ml: "ML2" },
    { id: "SM12", ml: "ML2" },
    { id: "SM13", ml: "ML1", ev: "Process improvement of the secure-development lifecycle is ad hoc.",
      rem: { rank: 12, band: "Low", owner: "Head of Engineering",
        action: "Use metrics from issues, testing and field vulnerabilities to drive continuous SDL improvement.",
        impact: "Without measured improvement, the same classes of weakness recur across product releases." } },

    // ---- SR  Specification of security requirements --------------------
    { id: "SR1", ml: "ML2" },
    { id: "SR2", ml: "ML1", ev: "Threat modelling is done informally for some products but is not documented or repeatable.",
      rem: { rank: 3, band: "High", owner: "Product Security Team",
        action: "Adopt a documented, repeatable threat-modelling practice that drives security requirements and test cases.",
        impact: "Without a threat model, security requirements and testing miss the product's real attack surface." } },
    { id: "SR3", ml: "ML2" },
    { id: "SR4", ml: "ML2" },
    { id: "SR5", ml: "ML2" },

    // ---- SD  Secure by design -----------------------------------------
    { id: "SD1", ml: "ML2" },
    { id: "SD2", ml: "ML2" },
    { id: "SD3", ml: "ML1", ev: "Security design reviews happen occasionally but are not a required, recorded gate.",
      rem: { rank: 6, band: "Medium", owner: "Lead Architect",
        action: "Make security design review a required, recorded gate before implementation.",
        impact: "Design flaws are the most expensive to fix later and the hardest to catch in code review." } },
    { id: "SD4", ml: "ML2" },

    // ---- SI  Secure implementation ------------------------------------
    { id: "SI1", ml: "ML2" },
    { id: "SI2", ml: "ML2" },

    // ---- SVV  Security verification & validation (weakest) ------------
    { id: "SVV1", ml: "ML2" },
    { id: "SVV2", ml: "ML1", ev: "Testing that specific threats are mitigated is ad hoc and not tied to the threat model.",
      rem: { rank: 5, band: "Medium", owner: "Product Security Team",
        action: "Derive threat-mitigation test cases from the threat model and run them each release.",
        impact: "Mitigations are assumed effective rather than demonstrated, leaving claimed protections unverified." } },
    { id: "SVV3", ml: "not-met", ev: "Vulnerability testing (fuzzing, known-vulnerability scanning) is not part of the release process.",
      rem: { rank: 2, band: "High", owner: "Product Security Team",
        action: "Add vulnerability testing (fuzzing, dependency / known-CVE scanning) to the verification pipeline.",
        impact: "Common, automatable classes of vulnerability reach customers undetected." } },
    { id: "SVV4", ml: "not-met", ev: "No penetration testing is performed against released products.",
      rem: { rank: 1, band: "High", owner: "Product Security Team",
        action: "Introduce regular penetration testing of products by suitably skilled, independent testers before release.",
        impact: "Without adversarial testing, exploitable weaknesses ship to customers and surface as field vulnerabilities." } },
    { id: "SVV5", ml: "ML1", ev: "Security testing is performed by the same engineers who wrote the code.",
      rem: { rank: 4, band: "High", owner: "Head of Engineering",
        action: "Ensure security testing is done by testers sufficiently independent of the developers.",
        impact: "Developers testing their own work miss what they were blind to when building it, undermining test credibility." } },

    // ---- DM  Management of security-related issues --------------------
    { id: "DM1", ml: "ML2" },
    { id: "DM2", ml: "ML2" },
    { id: "DM3", ml: "ML2" },
    { id: "DM4", ml: "ML2" },
    { id: "DM5", ml: "ML1", ev: "Vulnerability disclosure to customers is inconsistent; there is no published advisory process.",
      rem: { rank: 8, band: "Medium", owner: "Product Security Team",
        action: "Establish a coordinated vulnerability disclosure process with published advisories (e.g. CSAF / VEX).",
        impact: "Operators cannot risk-manage what they are not told about, delaying their own remediation." } },
    { id: "DM6", ml: "ML1", ev: "The defect-management practice itself is not periodically reviewed for effectiveness.",
      rem: { rank: 11, band: "Low", owner: "Head of Engineering",
        action: "Review the security defect-management process periodically and improve it from metrics.",
        impact: "An unreviewed process silently decays and misses systemic issues." } },

    // ---- SUM  Security update management ------------------------------
    { id: "SUM1", ml: "ML2" },
    { id: "SUM2", ml: "ML2" },
    { id: "SUM3", unknown: true, note: "Whether dependent-component / operating-system security updates are tracked could not be confirmed; it depends on upstream suppliers. Marked unknown." },
    { id: "SUM4", ml: "ML2" },
    { id: "SUM5", ml: "ML1", ev: "Security patches are produced but timeliness relative to severity is not managed or measured.",
      rem: { rank: 7, band: "Medium", owner: "Release Management",
        action: "Define and measure patch timelines against severity, balanced against OT change constraints.",
        impact: "Slow patches leave a known-exploitable window open in deployed products, which OT operators cannot always mitigate themselves." } },

    // ---- SG  Security guidelines --------------------------------------
    { id: "SG1", ml: "ML2" },
    { id: "SG2", ml: "ML2" },
    { id: "SG3", ml: "ML2" },
    { id: "SG4", ml: "ML2" },
    { id: "SG5", ml: "ML2" },
    { id: "SG6", ml: "ML2" },
    { id: "SG7", ml: "ML2" }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    rows.forEach(function (row) {
      var patch;
      if (row.unknown) {
        patch = { applicable: true, ml: "unknown" };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true, ml: row.ml };
        if (row.ev) patch.evidence = row.ev;
        if (row.rem) {
          patch.priorityRank = row.rem.rank;
          patch.priorityBand = row.rem.band;
          patch.owner = row.rem.owner;
          patch.action = row.rem.action;
          patch.impact = row.rem.impact;
        }
      }
      E.setResponse(tid, row.id, patch);
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  return { metadata: metadata, reportNarrative: reportNarrative, rows: rows, apply: apply };
})();
