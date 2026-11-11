/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* checks.js
 *
 * The automatic checks: things a machine can find reliably in a review pack, so
 * a reviewer can spend their time on judgement. Pure functions of the pack, with
 * no page behind them. A false alarm costs trust, so each check is written to be
 * precise and any it cannot be sure of is left out rather than made noisy:
 * docs/report-review.md lists what is deliberately not attempted.
 *
 *   App.ReviewChecks.run(pack, { names: [...] }) returns
 *     [{ id, check, title, severity, message, quote, fullText, kind, documentIndex,
 *        blockId, sectionKey, sectionTitle, targetName, targetId, itemId, cell, legacyIds }]
 *   id is stable for a given pack, so a dismissal keeps across saves. quote is
 *   for showing and may be clipped; fullText (block results only) is the whole
 *   text of the block, or of the cell, which is what a comment made from the
 *   result quotes, as the author's tool matches a comment by that. legacyIds
 *   (optional) are ids the same result had in earlier versions: a dismissal
 *   saved under one still counts.
 *
 * A pack may name its item fields its own way (engagement.fieldLabels, with
 * null for a field it does not have): the checks that talk about a field use
 * that name, and leave out a field the pack does not have. The risk tool's
 * packs get their own checks (risk-*), read from the threats and target levels.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var CHECKS = {
    "red-prompts": { title: "Red prompts left in", severity: "must-fix", about: "Text the Word report prints in red for the author to complete." },
    "dashes": { title: "Em or en dashes", severity: "should-fix", about: "House style is a spaced hyphen. A cell holding a lone dash is the house mark for empty, so it is not counted." },
    "internal-wording": { title: "Internal wording in client text", severity: "must-fix", about: "Words about the tool or how it works, and notes to self, in text the client reads." },
    "other-names": { title: "A name from a demo or another client", severity: "must-fix", about: "The demo clients' names, and any you add below, found in this report." },
    "client-name": { title: "Client name missing or inconsistent", severity: "must-fix", about: "The client's name should be set, and printed the same way throughout." },
    "no-evidence": { title: "Findings with no evidence recorded", severity: "should-fix", about: "A finding with nothing behind it is hard to defend to the client." },
    "unanswered": { title: "Items not answered", severity: "should-fix", about: "Items in scope with no answer at all. Unknown and not applicable count as answers." },
    "doc-control": { title: "Blank document control fields", severity: "suggestion", about: "Fields the document control table prints empty. They may be filled in at issue. QA review by is not counted, as an approval fills it in." },
    "numbering": { title: "Section numbering gaps", severity: "should-fix", about: "Numbered sections that skip a number, which usually means a section was hidden." },
    "figures": { title: "Figures that disagree", severity: "must-fix", about: "Counts the report prints that do not match the assessment behind it." },
    "risk-no-disposition": { title: "Risks above tolerable with no disposition", severity: "must-fix", about: "A threat above the tolerable risk with no countermeasure, no target level on its affected requirements and no recorded acceptance. The report prints it as needing a decision." },
    "risk-slt-justification": { title: "Target levels with no justification", severity: "should-fix", about: "A zone or conduit with target security levels set and no justification recorded. The report leaves the justification out." }
  };

  // The demo clients, as the assessment tool's tours name them. Anything in
  // this list printed in a real client's report is a copy-paste left behind.
  var DEMO_NAMES = ["Acme Petrochemicals", "Meridian Control Systems", "Northbridge Manufacturing", "Kingsway Airport Authority",
    "Brightpath Retail Group", "Ferrovia Controls", "Castlefield Energy", "Meridian Handling Systems", "Northbridge Energy",
    "Harbour Water Utilities", "Atlas Digital Services", "Riverbend Water Authority", "Wearvale Water", "Aldergate Rail Infrastructure",
    "Fenwick Nuclear Services"];

  // Words about the tool rather than the work, from the assessment tool's own
  // style guards (test-risk-appetite-narrative.html, test-narrative-style.html)
  // and the rule in CLAUDE.md. Each is matched as a whole phrase.
  var INTERNAL = [
    { re: /\bthe tool\b/i, label: "the tool" },
    { re: /\bthis tool\b/i, label: "this tool" },
    { re: /\bscaffold(s|ed|ing)?\b/i, label: "scaffold" },
    { re: /\bplaceholders?\b/i, label: "placeholder" },
    { re: /\bstructured prompt\b/i, label: "structured prompt" },
    { re: /\bband arithmetic\b/i, label: "band arithmetic" },
    { re: /\brolled up from\b/i, label: "rolled up from" },
    { re: /\blorem ipsum\b/i, label: "lorem ipsum" },
    { re: /\b(TODO|TBC|TBD|FIXME)\b/, label: "a note to self" }
  ];

  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function hasWord(text, name) { return new RegExp("(^|[^A-Za-z0-9])" + esc(name) + "($|[^A-Za-z0-9])", "i").test(text); }
  function clip(s, n) { s = norm(s); return s.length > (n || 200) ? s.slice(0, n || 200) + "…" : s; }
  // The pack's own name for an item field: the default when it does not say,
  // null when it says it has no such field.
  function fieldLabel(pack, f, dflt) {
    var L = (pack.engagement || {}).fieldLabels;
    return L && typeof L === "object" && f in L ? L[f] : dflt;
  }
  function isRisk(pack) { return (pack.engagement || {}).scoringFamily === "risk-assessment"; }
  // An item result's key: the target by id where the pack carries one, so two
  // targets with one name stay apart, else by name. Results were keyed by name
  // alone before, so that key is kept as a legacy id (see legacy).
  function targetKey(it) { return it.targetId || it.targetName || ""; }
  function legacy(check, key, oldKey) { return key === oldKey ? {} : { legacyIds: [check + ":" + oldKey] }; }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  // An item's anchor: the target by id where the pack carries one, and by name.
  function itemAnchor(it, extra) {
    var a = { kind: "item", targetName: it.targetName || "", targetId: it.targetId || "", itemId: it.itemId, code: it.code, itemTitle: it.title };
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return a;
  }

  // Every paragraph the client reads, with the block it belongs to and, in a
  // table, the cell. fn(text, block, cell, para). cell.para counts the
  // paragraphs under one top-level cell, nested tables included, so two in the
  // same cell are told apart.
  function eachText(pack, fn) {
    (pack.documents || []).forEach(function (doc, d) {
      (doc.blocks || []).forEach(function (b) {
        if (b.type === "image") return;
        if (b.type === "table") {
          b.rows.forEach(function (row, r) {
            row.cells.forEach(function (cell, c) {
              var k = 0;
              (function inner(list) {
                list.forEach(function (p) {
                  if (p.type === "table") { p.rows.forEach(function (rr) { rr.cells.forEach(function (cc) { inner(cc.blocks); }); }); return; }
                  if (p.type === "image") return;
                  fn(p.text || "", b, { row: r, col: c, para: k++ }, p, d);
                });
              })(cell.blocks);
            });
          });
          return;
        }
        fn(b.text || "", b, null, b, d);
      });
    });
  }
  // The text of a paragraph that is not red: a red prompt is its own check, and
  // is meant to go, so what it says is not held against it twice.
  function plainOf(p) {
    // A paragraph with no runs is its text, unless it is red throughout.
    if (!(p.runs && p.runs.length)) return p.red ? "" : String(p.text || "");
    return p.runs.filter(function (r) { return !r.red; }).map(function (r) { return r.t; }).join("");
  }

  // The words a comment on a block quotes: the whole cell when it is in one,
  // else the whole block. A picture has none.
  function anchorText(b, cell) {
    if (cell && b.rows) { var row = b.rows[cell.row], c = row && row.cells && row.cells[cell.col]; return c ? String(c.text || "") : ""; }
    return b.type === "image" ? "" : String(b.text || "");
  }
  function result(check, id, message, quote, b, cell, d, extra) {
    var r = { id: check + ":" + id, check: check, title: CHECKS[check].title, severity: CHECKS[check].severity, message: message,
      quote: quote || "", kind: "block", documentIndex: d == null ? 0 : d, blockId: b ? b.id : "",
      sectionKey: b ? (b.sectionKey || "") : "", sectionTitle: b ? (b.sectionTitle || "") : "", cell: cell ? { row: cell.row, col: cell.col } : null,
      targetName: "", targetId: "", itemId: "" };
    if (b) r.fullText = anchorText(b, cell);
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }
  // The first paragraph of a cell keeps the key it always had, so dismissals
  // saved in earlier review files still match.
  function keyFor(b, cell, n) { return b.id + (cell ? ":" + cell.row + "." + cell.col + (cell.para ? "." + cell.para : "") : "") + (n ? ":" + n : ""); }

  function redPrompts(pack, out) {
    eachText(pack, function (text, b, cell, p, d) {
      if (!p.red) return;
      var red = (p.runs || []).filter(function (r) { return r.red; }).map(function (r) { return r.t; }).join("");
      out.push(result("red-prompts", keyFor(b, cell), "Red text for the author to complete is still in the report here.", red || text, b, cell, d));
    });
  }

  // A cell holding only a dash is the house mark for empty. So is a lone dash
  // standing for a value in a cell of several, as the risk register's
  // likelihood by impact cell prints an unrated side ("— × Serious"): the gap
  // there is the missing rating, which Items not answered reports.
  function emptyMark(t) {
    return t.split("×").every(function (part) { return !/[–—]/.test(part) || /^[–—\s]*$/.test(part); });
  }
  function dashes(pack, out) {
    eachText(pack, function (text, b, cell, p, d) {
      var t = plainOf(p);
      if (!/[–—]/.test(t)) return;
      if (cell && emptyMark(t)) return;
      var m = /[–—]/.exec(t);
      var from = Math.max(0, m.index - 50);
      out.push(result("dashes", keyFor(b, cell), "An " + (m[0] === "—" ? "em" : "en") + " dash in the client's text. House style is a spaced hyphen.",
        (from ? "…" : "") + t.slice(from, m.index + 50) + (m.index + 50 < t.length ? "…" : ""), b, cell, d));
    });
  }

  // What the consultant or client recorded, where a phrase can mean something
  // else entirely: in OT, "the tool" is often an engineering tool ("the tool is
  // retired at the turnaround"). A match inside such a field is left alone.
  function recordedText(pack) {
    var out = [];
    function add(v) { v = norm(v); if (v.length >= 8) out.push(v); }
    (pack.items || []).forEach(function (it) { ["evidence", "notes", "action", "impact", "owner", "title"].forEach(function (f) { add(it[f]); }); });
    var bs = pack.basisOfAssessment || {};
    ["interviews", "documents", "observations"].forEach(function (k) {
      (bs[k] || []).forEach(function (r) { Object.keys(r).forEach(function (f) { add(r[f]); }); });
    });
    return out;
  }
  function internal(pack, out) {
    var recorded = recordedText(pack);
    eachText(pack, function (text, b, cell, p, d) {
      var t = plainOf(p), nt = norm(t);
      INTERNAL.forEach(function (w) {
        var m = w.re.exec(t);
        if (!m) return;
        if (recorded.some(function (v) { return w.re.test(v) && nt.indexOf(v) !== -1; })) return;
        var from = Math.max(0, m.index - 50);
        out.push(result("internal-wording", keyFor(b, cell, w.label), "“" + m[0] + "” is internal wording that the client should not see.",
          (from ? "…" : "") + t.slice(from, m.index + 60) + (m.index + 60 < t.length ? "…" : ""), b, cell, d));
      });
    });
  }

  function otherNames(pack, out, opts) {
    var e = pack.engagement || {};
    var mine = [e.client, e.site, e.consultant].map(function (s) { return norm(s); });
    // A demo name is the report's own only when its client, site or consultant
    // holds it as whole words: a site called "Harbour" does not make Harbour
    // Water Utilities this client's name.
    function isOwn(name) {
      return mine.some(function (m) { return m && hasWord(m, name); });
    }
    var names = DEMO_NAMES.concat((opts && opts.names) || []).map(norm).filter(function (n, i, a) { return n && a.indexOf(n) === i && !isOwn(n); });
    if (!names.length) return;
    var seen = {};
    eachText(pack, function (text, b, cell, p, d) {
      names.forEach(function (n) {
        if (!hasWord(text, n)) return;
        var key = keyFor(b, cell, n);
        if (seen[key]) return;
        seen[key] = 1;
        out.push(result("other-names", key, "“" + n + "” is printed here, and this report is for " + (e.client || "another client") + ".", clip(text), b, cell, d));
      });
    });
    // The engagement data too: evidence pasted across from another job.
    (pack.items || []).forEach(function (it) {
      ["evidence", "notes", "action", "impact"].forEach(function (f) {
        if (fieldLabel(pack, f, f) === null) return;
        names.forEach(function (n) {
          if (it[f] && hasWord(it[f], n)) {
            var tail = ":" + it.itemId + ":" + f + ":" + n;
            out.push(result("other-names", "item:" + targetKey(it) + tail, "“" + n + "” is in the " + String(fieldLabel(pack, f, f)).toLowerCase() + " recorded for " + it.code + ".",
              clip(it[f]), null, null, 0, itemAnchor(it, Object.assign({ field: f }, legacy("other-names", "item:" + targetKey(it) + tail, "item:" + it.targetName + tail)))));
          }
        });
      });
    });
  }

  function clientName(pack, out) {
    var client = norm((pack.engagement || {}).client);
    if (!client) {
      out.push(result("client-name", "not-set", "No client name is set, so the report prints a stand-in.", "", null, null, 0, { kind: "general", sectionTitle: "Document control" }));
      return;
    }
    (pack.documents || []).forEach(function (doc, d) {
      var found = false, variants = {};
      eachText({ documents: [doc] }, function (text, b, cell, p) {
        var re = new RegExp("(^|[^A-Za-z0-9])(" + esc(client) + ")($|[^A-Za-z0-9])", "ig"), m;
        while ((m = re.exec(text))) {
          if (m[2] === client) found = true;
          // A one-word name that is also an ordinary word (Shell, Total): in
          // all lower case it is the word, not the client.
          else if (!/\s/.test(client) && m[2] === m[2].toLowerCase() && m[2] !== m[2].toUpperCase()) continue;
          else if (!variants[m[2]]) variants[m[2]] = { text: text, b: b, cell: cell };
        }
      });
      if (!found && !Object.keys(variants).length) {
        out.push(result("client-name", "missing:" + d, "The client's name, " + client + ", is not printed anywhere in " + (doc.title || "this document") + ".", "", (doc.blocks || [])[0], null, d));
      }
      Object.keys(variants).forEach(function (v) {
        // All capitals on a cover or heading is styling, not a different name.
        if (v === v.toUpperCase()) return;
        var x = variants[v];
        out.push(result("client-name", "variant:" + d + ":" + v, "Printed as “" + v + "” here, and the client's name is “" + client + "”.", clip(x.text), x.b, x.cell, d));
      });
    });
  }

  // Not on a risk pack: a threat's evidence is the basis of assessment, for the
  // project as a whole, and what sits in the field is the threat source. Nor on
  // a pack that says it has no evidence field.
  function noEvidence(pack, out) {
    var label = fieldLabel(pack, "evidence", "evidence");
    if (label === null || isRisk(pack)) return;
    var name = String(label || "evidence").toLowerCase(), extra = name === "evidence" ? {} : { title: "Findings with no " + name + " recorded" };
    // A system-wide answer is one finding, however many zones inherit it: one
    // result, on the first of them, which a dismissal of any of them (as
    // earlier versions listed it) still dismisses.
    var shared = Object.create(null);
    (pack.items || []).forEach(function (it) {
      if (it.status !== "finding" || norm(it.evidence)) return;
      var key = targetKey(it) + ":" + it.itemId, old = it.targetName + ":" + it.itemId;
      if (it.shared) {
        var sk = String(it.itemId);
        if (own(shared, sk)) {
          var first = shared[sk];
          first.n++;
          first.r.legacyIds.push("no-evidence:" + key);
          if (key !== old) first.r.legacyIds.push("no-evidence:" + old);
          first.r.message = it.code + " is a system-wide finding" + (first.name ? ", on " + first.name + " and " + (first.n === 2 ? "1 other" : (first.n - 1) + " others") : "") + ", and no " + name + " is recorded.";
          return;
        }
      }
      var r = result("no-evidence", key, it.code + " is a finding" + (it.targetName ? " on " + it.targetName : "") + ", and no " + name + " is recorded.",
        it.title, null, null, 0, itemAnchor(it, Object.assign({ field: "evidence" }, extra, legacy("no-evidence", key, old))));
      if (it.shared) { r.legacyIds = r.legacyIds || []; shared[String(it.itemId)] = { r: r, n: 1, name: it.targetName }; }
      out.push(r);
    });
  }

  // The risk tool's items: a threat per zone or conduit, and one "SL-T" item
  // each for its target levels.
  function isSlt(it) { return it.code === "SL-T" || /:slt$/.test(String(it.itemId || "")); }

  // One line per target above a handful, so 300 blank controls do not read as
  // 300 separate problems. In a risk pack, an unanswered threat is one not yet
  // rated, and an unanswered SL-T item a zone with no target levels.
  function unanswered(pack, out) {
    var byTarget = Object.create(null), order = [], risk = isRisk(pack);
    function says(it, t) {
      if (risk && isSlt(it)) return "No target security levels are set" + (t ? " for " + t : "") + ".";
      if (risk) return it.code + (t ? " on " + t : "") + " is not rated: its likelihood or impact is not set.";
      return it.code + (t ? " on " + t : "") + " has no answer.";
    }
    (pack.items || []).forEach(function (it) {
      if (it.status !== "unanswered") return;
      var k = targetKey(it);
      if (!own(byTarget, k)) { byTarget[k] = []; order.push(k); }
      byTarget[k].push(it);
    });
    order.forEach(function (k) {
      var list = byTarget[k], t = list[0].targetName;
      if (list.length <= 5) {
        list.forEach(function (it) {
          out.push(result("unanswered", k + ":" + it.itemId, says(it, t), it.title, null, null, 0, itemAnchor(it, Object.assign({ targetName: t }, legacy("unanswered", k + ":" + it.itemId, t + ":" + it.itemId)))));
        });
      } else {
        var it = list[0];
        out.push(result("unanswered", k + ":many", list.length + " items" + (t ? " on " + t : "") + " have no answer, starting with " + it.code + ".", it.title, null, null, 0,
          itemAnchor(it, Object.assign({ targetName: t }, legacy("unanswered", k + ":many", t + ":many")))));
      }
    });
  }

  // Read from the risk pack's items as the risk tool writes them: a threat's
  // status is a finding when it is above the tolerable risk, and its priority
  // field holds the disposition (countermeasure, mitigated, accepted, sl-t),
  // empty when there is none. A risk above tolerable with a disposition but no
  // countermeasure is a legitimate position (carried into the target levels, or
  // accepted), so it is not flagged.
  function riskNoDisposition(pack, out) {
    if (!isRisk(pack) || fieldLabel(pack, "priority", "priority") === null) return;
    (pack.items || []).forEach(function (it) {
      if (isSlt(it) || it.status !== "finding" || norm(it.priority)) return;
      var t = it.targetName, key = targetKey(it) + ":" + it.itemId;
      out.push(result("risk-no-disposition", key, it.code + (t ? " on " + t : "") + " is above the tolerable risk with no disposition: no countermeasure, no target level on its affected requirements and no recorded acceptance.",
        it.title, null, null, 0, itemAnchor(it, legacy("risk-no-disposition", key, t + ":" + it.itemId))));
    });
  }
  // The justification is what the risk tool calls the deliverable, and the
  // report leaves its section out when it is blank. Read wherever the pack puts
  // it: the SL-T item's evidence or notes, or a details row named for it.
  function riskSltJustification(pack, out) {
    if (!isRisk(pack)) return;
    (pack.items || []).forEach(function (it) {
      if (!isSlt(it) || it.status === "unanswered" || it.status === "na") return;
      var just = norm(it.evidence) || norm(it.notes) || (Array.isArray(it.details) ? it.details : []).filter(function (row) {
        return row && /justif/i.test(String(row[0] || "")) && norm(row[1]);
      }).length;
      if (just) return;
      var t = it.targetName, key = targetKey(it) + ":" + it.itemId;
      out.push(result("risk-slt-justification", key, "Target security levels are set" + (t ? " for " + t : "") + " with no justification recorded, so the report leaves the justification out.",
        it.answer || it.title, null, null, 0, itemAnchor(it, legacy("risk-slt-justification", key, t + ":" + it.itemId))));
    });
  }

  // QA review by is left out: a draft sent for review has no QA reviewer yet
  // by design (an approval is what fills it in), so a blank one is no alarm.
  var DC_LABELS = { documentRevision: "document revision", authorisedBy: "authorised by", issuedTo: "issued to", issuedDate: "issued date", confidentiality: "confidentiality" };
  function docControl(pack, out) {
    var dc = (pack.engagement || {}).documentControl || {};
    var blank = Object.keys(DC_LABELS).filter(function (k) { return k in dc && !norm(dc[k]); });
    if (!blank.length) return;
    var d0 = (pack.documents || [])[0] || {};
    var dcBlock = (d0.blocks || []).filter(function (b) { return b.type === "table" && /document control/i.test(b.sectionTitle || ""); })[0] || null;
    out.push(result("doc-control", blank.join(","), "Blank in document control: " + blank.map(function (k) { return DC_LABELS[k]; }).join(", ") + ".", "", dcBlock, null, 0,
      dcBlock ? null : { kind: "general", sectionTitle: "Document control" }));
  }

  // Section numbers as printed. The assessment tool prints a numbered heading's
  // number as a run of its own ("3<em space>" for a section, "3 " for a zone in
  // the 62443-3-3 report), apart from the title, so a heading the consultant
  // renamed to start with a figure ("2028 targets", "3 zones in scope") is not
  // read as a number. A pack with no runs falls back to the em space or "3. ".
  // The risk tool's headings are not numbered.
  function sectionNumber(b) {
    var runs = b.runs || [], m;
    if (runs.length) {
      m = runs.length > 1 && /^\s*(\d{1,3})\.?\s*$/.exec(runs[0].t || "");
      return m ? Number(m[1]) : null;
    }
    m = /^(\d{1,3})(?: |\.\s)/.exec(b.text || "");
    return m ? Number(m[1]) : null;
  }
  // Only a number that jumps forward is a gap. One that repeats or goes back is
  // not, and is not given impossible arithmetic. Numbering that starts above 1
  // is a gap before the first section.
  function numbering(pack, out) {
    (pack.documents || []).forEach(function (doc, d) {
      var last = null;
      (doc.blocks || []).forEach(function (b) {
        if (b.type !== "heading" || b.level !== 1) return;
        var n = sectionNumber(b);
        if (n === null) return;
        if (last === null && n > 1) {
          out.push(result("numbering", b.id, "The first numbered section is section " + n + ", so " + (n === 2 ? "section 1 is" : "sections 1 to " + (n - 1) + " are") + " missing.", b.text, b, null, d));
        } else if (last !== null && n > last + 1) {
          out.push(result("numbering", b.id, "Section " + n + " follows section " + last + ", so " + (n - last === 2 ? "section " + (last + 1) + " is" : "sections " + (last + 1) + " to " + (n - 1) + " are") + " missing.", b.text, b, null, d));
        }
        last = n;
      });
    });
  }

  // Only sentences the Word exporter generates itself, whose number means one
  // thing, read against the facts for the one target the document covers. A
  // document covering several targets has no single fact to compare with, so it
  // is left alone. docs/report-review.md lists what is not attempted.
  // The unit is whatever the framework calls what it assesses (outcomes,
  // controls, safeguards, expectations), so any noun of up to four words is
  // read there, and a count of one is written in the singular.
  var UNIT = "([a-z][a-z'’-]*(?: [a-z][a-z'’-]*){0,3})";
  function gapWords(n) { return n === "1" ? "open gap" : "open gaps"; }
  var FIGURE_SENTENCES = [
    { re: new RegExp("\\bthe (\\d+) " + UNIT + " below their expected state\\b", "i"), fact: "roadmapEntries", what: function (m) { return m[2].toLowerCase() + " below their expected state"; } },
    { re: /\bopen gaps moved from \d+ to (\d+)\b/i, fact: "roadmapEntries", what: function (m) { return gapWords(m[1]); } },
    { re: /\bthere (?:is|are) (\d+) open gaps?\b/i, fact: "roadmapEntries", what: function (m) { return gapWords(m[1]); } },
    { re: new RegExp("\\b(\\d+) of \\d+ " + UNIT + " were assessed as achieved\\b", "i"), fact: "met", what: function (m) { return m[2].toLowerCase() + " achieved"; } }
  ];
  function figures(pack, out) {
    var facts = (pack.facts && pack.facts.perTarget) || [];
    (pack.documents || []).forEach(function (doc, d) {
      var fact = doc.targetName ? facts.filter(function (f) { return f.targetName === doc.targetName; })[0] : (facts.length === 1 ? facts[0] : null);
      if (!fact) return;
      // The met fact counts what meets its expected state. Under a profile
      // that expects less than achieved of some items, more can meet it than
      // are achieved: then a printed count above it is wrong, and one below
      // it may be right. It is exact when everything met has one answer.
      var metAnswers = {};
      (pack.items || []).forEach(function (it) { if (it.status === "met" && it.targetName === fact.targetName) metAnswers["=" + norm(it.answer)] = 1; });
      var metExact = Object.keys(metAnswers).length <= 1;
      (doc.blocks || []).forEach(function (b) {
        if (b.type !== "paragraph" && b.type !== "bullet") return;
        FIGURE_SENTENCES.forEach(function (f, i) {
          var m = f.re.exec(b.text || "");
          if (!m || Number(m[1]) === fact[f.fact]) return;
          var atMost = f.fact === "met" && !metExact;
          if (atMost && Number(m[1]) < fact.met) return;
          out.push(result("figures", b.id + ":" + i, "This says " + m[1] + " " + f.what(m) + ", and the assessment behind it has " + (atMost ? "no more than " : "") + fact[f.fact] + ".", clip(b.text), b, null, d));
        });
      });
    });
  }

  function run(pack, opts) {
    var out = [];
    if (!pack) return out;
    redPrompts(pack, out);
    dashes(pack, out);
    internal(pack, out);
    otherNames(pack, out, opts);
    clientName(pack, out);
    noEvidence(pack, out);
    unanswered(pack, out);
    riskNoDisposition(pack, out);
    riskSltJustification(pack, out);
    docControl(pack, out);
    numbering(pack, out);
    figures(pack, out);
    return out;
  }

  window.App.ReviewChecks = { CHECKS: CHECKS, DEMO_NAMES: DEMO_NAMES, INTERNAL: INTERNAL, run: run };
})();
