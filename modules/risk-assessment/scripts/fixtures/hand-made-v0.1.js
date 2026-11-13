/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* Frozen fixture: a hand-made spt-risk-project/0.1 file. No 0.1 file survives
 * in the repository (its history starts at 0.2), so this one is written from
 * what the 0.1 -> 0.2 step in js/migrate.js converts: the requirements in
 * initialRisk (no srs), one scalar slTarget per zone and conduit, a zone's
 * consequences table, no basis, engagement, approval or treatment records,
 * countermeasures with no existing flag, and partial counters. Three keys no
 * build knows (x-reviewer-note, x-site-tag, x-ref) must survive a load and a
 * save. Do not edit: scripts/test-risk-migrate.html pins what it becomes. */
window.RiskFixtures = window.RiskFixtures || {};
window.RiskFixtures["hand-made-v0.1"] =
{
  "schema": "spt-risk-project/0.1",
  "savedOn": "2025-03-14T10:00:00.000Z",
  "x-reviewer-note": "Kept by every build that loads this file.",
  "suc": {
    "name": "Riverside Works water treatment",
    "description": "Treatment works control system: SCADA, PLCs and the chlorine dosing safety system.",
    "scopeStatement": "From the field PLCs up to the site DMZ firewall.",
    "assumptions": ["Site perimeter is fenced and gated"]
  },
  "initialRisk": {
    "adversaryClass": 2,
    "essentialFunctions": "Continuous treatment and safe chlorine dosing.",
    "worstCase": "Overdosing of chlorine into supply.",
    "clientMatrix": true,
    "clientMatrixNote": "Client 5x5 matrix, mapped to the house bands."
  },
  "zones": [
    {
      "id": "Z1",
      "name": "Process control",
      "description": "SCADA servers and treatment PLCs.",
      "fn": "basic process control",
      "assets": [{ "name": "SCADA server", "type": "server" }, { "name": "Filter PLC", "type": "plc" }],
      "flags": { "sis-present": false, "remote-access": true },
      "accessPoints": ["Vendor VPN"],
      "externalDependencies": [],
      "securityPolicies": [],
      "slTarget": 2,
      "consequences": { "safety": "serious", "operations": "major" },
      "justification": "Remote access for the integrator.",
      "x-site-tag": "RW-PC-01",
      "threats": [
        { "id": "T1", "statement": "An attacker reuses the vendor VPN to change PLC setpoints.", "source": "External attacker", "affectedFR": ["UC", "SI"], "likelihood": "high", "impact": "serious", "x-ref": "HAZOP node 4" }
      ],
      "vulnerabilities": [{ "id": "V1", "description": "Shared vendor account" }],
      "countermeasures": [{ "id": "M1", "description": "Per-user vendor accounts with MFA.", "addressesFR": ["UC"], "reference": "SR 1.13" }]
    },
    {
      "id": "Z2",
      "name": "Chlorine dosing safety",
      "description": "Safety PLC for chlorine dosing.",
      "fn": "safety",
      "assets": [{ "name": "Dosing SIS", "type": "safety-plc" }],
      "flags": { "sis-present": true },
      "slTarget": 3,
      "justification": "Safety function.",
      "threats": [
        { "id": "T2", "statement": "Malware on the engineering laptop reaches the safety PLC.", "source": "Insider (unwitting)", "affectedFR": ["SI"], "likelihood": "medium", "impact": "severe", "acceptance": "Accepted by the works manager pending laptop replacement." },
        { "id": "T3", "statement": "Accidental change from the HMI.", "source": "Operator", "affectedFR": ["UC"], "likelihood": "low", "impact": "minor" }
      ],
      "vulnerabilities": [],
      "countermeasures": []
    }
  ],
  "conduits": [
    {
      "id": "C1", "fromZone": "Z1", "toZone": "Z2", "name": "Process to safety", "channels": ["modbus"], "notes": "",
      "slTarget": 2,
      "threats": [
        { "id": "T4", "statement": "Spoofed Modbus writes to the safety PLC.", "source": "Compromised SCADA server", "affectedFR": ["SI", "RDF"], "likelihood": "medium", "impact": "severe" }
      ],
      "vulnerabilities": [], "countermeasures": []
    },
    {
      "id": "C2", "fromZone": "Z1", "toZone": "EXT", "name": "Vendor access", "channels": ["vpn"], "notes": "Integrator support",
      "threats": [], "vulnerabilities": [], "countermeasures": []
    }
  ],
  "counters": { "zone": 2, "conduit": 2, "threat": 4, "vuln": 1, "cm": 1 }
}
;
