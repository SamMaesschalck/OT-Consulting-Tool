// Ground truth for the 62443-3-3 SL selection, transcribed from the licensed
// copy of the standard held in data/.
//
//   BS IEC 62443-3-3:2013, Annex B (informative),
//   Table B.1 - Mapping of SRs and REs to FR SL levels 1-4
//   printed pages 75-78 (pages 77-80 of data/BS IEC 62443-3-3 2013.pdf)
//
// Every Security Level the tool reports is derived from the instrument's
// slGuidance. This file is what that mapping is checked against, so it must be
// transcribed from the standard and never edited to make a test pass.
//
// Table B.1 marks a component with a check at each SL it is selected at, and
// the marks are cumulative: once selected at SL n a component stays selected at
// every higher SL. The numbers below are therefore the LOWEST SL at which each
// component is selected, which is the same thing the instrument's slGuidance
// encodes from the other direction (per SL, which components).
//
// Verified 3 August 2026: the instrument matched on 100 of 100 component
// selections after correcting SR 3.4, whose base requirement the instrument had
// starting at SL 2 where the standard selects it from SL 1.
window.RefTableB1_62443_33 = {
  "SR1.1":  { base: 1, RE1: 2, RE2: 3, RE3: 4 },
  "SR1.2":  { base: 2, RE1: 3 },
  "SR1.3":  { base: 1, RE1: 3 },
  "SR1.4":  { base: 1 },
  "SR1.5":  { base: 1, RE1: 3 },
  "SR1.6":  { base: 1, RE1: 2 },
  "SR1.7":  { base: 1, RE1: 3, RE2: 4 },
  "SR1.8":  { base: 2 },
  "SR1.9":  { base: 2, RE1: 3 },
  "SR1.10": { base: 1 },
  "SR1.11": { base: 1 },
  "SR1.12": { base: 1 },
  "SR1.13": { base: 1, RE1: 2 },

  "SR2.1":  { base: 1, RE1: 2, RE2: 2, RE3: 3, RE4: 4 },
  "SR2.2":  { base: 1, RE1: 3 },
  "SR2.3":  { base: 1, RE1: 3 },
  "SR2.4":  { base: 1, RE1: 3 },
  "SR2.5":  { base: 1 },
  "SR2.6":  { base: 2 },
  "SR2.7":  { base: 3 },
  "SR2.8":  { base: 1, RE1: 3 },
  "SR2.9":  { base: 1, RE1: 3 },
  "SR2.10": { base: 1 },
  "SR2.11": { base: 2, RE1: 3, RE2: 4 },
  "SR2.12": { base: 3, RE1: 4 },

  "SR3.1":  { base: 1, RE1: 3 },
  "SR3.2":  { base: 1, RE1: 2, RE2: 3 },
  "SR3.3":  { base: 1, RE1: 3, RE2: 4 },
  "SR3.4":  { base: 1, RE1: 3 },
  "SR3.5":  { base: 1 },
  "SR3.6":  { base: 1 },
  "SR3.7":  { base: 2 },
  "SR3.8":  { base: 2, RE1: 3, RE2: 3, RE3: 4 },
  "SR3.9":  { base: 2, RE1: 4 },

  "SR4.1":  { base: 1, RE1: 2, RE2: 4 },
  "SR4.2":  { base: 2, RE1: 3 },
  "SR4.3":  { base: 1 },

  "SR5.1":  { base: 1, RE1: 2, RE2: 3, RE3: 4 },
  "SR5.2":  { base: 1, RE1: 2, RE2: 3, RE3: 3 },
  "SR5.3":  { base: 1, RE1: 3 },
  "SR5.4":  { base: 1 },

  "SR6.1":  { base: 1, RE1: 3 },
  "SR6.2":  { base: 2 },

  "SR7.1":  { base: 1, RE1: 2, RE2: 3 },
  "SR7.2":  { base: 1 },
  "SR7.3":  { base: 1, RE1: 2, RE2: 3 },
  "SR7.4":  { base: 1 },
  "SR7.5":  { base: 1 },
  "SR7.6":  { base: 1, RE1: 3 },
  "SR7.7":  { base: 1 },
  "SR7.8":  { base: 2 }
};

// SR titles exactly as Table B.1 prints them.
window.RefTableB1Titles_62443_33 = {
  "SR1.1":  "Human user identification and authentication",
  "SR1.2":  "Software process and device identification and authentication",
  "SR1.3":  "Account management",
  "SR1.4":  "Identifier management",
  "SR1.5":  "Authenticator management",
  "SR1.6":  "Wireless access management",
  "SR1.7":  "Strength of password-based authentication",
  "SR1.8":  "Public key infrastructure certificates",
  "SR1.9":  "Strength of public key authentication",
  "SR1.10": "Authenticator feedback",
  "SR1.11": "Unsuccessful login attempts",
  "SR1.12": "System use notification",
  "SR1.13": "Access via untrusted networks",

  "SR2.1":  "Authorization enforcement",
  "SR2.2":  "Wireless use control",
  "SR2.3":  "Use control for portable and mobile devices",
  "SR2.4":  "Mobile code",
  "SR2.5":  "Session lock",
  "SR2.6":  "Remote session termination",
  "SR2.7":  "Concurrent session control",
  "SR2.8":  "Auditable events",
  "SR2.9":  "Audit storage capacity",
  "SR2.10": "Response to audit processing failures",
  "SR2.11": "Timestamps",
  "SR2.12": "Non-repudiation",

  "SR3.1":  "Communication integrity",
  "SR3.2":  "Malicious code protection",
  "SR3.3":  "Security functionality verification",
  "SR3.4":  "Software and information integrity",
  "SR3.5":  "Input validation",
  "SR3.6":  "Deterministic output",
  "SR3.7":  "Error handling",
  "SR3.8":  "Session integrity",
  "SR3.9":  "Protection of audit information",

  "SR4.1":  "Information confidentiality",
  "SR4.2":  "Information persistence",
  "SR4.3":  "Use of cryptography",

  "SR5.1":  "Network segmentation",
  "SR5.2":  "Zone boundary protection",
  "SR5.3":  "General purpose person-to-person communication restrictions",
  "SR5.4":  "Application partitioning",

  "SR6.1":  "Audit log accessibility",
  "SR6.2":  "Continuous monitoring",

  "SR7.1":  "Denial of service protection",
  "SR7.2":  "Resource management",
  "SR7.3":  "Control system backup",
  "SR7.4":  "Control system recovery and reconstitution",
  "SR7.5":  "Emergency power",
  "SR7.6":  "Network and security configuration settings",
  "SR7.7":  "Least functionality",
  "SR7.8":  "Control system component inventory"
};

// FR names and abbreviations as Table B.1 heads each block, e.g.
// "FR 1 - Identification and authentication control (IAC)".
window.RefTableB1FRs_62443_33 = {
  FR1: { name: "Identification and authentication control", abbr: "IAC" },
  FR2: { name: "Use control",                               abbr: "UC"  },
  FR3: { name: "System integrity",                          abbr: "SI"  },
  FR4: { name: "Data confidentiality",                      abbr: "DC"  },
  FR5: { name: "Restricted data flow",                      abbr: "RDF" },
  FR6: { name: "Timely response to events",                 abbr: "TRE" },
  FR7: { name: "Resource availability",                     abbr: "RA"  }
};
