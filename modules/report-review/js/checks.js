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
 *     [{ id, check, title, severity, message, quote, kind, documentIndex, blockId,
 *        sectionKey, sectionTitle, targetName, itemId, cell }]
 *   id is stable for a given pack, so a dismissal keeps across saves.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var CHECKS = {
    "red-prompts": { title: "Red prompts left in", severity: "must-fix", about: "Text the Word report prints in red for the author to complete." },
    "dashes": { title: "Em or en dashes", severity: "should-fix", about: "House style is a spaced hyphen. A cell holding a lone dash is the house mark for empty, so it is not counted." },
    "internal-wording": { title: "Internal wording in client text", severity: "must-fix", about: "Words that describe the tool or its workings, not the client's position." },
    "other-names": { title: "A name from a demo or another client", severity: "must-fix", about: "The demo clients' names, and any you add below, found in this report." },
    "client-name": { title: "Client name missing or inconsistent", severity: "must-fix", about: "The client's name should be set, and printed the same way throughout." },
    "no-evidence": { title: "Findings with no evidence recorded", severity: "should-fix", about: "A finding with nothing behind it is hard to defend to the client." },
    "unanswered": { title: "Items not answered", severity: "should-fix", about: "Items in scope with no answer at all. Unknown and not applicable count as answers." },
    "doc-control": { title: "Blank document control fields", severity: "suggestion", about: "Fields the document control table prints empty. They may be filled in at issue." },
    "numbering": { title: "Section numbering gaps", severity: "should-fix", about: "Numbered sections that skip a number, which usually means a section was hidden." },
    "figures": { title: "Figures that disagree", severity: "must-fix", about: "Counts the report prints that do not match the assessment behind it." }
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

  // Every paragraph the client reads, with the block it belongs to and, in a
  // table, the cell. fn(text, block, cell, para).
  function eachText(pack, fn) {
    (pack.documents || []).forEach(function (doc, d) {
      (doc.blocks || []).forEach(function (b) {
        if (b.type === "image") return;
        if (b.type === "table") {
          b.rows.forEach(function (row, r) {
            row.cells.forEach(function (cell, c) {
              (function inner(list) {
                list.forEach(function (p) {
                  if (p.type === "table") { p.rows.forEach(function (rr) { rr.cells.forEach(function (cc) { inner(cc.blocks); }); }); return; }
                  if (p.type === "image") return;
                  fn(p.text || "", b, { row: r, col: c }, p, d);
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
    return (p.runs || []).filter(function (r) { return !r.red; }).map(function (r) { return r.t; }).join("");
  }

  function result(check, id, message, quote, b, cell, d, extra) {
    var r = { id: check + ":" + id, check: check, title: CHECKS[check].title, severity: CHECKS[check].severity, message: message,
      quote: quote || "", kind: "block", documentIndex: d == null ? 0 : d, blockId: b ? b.id : "",
      sectionKey: b ? (b.sectionKey || "") : "", sectionTitle: b ? (b.sectionTitle || "") : "", cell: cell || null, targetName: "", itemId: "" };
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }
  function keyFor(b, cell, n) { return b.id + (cell ? ":" + cell.row + "." + cell.col : "") + (n ? ":" + n : ""); }

  function redPrompts(pack, out) {
    eachText(pack, function (text, b, cell, p, d) {
      if (!p.red) return;
      var red = (p.runs || []).filter(function (r) { return r.red; }).map(function (r) { return r.t; }).join("");
      out.push(result("red-prompts", keyFor(b, cell), "This prints in red for the author to complete, so the report is not finished here.", red || text, b, cell, d));
    });
  }

  function dashes(pack, out) {
    eachText(pack, function (text, b, cell, p, d) {
      var t = plainOf(p);
      if (!/[–—]/.test(t)) return;
      if (cell && /^[–—\s]*$/.test(t)) return;   // the house mark for an empty cell
      var m = /[–—]/.exec(t);
      var from = Math.max(0, m.index - 50);
      out.push(result("dashes", keyFor(b, cell), "An " + (m[0] === "—" ? "em" : "en") + " dash in the client's text. House style is a spaced hyphen.",
        (from ? "…" : "") + t.slice(from, m.index + 50) + (m.index + 50 < t.length ? "…" : ""), b, cell, d, { fullText: text }));
    });
  }

  function internal(pack, out) {
    eachText(pack, function (text, b, cell, p, d) {
      var t = plainOf(p);
      INTERNAL.forEach(function (w) {
        var m = w.re.exec(t);
        if (!m) return;
        var from = Math.max(0, m.index - 50);
        out.push(result("internal-wording", keyFor(b, cell, w.label), "“" + m[0] + "” describes the tool rather than the client's position.",
          (from ? "…" : "") + t.slice(from, m.index + 60) + (m.index + 60 < t.length ? "…" : ""), b, cell, d, { fullText: text }));
      });
    });
  }

  function otherNames(pack, out, opts) {
    var e = pack.engagement || {};
    var mine = [e.client, e.site, e.consultant].map(function (s) { return norm(s).toLowerCase(); });
    function isOwn(name) {
      var n = name.toLowerCase();
      return mine.some(function (m) { return m && (m.indexOf(n) !== -1 || n.indexOf(m) !== -1); });
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
        names.forEach(function (n) {
          if (it[f] && hasWord(it[f], n)) {
            out.push(result("other-names", "item:" + it.targetName + ":" + it.itemId + ":" + f + ":" + n, "“" + n + "” is in the " + f + " recorded for " + it.code + ".",
              clip(it[f]), null, null, 0, { kind: "item", targetName: it.targetName, itemId: it.itemId, code: it.code, itemTitle: it.title, field: f }));
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

  function noEvidence(pack, out) {
    (pack.items || []).forEach(function (it) {
      if (it.status !== "finding" || norm(it.evidence)) return;
      out.push(result("no-evidence", it.targetName + ":" + it.itemId, it.code + " is a finding" + (it.targetName ? " on " + it.targetName : "") + ", and no evidence is recorded.",
        it.title, null, null, 0, { kind: "item", targetName: it.targetName, itemId: it.itemId, code: it.code, itemTitle: it.title, field: "evidence" }));
    });
  }

  // One line per target above a handful, so 300 blank controls do not read as
  // 300 separate problems.
  function unanswered(pack, out) {
    var byTarget = {}, order = [];
    (pack.items || []).forEach(function (it) {
      if (it.status !== "unanswered") return;
      if (!byTarget[it.targetName]) { byTarget[it.targetName] = []; order.push(it.targetName); }
      byTarget[it.targetName].push(it);
    });
    order.forEach(function (t) {
      var list = byTarget[t];
      if (list.length <= 5) {
        list.forEach(function (it) {
          out.push(result("unanswered", t + ":" + it.itemId, it.code + (t ? " on " + t : "") + " has no answer.", it.title, null, null, 0,
            { kind: "item", targetName: t, itemId: it.itemId, code: it.code, itemTitle: it.title }));
        });
      } else {
        var it = list[0];
        out.push(result("unanswered", t + ":many", list.length + " items" + (t ? " on " + t : "") + " have no answer, starting with " + it.code + ".", it.title, null, null, 0,
          { kind: "item", targetName: t, itemId: it.itemId, code: it.code, itemTitle: it.title }));
      }
    });
  }

  var DC_LABELS = { documentRevision: "document revision", qaReviewBy: "QA review by", authorisedBy: "authorised by", issuedTo: "issued to", issuedDate: "issued date", confidentiality: "confidentiality" };
  function docControl(pack, out) {
    var dc = (pack.engagement || {}).documentControl || {};
    var blank = Object.keys(DC_LABELS).filter(function (k) { return k in dc && !norm(dc[k]); });
    if (!blank.length) return;
    var d0 = (pack.documents || [])[0] || {};
    var dcBlock = (d0.blocks || []).filter(function (b) { return b.type === "table" && /document control/i.test(b.sectionTitle || ""); })[0] || null;
    out.push(result("doc-control", blank.join(","), "Blank in document control: " + blank.map(function (k) { return DC_LABELS[k]; }).join(", ") + ".", "", dcBlock, null, 0,
      dcBlock ? null : { kind: "general", sectionTitle: "Document control" }));
  }

  // Section numbers as printed: the assessment tool's numbered headings print
  // "3<em space>Title"; a plain "3. Title" or "3 Title" is the risk tool's.
  function numbering(pack, out) {
    (pack.documents || []).forEach(function (doc, d) {
      var last = null;
      (doc.blocks || []).forEach(function (b) {
        if (b.type !== "heading" || b.level !== 1) return;
        var m = /^(\d+)(?: |\.\s|\s)/.exec(b.text || "");
        if (!m) return;
        var n = Number(m[1]);
        if (last !== null && n !== last + 1 && n !== last) {
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
  var FIGURE_SENTENCES = [
    { re: /\bthe (\d+) outcomes below their expected state\b/i, fact: "roadmapEntries", what: "outcomes below their expected state" },
    { re: /\bopen gaps moved from \d+ to (\d+)\b/i, fact: "roadmapEntries", what: "open gaps" },
    { re: /\bthere are (\d+) open gaps\b/i, fact: "roadmapEntries", what: "open gaps" },
    { re: /\b(\d+) of \d+ outcomes were assessed as achieved\b/i, fact: "met", what: "outcomes achieved" }
  ];
  function figures(pack, out) {
    var facts = (pack.facts && pack.facts.perTarget) || [];
    (pack.documents || []).forEach(function (doc, d) {
      var fact = doc.targetName ? facts.filter(function (f) { return f.targetName === doc.targetName; })[0] : (facts.length === 1 ? facts[0] : null);
      if (!fact) return;
      (doc.blocks || []).forEach(function (b) {
        if (b.type !== "paragraph" && b.type !== "bullet") return;
        FIGURE_SENTENCES.forEach(function (f, i) {
          var m = f.re.exec(b.text || "");
          if (!m || Number(m[1]) === fact[f.fact]) return;
          out.push(result("figures", b.id + ":" + i, "This says " + m[1] + " " + f.what + ", and the assessment behind it has " + fact[f.fact] + ".", clip(b.text), b, null, d));
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
    docControl(pack, out);
    numbering(pack, out);
    figures(pack, out);
    return out;
  }

  window.App.ReviewChecks = { CHECKS: CHECKS, DEMO_NAMES: DEMO_NAMES, INTERNAL: INTERNAL, run: run };
})();
