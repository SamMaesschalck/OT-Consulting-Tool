/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nist-800-82/profiles/ics-full.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nist-800-82"] = window.App.Data.instruments["nist-800-82"] || {};
window.App.Data.instruments["nist-800-82"].profiles = window.App.Data.instruments["nist-800-82"].profiles || {};
window.App.Data.instruments["nist-800-82"].profiles["ics-full"] = {
    "id":  "ics-full",
    "name":  "Full overlay (no target baseline)",
    "appliesToInstrument":  "nist-800-82",
    "profileVersion":  "NIST SP 800-82 Rev 3 OT Overlay",
    "verifiedSource":  true,
    "_note":  "Every overlay base control in scope, no target state. INTENTIONAL: applicable=true with expectedState=null means \u0027assess this control but hold no target\u0027 - the scorer treats a null expected as no meeting/below comparison (meetsExpected=null, hasExpected=false) while still counting the control\u0027s Satisfied/Other Than Satisfied state and listing Other Than Satisfied controls on the roadmap. The applicable\u003c-\u003eexpectedState pairing that the OT Low/Moderate/High baselines hold does not apply here by design.",
    "overlay":  {
                    "AC-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AC-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-14":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-18":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-19":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-20":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-21":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AC-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AT-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AT-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AT-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AT-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "AU-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AU-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "AU-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "CA-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CA-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CM-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "CM-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "CM-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "CP-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "CP-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "CP-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "IA-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IA-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "IA-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "IR-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "IR-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MA-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "MP-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PE-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-13":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-14":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-15":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-16":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-18":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-21":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PE-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PL-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PL-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PL-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PM-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-13":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-14":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-15":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-16":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-18":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-19":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-20":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-21":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-23":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-24":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-25":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-26":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-27":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-28":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-29":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-30":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-31":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PM-32":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "PS-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "PS-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "RA-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SA-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-15":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-16":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-21":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SA-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SC-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-13":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-15":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-18":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-20":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-21":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-23":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-24":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-28":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-39":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-41":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-45":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-47":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SC-51":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-4":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-7":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SI-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-13":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-16":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-17":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SI-22":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SR-1":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-2":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-3":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-5":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-6":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-8":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-9":  {
                                 "expectedState":  null,
                                 "applicable":  true,
                                 "weight":  null,
                                 "supplementaryGuidance":  "",
                                 "overlaySource":  null
                             },
                    "SR-10":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SR-11":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              },
                    "SR-12":  {
                                  "expectedState":  null,
                                  "applicable":  true,
                                  "weight":  null,
                                  "supplementaryGuidance":  "",
                                  "overlaySource":  null
                              }
                }
};
