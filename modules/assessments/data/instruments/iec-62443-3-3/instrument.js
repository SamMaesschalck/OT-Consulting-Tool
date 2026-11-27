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
                                     "note":  "This is the security level the system achieves for each Foundational Requirement, set by its weakest applicable requirement and written as the SL vector used in ISA/IEC 62443-3-3 Annex A. It is read against the zone\u0027s target SL vector. A value below target means that Foundational Requirement is protected against a weaker class of threat than the environment calls for, and a 0 means it does not reach SL 1. The vector describes the system as configured and operated and makes no claim about the capability of any single product."
                                 }
                },
    "requirements":  [
                         {
                             "id":  "SR1.1",
                             "frId":  "FR1",
                             "code":  "SR 1.1",
                             "title":  "Human user identification and authentication",
                             "question":  "Are all human users uniquely identified and authenticated before they are given access on every interface (local, network and remote)?",
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
                             "rationale":  "Knowing which person is acting is the basis of accountability and access control. Shared and generic operator logins are common in OT because they are convenient on a plant that runs 24/7, so individual logins take effort to introduce."
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
                                                          "hint":  "As SL2, plus unique identification and authentication of each software process and device.",
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
                             "rationale":  "Software processes and devices act on the control system just as people do, and an unauthenticated device can connect without being challenged. Authenticating them stops a rogue or spoofed component being trusted because it is on the network."
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
                                                          "hint":  "Create, enable, modify, disable and remove accounts under a defined process.",
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
                             "rationale":  "Accounts that are created and then left unmanaged build up into dormant logins, accounts for staff who have left and shared credentials. A defined account process means only the people who should be able to log in can do so, and it closes a route attackers often use."
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
                             "rationale":  "Identifiers must be unique and must not be reused without control. Otherwise actions are attributed to the wrong person or device, and access that was revoked can come back. Managing identifiers keeps each name tied to one real person or device over time."
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
                             "rationale":  "Authenticators such as passwords, keys and tokens are what prove identity, so the way they are handled decides whether authentication means anything. Weak generation, storage or revocation undermines every control that relies on knowing who is acting."
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
                                                          "hint":  "As SL1, plus unique identification and authentication of each wireless user and device.",
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
                             "rationale":  "Wireless extends the network beyond the site boundary, so an attacker does not need to be on site to reach it. Wireless access management controls who can join the control network over a medium that cannot be seen and is hard to contain."
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
                             "rationale":  "Where passwords are used, their strength sets how easily authentication can be defeated by guessing or cracking. In OT the rules have to fit the way the plant is operated, but they still have to be strong enough to resist guessing."
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
                                                          "hint":  "Where PKI is used, validate, track and revoke certificates under a defined policy.",
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
                             "rationale":  "PKI certificates support strong authentication and trusted communication, and they are only as trustworthy as the way they are issued, validated and revoked. Badly managed certificates create misplaced trust that an attacker can exploit."
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
                             "rationale":  "Public key authentication is only as strong as its key lengths, algorithms and key handling. A mechanism can be in place and still be weak in practice, which is a common way for strong-looking authentication to fail."
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
                             "rationale":  "Masking passwords and withholding the reason a login failed deny an attacker easy clues. Detailed feedback helps legitimate users a little and helps an attacker enumerate accounts a great deal more."
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
                             "rationale":  "Limiting repeated failed logins slows brute-force and guessing attacks. In OT the response must not lock out an operator who needs urgent access, so the lockout has to be balanced against availability."
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
                             "rationale":  "A system use notification tells users before they log in that use is monitored and subject to conditions. It is a modest control, but it supports later enforcement and removes the defence that an intruder did not know access was restricted."
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
                             "rationale":  "Remote and cross-boundary connections from untrusted networks are among the highest-impact routes into OT. Vendor access, remote support and internet exposure most often open this route, so it needs tight control."
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
                                                          "hint":  "Restrict each user or process to its assigned privileges on all interfaces.",
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
                             "rationale":  "Authentication establishes who someone is, and authorisation governs what they may do. Enforcing authorisation stops an authenticated user, or a compromised account, from acting beyond what the role needs."
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
                             "rationale":  "Where wireless access is permitted, what can be done over it should still be controlled, because wireless carries more risk than a wired connection. Use control limits the damage possible over a medium that is harder to secure physically."
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
                                                          "hint":  "Authorise, restrict and monitor portable and mobile devices when they connect.",
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
                             "rationale":  "Portable and mobile devices move between environments and carry whatever they picked up elsewhere. A USB stick or engineering laptop that bridges an air gap and brings malware in is a well-known OT risk."
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
                                                          "hint":  "Restrict mobile code to authorised, verified code.",
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
                             "rationale":  "Mobile code runs with the privileges of whatever invoked it, so unrestricted mobile code can run without anyone noticing. Controlling it closes a route for malicious logic to run inside a trusted system."
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
                             "rationale":  "Anyone who walks up to an unattended, unlocked session can use it. Session lock prevents this, but in OT it has to fit operations, because locking an operator screen during a task can itself be unsafe."
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
                             "rationale":  "A remote session left open is an easily forgotten route back in. Terminating remote sessions reliably means that access granted for a task ends when the task is done."
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
                             "rationale":  "Uncontrolled concurrent sessions can hide misuse and cause confusion over who is in control of the system. Limiting them reduces both the security risk and the operational confusion of several simultaneous logins."
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
                             "rationale":  "If security-relevant events are not recorded, there is nothing to detect, investigate or prove afterwards. Monitoring, forensics and accountability all depend on deciding which events are audited."
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
                             "rationale":  "Audit data that overruns its storage is lost when it may be needed most. Enough capacity keeps the record intact through a long incident, when log volume rises and gaps would otherwise appear."
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
                             "rationale":  "How the system behaves when auditing fails decides whether an attacker can blind it. A defined response means a loss of logging is noticed, and that loss is often an early sign of tampering."
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
                             "rationale":  "Without reliable, synchronised timestamps, events from different sources cannot be correlated and the steps of an attack cannot be put in order. Consistent time lets scattered logs be assembled into one account of what happened."
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
                                                          "hint":  "Attribute actions to the user or process that took them, so they cannot plausibly be denied.",
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
                             "rationale":  "Non-repudiation ties an action to the person or process that took it, so it cannot later be denied. For high-consequence operations on a control system, this supports accountability and any later investigation."
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
                             "rationale":  "Communication integrity protects messages from being altered in transit. In OT an altered command or setpoint can move equipment, so integrity usually matters more than confidentiality."
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
                             "rationale":  "Malicious code is one of the most common ways control systems are compromised. In OT this is often done with application allow-listing or a similar method, and less often with conventional antivirus. The aim is to stop hostile code from running."
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
                                                          "hint":  "Provide a way to verify that security functions operate correctly.",
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
                             "rationale":  "Controls can fail or be disabled without any sign, and without verification an organisation may believe it is protected until an incident shows otherwise."
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
                                                          "hint":  "Protect the integrity of software, configuration and information, and provide a way to verify it.",
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
                             "rationale":  "Integrity checks show whether the system is running the software and configuration it should. Detecting unauthorised changes to firmware, logic or configuration catches tampering that could change how the process behaves."
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
                             "rationale":  "Unvalidated input is a common way to crash or subvert a system, and a control system takes input from many sources. Input validation stops malformed or malicious data causing unintended effects, some of which may be physical."
                         },
                         {
                             "id":  "SR3.6",
                             "frId":  "FR3",
                             "code":  "SR 3.6",
                             "title":  "Deterministic output",
                             "question":  "Does the system set its outputs to a defined safe state when it fails?",
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
                                                          "hint":  "Set outputs to a defined safe state on failure.",
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
                             "rationale":  "A control system\u0027s outputs drive physical equipment, so they must stay correct under stress or attack. Deterministic output keeps the system\u0027s behaviour predictable when it fails, so it does not fall into an unsafe or unknown state."
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
                             "rationale":  "Error handling decides whether a fault becomes a foothold for an attacker or a safe stop. Good error handling keeps failures from leaking information or leaving the system in an exploitable state."
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
                             "rationale":  "Once a session is authenticated, its integrity has to hold, or an attacker can hijack it or inject traffic into it. Protecting session integrity stops a trusted session being turned into an attack channel."
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
                             "rationale":  "Audit records are what an attacker most wants to change to cover their tracks. Protecting them means the logs can be relied on as evidence and any tampering with them can be detected."
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
                             "rationale":  "Some control system data, such as credentials, keys, configuration and network details, helps an attacker if it is exposed. Confidentiality is usually a lower priority in OT than integrity, but protecting this data limits an attacker\u0027s reconnaissance and reuse of it."
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
                             "rationale":  "Information stays on media and equipment after its useful life, and anyone who obtains the hardware can recover it. Clearing it stops decommissioned or reused equipment handing over sensitive data."
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
                             "rationale":  "Cryptography supports confidentiality, integrity and authentication only when it is used correctly. Weak or misapplied cryptography gives a false sense of protection, and in OT its use also has to fit the performance limits of the equipment."
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
                             "rationale":  "Network segmentation limits how far a compromise can spread from the routes attackers usually come in by. It is among the most effective OT controls, because on a flat network a single foothold can reach the whole control environment."
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
                             "rationale":  "Zone boundary protection enforces the intended segmentation by controlling what crosses between zones. If the boundaries are not enforced, the segmentation exists on the drawings only."
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
                             "rationale":  "Email, messaging and similar person-to-person services are common malware entry points and have little place inside the control environment. Restricting them removes a frequent route for an attacker\u0027s first access into OT."
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
                             "rationale":  "Partitioning applications stops a weakness in one from undermining others on the same system. A single compromised application then cannot be used to reach everything running alongside it."
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
                             "rationale":  "Audit logs help detection and investigation only if the right people can reach and read them when they are needed."
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
                             "rationale":  "Continuous monitoring makes it possible to notice an attack while it is under way. Many OT incidents go undetected for long periods for lack of monitoring, and the response cannot start until the attack is noticed."
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
                             "rationale":  "Denial-of-service protection keeps the control system available under load or attack. Availability is usually the first priority in OT because the system runs a physical process, and losing availability can mean losing control of that process."
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
                             "rationale":  "Resource management keeps essential functions supplied when another task or an attack is consuming resources. A fault or attack in one area then cannot degrade the functions that matter most."
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
                             "rationale":  "Backups are the basis of recovery from destructive attacks, ransomware and serious errors. In OT they must cover controller logic and configuration as well as data, and recovery depends on a backup routine that is followed."
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
                             "rationale":  "Recovery and reconstitution is the ability to restore the system to a known good state and resume operation. Backups give false assurance unless recovery from them has been proven, and a proven recovery limits how long the function stays down."
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
                                                          "hint":  "Provide emergency or backup power to keep essential functions running or shut them down safely.",
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
                             "rationale":  "Emergency power keeps the control system running through a supply disruption, which for a physical process can be a safety matter. It stops a power event leading to loss of control at the worst moment."
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
                             "rationale":  "Network and security configuration settings define the system\u0027s security posture in practice, and drift or default settings weaken it over time. Managing these settings keeps the hardening in place and up to date, so the system does not run on its factory defaults."
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
                                                          "hint":  "Provide only the required functions and disable unnecessary services and ports.",
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
                             "rationale":  "Least functionality removes the services, ports and features the function does not need, which leaves an attacker fewer ways in. It is one of the few hardening measures that can be applied to legacy OT devices that cannot be patched."
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
                             "rationale":  "Equipment that nobody knows is connected cannot be protected, patched or monitored. A current component inventory supports almost every other control, and it is often the weakest area in OT, where undocumented and legacy equipment builds up."
                         }
                     ],
    "_slGuidanceNote":  "slGuidance gives, per SR and per SL: the factual requirement composition (base / which REs, derived from the standard\u0027s SL-C vectors), a short RE title, and a paraphrased memory-jog hint. Titles and hints are paraphrased, NOT IEC verbatim text. \u0027verbatimText\u0027 is an empty slot for the licence holder to paste official wording into their own copy if desired; the tool shows it when present and falls back to the hint when empty. All seven FRs complete.",
    "_rationaleNote":  "Per-SR \u0027rationale\u0027 is a plain-language \u0027why this matters\u0027 (2-3 sentences, practitioner voice, OT consequence where relevant). Original explanatory text, not reproduced IEC wording. Sits alongside slGuidance, which carries the per-SL detail."
};
