/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/iec-62443-4-2/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["iec-62443-4-2"] = window.App.Data.instruments["iec-62443-4-2"] || {};
window.App.Data.instruments["iec-62443-4-2"].instrument = {
    "id":  "iec-62443-4-2",
    "title":  "ISA/IEC 62443-4-2 Component Security Assessment",
    "edition":  "2019",
    "contentVersion":  "1.0.0",
    "scoringFamily":  "capability-sl",
    "targetDimension":  "component",
    "targetDimensionLabel":  "Component",
    "taxonomyRef":  "fr-7",
    "scoringProfileRef":  "sl-target-closeness",
    "notes":  "Questions are phrased in plain assessor language by the author and are not reproductions of ISA/IEC 62443-4-2 text. achievedSL is captured 0-4 against the chosen target SL.",
    "display":  {
                    "slVector":  {
                                     "title":  "Capability security level (SL-C)",
                                     "label":  "SL-C",
                                     "qualifier":  "component",
                                     "note":  "The capability security level the component can claim for each Foundational Requirement, set by its weakest applicable requirement. A value below the target means the component provides capability against a weaker class of threat than the environment calls for; a 0 means the Foundational Requirement does not reach SL 1. This is a capability claim about the component itself, not a statement about the system it is installed in."
                                 },
                    "requirementTypes":  {
                                             "SAR":  "software application",
                                             "EDR":  "embedded device",
                                             "HDR":  "host device",
                                             "NDR":  "network device"
                                         },
                    "homeSummary":  "Component-by-component capability (SL-C) for a product, device or application against a target security level.",
                    "requirementNoun":  "component requirement",
                    "about":  "This assessment measures the security capability of an individual component (a software application, embedded device, host device or network device) against ISA/IEC 62443-4-2, requirement by requirement, for the target security level set for the engagement. It establishes the capability security level SL-C the component can honestly claim per foundational requirement, and turns the shortfalls into a prioritised remediation roadmap. It is an advisory gap analysis, not a certification."
                },
    "_slGuidanceNote":  "slGuidance is derived from Table B.1 of ANSI/ISA-62443-4-2-2018 Annex B (mapping of CRs and REs to FR SLs 1-4). components lists which parts are required at that SL: \u0027base\u0027 plus any requirement enhancements. Reference only - it does not affect scoring.",
    "_componentTypeNote":  "SAR / EDR / HDR / NDR requirements apply only to a specific component type (software application, embedded device, host device, network device). Each assessment target is one component, so mark the requirements for other component types Not applicable; N/A is excluded from the FR denominator.",
    "_notSelectedNote":  "CR 2.3 and CR 7.5 carry no capability Security Level in Table B.1: they are defined in the standard but not selected at SL 1-4. Their SL grids therefore read \u0027Not required at this Security Level\u0027 throughout, and they are best recorded as good practice or marked Not applicable.",
    "requirements":  [
                         {
                             "id":  "CR1.1",
                             "frId":  "FR1",
                             "code":  "CR 1.1",
                             "title":  "Human user identification and authentication",
                             "question":  "Does the component identify and authenticate every human user before granting access, on all of its interfaces?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Human user identification and authentication",
                                                          "hint":  "Identify and authenticate all human users on every component interface.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL1, plus each human user is uniquely identified (no shared accounts).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Multifactor authentication for all interfaces",
                                                          "hint":  "As SL2, plus multifactor authentication on all interfaces.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Multifactor authentication for all interfaces",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Knowing which person is acting is the basis of accountability on the component itself. Shared operator logins are common on OT products and convenient on a 24/7 plant, which is exactly why establishing individual identity at the component is both valuable and hard."
                         },
                         {
                             "id":  "CR1.2",
                             "frId":  "FR1",
                             "code":  "CR 1.2",
                             "title":  "Software process and device identification and authentication",
                             "question":  "Does the component identify and authenticate software processes and devices before allowing them to connect or act?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Software process and device identification and authentication",
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
                                                          "hint":  "As SL2, plus each process or device uniquely identified.",
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
                             "rationale":  "Software processes and devices act on the control system as much as people do, and an unauthenticated peer is an open door. Authenticating non-human actors stops rogue or spoofed components being trusted simply because they reached the network."
                         },
                         {
                             "id":  "CR1.3",
                             "frId":  "FR1",
                             "code":  "CR 1.3",
                             "title":  "Account management",
                             "question":  "Does the component support managing its accounts through their whole life, including creating, modifying, disabling and removing them?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Account management",
                                                          "hint":  "Support management of all account types over their life cycle.",
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
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Account management",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Account management",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Accounts that are created and never managed accumulate into standing risk: dormant logins, departed staff, shared credentials. If the component cannot support disciplined account management, the asset owner cannot practise it."
                         },
                         {
                             "id":  "CR1.4",
                             "frId":  "FR1",
                             "code":  "CR 1.4",
                             "title":  "Identifier management",
                             "question":  "Does the component support managing identifiers by user, group, role or interface?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "Support management of identifiers by user, group, role or interface.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Identifier management",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Identifiers are the handles everything else hangs off. Without disciplined identifier management, audit trails cannot be tied to a real actor and revocation becomes guesswork."
                         },
                         {
                             "id":  "CR1.5",
                             "frId":  "FR1",
                             "code":  "CR 1.5",
                             "title":  "Authenticator management",
                             "question":  "Does the component let authenticators be managed properly, including changing default credentials and protecting them from disclosure?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator management",
                                                          "hint":  "Support initialising, changing, protecting and revoking authenticators; no unchangeable defaults.",
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
                                                          "hint":  "As SL2, plus authenticators protected by a hardware security mechanism.",
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
                             "rationale":  "Default and unchangeable credentials are among the most exploited weaknesses in OT products. If the component cannot support changing and protecting its authenticators, every deployment inherits the same known secret."
                         },
                         {
                             "id":  "NDR1.6",
                             "frId":  "FR1",
                             "code":  "NDR 1.6",
                             "title":  "Wireless access management (network devices)",
                             "question":  "Where the component is a network device offering wireless access, does it identify and authenticate every wireless user and device?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless access management",
                                                          "hint":  "Identify and authenticate all users and devices engaged in wireless communication.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Unique identification and authentication",
                                                          "hint":  "As SL1, plus each wireless user or device uniquely identified.",
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
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Wireless extends the attack surface past the fence line, where an attacker needs no physical access. Authenticating wireless participants at the device is what keeps that reach from becoming entry."
                         },
                         {
                             "id":  "CR1.7",
                             "frId":  "FR1",
                             "code":  "CR 1.7",
                             "title":  "Strength of password-based authentication",
                             "question":  "Where passwords are used, does the component let password strength be configured and enforced?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Strength of password-based authentication",
                                                          "hint":  "Enforce configurable password strength (character mix and length).",
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
                                                          "reTitle":  "Password generation and lifetime restrictions for human users",
                                                          "hint":  "As SL2, plus generation and lifetime rules for human user passwords.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Password lifetime restrictions for all users",
                                                          "hint":  "As SL3, plus lifetime rules for all users, not only humans.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A password control that cannot be configured forces every site to accept the vendor\u0027s assumptions. Enforceable strength is what turns a password from a formality into a control."
                         },
                         {
                             "id":  "CR1.8",
                             "frId":  "FR1",
                             "code":  "CR 1.8",
                             "title":  "Public key infrastructure certificates",
                             "question":  "Where the component uses PKI, does it operate certificates in line with a recognised certificate management practice?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Public key infrastructure certificates",
                                                          "hint":  "Operate PKI certificates according to a recognised certificate management practice.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Public key infrastructure certificates",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Public key infrastructure certificates",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Certificates are only as trustworthy as the practice behind issuing, validating and revoking them. A component that ignores validity or revocation turns PKI into decoration."
                         },
                         {
                             "id":  "CR1.9",
                             "frId":  "FR1",
                             "code":  "CR 1.9",
                             "title":  "Strength of public key-based authentication",
                             "question":  "Where public key authentication is used, does the component validate certificates properly and protect the associated private keys?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Strength of public key-based authentication",
                                                          "hint":  "Validate certificates and chains, check revocation, and protect private keys.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for public key-based authentication",
                                                          "hint":  "As SL2, plus private keys protected by a hardware security mechanism.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for public key-based authentication",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Public key authentication fails quietly: an unvalidated chain or an exposed private key leaves the mechanism looking healthy while providing no assurance at all."
                         },
                         {
                             "id":  "CR1.10",
                             "frId":  "FR1",
                             "code":  "CR 1.10",
                             "title":  "Authenticator feedback",
                             "question":  "Does the component obscure authenticator feedback during the authentication process?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "Obscure feedback of authentication information during the process.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authenticator feedback",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Echoed credentials and over-helpful failure messages hand attackers free information. Obscured feedback is a small control that closes an easy shoulder-surfing and enumeration route."
                         },
                         {
                             "id":  "CR1.11",
                             "frId":  "FR1",
                             "code":  "CR 1.11",
                             "title":  "Unsuccessful login attempts",
                             "question":  "Does the component enforce a configurable limit on consecutive failed login attempts, and respond safely when it is reached?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "Enforce a configurable limit on consecutive invalid access attempts and deny access when exceeded.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Unsuccessful login attempts",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Unlimited retries make brute force a matter of patience. The OT wrinkle is the response: locking out an operator mid-incident can be worse than the attack, so the behaviour must be configurable."
                         },
                         {
                             "id":  "CR1.12",
                             "frId":  "FR1",
                             "code":  "CR 1.12",
                             "title":  "System use notification",
                             "question":  "Can the component display a configurable use notification before access is granted?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "Display a configurable system use notification before granting access.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "System use notification",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A use notification is what makes unauthorised access provably unauthorised. It is a legal and disciplinary control more than a technical one, and it must be configurable to match local wording."
                         },
                         {
                             "id":  "NDR1.13",
                             "frId":  "FR1",
                             "code":  "NDR 1.13",
                             "title":  "Access via untrusted networks (network devices)",
                             "question":  "Where the component is a network device, does it monitor and control all access arriving from untrusted networks?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Access via untrusted networks",
                                                          "hint":  "Monitor and control all methods of access to the component from untrusted networks.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Access via untrusted networks",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Explicit access request approval",
                                                          "hint":  "As SL2, plus each untrusted-network access explicitly approved before it is granted.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Explicit access request approval",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Untrusted-network access is the route most remote compromises take. Controlling it at the network device is what stops a vendor or corporate path becoming an uncontrolled door into the cell."
                         },
                         {
                             "id":  "CR1.14",
                             "frId":  "FR1",
                             "code":  "CR 1.14",
                             "title":  "Strength of symmetric key-based authentication",
                             "question":  "Where shared secret keys are used, does the component protect them and use them in a recognised way?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Strength of symmetric key-based authentication",
                                                          "hint":  "Use recognised symmetric key authentication and protect the shared secret.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for symmetric key-based authentication",
                                                          "hint":  "As SL2, plus shared secrets protected by a hardware security mechanism.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Hardware security for symmetric key-based authentication",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Shared keys spread quietly: once one is extracted from a device, every device using it is affected. Protection of the key material is the whole control."
                         },
                         {
                             "id":  "CR2.1",
                             "frId":  "FR2",
                             "code":  "CR 2.1",
                             "title":  "Authorization enforcement",
                             "question":  "Does the component enforce authorizations so that each user can only do what their assigned privileges allow?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Authorization enforcement",
                                                          "hint":  "Enforce assigned authorizations for control of use on the component.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Permission mapping to roles",
                                                          "hint":  "As SL1, plus enforcement for all users, including software processes and devices, and permissions mapped to roles rather than individuals.",
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
                                                          "reTitle":  "Supervisor override",
                                                          "hint":  "As SL2, plus a supervisor override path for operational necessity.",
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
                                                          "hint":  "As SL3, plus dual approval for the most consequential actions.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Authentication establishes who is acting; authorization decides what they may do. Without enforcement at the component, every authenticated user is effectively an administrator."
                         },
                         {
                             "id":  "CR2.2",
                             "frId":  "FR2",
                             "code":  "CR 2.2",
                             "title":  "Wireless use control",
                             "question":  "Where the component uses wireless, does it authorize, monitor and enforce restrictions on that use?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless use control",
                                                          "hint":  "Authorize, monitor and enforce usage restrictions for wireless connectivity.",
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
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless use control",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Wireless use control",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Wireless use that is authenticated but not controlled still lets a legitimate device do illegitimate things. Use control is what bounds the session after the handshake."
                         },
                         {
                             "id":  "CR2.3",
                             "frId":  "FR2",
                             "code":  "CR 2.3",
                             "title":  "Use control for portable and mobile devices",
                             "question":  "Does the component support the asset owner\u0027s controls on portable and mobile devices connecting to it?",
                             "applicableSLs":  [

                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Removable media and engineering laptops remain a primary crossing point into isolated OT networks. Note that this requirement is not selected at any capability Security Level in the standard, so treat it as good practice to record rather than a target-driven gap."
                         },
                         {
                             "id":  "SAR2.4",
                             "frId":  "FR2",
                             "code":  "SAR 2.4",
                             "title":  "Mobile code (software applications)",
                             "question":  "Where the component is a software application, does it control which mobile code may run and prevent unauthorised mobile code executing?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "Enforce usage restrictions on mobile code technologies, and prevent execution of unauthorised mobile code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL1, plus authenticity of mobile code verified before it runs.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Mobile code executes with the privileges of whatever loaded it, so uncontrolled mobile code turns a data path into a code path. Controlling it at the component is the only place the decision can be enforced."
                         },
                         {
                             "id":  "EDR2.4",
                             "frId":  "FR2",
                             "code":  "EDR 2.4",
                             "title":  "Mobile code (embedded devices)",
                             "question":  "Where the component is a embedded device, does it control which mobile code may run and prevent unauthorised mobile code executing?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "Enforce usage restrictions on mobile code technologies, and prevent execution of unauthorised mobile code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL1, plus authenticity of mobile code verified before it runs.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Mobile code executes with the privileges of whatever loaded it, so uncontrolled mobile code turns a data path into a code path. Controlling it at the component is the only place the decision can be enforced."
                         },
                         {
                             "id":  "HDR2.4",
                             "frId":  "FR2",
                             "code":  "HDR 2.4",
                             "title":  "Mobile code (host devices)",
                             "question":  "Where the component is a host device, does it control which mobile code may run and prevent unauthorised mobile code executing?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "Enforce usage restrictions on mobile code technologies, and prevent execution of unauthorised mobile code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL1, plus authenticity of mobile code verified before it runs.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Mobile code executes with the privileges of whatever loaded it, so uncontrolled mobile code turns a data path into a code path. Controlling it at the component is the only place the decision can be enforced."
                         },
                         {
                             "id":  "NDR2.4",
                             "frId":  "FR2",
                             "code":  "NDR 2.4",
                             "title":  "Mobile code (network devices)",
                             "question":  "Where the component is a network device, does it control which mobile code may run and prevent unauthorised mobile code executing?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Mobile code",
                                                          "hint":  "Enforce usage restrictions on mobile code technologies, and prevent execution of unauthorised mobile code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL1, plus authenticity of mobile code verified before it runs.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Mobile code authenticity check",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Mobile code executes with the privileges of whatever loaded it, so uncontrolled mobile code turns a data path into a code path. Controlling it at the component is the only place the decision can be enforced."
                         },
                         {
                             "id":  "CR2.5",
                             "frId":  "FR2",
                             "code":  "CR 2.5",
                             "title":  "Session lock",
                             "question":  "Does the component lock a session after a configurable period of inactivity, needing re-authentication to resume?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "Prevent further access after a configurable inactivity period until the user re-authenticates.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session lock",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An unattended logged-in HMI is an open console. The OT balance matters: the lock must never obscure a live process view, which is why the period has to be configurable."
                         },
                         {
                             "id":  "CR2.6",
                             "frId":  "FR2",
                             "code":  "CR 2.6",
                             "title":  "Remote session termination",
                             "question":  "Can a remote session be terminated automatically after inactivity, or manually by the user who started it?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Terminate a remote session automatically after inactivity or manually by the initiating user.",
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
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Remote sessions left open are the ones attackers inherit. Being able to end them, on a timer or on demand, closes the window that remote support inevitably opens."
                         },
                         {
                             "id":  "CR2.7",
                             "frId":  "FR2",
                             "code":  "CR 2.7",
                             "title":  "Concurrent session control",
                             "question":  "Can the number of concurrent sessions per interface be limited to a configurable figure?",
                             "applicableSLs":  [
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Limit the number of concurrent sessions per interface to a configurable number.",
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
                             "rationale":  "Uncapped concurrent sessions let one compromised credential be used many times over, and can exhaust a constrained device outright."
                         },
                         {
                             "id":  "CR2.8",
                             "frId":  "FR2",
                             "code":  "CR 2.8",
                             "title":  "Auditable events",
                             "question":  "Does the component generate audit records for the security-relevant events that matter, including access control and configuration change?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Auditable events",
                                                          "hint":  "Generate audit records for access control, request errors, control system events, backup and restore, configuration change and audit log events.",
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
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Auditable events",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Auditable events",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "You cannot investigate what was never recorded. On OT components the gap is usually not the absence of logging but the absence of the security-relevant events among the process ones."
                         },
                         {
                             "id":  "CR2.9",
                             "frId":  "FR2",
                             "code":  "CR 2.9",
                             "title":  "Audit storage capacity",
                             "question":  "Does the component allocate enough audit storage, and is that capacity understood so records are not lost?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit storage capacity",
                                                          "hint":  "Allocate audit record storage per a documented capacity, and provide the means to review it.",
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
                                                          "reTitle":  "Warn when audit record storage capacity threshold reached",
                                                          "hint":  "As SL2, plus a warning when the storage threshold is reached.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Warn when audit record storage capacity threshold reached",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Undersized audit storage silently discards the evidence exactly when an incident generates the most of it. Capacity is a design decision, not an afterthought."
                         },
                         {
                             "id":  "CR2.10",
                             "frId":  "FR2",
                             "code":  "CR 2.10",
                             "title":  "Response to audit processing failures",
                             "question":  "Does the component handle audit processing failures without losing the essential function?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "Protect against loss of essential services and functions when audit processing fails, and alert on the failure.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Response to audit processing failures",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An audit subsystem that fails hard can take the process with it; one that fails silently loses the record. The component has to do neither."
                         },
                         {
                             "id":  "CR2.11",
                             "frId":  "FR2",
                             "code":  "CR 2.11",
                             "title":  "Timestamps",
                             "question":  "Does the component timestamp audit records reliably enough to reconstruct a sequence of events?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Timestamps",
                                                          "hint":  "Create timestamps for use in audit records.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Time synchronization",
                                                          "hint":  "As SL1, plus time synchronised to a system-wide source.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Time synchronization",
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
                                                          "reTitle":  "Protection of time source integrity",
                                                          "hint":  "As SL3, plus the time source itself protected from tampering.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Correlating an incident across several components depends entirely on comparable time. Unsynchronised clocks turn a timeline into guesswork."
                         },
                         {
                             "id":  "CR2.12",
                             "frId":  "FR2",
                             "code":  "CR 2.12",
                             "title":  "Non-repudiation",
                             "question":  "Can the component produce evidence that ties a specific action to a specific actor, so the action cannot credibly be denied?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Non-repudiation",
                                                          "hint":  "Determine whether a given human user took a given action.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Non-repudiation",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Non-repudiation",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Non-repudiation for all users",
                                                          "hint":  "As SL3, plus the same for all users, not only humans.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Non-repudiation is what makes an audit trail usable in a disciplinary or legal setting rather than merely informative."
                         },
                         {
                             "id":  "EDR2.13",
                             "frId":  "FR2",
                             "code":  "EDR 2.13",
                             "title":  "Use of physical diagnostic and test interfaces (embedded devices)",
                             "question":  "Where the component is an embedded device, are its physical diagnostic and test interfaces protected against misuse?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Use of physical diagnostic and test interfaces",
                                                          "hint":  "Protect against unauthorised use of the physical diagnostic and test interfaces.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL2, plus active monitoring of those interfaces, with notification on use.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Debug headers, JTAG and service ports routinely bypass every logical control on the device. Anyone with brief physical access can use them, which is why they must be protected in their own right."
                         },
                         {
                             "id":  "HDR2.13",
                             "frId":  "FR2",
                             "code":  "HDR 2.13",
                             "title":  "Use of physical diagnostic and test interfaces (host devices)",
                             "question":  "Where the component is an host device, are its physical diagnostic and test interfaces protected against misuse?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Use of physical diagnostic and test interfaces",
                                                          "hint":  "Protect against unauthorised use of the physical diagnostic and test interfaces.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL2, plus active monitoring of those interfaces, with notification on use.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Debug headers, JTAG and service ports routinely bypass every logical control on the device. Anyone with brief physical access can use them, which is why they must be protected in their own right."
                         },
                         {
                             "id":  "NDR2.13",
                             "frId":  "FR2",
                             "code":  "NDR 2.13",
                             "title":  "Use of physical diagnostic and test interfaces (network devices)",
                             "question":  "Where the component is an network device, are its physical diagnostic and test interfaces protected against misuse?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Use of physical diagnostic and test interfaces",
                                                          "hint":  "Protect against unauthorised use of the physical diagnostic and test interfaces.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL2, plus active monitoring of those interfaces, with notification on use.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Active monitoring",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Debug headers, JTAG and service ports routinely bypass every logical control on the device. Anyone with brief physical access can use them, which is why they must be protected in their own right."
                         },
                         {
                             "id":  "CR3.1",
                             "frId":  "FR3",
                             "code":  "CR 3.1",
                             "title":  "Communication integrity",
                             "question":  "Does the component protect the integrity of information it transmits, so tampering in transit is detected?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Communication authentication",
                                                          "hint":  "As SL1, plus the source of the communication authenticated, not just the content protected.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Communication authentication",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Communication authentication",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Legacy control protocols were designed for trusted wire, not hostile networks. Without integrity protection, a manipulated command is indistinguishable from a legitimate one."
                         },
                         {
                             "id":  "SAR3.2",
                             "frId":  "FR3",
                             "code":  "SAR 3.2",
                             "title":  "Protection from malicious code (software applications)",
                             "question":  "Where the component is a software application, does it protect against malicious code being introduced or executed?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "Protect against introduction and execution of malicious code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Application-layer protection is the last line where the code actually runs. On OT software the constraint is that conventional scanning is often unsupported, so the mechanism has to suit the product."
                         },
                         {
                             "id":  "EDR3.2",
                             "frId":  "FR3",
                             "code":  "EDR 3.2",
                             "title":  "Protection from malicious code (embedded devices)",
                             "question":  "Where the component is an embedded device, does it protect against malicious code being introduced or executed?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "Protect against introduction and execution of malicious code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Embedded devices rarely run conventional anti-malware, so protection has to come from design: signed firmware, restricted execution and a closed software load."
                         },
                         {
                             "id":  "HDR3.2",
                             "frId":  "FR3",
                             "code":  "HDR 3.2",
                             "title":  "Protection from malicious code (host devices)",
                             "question":  "Where the component is a host device, does it protect against malicious code, and can the protection be verified?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "Protect against introduction and execution of malicious code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Report version of code protection",
                                                          "hint":  "As SL1, plus the version of the protection reported so currency can be checked.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Report version of code protection",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Report version of code protection",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Host devices are where conventional malware actually lands in OT. Knowing the protection is present and current matters as much as having it."
                         },
                         {
                             "id":  "NDR3.2",
                             "frId":  "FR3",
                             "code":  "NDR 3.2",
                             "title":  "Protection from malicious code (network devices)",
                             "question":  "Where the component is a network device, does it protect against malicious code being introduced or executed?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "Protect against introduction and execution of malicious code.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Protection from malicious code",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A compromised network device sees and can alter everything crossing it, which makes it a high-value target and a poor place to discover you had no protection."
                         },
                         {
                             "id":  "CR3.3",
                             "frId":  "FR3",
                             "code":  "CR 3.3",
                             "title":  "Security functionality verification",
                             "question":  "Can the component\u0027s security functions be verified as working, and is that verification practical to run?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Security functionality verification",
                                                          "hint":  "Support verification of the intended operation of security functions.",
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
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Security functionality verification",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Security functionality verification during normal operation",
                                                          "hint":  "As SL3, plus verification possible during normal operation, not only in a maintenance window.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Security controls fail silently. Without a way to prove they still work, an assessment records what was configured years ago rather than what is actually operating."
                         },
                         {
                             "id":  "CR3.4",
                             "frId":  "FR3",
                             "code":  "CR 3.4",
                             "title":  "Software and information integrity",
                             "question":  "Does the component detect unauthorised changes to its software and configuration information?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Software and information integrity",
                                                          "hint":  "Detect, record and report unauthorised changes to software and information at rest.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of software and information",
                                                          "hint":  "As SL1, plus authenticity verified, not merely integrity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Automated notification of integrity violations",
                                                          "hint":  "As SL2, plus automatic notification when a violation is found.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Automated notification of integrity violations",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Unauthorised change is how most compromises persist. Detecting it at the component is what separates a controlled estate from one that merely looks unchanged."
                         },
                         {
                             "id":  "CR3.5",
                             "frId":  "FR3",
                             "code":  "CR 3.5",
                             "title":  "Input validation",
                             "question":  "Does the component validate the syntax and content of inputs that affect control?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "Validate the syntax and content of any input used as an industrial process control input.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Input validation",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Malformed input has crashed more controllers than targeted exploits have. Validation is the difference between a rejected packet and an unplanned shutdown."
                         },
                         {
                             "id":  "CR3.6",
                             "frId":  "FR3",
                             "code":  "CR 3.6",
                             "title":  "Deterministic output",
                             "question":  "Does the component set its outputs to a predetermined safe state if normal operation cannot be maintained?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "Set outputs to a predetermined state if normal operation cannot be maintained.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Deterministic output",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "When a component loses its footing, what its outputs do next is a safety question. A defined fallback state is what keeps a security event from becoming a process event."
                         },
                         {
                             "id":  "CR3.7",
                             "frId":  "FR3",
                             "code":  "CR 3.7",
                             "title":  "Error handling",
                             "question":  "Does the component handle error conditions without leaking information that would help an attacker?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Error handling",
                                                          "hint":  "Identify and handle error conditions without providing information that could be exploited.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Error handling",
                                                          "hint":  "As SL1 (no further enhancement).",
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
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Verbose errors are free reconnaissance. Handling them properly also stops an error path becoming an availability problem in its own right."
                         },
                         {
                             "id":  "CR3.8",
                             "frId":  "FR3",
                             "code":  "CR 3.8",
                             "title":  "Session integrity",
                             "question":  "Does the component protect the integrity of its sessions, including rejecting invalid session identifiers?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Protect the integrity of sessions and reject invalid session identifiers.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session integrity",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Session integrity",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Session hijacking bypasses authentication entirely by taking over a connection that already passed it."
                         },
                         {
                             "id":  "CR3.9",
                             "frId":  "FR3",
                             "code":  "CR 3.9",
                             "title":  "Protection of audit information",
                             "question":  "Does the component protect its audit records and tools from unauthorised access, modification and deletion?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Protect audit information and tools from unauthorised access, modification and deletion.",
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
                                                          "reTitle":  "Audit records on write-once media",
                                                          "hint":  "As SL3, plus audit records written to write-once media.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Clearing the log is the standard closing move of an intrusion. Audit information that the attacker can edit is not evidence."
                         },
                         {
                             "id":  "EDR3.10",
                             "frId":  "FR3",
                             "code":  "EDR 3.10",
                             "title":  "Support for updates (embedded devices)",
                             "question":  "Where the component is an embedded device, can it be updated in a way that is both secure and practical in an operating plant?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Support for updates",
                                                          "hint":  "Support the ability to update the component.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL1, plus authenticity and integrity of the update validated before it is applied.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An unpatchable component is a permanent, compounding liability. In OT the practical half matters as much as the secure half: an update that demands a shutdown will not be applied."
                         },
                         {
                             "id":  "EDR3.11",
                             "frId":  "FR3",
                             "code":  "EDR 3.11",
                             "title":  "Physical tamper resistance and detection (embedded devices)",
                             "question":  "Where the component is an embedded device, does it resist physical tampering and detect when tampering occurs?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Physical tamper resistance and detection",
                                                          "hint":  "Resist physical tampering and provide the means to detect it.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL2, plus active notification when a tampering attempt is detected.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Field devices sit in cabinets and remote kiosks where physical access is realistic. Tamper evidence is often the only signal that anyone was ever there."
                         },
                         {
                             "id":  "EDR3.12",
                             "frId":  "FR3",
                             "code":  "EDR 3.12",
                             "title":  "Provisioning product supplier roots of trust (embedded devices)",
                             "question":  "Where the component is an embedded device, can the product supplier\u0027s roots of trust be provisioned and protected?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "Support provisioning and protection of the product supplier\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Every signature check the device makes ultimately rests on its roots of trust. If those can be replaced or forged, secure boot and signed updates become theatre."
                         },
                         {
                             "id":  "EDR3.13",
                             "frId":  "FR3",
                             "code":  "EDR 3.13",
                             "title":  "Provisioning asset owner roots of trust (embedded devices)",
                             "question":  "Where the component is an embedded device, can the asset owner provision and protect their own roots of trust?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "Support provisioning and protection of the asset owner\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Asset-owner roots of trust are what let the operator, not only the vendor, decide what the device will trust. Without them the operator is locked into the supplier\u0027s judgement forever."
                         },
                         {
                             "id":  "EDR3.14",
                             "frId":  "FR3",
                             "code":  "EDR 3.14",
                             "title":  "Integrity of the boot process (embedded devices)",
                             "question":  "Where the component is an embedded device, does it verify the integrity of its firmware and software during boot?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Integrity of the boot process",
                                                          "hint":  "Verify the integrity of firmware, software and configuration during the boot process.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL1, plus authenticity verified during boot, not only integrity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Code that subverts the boot process runs beneath everything else and survives a restart. Verified boot is the foundation the rest of the device\u0027s security stands on."
                         },
                         {
                             "id":  "HDR3.10",
                             "frId":  "FR3",
                             "code":  "HDR 3.10",
                             "title":  "Support for updates (host devices)",
                             "question":  "Where the component is a host device, can it be updated in a way that is both secure and practical in an operating plant?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Support for updates",
                                                          "hint":  "Support the ability to update the component.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL1, plus authenticity and integrity of the update validated before it is applied.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An unpatchable component is a permanent, compounding liability. In OT the practical half matters as much as the secure half: an update that demands a shutdown will not be applied."
                         },
                         {
                             "id":  "HDR3.11",
                             "frId":  "FR3",
                             "code":  "HDR 3.11",
                             "title":  "Physical tamper resistance and detection (host devices)",
                             "question":  "Where the component is a host device, does it resist physical tampering and detect when tampering occurs?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Physical tamper resistance and detection",
                                                          "hint":  "Resist physical tampering and provide the means to detect it.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL2, plus active notification when a tampering attempt is detected.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Field devices sit in cabinets and remote kiosks where physical access is realistic. Tamper evidence is often the only signal that anyone was ever there."
                         },
                         {
                             "id":  "HDR3.12",
                             "frId":  "FR3",
                             "code":  "HDR 3.12",
                             "title":  "Provisioning product supplier roots of trust (host devices)",
                             "question":  "Where the component is a host device, can the product supplier\u0027s roots of trust be provisioned and protected?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "Support provisioning and protection of the product supplier\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Every signature check the device makes ultimately rests on its roots of trust. If those can be replaced or forged, secure boot and signed updates become theatre."
                         },
                         {
                             "id":  "HDR3.13",
                             "frId":  "FR3",
                             "code":  "HDR 3.13",
                             "title":  "Provisioning asset owner roots of trust (host devices)",
                             "question":  "Where the component is a host device, can the asset owner provision and protect their own roots of trust?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "Support provisioning and protection of the asset owner\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Asset-owner roots of trust are what let the operator, not only the vendor, decide what the device will trust. Without them the operator is locked into the supplier\u0027s judgement forever."
                         },
                         {
                             "id":  "HDR3.14",
                             "frId":  "FR3",
                             "code":  "HDR 3.14",
                             "title":  "Integrity of the boot process (host devices)",
                             "question":  "Where the component is a host device, does it verify the integrity of its firmware and software during boot?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Integrity of the boot process",
                                                          "hint":  "Verify the integrity of firmware, software and configuration during the boot process.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL1, plus authenticity verified during boot, not only integrity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Code that subverts the boot process runs beneath everything else and survives a restart. Verified boot is the foundation the rest of the device\u0027s security stands on."
                         },
                         {
                             "id":  "NDR3.10",
                             "frId":  "FR3",
                             "code":  "NDR 3.10",
                             "title":  "Support for updates (network devices)",
                             "question":  "Where the component is a network device, can it be updated in a way that is both secure and practical in an operating plant?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Support for updates",
                                                          "hint":  "Support the ability to update the component.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL1, plus authenticity and integrity of the update validated before it is applied.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Update authenticity and integrity",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "An unpatchable component is a permanent, compounding liability. In OT the practical half matters as much as the secure half: an update that demands a shutdown will not be applied."
                         },
                         {
                             "id":  "NDR3.11",
                             "frId":  "FR3",
                             "code":  "NDR 3.11",
                             "title":  "Physical tamper resistance and detection (network devices)",
                             "question":  "Where the component is a network device, does it resist physical tampering and detect when tampering occurs?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Physical tamper resistance and detection",
                                                          "hint":  "Resist physical tampering and provide the means to detect it.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL2, plus active notification when a tampering attempt is detected.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Notification of a tampering attempt",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Field devices sit in cabinets and remote kiosks where physical access is realistic. Tamper evidence is often the only signal that anyone was ever there."
                         },
                         {
                             "id":  "NDR3.12",
                             "frId":  "FR3",
                             "code":  "NDR 3.12",
                             "title":  "Provisioning product supplier roots of trust (network devices)",
                             "question":  "Where the component is a network device, can the product supplier\u0027s roots of trust be provisioned and protected?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "Support provisioning and protection of the product supplier\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning product supplier roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Every signature check the device makes ultimately rests on its roots of trust. If those can be replaced or forged, secure boot and signed updates become theatre."
                         },
                         {
                             "id":  "NDR3.13",
                             "frId":  "FR3",
                             "code":  "NDR 3.13",
                             "title":  "Provisioning asset owner roots of trust (network devices)",
                             "question":  "Where the component is a network device, can the asset owner provision and protect their own roots of trust?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "Support provisioning and protection of the asset owner\u0027s roots of trust.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Provisioning asset owner roots of trust",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Asset-owner roots of trust are what let the operator, not only the vendor, decide what the device will trust. Without them the operator is locked into the supplier\u0027s judgement forever."
                         },
                         {
                             "id":  "NDR3.14",
                             "frId":  "FR3",
                             "code":  "NDR 3.14",
                             "title":  "Integrity of the boot process (network devices)",
                             "question":  "Where the component is a network device, does it verify the integrity of its firmware and software during boot?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Integrity of the boot process",
                                                          "hint":  "Verify the integrity of firmware, software and configuration during the boot process.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL1, plus authenticity verified during boot, not only integrity.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Authenticity of the boot process",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Code that subverts the boot process runs beneath everything else and survives a restart. Verified boot is the foundation the rest of the device\u0027s security stands on."
                         },
                         {
                             "id":  "CR4.1",
                             "frId":  "FR4",
                             "code":  "CR 4.1",
                             "title":  "Information confidentiality",
                             "question":  "Does the component protect the confidentiality of information at rest and in transit where that is required?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information confidentiality",
                                                          "hint":  "Protect the confidentiality of information at rest and in transit for which explicit read authorization is supported.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information confidentiality",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information confidentiality",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Information confidentiality",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Configuration files, logic and credentials extracted from a component hand an attacker the map. Confidentiality matters less than integrity in OT, but it is where reconnaissance starts."
                         },
                         {
                             "id":  "CR4.2",
                             "frId":  "FR4",
                             "code":  "CR 4.2",
                             "title":  "Information persistence",
                             "question":  "Can information be erased from the component so it does not persist beyond its intended life?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Provide the capability to erase information from the component.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Erase verification",
                                                          "hint":  "As SL2, plus shared memory resources erased so information cannot be recovered, and the erasure verified rather than assumed.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1",
                                                                             "RE2"
                                                                         ],
                                                          "reTitle":  "Erase verification",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Decommissioned and returned equipment routinely leaves the site carrying credentials, addresses and logic. Erasure is the control that stops the estate leaking through its spares."
                         },
                         {
                             "id":  "CR4.3",
                             "frId":  "FR4",
                             "code":  "CR 4.3",
                             "title":  "Use of cryptography",
                             "question":  "Where cryptography is used, does the component follow recognised practice for algorithms and key management?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "Use cryptographic algorithms, key sizes and key management per recognised security practice.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Use of cryptography",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Home-grown or obsolete cryptography provides the appearance of protection without the substance, and is often harder to retire than having none at all."
                         },
                         {
                             "id":  "CR5.1",
                             "frId":  "FR5",
                             "code":  "CR 5.1",
                             "title":  "Network segmentation",
                             "question":  "Does the component support the asset owner\u0027s network segmentation, rather than requiring flat connectivity?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network segmentation",
                                                          "hint":  "Support a segmented network to support zones and conduits.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network segmentation",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network segmentation",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network segmentation",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A component that demands broad reachability quietly defeats the zone and conduit model the rest of the site is built on."
                         },
                         {
                             "id":  "NDR5.2",
                             "frId":  "FR5",
                             "code":  "NDR 5.2",
                             "title":  "Zone boundary protection (network devices)",
                             "question":  "Where the component is a network device, does it monitor and control communications at zone boundaries?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Zone boundary protection",
                                                          "hint":  "Monitor and control communications at zone boundaries to enforce the compartmentalisation defined in the risk-based model.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Deny all, permit by exception",
                                                          "hint":  "As SL1, plus a default-deny posture with traffic permitted by exception.",
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
                                                          "reTitle":  "Fail close",
                                                          "hint":  "As SL2, plus the ability to island the zone by cutting external connectivity, and a fail-close behaviour so a device failure does not open the boundary.",
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
                                                          "reTitle":  "Fail close",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "The zone boundary is where the architecture becomes real. What the boundary device permits is the actual security policy, whatever the drawings say."
                         },
                         {
                             "id":  "NDR5.3",
                             "frId":  "FR5",
                             "code":  "NDR 5.3",
                             "title":  "General purpose, person-to-person communication restrictions (network devices)",
                             "question":  "Where the component is a network device, can general purpose person-to-person messaging be prevented from reaching the control network?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose, person-to-person communication restrictions",
                                                          "hint":  "Prevent general purpose person-to-person messages from being received from or sent to systems outside the control system.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose, person-to-person communication restrictions",
                                                          "hint":  "As SL1 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose, person-to-person communication restrictions",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "General purpose, person-to-person communication restrictions",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Email and messaging are the most common delivery route for malware, and they have no business terminating inside a control zone."
                         },
                         {
                             "id":  "CR6.1",
                             "frId":  "FR6",
                             "code":  "CR 6.1",
                             "title":  "Audit log accessibility",
                             "question":  "Are the component\u0027s audit logs readable by authorised people and tools, without disturbing the process?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Audit log accessibility",
                                                          "hint":  "Provide the capability for authorised humans and tools to access audit logs on a read-only basis.",
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
                                                          "hint":  "As SL2, plus programmatic access so logs can be collected centrally.",
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
                             "rationale":  "Logs that exist but cannot be read, or can only be read by stopping the plant, contribute nothing during an incident."
                         },
                         {
                             "id":  "CR6.2",
                             "frId":  "FR6",
                             "code":  "CR 6.2",
                             "title":  "Continuous monitoring",
                             "question":  "Does the component support continuous monitoring, so security events can be detected as they happen?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Support continuous monitoring of security events using commonly accepted mechanisms.",
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
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Detection is where most OT programmes are weakest. A component that cannot be monitored forces the whole zone back to periodic inspection."
                         },
                         {
                             "id":  "CR7.1",
                             "frId":  "FR7",
                             "code":  "CR 7.1",
                             "title":  "Denial of service protection",
                             "question":  "Does the component keep operating in a degraded but safe mode under a denial of service condition?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Denial of service protection",
                                                          "hint":  "Operate in a degraded mode during a denial of service event.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Manage communication load from component",
                                                          "hint":  "As SL1, plus the component\u0027s own outbound communication load managed so it cannot contribute to the condition.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Manage communication load from component",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Manage communication load from component",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Availability is the priority in OT. Many control devices fall over under traffic volumes an IT device would shrug off, including unintentional ones such as a scan."
                         },
                         {
                             "id":  "CR7.2",
                             "frId":  "FR7",
                             "code":  "CR 7.2",
                             "title":  "Resource management",
                             "question":  "Does the component prevent resource exhaustion from compromising its essential functions?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "Limit the use of resources by security functions to prevent resource exhaustion.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Resource management",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Essential functions must survive whatever else the component is doing. Resource management is what stops a non-critical task starving a critical one."
                         },
                         {
                             "id":  "CR7.3",
                             "frId":  "FR7",
                             "code":  "CR 7.3",
                             "title":  "Control system backup",
                             "question":  "Can the component be backed up without disrupting operation, and does the backup capture what recovery needs?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system backup",
                                                          "hint":  "Support backup of user- and system-level information without affecting normal operations.",
                                                          "verbatimText":  ""
                                                      },
                                                "2":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Backup integrity verification",
                                                          "hint":  "As SL1, plus the integrity of backups verified.",
                                                          "verbatimText":  ""
                                                      },
                                                "3":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Backup integrity verification",
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Backup integrity verification",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Backups are the recovery plan. Untested or partial backups give false assurance until the day they are needed."
                         },
                         {
                             "id":  "CR7.4",
                             "frId":  "FR7",
                             "code":  "CR 7.4",
                             "title":  "Control system recovery and reconstitution",
                             "question":  "Can the component be recovered to a known secure state after a disruption or compromise?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "Support recovery and reconstitution to a known secure state after a disruption or failure.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Control system recovery and reconstitution",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Recovery that depends on individual knowledge or vendor availability extends downtime exactly when the plant can least afford it."
                         },
                         {
                             "id":  "CR7.5",
                             "frId":  "FR7",
                             "code":  "CR 7.5",
                             "title":  "Emergency power",
                             "question":  "Does the component support switching to and from an emergency power supply without affecting its security posture?",
                             "applicableSLs":  [

                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  false,
                                                          "components":  [

                                                                         ],
                                                          "reTitle":  null,
                                                          "hint":  "Not required at this Security Level.",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Losing security state on a power transfer would hand an attacker a predictable window. Note that this requirement is not selected at any capability Security Level in the standard, so treat it as good practice to record rather than a target-driven gap."
                         },
                         {
                             "id":  "CR7.6",
                             "frId":  "FR7",
                             "code":  "CR 7.6",
                             "title":  "Network and security configuration settings",
                             "question":  "Can the component be configured to the recommended settings, and can its current settings be reviewed?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Network and security configuration settings",
                                                          "hint":  "Support configuration per recommended settings, and report the current settings.",
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
                                                          "reTitle":  "Machine-readable reporting of current security settings",
                                                          "hint":  "As SL2, plus settings reported in a machine-readable form so they can be checked at scale.",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base",
                                                                             "RE1"
                                                                         ],
                                                          "reTitle":  "Machine-readable reporting of current security settings",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "A component whose security settings cannot be inspected cannot be assured. This is also where secure-by-default is either delivered or quietly left to the customer."
                         },
                         {
                             "id":  "CR7.7",
                             "frId":  "FR7",
                             "code":  "CR 7.7",
                             "title":  "Least functionality",
                             "question":  "Can unnecessary functions, ports, protocols and services be restricted or disabled on the component?",
                             "applicableSLs":  [
                                                   1,
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
                             "allowNA":  true,
                             "slGuidance":  {
                                                "1":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "Restrict the use of unnecessary functions, ports, protocols and services.",
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
                                                          "hint":  "As SL2 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      },
                                                "4":  {
                                                          "required":  true,
                                                          "components":  [
                                                                             "base"
                                                                         ],
                                                          "reTitle":  "Least functionality",
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "Everything enabled and unused is attack surface maintained for free. Least functionality is the cheapest hardening available and the most often skipped."
                         },
                         {
                             "id":  "CR7.8",
                             "frId":  "FR7",
                             "code":  "CR 7.8",
                             "title":  "Control system component inventory",
                             "question":  "Does the component report the inventory information needed to keep an accurate asset register?",
                             "applicableSLs":  [
                                                   2,
                                                   3,
                                                   4
                                               ],
                             "evidencePrompt":  "Record how this is implemented in the component, the evidence reviewed, and any exceptions or compensating controls.",
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
                                                          "hint":  "Support reporting of the current list of installed components and their properties.",
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
                                                          "hint":  "As SL3 (no further enhancement).",
                                                          "verbatimText":  ""
                                                      }
                                            },
                             "rationale":  "You cannot patch, monitor or risk-assess what you cannot enumerate. Components that report themselves make the asset register maintainable rather than aspirational."
                         }
                     ]
};
