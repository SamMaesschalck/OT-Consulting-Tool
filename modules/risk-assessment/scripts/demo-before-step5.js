/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* The demo as the 3-2 fixes' step 4 left it, for the test pages whose checks
 * are written against it (the frozen v0.7.0 Word comparison among them).
 * Step 5 added to data/tour-project.js: the engineering VLAN (C4) and the
 * keyed SIS connection (C5) as conduits, with T2 and T4 routed through them
 * and the zones' access points and data flows naming them; a target on every
 * foundational requirement of C1 to C3, with their justifications; an asset
 * criticality; T4's remaining risk accepted by the asset owner; the LIS link
 * and CCTV marked outside the SUC; the SUC's access points; what implements
 * each policy; the risk assessment sessions; and a second approver who is
 * the operations manager, with the approvals retaken. beforeStep5 puts each
 * back as step 4 had it, but T4's remaining risk acceptance, which the
 * SL-T decision now rests on, in place, on a project (normalised or not),
 * and returns it. test-risk-zcr5.html covers the step 5 demo itself.
 */
window.RiskTestDemo = window.RiskTestDemo || {};
window.RiskTestDemo.beforeStep5 = function (p) {
  "use strict";
  function owner(id) { return p.zones.concat(p.conduits).filter(function (o) { return o.id === id; })[0]; }
  function threat(oid, tid) { return owner(oid).threats.filter(function (t) { return t.id === tid; })[0]; }
  // The ranking: inside the SUC, with the notes that said it.
  p.srs.highLevelAssets.forEach(function (a) {
    delete a.inSuc;
    if (a.id === "A5") a.note = "One-way feed, no control path; ranked medium. Outside the system under consideration: the feed ends at the historian, which Z3 covers.";
    if (a.id === "A6") a.note = "Commodity IP kit, frequently probed, but no process consequence; ranked low. Outside the system under consideration, so in no zone.";
  });
  p.zones.forEach(function (z) { (z.assets || []).forEach(function (a) { delete a.criticality; }); });
  delete p.suc.accessPoints; delete p.suc.policyImplementation;
  delete p.basisOfAssessment.sessions; if (p.counters) delete p.counters.session;
  // The routes. T4's remaining risk stays accepted: since step 5 the SL-T
  // decision it rests on is incomplete without it.
  threat("Z1", "T2").via = ["Z4"]; threat("Z2", "T4").via = ["Z4"];
  // T4's and T8's acceptances as they were worded before the wording pass
  // (Nov 2026) reworded them, which the a2 fingerprints below were taken on.
  threat("Z2", "T4").acceptance = "No countermeasure brings the risk within tolerable risk, as the consequence stays severe. Until the dedicated SIS engineering workstation is in place, process safety authorisation, the keyed bypass record and the program-mode keyswitch bound the remaining risk, which is accepted at High until the review.";
  threat("Z4", "T8").acceptance = "The tool is retired at the Q2-2027 turnaround with the PLC upgrade. Until then the workstation is isolated on the engineering VLAN, and the account password is held by the shift supervisor and issued per use with a written record. Risk accepted at High for this bounded period.";
  // The zones' characteristics before C4 and C5.
  var z1 = owner("Z1"), z2 = owner("Z2"), z4 = owner("Z4");
  z1.accessPoints = ["Vendor VPN via jump host (C2)", "Historian replication to DMZ (C1)"];
  z1.dataFlows = ["Process values to the historian through the OPC UA broker (C1)", "Vendor diagnostic sessions through the jump host (C2)"];
  z2.accessPoints = ["Engineering connection from Z4 (keyed, normally disconnected)"];
  z2.dataFlows = ["Hardwired trip and status signals to the BPCS (no network path)"];
  z4.accessPoints = ["Removable media (controlled USB process)", "Engineering VLAN to Z1 controllers"];
  z4.dataFlows = ["Configuration downloads to the BPCS controllers over the engineering VLAN", "Keyed engineering connection to the SIS for authorised changes"];
  z4.assumptions = ["Vendor laptops are only connected under a permit during turnarounds", "The engineering VLAN to the BPCS and the keyed engineering connection to the SIS are not modelled as conduits"];
  // C1 to C3 as they were, and no C4 or C5.
  var v = { C1: [{ IAC: 2, UC: null, SI: 2, DC: 1, RDF: 2, TRE: null, RA: null }, "Carries the risk of a pivot from the Z3 historian toward the BPCS as its data-flow path: SL2 on IAC/SI/RDF matches the zone targets either side; the broker enforces direction so no higher target is warranted."],
    C2: [{ IAC: 3, UC: 2, SI: null, DC: null, RDF: 3, TRE: 2, RA: null }, "This conduit is the highest-exposure path into the BPCS: a hijacked vendor credential or session starts High, and the existing per-session controls (MFA, per-ticket activation, recording and auto-disconnect) bring it within tolerable risk today, but the SL-T is held at SL3 on IAC/RDF to match the Z1 targets it lands in, so the conduit is not the weak link. TRE at SL2 preserves the session-recording evidence chain."],
    C3: [{ IAC: 2, UC: null, SI: null, DC: 2, RDF: 2, TRE: null, RA: null }, "Boundary conduit to the untrusted corporate network: SL2 on IAC/DC/RDF reflects the read-only brokerage and the confidentiality of throughput data; no control traffic exists on this path."] };
  Object.keys(v).forEach(function (id) { var c = owner(id); c.slTargetByFR = v[id][0]; c.justification = v[id][1]; });
  p.conduits = p.conduits.filter(function (c) { return c.id !== "C4" && c.id !== "C5"; });
  if (p.counters) p.counters.conduit = 3;
  // The approvals as step 4 retook them.
  var scope = "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the one recorded risk acceptance (legacy configuration tooling), the one transferred risk (lost production, through business interruption insurance), and the per-FR SL-T vectors as the target for the security programme.";
  var fp = "a2-9c820478-54f40a85-ca6a499d-d627e2de";
  p.approval.statement = scope;
  p.approvals[0].scope = scope; p.approvals[0].fingerprint = fp;
  p.approvals[1] = { scope: "The SL-T of the Safety Instrumented System zone (Z2).", name: "S. Adeyemi", role: "Process Safety Engineer", organisation: "Acme Petrochemicals Ltd", date: "2026-07-04", revision: "1.0", approved: true, fingerprint: fp };
  return p;
};
