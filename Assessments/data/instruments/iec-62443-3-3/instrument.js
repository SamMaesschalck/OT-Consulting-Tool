/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-3-3/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-3-3"] = window.App.Data.instruments["iec-62443-3-3"] || {};
window.App.Data.instruments["iec-62443-3-3"].instrument = {
    "id":  "iec-62443-3-3",
    "title":  "ISA/IEC 62443-3-3 System Security Assessment",
    "edition":  "2013",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "capability-sl",
    "targetDimension":  "zone",
    "targetDimensionLabel":  "Zone or conduit",
    "targetDimensionLabelPlural":  "Zones and conduits",
    "taxonomyRef":  "fr-7",
    "scoringProfileRef":  "sl-target-closeness",
    "notes":  "Questions are phrased in plain assessor language by the author and are not reproductions of ISA/IEC 62443-3-3 text. Refine wording as needed. achievedSL is captured 0-4 against the chosen target SL.",
    "display":  {
                    "requirementNoun":  "system requirement",
                    "slVector":  {
                                     "title":  "Achieved security level (SL-A)",
                                     "label":  "SL-A",
                                     "qualifier":  "system",
                                     "note":  "The security level the system achieves for each Foundational Requirement, set by its weakest applicable requirement, expressed as the SL vector used in ISA/IEC 62443-3-3 Annex A. Read it against the target SL vector for the zone: a value below target means that Foundational Requirement is protected against a weaker class of threat than the environment calls for, and a 0 means it does not reach SL 1. This is the achieved level for the system as configured and operated, not a capability claim about any individual product."
                                 }
                },
    "requirements":  [
                         {
                             "id":  "SR1.1",
                             "frId":  "FR1",
                             "code":  "SR 1.1",
                             "title":  "Human user identification and authentication",
                             "question":  "Are all human users uniquely identified and authenticated before access is granted on every interface (local, network and remote)?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Human user identification and authentication",
                                                          "hint":  "Identify and authenticate all human users on every interface.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL1, plus each human user uniquely identified (no shared identities).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Multifactor authentication for untrusted networks",
                                                          "hint":  "As SL2, plus multifactor authentication for access over untrusted networks.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Multifactor authentication for all networks",
                                                          "hint":  "As SL3, plus multifactor authentication for all human user access.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Knowing which human is acting is the basis of all accountability and access control. Shared and generic operator logins are common in OT and convenient on a 24/7 plant, which is exactly why establishing individual human identity is both valuable and difficult here."
                         },
                         {
                             "id":  "SR1.2",
                             "frId":  "FR1",
                             "code":  "SR 1.2",
                             "title":  "Software process and device identification and authentication",
                             "question":  "Are software processes and devices identified and authenticated before they are allowed to access the control system?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Software process and device ID and authentication",
                                                          "hint":  "Identify and authenticate software processes and devices.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL2, plus unique identification and authentication of them.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Software processes and devices act on the control system as much as people do, and an unauthenticated device is an open door. Authenticating non-human actors stops rogue or spoofed components being trusted simply because they are on the network."
                         },
                         {
                             "id":  "SR1.3",
                             "frId":  "FR1",
                             "code":  "SR 1.3",
                             "title":  "Account management",
                             "question":  "Is there a managed process for creating, enabling, modifying, disabling and removing accounts across the control system?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Account management",
                                                          "hint":  "Manage accounts under a defined process: create, enable, modify, disable, remove.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Account management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unified account management",
                                                          "hint":  "As SL2, plus unified account management across the control system.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unified account management",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Accounts that are created and never managed accumulate into standing risk, dormant logins, departed staff, shared credentials. Disciplined account management keeps the set of who-can-log-in aligned with who should, closing a route attackers routinely exploit."
                         },
                         {
                             "id":  "SR1.4",
                             "frId":  "FR1",
                             "code":  "SR 1.4",
                             "title":  "Identifier management",
                             "question":  "Are user, group, role and device identifiers managed so that they are unique and not reused inappropriately?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "Manage identifiers for users, groups, roles and devices so they stay unique and controlled.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Identifiers must be unique and not silently reused, or actions get attributed to the wrong actor and revoked access quietly returns. Managing identifiers keeps the link between a name and a real person or device trustworthy over time."
                         },
                         {
                             "id":  "SR1.5",
                             "frId":  "FR1",
                             "code":  "SR 1.5",
                             "title":  "Authenticator management",
                             "question":  "Are authenticators (passwords, tokens, keys, certificates) issued, stored, changed and revoked under a defined process?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator management",
                                                          "hint":  "Initialise, change/refresh, protect and revoke authenticators.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for authenticators",
                                                          "hint":  "As SL2, plus hardware-based protection for software-process credentials.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for authenticators",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Authenticators, passwords, keys, tokens, are what prove identity, so their handling determines whether authentication means anything. Weak generation, storage or revocation undermines every control that depends on knowing who is acting."
                         },
                         {
                             "id":  "SR1.6",
                             "frId":  "FR1",
                             "code":  "SR 1.6",
                             "title":  "Wireless access management",
                             "question":  "Are wireless users and devices identified, authenticated and authorised before being granted wireless access?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless access management",
                                                          "hint":  "Identify, authenticate and authorise wireless users and devices before access.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL1, plus unique identification and authentication of them.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Wireless extends the network beyond the physical boundary, where an attacker need not be on site to reach it. Managing wireless access controls who can associate with the control environment through a medium that is invisible and hard to contain."
                         },
                         {
                             "id":  "SR1.7",
                             "frId":  "FR1",
                             "code":  "SR 1.7",
                             "title":  "Strength of password-based authentication",
                             "question":  "Where passwords are used, does the system enforce sufficient strength, lifetime and reuse controls?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Strength of password-based authentication",
                                                          "hint":  "Enforce configurable password strength where passwords are used.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Strength of password-based authentication",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Password generation and lifetime for human users",
                                                          "hint":  "As SL2, plus password generation and lifetime rules for human users.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Password lifetime for all users",
                                                          "hint":  "As SL3, extended to all users.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Where passwords are used, their strength sets how easily authentication can be defeated by guessing or cracking. In OT this must be balanced against operational reality, but weak password rules leave the front door barely latched."
                         },
                         {
                             "id":  "SR1.8",
                             "frId":  "FR1",
                             "code":  "SR 1.8",
                             "title":  "Public key infrastructure (PKI) certificates",
                             "question":  "Where PKI is used, are certificates issued, validated and managed in line with an established certificate policy?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "PKI certificates",
                                                          "hint":  "Where PKI is used, manage certificates per a defined policy: validate, track, revoke.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "PKI certificates",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "PKI certificates",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "PKI certificates underpin strong authentication and trusted communication, and their value rests entirely on how the certificates are issued, validated and revoked. Mismanaged certificates create false trust that an attacker can exploit."
                         },
                         {
                             "id":  "SR1.9",
                             "frId":  "FR1",
                             "code":  "SR 1.9",
                             "title":  "Strength of public key authentication",
                             "question":  "Where public key authentication is used, is the implementation strong (chain and status validation, binding to identity)?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Strength of public key authentication",
                                                          "hint":  "Validate public-key certificates and bind them to the right identity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for private keys",
                                                          "hint":  "As SL2, plus hardware-based protection of private keys.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for private keys",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Public-key authentication is only as strong as its key lengths, algorithms and handling. Specifying that strength stops the mechanism being technically present but practically weak, which is a common way strong-looking authentication fails."
                         },
                         {
                             "id":  "SR1.10",
                             "frId":  "FR1",
                             "code":  "SR 1.10",
                             "title":  "Authenticator feedback",
                             "question":  "Does the system obscure authentication feedback (for example masking passwords) to prevent exploitation?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "Obscure authentication feedback, for example by masking passwords.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Hiding authenticator feedback, such as masking passwords and not revealing why a login failed, denies an attacker easy clues. Verbose feedback helps legitimate users slightly and helps attackers enumerate accounts considerably more."
                         },
                         {
                             "id":  "SR1.11",
                             "frId":  "FR1",
                             "code":  "SR 1.11",
                             "title":  "Unsuccessful login attempts",
                             "question":  "Does the system limit and respond to consecutive failed login attempts without compromising availability of essential functions?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "Limit consecutive failed logins and respond, without disabling essential functions.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Limiting repeated failed logins blunts brute-force and guessing attacks. In OT the response must avoid locking out a genuine operator who needs urgent access, so the balance with availability is part of getting this right."
                         },
                         {
                             "id":  "SR1.12",
                             "frId":  "FR1",
                             "code":  "SR 1.12",
                             "title":  "System use notification",
                             "question":  "Can the system display a configurable use or banner notification before authentication where required?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "Display a configurable system use notification before authentication.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A system-use notification establishes, before access, that use is monitored and conditional. It is a modest control but it supports later enforcement and removes the defence that an intruder did not know access was restricted."
                         },
                         {
                             "id":  "SR1.13",
                             "frId":  "FR1",
                             "code":  "SR 1.13",
                             "title":  "Access via untrusted networks",
                             "question":  "Is access from untrusted networks monitored and controlled, with explicit approval where appropriate?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Access via untrusted networks",
                                                          "hint":  "Monitor and control access arriving via untrusted networks.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Explicit access request approval",
                                                          "hint":  "As SL1, plus explicit approval for each access request.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Explicit access request approval",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Explicit access request approval",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Access from untrusted networks, remote and cross-boundary connections, is among the highest-impact routes into OT. Controlling it tightly addresses the path that vendor access, remote support and internet exposure most often open."
                         },
                         {
                             "id":  "SR2.1",
                             "frId":  "FR2",
                             "code":  "SR 2.1",
                             "title":  "Authorization enforcement",
                             "question":  "Are authenticated users and processes restricted to their assigned privileges (least privilege) on all interfaces?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authorization enforcement",
                                                          "hint":  "Restrict each user/process to its assigned privileges on all interfaces.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Authorization enforcement for all users; permission mapping",
                                                          "hint":  "As SL1, plus enforce on all users and map permissions to roles.",
                                                          "verbatimText":  "",
                                                          "componentTitles":  {
                                                                                  "RE1":  "Authorization enforcement for all users",
                                                                                  "RE2":  "Permission mapping to roles"
                                                                              }
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Supervisor override",
                                                          "hint":  "As SL2, plus a controlled supervisor manual override capability.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3",
                                                                             "RE4"
                                                                         ],
                                                          "reTitle":  "Dual approval",
                                                          "hint":  "As SL3, plus dual approval for defined high-impact actions.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Authentication establishes who you are; authorisation governs what you may do. Enforcing authorisation is what stops an authenticated user, or a compromised account, from acting beyond what their role legitimately needs."
                         },
                         {
                             "id":  "SR2.2",
                             "frId":  "FR2",
                             "code":  "SR 2.2",
                             "title":  "Wireless use control",
                             "question":  "Are usage restrictions and authorisation enforced for wireless connectivity?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless use control",
                                                          "hint":  "Authorise, monitor and enforce usage restrictions for wireless connectivity.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless use control",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Identify and report unauthorized wireless devices",
                                                          "hint":  "As SL2, plus identify and report unauthorised wireless devices.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Identify and report unauthorized wireless devices",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Even where wireless access is permitted, what may be done over it should be controlled, because wireless carries higher risk than wired. Use control over wireless limits the damage achievable through a medium that is harder to physically secure."
                         },
                         {
                             "id":  "SR2.3",
                             "frId":  "FR2",
                             "code":  "SR 2.3",
                             "title":  "Use control for portable and mobile devices",
                             "question":  "Are portable and mobile devices controlled (authorisation, restrictions, monitoring) when connecting to the control system?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use control for portable and mobile devices",
                                                          "hint":  "Control portable/mobile device use: authorise, restrict, monitor on connection.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use control for portable and mobile devices",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Enforcement of security status",
                                                          "hint":  "As SL2, plus check and enforce device security status before connection.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Enforcement of security status",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Portable and mobile devices move between environments and carry whatever they collected elsewhere. Controlling their use addresses the well-known OT risk of a USB device or engineering laptop bridging an air gap and carrying malware in."
                         },
                         {
                             "id":  "SR2.4",
                             "frId":  "FR2",
                             "code":  "SR 2.4",
                             "title":  "Mobile code",
                             "question":  "Is the use of mobile code controlled and restricted to authorised, verified code?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "Control mobile code: restrict to authorised, verified code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code integrity check",
                                                          "hint":  "As SL2, plus integrity checking of mobile code.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code integrity check",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Mobile code runs with the privileges of whatever invoked it, so unrestricted mobile code is a path to silent execution. Controlling it limits a route by which malicious logic can run inside an otherwise trusted system."
                         },
                         {
                             "id":  "SR2.5",
                             "frId":  "FR2",
                             "code":  "SR 2.5",
                             "title":  "Session lock",
                             "question":  "Does the system lock a session after a defined period of inactivity where this does not impair operations?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "Lock a session after defined inactivity, where this does not impair operations.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An unattended, unlocked session is an open authenticated session anyone can use. Session lock guards against that, though in OT it must respect operations, since locking an active operator screen mid-task can itself be unsafe."
                         },
                         {
                             "id":  "SR2.6",
                             "frId":  "FR2",
                             "code":  "SR 2.6",
                             "title":  "Remote session termination",
                             "question":  "Can remote sessions be terminated automatically after inactivity or manually by an authorised operator?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Remote session termination",
                                                          "hint":  "Terminate remote sessions automatically on inactivity or manually by an operator.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Remote session termination",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Remote session termination",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Remote sessions left open are a route back in that is easily forgotten. Reliable remote-session termination ensures that access granted for a task does not silently persist as a standing exposure after the task is done."
                         },
                         {
                             "id":  "SR2.7",
                             "frId":  "FR2",
                             "code":  "SR 2.7",
                             "title":  "Concurrent session control",
                             "question":  "Can the system limit the number of concurrent sessions per user or interface where required?",
                             "applicableSLs":  [
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Concurrent session control",
                                                          "hint":  "Limit the number of concurrent sessions per user or interface.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Concurrent session control",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Uncontrolled concurrent sessions can mask misuse and cause confusion over who is actually in control of the system. Limiting concurrency reduces both the security and the operational ambiguity of multiple simultaneous logins."
                         },
                         {
                             "id":  "SR2.8",
                             "frId":  "FR2",
                             "code":  "SR 2.8",
                             "title":  "Auditable events",
                             "question":  "Are security-relevant events generated and recorded for the required categories (access, configuration changes and so on)?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Auditable events",
                                                          "hint":  "Generate and record security-relevant events across the required categories.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Auditable events",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Centrally managed audit trail",
                                                          "hint":  "As SL2, plus a centrally managed, system-wide audit trail.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Centrally managed audit trail",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "If security-relevant events are not recorded as auditable, there is nothing to detect, investigate or prove afterwards. Defining what must be audited is the foundation that monitoring, forensics and accountability all build on."
                         },
                         {
                             "id":  "SR2.9",
                             "frId":  "FR2",
                             "code":  "SR 2.9",
                             "title":  "Audit storage capacity",
                             "question":  "Is audit storage capacity sufficient and managed to avoid loss of records?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit storage capacity",
                                                          "hint":  "Provide sufficient, managed audit storage to avoid loss of records.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit storage capacity",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Warn when capacity threshold reached",
                                                          "hint":  "As SL2, plus warn when storage reaches a defined threshold.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Warn when capacity threshold reached",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Audit data that overruns its storage is lost exactly when it may be most needed. Ensuring sufficient capacity keeps the record intact through a sustained incident, when log volume spikes and gaps would otherwise appear."
                         },
                         {
                             "id":  "SR2.10",
                             "frId":  "FR2",
                             "code":  "SR 2.10",
                             "title":  "Response to audit processing failures",
                             "question":  "Does the system alert and respond appropriately when audit processing or storage fails?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "Alert and respond appropriately when audit processing or storage fails.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "How the system behaves when auditing itself fails determines whether an attacker can blind it. A defined response to audit failures stops the loss of logging passing unnoticed, which is often an early sign of tampering."
                         },
                         {
                             "id":  "SR2.11",
                             "frId":  "FR2",
                             "code":  "SR 2.11",
                             "title":  "Timestamps",
                             "question":  "Are audit records timestamped from a reliable, synchronised time source?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Timestamps",
                                                          "hint":  "Timestamp audit records.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Time synchronization",
                                                          "hint":  "As SL2, plus synchronise time from a reliable source.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Protection of time source integrity",
                                                          "hint":  "As SL3, plus protect the integrity of the time source.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Without trustworthy, synchronised timestamps, events cannot be correlated and a sequence of attack steps cannot be reconstructed. Reliable time is what lets scattered logs be assembled into a coherent account of what happened."
                         },
                         {
                             "id":  "SR2.12",
                             "frId":  "FR2",
                             "code":  "SR 2.12",
                             "title":  "Non-repudiation",
                             "question":  "Can the system attribute actions to the user or process that performed them so they cannot plausibly be denied?",
                             "applicableSLs":  [
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Non-repudiation",
                                                          "hint":  "Attribute actions to the user/process so they cannot plausibly be denied.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Non-repudiation for all users",
                                                          "hint":  "As SL3, extended to all users.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Non-repudiation ties an action firmly to the actor who took it, so it cannot later be denied. For consequential operations on a control system, that binding supports both accountability and any subsequent investigation."
                         },
                         {
                             "id":  "SR3.1",
                             "frId":  "FR3",
                             "code":  "SR 3.1",
                             "title":  "Communication integrity",
                             "question":  "Is the integrity of transmitted information protected against unauthorised modification?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Communication integrity",
                                                          "hint":  "Protect the integrity of transmitted information.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Communication integrity",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Cryptographic integrity protection",
                                                          "hint":  "As SL2, plus cryptographic integrity protection of communications.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Cryptographic integrity protection",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Communication integrity ensures messages are not altered in transit, and in OT an altered command or setpoint has physical consequences. Protecting integrity matters more here than confidentiality, because a changed instruction can move equipment."
                         },
                         {
                             "id":  "SR3.2",
                             "frId":  "FR3",
                             "code":  "SR 3.2",
                             "title":  "Malicious code protection",
                             "question":  "Are malicious code protections deployed and maintained appropriately for the OT environment?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Malicious code protection",
                                                          "hint":  "Deploy and maintain malicious code protection appropriate to the environment.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Protection at all entry/exit points",
                                                          "hint":  "As SL1, plus protection at all entry and exit points.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Central management and reporting",
                                                          "hint":  "As SL2, plus central management and reporting.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Central management and reporting",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Malicious code protection addresses one of the most common ways control systems are compromised. In OT it often means allow-listing or other approaches rather than conventional antivirus, but the goal, keeping hostile code from running, is the same."
                         },
                         {
                             "id":  "SR3.3",
                             "frId":  "FR3",
                             "code":  "SR 3.3",
                             "title":  "Security functionality verification",
                             "question":  "Can the correct operation of security functions be verified, and is it verified periodically?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Security functionality verification",
                                                          "hint":  "Be able to verify that security functions operate correctly.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Security functionality verification",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Automated mechanisms",
                                                          "hint":  "As SL2, plus automated verification during normal operation.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Verification on all functions",
                                                          "hint":  "As SL3, plus verification across all security functions.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Verifying that security functions actually work confirms the protections are real rather than assumed. Controls can silently fail or be disabled, and without verification an organisation believes it is protected until an incident shows it was not."
                         },
                         {
                             "id":  "SR3.4",
                             "frId":  "FR3",
                             "code":  "SR 3.4",
                             "title":  "Software and information integrity",
                             "question":  "Is the integrity of software, configuration and information protected and verifiable?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Software and information integrity",
                                                          "hint":  "Protect and be able to verify integrity of software, configuration and information.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Software and information integrity",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Automated notification of integrity violations",
                                                          "hint":  "As SL2, plus automatic notification of integrity violations.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Automated notification of integrity violations",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "The integrity of software and information determines whether the system is running what it should. Detecting unauthorised changes to firmware, logic or configuration catches tampering that could alter how the process physically behaves."
                         },
                         {
                             "id":  "SR3.5",
                             "frId":  "FR3",
                             "code":  "SR 3.5",
                             "title":  "Input validation",
                             "question":  "Is the validity of inputs checked to prevent malformed or malicious input from causing failures?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "Validate inputs to prevent malformed or malicious input causing failures.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Unvalidated input is a classic route to crashing or subverting a system, and a control system processes input from many sources. Input validation stops malformed or malicious data causing unintended, possibly physical, effects."
                         },
                         {
                             "id":  "SR3.6",
                             "frId":  "FR3",
                             "code":  "SR 3.6",
                             "title":  "Deterministic output",
                             "question":  "Does the system set outputs to a defined safe state on failure rather than an unpredictable one?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "Set outputs to a defined safe state on failure rather than an unpredictable one.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Control systems must produce correct outputs even under stress or attack, because the output drives physical equipment. Deterministic output ensures the system behaves predictably rather than failing into an unsafe or unknown state."
                         },
                         {
                             "id":  "SR3.7",
                             "frId":  "FR3",
                             "code":  "SR 3.7",
                             "title":  "Error handling",
                             "question":  "Are errors handled so they do not expose sensitive information or leave the system in an unsafe state?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Error handling",
                                                          "hint":  "Handle errors without exposing sensitive information or entering an unsafe state.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Error handling",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Error handling",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "How a system handles errors determines whether a fault becomes a foothold or a safe stop. Sound error handling stops failures leaking information or dropping the system into an exploitable state."
                         },
                         {
                             "id":  "SR3.8",
                             "frId":  "FR3",
                             "code":  "SR 3.8",
                             "title":  "Session integrity",
                             "question":  "Is the integrity of communication sessions protected (for example against hijacking or injection)?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session integrity",
                                                          "hint":  "Protect the integrity of communication sessions.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Invalidate session IDs; unique session IDs",
                                                          "hint":  "As SL2, plus invalidate session IDs after termination and use unique IDs.",
                                                          "verbatimText":  "",
                                                          "componentTitles":  {
                                                                                  "RE1":  "Invalidation of session IDs after session termination",
                                                                                  "RE2":  "Unique session ID generation"
                                                                              }
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Randomized session IDs",
                                                          "hint":  "As SL3, plus randomised, unpredictable session IDs.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Once a session is authenticated, its integrity must hold or an attacker can hijack or inject into it. Protecting session integrity stops a legitimate, trusted session being turned into an attack channel."
                         },
                         {
                             "id":  "SR3.9",
                             "frId":  "FR3",
                             "code":  "SR 3.9",
                             "title":  "Protection of audit information",
                             "question":  "Is audit information protected from unauthorised access, modification and deletion?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection of audit information",
                                                          "hint":  "Protect audit information from unauthorised access, modification and deletion.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection of audit information",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Audit records on separate device",
                                                          "hint":  "As SL3, plus write audit records to a separate, protected device.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Audit information is the record an attacker most wants to alter to hide their tracks. Protecting it ensures the logs can be trusted as evidence and that tampering with them is itself detectable."
                         },
                         {
                             "id":  "SR4.1",
                             "frId":  "FR4",
                             "code":  "SR 4.1",
                             "title":  "Information confidentiality",
                             "question":  "Is information at rest and in transit protected against unauthorised disclosure to the level required?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information confidentiality",
                                                          "hint":  "Protect information at rest and in transit from unauthorised disclosure.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Protection of information at rest",
                                                          "hint":  "As SL1, plus specific protection of information at rest.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Protection of information at rest",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Protection of information in transit",
                                                          "hint":  "As SL3, plus specific protection of information in transit.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Some control-system data, credentials, keys, configuration, network detail, aids an attacker if exposed, even though confidentiality is usually a lower OT priority than integrity. Protecting it where it matters denies reconnaissance and reuse."
                         },
                         {
                             "id":  "SR4.2",
                             "frId":  "FR4",
                             "code":  "SR 4.2",
                             "title":  "Information persistence",
                             "question":  "Is information cleared from shared resources and decommissioned media so it cannot be recovered by unauthorised parties?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information persistence",
                                                          "hint":  "Clear information from shared resources and decommissioned media.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Purging of shared memory resources",
                                                          "hint":  "As SL2, plus purge shared memory resources.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Purging of shared memory resources",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Information persists on media and equipment after its useful life, ready to be recovered by whoever obtains the hardware. Managing that persistence ensures decommissioned or repurposed kit does not hand over sensitive data."
                         },
                         {
                             "id":  "SR4.3",
                             "frId":  "FR4",
                             "code":  "SR 4.3",
                             "title":  "Use of cryptography",
                             "question":  "Where cryptography is used, does it follow recognised, appropriately strong algorithms and key management?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "Where cryptography is used, follow recognised algorithms and key management.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Cryptography underpins confidentiality, integrity and authentication, but only if used correctly. Specifying its proper use stops weak or misapplied cryptography giving the appearance of protection without the substance, within OT\u0027s performance constraints."
                         },
                         {
                             "id":  "SR5.1",
                             "frId":  "FR5",
                             "code":  "SR 5.1",
                             "title":  "Network segmentation",
                             "question":  "Is the control system logically segmented into zones and separated from other networks, including the business network?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network segmentation",
                                                          "hint":  "Logically segment the control system and separate it from other networks.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Physical network segmentation",
                                                          "hint":  "As SL1, plus physically separate control from non-control, and critical from non-critical.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Independence from non-control networks",
                                                          "hint":  "As SL2, plus operate control networks without reliance on non-control networks.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Logical and physical isolation of critical networks",
                                                          "hint":  "As SL3, plus logically and physically isolate critical networks.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Network segmentation limits how far a compromise can spread from the routes attackers usually arrive by. It is among the most effective OT controls, because a flat network lets a single foothold reach the entire control environment."
                         },
                         {
                             "id":  "SR5.2",
                             "frId":  "FR5",
                             "code":  "SR 5.2",
                             "title":  "Zone boundary protection",
                             "question":  "Are zone boundaries protected and traffic between zones controlled and monitored?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Zone boundary protection",
                                                          "hint":  "Protect zone boundaries and control traffic between zones.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Deny by default, allow by exception",
                                                          "hint":  "As SL1, plus deny-by-default boundary policy.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Island mode; fail close",
                                                          "hint":  "As SL2, plus the ability to isolate (island) and to fail closed.",
                                                          "verbatimText":  "",
                                                          "componentTitles":  {
                                                                                  "RE2":  "Island mode",
                                                                                  "RE3":  "Fail close"
                                                                              }
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2",
                                                                             "RE3"
                                                                         ],
                                                          "reTitle":  "Island mode; fail close",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Zone boundary protection enforces the segmentation that design intends, controlling what actually crosses between zones. Without enforced boundaries, segmentation exists only on the diagram and not in the traffic."
                         },
                         {
                             "id":  "SR5.3",
                             "frId":  "FR5",
                             "code":  "SR 5.3",
                             "title":  "General purpose person-to-person communication restrictions",
                             "question":  "Are general-purpose communication services (for example email and messaging) restricted within the control system?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose person-to-person comms restrictions",
                                                          "hint":  "Restrict general-purpose messaging (e.g. email) within the control system.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose person-to-person comms restrictions",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Prohibit all general purpose person-to-person comms",
                                                          "hint":  "As SL2, plus prohibit such communications entirely.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Prohibit all general purpose person-to-person comms",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "General person-to-person services such as email and messaging are common malware entry points and have little place inside the control environment. Restricting them removes a frequent initial-access route into OT."
                         },
                         {
                             "id":  "SR5.4",
                             "frId":  "FR5",
                             "code":  "SR 5.4",
                             "title":  "Application partitioning",
                             "question":  "Are critical applications partitioned from non-critical ones to limit the impact of a compromise?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Application partitioning",
                                                          "hint":  "Partition critical applications from non-critical ones.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Application partitioning",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Application partitioning",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Application partitioning",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Partitioning applications stops a weakness in one from undermining others sharing the same system. It contains the blast radius, so a single compromised application does not become a route to everything alongside it."
                         },
                         {
                             "id":  "SR6.1",
                             "frId":  "FR6",
                             "code":  "SR 6.1",
                             "title":  "Audit log accessibility",
                             "question":  "Can authorised personnel access audit logs in a usable form without being able to alter them?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit log accessibility",
                                                          "hint":  "Give authorised personnel usable, read-only access to audit logs.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit log accessibility",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Programmatic access to audit logs",
                                                          "hint":  "As SL2, plus programmatic (machine-readable) access to logs.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Programmatic access to audit logs",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Logs are only useful if the right people can actually reach and read them when needed. Ensuring audit-log accessibility turns recorded data into something usable for detection and investigation rather than data that exists but cannot be consulted."
                         },
                         {
                             "id":  "SR6.2",
                             "frId":  "FR6",
                             "code":  "SR 6.2",
                             "title":  "Continuous monitoring",
                             "question":  "Is the control system monitored continuously to detect security events and anomalous activity?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Continuous monitoring",
                                                          "hint":  "Continuously monitor for security events and anomalous activity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Continuous monitoring",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Continuous monitoring",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Continuous monitoring is the precondition for noticing an attack while it is happening rather than discovering it long after. Many OT incidents go undetected for want of monitoring, so this is what gives the response clock a chance to start."
                         },
                         {
                             "id":  "SR7.1",
                             "frId":  "FR7",
                             "code":  "SR 7.1",
                             "title":  "Denial of service protection",
                             "question":  "Is the system protected against denial-of-service conditions affecting essential functions?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Denial of service protection",
                                                          "hint":  "Protect essential functions against denial-of-service conditions.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Manage comms load",
                                                          "hint":  "As SL1, plus manage communication load to limit DoS impact.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Limit DoS effects on other systems",
                                                          "hint":  "As SL2, plus limit DoS effects spreading to other systems.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Limit DoS effects on other systems",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Denial-of-service protection keeps the control system available under load or attack, and in OT availability is the top priority because the system runs a physical process. Losing availability can mean losing control of that process."
                         },
                         {
                             "id":  "SR7.2",
                             "frId":  "FR7",
                             "code":  "SR 7.2",
                             "title":  "Resource management",
                             "question":  "Are resources managed so a security event in one area does not starve essential functions elsewhere?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "Manage resources so a security event does not starve essential functions.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Managing resources ensures essential functions retain what they need even when something else is consuming or starving them. It stops a fault or attack in one area degrading the availability of the functions that matter most."
                         },
                         {
                             "id":  "SR7.3",
                             "frId":  "FR7",
                             "code":  "SR 7.3",
                             "title":  "Control system backup",
                             "question":  "Are backups of the control system (configuration, software and data) taken, protected and verified?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system backup",
                                                          "hint":  "Take backups of configuration, software and data.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Backup integrity verification",
                                                          "hint":  "As SL1, plus verify backup integrity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Automated backup",
                                                          "hint":  "As SL2, plus automated backup on a defined schedule.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Automated backup",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Backups are the basis of recovery from destructive attacks, ransomware and serious error, and in OT they must include controller logic and configuration, not just data. A backup regime is what makes recovery possible rather than hoped-for."
                         },
                         {
                             "id":  "SR7.4",
                             "frId":  "FR7",
                             "code":  "SR 7.4",
                             "title":  "Control system recovery and reconstitution",
                             "question":  "Can the control system be recovered and reconstituted to a known secure state after a disruption?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "Recover and reconstitute to a known secure state after disruption.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Recovery and reconstitution is the ability to actually restore the system to a known good state and resume operation. Backups without a proven recovery capability give false assurance; this is the control that limits how long the function stays down."
                         },
                         {
                             "id":  "SR7.5",
                             "frId":  "FR7",
                             "code":  "SR 7.5",
                             "title":  "Emergency power",
                             "question":  "Is there emergency or backup power sufficient to maintain or safely shut down essential functions?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Emergency power",
                                                          "hint":  "Provide emergency/backup power to maintain or safely shut down essential functions.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Emergency power",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Emergency power",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Emergency power",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Emergency power keeps the control system running through supply disruption, which for a physical process can itself be a safety matter. It ensures that a power event does not cascade into loss of control at the worst moment."
                         },
                         {
                             "id":  "SR7.6",
                             "frId":  "FR7",
                             "code":  "SR 7.6",
                             "title":  "Network and security configuration settings",
                             "question":  "Are network and security configuration settings defined, applied and protected against unauthorised change?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network and security configuration settings",
                                                          "hint":  "Define, apply and protect network and security configuration settings.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network and security configuration settings",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Machine-readable reporting of current settings",
                                                          "hint":  "As SL2, plus machine-readable reporting of current settings.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Machine-readable reporting of current settings",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Network and security configuration settings define the system\u0027s actual security posture, and drift or default settings quietly erode it. Managing these settings keeps the hardening real and current rather than as-shipped."
                         },
                         {
                             "id":  "SR7.7",
                             "frId":  "FR7",
                             "code":  "SR 7.7",
                             "title":  "Least functionality",
                             "question":  "Is the system configured to provide only the functions required, with unnecessary services and ports disabled?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "Provide only required functions; disable unnecessary services and ports.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Least functionality removes services, ports and features the function does not need, shrinking the attack surface. It is one of the few hardening measures broadly applicable even to legacy OT devices that cannot be patched."
                         },
                         {
                             "id":  "SR7.8",
                             "frId":  "FR7",
                             "code":  "SR 7.8",
                             "title":  "Control system component inventory",
                             "question":  "Is an accurate inventory of control system components maintained?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system component inventory",
                                                          "hint":  "Maintain an accurate inventory of control system components.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system component inventory",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system component inventory",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "You cannot protect, patch or monitor what you do not know is connected. A current component inventory underpins almost every other control and is frequently the weakest area in OT, where undocumented and legacy equipment accumulates."
                         }
                     ],
    "_slGuidanceNote":  "slGuidance gives, per SR and per SL: the factual requirement composition (base / which REs, derived from the standard\u0027s SL-C vectors), a short RE title, and a paraphrased memory-jog hint. Titles and hints are paraphrased, NOT IEC verbatim text. \u0027verbatimText\u0027 is an empty slot for the licence holder to paste official wording into their own copy if desired; the tool shows it when present and falls back to the hint when empty. All seven FRs complete.",
    "_rationaleNote":  "Per-SR \u0027rationale\u0027 is a plain-language \u0027why this matters\u0027 (2-3 sentences, practitioner voice, OT consequence where relevant). Original explanatory text, not reproduced IEC wording. Sits alongside slGuidance, which carries the per-SL detail."
};
