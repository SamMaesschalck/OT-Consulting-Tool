/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-2-4:2023 service provider security
 * program tour (program-maturity-ml, service-provider dimension).
 *
 * A finished maturity assessment of a fictional ship management company,
 * Tarnmoor Ship Management, which operates and maintains a fleet of bulk
 * carriers for a fictional shipowner, Halvard Bulk Carriers. The target is its
 * vessel operations and maintenance service. The vessel setting lives in this
 * demo only; the instrument itself is sector-neutral.
 *
 * Every in-scope requirement is answered: answers spread across not met, ML1,
 * ML2 and ML3 with a few ML4 and unknowns. SP05 (SIS) is out of scope with a
 * note, because the shipowner contracts the safety systems to their vendor
 * directly. Every not-met and ML1 requirement carries a remediation plan.
 *
 * Demonstration content only: fictional names, illustrative judgements, not a
 * real engagement.
 */
window.App = window.App || {};
window.App.Tour24 = (function () {
  "use strict";

  var metadata = {
    clientName: "Tarnmoor Ship Management",
    siteName: "Fleet managed for Halvard Bulk Carriers",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-10-14",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var targetName = "Vessel operations and maintenance service";

  // Functional areas the contract leaves out, with the reason printed once.
  var outOfScope = [
    { elementId: "SP05", note: "The shipowner contracts maintenance of the safety systems directly with their vendor, so they are outside this service" }
  ];

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each priority in the roadmap above\nRun a full backup and restore test on one vessel and use it as the template for the fleet\nAgree with Halvard Bulk Carriers which enhancements the next service contract will require\nRe-assess against 62443-2-4 in twelve months, with the safety systems in scope if the contract changes",
    regulatoryExposure: "Tarnmoor Ship Management operates and maintains the automation systems on each vessel for Halvard Bulk Carriers, so its people, laptops and remote connections reach those systems every week. Account management, remote access and malware protection are well practised across the fleet. The gaps sit in assurance and in recovery: nobody has scanned for unknown devices, multi-factor login is not used on engineering workstations, and a full restore has never been shown to work. Those are the points the shipowner is most exposed to through this service.",
    topPriorities: "The most urgent priorities are a demonstrated full backup and restore (SP.12.05) and multi-factor login on engineering workstations (SP.03.07 RE(1)), because one decides how fast a vessel recovers and the other closes the easiest route onto its control systems. Reporting shared passwords that may be exposed (SP.09.09 RE(1)) costs little and should follow at once."
  };

  var basis = {
    interviews: [
      { name: "R. Okafor", role: "Technical Manager, Tarnmoor Ship Management", date: "2026-10-13" },
      { name: "L. Brandt", role: "IT and Systems Lead, Tarnmoor Ship Management", date: "2026-10-13" },
      { name: "J. Whitcombe", role: "Fleet Superintendent, Tarnmoor Ship Management", date: "2026-10-14" },
      { name: "A. Sorensen", role: "Contract owner, Halvard Bulk Carriers", date: "2026-10-14" }
    ],
    documents: [
      { title: "Ship management agreement, automation and IT schedule", reference: "HBC-TSM-SMA-2025", date: "2025-03-01" },
      { title: "Fleet automation security procedures", reference: "TSM-SEC-PROC v3.2", date: "2026-02-10" },
      { title: "Remote access session log, last quarter", reference: "TSM-RA-LOG-Q3", date: "2026-09-30" },
      { title: "Fleet asset register and port-call reconciliation reports", reference: "TSM-ASSET-REG", date: "2026-10-01" }
    ],
    observations: [
      { name: "Engineering workstation on one vessel in port", method: "walkthrough of login, accounts, anti-malware status and backup job with the chief engineer" },
      { name: "Shore remote access gateway", method: "review of the approved tool, session approvals and account list with the IT and Systems Lead" }
    ]
  };

  // { id, ml, ev } / { id, ml, ev, rem } / { id, unknown:true, note } / { id, ml, ev, note }
  function rem(rank, band, owner, action, impact) {
    return { rank: rank, band: band, owner: owner, action: action, impact: impact };
  }
  var rows = [
    // ---- SP.01  Solution staffing ----------------------------------------
    { id: "SP.01.01-BR", ml: "ML3", ev: "Fleet engineers complete a 62443-2-4 duties briefing before joining a vessel; records seen for the last two crew changes." },
    { id: "SP.01.01-RE1", ml: "ML2", ev: "Subcontractor briefing pack exists and is signed, but only one subcontracted job has used it so far." },
    { id: "SP.01.02-BR", ml: "ML3", ev: "Owner's security rules are part of the vessel induction, with signed read-and-sign sheets." },
    { id: "SP.01.02-RE1", ml: "ML3" },
    { id: "SP.01.03-BR", ml: "ML3", ev: "Confidentiality clauses in all employment contracts, renewed on promotion." },
    { id: "SP.01.03-RE1", ml: "ML2" },
    { id: "SP.01.04-BR", ml: "ML2" },
    { id: "SP.01.04-RE1", ml: "ML1", ev: "Background checks for subcontractors are left to each subcontractor and are not verified.",
      rem: rem(14, "Medium", "HR and Procurement", "Require evidence of background checks for subcontracted staff before they are assigned, and keep it on file.",
        "An unvetted subcontractor can reach the vessel control systems with the same access as Tarnmoor's own staff.") },
    { id: "SP.01.05-BR", ml: "ML3", ev: "A named security contact is in the service contract and on each vessel's contact sheet." },
    { id: "SP.01.06-BR", ml: "ML2" },
    { id: "SP.01.07-BR", ml: "ML1", ev: "Staff changes are passed on informally by the superintendent; there is no defined notice to the owner.",
      rem: rem(20, "Low", "Fleet Superintendent", "Notify the shipowner in writing of every change to staff with access, within an agreed time.",
        "The owner cannot remove access it does not know should be removed.") },

    // ---- SP.02  Assurance ------------------------------------------------
    { id: "SP.02.01-BR", ml: "ML1", ev: "Component security evidence is collected only when the owner asks, and there is no standard form.",
      rem: rem(12, "Medium", "Technical Manager", "Keep a standard evidence pack per component type and hand it over with each installation.",
        "Without it the owner cannot judge whether replacement parts are secure enough for the vessel network.") },
    { id: "SP.02.02-BR", ml: "ML2" },
    { id: "SP.02.02-RE1", ml: "ML3" },
    { id: "SP.02.02-RE2", ml: "not-met", ev: "No scans for unknown devices or weaknesses are run on any vessel.",
      rem: rem(4, "High", "Technical Manager", "Schedule passive discovery scans on each vessel at every port call and report the results to the owner.",
        "Unknown devices on the vessel network, such as a forgotten modem, go unnoticed until they are used against it.") },
    { id: "SP.02.02-RE3", unknown: true, note: "Whether the vessel control network tolerates active scanning has not been tested; the vendor's guidance was not available on the day. Marked unknown." },
    { id: "SP.02.03-BR", ml: "ML2" },
    { id: "SP.02.03-RE1", ml: "ML2" },

    // ---- SP.03  Architecture ---------------------------------------------
    { id: "SP.03.01-BR", ml: "ML2" },
    { id: "SP.03.01-RE1", ml: "ML2" },
    { id: "SP.03.01-RE2", ml: "not-met", ev: "No independent review of the control system design has been arranged.",
      rem: rem(9, "Medium", "Technical Manager", "Offer the owner an independent security review of the control system design at the next dry-dock.",
        "Design weaknesses are easiest to miss when the people who built the network are the only ones who check it.") },
    { id: "SP.03.02-BR", ml: "ML3", ev: "Network changes follow the approved fleet design, with sign-off sheets for the last three refits." },
    { id: "SP.03.02-RE1", ml: "ML2" },
    { id: "SP.03.02-RE2", ml: "ML2" },
    { id: "SP.03.03-BR", ml: "ML1", ev: "Vulnerabilities are handled as they come up, with no tracking across the fleet.",
      rem: rem(8, "Medium", "Technical Manager", "Keep a fleet vulnerability register and review it monthly with the owner.",
        "The same weakness can stay open on several vessels because nobody sees the whole picture.") },
    { id: "SP.03.03-RE1", ml: "not-met", ev: "No document of known protocol weaknesses has been given to the owner.",
      rem: rem(10, "Medium", "Technical Manager", "Document the known weaknesses of the protocols used on board and how each is mitigated.",
        "The owner cannot plan compensating measures for weaknesses it has not been told about.") },
    { id: "SP.03.04-BR", ml: "ML3" },
    { id: "SP.03.05-BR", ml: "ML2" },
    { id: "SP.03.05-RE1", unknown: true, note: "Certificate stores on the bridge workstations could not be inspected during the visit. Marked unknown." },
    { id: "SP.03.06-BR", ml: "ML3" },
    { id: "SP.03.07-BR", ml: "ML2" },
    { id: "SP.03.07-RE1", ml: "not-met", ev: "Engineering workstations use password-only login.",
      rem: rem(2, "High", "IT and Systems Lead", "Introduce multi-factor login on all engineering workstations, starting with the vessels due next in port.",
        "A stolen or shared password is enough to reach the engineering workstations, which can change control logic.") },
    { id: "SP.03.08-BR", ml: "ML2" },
    { id: "SP.03.08-RE1", ml: "ML2" },
    { id: "SP.03.08-RE2", ml: "ML1", ev: "Network device administration traffic is not always encrypted.",
      rem: rem(15, "Medium", "IT and Systems Lead", "Use encrypted management protocols only on switches and firewalls, and disable the rest.",
        "Admin credentials sent in clear text can be read by anyone on the same network segment.") },
    { id: "SP.03.08-RE3", ml: "ML1", ev: "Switches are managed over a password login only; the devices support certificate-based mutual authentication but it is switched off.",
      rem: rem(18, "Low", "IT and Systems Lead", "Turn on mutual authentication for device administration where the equipment supports it.",
        "Without it an administrator can be tricked into logging in to an impostor device.") },
    { id: "SP.03.09-BR", ml: "ML2" },
    { id: "SP.03.10-BR", ml: "ML1", ev: "Sensitive data on board has not been identified in writing.",
      rem: rem(11, "Medium", "Data Protection Lead", "List the data on board that needs protection and agree it with the owner.",
        "Data nobody has identified is not protected on purpose.") },
    { id: "SP.03.10-RE1", ml: "ML2" },
    { id: "SP.03.10-RE2", ml: "ML1", ev: "Log and history retention is left at each product default and has not been written down.",
      rem: rem(19, "Low", "Data Protection Lead", "Document how long each kind of data is kept on board and how retention is set.",
        "Logs that roll over too early leave nothing to investigate after an incident.") },
    { id: "SP.03.10-RE3", ml: "ML2" },
    { id: "SP.03.10-RE4", ml: "ML1", ev: "Removed hard drives are stored ashore, not wiped.",
      rem: rem(13, "Medium", "Technical Manager", "Wipe or destroy storage from every component taken off a vessel, and record it.",
        "Discarded drives can hold network details and credentials for the whole fleet.") },

    // ---- SP.04  Wireless -------------------------------------------------
    { id: "SP.04.01-BR", ml: "ML3" },
    { id: "SP.04.02-BR", ml: "ML3" },
    { id: "SP.04.02-RE1", ml: "ML3" },
    { id: "SP.04.03-BR", ml: "ML2" },
    { id: "SP.04.03-RE1", ml: "ML4", ev: "Wireless names are generic across the fleet and checked by a quarterly audit script, with results trended." },
    { id: "SP.04.03-RE2", ml: "ML2" },

    // ---- SP.05  SIS: out of scope for this service (see outOfScope) -------

    // ---- SP.06  Configuration management ---------------------------------
    { id: "SP.06.01-BR", ml: "ML3" },
    { id: "SP.06.01-RE1", ml: "ML2" },
    { id: "SP.06.02-BR", ml: "ML4", ev: "The fleet asset register is reconciled at every port call and its accuracy is measured and reported to the owner." },
    { id: "SP.06.03-BR", ml: "ML2" },

    // ---- SP.07  Remote access --------------------------------------------
    { id: "SP.07.01-BR", ml: "ML3", ev: "One approved remote access tool is used fleet-wide; others are blocked at the vessel firewall." },
    { id: "SP.07.02-BR", ml: "ML2" },
    { id: "SP.07.03-BR", ml: "ML3" },
    { id: "SP.07.04-BR", ml: "ML3", ev: "Each remote session is approved by the master or chief engineer in the session log." },
    { id: "SP.07.04-RE1", ml: "ML2" },

    // ---- SP.08  Event management -----------------------------------------
    { id: "SP.08.01-BR", ml: "ML2" },
    { id: "SP.08.01-RE1", ml: "not-met", ev: "Compromises found on board are reported by email from the chief engineer; nothing is reported automatically.",
      rem: rem(7, "Medium", "IT and Systems Lead", "Set up automatic reporting of detected compromises from each vessel to the shore operations centre.",
        "A compromise found on board at sea may not be reported until the next port call.") },
    { id: "SP.08.02-BR", ml: "ML2" },
    { id: "SP.08.02-RE1", ml: "ML1", ev: "Security events stay in each workstation log and are copied ashore by hand when asked for.",
      rem: rem(17, "Low", "IT and Systems Lead", "Send security events over a standard interface so the shore team can collect them.",
        "Events kept only on board cannot be correlated across the fleet.") },
    { id: "SP.08.02-RE2", ml: "not-met", ev: "Security logging has never been tested end to end.",
      rem: rem(5, "High", "IT and Systems Lead", "Test that security logging works on each vessel and record the result.",
        "Logging that has silently failed leaves no trail when an incident needs one.") },
    { id: "SP.08.03-BR", ml: "ML3" },
    { id: "SP.08.03-RE1", ml: "ML2" },
    { id: "SP.08.04-BR", unknown: true, note: "The event storm statement depends on the control system vendor's test data, which was requested but not received. Marked unknown." },

    // ---- SP.09  Account management ---------------------------------------
    { id: "SP.09.01-BR", ml: "ML3" },
    { id: "SP.09.02-BR", ml: "ML3", ev: "Every engineer has a named account; shared logins were removed in 2025." },
    { id: "SP.09.02-RE1", ml: "ML2" },
    { id: "SP.09.02-RE2", ml: "ML2" },
    { id: "SP.09.02-RE3", ml: "ML3" },
    { id: "SP.09.02-RE4", ml: "ML2" },
    { id: "SP.09.03-BR", ml: "ML2" },
    { id: "SP.09.04-BR", ml: "ML2" },
    { id: "SP.09.04-RE1", ml: "ML1", ev: "Temporary accounts are removed after a job, but no report goes to the owner.",
      rem: rem(16, "Low", "Fleet Superintendent", "Give the owner a report of accounts removed at the end of each job.",
        "The owner has no record that temporary accounts were actually removed.") },
    { id: "SP.09.05-BR", ml: "ML3" },
    { id: "SP.09.06-BR", ml: "ML2" },
    { id: "SP.09.06-RE1", ml: "ML2" },
    { id: "SP.09.07-BR", ml: "ML3", ev: "Default passwords are changed at commissioning and checked at each audit." },
    { id: "SP.09.08-BR", ml: "ML2" },
    { id: "SP.09.08-RE1", ml: "ML2" },
    { id: "SP.09.09-BR", ml: "ML1", ev: "Passwords the owner shares with engineers are kept in a spreadsheet without an owner.",
      rem: rem(6, "High", "IT and Systems Lead", "Keep shared passwords in a managed vault with a named owner and an access log.",
        "Nobody can say who knows which password, so none can be safely assumed secret.") },
    { id: "SP.09.09-RE1", ml: "not-met", ev: "There is no route for telling the owner that a shared password may have been exposed.",
      rem: rem(3, "High", "IT and Systems Lead", "Report to the owner any shared password that may be exposed, so it can be changed.",
        "An exposed password stays valid on board until someone happens to change it.") },

    // ---- SP.10  Malware protection ---------------------------------------
    { id: "SP.10.01-BR", ml: "ML3" },
    { id: "SP.10.02-BR", ml: "ML3", ev: "Anti-malware is installed on all workstations and updated at each port call." },
    { id: "SP.10.02-RE1", ml: "ML2" },
    { id: "SP.10.03-BR", ml: "ML1", ev: "Detection has been tested once, on one workstation, when the product was first installed.",
      rem: rem(21, "Low", "IT and Systems Lead", "Show on request that anti-malware detects a test file on each workstation type.",
        "A product that is installed but not detecting gives false comfort.") },
    { id: "SP.10.04-BR", ml: "ML2" },
    { id: "SP.10.05-BR", ml: "ML3" },
    { id: "SP.10.05-RE1", ml: "ML4", ev: "Dedicated, numbered USB media are issued per vessel; misuse is tracked and has fallen each quarter.", note: "Strongest practice seen in the assessment; worth sharing with the owner's other contractors." },
    { id: "SP.10.05-RE2", ml: "ML3" },

    // ---- SP.11  Patch management -----------------------------------------
    { id: "SP.11.01-BR", ml: "ML2" },
    { id: "SP.11.01-RE1", ml: "ML1", ev: "The patch qualification process dates from 2022 and has not been revisited.",
      rem: rem(22, "Low", "Technical Manager", "Review the patch qualification process when the risk picture changes, and record each review.",
        "A process set years ago may no longer match the threats the fleet faces.") },
    { id: "SP.11.02-BR", ml: "ML2" },
    { id: "SP.11.02-RE1", ml: "ML1", ev: "The approved patch list goes to the owner as a PDF table.",
      rem: rem(23, "Low", "Technical Manager", "Give the owner the approved patch list in a machine-readable form.",
        "The owner has to retype the list to check it, which invites mistakes.") },
    { id: "SP.11.02-RE2", ml: "ML2" },
    { id: "SP.11.03-BR", ml: "ML3" },
    { id: "SP.11.04-BR", ml: "ML3" },
    { id: "SP.11.05-BR", ml: "ML3" },
    { id: "SP.11.06-BR", ml: "ML3" },
    { id: "SP.11.06-RE1", ml: "ML2" },
    { id: "SP.11.06-RE2", ml: "ML2" },
    { id: "SP.11.06-RE3", ml: "ML2" },

    // ---- SP.12  Backup/Restore -------------------------------------------
    { id: "SP.12.01-BR", ml: "ML3" },
    { id: "SP.12.02-BR", ml: "ML2" },
    { id: "SP.12.03-BR", ml: "ML2" },
    { id: "SP.12.04-BR", ml: "ML2" },
    { id: "SP.12.05-BR", ml: "not-met", ev: "Backups are taken, but a full restore has never been demonstrated on any vessel.",
      rem: rem(1, "High", "Technical Manager", "Demonstrate a full backup and restore on one vessel at the next port call, then roll it out across the fleet.",
        "If a restore fails at sea, the vessel runs without its automation until it reaches port.") },
    { id: "SP.12.06-BR", ml: "ML3" },
    { id: "SP.12.07-BR", ml: "ML3" },
    { id: "SP.12.08-BR", ml: "ML1", ev: "Backup jobs are run by hand; who ran them and the result are not logged.",
      rem: rem(24, "Low", "IT and Systems Lead", "Log every backup and restore with who ran it and the result.",
        "Without a log there is no evidence that backups are running to schedule.") },
    { id: "SP.12.09-BR", ml: "ML1", ev: "Recovery steps exist in the engineers' notes but there is no disaster recovery plan.",
      rem: rem(25, "Low", "Fleet Superintendent", "Write a disaster recovery plan for the vessel automation and agree it with the owner.",
        "Recovery decisions made under pressure at sea are slower and riskier than planned ones.") }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    if (E.renameTarget) E.renameTarget(tid, targetName);
    rows.forEach(function (row) {
      var patch;
      if (row.unknown) {
        patch = { applicable: true, ml: "unknown" };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true, ml: row.ml };
        if (row.ev) patch.evidence = row.ev;
        if (row.note) patch.notes = row.note;
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
    if (E.setElementInScope) {
      outOfScope.forEach(function (o) {
        E.setElementInScope(tid, o.elementId, false);
        E.setElementScopeNote(tid, o.elementId, o.note);
      });
    }
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews = basis.interviews.slice();
      b.documents = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }
  }

  return { metadata: metadata, targetName: targetName, outOfScope: outOfScope,
           reportNarrative: reportNarrative, basis: basis, rows: rows, apply: apply };
})();
