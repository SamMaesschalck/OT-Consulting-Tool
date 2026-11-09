/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments-index.json - do not edit; edit the JSON sources then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.index = {
    "schema":  "instrument-index/1.0",
    "_note":  "App reads this first to discover instruments. \u0027active\u0027 instruments load their files; \u0027placeholder\u0027 instruments render a coming-soon panel. Shared taxonomy and scoring profiles are loaded once and referenced by instruments via taxonomyRef / scoringProfileRef. Do not duplicate shared data into instrument folders.",
    "shared":  {
                   "taxonomies":  [
                                      "shared/taxonomy-fr7.json"
                                  ],
                   "scoringProfiles":  [
                                           "shared/scoring-profiles.json"
                                       ],
                   "crossReferences":  [
                                           "shared/cross-references.json"
                                       ],
                   "riskContextInterchange":  [
                                                  "shared/risk-context-interchange.json"
                                              ],
    "reviewContracts": { "reviewPack": "shared/review-pack.json", "reviewFile": "shared/review-file.json" },
                   "engagementGuidance":  [
                                              "shared/engagement-guidance.json"
                                          ],
                   "productClassifications":  [
                                                  "shared/cra-product-classification.json",
                                                  "shared/machinery-classification.json"
                                              ],
                   "sectorBaselines":  [
                                           "shared/risk-appetite-sector-baselines.json"
                                       ]
               },
    "instruments":  [
                        {
                            "id":  "iec-62443-3-3",
                            "title":  "ISA/IEC 62443-3-3 System Security Assessment",
                            "status":  "active",
                            "scoringFamily":  "capability-sl",
                            "targetDimension":  "site",
                            "path":  "instruments/iec-62443-3-3",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      },
                            "family":  "iec-62443"
                        },
                        {
                            "id":  "iec-62443-4-2",
                            "title":  "ISA/IEC 62443-4-2 Component Security Assessment",
                            "status":  "active",
                            "family":  "iec-62443",
                            "edition":  "2019",
                            "scoringFamily":  "capability-sl",
                            "scoringProfileRef":  "sl-target-closeness",
                            "targetDimension":  "component",
                            "path":  "instruments/iec-62443-4-2",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "iec-62443-4-1",
                            "title":  "ISA/IEC 62443-4-1 Secure Product Development Lifecycle Assessment",
                            "status":  "active",
                            "family":  "iec-62443",
                            "edition":  "2018",
                            "scoringFamily":  "program-maturity-ml",
                            "scoringProfileRef":  "program-maturity-ml",
                            "targetDimension":  "supplier",
                            "path":  "instruments/iec-62443-4-1",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "iec-62443-2-1-2010",
                            "title":  "ISA/IEC 62443-2-1:2010 CSMS Assessment",
                            "status":  "active",
                            "family":  "iec-62443",
                            "edition":  "2010",
                            "scoringFamily":  "csms-conformance",
                            "scoringProfileRef":  "csms-conformance",
                            "targetDimension":  "site",
                            "path":  "instruments/iec-62443-2-1-2010",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "iec-62443-2-1-2024",
                            "title":  "ISA/IEC 62443-2-1:2024 Security Program Assessment",
                            "status":  "active",
                            "family":  "iec-62443",
                            "edition":  "2024",
                            "scoringFamily":  "program-maturity-ml",
                            "scoringProfileRef":  "program-maturity-ml",
                            "targetDimension":  "site",
                            "path":  "instruments/iec-62443-2-1-2024",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "ncsc-caf",
                            "title":  "NCSC CAF Assessment",
                            "status":  "active",
                            "family":  "frameworks",
                            "scoringFamily":  "caf-achieved",
                            "targetDimension":  "site",
                            "path":  "instruments/ncsc-caf",
                            "scoringProfileRef":  "caf-achieved",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      },
                            "edition":  "4.0"
                        },
                        {
                            "id":  "general-ot-posture",
                            "title":  "General OT Security Posture",
                            "status":  "active",
                            "family":  "screening",
                            "scoringFamily":  "domain-letter",
                            "targetDimension":  "site",
                            "path":  "instruments/general-ot-posture",
                            "scoringProfileRef":  "posture-domain-letter",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "nis2-assessment",
                            "title":  "EU NIS2 Directive Assessment",
                            "status":  "active",
                            "family":  "regulation",
                            "scoringFamily":  "nis2-conformance",
                            "scoringProfileRef":  "nis2-conformance",
                            "targetDimension":  "organisation",
                            "path":  "instruments/nis2-assessment",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      },
                            "edition":  "2022/2555"
                        },
                        {
                            "id":  "nis2-quick-gap",
                            "title":  "EU NIS2 Quick Gap Assessment",
                            "status":  "active",
                            "family":  "regulation",
                            "scoringFamily":  "nis2-conformance",
                            "scoringProfileRef":  "nis2-conformance",
                            "targetDimension":  "organisation",
                            "path":  "instruments/nis2-quick-gap",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      },
                            "edition":  "2022/2555"
                        },
                        {
                            "id":  "ncsc-caf-aviation",
                            "title":  "CAF for Aviation (CAP1850) Assessment",
                            "status":  "active",
                            "family":  "sector",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "site",
                            "path":  "instruments/ncsc-caf-aviation",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "caa-tier3-assessment",
                            "title":  "CAA Tier 3 Cyber Assessment Tool",
                            "status":  "placeholder",
                            "family":  "sector",
                            "scoringFamily":  null,
                            "targetDimension":  "aviation-organisation",
                            "path":  "instruments/caa-tier3-assessment",
                            "comingSoon":  "Controls-based (not outcome-based) tool for smaller Tier 3 aviation organisations (CAP1753 Section C). Separate CAA/NCSC artefact; needs its own source document."
                        },
                        {
                            "id":  "nist-800-53",
                            "title":  "NIST SP 800-53 Rev 5 Control Assessment",
                            "status":  "active",
                            "family":  "frameworks",
                            "edition":  "Revision 5 (Release 5.2.0)",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "site",
                            "path":  "instruments/nist-800-53",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "nist-800-82",
                            "title":  "NIST SP 800-82 Rev 3 OT Overlay Assessment",
                            "status":  "active",
                            "family":  "frameworks",
                            "edition":  "Revision 3",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "site",
                            "path":  "instruments/nist-800-82",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "cis-controls-v8",
                            "title":  "CIS Critical Security Controls v8.1.2 Assessment",
                            "status":  "active",
                            "family":  "frameworks",
                            "edition":  "Version 8.1.2",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "site",
                            "path":  "instruments/cis-controls-v8",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "supplier-screener",
                            "title":  "Supplier Cyber Exposure Screener",
                            "status":  "active",
                            "family":  "screening",
                            "scoringFamily":  "domain-letter",
                            "targetDimension":  "supplier",
                            "indicative":  true,
                            "path":  "instruments/supplier-screener",
                            "scoringProfileRef":  "posture-domain-letter",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "eu-cra",
                            "title":  "EU Cyber Resilience Act (CRA) Gap Assessment",
                            "status":  "active",
                            "family":  "regulation",
                            "scoringFamily":  "csms-conformance",
                            "targetDimension":  "product-manufacturer",
                            "indicative":  true,
                            "path":  "instruments/eu-cra",
                            "files":  {
                                          "instrument":  "instrument.json"
                                      },
                            "comingSoon":  "Three-layer CRA gap assessment (Annex I Part I product, Part II vulnerability handling, conformity \u0026 obligations). Selectable layers; product-class-driven conformity route. The deep assessment the supplier screener routes into."
                        },
                        {
                            "id":  "eu-machinery",
                            "title":  "EU Machinery Regulation Gap Assessment",
                            "status":  "active",
                            "family":  "regulation",
                            "scoringFamily":  "csms-conformance",
                            "targetDimension":  "product-manufacturer",
                            "indicative":  true,
                            "path":  "instruments/eu-machinery",
                            "files":  {
                                          "instrument":  "instrument.json"
                                      },
                            "comingSoon":  "Three-layer Machinery Regulation (2023/1230) gap assessment: essential requirements with depth on the new digital/control-system content (per machine), manufacturer process obligations (organisation), conformity \u0026 market placement (Annex I class drives the route). Applies from 14 January 2027."
                        },
                        {
                            "id":  "onr-syaps-management",
                            "title":  "ONR SyAPs Security Management Gap Assessment",
                            "status":  "active",
                            "family":  "sector",
                            "edition":  "2022 Edition, Version 1",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "organisation",
                            "path":  "instruments/onr-syaps-management",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "onr-syaps-cyber",
                            "title":  "ONR SyAPs Cyber Security \u0026 Information Assurance Gap Assessment",
                            "status":  "active",
                            "family":  "sector",
                            "edition":  "2022 Edition, Version 1",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "organisation",
                            "path":  "instruments/onr-syaps-cyber",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                            "id":  "onr-syaps-full",
                            "title":  "ONR SyAPs Nuclear Security Posture Assessment (all 10 FSyP)",
                            "status":  "active",
                            "family":  "sector",
                            "edition":  "2022 Edition, Version 1",
                            "scoringFamily":  "caf-achieved",
                            "scoringProfileRef":  "caf-achieved",
                            "targetDimension":  "organisation",
                            "path":  "instruments/onr-syaps-full",
                            "files":  {
                                          "instrument":  "instrument.json",
                                          "narrative":  "narrative.json"
                                      }
                        },
                        {
                        "id": "risk-appetite",
                        "title": "OT Risk Appetite & Exposure Assessment",
                        "status": "active-skeleton",
                        "_status_note": "Draft content on working code: active-skeleton loads the instrument for real while keeping the draft flag, so the bands and sector baselines can be exercised and tuned in the tool rather than on paper. instrument.json keeps status 'draft'.",
                        "family": "screening",
                        "scoringFamily": "risk-appetite-coherence",
                        "scoringProfileRef": "risk-appetite-coherence",
                        "targetDimension": "organisation",
                        "indicative": true,
                        "path": "instruments/risk-appetite",
                        "files": {
                        "instrument": "instrument.json",
                        "narrative": "narrative.json"
                        }
                        }
                    ],
    "_displayHint":  "Group instruments by \u0027family\u0027 in the selector where present (e.g. all iec-62443 entries together). The two 2-1 editions are PEER instruments, not editions of one; an engagement uses one or the other."
};
(function () {
  var s = document.currentScript;
  if (!s) return;
  var src = s.src;
  var i = src.lastIndexOf('/');
  var base = i >= 0 ? src.substring(0, i + 1) : '';
  function add(rel) { document.write('<script src=\"' + base + rel + '\"><\/script>'); }
  add('shared/taxonomy-fr7.js');
  add('shared/scoring-profiles.js');
  add('shared/cross-references.js');
  add('shared/risk-context-interchange.js');
  add('shared/review-pack.js');
  add('shared/review-file.js');
  add('shared/engagement-guidance.js');
  add('shared/cra-product-classification.js');
  add('shared/machinery-classification.js');
  add('shared/risk-appetite-sector-baselines.js');
  add('shared/licence.js');
  add('instruments/iec-62443-3-3/instrument.js');
  add('instruments/iec-62443-3-3/narrative.js');
  add('instruments/iec-62443-4-2/instrument.js');
  add('instruments/iec-62443-4-2/narrative.js');
  add('instruments/iec-62443-4-1/instrument.js');
  add('instruments/iec-62443-4-1/narrative.js');
  add('instruments/iec-62443-2-1-2010/instrument.js');
  add('instruments/iec-62443-2-1-2010/narrative.js');
  add('instruments/iec-62443-2-1-2024/instrument.js');
  add('instruments/iec-62443-2-1-2024/narrative.js');
  add('instruments/ncsc-caf/instrument.js');
  add('instruments/ncsc-caf/narrative.js');
  add('instruments/ncsc-caf/profiles/_registry.js');
  add('instruments/ncsc-caf/profiles/caf-general.js');
  add('instruments/ncsc-caf/profiles/caf-ofgem-dge-basic.js');
  add('instruments/ncsc-caf/profiles/caf-ofgem-dge-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-hse-ugpdo-basic.js');
  add('instruments/ncsc-caf/profiles/caf-hse-ugpdo-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-dft-rail-basic.js');
  add('instruments/ncsc-caf/profiles/caf-dft-rail-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-dft-road-basic.js');
  add('instruments/ncsc-caf/profiles/caf-dft-road-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-dft-maritime-basic.js');
  add('instruments/ncsc-caf/profiles/caf-dft-maritime-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-ofcom-basic.js');
  add('instruments/ncsc-caf/profiles/caf-ofcom-enhanced.js');
  add('instruments/ncsc-caf/profiles/caf-ofwat-water-basic.js');
  add('instruments/ncsc-caf/profiles/caf-ofwat-water-enhanced.js');
  add('instruments/general-ot-posture/instrument.js');
  add('instruments/general-ot-posture/narrative.js');
  add('instruments/nis2-assessment/instrument.js');
  add('instruments/nis2-assessment/narrative.js');
  add('instruments/nis2-quick-gap/instrument.js');
  add('instruments/nis2-quick-gap/narrative.js');
  add('instruments/ncsc-caf-aviation/instrument.js');
  add('instruments/ncsc-caf-aviation/narrative.js');
  add('instruments/ncsc-caf-aviation/profiles/_registry.js');
  add('instruments/ncsc-caf-aviation/profiles/caf-aviation-tier1.js');
  add('instruments/ncsc-caf-aviation/profiles/caf-aviation-tier2.js');
  add('instruments/nist-800-53/instrument.js');
  add('instruments/nist-800-53/narrative.js');
  add('instruments/nist-800-53/profiles/_registry.js');
  add('instruments/nist-800-53/profiles/nist-full.js');
  add('instruments/nist-800-53/profiles/nist-low.js');
  add('instruments/nist-800-53/profiles/nist-moderate.js');
  add('instruments/nist-800-53/profiles/nist-high.js');
  add('instruments/nist-800-82/instrument.js');
  add('instruments/nist-800-82/narrative.js');
  add('instruments/nist-800-82/profiles/_registry.js');
  add('instruments/nist-800-82/profiles/ics-full.js');
  add('instruments/nist-800-82/profiles/ics-low.js');
  add('instruments/nist-800-82/profiles/ics-moderate.js');
  add('instruments/nist-800-82/profiles/ics-high.js');
  add('instruments/cis-controls-v8/instrument.js');
  add('instruments/cis-controls-v8/narrative.js');
  add('instruments/cis-controls-v8/profiles/_registry.js');
  add('instruments/cis-controls-v8/profiles/cis-full.js');
  add('instruments/cis-controls-v8/profiles/cis-ig1.js');
  add('instruments/cis-controls-v8/profiles/cis-ig2.js');
  add('instruments/cis-controls-v8/profiles/cis-ig3.js');
  add('instruments/supplier-screener/instrument.js');
  add('instruments/supplier-screener/narrative.js');
  add('instruments/eu-cra/instrument.js');
  add('instruments/eu-machinery/instrument.js');
  add('instruments/onr-syaps-management/instrument.js');
  add('instruments/onr-syaps-management/narrative.js');
  add('instruments/onr-syaps-management/profiles/_registry.js');
  add('instruments/onr-syaps-management/profiles/syaps-mgmt-full.js');
  add('instruments/onr-syaps-management/profiles/syaps-mgmt-smaller.js');
  add('instruments/onr-syaps-cyber/instrument.js');
  add('instruments/onr-syaps-cyber/narrative.js');
  add('instruments/onr-syaps-cyber/profiles/_registry.js');
  add('instruments/onr-syaps-cyber/profiles/syaps-cyber-full.js');
  add('instruments/onr-syaps-cyber/profiles/syaps-cyber-smaller.js');
  add('instruments/onr-syaps-full/instrument.js');
  add('instruments/onr-syaps-full/narrative.js');
  add('instruments/onr-syaps-full/profiles/_registry.js');
  add('instruments/onr-syaps-full/profiles/syaps-full-full.js');
  add('instruments/onr-syaps-full/profiles/syaps-full-smaller.js');
  add('instruments/risk-appetite/instrument.js');
  add('instruments/risk-appetite/narrative.js');
}());
