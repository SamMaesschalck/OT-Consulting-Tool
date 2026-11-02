/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* report.js
 *
 * Shared report chassis used by all instruments. Renders into a container:
 *   - title block (engagement metadata)
 *   - posture summary (target-met + closeness, never just a percentage)
 *   - radar
 *   - closeness bars per FR
 *   - top gaps (floor-flagged + FRs not meeting target)
 *   - per-FR breakdown table
 *   - cross-target comparison (if multiple targets)
 *
 * Per-instrument findings sections are plugged in via the `sections` hook;
 * Phase 1 has no per-instrument sections.
 */
window.App = window.App || {};
window.App.Report = (function () {
  "use strict";

  var S = window.App.Scoring;
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function h(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  }

  function bandPill(band, label) {
    if (band === "na") return h("span", { class: "pill na", text: label || "Not assessed" });
    if (band === "met") return h("span", { class: "pill met", text: label || "Target met" });
    if (band === "near") return h("span", { class: "pill near", text: label || "Near target" });
    return h("span", { class: "pill gap", text: label || "Gap" });
  }

  // The report cover details. This is the Word cover sheet rendered on screen,
  // so it sits at the FOOT of the preview: findings first, provenance last.
  //
  // Rows with nothing in them are dropped rather than printed as a column of
  // blanks - a fresh engagement had seven empty rows here, which read as broken
  // rather than as optional. What was left out is named underneath, so the
  // omission stays visible and nobody assumes a field was filled in.
  function metadataCard(engagement, instrument) {
    var e = engagement.engagement || {};
    var rows = [
      ["Client", e.clientName],
      ["Site", e.siteName],
      ["Address", e.siteAddress],
      ["Contact", e.siteContact],
      ["Opportunity", e.opportunityId],
      ["Consultant", e.consultant],
      ["Date of visit", e.dateOfVisit],
      ["Revision", e.documentRevision],
      ["QA review by", e.qaReviewBy],
      ["Authorised by", e.authorisedBy],
      ["Issued to", e.issuedTo],
      ["Issued date", e.issuedDate],
      ["Confidentiality", e.confidentiality]
    ];
    var filled = rows.filter(function (r) { return String(r[1] || "").trim() !== ""; });
    var empty  = rows.filter(function (r) { return String(r[1] || "").trim() === ""; });

    var body = [];
    if (filled.length) {
      body.push(h("table", { class: "tbl" }, [h("tbody", null, filled.map(function (r) {
        return h("tr", null, [
          h("td", { style: "width:170px; color:var(--text-muted)" }, [r[0]]),
          h("td", null, [r[1]])
        ]);
      }))]));
    } else {
      body.push(h("p", { class: "muted", style: "margin-top:0;", text: "No engagement details captured yet. Fill them in on the Engagement details page; they head the Word report." }));
    }
    if (empty.length) {
      body.push(h("p", { class: "muted", style: "margin-bottom:0; font-size:12px;", text:
        "Not set: " + empty.map(function (r) { return r[0]; }).join(", ") + ". These stay blank in the Word report." }));
    }

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Report cover details" }),
        h("span", { class: "sub", text: instrument.title + " - content version " + (instrument.contentVersion || "-") })
      ]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  // Standing explanatory prose (About the framework, OT focus, How to read this
  // report, ...). It goes into the Word document verbatim and matters there;
  // on screen it is text the consultant has read on every previous engagement,
  // and it used to sit between the executive summary and the results, adding
  // most of a screen of scrolling to reach the numbers. Collapsed into one
  // card, labelled so it is obvious the content still ships in the export.
  // A plain heading + paragraph card, the shape most standing report text
  // takes. Used to feed boilerplateStack() from families that build their
  // prose inline rather than from a narrative pack.
  function proseCard(title, text) {
    if (!text) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: title })]),
      h("div", { class: "card-b" }, [h("p", { style: "margin:0;", text: text })])
    ]);
  }

  // Whether the consultant has the stack open. The report page is rebuilt on
  // every edit (Edit, Done, each save), and a freshly built <details> starts
  // closed, so without this the stack snapped shut under the consultant's
  // cursor each time they edited a section inside it.
  var boilerplateStackOpen = false;

  function boilerplateStack(cards) {
    var present = (cards || []).filter(Boolean);
    if (!present.length) return null;
    var body = h("div", { style: "margin-top:12px;" }, []);
    present.forEach(function (c) { body.appendChild(c); });
    var details = h("details", { class: "boilerplate-stack" }, [
      h("summary", { text: "Standing report text (" + present.length + " section" + (present.length === 1 ? "" : "s") + "), included in the Word document" }),
      body
    ]);
    details.open = boilerplateStackOpen;
    details.addEventListener("toggle", function () { boilerplateStackOpen = details.open; });
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ details ]) ]);
  }

  // ---- capability security level vector --------------------------------
  //
  // The headline artefact of a component assessment: the security level the
  // component can claim per Foundational Requirement, written in the notation
  // the standard itself uses. Every other view in the report shows the same
  // numbers, but only this one states the claim in the form a product supplier
  // or an assessor would quote.
  //
  // Opt-in per instrument via display.slVector, so the system-level instrument
  // (62443-3-3, whose vector is an SL-A/SL-T pair rather than SL-C) is
  // unaffected until it declares one.
  function slVectorSpec(instrument) {
    var d = (instrument && instrument.display) || {};
    return d.slVector || null;
  }

  function slVectorParts(scored, taxonomy) {
    var byFR = {};
    (scored.perFR || []).forEach(function (f) { byFR[f.frId] = f; });
    return ((taxonomy && taxonomy.frs) || []).map(function (fr) {
      var f = byFR[fr.id] || {};
      return {
        frId: fr.id,
        abbr: fr.abbr || fr.id,
        name: fr.name || "",
        achieved: (f.answeredCount > 0 && f.conformantAchievedSL !== null) ? f.conformantAchievedSL : null,
        // The same vector recomputed with compensating countermeasures treated
        // as not satisfied. Where the two differ, the level rests on something
        // that is by definition temporary.
        achievedStrict: (f.answeredCount > 0 && f.achievedSLStrict !== null && f.achievedSLStrict !== undefined)
          ? f.achievedSLStrict : null,
        propped: !!f.propUpByCompensating,
        targetSL: f.targetSL == null ? null : f.targetSL,
        met: !!f.frTargetMet
      };
    });
  }

  // "SL-A (system) = { IAC 1   UC 2   ... }" for the given field.
  function slVectorClaim(label, parts, field) {
    return label + " = { " + parts.map(function (p) {
      var v = p[field];
      return p.abbr + " " + (v === null || v === undefined ? "-" : v);
    }).join("   ") + " }";
  }

  function slVectorCard(scored, taxonomy, instrument) {
    var spec = slVectorSpec(instrument);
    if (!spec) return null;
    var parts = slVectorParts(scored, taxonomy);
    if (!parts.length) return null;
    var label = spec.label || "SL-C";
    var qualifier = spec.qualifier ? " (" + spec.qualifier + ")" : "";

    var vector = h("div", { class: "sl-vector" }, parts.map(function (p) {
      var cls = "sl-vector-cell";
      if (p.achieved === null) cls += " unset";
      else if (p.targetSL != null && p.achieved > p.targetSL) cls += " above";
      else if (p.met) cls += " met";
      else cls += (p.targetSL != null && p.achieved === p.targetSL - 1) ? " near" : " gap";
      return h("div", { class: cls, title: p.frId + " " + p.name + (p.targetSL != null ? " - target SL " + p.targetSL : "") }, [
        h("span", { class: "sl-vector-abbr", text: p.abbr }),
        h("span", { class: "sl-vector-val", text: p.achieved === null ? "-" : String(p.achieved) })
      ]);
    }));

    var claims = [slVectorClaim(label + qualifier, parts, "achieved")];
    // The achieved vector only means something against the target it was judged
    // on, and per-FR overrides make the target vary, so state both.
    if (parts.some(function (p) { return p.targetSL != null; })) {
      claims.push(slVectorClaim((spec.targetLabel || "SL-T") + qualifier, parts, "targetSL"));
    }
    // Only stated when it differs: an identical second vector is noise.
    var propped = parts.filter(function (p) { return p.propped; });
    if (propped.length) {
      claims.push(slVectorClaim(label + qualifier + ", without compensating measures", parts, "achievedStrict"));
    }

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: spec.title || "Capability security level" }),
        h("span", { class: "sub", text: "in the notation of the standard" })
      ]),
      h("div", { class: "card-b" }, [
        vector,
        h("div", { class: "sl-vector-claims" }, claims.map(function (t) {
          return h("div", { class: "sl-vector-claim", text: t });
        })),
        // Where a zone is already better than it needs to be, that is worth
        // saying: it is the cheapest place to raise a target.
        (function () {
          var over = parts.filter(function (p) { return p.targetSL != null && p.achieved > p.targetSL; });
          if (!over.length) return null;
          return h("p", { class: "muted", style: "margin:10px 0 0;", text:
            (over.length === 1 ? over[0].frId + " exceeds its target" : joinNames(over.map(function (p) { return p.frId; })) + " exceed their targets") +
            " (" + over.map(function (p) { return p.frId + " reaches " + S.formatSL(p.achieved) + " against " + S.formatSL(p.targetSL); }).join("; ") +
            "). Raising the target there would cost little, which is worth knowing when the zone model is next reviewed." });
        })(),
        propped.length ? h("p", { class: "muted", style: "margin:10px 0 0;", text:
          (propped.length === 1 ? propped[0].frId + " holds its level" : propped.map(function (p) { return p.frId; }).join(", ") + " hold their levels") +
          " on a compensating countermeasure rather than the requirement itself. Compensating measures are the first thing to decay, so the second vector is the level that survives if one lapses." }) : null,
        spec.note ? h("p", { class: "muted", style: "margin:10px 0 0;", text: spec.note }) : null
      ])
    ]);
  }

  // ---- applicability breakdown -----------------------------------------
  //
  // "48 of 75 answered" invites the question the report must answer itself:
  // what happened to the other 27? For an instrument whose requirements are
  // scoped by component type (62443-4-2's SAR / EDR / HDR / NDR codes), most
  // of them were never in scope, and a reader cannot tell that from a count.
  //
  // The split is derived from the requirement code prefix, so it needs no
  // extra data: anything whose code starts with a declared type prefix is
  // type-scoped, everything else is common. Instruments without
  // display.requirementTypes (all the others today) get nothing.
  function requirementTypeSplit(scored, instrument) {
    var d = (instrument && instrument.display) || {};
    var types = d.requirementTypes;
    if (!types) return null;
    var byId = {};
    (instrument.requirements || []).forEach(function (r) { byId[r.id] = r; });

    var out = { byType: {}, commonNA: 0, applicable: 0, answered: 0, partly: 0, typeNA: 0,
                outOfTarget: 0, neverSelected: 0 };
    Object.keys(types).forEach(function (k) { out.byType[k] = { label: types[k], na: 0, total: 0 }; });

    (scored.perFR || []).forEach(function (f) {
      (f.reqs || []).forEach(function (r) {
        var req = byId[r.requirementId];
        var code = (req && req.code) || "";
        var prefix = String(code).split(/[\s.]/)[0];
        var bucket = out.byType[prefix] || null;
        if (bucket) bucket.total++;
        if (r.applicable) {
          out.applicable++;
          if (r.answered) out.answered++;
          else if (r.touched) out.partly++;
        } else if (r.exclusionReason === "never-selected") {
          out.neverSelected++;
        } else if (r.exclusionReason === "out-of-target") {
          // Not selected until a higher SL than this assessment targets. A
          // scoping consequence of SL-T, not an assessor judgement, so it never
          // lands in the "judged not applicable" bucket.
          out.outOfTarget++;
        } else if (bucket) {
          bucket.na++;
          out.typeNA++;
        } else {
          out.commonNA++;
        }
      });
    });
    return out;
  }

  // One plain sentence per reason, so every requirement is accounted for rather
  // than merely absent. The numbers are written to add up: assessed + excluded
  // by type + excluded by judgement + any still unanswered equals the total.
  function applicabilityLines(split, instrument) {
    if (!split) return [];
    function n(count, word) { return count + " " + word + (count === 1 ? "" : "s"); }

    var byType = Object.keys(split.byType)
      .filter(function (k) { return split.byType[k].na > 0; })
      .map(function (k) { return split.byType[k].na + " " + split.byType[k].label; });
    if (!byType.length && split.commonNA === 0 && !split.outOfTarget && !split.neverSelected) return [];

    var total = split.applicable + split.typeNA + split.commonNA +
                (split.outOfTarget || 0) + (split.neverSelected || 0);
    var lines = [];
    var unanswered = split.applicable - split.answered;
    var lead = "Assessed " + split.answered + " of this instrument's " + n(total, "requirement") + ".";
    // A requirement answered in part is not "unanswered": say which is which.
    var partlyN = split.partly || 0;
    if (unanswered > 0 && partlyN === 0) lead += " " + n(unanswered, "applicable requirement") + " remain unanswered.";
    else if (unanswered > 0) {
      lead += " " + n(unanswered, "applicable requirement") + (unanswered === 1 ? " is" : " are") + " not fully answered: " +
        (unanswered - partlyN > 0 ? (unanswered - partlyN) + " unanswered and " : "") +
        partlyN + " with items still to assess.";
    }
    lines.push(lead);

    if (byType.length) {
      lines.push(n(split.typeNA, "requirement") + " apply only to a different component type and are excluded: " +
                 byType.join(", ") + ".");
    }
    if (split.commonNA > 0) {
      lines.push(n(split.commonNA, "further requirement") + " " + (split.commonNA === 1 ? "was" : "were") +
                 " judged not applicable to this component; the reason is recorded against each.");
    }
    if (split.outOfTarget > 0) {
      lines.push(n(split.outOfTarget, "requirement") + " " + (split.outOfTarget === 1 ? "is" : "are") +
                 " first selected above the target security level and so " +
                 (split.outOfTarget === 1 ? "was" : "were") +
                 " not assessed. Raising the target would bring " +
                 (split.outOfTarget === 1 ? "it" : "them") + " into scope.");
    }
    if (split.neverSelected > 0) {
      lines.push(n(split.neverSelected, "requirement") + " " + (split.neverSelected === 1 ? "carries" : "carry") +
                 " no security level anywhere in the standard's selection table and " +
                 (split.neverSelected === 1 ? "is" : "are") + " recorded rather than scored.");
    }
    return lines;
  }

  // ---- what is holding each level down ---------------------------------
  //
  // SL-A per FR is set by the weakest in-scope item, so for every FR below its
  // target there is a short, specific list of items that would raise it. That
  // list IS the remediation brief, and it comes from the same structure that
  // produced the vector, so the two can never disagree.
  function blockingLines(scored, taxonomy) {
    var frName = {};
    ((taxonomy && taxonomy.frs) || []).forEach(function (f) { frName[f.id] = f.name || ""; });
    return (scored.perFR || [])
      .filter(function (f) { return f.inScope && (f.blockingItems || []).length; })
      .map(function (f) {
        return {
          frId: f.frId,
          name: frName[f.frId] || "",
          achieved: f.conformantAchievedSL,
          targetSL: f.targetSL,
          // "incomplete" when nothing answered falls short and blanks alone
          // hold the level: shown as not yet, not as a shortfall.
          status: f.frTargetStatus || null,
          items: (f.blockingItems || []).map(function (i) {
            return { label: i.label, title: i.title, firstSL: i.firstSL, disposition: i.disposition };
          })
        };
      });
  }

  var DISPOSITION_WORD = {
    "not-met": "not met",
    "partial": "partially met",
    "unassessed": "not yet assessed"
  };

  // What is in place, and how it was established. The report named only what
  // was missing, so a requirement that MET its target left no trace of what had
  // been seen - the assurance half of the engagement lived only in the
  // spreadsheet. Self-limiting: a requirement appears only where the consultant
  // wrote evidence for it.
  function evidenceInPlaceCard(scored, taxonomy, instrument) {
    var noun = (instrument && instrument.display && instrument.display.requirementNoun) || "requirement";
    var groups = [];
    (scored.perFR || []).forEach(function (fr) {
      var rows = (fr.reqs || []).filter(function (r) {
        return r.met && r.evidence && String(r.evidence).trim() !== "";
      });
      if (!rows.length) return;
      var taxFR = ((taxonomy && taxonomy.frs) || []).filter(function (f) { return f.id === fr.frId; })[0];
      groups.push({ frId: fr.frId, name: (taxFR && taxFR.name) || "", rows: rows });
    });
    if (!groups.length) return null;
    var total = groups.reduce(function (a, g) { return a + g.rows.length; }, 0);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "What is in place" }),
        h("span", { class: "sub", text: total + " " + noun + (total === 1 ? "" : "s") +
                                        " meeting target, with the evidence recorded" })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text:
          "The evidence recorded for each " + noun + " that meets its target. It shows what was established, to read alongside the gaps." }),
        h("div", null, groups.map(function (g) {
          return h("div", { class: "evidence-group" }, [
            h("div", { class: "evidence-group-h" }, [
              h("strong", { text: g.frId }), h("span", { class: "muted", text: " " + g.name })
            ]),
            h("ul", { class: "tight" }, g.rows.map(function (r) {
              return h("li", null, [
                h("strong", { text: r.code }),
                h("span", { text: " " + (r.title || "") }),
                h("span", { class: "muted", text: " - met at " + S.formatSL(r.achievedShown) }),
                h("div", { class: "evidence-text", text: r.evidence }),
                (r.notes && String(r.notes).trim() !== "")
                  ? h("div", { class: "evidence-text muted", text: "Notes: " + r.notes }) : null
              ]);
            }))
          ]);
        }))
      ])
    ]);
  }

  function blockingItemsCard(scored, taxonomy, instrument) {
    var rows = blockingLines(scored, taxonomy);
    if (!rows.length) return null;
    var noun = (instrument && instrument.display && instrument.display.requirementNoun) || "requirement";
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "What is holding each level down" }),
        h("span", { class: "sub", text: "the items that cap the achieved Security Level" })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text:
          "The achieved level is set by the weakest item in scope, so closing everything listed here, and nothing more, raises that Foundational Requirement to the next level." }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", { text: "FR" }),
            h("th", { text: "Achieved" }),
            h("th", { text: "Target" }),
            h("th", { text: "Blocking " + noun + "s" })
          ])]),
          h("tbody", null, rows.map(function (r) {
            return h("tr", null, [
              h("td", null, [h("strong", { text: r.frId }), h("span", { class: "muted", text: " " + r.name })]),
              h("td", { class: "center", text: S.formatSL(r.achieved) }),
              h("td", { class: "center", text: S.formatSL(r.targetSL) }),
              h("td", null, [h("ul", { class: "tight" }, r.items.map(function (i) {
                return h("li", null, [
                  h("strong", { text: i.label }),
                  h("span", { text: " " + (i.title || "") }),
                  h("span", { class: "muted", text: " - " + (DISPOSITION_WORD[i.disposition] || i.disposition) +
                    ", required from SL " + i.firstSL })
                ]);
              }))])
            ]);
          }))
        ])
      ])
    ]);
  }

  // ---- what an SL-A figure does and does not cover -----------------------
  //
  // 62443-3-3 and -4-2 measure technical capability. Whether the organisation
  // around the system runs a security programme is a 62443-2-1 question, and a
  // reader who is handed an SL-A vector alone will assume it covers both.
  function programmeContextText(companionIds) {
    var programme = (companionIds || []).filter(function (id) { return /62443-2-1/.test(id); });
    return programme.length
      ? "A programme assessment (ISA/IEC 62443-2-1) has also been carried out for this engagement, and its findings are reported separately. The two should be read together, since the Security Levels here describe what the technology can do and the programme assessment describes whether the organisation sustains it."
      : "The Security Levels in this report are a technical conformance result. They describe what the system or component can do, as configured and observed, but say nothing about whether the organisation around it runs a security programme (policies, competence, patching discipline, incident response), which is assessed against ISA/IEC 62443-2-1 and has not been carried out here.";
  }

  function programmeContextCard(instrument, companionIds) {
    if (!instrument || instrument.scoringFamily !== "capability-sl") return null;
    var text = programmeContextText(companionIds);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "What these Security Levels cover" })]),
      h("div", { class: "card-b" }, [h("p", { style: "margin:0;", text: text })])
    ]);
  }

  function applicabilityCard(scored, instrument) {
    var split = requirementTypeSplit(scored, instrument);
    var lines = applicabilityLines(split, instrument);
    if (!lines.length) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "What was in scope" })]),
      h("div", { class: "card-b" }, lines.map(function (t, i) {
        return h("p", { class: i === 0 ? "" : "muted", style: i === 0 ? "margin-top:0;" : "margin:6px 0 0;", text: t });
      }))
    ]);
  }

  function formatWeakestFRs(weakestFRs) {
    // Singular: "FR1 - SL 0"
    // Tied:     "FR1, FR5, FR6 (all reached SL 1 against target SL 2)" - the
    //           "against target SL X" only when every tied FR shares the same
    //           target. With mixed targets, we drop the target phrase.
    if (!weakestFRs || weakestFRs.length === 0) return { label: "Weakest FR (achieved SL)", value: "-" };
    if (weakestFRs.length === 1) {
      var w = weakestFRs[0];
      return {
        label: "Weakest FR (achieved SL)",
        value: w.frId + " - " + S.formatSL(w.conformantAchievedSL)
      };
    }
    var ids = weakestFRs.map(function (f) { return f.frId; }).join(", ");
    var sl  = weakestFRs[0].conformantAchievedSL;
    var allSameTarget = weakestFRs.every(function (f) { return f.targetSL === weakestFRs[0].targetSL; });
    var detail = "all reached " + S.formatSL(sl);
    if (allSameTarget) detail += " against target " + S.formatSL(weakestFRs[0].targetSL);
    return {
      label: "Weakest areas",
      value: ids + " (" + detail + ")"
    };
  }

  // The answer to "is the target met?", shared with the Word exporter so the
  // tile, the comparison tables and the document all give the same one. Four
  // states, not two: met so far with Foundational Requirements still to assess
  // is not a yes (the target is a claim about every in-scope FR) and not a no
  // (nothing assessed has fallen short), so it reads "Not yet" and says how
  // far the assessment has got.
  // Anything answered at all. totalAnswered counts requirements answered in
  // FULL, so a zone answered only in part would read as untouched on it.
  function slAnyAnswered(scored) {
    var s = scored || {};
    if (typeof s.anyAnswered === "boolean") return s.anyAnswered;
    return s.totalAnswered > 0;
  }

  function slTargetMetWords(scored) {
    var s = scored || {};
    var status = !slAnyAnswered(s) ? "unassessed"
      : (s.overallTargetStatus || (s.overallTargetMet ? "met" : "short"));
    if (status === "unassessed") return { status: status, value: "-", band: "na", detail: "" };
    if (status === "met") return { status: status, value: "Yes", band: "met", detail: "" };
    if (status === "incomplete") {
      // "in scope" only when an FR has been taken out by SL-T 0: a reader who
      // knows there are seven FRs and sees "1 of 6" needs to be told why.
      // Where an FR has been answered only in part it counts as assessed but
      // not as FULLY assessed, and the figure says which it is counting.
      var someOut = (s.perFR || []).length > s.inScopeFRCount;
      var partN = (s.partlyAssessedFRs || []).length;
      var doneN = partN && typeof s.fullyAssessedFRCount === "number" ? s.fullyAssessedFRCount : s.assessedFRCount;
      return { status: status, value: "Not yet", band: "near",
               detail: doneN + " of " + s.inScopeFRCount + (someOut ? " in-scope" : "") +
                       " FRs " + (partN ? "fully " : "") + "assessed" };
    }
    return { status: status, value: "No", band: "gap", detail: "" };
  }

  // The per-FR "target met" cell, in the same words on every output (screen,
  // Word, Excel, the capture sidebar). Only an answered shortfall reads "No";
  // an FR met so far with items still blank reads "Not yet".
  //   met -> Yes   short -> No   incomplete -> Not yet
  //   in scope, nothing answered -> Not assessed   otherwise -> "-"
  function frTargetWords(fr) {
    var f = fr || {};
    var status = f.frTargetStatus ||
      (!f.inScope ? "out-of-scope" : (f.answeredCount === 0 ? "unassessed" : (f.frTargetMet ? "met" : "short")));
    // An in-scope FR nobody has answered is an omission the reader should
    // see named; out of scope, or every item judged N/A, has no verdict.
    if (status === "unassessed" && f.inScope && f.countedCount > 0) {
      return { status: status, value: "Not assessed", band: "na" };
    }
    if (status === "out-of-scope" || status === "unassessed" || !(f.answeredCount > 0)) {
      return { status: status, value: "-", band: "na" };
    }
    if (status === "met") return { status: status, value: "Yes", band: "met" };
    if (status === "incomplete") return { status: status, value: "Not yet", band: "near" };
    return { status: status, value: "No", band: "gap" };
  }

  function kpiCard(scored, target, instrument) {
    var tm = slTargetMetWords(scored);
    var closeness = S.formatPct(scored.overallCloseness);
    var floorCls = scored.floorFlagCount > 0 ? "gap" : (!slAnyAnswered(scored) ? "" : "met");
    var weak = formatWeakestFRs(scored.weakestFRs);
    var overallVal = h("div", { class: "val " + (tm.band === "na" ? "" : tm.band) + (tm.detail ? " kpi-stack" : "") }, [tm.value]);
    if (tm.detail) overallVal.appendChild(h("div", { class: "kpi-sub", text: tm.detail }));

    return h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Overall target met" }),
        overallVal
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: weak.label }),
        h("div", { class: "val", style: weak.value.length > 24 ? "font-size:15px; line-height:1.2;" : "", text: weak.value })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Floor-flagged requirements" }),
        h("div", { class: "val " + floorCls, text: String(scored.floorFlagCount) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Overall closeness (context)" }),
        h("div", { class: "val", text: closeness })
      ])
    ]);
  }

  // Priority list of FRs that did not meet target, ordered as decided by
  // scoring.js: floor-flagged FRs first, then by gap size descending. This is
  // the "where to look first" view; it changes nothing about target-met or
  // the floor rule themselves, just presents the same data ordered.
  function slPriorityCard(scored, taxonomy, opts) {
    // The computed order is a starting point. The consultant knows things the
    // gap arithmetic does not - a shutdown window, a supplier lead time - so a
    // stored order wins where one has been set.
    var pri = slPriorityFRs(scored, opts);
    var notAssessed = scored.notAssessedFRs || [];
    // Answered in part with nothing short: not a priority, but not finished.
    var partly = scored.partlyAssessedFRs || [];
    if (pri.length === 0 && notAssessed.length === 0 && partly.length === 0) return null;
    var reordered = !!(sectionCustom(opts, SL_PRIORITY_KEY).order || []).length;

    var rows = pri.map(function (fr, i) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      var gap = fr.targetSL - fr.conformantAchievedSL;
      var floorMarker = fr.floorFlagCount > 0
        ? h("span", { class: "pill flag", style: "margin-left:6px;", text: "floor x" + fr.floorFlagCount })
        : null;
      return h("div", { class: "priority-row", "data-reorder-id": fr.frId, "data-reorder-label": fr.frId + " " + taxFR.name }, [
        h("span", { class: "priority-rank", text: String(i + 1) }),
        h("span", { class: "priority-name" }, [h("strong", { text: fr.frId }), " " + taxFR.name]),
        h("span", { class: "muted", text: "gap " + gap + " (" + S.formatSL(fr.conformantAchievedSL) + " vs " + S.formatSL(fr.targetSL) + ")" }),
        floorMarker
      ]);
    });
    var naRows = notAssessed.map(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      return h("div", { class: "priority-row priority-insufficient" }, [
        h("span", { class: "priority-rank", text: "-" }),
        h("span", { class: "priority-name" }, [h("strong", { text: fr.frId }), " " + taxFR.name]),
        h("span", { class: "muted", text: "not assessed" })
      ]);
    });
    var partRows = partly.map(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      var left = fr.unassessedCount || 0;
      return h("div", { class: "priority-row priority-insufficient" }, [
        h("span", { class: "priority-rank", text: "-" }),
        h("span", { class: "priority-name" }, [h("strong", { text: fr.frId }), " " + taxFR.name]),
        h("span", { class: "muted", text: left + " item" + (left === 1 ? "" : "s") + " to assess" })
      ]);
    });

    var body = [];
    if (pri.length > 0) {
      body.push(h("div", { class: "muted", style: "margin-bottom:8px;", text: reordered
        ? "FRs that did not meet target, in the consultant's order."
        : "FRs that did not meet target, ordered by gap; floor-flagged FRs first." }));
      body.push(h("div", { class: "priority-list", "data-reorder-list": "1" }, rows));
    } else {
      body.push(h("div", { class: "muted", text: partly.length
        ? "No assessed FR falls short of its target."
        : "Every assessed FR met its target." }));
    }
    if (partly.length > 0) {
      body.push(h("div", { class: "muted", style: "margin:14px 0 8px;", text: "Partly assessed, nothing short so far:" }));
      body.push(h("div", { class: "priority-list" }, partRows));
    }
    if (notAssessed.length > 0) {
      body.push(h("div", { class: "muted", style: "margin:14px 0 8px;", text: "Not assessed in this engagement:" }));
      body.push(h("div", { class: "priority-list" }, naRows));
    }
    return h("div", { class: "card" }, [
      // Same heading as the Word document's short list, so the two are one
      // section: rename it or reorder it once and both follow.
      h("div", { class: "card-h" }, [ h("h2", { text: "Where to focus first" }) ]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  function frBreakdownTable(scored, taxonomy) {
    var head = h("thead", null, [h("tr", null, [
      h("th", null, ["FR"]), h("th", null, ["Title"]),
      h("th", { class: "center" }, ["Target"]),
      h("th", { class: "center" }, ["Achieved SL"]),
      h("th", { class: "center" }, ["Closeness"]),
      h("th", { class: "center" }, ["Floor"]),
      // Items, not requirements: the item is the unit of assessment, and a bare
      // "Applicable / Answered" invited the reader to compare it with the
      // requirement counts elsewhere in the report.
      h("th", { class: "center" }, ["Items in scope / answered"]),
      h("th", { class: "center" }, ["Target met"])
    ])]);
    var body = h("tbody", null, scored.perFR.map(function (fr) {
      var taxFR = taxonomy.frs.filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      return h("tr", null, [
        h("td", null, [h("strong", { text: fr.frId })]),
        h("td", null, [taxFR.name]),
        h("td", { class: "center" }, [S.formatSL(fr.targetSL)]),
        h("td", { class: "center" }, [S.formatSL(fr.conformantAchievedSL)]),
        h("td", { class: "center " + fr.closenessBand }, [S.formatPct(fr.closeness)]),
        h("td", { class: "center" }, [fr.floorFlagCount > 0 ? bandPill("gap", String(fr.floorFlagCount)) : ""]),
        h("td", { class: "center" }, [fr.applicableCount + " / " + fr.answeredCount]),
        h("td", { class: "center" }, [(function () {
          var w = frTargetWords(fr);
          return w.band === "na" ? h("span", { class: "muted", text: w.value }) : bandPill(w.band, w.value);
        })()])
      ]);
    }));
    return h("table", { class: "tbl" }, [head, body]);
  }

  function topGapsCard(scored) {
    var rows = [];
    scored.perFR.forEach(function (fr) {
      fr.reqs.forEach(function (r) {
        if (r.floor) rows.push({ kind: "floor", req: r, fr: fr });
      });
    });
    scored.perFR.forEach(function (fr) {
      // Short FRs only: one met so far with items still blank is not a gap.
      if (fr.answeredCount > 0 && frTargetWords(fr).status === "short" && fr.floorFlagCount === 0) {
        rows.push({ kind: "fr-gap", req: null, fr: fr });
      }
    });
    if (rows.length === 0) {
      return h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Top gaps" })]),
        h("div", { class: "card-b" }, [h("p", { class: "muted", text: (scored.partlyAssessedFRs || []).length
          ? "No floor-flagged requirements, and no assessed FR falls short of its target."
          : "No floor-flagged requirements and all assessed FRs meet target." })])
      ]);
    }
    var list = h("tbody", null, rows.map(function (row) {
      if (row.kind === "floor") {
        return h("tr", null, [
          h("td", null, [bandPill("gap", "Floor")]),
          h("td", null, [h("strong", { text: row.req.code }), " - " + row.req.title]),
          h("td", null, [row.fr.frId]),
          h("td", { class: "center" }, [S.formatSL(row.req.targetSL)]),
          h("td", { class: "center" }, [S.formatSL(row.req.achievedShown)])
        ]);
      }
      return h("tr", null, [
        h("td", null, [bandPill("near", "FR gap")]),
        h("td", null, [h("strong", { text: row.fr.frId }), " - target not met"]),
        h("td", null, [row.fr.frId]),
        h("td", { class: "center" }, [S.formatSL(row.fr.targetSL)]),
        h("td", { class: "center" }, [S.formatSL(row.fr.conformantAchievedSL)])
      ]);
    }));
    var head = h("thead", null, [h("tr", null, [
      h("th", null, [""]), h("th", null, ["Item"]), h("th", null, ["FR"]),
      h("th", { class: "center" }, ["Target"]),
      h("th", { class: "center" }, ["Achieved"])
    ])]);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Top gaps" })]),
      h("div", { class: "card-b" }, [h("table", { class: "tbl" }, [head, list])])
    ]);
  }

  function crossTargetCard(scoredAll, taxonomy) {
    if (!scoredAll || scoredAll.perTarget.length < 2) return null;
    var head = h("thead", null, [h("tr", null,
      [h("th", null, ["FR"])].concat(scoredAll.perTarget.map(function (t) {
        return h("th", { class: "center" }, [t.target.name]);
      }))
    )]);
    var bodyRows = taxonomy.frs.map(function (fr) {
      var idCell = h("td", null, [
        h("strong", { text: fr.id }),
        h("span", { class: "muted", style: "margin-left:6px;", text: fr.name })
      ]);
      var cells = [idCell];
      scoredAll.perTarget.forEach(function (t) {
        var frRes = t.result.perFR.filter(function (f) { return f.frId === fr.id; })[0];
        var content = h("div", null, [
          S.formatSL(frRes.conformantAchievedSL),
          h("br"),
          h("span", { class: "muted", text: S.formatPct(frRes.closeness) + (frRes.floorFlagCount ? " * floor" : "") })
        ]);
        cells.push(h("td", { class: "center " + frRes.closenessBand }, [content]));
      });
      return h("tr", null, cells);
    });
    var summaryCells = [h("td", null, [h("strong", { text: "Target met" })])];
    scoredAll.perTarget.forEach(function (t) {
      var tm = slTargetMetWords(t.result);
      summaryCells.push(h("td", { class: "center" }, [
        tm.band === "na" ? bandPill("na") : bandPill(tm.band, tm.value),
        tm.detail ? h("div", { class: "muted small", text: tm.detail }) : null
      ]));
    });
    bodyRows.push(h("tr", null, summaryCells));
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Cross-" + ((scoredAll.instrument.targetDimensionLabel || "site").toLowerCase()) + " comparison" })]),
      h("div", { class: "card-b" }, [h("table", { class: "tbl" }, [head, h("tbody", null, bodyRows)])])
    ]);
  }

  function legend() {
    return h("div", { class: "legend" }, [
      h("span", null, [h("span", { class: "sw met"  }), "Met"]),
      h("span", null, [h("span", { class: "sw near" }), "Near target"]),
      h("span", null, [h("span", { class: "sw gap"  }), "Gap"]),
      h("span", null, [h("span", { class: "sw na"   }), "Not applicable"]),
      h("span", null, [h("span", { class: "sw target" }), "Target SL"])
    ]);
  }

  function summaryHeadline(scored, opts) {
    var noun = ((scored.profile && scored.profile.targetDimensionLabel) ||
                (opts && opts.instrument && opts.instrument.targetDimensionLabel) || "site").toLowerCase();
    if (!slAnyAnswered(scored)) return "No requirements assessed yet for this " + noun + ".";
    var weakest = scored.weakestFR;
    var msg;
    var partlyFRs = scored.partlyAssessedFRs || [];
    if (scored.overallTargetMet) {
      msg = "Overall target met. Weakest FR is " + weakest.frId + " at " + S.formatSL(weakest.conformantAchievedSL) + ".";
    } else if (scored.overallTargetStatus === "incomplete" && partlyFRs.length) {
      // Some FRs answered only in part. Nothing answered falls short, so this
      // is not a shortfall, but neither is it met: say how far it has got and
      // which FRs still have items to assess.
      var todoP = scored.notAssessedFRs || [], outP = (scored.outOfScopeFRs || []).length;
      var someOutP = (scored.perFR || []).length > scored.inScopeFRCount;
      msg = "Target not yet met: nothing assessed so far falls short. " +
            scored.fullyAssessedFRCount + " of " + scored.inScopeFRCount + (someOutP ? " in-scope" : "") +
            " FRs fully assessed; " + joinFRs(partlyFRs) + (partlyFRs.length === 1 ? " has" : " have") +
            " items still to assess" +
            (todoP.length ? " and " + todoP.length + " FR" + (todoP.length === 1 ? " is" : "s are") + " not yet assessed" : "") +
            (outP ? "; " + outP + " out of scope" : "") + ".";
      // The weakest FR is named only when it is settled: one held down by
      // blanks is work still to do, not a weakness.
      if (weakest && weakest.frTargetStatus !== "incomplete") {
        msg += " Weakest assessed FR is " + weakest.frId + " at " + S.formatSL(weakest.conformantAchievedSL) + ".";
      }
    } else if (scored.overallTargetStatus === "incomplete") {
      // Everything assessed is at target, but the target is a claim about
      // every in-scope FR, so say how much of it the result rests on.
      // One FR is named rather than counted ("the 1 FR assessed" reads badly),
      // and FRs out of scope are mentioned so the counts add up to seven.
      var todo = scored.notAssessedFRs || [], outN = (scored.outOfScopeFRs || []).length;
      var doneN = scored.assessedFRCount, todoN = todo.length;
      var doneFRs = (scored.perFR || []).filter(function (f) {
        return f.inScope && todo.indexOf(f) === -1;
      });
      var doneWords = doneFRs.length !== doneN ? "all " + doneN + " FRs assessed"
        : doneN === 1 ? "the one FR assessed (" + doneFRs[0].frId + ")"
        : doneN === 2 ? "both FRs assessed (" + joinFRs(doneFRs) + ")"
        : "all " + doneN + " FRs assessed";
      msg = "Target met so far in " + doneWords +
            "; " + todoN + " FR" + (todoN === 1 ? "" : "s") + " not yet assessed" +
            (outN ? " and " + outN + " out of scope" : "") + ". Weakest assessed FR is " + weakest.frId + " at " +
            S.formatSL(weakest.conformantAchievedSL) + ".";
    } else {
      msg = "Overall target not met. Weakest FR is " + weakest.frId + " at " + S.formatSL(weakest.conformantAchievedSL) +
            " (target " + S.formatSL(weakest.targetSL) + "). ";
      if (scored.floorFlagCount > 0) {
        // Say WHERE. This count is the open zone's; the system rollup states a
        // different, larger number for the whole assessment, and the two sitting
        // unqualified on the same page is what makes a reader distrust both.
        var here = (opts && opts.scoredAll && (opts.scoredAll.perTarget || []).length > 1)
          ? " in this " + noun : "";
        msg += scored.floorFlagCount === 1
          ? "1 requirement is floor-flagged" + here + ". "
          : scored.floorFlagCount + " requirements are floor-flagged" + here + ". ";
      }
    }
    msg += " Overall closeness is " + S.formatPct(scored.overallCloseness) +
      " (for context only; whether the target is met is decided by the weakest link).";
    return msg;
  }

  function render(container, opts) {
    container.innerHTML = "";
    // Fill the client's name into the pack once, here, so every renderer that
    // prints boilerplate verbatim gets it. A copy: opts belongs to the caller.
    if (opts && opts.narrative) {
      var o2 = {};
      Object.keys(opts).forEach(function (k) { o2[k] = opts[k]; });
      o2.narrative = personaliseNarrative(opts.narrative, opts.engagement, opts.instrument, opts.activeTarget);
      opts = o2;
    }
    var family = (opts.instrument && opts.instrument.scoringFamily) || "capability-sl";
    if (family === "domain-letter") {
      renderDomainLetter(container, opts);
    } else if (family === "caf-achieved") {
      renderCAF(container, opts);
    } else if (family === "program-maturity-ml") {
      renderProgramML(container, opts);
    } else if (family === "nis2-conformance") {
      renderNIS2(container, opts);
    } else if (family === "csms-conformance") {
      // Layered CRA carries a `layers` array on its scored object; plain csms
      // does not. Both are the csms-conformance family.
      if (opts.scored && opts.scored.layers) renderCRA(container, opts);
      else renderCSMS(container, opts);
    } else if (family === "risk-appetite-coherence") {
      renderRiskAppetite(container, opts);
    } else {
      renderCapabilitySL(container, opts);
    }
    // One exit point, so every family's report picks up the consultant's
    // section overrides without each renderer having to know about them.
    decorateSections(container, opts);
  }

  // ---- consultant customisation of report sections ----------------------
  //
  // A section is keyed by a slug of its GENERATED heading, never its displayed
  // one, so renaming a section keeps its key and the override survives. The
  // active target's name is stripped first: "Posture summary - BPCS" and
  // "Posture summary - SIS" are one section seen from two zones, and a rename
  // should follow the zone switch rather than stick to whichever zone was open.
  function sectionKey(title, opts) {
    var t = String(title || "");
    var names = [];
    if (opts && opts.activeTarget && opts.activeTarget.name) names.push(opts.activeTarget.name);
    if (opts && opts.engagement && opts.engagement.targets) {
      (opts.engagement.targets || []).forEach(function (tg) { if (tg && tg.name) names.push(tg.name); });
    }
    // Longest first, so a zone called "BPCS" does not chew a hole in the middle
    // of a zone called "BPCS - basic process control".
    names.sort(function (a, b) { return b.length - a.length; });
    names.forEach(function (n) { t = t.split(n).join(" "); });
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function reportCustom(opts) {
    return (opts && opts.engagement && opts.engagement.reportCustom) || {};
  }
  function sectionCustom(opts, key) {
    return reportCustom(opts)[key] || {};
  }

  // Apply a stored order to computed rows. Anything the consultant has not
  // placed keeps its computed position AFTER the ordered ones, so a finding
  // raised since the order was set appears at the end rather than vanishing.
  function applyOrder(rows, order, idOf) {
    if (!order || !order.length || !rows || rows.length < 2) return rows || [];
    var pos = {};
    order.forEach(function (id, i) { pos[id] = i; });
    var placed = [], rest = [];
    rows.forEach(function (r) {
      if (pos[idOf(r)] !== undefined) placed.push(r); else rest.push(r);
    });
    placed.sort(function (a, b) { return pos[idOf(a)] - pos[idOf(b)]; });
    return placed.concat(rest);
  }

  // The priority order the report and the Word document both print: computed
  // by scoring.js, then overridden by whatever order the consultant set.
  // Keyed on the heading both renderers use, so reordering the card reorders
  // the document's short list too.
  var SL_PRIORITY_KEY = "where-to-focus-first";
  function slPriorityFRs(scored, opts) {
    return applyOrder((scored && scored.priorityFRs) || [],
                      sectionCustom(opts, SL_PRIORITY_KEY).order,
                      function (f) { return f.frId; });
  }

  function dlPriorityDomains(po, opts) {
    return applyOrder((po && po.graded) || [],
                      sectionCustom(opts, "priority-order").order,
                      function (d) { return d.domainId || d.id; });
  }

  // Screen-side application. The Word exporter does the same job over its own
  // heading tree in ExportDOCX.applyReportCustom - the two share only the key.
  //
  // A hidden section is NOT removed from the preview: the consultant has to be
  // able to see what they dropped and put it back. It is dimmed and labelled,
  // and the Word exporter is what actually leaves it out.
  function decorateSections(container, opts) {
    var custom = reportCustom(opts);
    var rescuedNotes = [];
    // EVERY card, not just the top-level ones. The standing prose - About this
    // assessment, How to read this report, the OT-focus note, the CRA layer
    // detail - is wrapped inside a collapsed stack, and walking only direct
    // children left exactly the sections a consultant most wants to reword as
    // the ones they could not touch. A wrapper with no heading of its own is
    // skipped below, so nesting costs nothing.
    [].slice.call(container.querySelectorAll(".card")).forEach(function (card) {
      var head = null, bodyEl = null;
      [].slice.call(card.children).forEach(function (ch) {
        if (ch.classList && ch.classList.contains("card-h")) head = ch;
        if (ch.classList && ch.classList.contains("card-b")) bodyEl = ch;
      });
      var h2 = head && head.getElementsByTagName("h2")[0];
      if (!h2) return;
      var key = sectionKey(h2.textContent, opts);
      card.setAttribute("data-section", key);
      card.setAttribute("data-section-title", h2.textContent);

      // The generated wording that OPENS the section, captured before anything
      // replaces it. The editor puts this in the box so the consultant edits
      // the real sentences rather than facing a blank field and having to
      // retype what the tool already wrote.
      //
      // A card can name its own editable block with data-prose-block where the
      // generic "leading paragraphs" rule would not find it - the next steps
      // are a list, and their text lives on reportNarrative rather than here.
      var declared = bodyEl && bodyEl.querySelector("[data-prose-block]");
      var isNextSteps = !!card.getAttribute("data-next-steps");
      var lead = declared ? [declared] : leadingProse(bodyEl);
      var paras = [];
      if (isNextSteps) {
        paras = nextStepsLines(opts.engagement, opts);
      } else {
        lead.forEach(function (el) {
          // A wrapper div holds one paragraph per child; keep them separate, or
          // the editor hands the consultant the whole narrative run together on
          // one line and editing it collapses several paragraphs into one.
          if (el.tagName === "DIV") {
            [].slice.call(el.children).forEach(function (p) { paras.push(p.textContent.trim()); });
          } else {
            paras.push(el.textContent.trim());
          }
        });
      }
      card.setAttribute("data-generated-prose", paras.filter(Boolean).join("\n"));

      var c = custom[key];
      if (!c) return;

      if (c.title) h2.textContent = c.title;

      // The next steps have their own store, so a stray `prose` override must
      // not fight it for the same block.
      if (c.prose && bodyEl && !isNextSteps) {
        // Everything computed below the prose (the numbers) stays, because the
        // wording is the part that is a judgement call and the tables are not.
        var anchor = lead.length ? lead[0] : bodyEl.firstChild;
        var frag = document.createDocumentFragment();
        String(c.prose).split(/\n/).forEach(function (para) {
          if (para.trim() !== "") frag.appendChild(h("p", { style: "margin-top:0;", text: para.trim() }));
        });
        bodyEl.insertBefore(frag, anchor);
        lead.forEach(function (el) { bodyEl.removeChild(el); });
      }

      if (c.hidden) {
        card.classList.add("section-hidden");
        if (head) head.appendChild(h("span", { class: "section-hidden-tag", text: "Hidden: left out of the Word document" }));
        // The licence notice is not the consultant's to drop: hiding the About
        // section leaves it in the Word document, where it closes the report
        // (ExportDOCX.applyReportCustom). Left inside the dimmed card it would
        // read as left out too, so it moves to the end of the preview, as in
        // the document.
        [].slice.call(card.querySelectorAll("[data-attribution]")).forEach(function (note) {
          note.parentNode.removeChild(note);
          rescuedNotes.push(note);
        });
      }
    });
    if (rescuedNotes.length) {
      container.appendChild(h("div", { class: "card", "data-attribution-rescued": "1" }, [
        h("div", { class: "card-b" }, rescuedNotes)
      ]));
    }
  }

  // The opening prose of a card: leading paragraphs, plus a leading wrapper div
  // that holds nothing but paragraphs (how several cards emit multi-paragraph
  // narrative). Stops at the first table, chart, list or labelled block.
  function leadingProse(bodyEl) {
    if (!bodyEl) return [];
    var out = [];
    var kids = [].slice.call(bodyEl.children);
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.tagName === "P") { out.push(el); continue; }
      if (el.tagName === "DIV" && !el.className && el.children.length &&
          [].slice.call(el.children).every(function (ch) { return ch.tagName === "P"; })) {
        out.push(el); continue;
      }
      break;
    }
    return out;
  }

  function renderCapabilitySL(container, opts) {
    var engagement = opts.engagement;
    var instrument = opts.instrument;
    var taxonomy   = opts.taxonomy;
    var scoredCurrent = opts.scored;          // active target
    var scoredAll     = opts.scoredAll;       // all targets

    // The headline leads; the cover sheet closes the preview (see metadataCard).
    var target = opts.activeTarget;
    var posture = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Posture summary - " + (target ? target.name : "") }),
        legend()
      ]),
      h("div", { class: "card-b" }, [
        kpiCard(scoredCurrent, opts.targetProfile, instrument),
        h("div", { class: "spacer-12" }),
        h("p", { class: "muted", text: summaryHeadline(scoredCurrent, opts) })
      ])
    ]);
    container.appendChild(posture);

    // The capability vector states the headline claim in the standard's own
    // notation, and the scope card accounts for every requirement not assessed.
    // Both are opt-in per instrument (see slVectorCard / applicabilityCard).
    var vector = slVectorCard(scoredCurrent, taxonomy, instrument);
    if (vector) container.appendChild(vector);
    var blocking = blockingItemsCard(scoredCurrent, taxonomy, instrument);
    if (blocking) container.appendChild(blocking);
    var programme = programmeContextCard(instrument, opts.companionInstrumentIds);
    if (programme) container.appendChild(programme);
    var scopeCard = applicabilityCard(scoredCurrent, instrument);
    if (scopeCard) container.appendChild(scopeCard);
    // The framing, then the vocabulary, immediately after the headline that
    // uses it rather than in an appendix a confused reader would never reach.
    var about = aboutCard(instrument, opts.narrative);
    if (about) container.appendChild(about);
    var glossary = glossaryCard(instrument, taxonomy, opts.narrative, engagement);
    if (glossary) container.appendChild(glossary);

    // charts
    var charts = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "FR achievement vs target" })]),
      h("div", { class: "card-b" }, [
        h("div", { class: "report-grid" }, [
          (function () {
            var d = h("div", null, []);
            d.appendChild(window.App.Charts.radar(scoredCurrent, taxonomy, { size: 380 }));
            return d;
          })(),
          (function () {
            var d = h("div", null, []);
            d.appendChild(window.App.Charts.closenessBars(scoredCurrent, taxonomy, { width: 540 }));
            d.appendChild(h("div", { class: "spacer-12" }));
            d.appendChild(h("div", { class: "muted", text: "Closeness is the mean of per-requirement scores, excluding N/A. It is shown for context and does not change the achieved SL." }));
            return d;
          })()
        ])
      ])
    ]);
    container.appendChild(charts);

    // heatmap
    var heat = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Requirement heatmap" }), legend()]),
      h("div", { class: "card-b" }, [
        (function () { var d = h("div", null, []); d.appendChild(window.App.Charts.srHeatmap(scoredCurrent, taxonomy)); return d; })()
      ])
    ]);
    container.appendChild(heat);

    // FR breakdown
    var br = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "FR breakdown" })]),
      h("div", { class: "card-b" }, [frBreakdownTable(scoredCurrent, taxonomy)])
    ]);
    container.appendChild(br);

    container.appendChild(topGapsCard(scoredCurrent));

    // The counterpart to the gaps: what was established, and on what evidence.
    var inPlace = evidenceInPlaceCard(scoredCurrent, taxonomy, instrument);
    if (inPlace) container.appendChild(inPlace);

    var slPri = slPriorityCard(scoredCurrent, taxonomy, opts);
    if (slPri) container.appendChild(slPri);

    container.appendChild(slRoadmapCard(scoredCurrent, opts.planning));

    // The system-level picture comes before the per-zone comparison: a reader
    // should know what is true of the whole before reading a grid of zones.
    var sysCard = systemRollupCard(scoredAll, instrument, taxonomy);
    if (sysCard) container.appendChild(sysCard);

    var shared = sharedActionsCard(scoredAll, instrument, opts.planning);
    if (shared) container.appendChild(shared);

    var cross = crossTargetCard(scoredAll, taxonomy);
    if (cross) container.appendChild(cross);

    appendReportTail(container, opts);
  }

  // ---- glossary ----------------------------------------------------------
  //
  // The report is read by people who have never opened ISA/IEC 62443, and it
  // uses two vocabularies: the standard's (SL-T, FR, SR, zone) and its own
  // (floor finding, blocking item, closeness). Neither is guessable. One
  // compact reference, placed before the findings rather than in an appendix
  // nobody reaches, so a reader stuck on page four can carry on.
  //
  // Composed from the instrument and the narrative pack, so an instrument with
  // different nouns (a component rather than a zone, SL-C rather than SL-A)
  // gets the right words without a second copy of the text.
  // Terms every report shares, whatever it is assessing. Written once so the
  // same idea is not explained five slightly different ways.
  var COMMON_TERMS = {
    coverage: ["Coverage", "How much of the instrument was actually answered. A result drawn from a small share of it is a weaker read, so coverage is reported with the findings."],
    unknown: ["Unknown", "The position could not be established during the engagement. It lowers coverage and confidence; it is never treated as a pass or a failure."],
    na: ["Not applicable", "Excluded from the result because it cannot apply here, with the reason recorded against it."],
    notAssessed: ["Not assessed", "No position was established. Reported as a gap in coverage, never assumed to be in place."],
    roadmap: ["Roadmap", "The gaps, in the order the consultant judged they should be tackled. The consultant also sets the priority, owner, business impact and recommended action for each."],
    basis: ["Basis of assessment", "The interviews held, documents reviewed and systems observed. Each verdict rests on this record, and it allows the assessment to be repeated."]
  };

  // The glossary is one section like any other, so the consultant's own terms
  // live under the same key as its title, rename and hide.
  var GLOSSARY_KEY = "terms-used-in-this-report";
  var CONSULTANT_TERMS_HEADING = "Other terms used in this report";

  // Terms the consultant added for this engagement: site vocabulary, a client's
  // own name for a system, an acronym used in the interviews. Kept apart from
  // the framework definitions, which are not theirs to edit.
  function consultantTerms(engagement) {
    var custom = (engagement && engagement.reportCustom) || {};
    var list = (custom[GLOSSARY_KEY] || {}).terms;
    if (!Array.isArray(list)) return [];
    return list.filter(function (t) { return t && String(t.term || "").trim() !== ""; })
               .map(function (t) {
                 return { term: String(t.term).trim(), definition: String(t.definition || "").trim() };
               });
  }

  function glossaryBase(instrument, taxonomy, narrative) {
    if (!instrument) return [];
    var fam = instrument.scoringFamily;
    if (fam === "caf-achieved")          return glossaryCAF(instrument, narrative);
    if (fam === "domain-letter")         return glossaryDomainLetter(instrument, narrative);
    if (fam === "program-maturity-ml")   return glossaryProgramML(instrument, narrative);
    if (fam === "nis2-conformance")      return glossaryNIS2(instrument, narrative);
    if (fam === "csms-conformance")      return glossaryCSMS(instrument, narrative);
    if (fam === "capability-sl")         return glossaryCapabilitySL(instrument, taxonomy, narrative);
    if (fam === "risk-appetite-coherence") return glossaryRiskAppetite(instrument, narrative);
    return [];
  }

  // ---- risk-appetite-coherence -------------------------------------------
  // The band wording is read from the scoring profile, the same definitions the
  // capture pages show, so the glossary cannot drift from what was assessed.
  function glossaryRiskAppetite(instrument) {
    var RA = window.App.ScoringRiskAppetite;
    var shared = window.App.Data && window.App.Data.shared;
    var profile = shared && shared.scoringProfiles && instrument && shared.scoringProfiles[instrument.scoringProfileRef];
    var exp = RA ? RA.axisSpec(profile, "exposure") : { bands: [], bandDefinitions: {} };
    var app = RA ? RA.axisSpec(profile, "appetite") : { bands: [], bandDefinitions: {} };
    function bandRows(spec) {
      return spec.bands.map(function (b) { return [raTitle(b), spec.bandDefinitions[b] || ""]; });
    }
    return [
      { heading: "How the two positions are read",
        rows: [
          ["Inherent exposure", "What the organisation faces because of what it does and where it sits, which is largely outside its control."],
          ["Apparent appetite", "How much cyber risk the organisation is willing to carry in practice, which is a matter of choice."],
          ["Band", "One of four positions on either scale."]
        ] },
      { heading: "Exposure bands", rows: bandRows(exp) },
      { heading: "Appetite bands", rows: bandRows(app) },
      { heading: "The verdict", intro: "The bands at which each verdict applies are set out in How to read this report.", rows: [
          ["Warranted appetite", "The appetite that fits a given exposure."],
          ["Aligned", "Appetite and exposure are in proportion. There may still be things to improve."],
          ["Leaning", "Aligned, but one band away from the warranted appetite, towards under-protection or over-investment."],
          ["Under-protected", "Appetite is more tolerant than the exposure warrants. The organisation is carrying more risk than its position justifies."],
          ["Over-invested", "Appetite is more cautious than the exposure requires. The organisation may be spending money, or constraining operations, beyond what the risk calls for."],
          ["Stated and revealed appetite", "Stated appetite is the position described in interview. Revealed appetite is the position the systems themselves point to, taken from the optional technical review. A gap between the two is reported as a finding."],
          ["Managed constraint", "A technical reading that reflects a genuine operational limit, not a choice, such as firmware held back by a vendor's certification, where the risk is being compensated and tracked. It is reported but not counted as appetite; a limit that nobody is managing is still counted."],
          ["Not established", "Asked about during the engagement, but nobody could say. The reading is left out of the band. For appetite, not knowing is usually a finding; for exposure, it lowers confidence in the position."],
          COMMON_TERMS.basis
        ] }
    ];
  }

  function glossarySections(instrument, taxonomy, narrative, engagement) {
    var sections = glossaryBase(instrument, taxonomy, narrative);
    var extra = consultantTerms(engagement);
    if (!extra.length) return sections;
    return sections.concat([{
      heading: CONSULTANT_TERMS_HEADING,
      consultant: true,
      rows: extra.map(function (t) { return [t.term, t.definition]; })
    }]);
  }

  // ---- caf-achieved: CAF, NIST 800-53 / 800-82, CIS, ONR SyAPs -----------
  //
  // One family, five vocabularies: the instrument's own nouns decide whether
  // the reader is told about outcomes, controls, safeguards or expectations.
  function glossaryCAF(instrument, narrative) {
    var d = (instrument && instrument.display) || {};
    var C = window.App.ScoringCAF;
    var objective  = d.objectiveTitle || "Objective";
    var principle  = d.principleNoun || "Principle";
    var outcome    = (d.outcomesTitle || "Contributing outcomes").replace(/s$/, "");
    var profile    = d.profileTitle || "Profile";
    function lbl(state, fallback) {
      var s = C && C.stateLabelFor ? C.stateLabelFor(state, instrument) : null;
      return s || fallback;
    }
    var states = [
      [lbl("achieved", "Achieved"), "The " + outcome.toLowerCase() + " is in place and can be demonstrated."],
      [lbl("partially", "Partially achieved"), "Some of what is expected is in place, but not all of it. It is a gap, not a pass."],
      [lbl("not", "Not achieved"), "What is expected is not in place."],
      [COMMON_TERMS.unknown[0], COMMON_TERMS.unknown[1]],
      [COMMON_TERMS.na[0], COMMON_TERMS.na[1]]
    ];
    var structure = [
      [objective, "The top-level grouping this instrument divides the subject into. Results are reported per " + objective.toLowerCase() + " and never combined into a single score."],
      [principle, "A grouping within " + (/^[aeiou]/i.test(objective) ? "an " : "a ") + objective.toLowerCase() + ". Its result is a profile of the states beneath it."],
      [outcome, "The individual thing assessed. The consultant records exactly one state against each."],
      [profile, "The set of expectations applied. It decides which items are in scope and what state each is expected to reach, so the same assessment read against a different " + profile.toLowerCase() + " can give a different result."],
      ["Expected state", "The state the selected " + profile.toLowerCase() + " expects. Meeting expected means the recorded state is at or above it; below expected is what the roadmap addresses."]
    ];
    var terms = [
      ["No single score", "This instrument produces a profile, not a grade or a percentage. Counts of items meeting and below expectation are reported per " + objective.toLowerCase() + "; they are never averaged into one number."],
      COMMON_TERMS.coverage,
      COMMON_TERMS.notAssessed,
      COMMON_TERMS.roadmap,
      COMMON_TERMS.basis
    ];
    if ((narrative && narrative.boilerplate && narrative.boilerplate.ot_focus) || d.otLensLabel) {
      terms.splice(1, 0, ["OT lens", "A note on what the requirement means in an operational technology setting, where availability and safety constraints change what counts as good practice. It is advisory and never changes the score."]);
    }
    return [
      { heading: "How each item is judged", intro: "The consultant records one state per item, against the indicators of good practice for it.", rows: states },
      { heading: "How the assessment is structured", rows: structure },
      { heading: "Terms used in the findings", rows: terms }
    ];
  }

  // ---- domain-letter: OT posture screener, supplier screener -------------
  function glossaryDomainLetter(instrument, narrative) {
    var DL = window.App.ScoringDomainLetter;
    var noun = (instrument && instrument.display && instrument.display.domainNoun) || "domain";
    return [
      { heading: "How the grade works",
        intro: "Each question is scored on a four-point scale from the consultant's judgement of the answer, the questions roll up to a letter grade per " + noun + ", and the " + noun + "s roll up to one indicative headline grade.",
        rows: [
          ["A / B", "Strong. What is expected is in place and managed."],
          ["C / D", "Mixed. Parts are in place; there is material work to do."],
          ["E / F", "Weak. Little or nothing of what is expected is in place."],
          ["Indicative", "The grade is an early read from a structured interview, not a conformance assessment against a standard and not a regulatory determination. It points at where a detailed assessment should go."]
        ] },
      { heading: "How the headline is set", rows: [
          ["Headline grade", "The average across the graded " + noun + "s, then held down twice: it can sit at most two grades above the weakest graded " + noun + ", and the top grade is awarded only where every " + noun + " reaches it. So a single weak area cannot be averaged away by strong ones, and an A means uniformly strong rather than strong on average."],
          ["Provisional", "A " + noun + " answered below the coverage threshold is reported as provisional and is excluded from the headline, because it could not be graded with confidence. It still counts against overall coverage."],
          COMMON_TERMS.coverage,
          COMMON_TERMS.unknown
        ] },
      { heading: "Terms used in the findings", rows: [
          [noun.charAt(0).toUpperCase() + noun.slice(1), "One of the areas the interview is divided into. Each is graded and reported separately."],
          COMMON_TERMS.na,
          COMMON_TERMS.roadmap,
          COMMON_TERMS.basis
        ] }
    ];
  }

  // ---- program-maturity-ml: 62443-2-1:2024 -------------------------------
  function glossaryProgramML(instrument, narrative) {
    return [
      { heading: "The maturity levels",
        intro: "Each requirement is placed at one maturity level. The levels describe how established a practice is, not how good it is: a documented process that nobody follows is ML2, not ML3.",
        rows: [
          ["ML1 Initial", "Done ad hoc, if at all. It depends on individuals rather than on a process."],
          ["ML2 Managed", "Documented and repeatable. Documentation begins here."],
          ["ML3 Defined / Practiced", "Actively practised on the industrial automation and control system, not only written down."],
          ["ML4 Improving", "Measured, and improved on the basis of what the measurements show."],
          ["Not met", "The requirement is not satisfied at any level."]
        ] },
      { heading: "How the assessment is structured", rows: [
          [mlNoun(instrument, "elementNounTitle"),
           "The top-level grouping of the " + mlNoun(instrument, "programmeNoun") + ". Results are reported per " +
           mlNoun(instrument, "elementNoun").toLowerCase() + "."],
          ["Requirement", "The individual practice assessed. Each is placed at one maturity level, independently of the others."],
          ["Target maturity level", "The level the organisation is aiming at for that requirement. Results are read against it."],
          ["No single grade", "Results are a profile across the elements. Maturity levels are not averaged into one programme score."]
        ] },
      { heading: "Terms used in the findings",
        rows: [COMMON_TERMS.unknown, COMMON_TERMS.na, COMMON_TERMS.coverage, COMMON_TERMS.roadmap, COMMON_TERMS.basis] }
    ];
  }

  // ---- nis2-conformance ---------------------------------------------------
  function glossaryNIS2(instrument, narrative) {
    var N = window.App.ScoringNIS2;
    function lbl(s, f) { return (N && N.stateLabelFor ? N.stateLabelFor(s, instrument) : null) || f; }
    return [
      { heading: "How each obligation is judged",
        intro: "Each obligation is judged against full conformance with the Directive as transposed. The consultant records one state per obligation.",
        rows: [
          [lbl("achieved", "Achieved"), "The obligation is met and can be demonstrated."],
          [lbl("partially", "Partially achieved"), "Partly met. It is a gap, and it appears on the roadmap."],
          [lbl("not", "Not achieved"), "Not met."],
          [COMMON_TERMS.unknown[0], COMMON_TERMS.unknown[1]],
          [COMMON_TERMS.na[0], COMMON_TERMS.na[1]]
        ] },
      { heading: "How the assessment is structured", rows: [
          ["NIS2 area", "The grouping obligations are reported under. Results are a conformance profile per area."],
          ["Obligation", "The individual requirement assessed, drawn from the Directive."],
          ["Conformance percentage", "Shown for context only. It is not a pass mark, and it never substitutes for the profile of states."],
          ["Not a compliance determination", "This is a gap assessment against the Directive's obligations. It is not a legal opinion, and it is not a determination by a competent authority."]
        ] },
      { heading: "Terms used in the findings",
        rows: [COMMON_TERMS.coverage, COMMON_TERMS.roadmap, COMMON_TERMS.basis] }
    ];
  }

  // ---- csms-conformance: 62443-2-1:2010, EU CRA, EU Machinery ------------
  function glossaryCSMS(instrument, narrative) {
    var isLayered = !!(instrument && instrument.layers && instrument.layers.length);
    var CS = window.App.ScoringCSMS;
    function lbl(s, f) { return (CS && CS.stateLabelFor ? CS.stateLabelFor(s, null) : null) || f; }
    var states = [
      [lbl("in-place", "In place"), "Fully in place and demonstrable."],
      [lbl("largely", "Largely in place"), "Mostly in place, with identified shortfalls."],
      [lbl("partially", "Partially in place"), "Some of it is in place. It is a gap."],
      [lbl("not", "Not in place"), "Not in place."],
      [COMMON_TERMS.unknown[0], COMMON_TERMS.unknown[1]],
      [COMMON_TERMS.na[0], COMMON_TERMS.na[1]]
    ];
    var structure = [
      ["Category", "The top-level grouping. Results are reported per category and never combined into a single score."],
      ["Element", "The individual requirement assessed. The consultant records one state against each."],
      ["Conformance percentage", "Shown for context only. It is not a pass mark and never replaces the profile of states."]
    ];
    if (isLayered) {
      structure.unshift(["Layer", "This assessment is divided into layers that are judged separately and never blended, because they answer to different parties: what the product must do, what the manufacturer's process must do, and what must be reported."]);
      structure.push(["Classification", "The product class determines which requirements and which conformity route apply. It is set during setup and drives the whole assessment."]);
    }
    return [
      { heading: "How each item is judged", intro: "Each item is judged against full conformance. The consultant records one state per item.", rows: states },
      { heading: "How the assessment is structured", rows: structure },
      { heading: "Terms used in the findings",
        rows: [COMMON_TERMS.coverage, COMMON_TERMS.notAssessed, COMMON_TERMS.roadmap, COMMON_TERMS.basis] }
    ];
  }

  // ---- capability-sl: 62443-3-3 and -4-2 ---------------------------------
  function glossaryCapabilitySL(instrument, taxonomy, narrative) {
    var d = (instrument && instrument.display) || {};
    var reqNoun = d.requirementNoun || "system requirement";
    var reqAbbr = /component/.test(reqNoun) ? "CR" : "SR";
    var spec = d.slVector || {};
    var achievedLabel = spec.label || "SL-A";
    var qualifier = spec.qualifier ? " (" + spec.qualifier + ")" : "";
    var scopeNoun = (instrument && instrument.targetDimensionLabel) || "";
    var isZoned = /zone/i.test(scopeNoun);
    var fn = (narrative && narrative.fr_narrative) || {};

    var levels = [
      ["SL 0", "No protection claimed. The requirement is not in place, or the level below SL 1 could not be reached."],
      ["SL 1", "Protection against casual or coincidental violation: a mistake, or someone wandering in without trying."],
      ["SL 2", "Protection against intentional violation using simple means: low resources, generic skills, low motivation."],
      ["SL 3", "Protection against sophisticated means, moderate resources, system-specific skills and moderate motivation."],
      ["SL 4", "Protection against sophisticated means, extended resources, system-specific skills and high motivation."]
    ];

    var notation = [
      ["SL-T (target)", "The Security Level the environment calls for. It is chosen by the asset owner from the consequence of a compromise, not by this assessment, and it is what every result is judged against."],
      [achievedLabel + qualifier, spec.label === "SL-C"
        ? "The Security Level the component is capable of, as built and configured. It is what the product can do, independent of how it is deployed."
        : "The Security Level actually reached, as the system is configured and operated. This is the result of the assessment."],
      ["SL vector", "The seven levels written together, one per Foundational Requirement, in the notation the standard uses: { IAC 2  UC 2  SI 1  ... }. It is read against the target vector."]
    ];

    var structure = [
      ["Foundational Requirement (FR)", "One of seven groupings the standard divides security into. Each is judged and reported separately; they are never combined into a single score."],
      [reqNoun.charAt(0).toUpperCase() + reqNoun.slice(1) + " (" + reqAbbr + ")",
       "An individual requirement within a Foundational Requirement. There are " +
       ((instrument && instrument.requirements && instrument.requirements.length) || "") + " of them in this instrument."],
      ["Requirement enhancement (RE)", "An addition to a requirement that the standard brings in at a higher Security Level. A requirement can therefore be fully in place for SL 1 and incomplete for SL 2."],
      ["Item", "The unit actually assessed: the base requirement, plus each requirement enhancement, judged separately. The Security Level is computed from those judgements rather than entered directly."]
    ];
    if (isZoned) {
      structure.push(["Zone", "A grouping of assets with a common security requirement, defined under ISA/IEC 62443-3-2. Each zone is assessed against its own target and reported separately."]);
      structure.push(["Conduit", "The communication path between zones, and the controls on it. Assessed in the same way as a zone."]);
    }

    var terms = [
      ["Weakest link", "The achieved Security Level of a Foundational Requirement is set by its weakest item. Nothing is averaged, so one shortfall holds the level down however strong everything else is."],
      ["Floor finding", "A requirement that is not in place at all, or that sits two or more Security Levels below its target. It offers little or no protection where protection is required, so it is treated as a priority."],
      ["Blocking item", "The specific item holding a Foundational Requirement below its target. Closing exactly the blocking items, and nothing else, raises that Foundational Requirement to the next level."],
      ["Closeness", "The share of assessed items that are satisfied. Shown for context only: it never raises a Security Level, and a high closeness with one item missing still means the target is not met."],
      ["Compensating countermeasure", "Something outside the requirement that delivers the same outcome. It counts toward the level, and is reported separately as well, because a compensating measure is usually the first thing to lapse."],
      ["Not applicable", "Excluded from the result because it cannot apply here, with the reason recorded against it. Without a recorded reason it counts as not assessed instead."],
      ["Not assessed", "No position was established. It is reported as a gap in coverage, never assumed to be in place."]
    ];
    if (isZoned) {
      terms.push(["Shared answer", "A countermeasure implemented once and used by more than one zone, such as one directory service or one log collector. It is recorded once and applies to the zones it reaches, unless a zone records an answer of its own, which overrides it there."]);
    }

    var frRows = ((taxonomy && taxonomy.frs) || []).map(function (fr) {
      var narr = fn[fr.id] || {};
      return [fr.id + " " + fr.name + (fr.abbr ? " (" + fr.abbr + ")" : ""), narr.purpose || ""];
    });

    var out = [
      { heading: "Security Levels", intro: "A Security Level describes the strength of attacker a system is expected to withstand. It is not a score out of four: each level names a class of threat.", rows: levels },
      { heading: "How levels are written", rows: notation },
      { heading: "The seven Foundational Requirements", rows: frRows },
      { heading: "How the assessment is structured", rows: structure },
      { heading: "Terms used in the findings", rows: terms }
    ];
    return out.filter(function (s) { return s.rows && s.rows.length; });
  }

  // What this assessment is, and where the part sits in the 62443 series.
  // The Word report has carried this since it was written; the screen preview
  // never did, which left the on-screen glossary explaining the vocabulary of
  // a standard the reader had not been introduced to.
  function aboutCard(instrument, narrative) {
    if (!instrument) return null;
    var b = (narrative && narrative.boilerplate) || {};
    var d = instrument.display || {};
    // Each family keeps its framing in a different place; take whichever the
    // instrument actually carries rather than making every renderer know.
    var paras = [
      b.about_instrument || b.about_caf || d.about || instrument.framing,
      // Where this framework sits and who publishes it. Instruments with a
      // narrative pack carry it there; the layered ones, which have no pack,
      // carry it on the instrument.
      b.series_context || instrument.seriesContext,
      b.security_levels,
      b.implementation_context
    ].filter(Boolean);
    var note = attributionNote(instrument);
    if (!paras.length && !note) return null;
    var body = paras.map(function (t, i) {
      return h("p", { style: i === 0 ? "margin-top:0;" : "", text: t });
    });
    if (note) body.push(note);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "About this assessment" })]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  // The licence notice for the framework text an instrument reproduces (the
  // CAF and ONR under the Open Government Licence, the CIS Controls under their
  // terms of use, NIST as a US Government work). Quoting that text is
  // conditional on the notice travelling with it, and the report quotes it, so
  // the notice is printed exactly as the instrument states it: never reworded,
  // never summarised. The usual form is a string. An object is read text-first
  // and then every other field in the order given, so a richer form added
  // later still prints in full rather than as "[object Object]" or not at all.
  function attributionLines(instrument) {
    var a = instrument && instrument.attribution;
    var out = [];
    function add(v) { if (typeof v === "string" && v.trim() !== "") out.push(v); }
    if (typeof a === "string") add(a);
    else if (Array.isArray(a)) a.forEach(add);
    else if (a && typeof a === "object") {
      add(a.text);
      Object.keys(a).forEach(function (k) { if (k !== "text") add(a[k]); });
    }
    return out;
  }

  // Null when the instrument quotes nothing, so no empty block is drawn.
  //
  // A classed div rather than more paragraphs: leadingProse reads a run of
  // bare <p> (or an unclassed div of them) as the section's editable wording,
  // and a consultant rewriting the About text must not be able to delete the
  // licence notice along with it. Placed after the prose, it survives a
  // rewrite untouched.
  function attributionNote(instrument) {
    var lines = attributionLines(instrument);
    if (!lines.length) return null;
    return h("div", { class: "muted", "data-attribution": "1", style: "margin-top:12px; font-size:12.5px;" },
      lines.map(function (t, i) {
        return h("p", { style: "margin:" + (i ? "4px" : "0") + " 0 0;", text: t });
      }));
  }

  // The same notice on the About cards some families build for themselves
  // (the CAF's "About the CAF", the plain framing card of the ML, NIS2 and
  // CSMS reports). With one of those on the page aboutCard is never drawn, so
  // without this the notice would go missing exactly where the quoting is.
  function withAttribution(card, instrument) {
    var note = card && attributionNote(instrument);
    if (!note) return card;
    var bodyEl = [].slice.call(card.children).filter(function (ch) {
      return ch.classList && ch.classList.contains("card-b");
    })[0];
    if (bodyEl) bodyEl.appendChild(note);
    return card;
  }

  // Every report closes the same way: the framing a newcomer needs, then the
  // vocabulary, then the cover details. Which of those are already on the page
  // depends on the family, so this is the one place that knows.
  //
  // capability-sl places both earlier, next to the headline vocabulary they
  // explain. Everything else gets them here - and whether an About card is
  // already on the page is decided by looking, not by a table of families
  // that goes stale the moment a renderer changes.
  // Advice recorded against something that is NOT a gap.
  //
  // The roadmap is built from shortfalls, so a recommendation typed against an
  // item that meets its target was saved and then never seen by anyone. That
  // made the capture box a trap. These are reported separately rather than
  // folded into the roadmap: they are not outstanding work, and a client
  // reading the roadmap as a to-do list should not find items in it that are
  // already met.
  //
  // Works off the raw responses, so it is family-agnostic: every family stores
  // the plan on the response as owner / action / impact / priorityBand.
  function furtherRecommendations(opts) {
    var scored = opts.scored;
    if (!scored) return [];
    var onRoadmap = {};
    (scored.roadmap || []).forEach(function (r) {
      onRoadmap[r.itemId || r.requirementId || r.id] = true;
    });
    var inst = opts.instrument || {};
    var catalogue = inst.requirements || inst.outcomes || inst.items || inst.questions || [];
    var byId = {};
    catalogue.forEach(function (c) { byId[c.id] = c; });
    var tid = opts.activeTarget && opts.activeTarget.id;
    return (((opts.engagement || {}).responses) || []).filter(function (r) {
      if (tid && r.targetId !== tid) return false;
      if (onRoadmap[r.requirementId]) return false;
      return String(r.action || "").trim() !== "";
    }).map(function (r) {
      var c = byId[r.requirementId] || {};
      return {
        code: c.code || c.id || r.requirementId,
        id: r.requirementId,
        title: c.title || c.name || c.prompt || "",
        action: r.action, owner: r.owner || "", impact: r.impact || "",
        band: r.priorityBand || ""
      };
    });
  }

  // A row the consultant can open to edit the plan behind it. Same gesture as
  // the remediation roadmap - click or Enter - so advice on something already
  // met is as editable as advice on a gap.
  function wirePlanRow(tr, id, edit) {
    if (!edit) return tr;
    tr.classList.add("plan-row");
    tr.setAttribute("tabindex", "0");
    tr.title = "Click to edit this recommendation";
    tr.addEventListener("click", function () { edit(id); });
    tr.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); edit(id); }
    });
    return tr;
  }

  function furtherRecommendationsCard(opts) {
    var rows = furtherRecommendations(opts);
    if (!rows.length) return null;
    var edit = opts.planning && opts.planning.editFurther;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Further recommendations" }),
        h("span", { class: "sub", text: "advice recorded where the target is already met" })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text:
          "These are not gaps and are not counted as outstanding work. They are recorded because the assessor judged them worth doing anyway." +
          (edit ? " Click a row to edit it." : "") }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", { text: "Item" }),
            h("th", { text: "Recommended action" }),
            h("th", { text: "Owner" }),
            h("th", { class: "center", text: "Priority" })
          ])]),
          h("tbody", null, rows.map(function (r) {
            return wirePlanRow(h("tr", null, [
              h("td", null, [h("strong", { text: r.code }), h("span", { text: " " + r.title })]),
              h("td", null, [
                h("div", { text: r.action }),
                r.impact ? h("div", { class: "muted", style: "font-size:12.5px;", text: r.impact }) : null
              ]),
              h("td", { text: r.owner || "-" }),
              h("td", { class: "center", text: r.band ? (r.band.charAt(0).toUpperCase() + r.band.slice(1)) : "-" })
            ]), r.id, edit);
          }))
        ])
      ])
    ]);
  }

  // Scaffolding for the next steps: a first draft assembled from what the
  // assessment already knows, so the consultant edits rather than starts from
  // an empty box. Lines in [square brackets] are prompts, not statements -
  // they render red in both outputs so an unedited one cannot slip past.
  //
  // Only ever a DEFAULT. The moment the consultant saves anything (including
  // an empty box, which is how they throw the scaffold away) their text wins.
  function defaultNextSteps(opts, engagement) {
    opts = opts || {};
    var scored = opts.scored || {};

    // Risk appetite has no roadmap and no weakest domain, so the generic draft
    // below would only say "agree which findings to take forward". What follows
    // this report is a board decision, and what that decision is depends on the
    // verdict, so the draft comes from the narrative pack, chosen by verdict.
    if (opts.instrument && opts.instrument.scoringFamily === "risk-appetite-coherence") {
      var S = raNarrative(null, opts.instrument, engagement).next_steps_scaffold || {};
      var vkey = (scored.verdict && scored.verdict.key) || "incomplete";
      if (S[vkey] && S[vkey].length) return S[vkey].slice();
    }

    // A requirement still to assess (capability-sl) is on the roadmap so the
    // work list is complete, but it is not a remediation action and is not
    // counted as one.
    var toAssessN = (scored.roadmap || []).filter(function (r) { return r.toAssess; }).length;
    var road = (scored.roadmap || []).filter(function (r) { return !r.toAssess; });
    var lines = [];

    // 1. Ownership. True of every assessment in every family.
    if (road.length) {
      lines.push("Agree an owner and a target date for each of the " + road.length +
        " action" + (road.length === 1 ? "" : "s") +
        " on the roadmap above, and record them in the client's own tracker.");
    } else {
      lines.push("Agree with the client which of the findings in this report will be " +
        "taken forward, with an owner and a target date for each.");
    }
    if (toAssessN) {
      lines.push("Complete the assessment of " + (toAssessN === 1 ? "the requirement" : "the " + toAssessN + " requirements") +
        " marked To assess on the roadmap, so the result can be confirmed.");
    }

    // 2. Sequencing, but only once the consultant has banded the work - before
    //    that there is no "highest priority" to point at.
    var top = road.filter(function (r) {
      var b = String(r.priorityBand || "").toLowerCase();
      return b === "critical" || b === "high";
    }).length;
    if (top) {
      lines.push("Start with the " + top + " action" + (top === 1 ? "" : "s") +
        " rated High or Critical; the remainder can follow in the next planning cycle.");
    }

    // 3. The weakest area, where the scoring names one (domain-letter). Every
    //    domain tied at the lowest grade, or the step names one of several and
    //    the rest quietly go unaddressed.
    var weakAll = scored.weakestDomains ||
      (scored.weakestDomain ? [scored.weakestDomain] : []);
    var wNames = weakAll.map(function (w) {
      return String(w.title || w.name || w.label || w.id || "").toLowerCase();
    }).filter(Boolean);
    if (wNames.length) {
      lines.push("Commission a detailed assessment of " + joinNames(wNames) +
        (wNames.length === 1 ? ", which is the weakest area in this read."
                             : ", which are tied as the weakest areas in this read."));
    }

    // 4. The two things only the consultant in the room can supply.
    lines.push("[Add what was agreed during this engagement: workshops, design work, " +
      "supplier conversations, and the dates set for them.]");
    lines.push("[Confirm who receives progress reporting on these actions, and how often.]");

    // 5. Closing the loop. The instrument is not named: a re-assessment is
    //    against the same one by definition, and several titles already end in
    //    "Assessment", which reads badly in the sentence.
    lines.push("Re-assess in twelve months, so movement against this baseline can be measured.");
    return lines;
  }

  // A scaffold line the consultant has to act on, rather than a proposed step.
  function nextStepsIsPrompt(line) {
    return /^\[.*\]$/.test(String(line || "").trim());
  }

  // What happens after the report: the consultant's own words, on every
  // instrument. Free text, but a multi-line entry renders as a list, because
  // next steps are almost always a list and typing one is easier than
  // formatting one.
  //
  // Never touched (undefined) means "give them the scaffold". Saved as empty
  // means "the consultant deliberately cleared it" and prints the placeholder -
  // which is why this tests for null rather than falsiness.
  function nextStepsLines(engagement, opts) {
    var rn = (engagement && engagement.reportNarrative) || {};
    if (rn.nextSteps == null) return defaultNextSteps(opts, engagement);
    var raw = String(rn.nextSteps).trim();
    if (!raw) return [];
    return raw.split(/\r?\n/)
      .map(function (l) { return l.replace(/^\s*[-*•]\s*/, "").trim(); })
      .filter(function (l) { return l !== ""; });
  }

  function nextStepsIsScaffold(engagement) {
    var rn = (engagement && engagement.reportNarrative) || {};
    return rn.nextSteps == null;
  }

  function nextStepsCard(opts) {
    var lines = nextStepsLines(opts.engagement, opts);
    var body;
    if (!lines.length) {
      // Shown rather than hidden: a blank section is a prompt to the consultant
      // that the report is not finished, and it matches the Word placeholder.
      body = h("p", { class: "muted placeholder-note", style: "margin:0;", text:
        "Not yet written. Set out the proposed next steps on the report page so the document does not go out with this section empty." });
    } else if (lines.length === 1 && !nextStepsIsPrompt(lines[0])) {
      body = h("p", { style: "margin:0;", text: lines[0] });
    } else {
      body = h("ul", { class: "tight" }, lines.map(function (l) {
        return h("li", nextStepsIsPrompt(l) ? { class: "placeholder-note" } : null, [l]);
      }));
    }
    var scaffold = nextStepsIsScaffold(opts.engagement) && lines.length;
    // data-next-steps marks this as the one section whose wording lives on
    // reportNarrative rather than on a section override, and data-prose-block
    // tells the editor which node to swap - the steps are a list, not the run
    // of paragraphs the generic rule looks for.
    return h("div", { class: "card", "data-next-steps": "1" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Proposed next steps" }),
        h("span", { class: "sub", text: scaffold
          ? "a suggested starting point; edit it"
          : "the consultant's recommendation for what happens now" })
      ]),
      h("div", { class: "card-b" }, [h("div", { "data-prose-block": "1" }, [body])])
    ]);
  }

  function appendReportTail(container, opts) {
    var further = furtherRecommendationsCard(opts);
    if (further) container.appendChild(further);
    container.appendChild(nextStepsCard(opts));
    var fam = (opts.instrument && opts.instrument.scoringFamily) || "";
    if (fam !== "capability-sl") {
      if (!/About this assessment|About the CAF/.test(container.textContent || "")) {
        var about = aboutCard(opts.instrument, opts.narrative);
        if (about) container.appendChild(about);
      }
      var gloss = glossaryCard(opts.instrument, opts.taxonomy, opts.narrative, opts.engagement);
      if (gloss) container.appendChild(gloss);
    }
    container.appendChild(metadataCard(opts.engagement, opts.instrument));
  }

  function glossaryCard(instrument, taxonomy, narrative, engagement) {
    var sections = glossarySections(instrument, taxonomy, narrative, engagement);
    if (!sections.length) return null;
    return h("div", { class: "card", "data-terms": "1" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Terms used in this report" })
      ]),
      h("div", { class: "card-b" }, sections.map(function (sec) {
        return h("div", sec.consultant ? { class: "glossary-section", "data-terms-group": "1" }
                                       : { class: "glossary-section" }, [
          h("h3", { text: sec.heading }),
          sec.intro ? h("p", { class: "muted", style: "margin:2px 0 8px;", text: sec.intro }) : null,
          h("table", { class: "tbl glossary" }, [
            h("tbody", null, sec.rows.map(function (r) {
              return h("tr", null, [
                h("th", { scope: "row", text: r[0] }),
                h("td", { text: r[1] })
              ]);
            }))
          ])
        ]);
      }))
    ]);
  }

  // ---- the system as a whole --------------------------------------------
  //
  // Composed from Scoring.systemRollup so the screen and the Word document say
  // the same thing. Deliberately makes no claim the standard does not support:
  // there is no SL-A for a system made of zones, only a position per zone and
  // the pattern across them.
  function joinNames(list) {
    if (!list || !list.length) return "";
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }
  function joinFRs(frs) {
    return joinNames((frs || []).map(function (f) { return f.frId; }));
  }
  function frWord(n) { return n === 1 ? "Foundational Requirement" : "Foundational Requirements"; }

  function systemRollupLines(rollup, instrument) {
    if (!rollup || rollup.zoneCount < 2) return [];
    var noun = ((instrument && instrument.targetDimensionLabel) || "zone").toLowerCase();
    var plural = pluralLower((instrument && instrument.targetDimensionLabel) || "zone", instrument);
    var lines = [];

    // 1. How much of the system is where it needs to be.
    var metN = rollup.zonesMeetingTarget.length;
    var shortN = rollup.zonesShort.length;
    // Met so far, with Foundational Requirements still to assess. Neither met
    // nor short, so these zones get a sentence of their own and are kept out
    // of the "all meet" and "none meets" claims, which would otherwise be
    // made about zones only partly looked at.
    var incomplete = rollup.zonesIncomplete || [];
    var incN = incomplete.length;
    var assessedN = metN + shortN + incN;
    if (assessedN === 0) {
      lines.push("None of the " + rollup.zoneCount + " " + plural + " in scope has been assessed yet.");
      return lines;
    }
    if (incN > 0) {
      var parts = [];
      if (metN) parts.push(joinNames(rollup.zonesMeetingTarget) + (metN === 1 ? " meets its" : " meet their") +
                           " target Security Level across every Foundational Requirement.");
      if (shortN) parts.push(joinNames(rollup.zonesShort) + (shortN === 1 ? " falls short of its" : " fall short of their") +
                             " target Security Level.");
      // A zone with a Foundational Requirement answered only in part cannot
      // be said to meet its target in every FR assessed, nor to have its
      // other FRs unassessed: nothing answered there falls short, and it is
      // not yet fully assessed, which is all that is said.
      var partlyZones = {};
      (rollup.frs || []).forEach(function (f) {
        (f.incomplete || []).forEach(function (n) { partlyZones[n] = true; });
      });
      var anyPartly = incomplete.some(function (n) { return partlyZones[n]; });
      if (anyPartly) {
        parts.push(joinNames(incomplete) + (incN === 1 ? " has" : " have") + " nothing short of " +
                   (incN === 1 ? "its" : "their") + " target so far, but " + (incN === 1 ? "is" : "are") +
                   " not yet fully assessed.");
      } else {
        // "its other FRs", not "the rest": in a sentence listing zones, "the
        // rest" reads as the remaining zones.
        parts.push(joinNames(incomplete) + (incN === 1 ? " meets its" : " meet their") +
                   " target in every Foundational Requirement assessed so far; " +
                   (incN === 1 ? "its" : "their") + " other Foundational Requirements have not been assessed yet.");
      }
      lines.push(parts.join(" "));
    } else if (assessedN === 1) {
      // One zone assessed and the rest untouched: name it, rather than "all 1
      // assessed zones" or "none of the 1".
      lines.push("The one assessed " + noun + ", " + joinNames(metN ? rollup.zonesMeetingTarget : rollup.zonesShort) + ", " +
                 (metN ? "meets" : "falls short of") + " its target Security Level" +
                 (metN ? " across every Foundational Requirement." : "."));
    } else if (shortN === 0) {
      lines.push("All " + assessedN + " assessed " + plural + " meet their target Security Level across every Foundational Requirement.");
    } else if (metN === 0) {
      lines.push("None of the " + assessedN + " assessed " + plural + " meets its target Security Level across every Foundational Requirement. " +
                 (shortN === 1 ? "The one short is " : "Those short are ") + joinNames(rollup.zonesShort) + ".");
    } else {
      lines.push(metN + " of the " + assessedN + " assessed " + plural + " meet their target Security Level across every Foundational Requirement (" +
                 joinNames(rollup.zonesMeetingTarget) + "). " +
                 (shortN === 1 ? joinNames(rollup.zonesShort) + " does not." : joinNames(rollup.zonesShort) + " do not."));
    }
    if (rollup.zonesNotAssessed.length) {
      lines.push(joinNames(rollup.zonesNotAssessed) + " " +
                 (rollup.zonesNotAssessed.length === 1 ? "has" : "have") + " not been assessed and " +
                 (rollup.zonesNotAssessed.length === 1 ? "is" : "are") + " excluded from the statements above.");
    }

    // 2. Which weaknesses are system-wide and which belong to one zone. This
    //    is the distinction that decides whether a fix is one job or several.
    var short_ = rollup.shortEverywhere, met = rollup.metEverywhere, mixed = rollup.mixed;
    function named(frs) {
      return joinNames(frs.map(function (f) { return f.frId + " " + f.name.toLowerCase(); }));
    }
    if (short_.length) {
      lines.push(named(short_) + " " + (short_.length === 1 ? "falls" : "fall") +
                 " short of target in every assessed " + noun + ". " +
                 (short_.length === 1 ? "This is a system-wide weakness, so the fix is one piece of work."
                                      : "These are system-wide weaknesses, so each is one piece of work."));
    }
    if (met.length) {
      lines.push(named(met) + " " + (met.length === 1 ? "meets its target" : "meet their targets") +
                 " in every assessed " + noun + ".");
    }
    // Nothing short anywhere it was answered, but some zone still has items
    // to assess in it: not "met in every zone".
    var soFar = rollup.metSoFar || [];
    if (soFar.length) {
      var soFarZones = [];
      soFar.forEach(function (f) {
        (f.incomplete || []).forEach(function (n) { if (soFarZones.indexOf(n) === -1) soFarZones.push(n); });
      });
      lines.push(named(soFar) + " " + (soFar.length === 1 ? "has" : "have") + " nothing short in any assessed " + noun +
                 " so far, but " + (soFar.length === 1 ? "is" : "are") + " not yet fully assessed in " + joinNames(soFarZones) + ".");
    }
    if (mixed.length) {
      lines.push(mixed.map(function (f) {
        var inc = f.incomplete || [];
        if (!inc.length) return f.frId + " is met in " + joinNames(f.met) + " but short in " + joinNames(f.short);
        var segs = [];
        if (f.met.length) segs.push("met in " + joinNames(f.met));
        segs.push("short in " + joinNames(f.short));
        segs.push("not yet fully assessed in " + joinNames(inc));
        return f.frId + " is " + segs.slice(0, -1).join(", ") + " and " + segs[segs.length - 1];
      }).join("; ") + ". " + (mixed.length === 1 ? "That difference is" : "Those differences are") +
        " local to the " + plural + " named, so the remedy is too.");
    }

    // 3. Floor findings, which are the ones that mean little or no protection.
    //
    // Counted as REQUIREMENTS, not as zone occurrences. A gap answered on the
    // shared layer is inherited by every zone that depends on it, so the old
    // occurrence count told a client there were 32 things to fix when there
    // were 14, and closing one of them moved the number by one.
    var distinct = rollup.floorRequirementCount || 0;
    if (distinct > 0) {
      var occ = rollup.floorOccurrences || distinct;
      var line = distinct + " " + (distinct === 1 ? "requirement sits" : "requirements sit") +
                 " at floor across the assessed " + plural;
      if (occ > distinct) {
        line += ", appearing " + occ + " times in total because a shared gap is inherited by every " +
                noun + " that depends on it";
      }
      line += ". A floor finding means the requirement is not in place at all, " +
              "so it offers little or no protection where protection is required.";
      lines.push(line);
      var sharedN = rollup.floorSharedCount || 0;
      if (sharedN > 0) {
        lines.push(sharedN === distinct
          ? (distinct === 1 ? "That gap is answered on the shared layer, so closing it is one piece of work rather than one per " + noun + "."
                            : "All of them are answered on the shared layer, so each is one piece of work rather than one per " + noun + ".")
          : sharedN + " of the " + distinct + " are answered on the shared layer, so closing " +
            (sharedN === 1 ? "it is" : "each of those is") + " one piece of work rather than one per " + noun +
            "; the " + (distinct - sharedN === 1 ? "remaining one belongs" : "remaining " + (distinct - sharedN) + " belong") +
            " to a single " + noun + ".");
      }
    }
    return lines;
  }

  // Per-FR pattern across the zones: the table behind the prose.
  function systemRollupRows(rollup) {
    return (rollup && rollup.frs) || [];
  }

  var ROLLUP_VERDICT = {
    "met-everywhere":   { label: "Met in all",     cls: "met" },
    "short-everywhere": { label: "Short in all",   cls: "gap" },
    "mixed":            { label: "Mixed",          cls: "near" },
    "met-so-far":       { label: "Met so far",     cls: "near" },
    "unassessed":       { label: "Not assessed",   cls: "na" }
  };

  function systemRollupCard(scoredAll, instrument, taxonomy) {
    var rollup = scoredAll && scoredAll.systemRollup;
    if (!rollup || rollup.zoneCount < 2) return null;
    var lines = systemRollupLines(rollup, instrument);
    var plural = pluralLower((instrument && instrument.targetDimensionLabel) || "zone", instrument);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "The system as a whole" }),
        h("span", { class: "sub", text: "before the " + plural + " are taken one at a time" })
      ]),
      h("div", { class: "card-b" }, [
        h("div", null, lines.map(function (t, i) {
          return h("p", { style: i === 0 ? "margin-top:0;" : "", text: t });
        })),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", { text: "FR" }),
            h("th", { class: "center", text: "Across " + plural }),
            h("th", { class: "center", text: "Met in" }),
            h("th", { class: "center", text: "Lowest achieved" }),
            h("th", { text: "Short in" })
          ])]),
          h("tbody", null, systemRollupRows(rollup).map(function (f) {
            var v = ROLLUP_VERDICT[f.verdict] || ROLLUP_VERDICT.unassessed;
            return h("tr", null, [
              h("td", null, [h("strong", { text: f.frId }), h("span", { class: "muted", text: " " + f.name })]),
              h("td", { class: "center" }, [bandPill(v.cls, v.label)]),
              h("td", { class: "center", text: f.assessedZones ? (f.met.length + " / " + f.assessedZones) : "-" }),
              h("td", { class: "center", text: f.lowestAchieved === null ? "-" : S.formatSL(f.lowestAchieved) }),
              h("td", { class: "small", text: f.short.length ? f.short.join(", ") : "-" })
            ]);
          }))
        ]),
        h("p", { class: "muted", style: "margin:10px 0 0;", text:
          "\"Lowest achieved\" is the weakest position across the assessed " + plural +
          ". It is a floor, not a Security Level held by the system: ISA/IEC 62443-3-3 assigns an achieved Security Level to a " +
          ((instrument && instrument.targetDimensionLabel) || "zone").toLowerCase() +
          ", and nothing here averages or combines them." })
      ])
    ]);
  }

  // ---- actions that span zones ------------------------------------------
  //
  // A countermeasure implemented once for the whole system produces one gap,
  // not one per zone. Repeating the same paragraph under every zone buries the
  // zone-specific findings and invites four owners for one piece of work, so a
  // shared gap is written once here with the zones it resolves.
  function sharedActionLines(scoredAll) {
    return (scoredAll && scoredAll.sharedRoadmap) || [];
  }

  function sharedActionsCard(scoredAll, instrument, planning) {
    var rows = sharedActionLines(scoredAll);
    if (!rows.length) return null;
    var edit = planning && planning.editShared;
    var noun = (instrument && instrument.targetDimensionLabel) || "zone";
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Actions that span " + pluralLower(noun, instrument) }),
        h("span", { class: "sub", text: "answered once, shared" })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text:
          "These requirements are met or missed by something implemented once and shared, so each is one piece of work rather than one per " +
          String(noun).toLowerCase() + ". A shared countermeasure does not always reach every " +
          String(noun).toLowerCase() + ", so the ones each action resolves are named, with that " +
          String(noun).toLowerCase() + "'s own target Security Level." +
          (edit ? " Click a row to write the action once for every " + String(noun).toLowerCase() + " it reaches." : "") }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", { text: "Requirement" }),
            h("th", { text: "Recommended action" }),
            h("th", { text: "Owner" }),
            h("th", { text: "Resolves" })
          ])]),
          h("tbody", null, rows.map(function (r) {
            var noAction = !String(r.action || "").trim();
            return wirePlanRow(h("tr", null, [
              h("td", null, [
                h("strong", { text: (r.code ? r.code + " " : "") + r.title }),
                h("div", { class: "muted small", text: r.frId + (r.blocks ? "  ·  blocking" : "") }),
                r.impact ? h("div", { class: "small", style: "margin-top:4px;" }, [h("strong", { text: "Impact: " }), r.impact]) : null
              ]),
              h("td", { class: "small" + (noAction ? " placeholder-note" : ""),
                text: r.action || "To be completed by the consultant" }),
              h("td", { class: "small" + (!String(r.owner || "").trim() ? " placeholder-note" : ""),
                text: r.owner || "To be assigned" }),
              h("td", null, [h("ul", { class: "tight" }, r.affected.map(function (a) {
                return h("li", { class: "small", text: a.name + " (target " + S.formatSL(a.targetSL) +
                  ", currently " + S.formatSL(a.itemsAchieved) + ")" });
              }))])
            ]), r.requirementId, edit);
          }))
        ])
      ])
    ]);
  }

  // The standard an instrument assesses, taken from its own title rather than
  // hardcoded per family. Two instruments share the program-maturity-ml family
  // - 62443-2-1:2024 and 62443-4-1 - and the chassis strings named the first of
  // them everywhere, so a 4-1 report told its reader it was a 2-1 assessment.
  //   "ISA/IEC 62443-4-1 Secure Product Development Lifecycle Assessment"
  //     -> "ISA/IEC 62443-4-1"
  function standardRef(instrument) {
    var inst = instrument || {};
    if (inst.display && inst.display.standardRef) return inst.display.standardRef;
    var t = String(inst.title || "");
    var m = t.match(/^([A-Z][A-Z/]*\s+[0-9][\w.:-]*)/);
    return m ? m[1] : t;
  }

  // What a maturity instrument calls its groupings and its unit of assessment.
  // Two instruments share the program-maturity-ml family: 62443-2-1:2024 groups
  // Security Program Requirements into Security Program Elements, 62443-4-1
  // groups requirements into eight Practices. The nouns were hardcoded to the
  // first, so a 4-1 report read "Weakest Security Program Element(s): SVV
  // Practice 5 …" - the standard's own word colliding with the wrong one.
  var ML_NOUNS = {
    elementNoun:       "Security Program Element",
    elementNounTitle:  "Security Program Element",
    elementNounPlural: "Security Program Elements",
    requirementNoun:   "Security Program Requirement",
    programmeNoun:     "security programme"
  };
  function mlNoun(instrument, which) {
    var d = (instrument && instrument.display) || {};
    return d[which] || ML_NOUNS[which];
  }

  function pluralLower(s, instrument) {
    var inst = instrument || {};
    if (inst.targetDimensionLabelPlural && String(s) === String(inst.targetDimensionLabel)) {
      return String(inst.targetDimensionLabelPlural).toLowerCase();
    }
    s = String(s || "").toLowerCase();
    return /[^aeiou]y$/i.test(s) ? s.slice(0, -1) + "ies" : s + "s";
  }

  function slRoadmapCard(scored, planning) {
    return remediationRoadmapCard({
      title: "Remediation roadmap",
      scored: scored,
      planning: planning,
      emptyText: "No applicable requirement is below its target SL.",
      mainHead: "Requirement (SR)",
      stateHead: "Achieved / target",
      leadStatic: "Every applicable requirement below its target SL, floor findings first. Priority, owner, business impact and recommended action are set by the consultant." +
        ((scored.roadmap || []).some(function (r) { return r.toAssess; })
          ? " Requirements marked To assess are not findings: every item answered so far is met, and the rest are still to be assessed."
          : ""),
      mainCell: function (it) {
        var sub = it.frId + (it.floor ? "  ·  floor finding" : "");
        if (it.toAssess) {
          var left = it.unassessedCount || 0;
          sub += "  ·  " + left + " item" + (left === 1 ? "" : "s") + " still to assess";
        }
        var kids = remediationMainCell(it, sub);
        // A shared gap is not this zone's to fix alone. Say so here so nobody
        // writes a zone-local action for something answered system-wide.
        if (it.gapIsShared) {
          kids.unshift(h("span", { class: "pill inherit", style: "margin-bottom:4px;", text: "Shared action" }));
        }
        return kids;
      },
      statePill: function (it) {
        // Work still to do, not a shortfall: neutral, and labelled as such.
        if (it.toAssess) return h("span", { class: "pill na", text: "To assess" });
        return h("span", { class: "pill " + (it.band === "near" ? "near" : "gap"), text: it.satisfiedCount + " / " + it.countedCount + " items" });
      }
    });
  }

  // ---- domain-letter renderer (General OT Security Posture) -----------

  // Colour the GRADE letter purely by its A-F value. Coverage / confidence is
  // carried as a separate explicit signal (the gray-circle P marker), so amber
  // is reserved for the partial-score band on the A-F scale itself and is never
  // used to indicate provisional status.
  //   A, B -> met (green)   C, D -> near (amber)   E, F -> gap (red)
  function gradeBandClass(score) {
    if (score === null) return "na";
    if (score >= 0.7) return "met";   // A or B
    if (score >= 0.4) return "near";  // C or D
    return "gap";                     // E or F
  }
  function gradeLetterClass(grade) {
    if (!grade) return "na";
    if (grade === "A" || grade === "B") return "met";
    if (grade === "C" || grade === "D") return "near";
    return "gap";
  }
  function provisionalMarker(opts) {
    opts = opts || {};
    return h("span", {
      class: "pmark" + (opts.large ? " lg" : ""),
      title: "Provisional: coverage below threshold, so treat as indicative"
    }, ["P"]);
  }

  // Inline tag rendered alongside a grade letter, e.g. "B  · moderate confidence".
  // Only shown when confidence is NOT High - High is the default state and
  // adding "high confidence" everywhere would just be noise. Visual treatment
  // is muted; the user explicitly wanted confidence kept separate from
  // grade-letter colour.
  function confidenceTag(confidenceLevel) {
    if (!confidenceLevel) return null;
    var key = window.App.ScoringDomainLetter.confidenceKey(confidenceLevel);
    if (key === "high") return null;
    return h("span", {
      class: "conf-tag conf-" + key,
      title: confidenceLevel + " - share of Unknown answers among attempted questions"
    }, [
      h("span", { class: "conf-sep", text: "·" }),
      document.createTextNode(confidenceLevel.toLowerCase())
    ]);
  }
  function postureLegend() {
    return h("div", { class: "legend" }, [
      h("span", null, [h("span", { class: "sw met"  }), "A or B"]),
      h("span", null, [h("span", { class: "sw near" }), "C or D"]),
      h("span", null, [h("span", { class: "sw gap"  }), "E or F"]),
      h("span", null, [h("span", { class: "sw na"   }), "Not graded"]),
      h("span", null, [provisionalMarker(), "Provisional: coverage below threshold"])
    ]);
  }

  function formatWeakestAreas(weakestDomains) {
    if (!weakestDomains || weakestDomains.length === 0) return { label: "Weakest area", value: "-" };
    if (weakestDomains.length === 1) {
      var d = weakestDomains[0];
      return { label: "Weakest area", value: d.name + " (" + d.grade + ")" };
    }
    var names = weakestDomains.map(function (d) { return d.name; });
    return { label: "Weakest areas", value: names.join(", ") + " (all " + weakestDomains[0].grade + ")" };
  }

  function postureKpis(scored) {
    var DL = window.App.ScoringDomainLetter;
    var headlineCls = gradeLetterClass(scored.headlineGrade);
    var headlineLabel = scored.capApplied
      ? "Overall indicative grade (capped from " + scored.headlineMeanGrade + ")"
      : "Overall indicative grade";
    var headlineVal = h("div", { class: "val " + headlineCls }, [
      scored.headlineGrade || "-"
    ]);
    if (scored.headlineGrade && scored.lowConfidence) headlineVal.appendChild(provisionalMarker({ large: true }));
    var headlineConf = scored.headlineGrade ? confidenceTag(scored.overallConfidenceLevel) : null;
    if (headlineConf) headlineVal.appendChild(headlineConf);

    var weak = formatWeakestAreas(scored.weakestDomains);
    return h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: headlineLabel }),
        headlineVal
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: weak.label }),
        h("div", { class: "val", style: "font-size:16px; line-height:1.2;", text: weak.value })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: DL.formatPct(scored.overallCoverage) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Answered / scorable" }),
        h("div", { class: "val", text: scored.totalAnswered + " / " + scored.totalScorable })
      ])
    ]);
  }

  // Priority list (worst-to-best). All graded domains are ordered; ties are
  // shown by adjacency. Domains with low coverage are listed separately as
  // insufficient-evidence so the consultant knows what is still outstanding.
  function priorityCard(scored, opts) {
    var DL = window.App.ScoringDomainLetter;
    var po = scored.priorityOrder || DL.priorityOrder(scored.perDomain);
    var graded = dlPriorityDomains(po, opts);
    var insufficient = po.insufficient || [];
    if (graded.length === 0 && insufficient.length === 0) return null;
    var reordered = !!(sectionCustom(opts, "priority-order").order || []).length;

    var rows = graded.map(function (d, i) {
      return h("div", { class: "priority-row", "data-reorder-id": d.domainId || d.id, "data-reorder-label": d.name }, [
        h("span", { class: "priority-rank", text: String(i + 1) }),
        h("span", { class: "priority-name", text: d.name }),
        h("span", { class: "pill " + gradeLetterClass(d.grade), text: d.grade })
      ]);
    });
    var insufRows = insufficient.map(function (d) {
      return h("div", { class: "priority-row priority-insufficient" }, [
        h("span", { class: "priority-rank", text: "-" }),
        h("span", { class: "priority-name", text: d.name }),
        h("span", { class: "muted", text: "coverage " + DL.formatPct(d.coverage) }),
        provisionalMarker()
      ]);
    });

    var body = [];
    if (graded.length > 0) {
      body.push(h("div", { class: "muted", style: "margin-bottom:8px;", text: reordered
        ? "In the consultant's order." : "Worst to best across the assessed domains." }));
      body.push(h("div", { class: "priority-list", "data-reorder-list": "1" }, rows));
    }
    if (insufficient.length > 0) {
      body.push(h("div", { class: "muted", style: "margin:14px 0 8px;", text: "Not graded with confidence (coverage below threshold):" }));
      body.push(h("div", { class: "priority-list" }, insufRows));
    }
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [ h("h2", { text: "Priority order" }) ]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  function domainBreakdownTable(scored) {
    var head = h("thead", null, [h("tr", null, [
      h("th", null, ["Domain"]), h("th", null, ["Name"]),
      h("th", { class: "center" }, ["Grade"]),
      h("th", { class: "center" }, ["Score"]),
      h("th", { class: "center" }, ["Coverage"]),
      h("th", { class: "center" }, ["Confidence"]),
      h("th", { class: "center" }, ["Unknown"]),
      h("th", { class: "center" }, ["Answered / scorable"])
    ])]);
    var weakestIds = {};
    (scored.weakestDomains || (scored.weakestDomain ? [scored.weakestDomain] : []))
      .forEach(function (wd) { weakestIds[wd.domainId] = true; });
    var body = h("tbody", null, scored.perDomain.map(function (d) {
      var DL = window.App.ScoringDomainLetter;
      var weakest = !!weakestIds[d.domainId];
      var cls = gradeBandClass(d.score);
      var gradeCell = h("td", { class: "center " + cls }, [ d.grade || "-" ]);
      if (d.grade && d.lowCoverage) gradeCell.appendChild(provisionalMarker());

      // Confidence cell: show the label (short form), styled by key.
      var confCell;
      if (d.confidenceLevel) {
        confCell = h("td", { class: "center conf-cell conf-" + d.confidenceKey, title: d.confidenceLevel },
          [ d.confidenceLevel.replace(/ confidence$/i, "") ]);
      } else {
        confCell = h("td", { class: "center muted" }, [ "-" ]);
      }
      // Unknown cell: show "n (rate%)" when there are Unknowns, else just "0".
      var unknownCell = h("td", { class: "center" + (d.unknownCount > 0 ? " near" : "") }, [
        d.unknownCount > 0
          ? (d.unknownCount + " (" + DL.formatPct(d.unknownRate) + ")")
          : "0"
      ]);

      return h("tr", null, [
        h("td", null, [h("strong", { text: cap(d.domainId) }), weakest ? h("span", { class: "pill flag", style: "margin-left:6px;", text: scored.capApplied ? "weakest (caps headline)" : "weakest graded" }) : null]),
        h("td", null, [d.name]),
        gradeCell,
        h("td", { class: "center" }, [d.score !== null ? DL.formatPct(d.score) : "-"]),
        h("td", { class: "center" }, [DL.formatPct(d.coverage)]),
        confCell,
        unknownCell,
        h("td", { class: "center" }, [d.answeredCount + " / " + d.scorableCount])
      ]);
    }));
    return h("table", { class: "tbl" }, [head, body]);
  }

  function domainFindings(scored, narrative, opts) {
    var DL = window.App.ScoringDomainLetter;
    return scored.perDomain.map(function (d) {
      var nfr = (narrative && narrative.domain_narrative && narrative.domain_narrative[d.domainId]) || {};
      var headerBits;
      if (d.grade) {
        headerBits = h("span", { class: "row-flex" }, [
          h("span", { class: "pill " + gradeBandClass(d.score), text: d.grade }),
          d.lowCoverage ? provisionalMarker() : null
        ]);
      } else {
        headerBits = h("span", { class: "pill na", text: "Not graded" });
      }
      var children = [
        h("div", { class: "card-h" }, [
          h("h2", { text: cap(d.domainId) + " - " + d.name }),
          headerBits
        ])
      ];
      var body = [];
      if (nfr.purpose)        body.push(h("p", { text: nfr.purpose }));
      if (nfr.why_it_matters) body.push(h("p", { class: "muted", text: nfr.why_it_matters }));
      body.push(h("p", null, [
        h("strong", { text: "Score: " }), DL.formatPct(d.score),
        h("strong", { text: "  |  Coverage: " }), DL.formatPct(d.coverage),
        h("strong", { text: "  |  Answered: " }), d.answeredCount + " of " + d.scorableCount
      ]));

      // What could not be established, named. The domain header carries the
      // count; a reader needs to know WHICH points are unseen, because an
      // unknown is closed by producing evidence rather than by doing work.
      var unknownQs = (d.questions || []).filter(function (q) { return q.state === "unknown"; });
      if (unknownQs.length > 0) {
        body.push(h("p", { class: "muted", style: "margin-bottom:2px;", text:
          "Could not be established in this domain (" + unknownQs.length +
          (unknownQs.length === 1 ? " point" : " points") + "):" }));
        unknownQs.forEach(function (q) {
          var resp = (engagementResponse(opts, q.questionId) || {});
          body.push(h("div", { class: "unknown-point", style: "padding:4px 0 4px 12px;" }, [
            h("span", { class: "pill na", style: "margin-right:6px;", text: "Unknown" }),
            h("strong", { text: cap(q.questionId) + "  " }), q.prompt,
            String(resp.notes || "").trim()
              ? h("div", { class: "muted", style: "font-size:12.5px; padding-left:6px;", text: resp.notes })
              : null
          ]));
        });
      }

      // Only points that are ACTUALLY low: the bottom three regardless would
      // list top-band answers under a heading calling them the weakest.
      var weakQs = (d.questions || []).filter(function (q) { return q.state === "scored" && q.score < 1; })
        .sort(function (a, b) { return a.score - b.score; }).slice(0, 3);
      if (weakQs.length > 0) {
        body.push(h("p", { class: "muted", text: "Lowest-scoring points in this domain:" }));
        weakQs.forEach(function (q) {
          var bits = [h("strong", { text: cap(q.questionId) + "  " }), q.prompt + " (scored " + q.bandLabel + ")."];
          var qDef = (E_lookupQuestion(scored.instrumentId, q.questionId) || {});
          if (qDef.safetyFlag) bits.unshift(h("span", { class: "pill flag", style: "margin-right:6px;", text: "Safety" }));
          body.push(h("div", { style: "padding:4px 0 4px 12px;" }, bits));
        });
      }
      children.push(h("div", { class: "card-b" }, body));
      return h("div", { class: "card" }, children);
    });
  }

  // The response behind a question on the ACTIVE target, so an unknown can
  // carry the consultant's note on why it could not be established.
  function engagementResponse(opts, questionId) {
    var tid = opts && opts.activeTarget && opts.activeTarget.id;
    var rs = (opts && opts.engagement && opts.engagement.responses) || [];
    for (var i = 0; i < rs.length; i++) {
      if (rs[i].requirementId === questionId && (!tid || rs[i].targetId === tid)) return rs[i];
    }
    return null;
  }

  function E_lookupQuestion(instrumentId, questionId) {
    var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[instrumentId];
    if (!slot || !slot.instrument) return null;
    var qs = slot.instrument.questions || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === questionId) return qs[i];
    return null;
  }

  function renderDomainLetter(container, opts) {
    var engagement = opts.engagement;
    var instrument = opts.instrument;
    var scoredCurrent = opts.scored;
    var narrative = opts.narrative;

    // Indicative-grade caveat, prominent, first.
    if (narrative && narrative.boilerplate && narrative.boilerplate.indicative_grade_caveat) {
      var caveat = h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Indicative grade" })]),
        h("div", { class: "card-b" }, [
          h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
                   text: narrative.boilerplate.indicative_grade_caveat })
        ])
      ]);
      container.appendChild(caveat);
    }

    // Headline KPIs.
    var target = opts.activeTarget;
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Posture headline - " + (target ? target.name : "") })]),
      h("div", { class: "card-b" }, [ postureKpis(scoredCurrent) ])
    ]));

    // Domain scores chart + breakdown table. Wide enough that the full domain
    // labels fit; scales down to the card width on narrow screens.
    var bars = window.App.Charts.domainScoreBars
      ? window.App.Charts.domainScoreBars(scoredCurrent, { width: 640, labelWidth: 260 })
      : null;
    if (bars) { bars.style.maxWidth = "100%"; bars.style.height = "auto"; }
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Domain results" }),
        postureLegend()
      ]),
      h("div", { class: "card-b" }, [
        bars ? (function () { var d = h("div", null, []); d.appendChild(bars); return d; })() : null,
        h("div", { class: "spacer-12" }),
        domainBreakdownTable(scoredCurrent)
      ])
    ]));

    var pri = priorityCard(scoredCurrent, opts);
    if (pri) container.appendChild(pri);

    container.appendChild(postureRoadmapCard(scoredCurrent, opts.planning));

    // Follow-up routing (screener-style instruments): weak or ungradeable
    // domains route into the deep assessment that establishes the real
    // position. Data-driven from instrument.followUpRoutes; absent on the
    // plain posture instrument, so nothing renders there.
    var fuCard = followUpRoutesCard(instrument, scoredCurrent);
    if (fuCard) container.appendChild(fuCard);

    // Per-domain findings (purpose + why_it_matters + weakest questions).
    domainFindings(scoredCurrent, narrative, opts).forEach(function (card) { container.appendChild(card); });

    appendReportTail(container, opts);
  }

  // Which follow-up routes fire: the domain's grade is in the route's trigger
  // list, or the domain could not be graded with confidence (low coverage) -
  // not being able to establish an area at screener depth is itself a reason
  // to go deeper. Shared by the on-screen card and the Word section.
  function triggeredFollowUpRoutes(instrument, scored) {
    var fu = instrument && instrument.followUpRoutes;
    if (!fu || !fu.routes || !fu.routes.length) return null;
    var byDomain = {};
    (scored.perDomain || []).forEach(function (d) { byDomain[d.domainId] = d; });
    var names = {};
    (instrument.domains || []).forEach(function (d) { names[d.id] = d.name; });
    var triggered = [];
    fu.routes.forEach(function (r) {
      var d = byDomain[r.domainId];
      if (!d) return;
      var byGrade = !!d.grade && (r.grades || []).indexOf(d.grade) !== -1;
      if (byGrade || d.lowCoverage) {
        triggered.push({
          route: r,
          domainName: names[r.domainId] || r.domainId,
          grade: d.grade || "-",
          reason: d.lowCoverage ? "could not be graded with confidence" : ("graded " + d.grade)
        });
      }
    });
    return { spec: fu, triggered: triggered };
  }

  function followUpRoutesCard(instrument, scored) {
    var res = triggeredFollowUpRoutes(instrument, scored);
    if (!res) return null;
    var kids = [ h("p", { class: "muted", style: "margin-top:0;", text: res.spec.intro || "" }) ];
    if (!res.triggered.length) {
      kids.push(h("p", { style: "margin:0;", text: res.spec.noneTriggered || "No deep-dive assessment triggered by this screening." }));
    } else {
      res.triggered.forEach(function (t) {
        kids.push(h("div", { class: "req", style: "margin-bottom:10px;" }, [
          h("div", { class: "req-h" }, [
            h("div", null, [ h("span", { class: "req-title", text: t.route.title }) ]),
            h("div", { class: "req-meta" }, [
              h("span", { class: "pill " + (t.reason.indexOf("graded") === 0 ? "gap" : "neutral"), text: t.domainName + " - " + t.reason })
            ])
          ]),
          t.route.detail ? h("p", { class: "muted", style: "margin:6px 0 0;", text: t.route.detail }) : null
        ]));
      });
    }
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Where to go deeper" })]),
      h("div", { class: "card-b" }, kids)
    ]);
  }

  function postureRoadmapCard(scored, planning) {
    return remediationRoadmapCard({
      title: "Improvement roadmap",
      scored: scored,
      planning: planning,
      emptyText: "No scored question is below the top band.",
      mainHead: "Question",
      stateHead: "Band",
      leadStatic: "Every scored question below the top band, weakest first. Priority, owner, business impact and recommended action are set by the consultant.",
      mainCell: function (it) {
        return remediationMainCell(it, cap(it.domainId) + (it.bandLabel ? "  ·  " + it.bandLabel : ""));
      },
      statePill: function (it) {
        var band = it.score >= 0.7 ? "met" : (it.score >= 0.4 ? "near" : "gap");
        return h("span", { class: "pill " + band, text: it.bandLabel || ("Band " + (it.band === null ? "-" : it.band)) });
      }
    });
  }

  // ---- caf-achieved renderer (NCSC CAF 4.0 alignment) -------------------
  //
  // Verbatim-content rule: every prose paragraph in this renderer is either
  //   (a) boilerplate inserted unchanged from narrative.boilerplate, or
  //   (b) a data line composed from narrative.templates by token substitution.
  // No string is composed freely in code. Numbers come from the scored
  // results; the regulator profile name comes from the registry.

  function cafFill(tpl, vars) {
    return (tpl || "").replace(/\{(\w+)\}/g, function (_, k) {
      return vars && Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : "";
    });
  }

  // Pill colour for an outcome state. Achieved=met (green), partially=near
  // (amber), not=gap (red), unknown/unanswered/na render as muted "na".
  function cafStateBand(state) {
    if (state === "achieved")  return "met";
    if (state === "partially") return "near";
    if (state === "not")       return "gap";
    return "na";
  }
  function cafStateLabel(state, instrument) {
    var L = window.App.ScoringCAF.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    return "Not set";
  }

  // Inline confidence tag for the CAF KPI banner, mirroring the posture
  // renderer's behaviour: hidden when High (the default), muted otherwise.
  function cafConfidenceTag(confidenceLevel) {
    if (!confidenceLevel) return null;
    var key = window.App.ScoringCAF.confidenceKey(confidenceLevel);
    if (key === "high") return null;
    return h("span", {
      class: "conf-tag conf-" + key,
      title: confidenceLevel + " - share of Unknown answers among answered outcomes"
    }, [
      h("span", { class: "conf-sep", text: "·" }),
      document.createTextNode(confidenceLevel.toLowerCase())
    ]);
  }

  function cafActiveProfileInfo(opts) {
    var reg = opts.cafProfileRegistry || null;
    var activeId = opts.cafProfileId || null;
    var loaded = opts.cafProfile || null;
    var regEntry = null;
    if (reg && reg.profiles) {
      for (var i = 0; i < reg.profiles.length; i++) {
        if (reg.profiles[i].id === activeId) { regEntry = reg.profiles[i]; break; }
      }
    }
    return {
      id: activeId,
      name: (regEntry && regEntry.name) || (loaded && loaded.name) || activeId || "General",
      status: regEntry ? regEntry.status : (loaded ? loaded.status : null),
      placeholder: !!(regEntry && regEntry.status === "placeholder")
    };
  }

  function cafProfileBanner(opts) {
    var info = cafActiveProfileInfo(opts);
    var lbl = h("div", { class: "caf-active-profile" }, [
      h("span", { class: "muted", text: "Selected profile:" }),
      h("strong", { style: "margin-left:6px;", text: info.name })
    ]);
    if (info.placeholder) {
      return h("div", { class: "card" }, [
        h("div", { class: "card-b" }, [
          lbl,
          h("p", {
            style: "border-left:4px solid var(--near); background:var(--near-bg); padding:10px 14px; margin:10px 0 0; color:var(--text);",
            text: "This regulator profile is a placeholder. Its expected states have not yet been populated, so meeting and below counts are not available. Results are reported as a profile of Achieved / Partially / Not Achieved."
          })
        ])
      ]);
    }
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ lbl ]) ]);
  }

  function cafNotFormalCaveat(narrative) {
    if (!narrative || !narrative.boilerplate || !narrative.boilerplate.not_formal_caveat) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Not a formal assessment" })]),
      h("div", { class: "card-b" }, [
        h("p", {
          style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: narrative.boilerplate.not_formal_caveat
        })
      ])
    ]);
  }

  // Substantive states (Achieved/Partially/Not for the CAF, Satisfied / Other
  // Than Satisfied for the NIST instruments), from the instrument.
  function cafSub(opts) { return window.App.ScoringCAF.substantiveStates(opts && opts.instrument); }

  function cafKpiRow(scored, opts) {
    var SC = window.App.ScoringCAF;
    var info = cafActiveProfileInfo(opts);
    var ov = scored.overall;
    var counts = ov.counts;
    var ss = cafSub(opts);
    var profileText = ss.map(function (s) { return counts[s.value] || 0; }).join(" / ");

    // Meets-expected KPI is only meaningful if any outcome has an expected
    // state. Under a placeholder profile (no expectations) we surface it
    // explicitly so the reader knows nothing was compared.
    var meetsCell;
    if (info.placeholder || (ov.meeting + ov.below) === 0) {
      meetsCell = h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Meeting expected (profile)" }),
        h("div", { class: "val muted", style: "font-size:16px;", text: "Not available" })
      ]);
    } else {
      var total = ov.meeting + ov.below;
      var pct = total > 0 ? Math.round((ov.meeting / total) * 100) : 0;
      var cls = (ov.below === 0 && total > 0) ? "met" : (ov.meeting === 0 ? "gap" : "near");
      meetsCell = h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Meeting expected (profile)" }),
        h("div", { class: "val " + cls, text: ov.meeting + " / " + total + " (" + pct + "%)" })
      ]);
    }

    var confTag = cafConfidenceTag(ov.confidenceLevel);
    var coverageVal = h("div", { class: "val", text: SC.formatPct(ov.coverage) });
    if (confTag) coverageVal.appendChild(confTag);

    return h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Outcome profile (" + ss.map(function (s) { return s.label.toLowerCase(); }).join(" / ") + ")" }),
        h("div", { class: "val", text: profileText })
      ]),
      meetsCell,
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        coverageVal
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Outcomes (answered / applicable)" }),
        h("div", { class: "val", text: ov.answered + " / " + ov.total })
      ])
    ]);
  }

  function cafBoilerplateCard(title, text) {
    if (!text) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: title })]),
      h("div", { class: "card-b" }, [h("p", { text: text })])
    ]);
  }

  function cafExecSummary(scored, narrative) {
    if (!narrative) return null;
    var bp = narrative.boilerplate || {};
    var tpl = (narrative.templates && narrative.templates.profile_line) || "";
    var body = [];
    if (bp.report_intro) body.push(h("p", { text: bp.report_intro }));

    var ul = h("ul", { class: "caf-profile-lines" }, scored.byObjective.map(function (obj) {
      var line = cafFill(tpl, {
        objId: obj.objectiveId,
        objName: obj.name,
        achievedCount: obj.counts.achieved,
        partiallyCount: obj.counts.partially,
        notCount: obj.counts.not,
        totalCount: obj.total
      });
      return h("li", { text: line });
    }));
    body.push(ul);

    if (scored.overall.counts.unknown > 0 && narrative.templates && narrative.templates.unknown_finding) {
      var ut = cafFill(narrative.templates.unknown_finding, {
        unknownCount: scored.overall.counts.unknown,
        confidenceLabel: scored.overall.confidenceLevel || "-"
      });
      body.push(h("p", { class: "muted", text: ut }));
    }

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Executive summary" })]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  function cafObjectiveResultsCard(scored, opts) {
    var unkFinding = !!(opts && opts.instrument && opts.instrument.unknownIsFinding);
    var hasAbove = ((scored.aboveBaseline || []).length > 0);
    var rows = scored.byObjective.map(function (obj) {
      var row = { label: obj.objectiveId + " " + obj.name, achieved: obj.counts.achieved, partially: obj.counts.partially, not: obj.counts.not };
      if (unkFinding) row.unknown = obj.counts.unknown;
      if (hasAbove) row.aboveBaseline = obj.counts.aboveBaseline;
      return row;
    });
    var chart = window.App.Charts.cafStateBars(rows, { width: 620, labelWidth: 260, unknownSevere: unkFinding });

    var ss = cafSub(opts);
    var head = h("thead", null, [h("tr", null, [h("th", null, ["Objective"])]
      .concat(ss.map(function (s) { return h("th", { class: "center" }, [s.label]); }))
      .concat([ h("th", { class: "center" }, ["Unknown"]) ])
      .concat(hasAbove ? [ h("th", { class: "center" }, ["Above baseline"]) ] : [])
      .concat([ h("th", { class: "center" }, ["N/A"]), h("th", { class: "center" }, ["Applicable"]) ]))]);
    var body = h("tbody", null, scored.byObjective.map(function (obj) {
      var c = obj.counts;
      return h("tr", null, [ h("td", null, [h("strong", { text: obj.objectiveId }), " " + obj.name]) ]
        .concat(ss.map(function (s) { return h("td", { class: "center " + s.colour }, [String(c[s.value] || 0)]); }))
        .concat([ h("td", { class: "center " + cafUnknownCellClass(opts, c.unknown) }, [String(c.unknown)]) ])
        .concat(hasAbove ? [ h("td", { class: "center " + ((c.aboveBaseline || 0) > 0 ? "above" : "") }, [String(c.aboveBaseline || 0)]) ] : [])
        .concat([ h("td", { class: "center" }, [String(c.na)]), h("td", { class: "center" }, [String(obj.total)]) ]));
    }));
    var sum = cafColumnSums(scored.byObjective);
    var foot = h("tfoot", null, [ h("tr", null, [ h("td", null, ["Total"]) ]
      .concat(ss.map(function (s) { return h("td", { class: "center" }, [String(sum[s.value] || 0)]); }))
      .concat([ h("td", { class: "center" }, [String(sum.unknown)]) ])
      .concat(hasAbove ? [ h("td", { class: "center" }, [String(sum.aboveBaseline)]) ] : [])
      .concat([ h("td", { class: "center" }, [String(sum.na)]), h("td", { class: "center" }, [String(sum.total)]) ])) ]);

    var chartWrap = h("div", null, []);
    chartWrap.appendChild(chart);

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Results by objective" }), cafLegend(opts, hasAbove)]),
      h("div", { class: "card-b" }, [
        chartWrap,
        // Each bar fills its own row, so bar length is the SHARE of outcomes in
        // that objective, not how many there are. Without saying so, an
        // objective holding nineteen outcomes and one holding five draw
        // identically. The counts beside each bar carry the magnitude.
        h("div", { class: "muted", style: "margin-top:6px; font-size:12px;", text: "Each bar shows the proportion of that objective's outcomes in each state; the figures beside it are the counts. Bar length is not the number of outcomes." }),
        h("div", { class: "spacer-12" }),
        h("table", { class: "tbl" }, [head, body, foot])
      ])
    ]);
  }

  function cafPrincipleTableCard(scored, opts, withChart) {
    var info = cafActiveProfileInfo(opts);
    var ss = cafSub(opts);
    // When the objective layer is trivial (a single-objective instrument like
    // CIS), this card carries the primary bar chart - one bar per principle
    // (e.g. per CIS Control) so the report shows which areas need attention.
    var unkFinding = !!(opts && opts.instrument && opts.instrument.unknownIsFinding);
    var hasAbove = ((scored.aboveBaseline || []).length > 0);
    var chartWrap = null;
    if (withChart) {
      var chartRows = scored.byPrinciple.map(function (p) {
        var row = { label: p.principleId + " " + p.name, achieved: p.counts.achieved, partially: p.counts.partially, not: p.counts.not };
        if (unkFinding) row.unknown = p.counts.unknown; // Unknown is a finding - show it (severe)
        if (hasAbove) row.aboveBaseline = p.counts.aboveBaseline; // implemented but not required
        return row;
      });
      chartWrap = h("div", null, []);
      chartWrap.appendChild(window.App.Charts.cafStateBars(chartRows, { width: 640, labelWidth: 300, unknownSevere: unkFinding }));
    }
    var head = h("thead", null, [h("tr", null, [h("th", null, [cafPrincipleNoun(opts)])]
      .concat(ss.map(function (s) { return h("th", { class: "center" }, [s.label]); }))
      .concat([ h("th", { class: "center" }, ["Unknown"]) ])
      .concat(hasAbove ? [ h("th", { class: "center" }, ["Above baseline"]) ] : [])
      // N/A rather than Applicable: the applicable total is already the
      // denominator of the Meeting-expected column beside it, so the column is
      // better spent on the one count the table could not otherwise show.
      .concat([ h("th", { class: "center" }, ["N/A"]), h("th", { class: "center" }, ["Meeting expected"]) ]))]);
    var rows = scored.byPrinciple.map(function (p) {
      var c = p.counts;
      var ab = c.aboveBaseline || 0;
      var meetsCell;
      var compared = p.meeting + p.below;
      if (info.placeholder) {
        meetsCell = h("td", { class: "center muted" }, ["-"]);
      } else if (compared === 0) {
        // No required controls here. If some were implemented above the baseline,
        // show them as "x / -" (implemented, but no expected target to meet).
        meetsCell = ab > 0 ? h("td", { class: "center above" }, [ab + " / -"]) : h("td", { class: "center muted" }, ["-"]);
      } else {
        var cls = p.below === 0 ? "met" : (p.meeting === 0 ? "gap" : "near");
        meetsCell = h("td", { class: "center " + cls }, [p.meeting + " / " + compared]);
      }
      return h("tr", null, [ h("td", null, [h("strong", { text: p.principleId }), " " + p.name]) ]
        .concat(ss.map(function (s) { return h("td", { class: "center " + s.colour }, [String(c[s.value] || 0)]); }))
        .concat([ h("td", { class: "center " + cafUnknownCellClass(opts, c.unknown) }, [String(c.unknown)]) ])
        .concat(hasAbove ? [ h("td", { class: "center " + (ab > 0 ? "above" : "") }, [String(ab)]) ] : [])
        .concat([ h("td", { class: "center" }, [String(c.na || 0)]), meetsCell ]));
    });
    var sum = cafColumnSums(scored.byPrinciple);
    var footMeets;
    if (info.placeholder) { footMeets = h("td", { class: "center muted" }, ["-"]); }
    else if (sum.compared === 0) { footMeets = sum.aboveBaseline > 0 ? h("td", { class: "center" }, [sum.aboveBaseline + " / -"]) : h("td", { class: "center muted" }, ["-"]); }
    else { footMeets = h("td", { class: "center" }, [sum.meeting + " / " + sum.compared]); }
    var foot = h("tfoot", null, [ h("tr", null, [ h("td", null, ["Total"]) ]
      .concat(ss.map(function (s) { return h("td", { class: "center" }, [String(sum[s.value] || 0)]); }))
      .concat([ h("td", { class: "center" }, [String(sum.unknown)]) ])
      .concat(hasAbove ? [ h("td", { class: "center" }, [String(sum.aboveBaseline)]) ] : [])
      .concat([ h("td", { class: "center" }, [String(sum.na)]), footMeets ])) ]);
    var cardBody = [];
    if (chartWrap) { cardBody.push(chartWrap); cardBody.push(h("div", { class: "spacer-12" })); }
    cardBody.push(h("table", { class: "tbl" }, [head, h("tbody", null, rows), foot]));
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Results by " + cafPrincipleNoun(opts).toLowerCase() })].concat(chartWrap ? [cafLegend(opts, hasAbove)] : [])),
      h("div", { class: "card-b" }, cardBody)
    ]);
  }

  // "Principle" for the CAF; "Control family" for the NIST instruments.
  function cafPrincipleNoun(opts) {
    var d = (opts && opts.instrument && opts.instrument.display) || {};
    if (d.principleNoun) return d.principleNoun;
    return (d.objectiveTitle === "Control families") ? "Control family" : "Principle";
  }

  // Column totals for a results table, summing the rendered group rows
  // (byObjective / byPrinciple) so the footer matches exactly what's above it.
  function cafColumnSums(groups) {
    var s = { achieved: 0, partially: 0, not: 0, unknown: 0, na: 0, aboveBaseline: 0, total: 0, meeting: 0, compared: 0 };
    (groups || []).forEach(function (g) {
      var c = g.counts || {};
      s.achieved += c.achieved || 0;
      s.partially += c.partially || 0;
      s.not += c.not || 0;
      s.unknown += c.unknown || 0;
      s.na += c.na || 0;
      s.aboveBaseline += c.aboveBaseline || 0;
      s.total += g.total || 0;
      s.meeting += g.meeting || 0;
      s.compared += (g.meeting || 0) + (g.below || 0);
    });
    return s;
  }

  // Colour class for the Unknown count cell: severe when the instrument treats
  // Unknown as a finding and there is at least one (else uncoloured).
  function cafUnknownCellClass(opts, count) {
    var inst = opts && opts.instrument;
    return (inst && inst.unknownIsFinding && count > 0) ? "severe" : "";
  }

  function cafLegend(opts, hasAbove) {
    var inst = opts && opts.instrument;
    var tail = (inst && inst.unknownIsFinding)
      ? [ h("span", null, [h("span", { class: "sw severe" }), "Unknown (finding)"]), h("span", null, [h("span", { class: "sw na" }), "N/A"]) ]
      : [ h("span", null, [h("span", { class: "sw na" }), "Unknown / N/A"]) ];
    if (hasAbove) tail.splice(tail.length - 1, 0, h("span", null, [h("span", { class: "sw above" }), "Above baseline"]));
    return h("div", { class: "legend" }, cafSub(opts).map(function (s) {
      return h("span", null, [h("span", { class: "sw " + s.colour }), s.label]);
    }).concat(tail));
  }

  function cafRoadmapCard(scored, narrative, opts) {
    var instrument = opts.instrument;
    return remediationRoadmapCard({
      title: "Roadmap toward expected outcomes",
      scored: scored,
      planning: opts.planning,
      emptyText: "Every applicable outcome meets the expected state for the selected profile.",
      mainHead: "Outcome",
      stateHead: "Current",
      leadStatic: "Every outcome below its expected state for the selected profile. Priority, owner, business impact and recommended action are set by the consultant.",
      mainCell: function (it) {
        return remediationMainCell(it, it.principleId + (it.hasExpected ? "  ·  expected " + cafStateLabel(it.expectedState, instrument) : ""));
      },
      statePill: function (it) {
        var band = (window.App.ScoringCAF.stateColourFor(it.state, instrument) || cafStateBand(it.state));
        return h("span", { class: "pill " + band, text: cafStateLabel(it.state, instrument) });
      }
    });
  }

  function renderCAF(container, opts) {
    var engagement = opts.engagement;
    var instrument = opts.instrument;
    var narrative  = opts.narrative;
    var scored     = opts.scored;
    var target     = opts.activeTarget;
    var info       = cafActiveProfileInfo(opts);

    // Not-formal caveat, prominent, first: it is "read before relying on this".
    var caveat = cafNotFormalCaveat(narrative);
    if (caveat) container.appendChild(caveat);

    // Selected profile banner (plus placeholder warning if applicable).
    container.appendChild(cafProfileBanner(opts));

    // Headline KPIs - the first numbers on the page.
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Alignment headline - " + (target ? target.name : "") + " - " + info.name })
      ]),
      h("div", { class: "card-b" }, [ cafKpiRow(scored, opts) ])
    ]));

    // Executive summary (report_intro + composed profile_line per objective).
    var exec = cafExecSummary(scored, narrative);
    if (exec) container.appendChild(exec);

    // Results profile. Normally: by objective (chart + table) then by principle
    // (table). For a single-objective instrument (e.g. CIS) the objective chart
    // is one useless bar, so we drop it and put the bar chart on the principle
    // card instead - one bar per Control, showing which areas need attention.
    var singleObjective = (scored.byObjective || []).length < 2;
    if (!singleObjective) container.appendChild(cafObjectiveResultsCard(scored, opts));
    container.appendChild(cafPrincipleTableCard(scored, opts, singleObjective));

    // Roadmap - every outcome below expected (or partially/not under General).
    container.appendChild(cafRoadmapCard(scored, narrative, opts));

    // Controls implemented beyond the selected profile (informational; no score effect).
    var above = cafAboveBaselineCard(scored, opts);
    if (above) container.appendChild(above);

    // Standing prose and the cover sheet close the preview - both ship in the
    // Word document, neither is what you scroll here to find.
    var bp = (narrative && narrative.boilerplate) || {};
    var boiler = boilerplateStack([
      withAttribution(cafBoilerplateCard("About the CAF", bp.about_caf), instrument),
      cafBoilerplateCard("OT focus", bp.ot_focus),
      cafBoilerplateCard("Implementation context", bp.implementation_context),
      cafBoilerplateCard("How to read this report", bp.how_to_read)
    ]);
    if (boiler) container.appendChild(boiler);
    appendReportTail(container, opts);
  }

  // Additional controls the customer has implemented that the selected profile
  // does not require. Captured for a complete report and reassessment tracking,
  // with no effect on the score. Rendered only when there is at least one.
  function cafAboveBaselineCard(scored, opts) {
    var items = scored.aboveBaseline || [];
    if (!items.length) return null;
    var info = cafActiveProfileInfo(opts);
    var inst = opts && opts.instrument;
    var unitNoun = (inst && inst.display && inst.display.outcomesTitle) ? inst.display.outcomesTitle.replace(/s$/i, "") : "Control";
    var rows = items.map(function (it) {
      var lbl = window.App.ScoringCAF.stateLabelFor(it.aboveBaselineState, inst) || it.aboveBaselineState;
      return h("tr", null, [
        h("td", null, [h("strong", { text: it.outcomeId }), " " + it.title]),
        h("td", { class: "center " + (it.aboveBaselineState === "partially" ? "near" : "met") }, [lbl])
      ]);
    });
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Additional controls implemented beyond the " + info.name })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", text: items.length + " " + unitNoun.toLowerCase() + (items.length === 1 ? "" : "s") + " that the " + info.name + " does not require " + (items.length === 1 ? "has" : "have") + " been implemented. " + (items.length === 1 ? "It does" : "They do") + " not affect the score, which is measured against the selected profile, but " + (items.length === 1 ? "is" : "are") + " recorded so that a reassessment can track " + (items.length === 1 ? "it" : "them") + "." }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [h("th", null, [unitNoun]), h("th", { class: "center" }, ["State"])])]),
          h("tbody", null, rows)
        ])
      ])
    ]);
  }

  // ---- program-maturity-ml renderer (ISA/IEC 62443-2-1:2024) ----------------
  //
  // No single program grade. Reports an achieved-ML profile by SPE and theme,
  // mean ML for context only, and surfaces not-met / below-target as floor
  // findings. No narrative pack yet: prose is the instrument framing plus the
  // fixed chassis descriptions below (no free-writing).
  function mlBandForLevel(mlState) {
    if (mlState === "ML4") return "exceeds";
    if (mlState === "ML3") return "met";
    if (mlState === "ML2") return "near";
    if (mlState === "ML1") return "neutral";
    if (mlState === "not-met") return "gap";
    return "na";
  }

  function mlKpiRow(scored) {
    var ML = window.App.ScoringProgramML;
    var ov = scored.overall;
    var c = ov.counts;
    var profile = c.ML1 + " / " + c.ML2 + " / " + c.ML3 + " / " + c.ML4;
    var worstNames = (scored.worstElements || []).map(function (e) { return e.elementId; }).join(", ") || "-";

    var cells = [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "ML profile (ML1 / ML2 / ML3 / ML4)" }),
        h("div", { class: "val", text: profile })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Not met (floor findings)" }),
        h("div", { class: "val " + (c.notMet > 0 ? "gap" : "met"), text: String(c.notMet) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Weakest SPEs" }),
        h("div", { class: "val", style: "font-size:15px; line-height:1.3;", text: worstNames })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: ML.formatPct(ov.coverage) + (ov.confidenceLevel ? "  -  " + ov.confidenceLevel : "") })
      ])
    ];
    if (scored.anyTargets) {
      var compared = ov.meeting + ov.below;
      cells.splice(3, 0, h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Meeting target ML" }),
        h("div", { class: "val " + (ov.below === 0 && compared > 0 ? "met" : (ov.meeting === 0 ? "gap" : "near")), text: ov.meeting + " / " + compared })
      ]));
    }
    return h("div", { class: "kpi-row" }, cells);
  }

  function mlLegend() {
    return h("div", { class: "legend" }, [
      h("span", null, [h("span", { class: "sw gap"  }), "Not met"]),
      h("span", null, [h("span", { class: "sw na"   }), "ML1 Initial"]),
      h("span", null, [h("span", { class: "sw near" }), "ML2 Managed"]),
      h("span", null, [h("span", { class: "sw met"  }), "ML3 Defined / Practiced"]),
      h("span", null, [h("span", { class: "sw target" }), "ML4 Improving"])
    ]);
  }

  function mlResultsCard(scored, byKey, titleText, keyField, codeField) {
    var ML = window.App.ScoringProgramML;
    var groups = scored[byKey];
    var rows = groups.map(function (g) {
      return {
        label: (g[codeField] || g[keyField]) + " " + g.name,
        notMet: g.counts.notMet, ml1: g.counts.ML1, ml2: g.counts.ML2, ml3: g.counts.ML3, ml4: g.counts.ML4
      };
    });
    var chart = window.App.Charts.mlDistributionBars(rows, { width: 640, labelWidth: 280 });
    var chartWrap = h("div", null, []); chartWrap.appendChild(chart);

    var headCols = [
      h("th", null, [titleText]),
      h("th", { class: "center" }, ["Not met"]),
      h("th", { class: "center" }, ["ML1"]), h("th", { class: "center" }, ["ML2"]),
      h("th", { class: "center" }, ["ML3"]), h("th", { class: "center" }, ["ML4"]),
      h("th", { class: "center" }, ["Unknown"]),
      h("th", { class: "center" }, ["Mean ML"]),
      h("th", { class: "center" }, ["Coverage"])
    ];
    if (scored.anyTargets) headCols.push(h("th", { class: "center" }, ["Meets target"]));
    var head = h("thead", null, [h("tr", null, headCols)]);
    var body = h("tbody", null, groups.map(function (g) {
      var cc = g.counts;
      var cells = [
        h("td", null, [h("strong", { text: g[codeField] || g[keyField] }), " " + g.name]),
        h("td", { class: "center gap"  }, [String(cc.notMet)]),
        h("td", { class: "center" }, [String(cc.ML1)]),
        h("td", { class: "center near" }, [String(cc.ML2)]),
        h("td", { class: "center met"  }, [String(cc.ML3)]),
        h("td", { class: "center" }, [String(cc.ML4)]),
        h("td", { class: "center" }, [String(cc.unknown)]),
        h("td", { class: "center", text: ML.formatMean(g.meanMl) }),
        h("td", { class: "center", text: ML.formatPct(g.coverage) })
      ];
      if (scored.anyTargets) {
        var compared = g.meeting + g.below;
        cells.push(h("td", { class: "center" + (compared === 0 ? " muted" : (g.below === 0 ? " met" : (g.meeting === 0 ? " gap" : " near"))) },
          [compared > 0 ? (g.meeting + " / " + compared) : "-"]));
      }
      return h("tr", null, cells);
    }));

    var body2 = [];
    if (byKey === "byElement") { body2.push(chartWrap); body2.push(h("div", { class: "spacer-12" })); }
    body2.push(h("table", { class: "tbl" }, [head, body]));
    return h("div", { class: "card" }, [
      // titleText already carries the instrument's own word for a grouping.
      h("div", { class: "card-h" }, [h("h2", { text: titleText === "Objective" ? "Results" : ("Results by " + (byKey === "byElement" ? titleText : "theme")) }), byKey === "byElement" ? mlLegend() : null]),
      h("div", { class: "card-b" }, body2)
    ]);
  }

  function mlFindingsCard(scored, instrument) {
    var ML = window.App.ScoringProgramML;
    var cards = [];
    scored.byElement.forEach(function (el) {
      // Name the not-met and lowest-ML requirements with captured evidence.
      var notMet = el.requirements.filter(function (r) { return r.isNotMet; });
      var ml1 = el.requirements.filter(function (r) { return r.ml === "ML1"; });
      var below = scored.anyTargets ? el.requirements.filter(function (r) { return r.belowTarget && !r.isNotMet; }) : [];
      if (notMet.length === 0 && ml1.length === 0 && below.length === 0) return;

      var kids = [
        h("p", null, [
          h("strong", { text: "Profile: " }),
          el.counts.ML1 + " ML1, " + el.counts.ML2 + " ML2, " + el.counts.ML3 + " ML3, " + el.counts.ML4 + " ML4, " + el.counts.notMet + " not met. ",
          h("strong", { text: "Mean ML: " }), ML.formatMean(el.meanMl) + " (context only). ",
          h("strong", { text: "Coverage: " }), ML.formatPct(el.coverage) + "."
        ])
      ];
      function reqList(label, arr, band) {
        if (arr.length === 0) return;
        kids.push(h("p", { class: "muted", style: "margin:8px 0 2px;", text: label }));
        arr.forEach(function (r) {
          kids.push(h("div", { style: "padding:3px 0 3px 12px;" }, [
            h("span", { class: "pill " + band, style: "margin-right:6px;", text: r.mlLabel }),
            h("strong", { text: r.code + "  " }), r.title,
            r.evidence ? h("div", { class: "muted", style: "padding-left:8px;", text: r.evidence }) : null
          ]));
        });
      }
      reqList("Not met:", notMet, "gap");
      reqList("Below target:", below, "near");
      reqList("Lowest maturity (ML1):", ml1, "neutral");

      cards.push(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: el.elementId + " - " + el.name })]),
        h("div", { class: "card-b" }, kids)
      ]));
    });
    if (cards.length === 0) {
      cards.push(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Findings by " + mlNoun(instrument, "elementNounTitle") })]),
        h("div", { class: "card-b" }, [h("p", { class: "muted", text: "No not-met, below-target, or ML1 requirements were recorded." })])
      ]));
    }
    return cards;
  }

  function mlRoadmapCard(scored, planning) {
    return remediationRoadmapCard({
      title: "Roadmap",
      scored: scored,
      planning: planning,
      emptyText: scored.anyTargets ? "Every requirement meets its target ML." : "No not-met or ML1 requirements to prioritise.",
      mainHead: "Requirement",
      stateHead: "Achieved ML",
      leadStatic: (scored.anyTargets ? "Every requirement below its target ML." : "Every not-met or ML1 requirement.") +
        " Not met first, then by shortfall. Priority, owner, business impact and recommended action are set by the consultant.",
      mainCell: function (it) {
        return remediationMainCell(it, it.elementId + (it.hasTarget ? "  ·  target " + it.targetMl : ""));
      },
      statePill: function (it) {
        return h("span", { class: "pill " + mlBandForLevel(it.ml), text: it.mlLabel });
      }
    });
  }

  function renderProgramML(container, opts) {
    var engagement = opts.engagement;
    var instrument = opts.instrument;
    var scored     = opts.scored;
    var target     = opts.activeTarget;

    // No-grade notice (the maturity model produces a profile, never a single grade).
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Maturity profile (no single grade)" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--brand-blue); background:var(--brand-blue-tint); padding:10px 14px; margin:0; color:var(--text);",
          text: "This is a maturity assessment against " + standardRef(instrument) + ". The result is an achieved-ML profile for each " +
            mlNoun(instrument, "elementNounTitle").toLowerCase() + ". There is no single programme grade, and mean ML is shown for context only. A requirement that is Not met, or below its target ML, is reported as a floor finding rather than averaged into a mean." })
      ])
    ]));

    // Headline KPIs.
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Program maturity headline - " + (target ? target.name : "") })]),
      h("div", { class: "card-b" }, [ mlKpiRow(scored) ])
    ]));

    // Results by SPE (chart + table) and by theme (table).
    container.appendChild(mlResultsCard(scored, "byElement", mlNoun(instrument, "elementNounTitle"), "elementId", "elementId"));
    container.appendChild(mlResultsCard(scored, "byTheme", "Theme", "theme", "theme"));

    // Findings by SPE (not-met + lowest-ML named, with evidence).
    mlFindingsCard(scored, instrument).forEach(function (c) { container.appendChild(c); });

    // Roadmap of shortfalls - only when the target overlay is on. With the
    // overlay off, the report is the achieved-ML profile (not-met is still
    // surfaced as a floor finding in the findings above).
    if (scored.anyTargets) container.appendChild(mlRoadmapCard(scored, opts.planning));

    // Standing prose + cover sheet close the preview.
    var mlBoiler = boilerplateStack([
      instrument.framing ? withAttribution(proseCard("About this assessment", instrument.framing), instrument) : null,
      proseCard("How to read this report", "Each " + mlNoun(instrument, "requirementNoun") + " is assessed at one maturity level: ML1 Initial (ad hoc), ML2 Managed (documented and repeatable; documentation begins at ML2), ML3 Defined / Practiced (actively practised on the IACS), or ML4 Improving (metrics-driven improvement). Levels apply independently per requirement. Not met means the requirement is not satisfied at any level. Unknown lowers coverage and confidence; Not applicable is excluded. Results are a profile across the " + mlNoun(instrument, "elementNounPlural").toLowerCase() + "; there is no single programme grade.")
    ]);
    if (mlBoiler) container.appendChild(mlBoiler);
    appendReportTail(container, opts);
  }

  // ---- nis2-conformance renderer (EU NIS2 gap analysis) -----------------
  //
  // No single grade or pass mark. Conformance profile (Achieved / Partially /
  // Not) by NIS2 area, with a gap roadmap. Renders from the instrument framing
  // plus fixed chassis strings - no narrative pack required.
  function nis2Band(state) {
    if (state === "achieved")  return "met";
    if (state === "partially") return "near";
    if (state === "not")       return "gap";
    return "na";
  }
  function nis2StateLabel(state, instrument) {
    var L = window.App.ScoringNIS2.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    return "Not set";
  }
  function nis2PriBandLabel(b) {
    return b === "high" ? "High" : b === "medium" ? "Medium" : b === "low" ? "Low" : "";
  }
  // Drag state shared across the gap-roadmap rows for one render.
  var roadmapDrag = { id: null, moved: false };
  function wireRoadmapRow(tr, itemId, planning) {
    tr.setAttribute("draggable", "true");
    tr.addEventListener("dragstart", function (e) {
      roadmapDrag.id = itemId; roadmapDrag.moved = false;
      tr.classList.add("dragging");
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", itemId); } catch (x) {} }
    });
    tr.addEventListener("dragend", function () { tr.classList.remove("dragging"); tr.classList.remove("drop-target"); roadmapDrag.id = null; });
    tr.addEventListener("dragover", function (e) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; if (roadmapDrag.id && roadmapDrag.id !== itemId) tr.classList.add("drop-target"); });
    tr.addEventListener("dragleave", function () { tr.classList.remove("drop-target"); });
    tr.addEventListener("drop", function (e) {
      e.preventDefault(); tr.classList.remove("drop-target");
      if (roadmapDrag.id && roadmapDrag.id !== itemId) { roadmapDrag.moved = true; planning.reorder(roadmapDrag.id, itemId); }
    });
    tr.addEventListener("click", function () {
      if (roadmapDrag.moved) { roadmapDrag.moved = false; return; }
      planning.editRow(itemId);
    });
    // Keyboard: focus the row with Tab, open the plan editor with Enter/Space.
    tr.setAttribute("tabindex", "0");
    tr.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); planning.editRow(itemId); }
    });
  }

  // Shared interactive remediation roadmap (used by CAF, ML and reusable by
  // others). Columns: Priority | Main | State | Owner | Recommended action.
  // When opts.planning is passed the rows are draggable (set priority order)
  // and clickable (edit owner/action/impact/band/evidence). opts.mainCell(it)
  // returns the cell children; opts.statePill(it) returns the state pill.
  function remediationRoadmapCard(opts) {
    var scored = opts.scored, planning = opts.planning, interactive = !!planning;
    roadmapDrag.id = null; roadmapDrag.moved = false;  // fresh DOM each render
    if (!scored.roadmap || scored.roadmap.length === 0) {
      return h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: opts.title })]),
        h("div", { class: "card-b" }, [h("p", { class: "muted", text: opts.emptyText })])
      ]);
    }
    var head = h("thead", null, [h("tr", null, [
      h("th", { style: "width:104px;" }, ["Priority"]),
      h("th", null, [opts.mainHead || "Item"]),
      h("th", { style: "width:118px;" }, [opts.stateHead || "State"]),
      h("th", { style: "width:150px;" }, ["Owner"]),
      h("th", null, ["Recommended action"])
    ])]);
    var rows = scored.roadmap.map(function (it, i) {
      var bandLabel = nis2PriBandLabel(it.priorityBand);
      var priCell = h("td", { class: "rm-pri" }, [
        interactive ? h("span", { class: "rm-handle", title: "Drag to set priority order", text: "⋮⋮" }) : null,
        h("span", { class: "pri-badge", text: "P" + (i + 1) }),
        bandLabel ? h("span", { class: "pri-band " + it.priorityBand, text: bandLabel })
                  : (interactive ? h("span", { class: "muted small", text: "set band" }) : null)
      ]);
      var mainCell = h("td", null, opts.mainCell(it));
      var stateCell = h("td", null, [opts.statePill(it)]);
      var ownerCell = h("td", null, [
        it.owner ? document.createTextNode(it.owner)
                 : (interactive ? h("span", { class: "muted small", text: "unassigned" }) : h("span", { class: "muted", text: "-" }))
      ]);
      var actionCell = h("td", { style: "max-width:340px;" }, [
        it.action ? document.createTextNode(it.action)
                  : (interactive ? h("span", { class: "muted small", text: "click row to add…" }) : h("span", { class: "muted", text: "-" }))
      ]);
      var tr = h("tr", interactive ? { class: "rm-row" } : null, [priCell, mainCell, stateCell, ownerCell, actionCell]);
      if (interactive) wireRoadmapRow(tr, it.itemId, planning);
      return tr;
    });
    var leadText = interactive
      ? "Drag rows to set the priority order; click a row to update the captured evidence and record the owner, recommended action, business impact and priority band. These flow straight into the Excel and Word exports."
      : opts.leadStatic;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: opts.title })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin:0 0 10px;", text: leadText }),
        h("table", { class: "tbl" + (interactive ? " rm-table" : "") }, [head, h("tbody", null, rows)])
      ])
    ]);
  }

  function remediationMainCell(it, subline) {
    var kids = [
      h("strong", { text: (it.code ? it.code + " " : "") + it.title }),
      h("div", { class: "muted small", text: subline })
    ];
    if (it.evidence) kids.push(h("div", { class: "small", style: "margin-top:4px; color:var(--text-muted);", text: "Evidence: " + it.evidence }));
    // The consultant's captured notes, shown alongside the evidence so they are
    // to hand while writing the recommended action / impact for this gap.
    if (it.notes) kids.push(h("div", { class: "small", style: "margin-top:4px; color:var(--text-muted);", text: "Notes: " + it.notes }));
    if (it.impact) kids.push(h("div", { class: "small", style: "margin-top:4px;" }, [h("strong", { text: "Impact: " }), it.impact]));
    return kids;
  }

  function nis2KpiRow(scored) {
    var N = window.App.ScoringNIS2;
    var ov = scored.overall, c = ov.counts;
    var worst = (scored.worstCategories || []).map(function (x) { return x.categoryId + " " + x.name; }).join("; ") || "None";

    var coverageVal = h("div", { class: "val" + (ov.confidenceLevel ? " kpi-stack" : "") }, [N.formatPct(ov.coverage)]);
    if (ov.confidenceLevel) coverageVal.appendChild(h("div", { class: "kpi-sub", text: ov.confidenceLevel }));

    return h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance profile" }),
        h("div", { class: "val kpi-pills" }, [
          h("span", { class: "pill met",  text: c.achieved + " Achieved" }),
          h("span", { class: "pill near", text: c.partially + " Partially" }),
          h("span", { class: "pill gap",  text: c.not + " Not" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Gaps (Partially + Not)" }),
        h("div", { class: "val " + (ov.gaps > 0 ? "gap" : "met"), text: String(ov.gaps) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Weakest area" }),
        h("div", { class: "val kpi-small", text: worst })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        coverageVal
      ])
    ]);
  }

  function nis2Legend() {
    return h("div", { class: "legend" }, [
      h("span", null, [h("span", { class: "sw met"  }), "Achieved"]),
      h("span", null, [h("span", { class: "sw near" }), "Partially achieved"]),
      h("span", null, [h("span", { class: "sw gap"  }), "Not achieved"]),
      h("span", null, [h("span", { class: "sw", style: "background:#94A0AD;" }), "Unknown"]),
      h("span", null, [h("span", { class: "sw", style: "background:#CBD5DE;" }), "Not applicable"])
    ]);
  }

  function nis2ResultsCard(scored) {
    var N = window.App.ScoringNIS2;
    var rows = scored.byCategory.map(function (g) {
      return { label: g.categoryId + " " + g.name, achieved: g.counts.achieved, partially: g.counts.partially, not: g.counts.not, unknown: g.counts.unknown, na: g.counts.na };
    });
    var chart = window.App.Charts.cafStateBars(rows, { width: 1000, labelWidth: 320 });
    chart.style.maxWidth = "100%";   // scale down on narrow screens, use the space on wide ones
    chart.style.height = "auto";
    var chartWrap = h("div", null, []); chartWrap.appendChild(chart);

    var head = h("thead", null, [h("tr", null, [
      h("th", null, ["NIS2 area"]),
      h("th", { class: "center" }, ["Achieved"]),
      h("th", { class: "center" }, ["Partially"]),
      h("th", { class: "center" }, ["Not"]),
      h("th", { class: "center" }, ["Unknown"]),
      h("th", { class: "center" }, ["N/A"]),
      h("th", { class: "center" }, ["Applicable"]),
      h("th", { class: "center" }, ["Conformance"])
    ])]);
    var body = h("tbody", null, scored.byCategory.map(function (g) {
      var c = g.counts;
      return h("tr", null, [
        h("td", null, [h("strong", { text: g.categoryId }), " " + g.name, g.article ? h("span", { class: "muted", style: "margin-left:6px;", text: g.article }) : null]),
        h("td", { class: "center met"  }, [String(c.achieved)]),
        h("td", { class: "center near" }, [String(c.partially)]),
        h("td", { class: "center gap"  }, [String(c.not)]),
        h("td", { class: "center" }, [String(c.unknown)]),
        h("td", { class: "center" }, [String(c.na)]),
        h("td", { class: "center" }, [String(g.total)]),
        h("td", { class: "center", text: N.formatPct(g.conformance) })
      ]);
    }));
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Results by NIS2 area" }), nis2Legend()]),
      h("div", { class: "card-b" }, [chartWrap, h("div", { class: "spacer-12" }), h("table", { class: "tbl" }, [head, body])])
    ]);
  }

  function nis2RoadmapCard(scored, instrument, planning) {
    var interactive = !!planning;
    roadmapDrag.id = null; roadmapDrag.moved = false;  // fresh DOM each render
    if (!scored.roadmap || scored.roadmap.length === 0) {
      return h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Gap roadmap" })]),
        h("div", { class: "card-b" }, [h("p", { class: "muted", text: "No applicable obligation is Partially or Not Achieved." })])
      ]);
    }
    var head = h("thead", null, [h("tr", null, [
      h("th", { style: "width:104px;" }, ["Priority"]),
      h("th", null, ["Obligation"]),
      h("th", { style: "width:118px;" }, ["State"]),
      h("th", { style: "width:150px;" }, ["Owner"]),
      h("th", null, ["Recommended action"])
    ])]);
    var rows = scored.roadmap.map(function (it, i) {
      var bandLabel = nis2PriBandLabel(it.priorityBand);
      var priCell = h("td", { class: "rm-pri" }, [
        interactive ? h("span", { class: "rm-handle", title: "Drag to set priority order", text: "⋮⋮" }) : null,
        h("span", { class: "pri-badge", text: "P" + (i + 1) }),
        bandLabel ? h("span", { class: "pri-band " + it.priorityBand, text: bandLabel })
                  : (interactive ? h("span", { class: "muted small", text: "set band" }) : null)
      ]);
      var oblCell = h("td", null, [
        h("strong", { text: it.code + " " + it.title }),
        h("div", { class: "muted small", text: it.categoryId + (it.articleRef ? " · " + it.articleRef : "") }),
        it.evidence ? h("div", { class: "small", style: "margin-top:4px; color:var(--text-muted);", text: "Evidence: " + it.evidence }) : null,
        // Consultant's captured notes, to hand while writing the action/impact.
        it.notes ? h("div", { class: "small", style: "margin-top:4px; color:var(--text-muted);", text: "Notes: " + it.notes }) : null,
        it.impact ? h("div", { class: "small", style: "margin-top:4px;" }, [h("strong", { text: "Impact: " }), it.impact]) : null
      ]);
      var stateCell = h("td", null, [h("span", { class: "pill " + nis2Band(it.state), text: nis2StateLabel(it.state, instrument) })]);
      var ownerCell = h("td", null, [
        it.owner ? document.createTextNode(it.owner)
                 : (interactive ? h("span", { class: "muted small", text: "unassigned" }) : h("span", { class: "muted", text: "-" }))
      ]);
      var actionCell = h("td", { style: "max-width:340px;" }, [
        it.action ? document.createTextNode(it.action)
                  : (interactive ? h("span", { class: "muted small", text: "click row to add…" }) : h("span", { class: "muted", text: "-" }))
      ]);
      var tr = h("tr", interactive ? { class: "rm-row" } : null, [priCell, oblCell, stateCell, ownerCell, actionCell]);
      if (interactive) wireRoadmapRow(tr, it.itemId, planning);
      return tr;
    });
    var leadText = interactive
      ? "Drag rows to set the priority order; click a row to update the captured evidence and record the owner, recommended action, business impact and priority band. These flow straight into the Excel and Word exports."
      : "Every applicable obligation that is Partially or Not Achieved, Not Achieved first. Priority, owner, business impact and recommended action are set by the consultant.";
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Gap roadmap" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin:0 0 10px;", text: leadText }),
        h("table", { class: "tbl" + (interactive ? " rm-table" : "") }, [head, h("tbody", null, rows)])
      ])
    ]);
  }

  function renderNIS2(container, opts) {
    var engagement = opts.engagement;
    var instrument = opts.instrument;
    var scored     = opts.scored;
    var target     = opts.activeTarget;

    // Not-compliance caveat, prominent, first.
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformance and gap analysis (not a compliance determination)" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: "This is a readiness and gap analysis against the obligations of the EU NIS2 Directive (Directive (EU) 2022/2555). It is the consultant's judgement of each obligation as Achieved, Partially Achieved or Not Achieved, and no single grade or pass mark is produced. It is not a determination of legal compliance with NIS2 or with the national law that transposes it; confirm scope against the applicable national transposition." })
      ])
    ]));

    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformance headline - " + (target ? target.name : "") })]),
      h("div", { class: "card-b" }, [ nis2KpiRow(scored) ])
    ]));

    container.appendChild(nis2ResultsCard(scored));
    container.appendChild(nis2RoadmapCard(scored, instrument, opts.planning));

    // Standing prose + cover sheet close the preview.
    var nis2Boiler = boilerplateStack([
      withAttribution(proseCard("About this assessment", instrument.framing), instrument),
      proseCard("How to read this report", "Each NIS2 obligation is judged Achieved, Partially Achieved or Not Achieved against full conformance with the Directive. Results are reported as a conformance profile by NIS2 area; the conformance percentage is shown for context only and is not a pass mark. Unknown reduces coverage and lowers confidence; Not applicable obligations are excluded.")
    ]);
    if (nis2Boiler) container.appendChild(nis2Boiler);
    appendReportTail(container, opts);
  }

  // ---- risk-appetite-coherence renderer ------------------------------------
  //
  // The plot IS the headline - the instrument says so - so it comes first and
  // the prose explains it rather than the other way round. There is no grade
  // card, no KPI row of percentages, and nothing that could be lifted out and
  // compared against another client's number.

  function raTitle(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  // ---- names in pack prose (all families) --------------------------------
  //
  // Pack boilerplate used to say "the organisation named on the title page",
  // which is what you write when you do not know the name. We always do. Packs
  // now carry {clientName}, {clientShort} and {targetName}, and the pack is
  // filled with them once, where a report is built (Report.render and
  // ExportDOCX.buildAsync), so the dozen places that print boilerplate
  // verbatim all get the name without each having to know.
  //
  // {clientName}  the name as entered, for the first mention: "Wearvale Water plc"
  // {clientShort} without the legal suffix, for every mention after that:
  //               "Wearvale Water". "Wearvale Water plc's services" is not how
  //               anyone writes.
  // {targetName}  the site, product or supplier assessed, for instruments whose
  //               subject is not the client itself (the supplier screener).
  // Not "Co": in "Smith & Co Ltd" it is part of the name, and stripping it
  // leaves "Smith &".
  var LEGAL_SUFFIX = /,?\s+(plc|p\.l\.c\.|ltd\.?|limited|llp|l\.l\.p\.|llc|inc\.?|incorporated|corp\.?|gmbh|ag|s\.a\.|b\.v\.|bv|n\.v\.|nv|pty\.?)$/i;
  function clientShortName(name) {
    var s = String(name || "").trim();
    for (var i = 0; i < 3 && LEGAL_SUFFIX.test(s); i++) s = s.replace(LEGAL_SUFFIX, "").trim();
    return s || String(name || "").trim();
  }

  // A target still called "Supplier 1" or "Site 1" has not been named, and
  // "the cyber exposure carried through Supplier 1" is worse than saying so.
  function namedTarget(target, instrument) {
    var name = target && String(target.name || "").trim();
    var label = String((instrument && instrument.targetDimensionLabel) || "Site").split(" (")[0].trim();
    if (!name || new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\d+$", "i").test(name)) {
      return "the " + label.toLowerCase() + " assessed";
    }
    return name;
  }

  function identitySlots(engagement, instrument, target) {
    var e = (engagement && engagement.engagement) || {};
    var full = String(e.clientName || "").trim();
    if (!target && engagement && engagement.targets) target = engagement.targets[0];
    return {
      clientName: full || "the organisation",
      clientShort: full ? clientShortName(full) : "the organisation",
      targetName: namedTarget(target, instrument)
    };
  }

  // A deep copy of the pack with the identity slots filled. Every other slot is
  // left alone for the family's own composer to fill later, which is why this
  // can run before any scoring is known. Never mutates the loaded pack: that
  // object is shared by every report built in the session.
  function personaliseNarrative(narrative, engagement, instrument, target) {
    if (!narrative || typeof narrative !== "object") return narrative;
    var slots = identitySlots(engagement, instrument, target);
    return (function copy(v) {
      if (typeof v === "string") return raFill(v, slots);
      if (Array.isArray(v)) return v.map(copy);
      if (v && typeof v === "object") {
        var o = {};
        Object.keys(v).forEach(function (k) { o[k] = copy(v[k]); });
        return o;
      }
      return v;
    })(narrative);
  }

  // The narrative pack (data/instruments/risk-appetite/narrative.json). The
  // report is handed it as opts.narrative; the Word builder and the next-steps
  // draft are not always, so fall back to the loaded data by instrument id,
  // filled with the client's name where the engagement is known.
  function raNarrative(narrative, instrument, engagement) {
    if (narrative && (narrative.boilerplate || narrative.executiveSummary)) return narrative;
    var id = instrument && instrument.id;
    var slot = id && window.App.Data && window.App.Data.instruments && window.App.Data.instruments[id];
    var pack = (slot && slot.narrative) || {};
    return engagement ? personaliseNarrative(pack, engagement, instrument) : pack;
  }

  // Unknown slots are left in place, so a template can be filled in stages.
  // A lower-case value landing at the start of a sentence is capitalised:
  // "the organisation" stands in for a missing name, and sometimes it opens one.
  function raFill(tpl, slots) {
    return String(tpl || "").replace(/\{(\w+)\}/g, function (m, k, offset, whole) {
      if (!(slots && slots[k] != null)) return m;
      var val = String(slots[k]);
      var before = whole.slice(0, offset);
      if (/^[a-z]/.test(val) && (/^\s*$/.test(before) || /[.!?]\s+$/.test(before))) {
        val = val.charAt(0).toUpperCase() + val.slice(1);
      }
      return val;
    });
  }

  // One slot set for the screen, the Word document and anything else that
  // composes from the pack, so the three can never describe the same result
  // in different words. Bands go in lower case because they sit mid-sentence.
  function riskAppetiteSlots(scored, engagement) {
    var e = (engagement && engagement.engagement) || {};
    var v = (scored && scored.verdict) || {};
    var svr = scored && scored.statedVsRevealed;
    var lower = function (s) { return s ? String(s).toLowerCase() : ""; };
    // "an averse appetite", "a cautious appetite": two of the four appetite
    // bands start with a vowel, so the article has to travel with the band.
    var withArticle = function (s) { return s ? ((/^[aeiou]/i.test(s) ? "an " : "a ") + s) : ""; };
    var ids = identitySlots(engagement, null);
    return {
      clientName: ids.clientName,
      clientShort: ids.clientShort,
      exposureBand: lower(scored && scored.exposure && scored.exposure.band),
      appetiteBand: lower(scored && scored.appetite && scored.appetite.band),
      aAppetiteBand: withArticle(lower(scored && scored.appetite && scored.appetite.band)),
      warrantedBand: lower(v.warrantedBand),
      aWarrantedBand: withArticle(lower(v.warrantedBand)),
      aStatedBand: withArticle(lower(svr && svr.statedBand)),
      aRevealedBand: withArticle(lower(svr && svr.revealedBand)),
      verdictLower: lower(v.label),
      statedBand: lower(svr && svr.statedBand),
      revealedBand: lower(svr && svr.revealedBand),
      sectorName: (scored && scored.exposure && scored.exposure.sectorName) || "",
      answeredCount: (scored && scored.coverage && scored.coverage.answered) || 0,
      totalCount: (scored && scored.coverage && scored.coverage.total) || 0,
      rationale: v.rationale || ""
    };
  }

  function raExtend(slots, extra) {
    var o = {};
    Object.keys(slots || {}).forEach(function (k) { o[k] = slots[k]; });
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function raJoinAnd(list) {
    if (list.length <= 1) return list.join("");
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }
  function raItemPhrase(N, it) {
    var P = N.item_phrases || {};
    return P[it.itemId] || String(it.title || "").toLowerCase();
  }

  // The appetite half of the headline. Where the technical review reads
  // differently from the interviews, the headline carries BOTH readings, so the
  // top line has the same force as the body instead of quoting the gentler one.
  // "On either reading" is added only when both readings genuinely reach the
  // verdict given: with severe exposure a cautious stated appetite reads as
  // aligned and only the tolerant revealed one as under-protected, so there it
  // would be untrue.
  function riskAppetiteAppetiteSentence(scored, N, slots) {
    var T = (N.executiveSummary && N.executiveSummary.templates) || {};
    var svr = scored && scored.statedVsRevealed;
    var v = (scored && scored.verdict) || {};
    var key = !svr ? "exec_appetite_single"
            : svr.gap > 0 ? "exec_appetite_revealed_looser"
            : svr.gap < 0 ? "exec_appetite_revealed_tighter"
            : "exec_appetite_revealed_match";
    var s = raFill(T[key] || T.exec_appetite_single || "", slots);
    if (riskAppetiteEitherReading(scored) && T.exec_either_reading) s += " " + raFill(T.exec_either_reading, slots);
    return s;
  }
  function riskAppetiteEitherReading(scored) {
    var svr = scored && scored.statedVsRevealed;
    var k = scored && scored.verdict && scored.verdict.key;
    return !!(svr && svr.gap !== 0 && k && k !== "incomplete" &&
              svr.verdictOnStated === k && svr.verdictOnRevealed === k);
  }

  function riskAppetiteVerdictOpener(scored, N, slots) {
    var T = (N.executiveSummary && N.executiveSummary.templates) || {};
    var key = scored && scored.verdict && scored.verdict.key;
    var tpl = T["exec_verdict_" + key];
    if (!tpl) return "";
    var s = raFill(tpl, raExtend(slots, { appetiteSentence: riskAppetiteAppetiteSentence(scored, N, slots) }));
    var lean = riskAppetiteLeanSentence(scored, N, slots);
    return lean ? s + " " + lean : s;
  }

  // Which way an aligned read leans, when it is one band off the line. Never
  // for a verdict the assessor set: the lean comes from the band arithmetic.
  function riskAppetiteLeanSentence(scored, N, slots) {
    var v = (scored && scored.verdict) || {};
    if (v.key !== "aligned" || !v.lean || v.overridden) return "";
    var tpl = (N.verdict_narrative || {})["lean_" + v.lean];
    return tpl ? raFill(tpl, slots) : "";
  }
  function riskAppetiteVerdictLabel(scored) {
    var v = (scored && scored.verdict) || {};
    return v.displayLabel || v.label || "Not yet characterised";
  }

  // Why the exposure headline sits above some of its own readings. Only said
  // where it is true: the section follows the worst reading, the band set IS
  // that worst reading, and at least one reading sits below it. If the assessor
  // has set exposure away from the highest reading, this rule was not what set
  // it, and the sentence would misdescribe the judgement.
  function riskAppetiteExposureDrivers(scored, N, slots) {
    var T = (N.executiveSummary && N.executiveSummary.templates) || {};
    var sec = scored && scored.exposure && scored.exposure.section;
    var rank = scored && scored.exposure && scored.exposure.rank;
    if (!T.exec_exposure_drivers || !sec || sec.rollUp !== "worst" || !rank) return null;
    var items = (sec.items || []).filter(function (i) { return i.rank > 0; });
    var maxRank = items.reduce(function (a, i) { return Math.max(a, i.rank); }, 0);
    if (!items.length || maxRank !== rank) return null;
    var lower = items.filter(function (i) { return i.rank < rank; });
    if (!lower.length) return null;

    var order = N.exposure_driver_priority || [];
    var pos = function (it) { var i = order.indexOf(it.itemId); return i < 0 ? 99 : i; };
    var byPos = function (a, b) { return pos(a) - pos(b); };
    var drivers = items.filter(function (i) { return i.rank === rank; }).sort(byPos).slice(0, 2)
      .map(function (it) { return raItemPhrase(N, it); });

    var groups = {};
    lower.forEach(function (it) { (groups[it.band] = groups[it.band] || []).push(it); });
    var clause = Object.keys(groups)
      .sort(function (a, b) { return groups[b][0].rank - groups[a][0].rank; })
      .map(function (b) {
        // In the order they appear in the table the reader is looking at. The
        // priority order is only for choosing which drivers to name.
        var list = groups[b].map(function (it) { return raItemPhrase(N, it); });
        return raJoinAnd(list) + (list.length > 1 ? " are" : " is") + " rated " + b;
      }).join(", and ");

    return raFill(T.exec_exposure_drivers, raExtend(slots, {
      driverList: raJoinAnd(drivers),
      lowerClause: clause,
      lowerRef: lower.length === 1 ? "it does" : "they do"
    }));
  }

  // Single appetite readings that matter more than their weight: chiefly how
  // risk gets accepted. Informal acceptance is the mechanism of drift, so where
  // it reads looser than the appetite picture it is named outright rather than
  // left as one row in a table.
  function riskAppetiteSpotlights(scored, N, slots) {
    var S = N.item_spotlight || {};
    var app = scored && scored.appetite;
    var sec = app && app.section;
    var out = [];
    if (!sec || !app.rank) return out;
    var v = scored.verdict || {};
    var svr = scored.statedVsRevealed;
    var drift = v.key === "under-protected" || !!(svr && svr.gap > 0);
    Object.keys(S).forEach(function (id) {
      if (id.charAt(0) === "_" || !S[id]) return;
      var it = (sec.items || []).filter(function (i) { return i.itemId === id; })[0];
      if (!it) return;
      // Nobody could say how risk gets accepted: that is the finding, and a
      // stronger one than any band would have been.
      if (it.notEstablished) {
        if (S[id].not_established) out.push(raFill(S[id].not_established, slots));
        return;
      }
      if (!it.rank || it.rank <= app.rank) return;
      // Other appetite readings at the same band are named with it, so the
      // summary does not single out one reading the table shows is not alone.
      var peers = (sec.items || []).filter(function (o) {
        return o.itemId !== id && !o.notEstablished && o.rank === it.rank;
      });
      var tpl = peers.length
        ? (drift ? (S[id].drift_shared || S[id].drift) : (S[id].no_drift_shared || S[id].no_drift))
        : (drift ? S[id].drift : S[id].no_drift);
      if (!tpl) return;
      out.push(raFill(tpl, raExtend(slots, {
        itemBand: String(it.band || "").toLowerCase(),
        sectionBand: String(app.band || "").toLowerCase(),
        otherItems: raJoinAnd(peers.map(function (o) { return raItemPhrase(N, o); }))
      })));
    });
    return out;
  }

  // Why some technical readings are not counted as appetite. Returns the
  // sentences to print beside the technical readings, which may be none.
  var RA_NUM_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  function riskAppetiteRevealedNotes(scored, N, slots) {
    var RN = N.revealed_notes || {};
    var sec = scored && scored.techSection;
    var out = [];
    if (!sec || (!sec.answeredCount && !sec.notEstablishedCount)) return out;
    function note(kind, n) {
      var tpl = n === 1 ? RN[kind + "_one"] : RN[kind + "_many"];
      if (tpl) out.push(raFill(tpl, raExtend(slots, { countWord: RA_NUM_WORDS[n] || String(n) })));
    }
    if (sec.constrainedCount) note("constrained", sec.constrainedCount);
    var ne = riskAppetiteNotEstablishedNote(sec, N, slots, "technical");
    if (ne) out.push(ne);
    if (!sec.countedCount && (sec.answeredCount || sec.notEstablishedCount) && RN.none_counted) {
      out.push(raFill(RN.none_counted, slots));
    }
    return out;
  }

  // Readings in a section that could not be established, named. `kind` is
  // exposure, appetite or technical: not knowing the threat picture is a gap
  // in information, not knowing how risk gets accepted is a governance finding,
  // and the pack words them differently.
  function riskAppetiteNotEstablishedNote(sec, N, slots, kind) {
    var NE = N.not_established || {};
    var items = (sec && sec.notEstablishedItems) || [];
    if (!items.length) return null;
    var tpl = items.length === 1 ? NE[kind + "_one"] : NE[kind + "_many"];
    if (!tpl) return null;
    return raFill(tpl, raExtend(slots, {
      countWord: RA_NUM_WORDS[items.length] || String(items.length),
      itemList: raJoinAnd(items.map(function (it) { return raItemPhrase(N, it); }))
    }));
  }
  function riskAppetiteKindOf(axis) {
    return axis === "exposure" ? "exposure" : axis === "appetite" ? "appetite" : "technical";
  }
  // The technical section to show. Normally the revealed reading; but where
  // every technical reading was a managed constraint or unknown there is no
  // revealed reading, and the section must still appear so the report says so
  // rather than the technical review silently vanishing.
  function riskAppetiteTechAxis(scored) {
    if (scored && scored.revealed) return scored.revealed;
    var sec = scored && scored.techSection;
    if (!sec || (!sec.answeredCount && !sec.notEstablishedCount)) return null;
    return { axis: "appetite-revealed", label: sec.name, band: null, bandLabel: "No revealed reading", section: sec };
  }

  // How a technical reading was treated, in client words.
  function riskAppetiteTreatedAs(N, item) {
    var T = (N.revealed_notes && N.revealed_notes.treated_as) || {};
    if (item.notEstablished) return T.unknown || "Not established";
    return T[item.disposition || "accepted"] || T.accepted || "";
  }

  // ---- change since the previous assessment -----------------------------
  // Composed once, from the pack, for the screen card, the Word section and the
  // Excel sheet. `progress` is the export payload shape: { sourceLine, fit,
  // movements }. Returns null for anything that is not a risk appetite
  // comparison, so callers can fall back to the generic progress output.
  function riskAppetiteProgressText(progress, N, slots) {
    var fit = progress && progress.fit;
    if (!fit) return null;
    var P = N.progress || {};
    var lower = function (s) { return s ? String(s).toLowerCase() : ""; };
    var art = function (s) { return s ? ((/^[aeiou]/i.test(s) ? "an " : "a ") + lower(s)) : ""; };
    var out = { heading: P.heading || "Change since the previous assessment" };
    out.intro = P.intro ? raFill(P.intro, raExtend(slots, { sourceLine: progress.sourceLine || "an earlier engagement" })) : "";
    if (fit.prev.complete && fit.curr.complete && P.verdict_line) {
      out.verdictLine = raFill(P.verdict_line, raExtend(slots, {
        prevVerdict: lower(fit.prev.verdictLabel), currVerdict: lower(fit.curr.verdictLabel),
        prevExposure: lower(fit.prev.exposureBand), currExposure: lower(fit.curr.exposureBand),
        aPrevAppetite: art(fit.prev.appetiteBand), aCurrAppetite: art(fit.curr.appetiteBand)
      }));
    }
    out.direction = fit.direction && P["direction_" + fit.direction] ? raFill(P["direction_" + fit.direction], slots) : "";
    var n = (progress.movements || []).filter(function (m) { return m.change === "moved"; }).length;
    var tpl = n === 0 ? P.moved_none : n === 1 ? P.moved_one : P.moved_many;
    out.moved = tpl ? raFill(tpl, raExtend(slots, { countWord: RA_NUM_WORDS[n] || String(n) })) : "";
    out.chartNote = P.chart_note ? raFill(P.chart_note, slots) : "";
    return out;
  }

  // The appetite value in a headline row: one band, or both readings.
  function riskAppetiteHeadlineValue(scored) {
    var svr = scored && scored.statedVsRevealed;
    var app = scored && scored.appetite;
    if (svr && svr.gap !== 0) {
      return "stated " + raTitle(svr.statedBand) + ", revealed " + raTitle(svr.revealedBand) +
        (riskAppetiteEitherReading(scored) ? "; " + String(scored.verdict.label).toLowerCase() + " on either reading" : "");
    }
    return (app && app.bandLabel) || "not set";
  }

  // Which of the pack's stated-against-revealed sentences applies, or null.
  function riskAppetiteRevealedText(scored, N, slots) {
    var svr = scored && scored.statedVsRevealed;
    var T = (N.executiveSummary && N.executiveSummary.templates) || {};
    if (!svr) return null;
    var key = svr.gap === 0 ? "exec_revealed_match"
            : svr.gap > 0 ? (svr.material ? "exec_revealed_looser_material" : "exec_revealed_looser_minor")
            : "exec_revealed_tighter";
    return T[key] ? raFill(T[key], slots) : svr.note;
  }

  function raVerdictCard(scored, N, slots, progress) {
    var v = scored.verdict || {};
    var VN = N.verdict_narrative || {};
    var kids = [
      h("div", { class: "ra-verdict" }, [
        h("span", { class: "ra-verdict-badge " + (v.key || "incomplete") + (v.lean === "under-protected" ? " leaning-under" : ""),
                    text: riskAppetiteVerdictLabel(scored) }),
        h("span", { class: "muted" }, [
          scored.exposure.bandLabel
            ? (scored.exposure.label + ": " + scored.exposure.bandLabel)
            : (scored.exposure.label + ": not set"),
          "  |  ",
          scored.appetite.label + ": " + riskAppetiteHeadlineValue(scored)
        ])
      ]),
      // The pack's explanation, written for a board. v.explanation is the
      // scoring profile's rule text, written for whoever maintains the scoring.
      h("p", { text: [VN["explanation_" + v.key] || v.explanation || "", riskAppetiteLeanSentence(scored, N, slots)]
        .filter(Boolean).join(" ") })
    ];
    // The governance root cause, named where it applies rather than left as one
    // row in the appetite table.
    riskAppetiteSpotlights(scored, N, slots).forEach(function (t) { kids.push(h("p", { text: t })); });
    // Since the previous assessment: the one direction that means something.
    var pgt = riskAppetiteProgressText(progress, N, slots);
    if (pgt && pgt.direction) kids.push(h("p", { text: pgt.direction }));
    // Where the assessor has set the verdict, the deliverable carries their
    // REASONING and nothing about the tool. It never says they agreed or
    // disagreed with a computed default, and never states what the arithmetic
    // would otherwise have concluded: the client is paying for the consultant's
    // judgement, not for a commentary on software. The computed read is kept on
    // the result and shown on the assessor's-read capture page instead.
    if (v.overridden) {
      kids.push(v.rationale
        ? h("p", null, [h("strong", { text: VN.reasoning_label || "Assessor's reasoning: " }), v.rationale])
        : h("p", { class: "placeholder-note", text:
            VN.reasoning_missing || "The reasoning behind this verdict has not been recorded yet." }));
    } else if (v.warrantedBand) {
      // The sentence a consultant actually says in the room. Not repeated where
      // the assessor has given their own reasoning, which says it better.
      var plain = VN["plain_terms_" + v.key];
      if (plain) kids.push(h("p", null, [h("strong", { text: "In plain terms: " }), raFill(plain, slots)]));
    }
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "The verdict" })]),
      h("div", { class: "card-b" }, kids)
    ]);
  }

  function raPlotCard(scored, N, progress, slots) {
    var B = N.boilerplate || {};
    var body = [];
    var fit = progress && progress.fit;
    var prev = fit && fit.prev && fit.prev.complete
      ? { exposureRank: fit.prev.exposureRank, appetiteRank: fit.prev.appetiteRank } : null;
    if (window.App.Charts && window.App.Charts.exposureAppetitePlot) {
      body.push(window.App.Charts.exposureAppetitePlot(scored, { previous: prev }));
    }
    if (B.chart_note) body.push(h("p", { class: "muted small", style: "margin-bottom:0;", text: B.chart_note }));
    var pt = prev && riskAppetiteProgressText(progress, N, slots);
    if (pt && pt.chartNote) body.push(h("p", { class: "muted small", style: "margin:4px 0 0;", text: pt.chartNote }));
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Exposure against appetite" })]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  function raAxisCard(axis, scored, N, slots) {
    // Technical readings carry how each was treated, so a reader can see which
    // were counted as appetite and which were managed constraints.
    var isTech = axis.axis === "appetite-revealed";
    var rows = ((axis.section && axis.section.items) || []).map(function (it) {
      var cells = [
        h("td", null, [h("strong", { text: it.code }), h("div", { class: "muted small", text: it.title })]),
        h("td", null, [it.notEstablished ? "Not established" : (it.bandLabel || "-")])
      ];
      if (isTech && N) cells.push(h("td", null, [(it.band || it.notEstablished) ? riskAppetiteTreatedAs(N, it) : "-"]));
      // What the reading rests on, under what it says, as in the Word document.
      cells.push(h("td", null, [
        it.characterisation || "",
        it.evidence ? h("div", { class: "muted small", style: "margin-top:4px;" }, [
          h("strong", { text: "Evidence: " }), it.evidence
        ]) : null
      ]));
      return h("tr", null, cells);
    });
    // No provenance narration here. Whether a band came from the sector
    // baseline, the item roll-up or the assessor's pen is internal scaffolding
    // - saying so would tell the client which parts the consultant "agreed"
    // with, and every band in this report is the consultant's either way.
    var body = [
      h("p", { style: "margin-top:0;" }, [ h("strong", { text: axis.bandLabel || "Not set" }) ])
    ];
    if (axis.meaning) body.push(h("p", { class: "muted", text: axis.meaning }));
    if (axis.axis === "exposure" && axis.sectorName) {
      body.push(h("p", { class: "muted small", text: "Sector: " + axis.sectorName }));
    }
    // A board member seeing two Highs in a table under a Severe headline will
    // ask why. Answer it before they do.
    if (axis.axis === "exposure" && N) {
      var drivers = riskAppetiteExposureDrivers(scored, N, slots);
      if (drivers) body.push(h("p", { text: drivers }));
    }
    if (isTech && N) {
      riskAppetiteRevealedNotes(scored, N, slots).forEach(function (t) { body.push(h("p", { text: t })); });
    } else if (N) {
      var ne = riskAppetiteNotEstablishedNote(axis.section, N, slots, riskAppetiteKindOf(axis.axis));
      if (ne) body.push(h("p", { text: ne }));
    }
    if (rows.length) {
      var heads = [h("th", null, ["Item"]), h("th", null, ["Band"])];
      if (isTech && N) heads.push(h("th", null, ["Treated as"]));
      heads.push(h("th", null, ["Characterisation"]));
      body.push(h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, heads)]),
        h("tbody", null, rows)
      ]));
    }
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: axis.label })]),
      h("div", { class: "card-b" }, body)
    ]);
  }

  function raStatedVsRevealedCard(scored, N, slots) {
    var svr = scored.statedVsRevealed;
    if (!svr) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Stated against revealed appetite" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "margin-top:0;" }, [
          h("strong", { text: "Stated " + raTitle(svr.statedBand) + ", revealed " + raTitle(svr.revealedBand) }),
          svr.material ? h("span", { class: "muted", text: "  (a material gap)" }) : null
        ]),
        h("p", { text: riskAppetiteRevealedText(scored, N, slots) })
      ])
    ]);
  }

  function renderRiskAppetite(container, opts) {
    var instrument = opts.instrument;
    var scored     = opts.scored;
    if (!scored) return;
    var N = raNarrative(opts.narrative, instrument);
    var B = N.boilerplate || {};
    var slots = riskAppetiteSlots(scored, opts.engagement);

    // The caveat leads, because this instrument is a characterisation and the
    // single worst outcome is a client reading it as a measurement.
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: B.not_measurement_caveat_title || "A characterisation, not a measurement" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: B.not_measurement_caveat || (instrument.criticalCaveats && instrument.criticalCaveats[0]) ||
            "This is a professional characterisation of exposure and appetite, not a measurement against a standard." })
      ])
    ]));

    container.appendChild(raPlotCard(scored, N, opts.riskAppetiteProgress, slots));
    container.appendChild(raVerdictCard(scored, N, slots, opts.riskAppetiteProgress));
    var svrCard = raStatedVsRevealedCard(scored, N, slots);
    if (svrCard) container.appendChild(svrCard);
    container.appendChild(raAxisCard(scored.exposure, scored, N, slots));
    container.appendChild(raAxisCard(scored.appetite, scored, N, slots));
    var techAxis = riskAppetiteTechAxis(scored);
    if (techAxis) container.appendChild(raAxisCard(techAxis, scored, N, slots));

    // aboutCard takes about_instrument and series_context from the pack, the
    // same two paragraphs every other family's About carries.
    var raBoiler = boilerplateStack([
      aboutCard(instrument, N),
      proseCard("How to read this report", B.how_to_read),
      proseCard("Where the bands come from", B.bands_source)
    ]);
    if (raBoiler) container.appendChild(raBoiler);
    appendReportTail(container, opts);
  }

  // ---- csms-conformance renderer (ISA/IEC 62443-2-1:2010 CSMS) --------------
  function csmsBand(state) {
    if (state === "in-place")     return "met";
    if (state === "largely")      return "exceeds";
    if (state === "partially")    return "near";
    if (state === "not-in-place") return "gap";
    return "na";
  }
  function csmsStateLabel(state, profile) {
    var L = window.App.ScoringCSMS.stateLabelFor(state, profile);
    return L || "Not set";
  }
  function csmsKpiRow(scored) {
    var C = window.App.ScoringCSMS;
    var ov = scored.overall, c = ov.counts;
    var worst = (scored.worstCategories || []).map(function (x) { return x.name; }).join("; ") || "None";
    var coverageVal = h("div", { class: "val" + (ov.confidenceLevel ? " kpi-stack" : "") }, [C.formatPct(ov.coverage)]);
    if (ov.confidenceLevel) coverageVal.appendChild(h("div", { class: "kpi-sub", text: ov.confidenceLevel }));
    return h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance profile" }),
        h("div", { class: "val kpi-pills" }, [
          h("span", { class: "pill met",     text: c.inPlace + " In place" }),
          h("span", { class: "pill exceeds", text: c.largely + " Largely" }),
          h("span", { class: "pill near",    text: c.partially + " Partially" }),
          h("span", { class: "pill gap",     text: c.notInPlace + " Not in place" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Gaps (Not in place + Partially)" }),
        h("div", { class: "val " + (ov.gaps > 0 ? "gap" : "met"), text: String(ov.gaps) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Weakest category" }),
        h("div", { class: "val kpi-small", text: worst })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        coverageVal
      ])
    ]);
  }
  function csmsAreaTable(areaHead, areas) {
    var C = window.App.ScoringCSMS;
    var head = h("thead", null, [h("tr", null, [
      h("th", null, [areaHead]),
      h("th", { class: "center" }, ["In place"]),
      h("th", { class: "center" }, ["Largely"]),
      h("th", { class: "center" }, ["Partially"]),
      h("th", { class: "center" }, ["Not in place"]),
      h("th", { class: "center" }, ["Unknown"]),
      h("th", { class: "center" }, ["N/A"]),
      h("th", { class: "center" }, ["Applicable"]),
      h("th", { class: "center" }, ["Conformance"])
    ])]);
    var body = h("tbody", null, areas.map(function (g) {
      var c = g.counts;
      return h("tr", null, [
        h("td", null, [h("strong", { text: g.name })]),
        h("td", { class: "center met"     }, [String(c.inPlace)]),
        h("td", { class: "center exceeds" }, [String(c.largely)]),
        h("td", { class: "center near"    }, [String(c.partially)]),
        h("td", { class: "center gap"     }, [String(c.notInPlace)]),
        h("td", { class: "center" }, [String(c.unknown)]),
        h("td", { class: "center" }, [String(c.na)]),
        h("td", { class: "center" }, [String(g.total)]),
        h("td", { class: "center", text: C.formatPct(g.conformance) })
      ]);
    }));
    return h("table", { class: "tbl" }, [head, body]);
  }
  function csmsLegend() {
    return h("div", { class: "legend" }, [
      h("span", null, [h("span", { class: "sw met"  }), "In place"]),
      h("span", null, [h("span", { class: "sw", style: "background:var(--brand-blue-dark,#1d4ed8);" }), "Largely in place"]),
      h("span", null, [h("span", { class: "sw near" }), "Partially in place"]),
      h("span", null, [h("span", { class: "sw gap"  }), "Not in place"])
    ]);
  }
  function renderCSMS(container, opts) {
    var engagement = opts.engagement, instrument = opts.instrument, scored = opts.scored, target = opts.activeTarget;
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformance and gap analysis (not a certification)" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: "This is a conformance and gap analysis of the CSMS against ISA/IEC 62443-2-1:2010. It records the consultant's judgement of each element as Not in place, Partially in place, Largely in place or In place; no single CSMS grade is produced. It is not a certification or a statement of conformance with the standard." })
      ])
    ]));
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformance headline - " + (target ? target.name : "") })]),
      h("div", { class: "card-b" }, [ csmsKpiRow(scored) ])
    ]));
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Results by category" }), csmsLegend()]),
      h("div", { class: "card-b" }, [ csmsAreaTable("Category", scored.byCategory) ])
    ]));
    if (scored.byGroup && scored.byGroup.length) {
      container.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Results by element group" })]),
        h("div", { class: "card-b" }, [ csmsAreaTable("Element group", scored.byGroup) ])
      ]));
    }
    container.appendChild(remediationRoadmapCard({
      scored: scored, planning: opts.planning,
      title: "Conformance gap roadmap",
      mainHead: "Element", stateHead: "Conformance",
      emptyText: "No applicable element is Not in place or Partially in place.",
      leadStatic: "Every applicable element that is Not in place or Partially in place, Not-in-place first. Priority, owner, business impact and recommended action are set by the consultant.",
      mainCell: function (it) { return remediationMainCell(it, it.categoryId + (it.code ? " · " + it.code : "")); },
      statePill: function (it) { return h("span", { class: "pill " + csmsBand(it.state), text: csmsStateLabel(it.state, scored.profile) }); }
    }));

    // Standing prose + cover sheet close the preview.
    var csmsBoiler = boilerplateStack([
      withAttribution(proseCard("About this assessment", instrument.framing), instrument),
      proseCard("How to read this report", "Each CSMS element is judged Not in place, Partially in place, Largely in place or In place against full conformance. Results are reported as a conformance profile by category and element group; the conformance percentage is shown for context only. Unknown reduces coverage and lowers confidence; Not applicable elements are excluded.")
    ]);
    if (csmsBoiler) container.appendChild(csmsBoiler);
    appendReportTail(container, opts);
  }

  // ---- EU CRA (layered conformance) -------------------------------------
  // Three independently-scored layers presented side by side and never blended
  // into one CRA score. Critical caveats and the layer interlock are surfaced
  // prominently.

  function craProfilePills(ov) {
    var c = ov.counts;
    return h("div", { class: "val kpi-pills" }, [
      h("span", { class: "pill met",  text: c.inPlace + " In place" }),
      h("span", { class: "pill near", text: c.partially + " Partially" }),
      h("span", { class: "pill gap",  text: c.notInPlace + " Not in place" })
    ]);
  }

  function craCriticalCaveatsCard(caveats) {
    if (!caveats || !caveats.length) return null;
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Critical caveats" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0 0 10px; color:var(--text); font-weight:600;",
          text: caveats[0] }),
        caveats.length > 1 ? h("ul", { style: "margin:0; padding-left:20px;" }, caveats.slice(1).map(function (c) { return h("li", null, [c]); })) : null
      ])
    ]);
  }

  function craInterlockCard(interlock, instrument) {
    if (!interlock || !interlock.triggered) return null;
    var missing = (interlock.missingLayers || []).join(" and ");
    var confId = (instrument && instrument.interlockSpec && instrument.interlockSpec.conformityLayer) || "P3";
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformity claim not substantiated by the technical layers" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: (interlock.message || "") + " The conformity layer (" + confId + ") is in scope but " + (missing || "a technical layer") + " is not." })
      ])
    ]);
  }

  function renderCRA(container, opts) {
    var C = window.App.ScoringCRA;
    var engagement = opts.engagement, instrument = opts.instrument, scored = opts.scored, target = opts.activeTarget;
    // Regulation-specific banner prose from instrument.display; the CRA
    // wording is the fallback so eu-cra needs no data change.
    var disp = (instrument && instrument.display) || {};
    var nounR = disp.productNoun || "product";
    var NounR = nounR.charAt(0).toUpperCase() + nounR.slice(1);
    var confIdR = (instrument && instrument.interlockSpec && instrument.interlockSpec.conformityLayer) || "P3";

    // Indicative / not-a-certification banner.
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: disp.reportBannerTitle || "EU CRA gap assessment (indicative, not a conformity assessment)" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "border-left:4px solid var(--near); background:var(--near-bg); padding:10px 14px; margin:0; color:var(--text);",
          text: disp.reportBannerBody || "A gap assessment against the EU Cyber Resilience Act. The three layers are scored separately and shown side by side, never blended into one CRA score, because strong product security cannot make up for missing conformity work, which on its own blocks the product from being placed on the market. The assessment informs conformity; it does not determine or certify it." })
      ])
    ]));

    // Critical caveats, prominent.
    var caveats = craCriticalCaveatsCard(scored.criticalCaveats);
    if (caveats) container.appendChild(caveats);

    // Setup summary.
    var cls = scored.classification || {};
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Scope of this assessment" })]),
      h("div", { class: "card-b" }, [
        h("div", { class: "kpi-row" }, [
          h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: NounR }), h("div", { class: "val kpi-small", text: (target && target.name) || "(not set)" }) ]),
          h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: NounR + " class" }), h("div", { class: "val kpi-small", text: cls.classLabel || "Default" }) ]),
          h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: "Layers in scope" }), h("div", { class: "val kpi-small", text: (scored.layersInScope || []).join(", ") }) ]),
          h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: "Target" }), h("div", { class: "val kpi-small", text: target ? target.name : "" }) ])
        ]),
        cls.categoryText ? h("p", { class: "muted", style: "margin:10px 0 0;", text: "Matched category: " + cls.categoryText } ) : null,
        cls.route ? h("p", { style: "margin:8px 0 0;" }, [ h("strong", { text: "Conformity route (" + confIdR + "): " }), cls.route ]) : null
      ])
    ]));

    // Misclassification finding, prominent.
    if (cls.misclassification) {
      container.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Finding: possible " + nounR + " misclassification" })]),
        h("div", { class: "card-b" }, [
          h("p", { style: "border-left:4px solid var(--gap); background:var(--gap-bg); padding:10px 14px; margin:0; color:var(--text);",
            text: cls.misclassificationNote })
        ])
      ]));
    }

    // Interlock flag, prominent.
    var interlock = craInterlockCard(scored.interlock, instrument);
    if (interlock) container.appendChild(interlock);

    // The three positions, side by side.
    var panels = (scored.layers || []).map(function (layer) {
      var ov = layer.overall;
      return h("div", { class: "card", style: "margin:0;" }, [
        h("div", { class: "card-h" }, [h("h2", { style: "font-size:15px;", text: layer.layerId + " - " + layer.name })]),
        h("div", { class: "card-b" }, [
          layer.scope ? h("div", { class: "lbl muted", style: "text-transform:uppercase; font-size:11px; letter-spacing:0.4px; margin-bottom:6px;", text: layer.scope }) : null,
          craProfilePills(ov),
          h("div", { class: "kpi-row", style: "margin-top:10px;" }, [
            h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: "Gaps" }), h("div", { class: "val " + (ov.gaps > 0 ? "gap" : "met"), text: String(ov.gaps) }) ]),
            h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: "Coverage" }), h("div", { class: "val kpi-small", text: C.formatPct(ov.coverage) + (ov.confidenceLevel ? " - " + ov.confidenceLevel : "") }) ]),
            h("div", { class: "kpi" }, [ h("div", { class: "lbl", text: "Conformance (context)" }), h("div", { class: "val kpi-small", text: C.formatPct(ov.conformance) }) ])
          ])
        ])
      ]);
    });
    container.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "The three positions, side by side" })]),
      h("div", { class: "card-b" }, [
        h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px;" }, panels)
      ])
    ]));

    // Per-layer requirement detail.
    (scored.layers || []).forEach(function (layer) {
      var rows = (layer.result.perItem || []).map(function (it) {
        return h("tr", null, [
          h("td", null, [h("strong", { text: it.code })]),
          h("td", null, [it.title]),
          h("td", null, [ h("span", { class: "pill " + csmsBand(it.state), text: csmsStateLabel(it.state, scored.profile) }) ])
        ]);
      });
      container.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: layer.layerId + " - " + layer.name + " - detail" })]),
        h("div", { class: "card-b" }, [
          h("table", { class: "tbl" }, [
            h("thead", null, [h("tr", null, [h("th", null, ["Ref"]), h("th", null, ["Requirement"]), h("th", null, ["Conformance"])])]),
            h("tbody", null, rows)
          ])
        ])
      ]));
    });

    // Combined gap roadmap (flattened across in-scope layers), editable.
    container.appendChild(remediationRoadmapCard({
      scored: scored, planning: opts.planning,
      title: "Conformance gap roadmap (all layers)",
      mainHead: "Requirement", stateHead: "Conformance",
      emptyText: "No applicable requirement is Not in place or Partially in place across the layers in scope.",
      leadStatic: "Every applicable requirement that is Not in place or Partially in place, across the layers in scope, Not-in-place first. Priority, owner, business impact and recommended action are set by the consultant.",
      mainCell: function (it) { return remediationMainCell(it, (it.layerId || "") + (it.code ? " · " + it.code : "")); },
      statePill: function (it) { return h("span", { class: "pill " + csmsBand(it.state), text: csmsStateLabel(it.state, scored.profile) }); }
    }));

    appendReportTail(container, opts);
  }

  return {
    render: render,
    summaryHeadline: summaryHeadline,
    bandPill: bandPill,
    // Shared with the Word exporter so the document states the same capability
    // vector and scope accounting as the screen, from one implementation.
    slVectorSpec: slVectorSpec,
    slVectorParts: slVectorParts,
    slVectorClaim: slVectorClaim,
    requirementTypeSplit: requirementTypeSplit,
    applicabilityLines: applicabilityLines,
    blockingLines: blockingLines,
    sharedActionLines: sharedActionLines,
    glossarySections: glossarySections,
    // Risk appetite: one slot set and one pack reader for screen and Word alike.
    riskAppetiteNarrative: raNarrative,
    // Names in pack prose, for every family.
    personaliseNarrative: personaliseNarrative,
    clientShortName: clientShortName,
    riskAppetiteSlots: riskAppetiteSlots,
    riskAppetiteRevealedText: riskAppetiteRevealedText,
    riskAppetiteVerdictOpener: riskAppetiteVerdictOpener,
    riskAppetiteAppetiteSentence: riskAppetiteAppetiteSentence,
    riskAppetiteExposureDrivers: riskAppetiteExposureDrivers,
    riskAppetiteSpotlights: riskAppetiteSpotlights,
    riskAppetiteHeadlineValue: riskAppetiteHeadlineValue,
    riskAppetiteRevealedNotes: riskAppetiteRevealedNotes,
    riskAppetiteTreatedAs: riskAppetiteTreatedAs,
    riskAppetiteTechAxis: riskAppetiteTechAxis,
    riskAppetiteProgressText: riskAppetiteProgressText,
    riskAppetiteNotEstablishedNote: riskAppetiteNotEstablishedNote,
    riskAppetiteKindOf: riskAppetiteKindOf,
    riskAppetiteLeanSentence: riskAppetiteLeanSentence,
    riskAppetiteVerdictLabel: riskAppetiteVerdictLabel,
    numberWord: function (n) { return RA_NUM_WORDS[n] || String(n); },
    fill: raFill,
    systemRollupLines: systemRollupLines,
    systemRollupRows: systemRollupRows,
    // One answer to "is the target met?" for the screen and the Word document.
    slTargetMetWords: slTargetMetWords,
    frTargetWords: frTargetWords,
    slAnyAnswered: slAnyAnswered,
    rollupVerdictLabel: function (v) { return (ROLLUP_VERDICT[v] || ROLLUP_VERDICT.unassessed).label; },
    standardRef: standardRef,
    mlNoun: mlNoun,
    pluralLower: pluralLower,
    dispositionWord: function (d) { return DISPOSITION_WORD[d] || d; },
    programmeContextText: programmeContextText,
    // The instrument's licence notice as printed lines, so anything else that
    // prints it reads the field the same way the About card does.
    attributionLines: attributionLines,
    // Follow-up routing for screener-style domain-letter instruments; the
    // Word export reuses the same trigger logic.
    triggeredFollowUpRoutes: triggeredFollowUpRoutes,
    // Shared with the Word exporter so advice recorded against something that
    // already meets its target reaches the document as well as the screen.
    furtherRecommendations: furtherRecommendations,
    // Shared so the screen and the document split the consultant's next-steps
    // text into the same lines, scaffold the same first draft, and mark the
    // same lines as prompts still to be filled in.
    // Consultant customisation. sectionKey is the contract between the screen
    // report and the Word exporter: both slug the GENERATED heading, so an
    // override set on a card reaches the matching Word section.
    sectionKey: sectionKey,
    sectionCustom: sectionCustom,
    reportCustom: reportCustom,
    // Shared with the editor, so "the wording that opens this section" means
    // the same nodes when they are captured and when they are edited in place.
    leadingProse: leadingProse,
    consultantTerms: consultantTerms,
    applyOrder: applyOrder,
    slPriorityFRs: slPriorityFRs,
    dlPriorityDomains: dlPriorityDomains,
    nextStepsLines: nextStepsLines,
    defaultNextSteps: defaultNextSteps,
    nextStepsIsPrompt: nextStepsIsPrompt,
    nextStepsIsScaffold: nextStepsIsScaffold
  };
})();
