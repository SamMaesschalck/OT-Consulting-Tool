/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* charts.js
 *
 * Hand-drawn inline SVG. No charting library. Each builder returns an
 * SVGSVGElement that the caller appends to the DOM. Reusable across
 * instruments - charts take a scored result, not raw engagement state.
 *
 * For exports, svgToPngBlob() rasterises an SVG via the offscreen canvas
 * pattern, which works under file:// without external loads.
 */
window.App = window.App || {};
window.App.Charts = (function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var COLOR_TARGET   = "#0F5FA6";
  var COLOR_ACHIEVED = "#2E7D52";
  var COLOR_GRID     = "#C8D2DD";
  var COLOR_AXIS     = "#5A6B7B";
  var COLOR_TEXT     = "#1A2533";
  var COLOR_MUTED    = "#8595A5";
  var COLOR_NEAR     = "#C28A1E";
  var COLOR_GAP      = "#B23A33";
  var COLOR_NA       = "#94A0AD";
  var COLOR_MET      = "#2E7D52";
  var COLOR_UNKNOWN  = "#94A0AD"; // unknown - reduces coverage, not scored
  var COLOR_SEVERE   = "#7A0E1A"; // unknown-as-finding (worse than a known gap)
  var COLOR_ABOVE    = "#2E6FA6"; // above baseline - implemented but not required
  var COLOR_NA       = "#CBD5DE"; // not applicable - excluded from scope

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG_NS, name);
    if (attrs) for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  // ---- row-label gutters ------------------------------------------------
  //
  // The horizontal bar charts put their row label in a left gutter, right-
  // aligned against the bar. The gutter used to be a fixed width, so any label
  // wider than it ran off the left edge of the viewBox and lost its opening
  // characters - "D Minimising the impact of cyber security incidents" arrived
  // with the "D" sliced in half. These charts are also rasterised into the Word
  // report, so the clipped label shipped to the client.
  //
  // We cannot measure text without laying it out, so the width is estimated
  // from the character count. 11px Segoe UI at weight 600 averages a shade
  // under 6px per character; 6.05 errs toward a slightly roomy gutter, which
  // costs nothing but never clips. The gutter grows the chart rather than
  // squeezing the bars, so bar geometry is unchanged. Past the cap, labels are
  // truncated with an ellipsis and the full text goes on a <title> for hover.
  var LABEL_CHAR_W = 6.05;
  var LABEL_GAP    = 8;

  function labelGutter(labels, requested, maxGutter) {
    requested = requested || 220;
    maxGutter = maxGutter || 340;
    var longest = 0;
    (labels || []).forEach(function (t) { longest = Math.max(longest, String(t == null ? "" : t).length); });
    var needed = Math.ceil(longest * LABEL_CHAR_W) + LABEL_GAP;
    var width = Math.min(maxGutter, Math.max(requested, needed));
    var maxChars = Math.floor((width - LABEL_GAP) / LABEL_CHAR_W);
    return {
      width: width,
      extra: Math.max(0, width - requested),
      // Truncate only in the rare case that a label exceeds the cap.
      fit: function (t) {
        var s = String(t == null ? "" : t);
        return s.length <= maxChars ? s : (s.slice(0, Math.max(1, maxChars - 1)) + "…");
      }
    };
  }

  // Row label with the full text preserved on hover when it had to be cut.
  function rowLabel(svg, gutter, text, x, y) {
    var shown = gutter.fit(text);
    var node = el("text", { x: x, y: y, "text-anchor": "end", fill: COLOR_TEXT, "font-weight": "600" }, svg);
    node.textContent = shown;
    if (shown !== String(text == null ? "" : text)) {
      var title = el("title", {}, node);
      title.textContent = String(text);
    }
    return node;
  }

  function bandColor(band) {
    if (band === "met")  return COLOR_MET;
    if (band === "near") return COLOR_NEAR;
    if (band === "gap")  return COLOR_GAP;
    return COLOR_NA;
  }

  // ---- Radar: achieved SL vs target SL across FRs -----------------------

  function radar(scoredSite, taxonomy, opts) {
    opts = opts || {};
    var size = opts.size || 360;
    var w = size, h = size;
    var cx = w / 2, cy = h / 2 + 6;
    var r  = Math.min(w, h) / 2 - 50;

    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + h, width: w, height: h,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });

    // background
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FFFFFF" }, svg);

    var frs = taxonomy.frs;
    var n   = frs.length;
    var maxSL = 4;

    // gridlines
    for (var s = 1; s <= maxSL; s++) {
      var pts = [];
      for (var i = 0; i < n; i++) {
        var ang = (Math.PI * 2 * i / n) - Math.PI / 2;
        var rr = r * (s / maxSL);
        pts.push((cx + Math.cos(ang) * rr).toFixed(1) + "," + (cy + Math.sin(ang) * rr).toFixed(1));
      }
      el("polygon", {
        points: pts.join(" "),
        fill: "none", stroke: COLOR_GRID, "stroke-width": "1",
        "stroke-dasharray": s === maxSL ? "" : "2 3"
      }, svg);
    }

    // axes + labels + SL ticks on first axis
    for (var i2 = 0; i2 < n; i2++) {
      var a = (Math.PI * 2 * i2 / n) - Math.PI / 2;
      var x = cx + Math.cos(a) * r;
      var y = cy + Math.sin(a) * r;
      el("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: COLOR_GRID, "stroke-width": "1" }, svg);

      var lx = cx + Math.cos(a) * (r + 18);
      var ly = cy + Math.sin(a) * (r + 18);
      var anchor = "middle";
      if (Math.cos(a) >  0.2) anchor = "start";
      if (Math.cos(a) < -0.2) anchor = "end";
      var label = el("text", {
        x: lx, y: ly, "text-anchor": anchor, fill: COLOR_TEXT, "font-weight": "600"
      }, svg);
      label.textContent = frs[i2].id;
      var sub = el("text", {
        x: lx, y: ly + 12, "text-anchor": anchor, fill: COLOR_MUTED, "font-size": "10"
      }, svg);
      sub.textContent = frs[i2].abbr || "";
    }

    // SL ring labels (1..4) along the north axis
    for (var s2 = 1; s2 <= maxSL; s2++) {
      var ry = cy - r * (s2 / maxSL);
      var t = el("text", { x: cx + 4, y: ry + 3, fill: COLOR_MUTED, "font-size": "10" }, svg);
      t.textContent = "SL " + s2;
    }

    // target polygon
    var targetPts = [];
    for (var i3 = 0; i3 < n; i3++) {
      var fr = scoredSite.perFR[i3];
      var a3 = (Math.PI * 2 * i3 / n) - Math.PI / 2;
      var tSL = (fr && typeof fr.targetSL === "number") ? fr.targetSL : 0;
      var rr3 = r * (tSL / maxSL);
      targetPts.push((cx + Math.cos(a3) * rr3).toFixed(1) + "," + (cy + Math.sin(a3) * rr3).toFixed(1));
    }
    el("polygon", {
      points: targetPts.join(" "),
      fill: "rgba(15,95,166,0.08)",
      stroke: COLOR_TARGET, "stroke-width": "1.5", "stroke-dasharray": "4 3"
    }, svg);

    // achieved polygon (weakest-link conformant SL per FR)
    var achievedPts = [];
    var anyAnswered = false;
    for (var i4 = 0; i4 < n; i4++) {
      var fr4 = scoredSite.perFR[i4];
      var a4 = (Math.PI * 2 * i4 / n) - Math.PI / 2;
      var aSL = (fr4 && fr4.conformantAchievedSL !== null && fr4.conformantAchievedSL !== Infinity)
        ? fr4.conformantAchievedSL : 0;
      if (fr4 && fr4.answeredCount > 0) anyAnswered = true;
      var rr4 = r * (aSL / maxSL);
      achievedPts.push((cx + Math.cos(a4) * rr4).toFixed(1) + "," + (cy + Math.sin(a4) * rr4).toFixed(1));
    }
    if (anyAnswered) {
      el("polygon", {
        points: achievedPts.join(" "),
        fill: "rgba(46,125,82,0.18)",
        stroke: COLOR_ACHIEVED, "stroke-width": "2"
      }, svg);
      // dots
      for (var i5 = 0; i5 < n; i5++) {
        var fr5 = scoredSite.perFR[i5];
        if (!fr5 || fr5.answeredCount === 0) continue;
        var a5 = (Math.PI * 2 * i5 / n) - Math.PI / 2;
        var rr5 = r * ((fr5.conformantAchievedSL || 0) / maxSL);
        var dotFill = fr5.frTargetMet ? COLOR_MET : (fr5.floorFlagCount > 0 ? COLOR_GAP : COLOR_NEAR);
        el("circle", {
          cx: (cx + Math.cos(a5) * rr5).toFixed(1),
          cy: (cy + Math.sin(a5) * rr5).toFixed(1),
          r: "3.5", fill: dotFill, stroke: "#FFFFFF", "stroke-width": "1"
        }, svg);
      }
    }

    // small inset legend
    var lg = el("g", { transform: "translate(8,8)" }, svg);
    var lr = el("rect", { x: 0, y: 0, width: 130, height: 38, rx: 4, ry: 4, fill: "#FFFFFF", stroke: COLOR_GRID }, lg);
    el("line", { x1: 8, y1: 14, x2: 22, y2: 14, stroke: COLOR_TARGET, "stroke-width": "1.5", "stroke-dasharray": "4 3" }, lg);
    var t1 = el("text", { x: 28, y: 17, fill: COLOR_TEXT, "font-size": "10" }, lg); t1.textContent = "Target SL";
    el("line", { x1: 8, y1: 30, x2: 22, y2: 30, stroke: COLOR_ACHIEVED, "stroke-width": "2" }, lg);
    var t2 = el("text", { x: 28, y: 33, fill: COLOR_TEXT, "font-size": "10" }, lg); t2.textContent = "Achieved SL";

    return svg;
  }

  // ---- Closeness bar per FR ---------------------------------------------

  function closenessBars(scoredSite, taxonomy, opts) {
    opts = opts || {};
    var w = opts.width || 540;
    var rowH = 26;
    var pad = { l: 60, r: 90, t: 10, b: 10 };
    var n = taxonomy.frs.length;
    var h = pad.t + pad.b + n * rowH;

    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + h, width: w, height: h,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FFFFFF" }, svg);

    var barX = pad.l;
    var barW = w - pad.l - pad.r;

    // grid
    for (var g = 0; g <= 4; g++) {
      var gx = barX + (barW * g / 4);
      el("line", { x1: gx, y1: pad.t, x2: gx, y2: h - pad.b, stroke: COLOR_GRID, "stroke-width": "1", "stroke-dasharray": "2 3" }, svg);
      var lbl = el("text", { x: gx, y: h - 1, "text-anchor": "middle", fill: COLOR_MUTED, "font-size": "10" }, svg);
      lbl.textContent = (g * 25) + "%";
    }

    // bars
    for (var i = 0; i < n; i++) {
      var fr = scoredSite.perFR[i];
      var y = pad.t + i * rowH + 4;
      var code = el("text", { x: barX - 8, y: y + 12, "text-anchor": "end", fill: COLOR_TEXT, "font-weight": "600" }, svg);
      code.textContent = fr.frId;

      // bg
      el("rect", { x: barX, y: y, width: barW, height: rowH - 8, fill: "#F4F7FA", stroke: COLOR_GRID, "stroke-width": "0.5" }, svg);

      if (fr.closeness !== null) {
        var bw = Math.max(2, barW * fr.closeness);
        el("rect", { x: barX, y: y, width: bw, height: rowH - 8, fill: bandColor(fr.closenessBand) }, svg);
        var pct = Math.round(fr.closeness * 100) + "%";
        var pctT = el("text", { x: barX + barW + 6, y: y + 12, fill: COLOR_TEXT, "font-size": "11", "font-weight": "600" }, svg);
        // "not yet" for an FR met so far with items still to assess, the same
        // words as the per-FR "Target met" cells.
        pctT.textContent = pct + (fr.frTargetMet ? "" : (fr.floorFlagCount ? "  (floor)"
          : (fr.frTargetStatus === "incomplete" ? "  (not yet)" : "")));
      } else {
        var na = el("text", { x: barX + 6, y: y + 12, fill: COLOR_MUTED, "font-size": "11", "font-style": "italic" }, svg);
        na.textContent = "not assessed";
      }
    }

    return svg;
  }

  // ---- SR heatmap -------------------------------------------------------

  function srHeatmap(scoredSite, taxonomy, opts) {
    opts = opts || {};
    var perFR = scoredSite.perFR;
    var maxCols = 0;
    perFR.forEach(function (fr) { if (fr.reqs.length > maxCols) maxCols = fr.reqs.length; });
    if (maxCols === 0) maxCols = 1;

    var cell = 22, gap = 3;
    var labelW = 50;
    var w = labelW + maxCols * (cell + gap);
    var h = perFR.length * (cell + gap) + 10;
    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + h, width: w, height: h,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FFFFFF" }, svg);

    for (var i = 0; i < perFR.length; i++) {
      var fr = perFR[i];
      var y = i * (cell + gap) + 4;
      var lbl = el("text", { x: labelW - 6, y: y + cell - 6, "text-anchor": "end", fill: COLOR_TEXT, "font-weight": "600" }, svg);
      lbl.textContent = fr.frId;
      for (var j = 0; j < fr.reqs.length; j++) {
        var r = fr.reqs[j];
        var x = labelW + j * (cell + gap);
        var fill = "#FFFFFF";
        if (!r.applicable) fill = "#ECEFF2";
        else if (!r.touched) fill = "#FFFFFF";   // in scope, not yet answered
        // Answered in part with nothing short: still to assess, not a gap.
        else if (r.toAssess) fill = "#FFFFFF";
        else if (r.band === "met") fill = "#2E7D52";
        else if (r.band === "near") fill = "#C28A1E";
        else if (r.band === "gap") fill = "#B23A33";
        el("rect", {
          x: x, y: y, width: cell, height: cell, rx: 2, ry: 2,
          fill: fill, stroke: COLOR_GRID, "stroke-width": "0.5"
        }, svg);
        if (r.floor) {
          el("rect", { x: x, y: y, width: cell, height: cell, fill: "none", stroke: COLOR_GAP, "stroke-width": "2" }, svg);
        }
      }
    }
    return svg;
  }

  // ---- Domain score bars (domain-letter family) ------------------------

  function domainScoreBars(scoredSite, opts) {
    opts = opts || {};
    var w = opts.width || 540;
    var rowH = 28;
    // Left column holds the full "id - Domain name" label (e.g. "arch -
    // Architecture and segmentation"), sized to the longest one present.
    var domains = scoredSite.perDomain || [];
    var gutter = labelGutter(domains.map(function (d) { return d.domainId + " - " + d.name; }), opts.labelWidth || 240);
    w += gutter.extra;
    var pad = { l: gutter.width, r: 140, t: 10, b: 24 };
    var n = domains.length;
    var h = pad.t + pad.b + Math.max(1, n) * rowH;
    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + h, width: w, height: h,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FFFFFF" }, svg);

    var barX = pad.l;
    var barW = w - pad.l - pad.r;
    // grid + axis tick labels
    for (var g = 0; g <= 4; g++) {
      var gx = barX + (barW * g / 4);
      el("line", { x1: gx, y1: pad.t, x2: gx, y2: h - pad.b, stroke: COLOR_GRID, "stroke-width": "1", "stroke-dasharray": "2 3" }, svg);
      var lbl = el("text", { x: gx, y: h - pad.b + 14, "text-anchor": "middle", fill: COLOR_MUTED, "font-size": "10" }, svg);
      lbl.textContent = (g * 25) + "%";
    }

    // Coverage-threshold marker -> not drawn here; this chart is about score.
    // bars
    for (var i = 0; i < n; i++) {
      var d = domains[i];
      var y = pad.t + i * rowH + 4;
      rowLabel(svg, gutter, d.domainId + " - " + d.name, barX - LABEL_GAP, y + 14);
      el("rect", { x: barX, y: y, width: barW, height: rowH - 8, fill: "#F4F7FA", stroke: COLOR_GRID, "stroke-width": "0.5" }, svg);
      if (d.score !== null) {
        var bw = Math.max(2, barW * d.score);
        // Bar fill is determined by the grade letter on the A-F scale only.
        // Low-coverage is rendered as a separate gray "P" circle, never as a
        // colour change, so a provisional A still reads as green.
        var fill = (d.score >= 0.7) ? COLOR_MET :
                   (d.score >= 0.4) ? COLOR_NEAR : COLOR_GAP;
        el("rect", { x: barX, y: y, width: bw, height: rowH - 8, fill: fill }, svg);
        var t = el("text", { x: barX + barW + 6, y: y + 14, fill: COLOR_TEXT, "font-size": "11", "font-weight": "600" }, svg);
        t.textContent = (d.grade || "-") + "  " + Math.round(d.score * 100) + "%";
        if (d.lowCoverage) {
          var px = barX + barW + 76;
          el("circle", { cx: px, cy: y + 10, r: 7, fill: COLOR_MUTED }, svg);
          var pTxt = el("text", { x: px, y: y + 13, "text-anchor": "middle", fill: "#FFFFFF", "font-size": "9", "font-weight": "700" }, svg);
          pTxt.textContent = "P";
        }
      } else {
        var na = el("text", { x: barX + 6, y: y + 14, fill: COLOR_MUTED, "font-size": "11", "font-style": "italic" }, svg);
        na.textContent = "not graded";
      }
    }
    return svg;
  }

  // ---- CAF state-profile stacked bars (caf-achieved family) -----------
  //
  // One row per group (objective or principle). Each row is a horizontal
  // bar split into Achieved / Partially / Not segments coloured with the
  // semantic palette. Unknown / N/A are tallied but not drawn (they sit
  // outside the score profile). Used by the on-screen report and embedded
  // as a PNG into the Word doc.
  function cafStateBars(rows, opts) {
    opts = opts || {};
    var w = opts.width || 540;
    var rowH = 28;
    // Gutter sized to the longest row label; the chart widens to suit so the
    // bars keep their geometry (see labelGutter).
    var gutter = labelGutter(rows.map(function (r) { return r.label; }), opts.labelWidth || 220);
    w += gutter.extra;
    var pad = { l: gutter.width, r: 90, t: 10, b: 10 };
    var n = rows.length;
    var hgt = pad.t + pad.b + Math.max(1, n) * rowH;
    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + hgt, width: w, height: hgt,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: hgt, fill: "#FFFFFF" }, svg);
    var barX = pad.l;
    var barW = w - pad.l - pad.r;

    rows.forEach(function (r, i) {
      var y = pad.t + i * rowH + 4;
      rowLabel(svg, gutter, r.label, barX - LABEL_GAP, y + 14);

      el("rect", { x: barX, y: y, width: barW, height: rowH - 8, fill: "#F4F7FA", stroke: COLOR_GRID, "stroke-width": "0.5" }, svg);

      // achieved / partially / not, then (when present) unknown and N/A in
      // muted greys. Callers that omit unknown/na (e.g. CAF) are unchanged.
      var u = r.unknown || 0, naC = r.na || 0, ab = r.aboveBaseline || 0;
      // Unknown-as-finding instruments (e.g. CIS) render Unknown FIRST and in a
      // severe colour - it is the worst outcome (uncertain), ahead of a known gap.
      // Above-baseline (implemented but not required) shows at the positive end.
      var segs = opts.unknownSevere
        ? [
            { v: u,           c: COLOR_SEVERE },
            { v: r.not,       c: COLOR_GAP },
            { v: r.partially, c: COLOR_NEAR },
            { v: r.achieved,  c: COLOR_MET },
            { v: ab,          c: COLOR_ABOVE },
            { v: naC,         c: COLOR_NA }
          ]
        : [
            { v: r.achieved,  c: COLOR_MET },
            { v: r.partially, c: COLOR_NEAR },
            { v: r.not,       c: COLOR_GAP },
            { v: u,           c: COLOR_UNKNOWN },
            { v: ab,          c: COLOR_ABOVE },
            { v: naC,         c: COLOR_NA }
          ];
      var total = segs.reduce(function (a, s) { return a + s.v; }, 0);
      if (total <= 0) {
        var none = el("text", { x: barX + 6, y: y + 14, fill: COLOR_MUTED, "font-size": "11", "font-style": "italic" }, svg);
        none.textContent = "no answers";
        return;
      }
      var x = barX;
      segs.forEach(function (s) {
        if (s.v <= 0) return;
        var segW = barW * (s.v / total);
        el("rect", { x: x, y: y, width: segW, height: rowH - 8, fill: s.c }, svg);
        x += segW;
      });
      var counts = el("text", { x: barX + barW + 6, y: y + 14, fill: COLOR_TEXT, "font-size": "11", "font-weight": "600" }, svg);
      counts.textContent = r.achieved + " / " + r.partially + " / " + r.not + ((u || naC) ? " / " + u + " / " + naC : "");
    });
    return svg;
  }

  // ---- ML distribution stacked bars (program-maturity-ml family) ------
  //
  // One row per Security Program Element (or theme). Each bar is split into
  // Not met / ML1 / ML2 / ML3 / ML4 segments (worst-to-best, left-to-right)
  // coloured on a graded palette. Unknown / N/A sit outside the profile and
  // are not drawn. Used by the on-screen report and embedded as a PNG in Word.
  var COLOR_ML1 = "#94A0AD"; // muted grey  (initial)
  var COLOR_ML2 = "#C28A1E"; // amber       (managed)
  var COLOR_ML3 = "#2E7D52"; // green       (defined/practiced)
  var COLOR_ML4 = "#0F5FA6"; // brand blue  (improving)
  function mlDistributionBars(rows, opts) {
    opts = opts || {};
    var w = opts.width || 560;
    var rowH = 28;
    var gutter = labelGutter(rows.map(function (r) { return r.label; }), opts.labelWidth || 240);
    w += gutter.extra;
    var pad = { l: gutter.width, r: 110, t: 10, b: 10 };
    var n = rows.length;
    var hgt = pad.t + pad.b + Math.max(1, n) * rowH;
    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + hgt, width: w, height: hgt,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: hgt, fill: "#FFFFFF" }, svg);
    var barX = pad.l;
    var barW = w - pad.l - pad.r;

    rows.forEach(function (r, i) {
      var y = pad.t + i * rowH + 4;
      rowLabel(svg, gutter, r.label, barX - LABEL_GAP, y + 14);

      el("rect", { x: barX, y: y, width: barW, height: rowH - 8, fill: "#F4F7FA", stroke: COLOR_GRID, "stroke-width": "0.5" }, svg);

      var segs = [
        { v: r.notMet || 0, c: COLOR_GAP },
        { v: r.ml1 || 0,    c: COLOR_ML1 },
        { v: r.ml2 || 0,    c: COLOR_ML2 },
        { v: r.ml3 || 0,    c: COLOR_ML3 },
        { v: r.ml4 || 0,    c: COLOR_ML4 }
      ];
      var total = segs.reduce(function (a, s) { return a + s.v; }, 0);
      if (total <= 0) {
        var na = el("text", { x: barX + 6, y: y + 14, fill: COLOR_MUTED, "font-size": "11", "font-style": "italic" }, svg);
        na.textContent = "no answers";
        return;
      }
      var x = barX;
      segs.forEach(function (s) {
        if (s.v <= 0) return;
        var segW = barW * (s.v / total);
        el("rect", { x: x, y: y, width: segW, height: rowH - 8, fill: s.c }, svg);
        x += segW;
      });
      var counts = el("text", { x: barX + barW + 6, y: y + 14, fill: COLOR_TEXT, "font-size": "11", "font-weight": "600" }, svg);
      counts.textContent = (r.notMet || 0) + " / " + (r.ml1 || 0) + " / " + (r.ml2 || 0) + " / " + (r.ml3 || 0) + " / " + (r.ml4 || 0);
    });
    return svg;
  }

  // ---- SVG -> PNG -------------------------------------------------------

  // ---- exposure vs appetite ----------------------------------------------
  //
  // The risk-appetite report headline. Exposure runs left to right (limited ->
  // severe); appetite runs bottom to top (averse -> tolerant). The coherence
  // line is the ANTI-diagonal, because the appetite an exposure warrants is its
  // mirror: severe exposure warrants an averse appetite, limited exposure can
  // carry a tolerant one. A point above that line is accepting more risk than
  // the exposure warrants - under-protected - and that is the one region drawn
  // in a warning colour.
  //
  // Everything else is deliberately unshaded. There is no good corner on this
  // plot, only a good LINE, and tinting "averse" green would assert exactly the
  // thing the instrument refuses to assert.
  function exposureAppetitePlot(scored, opts) {
    opts = opts || {};
    var expBands = (scored.exposure && scored.exposure.bands) || ["limited", "moderate", "high", "severe"];
    var appBands = (scored.appetite && scored.appetite.bands) || ["averse", "cautious", "open", "tolerant"];
    var n = expBands.length, m = appBands.length;

    var pad = { l: 96, r: 150, t: 30, b: 52 };
    var cell = opts.cell || 74;
    var plotW = n * cell, plotH = m * cell;
    var w = pad.l + plotW + pad.r;
    var h = pad.t + plotH + pad.b;
    var svg = el("svg", {
      xmlns: SVG_NS, viewBox: "0 0 " + w + " " + h, width: w, height: h,
      "font-family": '"Segoe UI", system-ui, sans-serif', "font-size": "11"
    });
    el("rect", { x: 0, y: 0, width: w, height: h, fill: "#FFFFFF" }, svg);

    // Centre of the cell for a 1-based band rank.
    function cx(rank) { return pad.l + (rank - 0.5) * cell; }
    function cy(rank) { return pad.t + plotH - (rank - 0.5) * cell; }   // appetite grows upward

    // The under-protected region: every cell whose exposure+appetite ranks put
    // it 2+ bands past the coherence line.
    for (var ex = 1; ex <= n; ex++) {
      for (var ap = 1; ap <= m; ap++) {
        var delta = ap + ex - (n + 1);
        if (delta < 2) continue;
        el("rect", {
          x: pad.l + (ex - 1) * cell, y: pad.t + plotH - ap * cell,
          width: cell, height: cell,
          fill: COLOR_GAP, "fill-opacity": "0.07"
        }, svg);
      }
    }

    // Grid.
    for (var gx = 0; gx <= n; gx++) {
      el("line", { x1: pad.l + gx * cell, y1: pad.t, x2: pad.l + gx * cell, y2: pad.t + plotH,
                   stroke: COLOR_GRID, "stroke-width": "1" }, svg);
    }
    for (var gy = 0; gy <= m; gy++) {
      el("line", { x1: pad.l, y1: pad.t + gy * cell, x2: pad.l + plotW, y2: pad.t + gy * cell,
                   stroke: COLOR_GRID, "stroke-width": "1" }, svg);
    }

    // The coherence line, corner to corner across the mirror pairs.
    el("line", {
      x1: cx(1), y1: cy(m), x2: cx(n), y2: cy(1),
      stroke: COLOR_AXIS, "stroke-width": "1.5", "stroke-dasharray": "5 4"
    }, svg);
    var lineLbl = el("text", {
      x: cx(n) - 4, y: cy(1) - 10, "text-anchor": "end", fill: COLOR_AXIS, "font-size": "10"
    }, svg);
    lineLbl.textContent = "coherence";

    // Band labels.
    expBands.forEach(function (b, i) {
      var t = el("text", { x: cx(i + 1), y: pad.t + plotH + 18, "text-anchor": "middle",
                           fill: COLOR_TEXT, "font-size": "11" }, svg);
      t.textContent = b.charAt(0).toUpperCase() + b.slice(1);
    });
    appBands.forEach(function (b, i) {
      var t = el("text", { x: pad.l - 10, y: cy(i + 1) + 4, "text-anchor": "end",
                           fill: COLOR_TEXT, "font-size": "11" }, svg);
      t.textContent = b.charAt(0).toUpperCase() + b.slice(1);
    });

    // Axis titles.
    var xt = el("text", { x: pad.l + plotW / 2, y: h - 14, "text-anchor": "middle",
                          fill: COLOR_MUTED, "font-size": "11" }, svg);
    xt.textContent = "Inherent exposure →";
    var yt = el("text", {
      x: 14, y: pad.t + plotH / 2, "text-anchor": "middle", fill: COLOR_MUTED, "font-size": "11",
      transform: "rotate(-90 14 " + (pad.t + plotH / 2) + ")"
    }, svg);
    yt.textContent = "Apparent appetite →";

    // The organisation. Stated position first; the technical read, where there
    // is one, is a hollow marker joined to it - the gap IS the finding, so it
    // has to be visible as a distance rather than described in a footnote.
    var er = (scored.exposure && scored.exposure.rank) || 0;
    var ar = (scored.appetite && scored.appetite.rank) || 0;
    var rv = scored.revealed && scored.revealed.rank;

    // The previous assessment's position, where there is one: a hollow grey
    // marker and an arrow to where the organisation sits now. The arrow stops
    // short of both markers so neither is obscured.
    var pv = opts.previous;
    if (pv && pv.exposureRank && pv.appetiteRank && er && ar &&
        (pv.exposureRank !== er || pv.appetiteRank !== ar)) {
      var x0 = cx(pv.exposureRank), y0 = cy(pv.appetiteRank), x1 = cx(er), y1 = cy(ar);
      var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;
      var sx = x0 + ux * 10, sy = y0 + uy * 10, ex = x1 - ux * 14, ey = y1 - uy * 14;
      el("circle", { cx: x0, cy: y0, r: "8", fill: "#FFFFFF", stroke: COLOR_MUTED, "stroke-width": "2",
                     "data-role": "previous" }, svg);
      el("line", { x1: sx, y1: sy, x2: ex, y2: ey, stroke: COLOR_MUTED, "stroke-width": "2",
                   "data-role": "movement" }, svg);
      // Arrowhead: a small triangle pointing along the line.
      var ah = 7, aw = 4.5;
      var bx = ex - ux * ah, by = ey - uy * ah;
      el("polygon", {
        points: ex + "," + ey + " " + (bx - uy * aw) + "," + (by + ux * aw) + " " + (bx + uy * aw) + "," + (by - ux * aw),
        fill: COLOR_MUTED
      }, svg);
      var pl = el("text", { x: x0 + 12, y: y0 - 10, fill: COLOR_MUTED, "font-size": "10" }, svg);
      pl.textContent = opts.previousLabel || "previous";
    }

    if (er && ar && rv) {
      el("line", { x1: cx(er), y1: cy(ar), x2: cx(er), y2: cy(rv),
                   stroke: COLOR_TARGET, "stroke-width": "1.5", "stroke-dasharray": "3 3" }, svg);
      el("circle", { cx: cx(er), cy: cy(rv), r: "8", fill: "#FFFFFF",
                     stroke: COLOR_TARGET, "stroke-width": "2" }, svg);
      var rl = el("text", { x: cx(er) + 14, y: cy(rv) + 4, fill: COLOR_TARGET, "font-size": "10" }, svg);
      rl.textContent = "revealed";
    }
    if (er && ar) {
      el("circle", { cx: cx(er), cy: cy(ar), r: "9", fill: COLOR_TARGET }, svg);
      if (rv) {
        var sl = el("text", { x: cx(er) + 14, y: cy(ar) + 4, fill: COLOR_TARGET, "font-size": "10" }, svg);
        sl.textContent = "stated";
      }
    } else {
      var none = el("text", { x: pad.l + plotW / 2, y: pad.t + plotH / 2,
                              "text-anchor": "middle", fill: COLOR_MUTED, "font-size": "12" }, svg);
      none.textContent = "Both positions not yet set";
    }

    // Verdict caption, top right, in the same colour language as the region.
    var v = scored.verdict || {};
    var vColor = v.key === "under-protected" ? COLOR_GAP
               : v.key === "over-invested" ? COLOR_NEAR
               : v.key === "aligned" ? COLOR_MET : COLOR_MUTED;
    // A lean goes on the next line in the same colour language: "Aligned" with
    // "leaning under-protected" beneath it in amber. Kept to two lines so it
    // fits the caption column.
    if (v.key === "aligned" && v.lean === "under-protected") vColor = COLOR_NEAR;
    var vt = el("text", { x: pad.l + plotW + 14, y: pad.t + 14, fill: vColor,
                          "font-size": "13", "font-weight": "700" }, svg);
    vt.textContent = v.label || "Not yet characterised";
    if (v.key === "aligned" && v.lean) {
      var lt = el("text", { x: pad.l + plotW + 14, y: pad.t + 30, fill: vColor, "font-size": "11" }, svg);
      lt.textContent = "leaning " + v.lean;
    }
    if (v.key === "under-protected") {
      var note = el("text", { x: pad.l + plotW + 14, y: pad.t + 32, fill: COLOR_MUTED, "font-size": "10" }, svg);
      note.textContent = "shaded region";
    }

    return svg;
  }

  function svgToPngBlob(svg, scale, callback) {
    scale = scale || 2;
    var clone = svg.cloneNode(true);
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", SVG_NS);
    var w = parseFloat(svg.getAttribute("width"))  || svg.viewBox.baseVal.width  || 600;
    var h = parseFloat(svg.getAttribute("height")) || svg.viewBox.baseVal.height || 400;

    var src = new XMLSerializer().serializeToString(clone);
    var b64 = btoa(unescape(encodeURIComponent(src)));
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) { callback(blob, canvas); }, "image/png");
    };
    img.onerror = function (e) { callback(null, null, e); };
    img.src = "data:image/svg+xml;base64," + b64;
  }

  function blobToArrayBuffer(blob, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsArrayBuffer(blob);
  }

  return {
    radar: radar,
    closenessBars: closenessBars,
    srHeatmap: srHeatmap,
    domainScoreBars: domainScoreBars,
    cafStateBars: cafStateBars,
    mlDistributionBars: mlDistributionBars,
    exposureAppetitePlot: exposureAppetitePlot,
    svgToPngBlob: svgToPngBlob,
    blobToArrayBuffer: blobToArrayBuffer
  };
})();
