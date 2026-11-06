/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* export-xlsx.js
 *
 * Technical workbook for the engineering reader. SheetJS is loaded as a
 * vendored UMD script that exposes window.XLSX.
 *
 *   Sheets:
 *     1. Front       - engagement metadata + content version
 *     2. Summary     - per-FR result (conformant SL, closeness, target met, floor count)
 *     3. Requirements- per-requirement detail (and per-site if multi-site)
 *     4. Targets     - cross-site comparison when there are >1 sites
 *
 * Cell colours use the same muted palette as the UI. Met/near/gap fills make
 * "what was achieved vs what was needed" obvious at a glance.
 */
window.App = window.App || {};
window.App.ExportXLSX = (function () {
  "use strict";

  var S = window.App.Scoring;
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // The thing assessed, as a noun for prose, column heads and tab names.
  // targetDimensionLabel is written for the capture screen, so it can carry a
  // description in brackets ("Organisation (leadership / governance posture)")
  // or alternatives joined by a slash ("Dutyholder / site"). Adding an "s" to
  // the whole label printed "...posture)s" and "dutyholder / sites", so the
  // bracket is dropped and each alternative is made plural on its own. The
  // instrument's own plural still wins where it declares one.
  function pluralWord(s) {
    return /(s|x|z|ch|sh)$/i.test(s) ? s + "es"
      : /[^aeiou]y$/i.test(s) ? s.slice(0, -1) + "ies"
      : s + "s";
  }
  // An alternative can be a phrase. Its head noun is the word before a
  // qualifier ("product with digital elements" -> "products with digital
  // elements"); pluralising the last word gave "...elementses". A last word
  // that already reads as a plural ("elements") is left alone.
  function pluralPhrase(s) {
    var m = /^(.*?\S)(\s+(?:with|of|for|in|under|on|at)\s.*)$/i.exec(s);
    if (m) return pluralPhrase(m[1]) + m[2];
    var words = s.split(" ");
    var last = words[words.length - 1];
    if (/[^siu]s$/i.test(last)) return s;
    words[words.length - 1] = pluralWord(last);
    return words.join(" ");
  }
  function targetNouns(instrument) {
    var full = String((instrument && instrument.targetDimensionLabel) || "Site");
    var one = full.split(" (")[0].trim() || "Site";
    var declared = instrument && instrument.targetDimensionLabelPlural;
    var many = declared ? String(declared).split(" (")[0].trim()
      : one.split(" / ").map(pluralPhrase).join(" / ");
    return { one: one, many: many };
  }

  // Excel refuses a sheet name over 31 characters, one containing : \ / ? * [ ],
  // one starting or ending with an apostrophe, and a second sheet whose name
  // differs only in case. SheetJS throws on the first three, which aborted
  // the whole export for instruments whose labels carry a slash or run long.
  // Any name built from instrument data goes through here; the fixed names
  // the builders choose themselves do not need to.
  //
  // Those fixed names are appended with no check, some of them after the
  // data-built tab (the CAF's Outcomes/Achieved/Roadmap follow its principles
  // tab; Progress, Basis and Read me come last everywhere), so a data-built
  // name must also stay clear of every fixed name, not only the tabs already
  // in the book; otherwise the later fixed append throws.
  var FIXED_SHEET_NAMES = ["Front", "Read me", "Progress", "Basis", "Change", "History",
    "Summary", "Priority", "Roadmap", "Gap roadmap", "Requirements", "Items", "Shared actions",
    "Headline", "Domains", "Improvements", "Questions", "Objectives", "Outcomes", "Achieved",
    "By area", "Obligations", "By category", "By group", "Elements", "By SPE", "By theme",
    "Characterisation", "Organisation-wide"];
  function cleanSheetName(s) {
    // Truncate first, then trim edge apostrophes: the other order let a cut
    // at 31 characters land just after an apostrophe and end the name on it.
    return String(s || "").replace(/[:\\\/?*\[\]]/g, " ").replace(/\s+/g, " ").trim()
      .slice(0, 31).replace(/^[\s']+|[\s']+$/g, "");
  }
  function safeSheetName(wb, label, fallback) {
    var s = cleanSheetName(label);
    if (!s) s = cleanSheetName(fallback) || "Sheet";
    var taken = {};
    FIXED_SHEET_NAMES.forEach(function (n) { taken[n.toLowerCase()] = true; });
    (wb.SheetNames || []).forEach(function (n) { taken[String(n).toLowerCase()] = true; });
    if (!taken[s.toLowerCase()]) return s;
    for (var i = 2; ; i++) {
      var suffix = " (" + i + ")";
      var c = s.slice(0, 31 - suffix.length).replace(/[\s']+$/, "") + suffix;
      if (!taken[c.toLowerCase()]) return c;
    }
  }
  function appendNamedSheet(wb, ws, label, fallback) {
    var name = safeSheetName(wb, label, fallback);
    XLSX.utils.book_append_sheet(wb, ws, name);
    return name;
  }

  // Brand line for the front sheet. The community SheetJS build cannot embed
  // images, so the brand is carried as text here (the Word report and the web
  // app use the actual logo lockup).
  var BRAND_LINE = "SolutionsPT  |  AVEVA Select UK & Ireland";

  var FILL = {
    met:  { patternType: "solid", fgColor: { rgb: "E5F1EA" } },
    near: { patternType: "solid", fgColor: { rgb: "F7EFD9" } },
    gap:  { patternType: "solid", fgColor: { rgb: "F3DEDC" } },
    severe: { patternType: "solid", fgColor: { rgb: "EBD2D3" } },
    above: { patternType: "solid", fgColor: { rgb: "DCE9F3" } },
    na:   { patternType: "solid", fgColor: { rgb: "ECEFF2" } },
    head: { patternType: "solid", fgColor: { rgb: "0A3D62" } },
    sub:  { patternType: "solid", fgColor: { rgb: "F4F7FA" } }
  };
  var BORDER = {
    top:    { style: "thin", color: { rgb: "C8D2DD" } },
    bottom: { style: "thin", color: { rgb: "C8D2DD" } },
    left:   { style: "thin", color: { rgb: "C8D2DD" } },
    right:  { style: "thin", color: { rgb: "C8D2DD" } }
  };

  function aoaSheet(rows, opts) {
    var ws = XLSX.utils.aoa_to_sheet(rows);
    var cols = (rows[0] || []).map(function (_, i) {
      var maxLen = 4;
      rows.forEach(function (r) {
        var v = r[i];
        if (v == null) return;
        var s = String(v.v != null ? v.v : v);
        if (s.length > maxLen) maxLen = Math.min(80, s.length);
      });
      return { wch: Math.max(8, maxLen + 2) };
    });
    ws["!cols"] = cols;
    if (opts && opts.merges) ws["!merges"] = opts.merges;
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    return ws;
  }

  function styledCell(value, opts) {
    opts = opts || {};
    var c = { v: value };
    if (opts.bold) c.s = c.s || {}, c.s.font = { bold: true, color: opts.color ? { rgb: opts.color } : undefined };
    if (opts.fill) c.s = Object.assign(c.s || {}, { fill: opts.fill });
    if (opts.alignment) c.s = Object.assign(c.s || {}, { alignment: opts.alignment });
    if (opts.border) c.s = Object.assign(c.s || {}, { border: { top: BORDER.top, bottom: BORDER.bottom, left: BORDER.left, right: BORDER.right } });
    if (opts.headerColor) c.s = Object.assign(c.s || {}, { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: FILL.head, alignment: { horizontal: "left", vertical: "center" } });
    return c;
  }

  function headerRow(cols) {
    return cols.map(function (c) { return styledCell(c, { headerColor: true }); });
  }

  function bandFill(band) {
    if (band === "met") return FILL.met;
    if (band === "near") return FILL.near;
    if (band === "gap") return FILL.gap;
    if (band === "na") return FILL.na;
    return null;
  }

  // Bold totals row for the objective/principle sheets, summing the group rows.
  // Column order mirrors those sheets: lead cols, states, Unknown, [Above], N/A,
  // Applicable, [Meeting expected, Below expected]. leadCount = number of leading
  // label columns (2 for objectives, 3 for principles).
  function cafTotalsAoaRow(groups, ss, opts) {
    opts = opts || {};
    var t = { unknown: 0, na: 0, ab: 0, total: 0, meeting: 0, below: 0 }, st = {};
    ss.forEach(function (s) { st[s.value] = 0; });
    (groups || []).forEach(function (g) {
      var c = g.counts || {};
      ss.forEach(function (s) { st[s.value] += c[s.value] || 0; });
      t.unknown += c.unknown || 0; t.na += c.na || 0; t.ab += c.aboveBaseline || 0;
      t.total += g.total || 0; t.meeting += g.meeting || 0; t.below += g.below || 0;
    });
    var B = function (v) { return styledCell(v, { bold: true }); };
    var row = [B("Total")];
    for (var i = 1; i < (opts.leadCount || 1); i++) row.push(B(""));
    ss.forEach(function (s) { row.push(B(st[s.value])); });
    row.push(B(t.unknown));
    if (opts.hasAbove) row.push(B(t.ab));
    row.push(B(t.na), B(t.total));
    if (!opts.placeholder) row.push(B(t.meeting), B(t.below));
    return row;
  }

  // Client-fillable remediation tracker columns, appended to a per-item register
  // so the workbook can be maintained as a living tracker after handover.
  var TRACKER_HEAD = ["Owner", "Status", "Target date", "Progress note"];
  var TRACKER_COLS = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
  // Turn a contiguous register worksheet (header on row 1, data below, no blank
  // rows) into a working tracker: autofilter, a Status dropdown + conditional
  // colours, and a green tab. headLen = total column count INCLUDING the four
  // appended tracker columns; ownerFirst means Owner is the first of the four.
  function makeRegisterTracker(ws, headLen, dataRowsEnd) {
    var lastCol = XLSX.utils.encode_col(headLen - 1);
    ws["!autofilter"] = { ref: "A1:" + lastCol + dataRowsEnd };
    var statusIdx = headLen - 3; // order: Owner, Status, Target date, Progress note
    var st = statusTracker(statusIdx, 2, dataRowsEnd);
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    ws["!tabColor"] = "2E7D52";
  }

  // As makeRegisterTracker, but for a roadmap sheet laid out with a banner row
  // (row 1) and the header on row 2, so the filter/freeze/Status range start a
  // row lower. Gives a red tab. lastExcelRow = total rows incl banner+header.
  function makeRoadmapTracker(ws, headLen, lastExcelRow) {
    var lastCol = XLSX.utils.encode_col(headLen - 1);
    ws["!autofilter"] = { ref: "A2:" + lastCol + lastExcelRow };
    ws["!freeze"] = { xSplit: 0, ySplit: 2 };
    var st = statusTracker(headLen - 3, 3, lastExcelRow);
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    ws["!tabColor"] = "B23A33";
  }

  // Read me lines describing the tracker, appended to each instrument's Read me.
  function trackerReadmeRows() {
    return [
      [styledCell("Working tracker", { bold: true, fill: FILL.sub })],
      ["  - The per-item register is filterable (autofilter) with the header row frozen."],
      ["  - Status is a dropdown: Open / In progress / Blocked / Done. Fill in Owner, Target date and Progress note to track remediation in this file after handover."]
    ];
  }

  // Assign a tab colour to every sheet by role, unless a builder already set one.
  function applyTabColours(wb) {
    (wb.SheetNames || []).forEach(function (name) {
      var ws = wb.Sheets[name];
      if (!ws || ws["!tabColor"]) return;
      var n = String(name).toLowerCase(), col = "0F5FA6";
      if (n === "front") col = "0A3D62";
      else if (n.indexOf("read me") !== -1) col = "5A6B7B";
      else if (n.indexOf("roadmap") !== -1 || n.indexOf("priority") !== -1) col = "B23A33";
      else if (n.indexOf("requirement") !== -1 || n.indexOf("outcome") !== -1 || n.indexOf("question") !== -1 || n.indexOf("obligation") !== -1) col = "2E7D52";
      ws["!tabColor"] = col;
    });
  }

  function frontSheet(engagement, instrument) {
    var e = engagement.engagement || {};
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [styledCell("Schema version", { bold: true, fill: FILL.sub }), engagement.schemaVersion || ""],
      [styledCell("Saved at", { bold: true, fill: FILL.sub }), engagement.updatedAt || ""],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Client", { bold: true }), e.clientName],
      [styledCell("Site", { bold: true }), e.siteName],
      [styledCell("Address", { bold: true }), e.siteAddress],
      [styledCell("Contact", { bold: true }), e.siteContact],
      [styledCell("Opportunity ID", { bold: true }), e.opportunityId],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date of visit", { bold: true }), e.dateOfVisit],
      [styledCell("Document revision", { bold: true }), e.documentRevision],
      [styledCell("QA review by", { bold: true }), e.qaReviewBy],
      [styledCell("Authorised by", { bold: true }), e.authorisedBy],
      [styledCell("Issued to", { bold: true }), e.issuedTo],
      [styledCell("Issued date", { bold: true }), e.issuedDate],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 60 }];
    return ws;
  }

  // SL priority sheet - "where to look first": FRs that did not meet target,
  // ordered floor-flagged first then by gap size (target - conformant) DESC.
  // Mirrors the posture priority sheet structurally. Target-met / floor rules
  // are not changed; this is reporting only.
  function slPrioritySheet(scoredAll, taxonomy) {
    var rows = [
      [styledCell("Priority order: FRs that did not meet target; floor-flagged FRs first, then by gap size", { headerColor: true })].concat(Array(6).fill(styledCell("", { headerColor: true }))),
      headerRow(["Target", "Rank", "FR", "Name", "Achieved", "Target", "Gap", "Floor flags"])
    ];
    scoredAll.perTarget.forEach(function (t) {
      var pri = t.result.priorityFRs || [];
      pri.forEach(function (fr, i) {
        var taxFR = taxonomy.frs.filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
        var fill = fr.floorFlagCount > 0 ? FILL.gap : FILL.near;
        rows.push([
          t.target.name,
          i + 1,
          fr.frId,
          taxFR.name,
          { v: S.formatSL(fr.conformantAchievedSL), s: { fill: fill } },
          S.formatSL(fr.targetSL),
          fr.targetSL - fr.conformantAchievedSL,
          fr.floorFlagCount
        ]);
      });
      // Answered in part with nothing short: not a priority, not finished.
      var partly = t.result.partlyAssessedFRs || [];
      if (partly.length > 0) {
        rows.push([]);
        rows.push([styledCell("Partly assessed, nothing short so far (not eligible for priority ranking)", { bold: true, fill: FILL.sub })]);
        partly.forEach(function (fr) {
          var taxFR = taxonomy.frs.filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
          rows.push([t.target.name, "-", fr.frId, taxFR.name, "Not yet", S.formatSL(fr.targetSL), "-", "-"]);
        });
      }
      var notAssessed = t.result.notAssessedFRs || [];
      if (notAssessed.length > 0) {
        rows.push([]);
        rows.push([styledCell("Not assessed in this engagement (not eligible for priority ranking)", { bold: true, fill: FILL.sub })]);
        notAssessed.forEach(function (fr) {
          var taxFR = taxonomy.frs.filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
          rows.push([t.target.name, "-", fr.frId, taxFR.name, "-", S.formatSL(fr.targetSL), "-", "-"]);
        });
      }
      rows.push([]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [
      { wch: 16 }, { wch: 6 }, { wch: 6 }, { wch: 38 },
      { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }
    ];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    return ws;
  }

  // Per-SR remediation roadmap (requirements below target SL), priority-ordered.
  function slRoadmapSheet(scoredAll) {
    var head = ["Target", "SR code", "Title", "FR", "Achieved", "Target SL", "Captured evidence", "Business impact", "Recommended action", "Priority"].concat(TRACKER_HEAD);
    // Entries still to assess are work, not findings, and the banner says so.
    var anyToAssess = scoredAll.perTarget.some(function (t) {
      return (t.result.roadmap || []).some(function (it) { return it.toAssess; });
    });
    var rows = [
      [styledCell("Remediation roadmap: every applicable requirement below its target SL, floor findings first, in the consultant's priority order." +
        (anyToAssess ? " Entries marked To assess are not findings: every item answered so far is met, and the rest are still to be assessed." : ""),
        { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    scoredAll.perTarget.forEach(function (t) {
      (t.result.roadmap || []).forEach(function (it, i) {
        var bf = bandPriorityFill(it.priorityBand);
        var priText = "P" + (i + 1) + (nis2BandText(it.priorityBand) ? " (" + nis2BandText(it.priorityBand) + ")" : "");
        rows.push([
          t.target.name, it.code, it.title, it.frId,
          it.toAssess ? { v: "To assess", s: { fill: FILL.na } }
                      : { v: it.satisfiedCount + " / " + it.countedCount, s: { fill: it.blocks ? FILL.gap : FILL.near } },
          S.formatSL(it.targetSL),
          it.evidence || "", it.impact || "", it.action || "",
          bf ? { v: priText, s: { fill: bf } } : priText,
          it.owner || "", "", "", ""
        ]);
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 48 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 50 }, { wch: 30 }, { wch: 50 }, { wch: 14 }].concat(TRACKER_COLS);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    makeRoadmapTracker(ws, head.length, rows.length);
    return ws;
  }

  function summarySheet(scoredAll, taxonomy) {
    var perTarget = scoredAll.perTarget;
    var rows = [];
    rows.push([styledCell("Per-FR summary", { headerColor: true })].concat(Array(9).fill(styledCell("", { headerColor: true }))));
    // The second achieved column recomputes the level with compensating
    // countermeasures treated as not satisfied, which is the fragility signal.
    rows.push(headerRow(["Target", "FR", "Title", "FR target SL", "Achieved SL",
      "Achieved SL (no compensating)", "Closeness", "Floor flags", "FR target met", "Blocking items"]));
    perTarget.forEach(function (t) {
      t.result.perFR.forEach(function (fr) {
        var taxFR = taxonomy.frs.filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
        var fill = bandFill(fr.answeredCount === 0 ? "na" : fr.closenessBand);
        // Same words as the screen and Word (App.Report.frTargetWords).
        var ftw = window.App.Report.frTargetWords(fr);
        rows.push([
          t.target.name,
          fr.frId,
          taxFR.name,
          S.formatSL(fr.targetSL),
          fr.answeredCount === 0 ? "-" : S.formatSL(fr.conformantAchievedSL),
          fr.answeredCount === 0 ? "-" : S.formatSL(fr.achievedSLStrict),
          { v: fr.closeness === null ? "-" : Math.round(fr.closeness * 100) / 100, s: fill ? { fill: fill, numFmt: "0%" } : { numFmt: "0%" } },
          fr.floorFlagCount,
          { v: ftw.value, s: bandFill(ftw.band) ? { fill: bandFill(ftw.band) } : undefined },
          (fr.blockingItems || []).map(function (i) { return i.label; }).join(", ")
        ]);
      });
      rows.push([]);
    });
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
    ws["!cols"] = [{ wch: 18 }, { wch: 6 }, { wch: 34 }, { wch: 12 }, { wch: 12 },
                   { wch: 26 }, { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 40 }];
    return ws;
  }

  function requirementsSheet(scoredAll, taxonomy, instrument) {
    var head = [
      "Target", "FR", "SR code", "Title", "In scope", "Target SL", "Achieved SL", "Items satisfied", "Band",
      "Met", "Floor", "Above target", "Evidence", "Notes"
    ].concat(TRACKER_HEAD);
    var rows = [headerRow(head)];
    scoredAll.perTarget.forEach(function (t) {
      t.result.perRequirement.forEach(function (r) {
        var fill = bandFill(!r.applicable ? "na" : r.band);
        rows.push([
          t.target.name,
          r.frId,
          r.code,
          r.title,
          r.applicable ? "Yes" : "No",
          S.formatSL(r.targetSL),
          r.countedCount === 0 ? "-" : S.formatSL(r.achievedShown),
          r.countedCount === 0 ? "-" : (r.satisfiedCount + " / " + r.countedCount),
          { v: r.applicable ? (r.band || "-") : "N/A", s: fill ? { fill: fill } : undefined },
          r.met ? "Yes" : (r.toAssess ? "To assess" : (r.countedCount > 0 ? "No" : "")),
          r.floor ? "Yes" : "",
          // Assessed beyond what the target asks for: headroom, not a gap. The
          // capped figure, or every requirement that stops selecting below SL 4
          // would report headroom nobody assessed.
          (r.achievedShown != null && r.targetSL > 0 && r.achievedShown > r.targetSL)
            ? S.formatSL(r.achievedShown) : "",
          // From the scored requirement, so evidence a zone inherited from the
          // system-wide layer appears rather than reading as blank.
          r.evidence || "",
          r.notes || "",
          "", "", "", ""
        ]);
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [
      { wch: 18 }, { wch: 6 }, { wch: 9 }, { wch: 50 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 7 }, { wch: 13 }, { wch: 60 }, { wch: 40 }
    ].concat(TRACKER_COLS);
    makeRegisterTracker(ws, head.length, rows.length);
    return ws;
  }

  // The unit of assessment is the item (base requirement plus each requirement
  // enhancement), so the workbook has to show them: a register keyed only by
  // requirement hides both what was answered and what is blocking a level.
  var ITEM_STATE_LABEL = {
    "met": "Met",
    "met-compensating": "Met (compensating)",
    "partial": "Partial",
    "not-met": "Not met",
    "na": "N/A"
  };
  function itemsSheet(scoredAll, taxonomy) {
    var head = ["Target", "FR", "Item", "What it covers", "Required from SL", "In scope",
                "State", "Answered at", "Counts as", "Justification / note"];
    var rows = [headerRow(head)];
    scoredAll.perTarget.forEach(function (t) {
      t.result.perRequirement.forEach(function (r) {
        (r.items || []).forEach(function (i) {
          var fill = bandFill(!i.inScope ? "na"
            : (i.disposition === "satisfied" ? "met"
              : (i.disposition === "partial" ? "near"
                : (i.disposition === "excluded" ? "na" : "gap"))));
          rows.push([
            t.target.name,
            r.frId,
            i.label,
            i.title || "",
            i.firstSL,
            i.inScope ? "Yes" : "No",
            { v: i.state ? (ITEM_STATE_LABEL[i.state] || i.state) : "Not assessed",
              s: fill ? { fill: fill } : undefined },
            // Where the answer came from: recorded here, or inherited from a
            // system-wide answer. Filtering on this is how you find every zone
            // riding on one shared countermeasure. A shared answer that reaches
            // only some targets says so, because that is the thing a reader
            // would otherwise get wrong.
            i.state ? (i.source === "shared"
                        ? (i.sharedCoverage && i.sharedCoverage.length
                            ? "Shared (" + i.sharedCoverage.length + " " + targetNounFor(scoredAll) + "s)"
                            : "Shared (all)")
                        : "This " + targetNounFor(scoredAll)) : "",
            i.disposition,
            i.note || ""
          ]);
        });
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 18 }, { wch: 6 }, { wch: 14 }, { wch: 56 }, { wch: 16 },
                   { wch: 9 }, { wch: 20 }, { wch: 16 }, { wch: 13 }, { wch: 50 }];
    ws["!autofilter"] = { ref: "A1:" + XLSX.utils.encode_col(head.length - 1) + rows.length };
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    return ws;
  }

  function targetNounFor(scoredAll) {
    var inst = scoredAll && scoredAll.instrument;
    return ((inst && inst.targetDimensionLabel) || "target").toLowerCase();
  }

  // Actions that span targets: one row per shared gap, with the targets it
  // resolves. Only produced when the system-wide layer is in use.
  function sharedActionsSheet(scoredAll) {
    var rows = (scoredAll && scoredAll.sharedRoadmap) || [];
    if (!rows.length) return null;
    var head = ["Requirement", "Title", "FR", "Priority", "Owner", "Recommended action",
                "Business impact", "Resolves", "Targets affected"];
    var aoa = [headerRow(head)];
    rows.forEach(function (r) {
      aoa.push([
        r.code || "",
        r.title || "",
        r.frId || "",
        typeof r.priorityRank === "number" ? r.priorityRank : "",
        r.owner || "",
        r.action || "",
        r.impact || "",
        r.affected.map(function (a) {
          return a.name + " (target " + S.formatSL(a.targetSL) + ", currently " + S.formatSL(a.itemsAchieved) + ")";
        }).join("; "),
        r.affected.length
      ]);
    });
    var ws = aoaSheet(aoa);
    ws["!cols"] = [{ wch: 12 }, { wch: 46 }, { wch: 6 }, { wch: 9 }, { wch: 24 },
                   { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 16 }];
    ws["!autofilter"] = { ref: "A1:" + XLSX.utils.encode_col(head.length - 1) + aoa.length };
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    ws["!tabColor"] = "B23A33";
    return ws;
  }

  function targetsSheet(scoredAll, taxonomy) {
    if (scoredAll.perTarget.length < 2) return null;
    var hdr = ["FR"].concat(scoredAll.perTarget.map(function (t) { return t.target.name; }));
    var rows = [headerRow(hdr)];
    taxonomy.frs.forEach(function (fr) {
      var row = [fr.id];
      scoredAll.perTarget.forEach(function (t) {
        var f = t.result.perFR.filter(function (x) { return x.frId === fr.id; })[0];
        var fill = bandFill(f.answeredCount === 0 ? "na" : f.closenessBand);
        var v = f.answeredCount === 0
          ? "Not assessed"
          : (S.formatSL(f.conformantAchievedSL) + " (" + S.formatPct(f.closeness) + ")" + (f.floorFlagCount ? " * floor" : "") +
             (f.frTargetStatus === "incomplete" ? ", not yet" : ""));
        row.push({ v: v, s: fill ? { fill: fill } : undefined });
      });
      rows.push(row);
    });
    // Same words as the screen and Word: a zone with in-scope FRs still
    // unanswered reads "Not yet (N of M FRs assessed)", never a bare "No".
    var R = window.App && window.App.Report;
    var totals = ["Target met"];
    scoredAll.perTarget.forEach(function (t) {
      if (R && R.slAnyAnswered ? !R.slAnyAnswered(t.result) : t.result.totalAnswered === 0) { totals.push("Not assessed"); return; }
      if (R && R.slTargetMetWords) {
        var tm = R.slTargetMetWords(t.result);
        totals.push(tm.detail ? tm.value + " (" + tm.detail + ")" : tm.value);
        return;
      }
      totals.push(t.result.overallTargetMet ? "Yes" : "No");
    });
    rows.push(totals);
    return aoaSheet(rows);
  }

  function readmeSheet(instrument) {
    // Per family: this sheet used to print the capability-SL target-scoring
    // rules into every workbook, including CAF and NIS2 ones they do not
    // describe. Falls back to the flat list on an older export-docx.
    var D = window.App.ExportDOCX;
    var lines = (D && D.methodologyLinesFor) ? D.methodologyLinesFor(instrument)
      : ((D && D.METHODOLOGY_LINES) || []);
    var rows = [ [styledCell("Read me", { headerColor: true })] ];
    lines.forEach(function (l) {
      if (l.kind === "head")   rows.push([styledCell(l.text, { bold: true, fill: FILL.sub })]);
      else if (l.kind === "bullet") rows.push(["  - " + l.text]);
      else                     rows.push([l.text]);
    });
    trackerReadmeRows().forEach(function (r) { rows.push(r); });
    rows.push([""]);
    rows.push(["Instrument", instrument.title]);
    rows.push(["Content version", instrument.contentVersion || ""]);
    rows.push(["Edition", instrument.edition || ""]);
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    ws["!cols"] = [{ wch: 26 }, { wch: 100 }];
    return ws;
  }

  // ---- domain-letter sheets --------------------------------------------
  //
  // One workbook covers every target in the engagement it is handed: the
  // export scope dialog promises one workbook for all the selected sites, and
  // screening several suppliers in one file is ordinary use. These sheets used
  // to read the first target only, so a second supplier never reached the
  // file, and the Questions sheet keyed answers by question across every
  // target, printing the last supplier's notes beside the first supplier's
  // bands. Each sheet now walks every target and reads that target's own
  // answers. With more than one, rows that are per domain or per question
  // gain a leading column naming the target, and the headline gives each
  // target its own column; a single-target workbook keeps the columns it had.

  function postureSites(scoredAll) {
    return ((scoredAll && scoredAll.perTarget) || []).filter(function (t) { return t && t.result; });
  }

  // One target's answers, grouped exactly as ScoringDomainLetter.scoreEngagement
  // groups them (an answer without a target belongs to the first), so the notes
  // printed beside a band are the notes that produced it.
  function postureResponsesFor(engagement, targetId) {
    var first = engagement.targets && engagement.targets[0] && engagement.targets[0].id;
    return (engagement.responses || []).filter(function (r) {
      return (r.targetId || first) === targetId;
    });
  }

  function pct3(v) {
    return { v: v === null || v === undefined ? "-" : Math.round(v * 1000) / 1000, s: { numFmt: "0%" } };
  }

  function postureHeadlineSheet(scoredAll, engagement, instrument) {
    var sites = postureSites(scoredAll);
    if (!sites.length) return aoaSheet([[styledCell("Headline", { headerColor: true })]]);
    var multi = sites.length > 1;
    // Grade-cell fills here are decided by the GRADE LETTER alone (A/B met,
    // C/D near, E/F gap). Coverage / confidence is carried separately by the
    // "Confidence" row and a "(P)" suffix on the grade text, so amber is
    // reserved for the partial-score band on the A-F scale itself.
    function gradeFill(g) {
      if (!g) return FILL.na;
      if (g === "A" || g === "B") return FILL.met;
      if (g === "C" || g === "D") return FILL.near;
      return FILL.gap;
    }
    function weakestText(per) {
      if (!per.weakestDomains || per.weakestDomains.length === 0) return "-";
      if (per.weakestDomains.length === 1) {
        var d = per.weakestDomains[0];
        return d.name + " (" + d.grade + ")";
      }
      return per.weakestDomains.map(function (d) { return d.name; }).join(", ") + " (all " + per.weakestDomains[0].grade + ")";
    }
    var first = sites[0].result;
    var weakestLabel = multi ? "Weakest graded domain or domains"
      : ((first.weakestDomains && first.weakestDomains.length > 1) ? "Weakest graded domains (tied)" : "Weakest graded domain");
    // One row per measure, one column per target. The header names each
    // target, so a single-target headline says whose it is too.
    var measures = [
      ["Overall indicative grade", function (per) {
        return { v: (per.headlineGrade || "-") + (per.lowConfidence && per.headlineGrade ? " (P)" : ""), s: { fill: gradeFill(per.headlineGrade) } };
      }],
      ["Weighted-mean grade (pre-cap)", function (per) { return per.headlineMeanGrade || "-"; }],
      ["Cap applied", function (per) {
        return { v: per.capApplied ? "Yes (capped at " + per.capDistance + " above weakest graded)" : "No", s: { fill: per.capApplied ? FILL.near : null } };
      }],
      [weakestLabel, weakestText],
      ["Coverage", function (per) { return pct3(per.overallCoverage); }],
      ["Coverage threshold", function (per) { return { v: per.coverageThreshold, s: { numFmt: "0%" } }; }],
      ["Coverage state", function (per) { return per.lowConfidence ? "Indicative (coverage below threshold)" : "Sufficient"; }],
      ["Confidence (Unknown share)", function (per) { return per.overallConfidenceLevel || "-"; }],
      ["Unknown rate", function (per) { return pct3(per.overallUnknownRate); }],
      ["Answered / scorable", function (per) { return per.totalAnswered + " / " + per.totalScorable; }],
      ["Unknown count", function (per) { return per.totalUnknown; }],
      ["Not applicable", function (per) { return per.totalNA; }],
      ["Context-only (not scored)", function (per) { return per.totalContextOnly; }]
    ];
    var rows = [[styledCell("Headline", { headerColor: true })].concat(sites.map(function (t) {
      return styledCell((t.target && t.target.name) || "", { headerColor: true });
    }))];
    measures.forEach(function (m) {
      rows.push([styledCell(m[0], { bold: true, fill: FILL.sub })].concat(sites.map(function (t) { return m[1](t.result); })));
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 36 }].concat(sites.map(function () { return { wch: multi ? 40 : 60 }; }));
    return ws;
  }

  function postureDomainsSheet(scoredAll) {
    var sites = postureSites(scoredAll);
    if (!sites.length) return aoaSheet([[styledCell("Domains", { headerColor: true })]]);
    var multi = sites.length > 1;
    // Sheet structure:
    //   [Site |] Domain | Name | Grade | Score | Coverage | Coverage state | Confidence | Unknown rate | Answered | Scorable | Unknown count | N/A
    // The two "state" columns are different signals:
    //   Coverage state - whether enough was attempted (the (P) provisional flag).
    //   Confidence     - what share of attempts were Unknown (high/moderate/low).
    var lead = multi ? [targetNouns(scoredAll.instrument).one] : [];
    var rows = [headerRow(lead.concat(["Domain", "Name", "Grade", "Score", "Coverage", "Coverage state", "Confidence", "Unknown rate", "Answered", "Scorable", "Unknown count", "N/A"]))];
    sites.forEach(function (t) {
      var siteCell = multi ? [t.target.name || ""] : [];
      t.result.perDomain.forEach(function (d) {
        // Grade fill from the grade letter only - never from coverage or
        // confidence. Coverage / confidence are carried in dedicated columns.
        var fill = d.score === null ? FILL.na :
          (d.score >= 0.7 ? FILL.met : (d.score >= 0.4 ? FILL.near : FILL.gap));
        var gradeText = (d.grade || "-") + (d.lowCoverage ? " (P)" : "");
        var confFill = null;
        if (d.confidenceKey === "moderate") confFill = FILL.near;
        else if (d.confidenceKey === "low") confFill = FILL.gap;
        rows.push(siteCell.concat([
          cap(d.domainId),
          d.name,
          { v: gradeText, s: { fill: fill } },
          pct3(d.score),
          pct3(d.coverage),
          d.lowCoverage ? "Provisional (below threshold)" : (d.grade ? "Sufficient" : "Not yet graded"),
          { v: d.confidenceLevel || "-", s: confFill ? { fill: confFill } : undefined },
          pct3(d.unknownRate),
          d.answeredCount,
          d.scorableCount,
          d.unknownCount,
          d.naCount
        ]));
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = (multi ? [{ wch: 26 }] : []).concat([
      { wch: 10 }, { wch: 32 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
      { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 8 }
    ]);
    if (multi) ws["!autofilter"] = { ref: "A1:" + XLSX.utils.encode_col(rows[0].length - 1) + rows.length };
    return ws;
  }

  function posturePrioritySheet(scoredAll) {
    var sites = postureSites(scoredAll);
    if (!sites.length) return aoaSheet([[styledCell("Priority order", { headerColor: true })]]);
    var DL = window.App.ScoringDomainLetter;
    var multi = sites.length > 1;
    var nouns = targetNouns(scoredAll.instrument);
    var head = (multi ? [nouns.one] : []).concat(["Rank", "Domain", "Name", "Grade", "Score", "Coverage"]);
    var banner = "Priority order: worst-to-best across graded domains; insufficient-evidence domains listed separately" +
      (multi ? ". Each " + nouns.one.toLowerCase() + " is ranked on its own." : "");
    var rows = [
      [styledCell(banner, { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    sites.forEach(function (t, si) {
      var per = t.result;
      var po = per.priorityOrder || DL.priorityOrder(per.perDomain);
      var siteCell = multi ? [t.target.name || ""] : [];
      if (multi && si > 0) rows.push([]);
      (po.graded || []).forEach(function (d, i) {
        var fill = d.score >= 0.7 ? FILL.met : (d.score >= 0.4 ? FILL.near : FILL.gap);
        rows.push(siteCell.concat([
          i + 1,
          cap(d.domainId),
          d.name,
          { v: d.grade, s: { fill: fill } },
          { v: Math.round(d.score * 1000) / 1000, s: { numFmt: "0%" } },
          { v: Math.round(d.coverage * 1000) / 1000, s: { numFmt: "0%" } }
        ]));
      });
      if ((po.insufficient || []).length > 0) {
        rows.push([]);
        rows.push([styledCell("Insufficient evidence to grade (coverage below threshold)" + (multi ? ": " + (t.target.name || "") : ""), { bold: true, fill: FILL.sub })]);
        (po.insufficient || []).forEach(function (d) {
          rows.push(siteCell.concat([
            "-",
            cap(d.domainId),
            d.name,
            { v: (d.grade || "-") + " (P)", s: { fill: FILL.na } },
            pct3(d.score),
            { v: Math.round(d.coverage * 1000) / 1000, s: { numFmt: "0%" } }
          ]));
        });
      }
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = (multi ? [{ wch: 26 }] : []).concat([{ wch: 6 }, { wch: 10 }, { wch: 36 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    return ws;
  }

  // Per-question remediation roadmap (improvement opportunities), priority-ordered.
  function postureRoadmapSheet(scoredAll) {
    var sites = postureSites(scoredAll);
    var multi = sites.length > 1;
    var nouns = targetNouns(scoredAll.instrument);
    var head = (multi ? [nouns.one] : []).concat(["Domain", "Question ID", "Prompt", "Band", "Captured evidence", "Business impact", "Recommended action", "Priority"]).concat(TRACKER_HEAD);
    var banner = "Improvement roadmap: scored questions below the top band, weakest first, in the consultant's priority order." +
      (multi ? " Each " + nouns.one.toLowerCase() + "'s list is numbered on its own." : "");
    var rows = [
      [styledCell(banner, { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    sites.forEach(function (t) {
      var siteCell = multi ? [t.target.name || ""] : [];
      (t.result.roadmap || []).forEach(function (it, i) {
        var bf = bandPriorityFill(it.priorityBand);
        var priText = "P" + (i + 1) + (nis2BandText(it.priorityBand) ? " (" + nis2BandText(it.priorityBand) + ")" : "");
        rows.push(siteCell.concat([
          cap(it.domainId), it.questionId, it.prompt,
          it.bandLabel || ("Band " + (it.band == null ? "-" : it.band)),
          it.evidence || "", it.impact || "", it.action || "",
          bf ? { v: priText, s: { fill: bf } } : priText,
          it.owner || "", "", "", ""
        ]));
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = (multi ? [{ wch: 26 }] : []).concat([{ wch: 10 }, { wch: 12 }, { wch: 60 }, { wch: 14 }, { wch: 50 }, { wch: 30 }, { wch: 50 }, { wch: 14 }]).concat(TRACKER_COLS);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    makeRoadmapTracker(ws, head.length, rows.length);
    return ws;
  }

  function postureQuestionsSheet(scoredAll, engagement, instrument) {
    var sites = postureSites(scoredAll);
    if (!sites.length) return aoaSheet([[styledCell("Questions", { headerColor: true })]]);
    var multi = sites.length > 1;
    var head = (multi ? [targetNouns(instrument).one] : [])
      .concat(["Domain", "Question ID", "Prompt", "Scored", "Safety", "State", "Band", "Band label", "Score (norm)", "Notes / captured fields"]).concat(TRACKER_HEAD);
    var rows = [headerRow(head)];
    sites.forEach(function (t) {
      // This target's own answers and scores only: keyed across every target,
      // the last target's notes landed beside the first target's bands.
      var byQ = {};
      postureResponsesFor(engagement, t.target.id).forEach(function (r) { byQ[r.requirementId || r.questionId] = r; });
      var scoredBy = {};
      (t.result.perQuestion || []).forEach(function (x) { scoredBy[x.questionId] = x; });
      var siteCell = multi ? [t.target.name || ""] : [];

      instrument.questions.forEach(function (q) {
        var resp = byQ[q.id] || {};
        var sq = scoredBy[q.id] || {};
        var fill = null;
        if (sq.state === "scored") fill = sq.score >= 0.7 ? FILL.met : (sq.score >= 0.4 ? FILL.near : FILL.gap);
        else if (sq.state === "na" || sq.state === "context") fill = FILL.na;

        var captureBits = [];
        var capObj = resp.capture || {};
        Object.keys(capObj).forEach(function (k) {
          var v = capObj[k];
          if (Array.isArray(v)) v = v.join(", ");
          if (v === true) v = "Yes"; else if (v === false) v = "No";
          captureBits.push(k + ": " + (v == null ? "" : String(v)));
        });
        if (resp.notes) captureBits.push("Notes: " + resp.notes);

        rows.push(siteCell.concat([
          cap(q.domainId),
          cap(q.id),
          q.prompt,
          q.scored === false ? "context" : "yes",
          q.safetyFlag ? "Safety" : "",
          { v: sq.state || "unanswered", s: fill ? { fill: fill } : undefined },
          sq.band !== null && sq.band !== undefined ? sq.band : "",
          sq.bandLabel || "",
          sq.score === null || sq.score === undefined ? "" :
            { v: Math.round(sq.score * 1000) / 1000, s: { numFmt: "0%" } },
          captureBits.join(" | "),
          "", "", "", ""
        ]));
      });
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = (multi ? [{ wch: 26 }] : []).concat([
      { wch: 10 }, { wch: 12 }, { wch: 60 }, { wch: 9 }, { wch: 8 },
      { wch: 12 }, { wch: 6 }, { wch: 20 }, { wch: 10 }, { wch: 60 }
    ]).concat(TRACKER_COLS);
    makeRegisterTracker(ws, head.length, rows.length);
    return ws;
  }

  function postureReadmeSheet(instrument, profile) {
    var thr = Math.round((profile.coverageThreshold || 0.6) * 100);
    // The cap in words, from the profile, not the parameter name.
    var capN = (profile.headlineMethod || {}).capDistance;
    if (typeof capN !== "number") capN = 1;
    var capWords = (["no", "one", "two", "three", "four"][capN] || String(capN)) + (capN === 1 ? " grade" : " grades");
    var rows = [
      [styledCell("Read me", { headerColor: true })],
      [styledCell("Scoring methodology", { bold: true, fill: FILL.sub })],
      ["This is an indicative posture assessment. It is not a conformance assessment against ISA/IEC 62443 or any other standard, and not a regulatory assessment."],
      [styledCell("Per scored question", { bold: true, fill: FILL.sub })],
      ["  - Normalised score = band / 3, so 0, 0.33, 0.67, 1.0. Band 0 (Not in place) is the lowest capability score; no state scores below 0."],
      ["  - The band is set by the consultant; capture fields (text, checklist, choice, boolean) are evidence and never set the score."],
      ["  - Unknown: excluded from the domain capability mean. Unknown is treated as a visibility finding, not as a known-zero capability, so it does not push the domain mean down (and it never scores below band 0). It does, however, count against coverage and drive a confidence flag."],
      ["  - Not applicable: excluded from both the score and the coverage denominator (the only state fully discounted)."],
      ["  - Context-only (scored:false) questions are excluded from grading entirely."],
      [styledCell("Per domain", { bold: true, fill: FILL.sub })],
      ["  - Domain score = mean of normalised scores across answered scored questions."],
      ["  - Domain coverage = answered / scorable (excluding N/A). Tells you how much was attempted."],
      ["  - Unknown rate = unknown / (unknown + answered). Tells you how much of what was attempted was actually known."],
      ["  - Confidence flag = High / Moderate / Low based on Unknown rate, with thresholds from the profile."],
      ["  - Domain grade = letter from the profile's letterBands for the domain score."],
      [styledCell("Overall", { bold: true, fill: FILL.sub })],
      ["  - Headline grade = weighted mean of domain scores across domains that meet the coverage threshold, mapped to a letter, then capped to sit at most " + capWords + " above the weakest graded domain on the A>B>C>D>E>F ladder. Domains below the coverage threshold are excluded from both the mean and the cap."],
      ["  - Coverage below " + thr + "% is reported as indicative (a 'P' marker on the grade), separate from the Confidence flag."],
      ["  - By design, a single Unknown answer does not move the headline grade. Unknown counts against coverage and confidence, not capability."],
      [styledCell("Working tracker", { bold: true, fill: FILL.sub })],
      ["  - The Questions register is filterable (autofilter) with the header row frozen."],
      ["  - Status is a dropdown: Open / In progress / Blocked / Done. Fill in Owner, Target date and Progress note to track remediation in this file after handover."],
      [""],
      ["Instrument", instrument.title],
      ["Content version", instrument.contentVersion || ""],
      ["Edition", instrument.edition || ""]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 90 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    return ws;
  }

  // ---- CAF (caf-achieved family) ----------------------------------------

  function cafProfileInfoFromOpts(opts) {
    var reg = (opts && opts.cafProfileRegistry) || null;
    var activeId = (opts && opts.cafProfileId) || null;
    var loaded = (opts && opts.cafProfile) || null;
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
  function cafStateFill(state, instrument) {
    if (state === "achieved")  return FILL.met;
    if (state === "partially") return FILL.near;
    if (state === "not")       return FILL.gap;
    // Unknown is the most severe finding on unknownIsFinding instruments (CIS).
    if (state === "unknown" && instrument && instrument.unknownIsFinding) return FILL.severe;
    return FILL.na;
  }
  function cafStateLabelX(state, instrument) {
    var L = window.App.ScoringCAF.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    return "";
  }

  function cafFrontSheet(engagement, instrument, info) {
    var e = engagement.engagement || {};
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [styledCell("Schema version", { bold: true, fill: FILL.sub }), engagement.schemaVersion || ""],
      [styledCell("Saved at", { bold: true, fill: FILL.sub }), engagement.updatedAt || ""],
      [styledCell("Selected profile", { bold: true, fill: FILL.sub }), info.name + (info.placeholder ? " (expected states not available)" : "")],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Client", { bold: true }), e.clientName],
      [styledCell("Site", { bold: true }), e.siteName],
      [styledCell("Address", { bold: true }), e.siteAddress],
      [styledCell("Contact", { bold: true }), e.siteContact],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date of visit", { bold: true }), e.dateOfVisit],
      [styledCell("Document revision", { bold: true }), e.documentRevision],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 70 }];
    return ws;
  }

  // Substantive states with their Excel fills, from the instrument (CAF: three
  // bands; NIST: Satisfied / Other Than Satisfied). Drives the count columns.
  function cafXlsxStates(instrument) {
    return window.App.ScoringCAF.substantiveStates(instrument).map(function (s) {
      return { value: s.value, label: s.label, fill: s.colour === "met" ? FILL.met : s.colour === "near" ? FILL.near : FILL.gap };
    });
  }

  function cafPrincipleNoun(instrument) {
    var d = (instrument && instrument.display) || {};
    if (d.principleNoun) return d.principleNoun.toLowerCase();
    return (d.objectiveTitle === "Control families") ? "control family" : "principle";
  }

  // True when the instrument carries a per-family OT lens; drives whether the
  // register/roadmap sheets show an "OT framing" column (a generic enterprise
  // instrument like nist-800-53 has none, so the column is omitted).
  function cafHasOTLens(instrument) {
    return !!(instrument && instrument.taxonomy && instrument.taxonomy.principles &&
      instrument.taxonomy.principles.some(function (p) { return p.otLens && p.otLens.framing; }));
  }

  function cafObjectivesSheet(scored, info, instrument) {
    var ss = cafXlsxStates(instrument);
    var hasAbove = ((scored.aboveBaseline || []).length > 0) && !info.placeholder;
    var head = ["Objective", "Name"].concat(ss.map(function (s) { return s.label; })).concat(["Unknown"]).concat(hasAbove ? ["Above baseline"] : []).concat(["N/A", "Applicable"]);
    if (!info.placeholder) head.push("Meeting expected", "Below expected");
    var rows = [
      [styledCell("Outcome profile by objective for the " + info.name + " profile", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    scored.byObjective.forEach(function (obj) {
      var c = obj.counts;
      var ab = c.aboveBaseline || 0;
      var row = [obj.objectiveId, obj.name]
        .concat(ss.map(function (s) { return { v: c[s.value] || 0, s: { fill: s.fill } }; }))
        .concat([c.unknown])
        .concat(hasAbove ? [{ v: ab, s: { fill: ab > 0 ? FILL.above : undefined } }] : [])
        .concat([c.na, obj.total]);
      if (!info.placeholder) { row.push(obj.meeting, obj.below); }
      rows.push(row);
    });
    rows.push(cafTotalsAoaRow(scored.byObjective, ss, { leadCount: 2, hasAbove: hasAbove, placeholder: info.placeholder }));
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    return ws;
  }

  function cafPrinciplesSheet(scored, info, instrument) {
    var ss = cafXlsxStates(instrument);
    var noun = cafPrincipleNoun(instrument);
    var nounCap = noun.charAt(0).toUpperCase() + noun.slice(1);
    var hasAbove = ((scored.aboveBaseline || []).length > 0) && !info.placeholder;
    var head = [nounCap, "Name", "Objective"].concat(ss.map(function (s) { return s.label; })).concat(["Unknown"]).concat(hasAbove ? ["Above baseline"] : []).concat(["N/A", "Applicable"]);
    if (!info.placeholder) head.push("Meeting expected", "Below expected");
    var rows = [
      [styledCell("Outcome profile by " + noun + " for the " + info.name + " profile", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    scored.byPrinciple.forEach(function (p) {
      var c = p.counts;
      var ab = c.aboveBaseline || 0;
      var row = [p.principleId, p.name, p.objectiveId]
        .concat(ss.map(function (s) { return { v: c[s.value] || 0, s: { fill: s.fill } }; }))
        .concat([c.unknown])
        .concat(hasAbove ? [{ v: ab, s: { fill: ab > 0 ? FILL.above : undefined } }] : [])
        .concat([c.na, p.total]);
      if (!info.placeholder) { row.push(p.meeting, p.below); }
      rows.push(row);
    });
    rows.push(cafTotalsAoaRow(scored.byPrinciple, ss, { leadCount: 3, hasAbove: hasAbove, placeholder: info.placeholder }));
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    return ws;
  }

  function cafOutcomesSheet(scored, instrument, info) {
    var hasLens = cafHasOTLens(instrument);
    var head = ["Objective", "Principle", "Outcome", "Title", "State", "Expected", "Meets expected", "Applicable", "Evidence", "Notes"]
      .concat(hasLens ? ["OT framing"] : [])
      .concat(["Relevant IEC 62443 guidance"]).concat(TRACKER_HEAD);
    var rows = [headerRow(head)];
    var byPrin = {};
    (instrument.taxonomy && instrument.taxonomy.principles || []).forEach(function (p) { byPrin[p.id] = p; });
    scored.perOutcome.forEach(function (it) {
      var prin = byPrin[it.principleId] || {};
      var meetsText;
      if (info.placeholder || !it.hasExpected) meetsText = "-";
      else if (it.meetsExpected === true) meetsText = "Yes";
      else if (it.meetsExpected === false) meetsText = "No";
      else meetsText = "-";
      var stateFill = it.profileApplicable && it.state ? cafStateFill(it.state, instrument) : FILL.na;
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      rows.push([
        prin.objectiveId || "",
        it.principleId,
        it.outcomeId,
        it.title,
        { v: cafStateLabelX(it.state, instrument), s: { fill: stateFill } },
        it.hasExpected ? cafStateLabelX(it.expectedState, instrument) : "-",
        meetsText,
        it.profileApplicable ? (it.isNA ? "No (consultant)" : "Yes") : "No (profile)",
        it.evidence || "",
        it.notes || ""
      ].concat(hasLens ? [lensFraming] : []).concat([
        cafXrefCell(instrument.id, it),
        "", "", "", ""
      ]));
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 46 },
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
      { wch: 60 }, { wch: 40 }
    ].concat(hasLens ? [{ wch: 50 }] : []).concat([{ wch: 40 }]).concat(TRACKER_COLS);
    makeRegisterTracker(ws, head.length, rows.length);
    return ws;
  }

  // The other half of the roadmap: what IS in place, named, with its evidence.
  // The Outcomes sheet carries every outcome and can be filtered down to the
  // achieved ones, but a client asked to evidence what they have does not want
  // to be told to filter a spreadsheet - and the Word report now carries the
  // same list, so the two agree.
  function cafAchievedSheet(scored, instrument, info) {
    var hasLens = cafHasOTLens(instrument);
    var disp = (instrument && instrument.display) || {};
    var unit = disp.outcomesTitle || "Outcomes";
    var prinObj = {}, objName = {};
    ((instrument.taxonomy && instrument.taxonomy.principles) || []).forEach(function (p) { prinObj[p.id] = p.objectiveId; });
    ((instrument.taxonomy && instrument.taxonomy.objectives) || []).forEach(function (o) { objName[o.id] = o.name; });

    var achieved = (scored.perOutcome || []).filter(function (it) {
      return it.profileApplicable !== false && it.state === "achieved";
    });
    var head = ["Objective", "Principle", unit.replace(/s$/i, ""), "Title", "State", "Captured evidence"]
      .concat(hasLens ? ["OT framing"] : []);
    var rows = [
      [styledCell(achieved.length + " of " + (scored.perOutcome || []).length + " " + unit.toLowerCase() +
        " assessed as achieved.",
        { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    achieved.forEach(function (it) {
      var oid = prinObj[it.principleId] || "";
      var row = [
        oid ? (oid + " " + (objName[oid] || "")) : "",
        it.principleId || "",
        it.outcomeId,
        it.title || "",
        { v: cafStateLabelX(it.state, instrument), s: { fill: cafStateFill(it.state, instrument) } },
        it.evidence || ""
      ];
      if (hasLens) row.push((it.otLens && it.otLens.framing) ? it.otLens.framing : "");
      rows.push(row);
    });
    if (!achieved.length) {
      rows.push([""].concat(Array(head.length - 1).fill("")));
      rows[2][0] = "No " + unit.toLowerCase() + " were assessed as achieved.";
    }
    var ws = aoaSheet(rows);
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 1 }, e: { c: head.length - 1, r: Math.max(2, rows.length - 1) } }) };
    return ws;
  }

  function cafRoadmapSheet(scored, instrument, info) {
    var hasLens = cafHasOTLens(instrument);
    var head = ["Outcome", "Title", "Current", "Expected", "Captured evidence"]
      .concat(hasLens ? ["OT framing"] : [])
      .concat(["Business impact", "Recommended action", "Priority", "Relevant IEC 62443 guidance"]).concat(TRACKER_HEAD);
    var rows = [
      [styledCell("Roadmap toward expected outcomes for the " + info.name + " profile: every outcome below expected, in the consultant's priority order.", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    (scored.roadmap || []).forEach(function (it, i) {
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      var bf = bandPriorityFill(it.priorityBand);
      var priText = "P" + (i + 1) + (nis2BandText(it.priorityBand) ? " (" + nis2BandText(it.priorityBand) + ")" : "");
      rows.push([
        it.outcomeId,
        it.title,
        { v: cafStateLabelX(it.state, instrument), s: { fill: cafStateFill(it.state, instrument) } },
        it.hasExpected ? { v: cafStateLabelX(it.expectedState, instrument), s: { fill: cafStateFill(it.expectedState, instrument) } } : "-",
        it.evidence || ""
      ].concat(hasLens ? [lensFraming] : []).concat([
        it.impact || "", it.action || "",
        bf ? { v: priText, s: { fill: bf } } : priText,
        cafXrefCell(instrument.id, it),
        it.owner || "", "", "", ""
      ]));
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [
      { wch: 10 }, { wch: 46 }, { wch: 18 }, { wch: 18 }, { wch: 50 }
    ].concat(hasLens ? [{ wch: 50 }] : []).concat([
      { wch: 30 }, { wch: 50 }, { wch: 14 }, { wch: 40 }
    ]).concat(TRACKER_COLS);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    makeRoadmapTracker(ws, head.length, rows.length);
    return ws;
  }

  function cafReadmeSheet(instrument, info) {
    var ss = window.App.ScoringCAF.substantiveStates(instrument);
    var stateList = ss.map(function (s) { return s.label; });
    var stateOr = stateList.slice(0, -1).join(", ") + (stateList.length > 1 ? " or " : "") + stateList[stateList.length - 1];
    var stateSlash = stateList.join(" / ");
    var isBinary = ss.length === 2;
    var disp = instrument.display || {};
    var scopeLine = disp.reportDescription
      ? (disp.reportDescription + ". This is an alignment and gap analysis, not a formal assessment or a regulatory submission. The judgements here are the consultant's and should be confirmed through the organisation's formal process.")
      : "NCSC CAF 4.0 alignment and gap analysis. This is not a formal CAF assessment and not a regulatory submission. The judgements here are the consultant's, made against the CAF indicators of good practice and informed by operational technology context, and should be confirmed through the organisation's formal process.";
    var unitNoun = (disp.outcomesTitle === "Controls") ? "control" : "outcome";
    var profileProse = isBinary
      ? ("  - This assessment does not produce a single grade. Results are reported as a profile of " + stateSlash + " by objective and " + cafPrincipleNoun(instrument) + ".")
      : ("  - The CAF is outcome-based; there is no single grade. Results are reported as a profile of " + stateSlash + " by objective and principle.");
    var rows = [
      [styledCell("Read me", { headerColor: true })],
      [styledCell("Scope", { bold: true, fill: FILL.sub })],
      [scopeLine],
      [styledCell("Per " + unitNoun, { bold: true, fill: FILL.sub })],
      ["  - The consultant sets one state per " + unitNoun + ": " + stateOr + "."],
      ["  - Unknown is a coverage signal, not a state. Any " + unitNoun + " that could not be established is marked unknown, which lowers confidence but does not count as a failure."],
      ["  - N/A drops the " + unitNoun + " from both the score and the coverage denominator."],
      [styledCell("Profile", { bold: true, fill: FILL.sub })],
      ["  - Selected profile: " + info.name + (info.placeholder ? " (expected states are not available, so meeting and below counts are not reported)" : "")],
      ["  - Order for comparing actual vs expected: not < partially < achieved. Meeting = actual >= expected."],
      [profileProse],
      [styledCell("Working tracker", { bold: true, fill: FILL.sub })],
      ["  - The Outcomes register is filterable (autofilter) with the header row frozen."],
      ["  - Status is a dropdown: Open / In progress / Blocked / Done. Fill in Owner, Target date and Progress note to track remediation in this file after handover."],
      ["  - Relevant IEC 62443 guidance suggests related IEC 62443 requirements (3-3 SRs and 2-1:2024 SPRs), graded by strength, as a guide to remediation. They are not an authoritative equivalence."],
      [""],
      ["Instrument", instrument.title],
      ["Content version", instrument.contentVersion || ""],
      ["Edition", instrument.edition || ""]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 100 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    return ws;
  }

  // ---- program-maturity-ml (ISA/IEC 62443-2-1:2024) -------------------------

  function mlStateFill(mlState) {
    if (mlState === "ML4") return FILL.met;
    if (mlState === "ML3") return FILL.met;
    if (mlState === "ML2") return FILL.near;
    if (mlState === "ML1") return FILL.sub;
    if (mlState === "not-met") return FILL.gap;
    return FILL.na;
  }

  function mlFrontSheet(engagement, instrument, scored) {
    var e = engagement.engagement || {};
    var c = scored.overall.counts;
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [styledCell("Edition", { bold: true, fill: FILL.sub }), instrument.edition || ""],
      [styledCell("Saved at", { bold: true, fill: FILL.sub }), engagement.updatedAt || ""],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Client", { bold: true }), e.clientName],
      [styledCell("Site", { bold: true }), e.siteName],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date of visit", { bold: true }), e.dateOfVisit],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality],
      [],
      [styledCell("Program maturity profile (no single grade)", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Requirements at ML1 / ML2 / ML3 / ML4", { bold: true }), c.ML1 + " / " + c.ML2 + " / " + c.ML3 + " / " + c.ML4],
      [styledCell("Not met (floor findings)", { bold: true }), { v: c.notMet, s: c.notMet > 0 ? { fill: FILL.gap } : undefined }],
      [styledCell("Unknown", { bold: true }), c.unknown],
      [styledCell("Coverage", { bold: true }), window.App.ScoringProgramML.formatPct(scored.overall.coverage)],
      [styledCell("Confidence", { bold: true }), scored.overall.confidenceLevel || "-"],
      [styledCell("Mean ML (context only)", { bold: true }), window.App.ScoringProgramML.formatMean(scored.overall.meanMl)]
    ];
    if (scored.anyTargets) {
      rows.push([styledCell("Meeting target ML", { bold: true }), scored.overall.meeting + " / " + (scored.overall.meeting + scored.overall.below)]);
    }
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 38 }, { wch: 60 }];
    return ws;
  }

  function mlRequirementsSheet(scored, instrument) {
    var head = ["SPE", "Theme", "Code", "Title", "Achieved ML", "Target ML", "Meets / below", "State", "Evidence", "Notes"].concat(TRACKER_HEAD);
    var rows = [headerRow(head)];
    scored.perRequirement.forEach(function (it) {
      var meets = "-";
      if (it.hasTarget && it.scored) meets = it.meetsTarget ? "Meets" : "Below";
      var stateText = it.ml === null ? "unanswered" : it.mlLabel;
      rows.push([
        it.elementId,
        it.theme,
        it.code,
        it.title,
        { v: (it.ml && it.ml.indexOf("ML") === 0) ? it.ml : (it.isNotMet ? "Not met" : (it.isUnknown ? "Unknown" : (it.isNA ? "N/A" : ""))), s: { fill: mlStateFill(it.ml) } },
        it.hasTarget ? it.targetMl : "",
        meets,
        stateText,
        it.evidence || "",
        it.notes || "",
        "", "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 7 }, { wch: 8 }, { wch: 11 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 50 }, { wch: 40 }].concat(TRACKER_COLS);
    makeRegisterTracker(ws, head.length, rows.length);
    return ws;
  }

  function mlDistRow(g, codeKey) {
    var cc = g.counts;
    return [
      g[codeKey] + " " + g.name,
      { v: cc.notMet, s: cc.notMet > 0 ? { fill: FILL.gap } : undefined },
      cc.ML1,
      { v: cc.ML2, s: { fill: FILL.near } },
      { v: cc.ML3, s: { fill: FILL.met } },
      cc.ML4,
      cc.unknown,
      window.App.ScoringProgramML.formatMean(g.meanMl),
      window.App.ScoringProgramML.formatPct(g.coverage)
    ];
  }

  function mlByElementSheet(scored, instrument) {
    var withT = scored.anyTargets;
    var head = [window.App.Report.mlNoun(instrument, "elementNounTitle"), "Not met", "ML1", "ML2", "ML3", "ML4", "Unknown", "Mean ML", "Coverage"];
    if (withT) head.push("Meets / total");
    var rows = [
      [styledCell("Achieved-ML distribution by " + window.App.Report.mlNoun(instrument, "elementNounTitle"), { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    scored.byElement.forEach(function (el) {
      var r = mlDistRow(el, "elementId");
      if (withT) r.push(el.meeting + " / " + (el.meeting + el.below));
      rows.push(r);
    });
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!cols"] = [{ wch: 36 }].concat(Array(head.length - 1).fill({ wch: 11 }));
    return ws;
  }

  function mlByThemeSheet(scored) {
    var head = ["Theme", "Not met", "ML1", "ML2", "ML3", "ML4", "Unknown", "Mean ML", "Coverage"];
    var rows = [
      [styledCell("Achieved-ML distribution by theme", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    scored.byTheme.forEach(function (th) { rows.push(mlDistRow(th, "theme")); });
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!cols"] = [{ wch: 30 }].concat(Array(head.length - 1).fill({ wch: 11 }));
    return ws;
  }

  function mlRoadmapSheet(scored, instrument) {
    var head = ["Code", "Title", "SPE", "Achieved ML", "Target ML", "OT framing", "Captured evidence", "Business impact", "Recommended action", "Priority"].concat(TRACKER_HEAD);
    var rows = [
      [styledCell("Roadmap - " + (scored.anyTargets ? "requirements below target ML" : "not-met / ML1 requirements") + ", in the consultant's priority order.", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    (scored.roadmap || []).forEach(function (it, i) {
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      var bf = bandPriorityFill(it.priorityBand);
      var priText = "P" + (i + 1) + (nis2BandText(it.priorityBand) ? " (" + nis2BandText(it.priorityBand) + ")" : "");
      rows.push([
        it.code, it.title, it.elementId,
        { v: it.mlLabel, s: { fill: mlStateFill(it.ml) } },
        it.hasTarget ? it.targetMl : "-",
        lensFraming, it.evidence || "", it.impact || "", it.action || "",
        bf ? { v: priText, s: { fill: bf } } : priText,
        it.owner || "", "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 11 }, { wch: 40 }, { wch: 7 }, { wch: 12 }, { wch: 10 }, { wch: 45 }, { wch: 45 }, { wch: 28 }, { wch: 45 }, { wch: 14 }].concat(TRACKER_COLS);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    makeRoadmapTracker(ws, head.length, rows.length);
    return ws;
  }

  function mlReadmeSheet(instrument) {
    var rows = [
      [styledCell("Read me", { headerColor: true })],
      [styledCell("Scope", { bold: true, fill: FILL.sub })],
      [window.App.Report.standardRef(instrument) + " maturity assessment. Maturity levels are set per requirement by the consultant; results are an achieved-ML profile by Security Program Element and theme."],
      [styledCell("Per requirement", { bold: true, fill: FILL.sub })],
      ["  - One maturity level per requirement: ML1 Initial, ML2 Managed (documentation begins at ML2), ML3 Defined / Practiced, ML4 Improving. Levels apply independently per requirement."],
      ["  - Not met = not satisfied at any ML; treated as a floor finding (ranks below ML1)."],
      ["  - Unknown reduces coverage and confidence (not scored). N/A is excluded from score and coverage."],
      ["  - Optional target ML per requirement should derive from risk (62443-3-2), not a flat default. Where set, met/below is reported per requirement and per element."],
      [styledCell("Roll-up", { bold: true, fill: FILL.sub })],
      ["  - No single program grade. Mean ML per element is context only."],
      ["  - Requirements do not compensate for one another. A not-met or below-target requirement is reported as a floor finding and is never averaged away."],
      ["  - The coverage threshold and the Unknown confidence flag work the same way as in the posture assessment."],
      [styledCell("Working tracker", { bold: true, fill: FILL.sub })],
      ["  - The Requirements register is filterable (autofilter) with the header row frozen."],
      ["  - Status is a dropdown: Open / In progress / Blocked / Done. Fill in Owner, Target date and Progress note to track remediation in this file after handover."],
      [""],
      ["Instrument", instrument.title],
      ["Content version", instrument.contentVersion || ""],
      ["Edition", instrument.edition || ""]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 100 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    return ws;
  }

  // ---- risk appetite (risk-appetite-coherence) ---------------------------
  // A tracker for two characterisations and the fit between them. No score
  // column, no total row: there is nothing here that sums, and a spreadsheet
  // is exactly where a "total" would get invented if one were offered.
  function raFrontSheet(engagement, instrument, scored) {
    var e = engagement.engagement || {};
    var v = scored.verdict || {};
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Framework", { bold: true, fill: FILL.sub }), instrument.framework || ""],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [styledCell("Saved at", { bold: true, fill: FILL.sub }), engagement.updatedAt || ""],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Organisation", { bold: true }), e.clientName],
      [styledCell("Site / scope", { bold: true }), e.siteName],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date", { bold: true }), e.dateOfVisit],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality],
      [],
      [styledCell("Position (a characterisation, not a measurement)", { headerColor: true }), styledCell("", { headerColor: true })],
      // No "from" rows and no baseline comparison: which bands happened to
      // match a scaffold is internal, and printing it would tell the client
      // where the consultant agreed with a default rather than what they found.
      [styledCell("Inherent exposure", { bold: true }), scored.exposure.bandLabel || "not set"],
      [styledCell("  sector", {}), scored.exposure.sectorName || ""],
      // Both readings where the technical review differs, as in the Word headline.
      [styledCell("Apparent appetite", { bold: true }), window.App.Report.riskAppetiteHeadlineValue(scored)],
      [],
      [styledCell("Verdict", { bold: true }),
        { v: window.App.Report.riskAppetiteVerdictLabel(scored),
          s: v.key === "under-protected" ? { fill: FILL.gap } : undefined }],
      [styledCell("Appetite the exposure warrants", {}), v.warrantedBand || ""],
      [styledCell("Bands from the coherence line", {}), v.delta === null || v.delta === undefined ? "" : v.delta],
      [styledCell("", {}), v.explanation || ""]
    ];
    // The reasoning behind the verdict - not a note about what the tool
    // computed. This workbook goes to the client like the Word document does,
    // so it carries the consultant's judgement, not a diff against a default.
    if (v.overridden) {
      rows.push([styledCell("Assessor's reasoning", { bold: true }),
        v.rationale || { v: "not yet recorded", s: { fill: FILL.gap } }]);
    }
    if (scored.statedVsRevealed) {
      rows.push([]);
      rows.push([styledCell("Stated against revealed", { headerColor: true }), styledCell("", { headerColor: true })]);
      rows.push([styledCell("Stated appetite", { bold: true }), scored.statedVsRevealed.statedBand]);
      rows.push([styledCell("Revealed by technical layer", { bold: true }), scored.statedVsRevealed.revealedBand]);
      rows.push([styledCell("Gap", { bold: true }),
        { v: scored.statedVsRevealed.gap, s: scored.statedVsRevealed.material ? { fill: FILL.gap } : undefined }]);
      rows.push([styledCell("", {}), scored.statedVsRevealed.note]);
    }
    return aoaSheet(rows);
  }

  function raItemsSheet(scored, instrument, engagement) {
    var R = window.App.Report;
    var N = (R && R.riskAppetiteNarrative) ? R.riskAppetiteNarrative(null, instrument, engagement) : {};
    var rows = [[
      // No axis column: the section name already says which reading it is,
      // and the internal axis ids meant nothing to the client.
      styledCell("Section", { headerColor: true }),
      styledCell("Item", { headerColor: true }),
      styledCell("Title", { headerColor: true }),
      styledCell("Band", { headerColor: true }),
      // What the chosen band looks like for this item: the reader gets the
      // meaning of "open" for risk acceptance, not just the word.
      styledCell("What this band means here", { headerColor: true }),
      // Technical readings only: counted as appetite, or a managed constraint.
      styledCell("Treated as", { headerColor: true }),
      styledCell("Characterisation", { headerColor: true }),
      // What the reading rests on: interview, document or observation.
      styledCell("Evidence", { headerColor: true }),
      // "Question asked", not "interview prompt": this column is the record of
      // what was actually put to the organisation, which is useful to them.
      // Naming it after the tool's field would make it read as scaffolding.
      styledCell("Question asked", { headerColor: true })
    ]];
    (scored.sections || []).forEach(function (sec) {
      var isTech = sec.axis === "appetite-revealed";
      (sec.items || []).forEach(function (it) {
        var treated = (isTech && it.band && R && R.riskAppetiteTreatedAs) ? R.riskAppetiteTreatedAs(N, it) : "";
        if (isTech && it.notEstablished && R && R.riskAppetiteTreatedAs) treated = R.riskAppetiteTreatedAs(N, it);
        rows.push([sec.name, it.code, it.title, it.notEstablished ? "Not established" : (it.bandLabel || ""), it.anchor || "", treated,
                   it.characterisation || "", it.evidence || "", it.interviewPrompt || ""]);
      });
      rows.push([sec.name, "", styledCell("Section position", { bold: true }),
        styledCell(sec.bandLabel || "", { bold: true }), "assessor's position", "", "", "", ""]);
      rows.push([]);
    });
    return aoaSheet(rows);
  }

  // Change since the previous assessment, for risk appetite: the fit then and
  // now, and the items that moved, with no improved or regressed column.
  function raAppendProgressSheet(wb, progress, instrument, engagement, scored) {
    var R = window.App.Report;
    if (!progress || !progress.fit || !R || !R.riskAppetiteProgressText) return;
    var N = R.riskAppetiteNarrative(null, instrument, engagement);
    var slots = R.riskAppetiteSlots(scored, engagement);
    var pt = R.riskAppetiteProgressText(progress, N, slots);
    var fit = progress.fit;
    var rows = [];
    rows.push([styledCell(pt.heading, { bold: true, fill: FILL.sub })]);
    rows.push(["Baseline", progress.sourceLine || ""]);
    rows.push([]);
    rows.push(headerRow(["", "Previous", "Current"]));
    rows.push(["Verdict", fit.prev.verdictLabel || "", fit.curr.verdictLabel || ""]);
    rows.push(["Inherent exposure", fit.prev.exposureLabel || "", fit.curr.exposureLabel || ""]);
    rows.push(["Apparent appetite", fit.prev.appetiteLabel || "", fit.curr.appetiteLabel || ""]);
    rows.push([]);
    if (pt.direction) rows.push([pt.direction]);
    if (pt.moved) rows.push([pt.moved]);
    rows.push([]);
    var moves = (progress.movements || []).filter(function (m) { return m.change === "moved"; });
    if (moves.length) {
      rows.push(headerRow(["Ref", "Item", "Section", "Previous", "Current", "Moved"]));
      moves.forEach(function (m) { rows.push([m.code, m.label, m.group || "", m.prev, m.curr, m.direction || ""]); });
    }
    XLSX.utils.book_append_sheet(wb, aoaSheet(rows), "Change");
    moveSheetBeforeReadme(wb, "Change");
  }

  // The same standing text as the Word document, from the same narrative pack,
  // one paragraph per row so it wraps as prose rather than as broken lines.
  function raReadmeSheet(instrument, engagement) {
    var R = window.App.Report;
    var N = (R && R.riskAppetiteNarrative) ? R.riskAppetiteNarrative(null, instrument, engagement) : {};
    var B = N.boilerplate || {};
    var rows = [ [styledCell("How to read this workbook", { headerColor: true })], [] ];
    function para(text) { if (text) { rows.push([text]); rows.push([]); } }
    para(B.how_to_read);
    rows.push([styledCell("There is no score, percentage or grade in this workbook.", { bold: true })]);
    rows.push(["Adding one would turn a professional characterisation into a number that invites comparison between organisations, which it cannot support."]);
    rows.push([]);
    rows.push([styledCell(B.not_measurement_caveat_title || "A characterisation, not a measurement", { bold: true })]);
    para(B.not_measurement_caveat || (instrument.criticalCaveats || [])[0]);
    para(B.series_context);
    para(B.bands_source);
    var ws = aoaSheet(rows);
    // One wide, wrapping column: these are paragraphs, not a table.
    ws["!cols"] = [{ wch: 120 }];
    return ws;
  }

  // ---- EU NIS2 (nis2-conformance) ---------------------------------------

  function nis2StateFill(state) {
    if (state === "achieved")  return FILL.met;
    if (state === "partially") return FILL.near;
    if (state === "not")       return FILL.gap;
    return FILL.na;
  }
  function nis2StateText(state, instrument) {
    var L = window.App.ScoringNIS2.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "N/A";
    return "";
  }

  function nis2FrontSheet(engagement, instrument, scored) {
    var e = engagement.engagement || {};
    var c = scored.overall.counts;
    var N = window.App.ScoringNIS2;
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Framework", { bold: true, fill: FILL.sub }), instrument.framework || "Directive (EU) 2022/2555"],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [styledCell("Saved at", { bold: true, fill: FILL.sub }), engagement.updatedAt || ""],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Entity", { bold: true }), e.clientName],
      [styledCell("Site / scope", { bold: true }), e.siteName],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date", { bold: true }), e.dateOfVisit],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality],
      [],
      [styledCell("Conformance profile (not a compliance determination)", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Achieved / Partially / Not", { bold: true }), c.achieved + " / " + c.partially + " / " + c.not],
      [styledCell("Gaps (Partially + Not)", { bold: true }), { v: scored.overall.gaps, s: scored.overall.gaps > 0 ? { fill: FILL.gap } : undefined }],
      [styledCell("Unknown", { bold: true }), c.unknown],
      [styledCell("Coverage", { bold: true }), N.formatPct(scored.overall.coverage)],
      [styledCell("Confidence", { bold: true }), scored.overall.confidenceLevel || "-"],
      [styledCell("Conformance (context only, not a pass mark)", { bold: true }), N.formatPct(scored.overall.conformance)]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 40 }, { wch: 60 }];
    ws["!tabColor"] = "0A3D62";
    return ws;
  }

  // By area = live formulas (COUNTIFS against Obligations). Correct a State on
  // Obligations and these counts and the conformance % update automatically.
  // One source of truth (Obligations); everything here is derived.
  function nis2ByAreaSheet(scored, instrument) {
    var head = ["NIS2 area", "Article", "Achieved", "Partially", "Not", "Unknown", "N/A", "Applicable", "Conformance"];
    var rows = [
      [styledCell("Conformance profile by NIS2 area (live formulas derived from the Obligations sheet)", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    var lbl = {
      ach: nis2StateText("achieved", instrument), par: nis2StateText("partially", instrument),
      not: nis2StateText("not", instrument), unk: nis2StateText("unknown", instrument), na: nis2StateText("na", instrument)
    };
    function cif(area, label) {
      return 'COUNTIFS(Obligations!$A:$A,"' + area + '",Obligations!$E:$E,"' + label + '")';
    }
    scored.byCategory.forEach(function (g, i) {
      var R = 3 + i;   // Excel row: banner row 1, header row 2, data from row 3
      var a = g.categoryId;
      rows.push([
        g.categoryId + " " + g.name, g.article || "",
        { f: cif(a, lbl.ach), t: "n", s: { fill: FILL.met } },
        { f: cif(a, lbl.par), t: "n", s: { fill: FILL.near } },
        { f: cif(a, lbl.not), t: "n", s: { fill: FILL.gap } },
        { f: cif(a, lbl.unk), t: "n" },
        { f: cif(a, lbl.na),  t: "n" },
        { f: 'COUNTIF(Obligations!$A:$A,"' + a + '")-G' + R, t: "n" },
        { f: 'IF((C' + R + '+D' + R + '+E' + R + ')=0,"-",C' + R + '/(C' + R + '+D' + R + '+E' + R + '))', t: "n", s: { numFmt: "0%" } }
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!cols"] = [{ wch: 40 }, { wch: 14 }].concat(Array(head.length - 2).fill({ wch: 12 }));
    ws["!freeze"] = { xSplit: 0, ySplit: 2 };
    ws["!autofilter"] = { ref: "A2:I" + (2 + scored.byCategory.length) };
    ws["!tabColor"] = "0F5FA6";
    return ws;
  }

  // Obligations = the working register. Header frozen + autofilter on all
  // columns; State colour-coded; a Status dropdown + tracking columns turn it
  // into a maintainable remediation tracker. Column A=Area, E=State feed the
  // By area formulas, so keep that order stable.
  function nis2ItemsSheet(scored, instrument) {
    var head = ["Area", "Code", "Obligation", "Article", "State", "Applicable", "Relevant IEC 62443 guidance", "Evidence", "Notes", "Owner", "Status", "Target date", "Progress note"];
    var rows = [headerRow(head)];
    scored.perItem.forEach(function (it) {
      rows.push([
        it.categoryId, it.code || it.itemId, it.title, it.articleRef || "",
        { v: nis2StateText(it.state, instrument), s: { fill: nis2StateFill(it.state) } },
        it.isNA ? "No" : "Yes",
        nis2XrefCell(it),
        it.evidence || "", it.notes || "",
        it.owner || "", "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 8 }, { wch: 9 }, { wch: 46 }, { wch: 14 }, { wch: 20 }, { wch: 11 }, { wch: 40 }, { wch: 50 }, { wch: 34 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
    var n = scored.perItem.length;
    ws["!autofilter"] = { ref: "A1:M" + (1 + n) };
    ws["!tabColor"] = "2E7D52";
    var st = statusTracker(10, 2, 1 + n);   // Status column K (0-based index 10)
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    return ws;
  }

  function nis2BandText(b) {
    return b === "high" ? "High" : b === "medium" ? "Medium" : b === "low" ? "Low" : "";
  }
  function bandPriorityFill(b) {
    if (b === "high") return FILL.gap;
    if (b === "medium") return FILL.near;
    if (b === "low") return FILL.na;
    return null;
  }
  function nis2RoadmapSheet(scored, instrument) {
    var head = ["Priority", "Band", "Owner", "Code", "Obligation", "Area", "Article", "State", "Captured evidence", "Business impact", "Recommended action", "Relevant IEC 62443 guidance", "Status", "Target date", "Progress note"];
    var rows = [
      [styledCell("Gap roadmap: every Partially or Not Achieved obligation, in the consultant's priority order.", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    (scored.roadmap || []).forEach(function (it, i) {
      var bf = bandPriorityFill(it.priorityBand);
      rows.push([
        "P" + (i + 1),
        bf ? { v: nis2BandText(it.priorityBand), s: { fill: bf } } : nis2BandText(it.priorityBand),
        it.owner || "", it.code || it.itemId, it.title, it.categoryId, it.articleRef || "",
        { v: nis2StateText(it.state, instrument), s: { fill: nis2StateFill(it.state) } },
        it.evidence || "", it.impact || "", it.action || "",
        nis2XrefCell(it),
        "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 9 }, { wch: 10 }, { wch: 18 }, { wch: 9 }, { wch: 44 }, { wch: 8 }, { wch: 14 }, { wch: 20 }, { wch: 46 }, { wch: 34 }, { wch: 46 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!freeze"] = { xSplit: 0, ySplit: 2 };
    var n = (scored.roadmap || []).length;
    ws["!autofilter"] = { ref: "A2:O" + (2 + n) };
    ws["!tabColor"] = "B23A33";
    var st = statusTracker(12, 3, 2 + n);   // Status column M (0-based index 12), data from Excel row 3
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    return ws;
  }

  function nis2ReadmeSheet(instrument, scored) {
    // The quick gap check groups obligations by measure, and the IEC 62443
    // cross-references are held per obligation, so its guidance column is
    // empty. Describing the column as populated sent the reader looking for
    // suggestions that are not there.
    var anyXref = ((scored && scored.perItem) || []).some(function (it) { return nis2XrefCell(it) !== ""; });
    var xrefLine = anyXref
      ? "  - Relevant IEC 62443 guidance suggests related requirements in IEC 62443 (3-3 SRs and 2-1:2024 SPRs), grouped by strength (direct / partial / contextual), as a guide to remediation. They are not an authoritative equivalence."
      : "  - Relevant IEC 62443 guidance is left blank here. The related IEC 62443 requirements are mapped to individual NIS2 obligations, and this check groups the obligations by measure, so none is suggested at this level.";
    var rows = [
      [styledCell("Read me", { headerColor: true })],
      [styledCell("Scope", { bold: true, fill: FILL.sub })],
      ["EU NIS2 conformance and gap analysis against Directive (EU) 2022/2555 (Articles 20, 21 and 23). Each obligation is judged Achieved / Partially Achieved / Not Achieved by the consultant."],
      [styledCell("Not a compliance determination", { bold: true, fill: FILL.sub })],
      ["This is a readiness gap analysis. It is not a determination of legal compliance with NIS2 or with the national law that transposes it; confirm scope against the applicable national transposition."],
      [styledCell("Scoring", { bold: true, fill: FILL.sub })],
      ["  - Target is full conformance: every applicable obligation is expected to be Achieved. Gaps are every Partially or Not Achieved obligation."],
      ["  - Unknown reduces coverage and lowers confidence; Not applicable is excluded from score and coverage."],
      ["  - No single grade or pass mark. The conformance percentage is shown for context only."],
      [styledCell("Working tracker", { bold: true, fill: FILL.sub })],
      ["  - The Obligations and Gap roadmap sheets are filterable (autofilter) with the header row frozen."],
      ["  - By area counts and conformance % are live formulas derived from the Obligations sheet, so correcting a State there updates them."],
      ["  - Status is a dropdown: Open / In progress / Blocked / Done. Fill in Owner, Target date and Progress note to track remediation in this file after handover."],
      [xrefLine],
      [""],
      ["Instrument", instrument.title],
      ["Content version", instrument.contentVersion || ""]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 100 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    ws["!tabColor"] = "5A6B7B";
    return ws;
  }

  // ---- ISA/IEC 62443-2-1:2010 CSMS (csms-conformance) -----------------------

  var FILL_BLUE = { patternType: "solid", fgColor: { rgb: "DCE8F7" } };
  function csmsStateFill(state) {
    if (state === "in-place")     return FILL.met;
    if (state === "largely")      return FILL_BLUE;
    if (state === "partially")    return FILL.near;
    if (state === "not-in-place") return FILL.gap;
    return FILL.na;
  }

  // ---- EU CRA (layered conformance) workbook ----------------------------
  // Front (scope + caveats + interlock), one sheet per in-scope layer, a
  // combined gap roadmap, and a Read me. Three layers, never blended.
  function buildCRAWorkbook(wb, engagement, instrument, profile, opts) {
    var CRA = window.App.ScoringCRA;
    var setup = (opts && opts.craSetup) || null;
    var scoredAll = CRA.scoreEngagement(engagement, instrument, profile, setup);
    var target = engagement.targets[0];
    if (opts && opts.targetId) target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || target;
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;
    var e = engagement.engagement || {};
    // Regulation-specific strings from instrument.docx/display. Both eu-cra and
    // eu-machinery now supply their own pack; the CRA wording is kept as the
    // fallback so a future layered instrument still produces a sane workbook.
    var dpk = instrument.docx || {};
    var disp = instrument.display || {};
    var noun = dpk.noun || disp.productNoun || "product";
    var Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
    var confId = (instrument.interlockSpec && instrument.interlockSpec.conformityLayer) || "P3";

    function stateLabel(state) { return window.App.ScoringCSMS.stateLabelFor(state, profile) || "Not set"; }

    // Front sheet.
    var front = [];
    front.push([styledCell(instrument.title, { bold: true })]);
    front.push([styledCell(dpk.xlsxTitle || "EU Cyber Resilience Act: indicative gap assessment (not a conformity assessment or certification)", { fill: FILL.sub })]);
    front.push([]);
    var cls = scored.classification || {};
    front.push([styledCell("Client", { bold: true }), e.clientName || ""]);
    front.push([styledCell(Noun, { bold: true }), (target && target.name) || ""]);
    front.push([styledCell(Noun + " class", { bold: true }), cls.classLabel || "Default"]);
    front.push([styledCell("Matched category (aid)", { bold: true }), cls.categoryText || "(none)"]);
    front.push([styledCell("Conformity route (" + confId + ")", { bold: true }), cls.route || ""]);
    front.push([styledCell("Layers in scope", { bold: true }), (scored.layersInScope || []).join(", ")]);
    front.push([styledCell("Assessment date", { bold: true }), e.dateOfVisit || ""]);
    front.push([]);
    if (cls.misclassification) {
      front.push([styledCell("Finding: possible misclassification", { bold: true, fill: FILL.gap })]);
      front.push([cls.misclassificationNote || ""]);
      front.push([]);
    }
    front.push([styledCell("Positions (each layer scored independently, never blended)", { bold: true, fill: FILL.sub })]);
    front.push(headerRow(["Layer", "In place", "Partially", "Not in place", "Unknown", "N/A", "Applicable", "Conformance"]));
    (scored.layers || []).forEach(function (l) {
      var c = l.overall.counts;
      front.push([l.layerId + " " + l.name, c.inPlace, c.partially, c.notInPlace, c.unknown, c.na, l.overall.total, CRA.formatPct(l.overall.conformance)]);
    });
    front.push([]);
    if (scored.interlock && scored.interlock.triggered) {
      front.push([styledCell("Interlock flag", { bold: true, fill: FILL.gap })]);
      front.push([(scored.interlock.message || "") + " The conformity layer (" + confId + ") is in scope but " + (scored.interlock.missingLayers || []).join(" and ") + " is not."]);
      front.push([]);
    }
    front.push([styledCell("Critical caveats", { bold: true, fill: FILL.sub })]);
    (scored.criticalCaveats || []).forEach(function (c) { front.push(["- " + c]); });
    XLSX.utils.book_append_sheet(wb, aoaSheet(front), "Front");

    // One sheet per in-scope layer.
    (scored.layers || []).forEach(function (l) {
      var rows = [];
      rows.push([styledCell(l.layerId + " " + l.name, { bold: true })]);
      if (l.summary) rows.push([l.summary]);
      rows.push([]);
      rows.push(headerRow(["Ref", "Requirement", "Conformance", "Evidence", "Notes"]));
      (l.result.perItem || []).forEach(function (it) {
        rows.push([
          it.code, it.title,
          styledCell(stateLabel(it.state), { fill: csmsStateFill(it.state) }),
          it.evidence || "", it.notes || ""
        ]);
      });
      appendNamedSheet(wb, aoaSheet(rows), l.layerId, "Layer");
    });

    // Combined gap roadmap - same living-tracker layout as the other families
    // (banner + filterable header, status dropdown, tracking columns).
    if ((scored.roadmap || []).length) {
      var roadHead = ["Priority", "Band", "Owner", "Layer", "Code", "Requirement", "State", "Captured evidence", "Business impact", "Recommended action", "Status", "Target date", "Progress note"];
      var road = [
        [styledCell("Conformance gap roadmap: every Not in place or Partially in place requirement across the layers in scope, in the consultant's priority order.", { headerColor: true })].concat(Array(roadHead.length - 1).fill(styledCell("", { headerColor: true }))),
        headerRow(roadHead)
      ];
      scored.roadmap.forEach(function (it, i) {
        var bf = bandPriorityFill(it.priorityBand);
        road.push([
          "P" + (i + 1),
          bf ? { v: nis2BandText(it.priorityBand), s: { fill: bf } } : nis2BandText(it.priorityBand),
          it.owner || "", it.layerId || "", it.code, it.title,
          { v: stateLabel(it.state), s: { fill: csmsStateFill(it.state) } },
          it.evidence || "", it.impact || "", it.action || "",
          "", "", ""
        ]);
      });
      var roadWs = aoaSheet(road);
      roadWs["!cols"] = [{ wch: 9 }, { wch: 10 }, { wch: 18 }, { wch: 7 }, { wch: 10 }, { wch: 44 }, { wch: 16 }, { wch: 44 }, { wch: 34 }, { wch: 44 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
      roadWs["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: roadHead.length - 1 } }];
      roadWs["!freeze"] = { xSplit: 0, ySplit: 2 };
      var roadN = scored.roadmap.length;
      roadWs["!autofilter"] = { ref: "A2:M" + (2 + roadN) };
      roadWs["!tabColor"] = "B23A33";
      var roadSt = statusTracker(10, 3, 2 + roadN); // Status column K
      roadWs["!dataValidations"] = [roadSt.dv];
      roadWs["!condFormats"] = [roadSt.cf];
      XLSX.utils.book_append_sheet(wb, roadWs, "Gap roadmap");
    }

    // Read me.
    var readmeLines = dpk.xlsxReadMe || [
      "Three layers (P1 product, P2 vulnerability handling, P3 conformity) are each scored independently against the CRA and presented side by side. They are never blended into one CRA score.",
      "Out-of-scope layers are omitted entirely. This is an indicative assessment, not a conformity assessment or certification; no harmonised CRA standard is yet cited, so a 62443 certificate does not equal CRA conformity."
    ];
    var readme = [
      [styledCell(((disp.shortName ? "EU " + disp.shortName.replace(/^EU /, "") + " Regulation" : "EU CRA")) + " gap assessment: read me", { bold: true })],
      [readmeLines[0]],
      ["Each requirement is judged In place / Partially in place / Not in place, or Unknown / N/A. The conformance percentage is context only, not a pass mark."]
    ];
    readmeLines.slice(1).forEach(function (l) { readme.push([l]); });
    XLSX.utils.book_append_sheet(wb, aoaSheet(readme), "Read me");
    return wb;
  }

  function csmsFrontSheet(engagement, instrument, scored) {
    var e = engagement.engagement || {};
    var c = scored.overall.counts;
    var C = window.App.ScoringCSMS;
    var rows = [
      [styledCell(BRAND_LINE, { bold: true, color: "0A3D62", fill: FILL.sub }), styledCell("", { fill: FILL.sub })],
      [styledCell(instrument.title, { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Framework", { bold: true, fill: FILL.sub }), instrument.framework || "ISA/IEC 62443-2-1"],
      [styledCell("Edition", { bold: true, fill: FILL.sub }), instrument.edition || ""],
      [styledCell("Content version", { bold: true, fill: FILL.sub }), instrument.contentVersion || ""],
      [],
      [styledCell("Engagement", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("Organisation", { bold: true }), e.clientName],
      [styledCell("Site / scope", { bold: true }), e.siteName],
      [styledCell("Consultant", { bold: true }), e.consultant],
      [styledCell("Date", { bold: true }), e.dateOfVisit],
      [styledCell("Confidentiality", { bold: true }), e.confidentiality],
      [],
      [styledCell("Conformance profile (not a certification)", { headerColor: true }), styledCell("", { headerColor: true })],
      [styledCell("In place / Largely / Partially / Not in place", { bold: true }), c.inPlace + " / " + c.largely + " / " + c.partially + " / " + c.notInPlace],
      [styledCell("Gaps (Not in place + Partially)", { bold: true }), { v: scored.overall.gaps, s: scored.overall.gaps > 0 ? { fill: FILL.gap } : undefined }],
      [styledCell("Unknown", { bold: true }), c.unknown],
      [styledCell("Coverage", { bold: true }), C.formatPct(scored.overall.coverage)],
      [styledCell("Confidence", { bold: true }), scored.overall.confidenceLevel || "-"],
      [styledCell("Conformance index (context only)", { bold: true }), C.formatPct(scored.overall.conformance)]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 42 }, { wch: 60 }];
    ws["!tabColor"] = "0A3D62";
    return ws;
  }

  function csmsByAreaSheet(headLabel, areas) {
    var C = window.App.ScoringCSMS;
    var head = [headLabel, "In place", "Largely", "Partially", "Not in place", "Unknown", "N/A", "Applicable", "Conformance"];
    var rows = [
      [styledCell("Conformance profile by " + headLabel.toLowerCase(), { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    areas.forEach(function (g) {
      var c = g.counts;
      rows.push([
        g.name,
        { v: c.inPlace, s: { fill: FILL.met } },
        { v: c.largely, s: { fill: FILL_BLUE } },
        { v: c.partially, s: { fill: FILL.near } },
        { v: c.notInPlace, s: { fill: FILL.gap } },
        c.unknown, c.na, g.total,
        C.formatPct(g.conformance)
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!cols"] = [{ wch: 42 }].concat(Array(head.length - 1).fill({ wch: 12 }));
    ws["!freeze"] = { xSplit: 0, ySplit: 2 };
    ws["!autofilter"] = { ref: "A2:I" + (2 + areas.length) };
    ws["!tabColor"] = "0F5FA6";
    return ws;
  }

  function csmsElementsSheet(scored) {
    var head = ["Category", "Group", "Code", "Element", "State", "Applicable", "Evidence", "Notes", "Owner", "Status", "Target date", "Progress note"];
    var rows = [headerRow(head)];
    scored.perItem.forEach(function (it) {
      rows.push([
        it.categoryId, it.elementGroupId || "", it.code, it.title,
        { v: it.stateLabel || "", s: { fill: csmsStateFill(it.state) } },
        it.isNA ? "No" : "Yes",
        it.evidence || "", it.notes || "", it.owner || "", "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 46 }, { wch: 18 }, { wch: 11 }, { wch: 50 }, { wch: 34 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
    var n = scored.perItem.length;
    ws["!autofilter"] = { ref: "A1:L" + (1 + n) };
    ws["!tabColor"] = "2E7D52";
    var st = statusTracker(9, 2, 1 + n);   // Status column J (0-based index 9)
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    return ws;
  }

  function csmsRoadmapSheet(scored) {
    var head = ["Priority", "Band", "Owner", "Code", "Element", "Category", "Group", "State", "Captured evidence", "Business impact", "Recommended action", "Status", "Target date", "Progress note"];
    var rows = [
      [styledCell("Conformance gap roadmap: every Not in place or Partially in place element, Not-in-place first, in the consultant's priority order.", { headerColor: true })].concat(Array(head.length - 1).fill(styledCell("", { headerColor: true }))),
      headerRow(head)
    ];
    (scored.roadmap || []).forEach(function (it, i) {
      var bf = bandPriorityFill(it.priorityBand);
      rows.push([
        "P" + (i + 1),
        bf ? { v: nis2BandText(it.priorityBand), s: { fill: bf } } : nis2BandText(it.priorityBand),
        it.owner || "", it.code, it.title, it.categoryId, it.elementGroupId || "",
        { v: it.stateLabel || "", s: { fill: csmsStateFill(it.state) } },
        it.evidence || "", it.impact || "", it.action || "",
        "", "", ""
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 9 }, { wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 46 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 46 }, { wch: 34 }, { wch: 46 }, { wch: 14 }, { wch: 14 }, { wch: 34 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: head.length - 1 } }];
    ws["!freeze"] = { xSplit: 0, ySplit: 2 };
    var n = (scored.roadmap || []).length;
    ws["!autofilter"] = { ref: "A2:N" + (2 + n) };
    ws["!tabColor"] = "B23A33";
    var st = statusTracker(11, 3, 2 + n);   // Status column L (0-based index 11), data from Excel row 3
    ws["!dataValidations"] = [st.dv];
    ws["!condFormats"] = [st.cf];
    return ws;
  }

  function csmsReadmeSheet(instrument) {
    var rows = [
      [styledCell("Read me", { headerColor: true })],
      [styledCell("Scope", { bold: true, fill: FILL.sub })],
      ["ISA/IEC 62443-2-1:2010 CSMS conformance and gap analysis. Each element is judged Not in place / Partially in place / Largely in place / In place by the consultant. It is not a certification. The 2024 edition is assessed separately, as a maturity assessment."],
      [styledCell("Sheets", { bold: true, fill: FILL.sub })],
      ["Front: engagement and conformance summary."],
      ["By category / By group: conformance profile (counts at each state, with a context-only conformance index)."],
      ["Elements: the working register; State is colour-coded; Status has a dropdown (Open / In progress / Blocked / Done) and tracking columns to manage remediation."],
      ["Gap roadmap: every Not in place or Partially in place element with owner, business impact and recommended action."],
      [styledCell("Notes", { bold: true, fill: FILL.sub })],
      ["No single CSMS grade is produced. The conformance index is for context only. Unknown reduces coverage and lowers confidence; Not applicable elements are excluded. A Not-in-place element is a floor finding."]
    ];
    var ws = aoaSheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 100 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    ws["!tabColor"] = "5A6B7B";
    return ws;
  }

  // ---- shared cross-reference table (IEC 62443 etc.) --------------------
  // Read related references for an obligation/outcome from the shared mapping
  // table (data/shared/cross-references.json). Returns a display string of the
  // 62443 controls, or "" when no mapping exists. Never invents mappings.
  // Relevant IEC 62443 remediation guidance for an obligation/outcome, grouped
  // by strength (direct first, then partial, then contextual) so weaker links
  // read as weaker. Each ref keeps its strongest strength if it appears twice.
  // Draft mappings - guidance only, never authoritative equivalence.
  function crossRef62443(fromStandard, fromId) {
    var tbl = window.App.Data && window.App.Data.shared && window.App.Data.shared.crossReferences;
    var rows = !tbl ? [] : (Array.isArray(tbl) ? tbl : (tbl.rows || []));
    if (!rows.length) return "";
    var rank = { direct: 0, partial: 1, contextual: 2 };
    var idStrength = {}, order = [];
    rows.forEach(function (row) {
      if (row.fromStandard !== fromStandard || row.fromId !== fromId) return;
      if (row.relationship === "informative-reference") return;   // surfaced separately
      var ids = Array.isArray(row.toIds) ? row.toIds : (row.toIds ? [row.toIds] : []);
      var s = rank[row.strength] != null ? row.strength : "partial";
      ids.forEach(function (id) {
        if (idStrength[id] === undefined) { idStrength[id] = s; order.push(id); }
        else if (rank[s] < rank[idStrength[id]]) idStrength[id] = s;
      });
    });
    if (!order.length) return "";
    var groups = { direct: [], partial: [], contextual: [] };
    order.forEach(function (id) { groups[idStrength[id]].push(id); });
    var parts = [];
    ["direct", "partial", "contextual"].forEach(function (s) {
      if (groups[s].length) parts.push(cap(s) + ": " + groups[s].join(", "));
    });
    return parts.join("   ");
  }

  // Regulator-published informative references (e.g. CAF for Aviation principles
  // cite 62443 parts in CAP1850 Annex B) - distinct from the remediation mappings.
  var XREF_NAMES = {
    "iec-62443-2-1-2024": "ISA/IEC 62443-2-1:2024", "iec-62443-2-1-2010": "ISA/IEC 62443-2-1:2010",
    "iec-62443-3-3": "ISA/IEC 62443-3-3", "iec-62443-4-1": "ISA/IEC 62443-4-1", "iec-62443-4-2": "ISA/IEC 62443-4-2"
  };
  function informativeRefsX(fromStandard, fromId) {
    var tbl = window.App.Data && window.App.Data.shared && window.App.Data.shared.crossReferences;
    var rows = !tbl ? [] : (Array.isArray(tbl) ? tbl : (tbl.rows || []));
    var seen = {}, out = [];
    rows.forEach(function (row) {
      if (row.relationship !== "informative-reference") return;
      if (row.fromStandard !== fromStandard || row.fromId !== fromId) return;
      var ids = Array.isArray(row.toIds) ? row.toIds : (row.toIds ? [row.toIds] : []);
      ids.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(XREF_NAMES[id] || id); } });
    });
    return out.join(", ");
  }
  // CAF cross-reference cell: consultant remediation mappings for the outcome, or
  // (for instruments like aviation that have none) the principle's regulator-
  // published informative references, clearly labelled.
  function cafXrefCell(instrumentId, it) {
    var rem = crossRef62443(instrumentId, it.outcomeId);
    if (rem) return rem;
    var inf = informativeRefsX(instrumentId, it.principleId);
    return inf ? ("CAP1850 Annex B: " + inf) : "";
  }
  // NIS2 cross-reference cell. The shared table keys NIS2 rows by the
  // obligation's CODE ("GOV.1", "A.1"), the form every output prints, not by
  // its item id ("MA.1"), so looking up the id found nothing for the measures.
  // The quick gap check's codes ("A", "REP") are whole-measure groupings that
  // no row maps, so they stay blank rather than borrowing a sub-obligation's
  // mapping. An item without a code falls back to its id, the same key the
  // Word roadmap uses, so the two outputs never disagree.
  function nis2XrefCell(it) {
    var key = it && (it.code || it.itemId);
    return key ? crossRef62443("nis2", key) : "";
  }

  // Status tracker column: a Open/In progress/Blocked/Done dropdown plus
  // conditional colouring. Returns {dv, cf} attached to the worksheet and
  // rendered by ExcelJS. colIdx is 0-based; rows are 1-based inclusive.
  var STATUS_VALUES = "Open,In progress,Blocked,Done";
  function statusTracker(colIdx, firstRow, lastRow) {
    var L = XLSX.utils.encode_col(colIdx);
    var range = L + firstRow + ":" + L + Math.max(firstRow, lastRow);
    function rule(text, argb, pr) {
      return { type: "cellIs", operator: "equal", formulae: ['"' + text + '"'], priority: pr,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: argb } } } };
    }
    return {
      dv: { sqref: range, type: "list", allowBlank: true, formulae: ['"' + STATUS_VALUES + '"'] },
      cf: { ref: range, rules: [
        rule("Done", "FFE5F1EA", 1),
        rule("In progress", "FFF7EFD9", 2),
        rule("Blocked", "FFF3DEDC", 3),
        rule("Open", "FFECEFF2", 4)
      ] }
    };
  }

  // ---- ExcelJS render layer --------------------------------------------
  // The sheet builders produce SheetJS worksheets (values + .s styles +
  // !cols/!merges/!freeze, plus optional !autofilter / !tabColor /
  // !dataValidations / !condFormats). This renders that workbook through
  // ExcelJS, which (unlike the SheetJS build) can emit autofilter,
  // data-validation dropdowns, conditional formatting and tab colours.
  function toArgb(rgb) { return rgb ? ("FF" + String(rgb).replace(/^#/, "").toUpperCase()) : undefined; }

  function ejsStyle(s) {
    if (!s) return null;
    var out = {};
    if (s.font) {
      out.font = {};
      if (s.font.bold) out.font.bold = true;
      if (s.font.italic) out.font.italic = true;
      if (s.font.sz) out.font.size = s.font.sz;
      if (s.font.color && s.font.color.rgb) out.font.color = { argb: toArgb(s.font.color.rgb) };
    }
    if (s.fill && s.fill.fgColor && s.fill.fgColor.rgb) {
      out.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(s.fill.fgColor.rgb) } };
    }
    if (s.alignment) {
      out.alignment = {};
      if (s.alignment.horizontal) out.alignment.horizontal = s.alignment.horizontal;
      if (s.alignment.vertical) out.alignment.vertical = s.alignment.vertical;
      if (s.alignment.wrapText) out.alignment.wrapText = true;
    }
    if (s.border) {
      out.border = {};
      ["top", "bottom", "left", "right"].forEach(function (side) {
        var b = s.border[side];
        if (b) out.border[side] = { style: b.style || "thin", color: { argb: toArgb((b.color && b.color.rgb) || "C8D2DD") } };
      });
    }
    if (s.numFmt) out.numFmt = s.numFmt;
    return out;
  }

  function workbookToExcelJS(wb) {
    var ejs = new window.ExcelJS.Workbook();
    ejs.creator = "OT Cyber Assessment Tool";
    // Recalculate formulas (e.g. the By area COUNTIFS) when the file is opened.
    ejs.calcProperties = ejs.calcProperties || {};
    ejs.calcProperties.fullCalcOnLoad = true;
    (wb.SheetNames || []).forEach(function (name) {
      var ws = wb.Sheets[name];
      if (!ws) return;
      var addOpts = {};
      if (ws["!tabColor"]) addOpts.properties = { tabColor: { argb: toArgb(ws["!tabColor"]) } };
      var fr = ws["!freeze"];
      if (fr && (fr.ySplit || fr.xSplit)) addOpts.views = [{ state: "frozen", xSplit: fr.xSplit || 0, ySplit: fr.ySplit || 0 }];
      var sheet = ejs.addWorksheet(name, addOpts);

      if (ws["!ref"]) {
        var range = XLSX.utils.decode_range(ws["!ref"]);
        for (var r = range.s.r; r <= range.e.r; r++) {
          for (var c = range.s.c; c <= range.e.c; c++) {
            var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
            if (!cell) continue;
            var ec = sheet.getCell(r + 1, c + 1);
            if (cell.f) ec.value = { formula: String(cell.f) };
            else if (cell.v !== undefined && cell.v !== null) ec.value = cell.v;
            var st = ejsStyle(cell.s);
            if (st) {
              if (st.font) ec.font = st.font;
              if (st.fill) ec.fill = st.fill;
              if (st.alignment) ec.alignment = st.alignment;
              if (st.border) ec.border = st.border;
              if (st.numFmt) ec.numFmt = st.numFmt;
            }
          }
        }
      }

      (ws["!cols"] || []).forEach(function (col, i) { if (col && col.wch) sheet.getColumn(i + 1).width = col.wch; });
      (ws["!merges"] || []).forEach(function (m) {
        try { sheet.mergeCells(m.s.r + 1, m.s.c + 1, m.e.r + 1, m.e.c + 1); } catch (e) {}
      });
      if (ws["!autofilter"] && ws["!autofilter"].ref) sheet.autoFilter = ws["!autofilter"].ref;

      (ws["!dataValidations"] || []).forEach(function (dv) {
        var rng = XLSX.utils.decode_range(dv.sqref);
        for (var rr = rng.s.r; rr <= rng.e.r; rr++) {
          for (var cc = rng.s.c; cc <= rng.e.c; cc++) {
            sheet.getCell(rr + 1, cc + 1).dataValidation = {
              type: dv.type || "list", allowBlank: dv.allowBlank !== false, formulae: dv.formulae || []
            };
          }
        }
      });
      (ws["!condFormats"] || []).forEach(function (cf) {
        try { sheet.addConditionalFormatting({ ref: cf.ref, rules: cf.rules }); } catch (e) {}
      });
    });
    return ejs;
  }

  // ---- Progress since previous assessment (family-generic) ---------------
  // Rendered from the flat payload assembled in ui.js from App.Compare (the
  // consultant-loaded baseline diffed against today's responses). No scoring
  // logic here; every family shares this sheet.
  // `scope` is set when the workbook covers several sites or suppliers (the
  // posture and supplier workbooks report every one) while the comparison is
  // made for one of them only; the sheet then names that one, or it reads as
  // if it covered them all.
  function progressSheet(p, scope) {
    var s = p.summary || {};
    var CHANGE = { improved: "Improved", regressed: "Regressed" };
    var rows = [];
    rows.push([styledCell("Progress since previous assessment", { bold: true, fill: FILL.sub })]);
    rows.push(["Baseline", p.sourceLine || ""]);
    if (p.baselineTargetName && p.targetName && p.baselineTargetName !== p.targetName) {
      rows.push(["Compared", p.baselineTargetName + "  vs  " + p.targetName]);
    } else if (scope && p.targetName) {
      rows.push([scope.noun, p.targetName]);
    }
    if (scope && p.targetName) {
      rows.push(["Note", "This comparison covers " + p.targetName + " only. The other " + scope.nounP.toLowerCase() + " in this workbook are not compared here."]);
    }
    if (p.versionMismatch) {
      rows.push(["Note", "Baseline scored against content version " + p.baselineContentVersion + "; current version is " + p.currentContentVersion + ". Renamed or removed items compare as not assessed."]);
    }
    rows.push([]);
    rows.push(["Improved", s.improved || 0]);
    rows.push(["Regressed", s.regressed || 0]);
    rows.push(["Unchanged", s.unchanged || 0]);
    rows.push(["Newly assessed", s.newlyAssessed || 0]);
    rows.push(["No longer assessed", s.noLongerAssessed || 0]);
    if (p.gaps) rows.push(["Open gaps", p.gaps.prev + "  ->  " + p.gaps.curr]);
    rows.push([]);
    var moves = p.movements || [];
    if (moves.length === 0) {
      rows.push(["No scored item moved in either direction."]);
    } else {
      rows.push(headerRow(["Ref", "Item", "Area", "Previous", "Current", "Change"]));
      moves.forEach(function (m) {
        rows.push([
          m.code, m.label, m.group || "", m.prev, m.curr,
          styledCell(CHANGE[m.change] || m.change, { fill: m.change === "improved" ? FILL.met : FILL.gap, border: true })
        ]);
      });
    }
    var ab = p.aboveBaseline || [];
    if (ab.length > 0) {
      rows.push([]);
      rows.push([styledCell("Implemented beyond the requirement", { bold: true, fill: FILL.sub })]);
      rows.push([ab.length + " control" + (ab.length === 1 ? "" : "s") + " implemented beyond the selected profile" + (p.aboveBaselineNew ? ", " + p.aboveBaselineNew + " added since the previous assessment" : "") + ". These do not affect the score."]);
      rows.push(headerRow(["Ref", "Control", "Area", "State", "Since baseline"]));
      ab.forEach(function (a) {
        rows.push([
          a.code, a.label, a.group || "",
          styledCell(a.state, { fill: FILL.met, border: true }),
          a.isNew ? styledCell("New", { fill: FILL.met, border: true }) : "Maintained"
        ]);
      });
    }
    rows.push([]);
    rows.push(["The previous responses are re-scored against the current instrument content and targets so both visits are compared on the same yardstick."]);
    return aoaSheet(rows);
  }

  // Move an already-appended sheet to sit immediately before "Read me" (or to
  // the end if there is no Read me sheet), so late-appended generic sheets land
  // in the appendix area rather than after the instructions.
  function moveSheetBeforeReadme(wb, name) {
    var names = wb.SheetNames;
    var si = names.indexOf(name);
    if (si === -1) return;
    names.splice(si, 1);
    var ri = names.indexOf("Read me");
    if (ri === -1) names.push(name);
    else names.splice(ri, 0, name);
  }

  // Every family's buildCore branch returns early, so the progress sheet is
  // appended once here and slotted in front of Read me.
  function appendProgressSheet(wb, progress, engagement, instrument) {
    if (!progress) return;
    // Only the domain-letter workbook spans every target; the other families
    // build one workbook per target, which already says whose it is.
    var scope = null;
    if (instrument && instrument.scoringFamily === "domain-letter" &&
        engagement && (engagement.targets || []).length > 1) {
      var nouns = targetNouns(instrument);
      scope = { noun: nouns.one, nounP: nouns.many };
    }
    XLSX.utils.book_append_sheet(wb, progressSheet(progress, scope), "Progress");
    moveSheetBeforeReadme(wb, "Progress");
  }

  // Basis of assessment (evidence register): interviews, documents and systems
  // observed. Project-level, family-generic; appended for every instrument
  // whenever any row has content.
  function basisSheet(basis) {
    function nonEmpty(rows, keys) {
      return (rows || []).filter(function (r) {
        return keys.some(function (k) { return r[k] && String(r[k]).trim() !== ""; });
      });
    }
    var interviews   = nonEmpty(basis.interviews, ["name", "role", "date"]);
    var documents    = nonEmpty(basis.documents, ["title", "reference", "date"]);
    var observations = nonEmpty(basis.observations, ["name", "method"]);

    var rows = [];
    rows.push([styledCell("Basis of assessment", { bold: true, fill: FILL.sub })]);
    rows.push(["The findings and verdicts in this workbook rest on the interviews, documents and system observations below."]);
    rows.push([]);
    rows.push([styledCell("People interviewed", { bold: true })]);
    if (interviews.length) {
      rows.push(headerRow(["Name", "Role", "Date"]));
      interviews.forEach(function (r) { rows.push([r.name || "", r.role || "", r.date || ""]); });
    } else { rows.push(["None recorded."]); }
    rows.push([]);
    rows.push([styledCell("Documents reviewed", { bold: true })]);
    if (documents.length) {
      rows.push(headerRow(["Title", "Reference / version", "Date"]));
      documents.forEach(function (r) { rows.push([r.title || "", r.reference || "", r.date || ""]); });
    } else { rows.push(["None recorded."]); }
    rows.push([]);
    rows.push([styledCell("Systems observed", { bold: true })]);
    if (observations.length) {
      rows.push(headerRow(["System / environment", "How observed"]));
      observations.forEach(function (r) { rows.push([r.name || "", r.method || ""]); });
    } else { rows.push(["None recorded."]); }
    return aoaSheet(rows);
  }

  function appendBasisSheet(wb, engagement) {
    var basis = engagement.basisOfAssessment || (engagement.engagement && engagement.engagement.basisOfAssessment) || null;
    if (!basis) return;
    function has(rows, keys) {
      return (rows || []).some(function (r) { return keys.some(function (k) { return r[k] && String(r[k]).trim() !== ""; }); });
    }
    if (!has(basis.interviews, ["name", "role", "date"]) &&
        !has(basis.documents, ["title", "reference", "date"]) &&
        !has(basis.observations, ["name", "method"])) return;
    XLSX.utils.book_append_sheet(wb, basisSheet(basis), "Basis");
    moveSheetBeforeReadme(wb, "Basis");
  }

  // ---- organisation-wide workbook across sites ----------------------------
  //
  // The workbook twin of the organisation-wide Word document: each requirement
  // at its weakest site, the sites that set it named, and the sites that never
  // assessed it listed rather than counted as met. A different workbook from
  // the per-site ones, not a merge of them - the evidence, actions and owners
  // stay in each site's own workbook.
  function buildOrgWideWorkbook(wb, engagement, instrument, taxonomy, profile, opts) {
    var C = window.App.Compare;
    // Sites are ASSESSMENTS; the caller supplies the set, because a workbook is
    // built from one assessment's engagement and cannot see its siblings.
    var entries = (opts && opts.siteEntries) || [{
      id: "current",
      name: ((engagement.engagement || {}).siteName) || "This site",
      responses: engagement.responses || []
    }];
    var roll = C.rollUpSites({
      instrument: instrument, taxonomy: taxonomy, profile: profile,
      family: instrument.scoringFamily,
      entries: entries
    });
    var e = engagement.engagement || {};
    // The short noun, not the raw label: "Dutyholder / site" and
    // "Organisation (leadership / governance posture)" read as
    // "dutyholders / sites" and "organisations" here.
    var nouns = targetNouns(instrument);
    var noun = nouns.one;
    var nounP = nouns.many;
    var s = roll.summary;

    // Front.
    var front = [
      [styledCell(instrument.title, { bold: true })],
      [styledCell("Organisation-wide position across " + roll.siteCount + " " + nounP.toLowerCase(), { fill: FILL.sub })],
      [],
      [styledCell("Client", { bold: true }), e.clientName || ""],
      [styledCell(nounP, { bold: true }), roll.siteNames.join(", ")],
      [styledCell("Consultant", { bold: true }), e.consultant || ""],
      [styledCell("Date of visit", { bold: true }), e.dateOfVisit || ""],
      [],
      [styledCell("Requirements compared", { bold: true }), s.compared],
      [styledCell("Same at every " + noun.toLowerCase(), { bold: true }), s.uniform],
      [styledCell("Differing between " + nounP.toLowerCase(), { bold: true }), s.differing],
      [styledCell("Not assessed everywhere", { bold: true }), s.withUnscoredSites],
      [],
      [styledCell("Rule: the organisation-wide result for a requirement is the result at its weakest " +
        noun.toLowerCase() + ". No averaging, majority or compensation between " + nounP.toLowerCase() +
        "; a strong " + noun.toLowerCase() + " never offsets a weak one.", { fill: FILL.sub })]
    ];
    XLSX.utils.book_append_sheet(wb, aoaSheet(front), "Front");

    // The roll-up itself: every requirement compared, differing ones first.
    var ordered = roll.divergent.concat(roll.items.filter(function (i) {
      return i.orgValue && !i.differs;
    }));
    var rows = [headerRow(["Requirement", "Title", "Group", "Organisation-wide",
                           nounP + " setting it", "Differs between " + nounP.toLowerCase(),
                           "Not assessed at"])];
    ordered.forEach(function (it) {
      rows.push([
        styledCell(it.code || it.id, { border: true }),
        styledCell(it.label || "", { border: true }),
        styledCell(it.groupName || "", { border: true }),
        styledCell(it.orgValue ? it.orgValue.label : "", { border: true, bold: it.differs, fill: it.differs ? FILL.gap : undefined }),
        styledCell(it.worstSites.join(", "), { border: true }),
        styledCell(it.differs ? "Yes" : "No", { border: true }),
        styledCell(it.unscoredSites.join(", "), { border: true, fill: it.unscoredSites.length ? FILL.na : undefined })
      ]);
    });
    var ws = aoaSheet(rows);
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 6, r: rows.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, "Organisation-wide");

    // Where each site stands.
    var perRows = [headerRow([noun, "Requirements where weakest", "Requirements not assessed here"])];
    roll.siteNames.forEach(function (nm) {
      perRows.push([
        styledCell(nm, { border: true }),
        styledCell(roll.items.filter(function (i) { return i.differs && i.worstSites.indexOf(nm) !== -1; }).length, { border: true }),
        styledCell(roll.items.filter(function (i) { return i.unscoredSites.indexOf(nm) !== -1; }).length, { border: true })
      ]);
    });
    // A fixed tab name. Built from the label it was "Dutyholder / sites side by
    // side", which Excel refuses (a slash, and over 31 characters), so the
    // organisation-wide export failed outright for five instruments.
    appendNamedSheet(wb, aoaSheet(perRows), "Side by side", "Side by side");

    // Read me.
    var readme = [
      [styledCell("Organisation-wide roll-up: read me", { bold: true })],
      [""],
      ["Each " + noun.toLowerCase() + " is assessed separately. The organisation-wide result for a requirement is the result at the weakest " + noun.toLowerCase() + " that was assessed."],
      ["No averaging, majority or compensation is applied between " + nounP.toLowerCase() + ". Averaging would report a comfortable figure for an organisation carrying a serious gap at one " + noun.toLowerCase() + "."],
      ["A requirement not assessed at a " + noun.toLowerCase() + " is listed under 'Not assessed at' and is never treated as met. Unknown answers reduce confidence the same way."],
      ["This workbook is the cross-" + noun.toLowerCase() + " picture only. Evidence, recommended actions and owners are recorded per " + noun.toLowerCase() + " and appear in each " + noun.toLowerCase() + "'s own workbook."],
      [""],
      ["Indicative assessment. It is not a certification or a statement of conformance."]
    ];
    XLSX.utils.book_append_sheet(wb, aoaSheet(readme), "Read me");
    return wb;
  }

  // The publisher's attribution, verbatim. Several instruments reproduce
  // framework text word for word (CAF, NIST, CIS, SyAPs) under a licence
  // that asks for the attribution to travel with it, and the workbook prints
  // that text in its registers. The instrument carries the attribution as a
  // string or as an object of strings; either way it is copied as written.
  // The screen report's reader is used so both print the same lines in the
  // same order (an object's `text` first); the copy below only runs if the
  // report module is absent, and keeps that order.
  function attributionLines(instrument) {
    var R = window.App.Report;
    if (R && typeof R.attributionLines === "function") return R.attributionLines(instrument);
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

  // Appended at the foot of whichever Read me the family built, so every
  // workbook shape (per site, organisation-wide) carries it. An instrument
  // without an attribution gets no heading at all.
  function appendAttribution(wb, instrument) {
    var lines = attributionLines(instrument);
    var ws = wb.Sheets && wb.Sheets["Read me"];
    if (!lines.length || !ws) return;
    var rows = [[""], [styledCell("Attribution", { bold: true, fill: FILL.sub })]];
    lines.forEach(function (l) { rows.push([l]); });
    XLSX.utils.sheet_add_aoa(ws, rows, { origin: -1 });
  }

  function build(engagement, instrument, taxonomy, profile, opts) {
    var wb = buildCore(engagement, instrument, taxonomy, profile, opts);
    appendAttribution(wb, instrument);
    // The risk appetite workbook adds its own basis sheet and its own change
    // sheet (the generic one reports improved and regressed). Adding the shared
    // ones as well put a second "Basis" sheet in the book, which throws as soon
    // as the evidence register has anything in it.
    if (instrument && instrument.scoringFamily === "risk-appetite-coherence" && !(opts && opts.orgWide)) return wb;
    appendBasisSheet(wb, engagement);
    appendProgressSheet(wb, opts && opts.progress, engagement, instrument);
    return wb;
  }

  function buildCore(engagement, instrument, taxonomy, profile, opts) {
    var wb = XLSX.utils.book_new();

    // The organisation-wide workbook is its own shape across every selected
    // site, so it is dispatched before any per-family per-site build.
    if (opts && opts.orgWide) {
      return buildOrgWideWorkbook(wb, engagement, instrument, taxonomy, profile, opts);
    }

    if (instrument.scoringFamily === "nis2-conformance") {
      var scoredAllN = window.App.ScoringNIS2.scoreEngagement(engagement, instrument, profile);
      var targetN = engagement.targets[0];
      if (opts && opts.targetId) targetN = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || targetN;
      var scoredN = scoredAllN.perTarget.filter(function (t) { return t.target.id === targetN.id; })[0].result;
      XLSX.utils.book_append_sheet(wb, nis2FrontSheet(engagement, instrument, scoredN), "Front");
      XLSX.utils.book_append_sheet(wb, nis2ByAreaSheet(scoredN, instrument), "By area");
      XLSX.utils.book_append_sheet(wb, nis2ItemsSheet(scoredN, instrument), "Obligations");
      if (scoredN.roadmap && scoredN.roadmap.length > 0) XLSX.utils.book_append_sheet(wb, nis2RoadmapSheet(scoredN, instrument), "Gap roadmap");
      XLSX.utils.book_append_sheet(wb, nis2ReadmeSheet(instrument, scoredN), "Read me");
      return wb;
    }

    if (instrument.scoringFamily === "risk-appetite-coherence") {
      var RA = window.App.ScoringRiskAppetite;
      var setupR = (opts && opts.riskAppetiteSetup) || RA.defaultSetup(instrument);
      var targetR = engagement.targets[0];
      if (opts && opts.targetId) targetR = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || targetR;
      var respR = (engagement.responses || []).filter(function (r) { return r.targetId === targetR.id; });
      var scoredR = RA.scoreSite(instrument, profile, respR, setupR);
      XLSX.utils.book_append_sheet(wb, raFrontSheet(engagement, instrument, scoredR), "Front");
      XLSX.utils.book_append_sheet(wb, raItemsSheet(scoredR, instrument, engagement), "Characterisation");
      XLSX.utils.book_append_sheet(wb, raReadmeSheet(instrument, engagement), "Read me");
      appendBasisSheet(wb, engagement);
      // Not the generic Progress sheet: that one reports improved and regressed.
      raAppendProgressSheet(wb, opts && opts.progress, instrument, engagement, scoredR);
      return wb;
    }

    if (instrument.scoringFamily === "csms-conformance" && window.App.ScoringCRA && window.App.ScoringCRA.isCRA(instrument)) {
      return buildCRAWorkbook(wb, engagement, instrument, profile, opts);
    }

    if (instrument.scoringFamily === "csms-conformance") {
      var scoredAllC = window.App.ScoringCSMS.scoreEngagement(engagement, instrument, profile);
      var targetC = engagement.targets[0];
      if (opts && opts.targetId) targetC = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || targetC;
      var scoredC = scoredAllC.perTarget.filter(function (t) { return t.target.id === targetC.id; })[0].result;
      XLSX.utils.book_append_sheet(wb, csmsFrontSheet(engagement, instrument, scoredC), "Front");
      XLSX.utils.book_append_sheet(wb, csmsByAreaSheet("Category", scoredC.byCategory), "By category");
      if (scoredC.byGroup && scoredC.byGroup.length) XLSX.utils.book_append_sheet(wb, csmsByAreaSheet("Element group", scoredC.byGroup), "By group");
      XLSX.utils.book_append_sheet(wb, csmsElementsSheet(scoredC), "Elements");
      if (scoredC.roadmap && scoredC.roadmap.length > 0) XLSX.utils.book_append_sheet(wb, csmsRoadmapSheet(scoredC), "Gap roadmap");
      XLSX.utils.book_append_sheet(wb, csmsReadmeSheet(instrument), "Read me");
      return wb;
    }

    if (instrument.scoringFamily === "caf-achieved") {
      var info = cafProfileInfoFromOpts(opts);
      var overlay = (opts && opts.cafOverlay) || (opts && opts.cafProfile ? (opts.cafProfile.overlay || {}) : {});
      var scoredAll = window.App.ScoringCAF.scoreEngagement(engagement, instrument, profile, overlay);
      var target = engagement.targets[0];
      if (opts && opts.targetId) target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || target;
      var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

      XLSX.utils.book_append_sheet(wb, cafFrontSheet(engagement, instrument, info), "Front");
      // Single-objective instruments (CIS): the Objectives sheet is one row,
      // redundant with the per-principle (per-Control) sheet - so skip it.
      if ((scored.byObjective || []).length >= 2) {
        XLSX.utils.book_append_sheet(wb, cafObjectivesSheet(scored, info, instrument), "Objectives");
      }
      var prinSheetName = (instrument.display && instrument.display.principleNoun) ? (instrument.display.principleNoun + "s") : "Principles";
      appendNamedSheet(wb, cafPrinciplesSheet(scored, info, instrument), prinSheetName, "Principles");
      XLSX.utils.book_append_sheet(wb, cafOutcomesSheet(scored, instrument, info), "Outcomes");
      XLSX.utils.book_append_sheet(wb, cafAchievedSheet(scored, instrument, info), "Achieved");
      XLSX.utils.book_append_sheet(wb, cafRoadmapSheet(scored, instrument, info), "Roadmap");
      XLSX.utils.book_append_sheet(wb, cafReadmeSheet(instrument, info), "Read me");
      return wb;
    }

    if (instrument.scoringFamily === "program-maturity-ml") {
      var scoredAllM = window.App.ScoringProgramML.scoreEngagement(engagement, instrument, profile);
      var targetM = engagement.targets[0];
      if (opts && opts.targetId) targetM = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || targetM;
      var scoredM = scoredAllM.perTarget.filter(function (t) { return t.target.id === targetM.id; })[0].result;

      XLSX.utils.book_append_sheet(wb, mlFrontSheet(engagement, instrument, scoredM), "Front");
      XLSX.utils.book_append_sheet(wb, mlRequirementsSheet(scoredM, instrument), "Requirements");
      XLSX.utils.book_append_sheet(wb, mlByElementSheet(scoredM, instrument), "By SPE");
      XLSX.utils.book_append_sheet(wb, mlByThemeSheet(scoredM), "By theme");
      // Roadmap exists whenever there are findings to prioritise: below-target
      // requirements when the target overlay is on, otherwise every not-met / ML1
      // requirement. Append the sheet (with owner/action/impact) whenever non-empty.
      if (scoredM.roadmap && scoredM.roadmap.length > 0) XLSX.utils.book_append_sheet(wb, mlRoadmapSheet(scoredM, instrument), "Roadmap");
      XLSX.utils.book_append_sheet(wb, mlReadmeSheet(instrument), "Read me");
      return wb;
    }

    XLSX.utils.book_append_sheet(wb, frontSheet(engagement, instrument), "Front");

    if (instrument.scoringFamily === "domain-letter") {
      var scoredAllP = window.App.ScoringDomainLetter.scoreEngagement(engagement, instrument, profile);
      XLSX.utils.book_append_sheet(wb, postureHeadlineSheet(scoredAllP, engagement, instrument), "Headline");
      XLSX.utils.book_append_sheet(wb, postureDomainsSheet(scoredAllP), "Domains");
      XLSX.utils.book_append_sheet(wb, posturePrioritySheet(scoredAllP), "Priority");
      // Any target with something to improve earns the sheet, not only the first.
      var pRoad = postureSites(scoredAllP).some(function (t) { return (t.result.roadmap || []).length > 0; });
      if (pRoad) XLSX.utils.book_append_sheet(wb, postureRoadmapSheet(scoredAllP), "Improvements");
      XLSX.utils.book_append_sheet(wb, postureQuestionsSheet(scoredAllP, engagement, instrument), "Questions");
      XLSX.utils.book_append_sheet(wb, postureReadmeSheet(instrument, profile), "Read me");
      return wb;
    }

    var scoredAll = window.App.Scoring.scoreEngagement(engagement, instrument, taxonomy, profile);
    scoredAll.engagement = engagement;
    XLSX.utils.book_append_sheet(wb, summarySheet(scoredAll, taxonomy), "Summary");
    XLSX.utils.book_append_sheet(wb, slPrioritySheet(scoredAll, taxonomy), "Priority");
    var slRoad = scoredAll.perTarget.some(function (t) { return t.result.roadmap && t.result.roadmap.length > 0; });
    if (slRoad) XLSX.utils.book_append_sheet(wb, slRoadmapSheet(scoredAll), "Roadmap");
    XLSX.utils.book_append_sheet(wb, requirementsSheet(scoredAll, taxonomy, instrument), "Requirements");
    XLSX.utils.book_append_sheet(wb, itemsSheet(scoredAll, taxonomy), "Items");
    var sharedWs = sharedActionsSheet(scoredAll);
    if (sharedWs) XLSX.utils.book_append_sheet(wb, sharedWs, "Shared actions");
    var ts = targetsSheet(scoredAll, taxonomy);
    if (ts) {
      // "Zones and conduits", the instrument's own plural, rather than
      // "Zone or conduits"; and through the sheet-name guard, being data.
      var tabName = instrument.targetDimensionLabel ? targetNouns(instrument).many : "Targets";
      appendNamedSheet(wb, ts, tabName, "Targets");
    }
    XLSX.utils.book_append_sheet(wb, readmeSheet(instrument), "Read me");
    return wb;
  }

  function download(engagement, instrument, taxonomy, profile, opts) {
    var hint = (opts && opts.filenameHint) || null;
    var base = hint || window.App.Storage.suggestedFilename(engagement).replace(/\.json$/, "");
    // The build runs inside the promise, so a failure reaches the catch below
    // (an error message, and the export buttons released) instead of throwing
    // past the caller and leaving the button doing nothing at all.
    return Promise.resolve().then(function () {
      var wb = build(engagement, instrument, taxonomy, profile, opts);
      applyTabColours(wb);
      // ExcelJS writes asynchronously (writeBuffer returns a Promise).
      return workbookToExcelJS(wb).xlsx.writeBuffer();
    }).then(function (buf) {
      var blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      window.App.Storage.downloadBlob(blob, base + ".xlsx");
    }).catch(function (e) {
      if (window.App.UI && window.App.UI.toast) window.App.UI.toast("Excel export failed: " + (e && e.message ? e.message : e), "err");
      throw e;
    });
  }

  return { build: build, download: download };
})();
