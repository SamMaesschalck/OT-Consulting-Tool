/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* zone-map.js: the zone and conduit drawing, laid out once and drawn two ways.
 *
 * layout(p, suggestZone) places a box per zone and the external network
 * above them when a conduit leaves the SUC. With no zone level set, the
 * zones go up to three to a row in their order, exactly as before phase 5b
 * (scripts/test-risk-drawing.html holds every box, line, id tag and key line
 * to a frozen copy of that layout). With a level set on any zone (zone.level,
 * the house layering in js/model.js ZONE_LEVELS), the zones lie in horizontal
 * bands, top to bottom by level, each band labelled on the left, ordered
 * within it by zone.levelOrder (the zone panel's nudge) and then by the
 * zones' order; zones with no level form a last band.
 *
 * Conduits never run behind a box: two zones side by side are joined straight
 * across the gap between them; anything else leaves a box from its top or
 * bottom edge and runs along the gaps between the rows (and, to skip a row,
 * down the gap between two columns). Each line carries its conduit's id, and
 * beside it, where it fits clear of every box, tag, note and other line, the
 * conduit's SL-T and channels. A key under the boxes gives each id's name and
 * ends, and a legend says what the borders, the dashed box, the SL-T words
 * and the bands mean.
 *
 * toSvg() draws the layout for the pages; toPng() draws the same on a canvas
 * for the Word report, synchronously, because the report is built in one
 * pass (js/exports.js).
 */
window.RiskZoneMap = (function () {
  "use strict";

  var BW = 200, BH = 64, GX = 90, GY = 80, M = 20, KEY_LINE = 16;
  var RISK_COL = { "low": "#2E7D52", "medium": "#C28A1E", "high": "#B23A33", "very-high": "#7A241F" };
  var RISK_NAME = { "low": "Low", "medium": "Medium", "high": "High", "very-high": "Very high" };
  var LINE = "#7F93A8", TEXT = "#1A2533", MUTED = "#5A6B7B", SAFETY = "#C28A1E";
  var FONT = "\"Segoe UI\", Arial, sans-serif";
  var PORT_X = [0, -36, 36, -72, 72], PORT_Y = [0, -14, 14], CHANNEL = [0, -14, 14, -28, 28];
  var TRACK_GAP = 22, LANE_PAD = 22;   // lines in a lane sit TRACK_GAP apart, so their 16px id tags never touch
  // The bands (phase 5b): the label gutter on the left, at most four zones
  // to a band's row, and how far a band's shading reaches past its boxes.
  var LABEL_W = 100, BAND_COLS = 4, BAND_PAD = 10;
  var BAND_FILL = ["#F1F5F9", "#F8FAFC"];
  var LEGEND_LINE = 18;

  function maxDefined(obj) {
    var best = null;
    Object.keys(obj || {}).forEach(function (k) { if (typeof obj[k] === "number" && (best == null || obj[k] > best)) best = obj[k]; });
    return best;
  }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  // Cut at the last comma or space that fits, never mid-word; "" when not
  // even the first word fits.
  function clipWords(s, n) {
    if (s.length <= n) return s;
    var head = s.slice(0, n - 1), at = Math.max(head.lastIndexOf(","), head.lastIndexOf(" "));
    return at > 0 ? head.slice(0, at).replace(/[,\s]+$/, "") + "…" : "";
  }

  // The house layering, from js/model.js when it is loaded.
  function levels() { var Mo = window.RiskApp && window.RiskApp.Model; return (Mo && Mo.ZONE_LEVELS) || []; }
  function levelOf(z) { return levels().some(function (l) { return l.id === z.level; }) ? z.level : null; }

  // Where each zone sits: { slot: id -> { r, c }, rows, cols, bands }.
  function grid(p) {
    var slot = {}, bands = [];
    if (!p.zones.some(levelOf)) {
      var cols = Math.min(3, p.zones.length);
      p.zones.forEach(function (z, i) { slot[z.id] = { r: Math.floor(i / cols), c: i % cols }; });
      return { slot: slot, rows: Math.ceil(p.zones.length / cols), cols: cols, bands: bands, banded: false };
    }
    var groups = levels().map(function (l) { return { id: l.id, label: l.name, zones: [] }; });
    var rest = { id: "", label: "No level", zones: [] };
    p.zones.forEach(function (z, i) {
      var lv = levelOf(z), g = lv ? groups.filter(function (x) { return x.id === lv; })[0] : rest;
      g.zones.push({ z: z, i: i });
    });
    var used = groups.concat([rest]).filter(function (g) { return g.zones.length; });
    function order(x) { return typeof x.z.levelOrder === "number" ? x.z.levelOrder : 1e6 + x.i; }
    used.forEach(function (g) { g.zones.sort(function (a, b) { return order(a) - order(b) || a.i - b.i; }); });
    var widest = used.reduce(function (m, g) { return Math.max(m, g.zones.length); }, 1);
    var bc = Math.min(BAND_COLS, widest), r = 0;
    used.forEach(function (g) {
      var nr = Math.ceil(g.zones.length / bc);
      g.zones.forEach(function (x, k) { slot[x.z.id] = { r: r + Math.floor(k / bc), c: k % bc }; });
      bands.push({ id: g.id, label: g.label, r0: r, r1: r + nr - 1 });
      r += nr;
    });
    return { slot: slot, rows: r, cols: bc, bands: bands, banded: true };
  }
  // The zones of one band in drawing order, for the nudge.
  function bandOrder(p, level) {
    return p.zones.map(function (z, i) { return { z: z, i: i }; }).filter(function (x) { return levelOf(x.z) === level; })
      .sort(function (a, b) {
        var oa = typeof a.z.levelOrder === "number" ? a.z.levelOrder : 1e6 + a.i, ob = typeof b.z.levelOrder === "number" ? b.z.levelOrder : 1e6 + b.i;
        return oa - ob || a.i - b.i;
      }).map(function (x) { return x.z; });
  }

  // null when there are no zones.
  function layout(p, suggestZone) {
    if (!p.zones.length) return null;
    var G = grid(p), cols = G.cols, rows = G.rows;
    var known = {}; p.zones.forEach(function (z) { known[z.id] = true; });
    var drawn = p.conduits.filter(function (c) {
      var ok = function (id) { return id === "EXT" || known[id]; };
      return ok(c.fromZone) && ok(c.toZone) && c.fromZone !== c.toZone;
    });
    var hasExt = drawn.some(function (c) { return c.fromZone === "EXT" || c.toZone === "EXT"; });
    // The bands' labels take a gutter on the left; with one column, the gap
    // a skipping line runs down is on the left too, so the gutter makes room.
    var X0 = M + (G.banded ? LABEL_W + (cols === 1 ? GX : 0) : 0);
    var W = X0 + cols * BW + (cols - 1) * GX + M;
    function colLeft(c) { return X0 + c * (BW + GX); }

    // Lane r runs under row r (lane -1 under the external network), as tall
    // as the lines in it need; the one under the last row only when used.
    // Routing runs twice: once to count each lane's lines, once to place them.
    var laneCount = {};
    function laneH(r) { var n = laneCount[r] || 0; return Math.max(r === rows - 1 && !n ? 0 : GY, n ? 2 * LANE_PAD + (n - 1) * TRACK_GAP : 0); }
    function rowTop(r) {
      if (r < 0) return M;
      var y = M + (hasExt ? BH + laneH(-1) : 0);
      for (var i = 0; i < r; i++) y += BH + laneH(i);
      return y;
    }
    var node, laneUse, portUse, chanUse;
    function place() {
      node = {}; laneUse = {}; portUse = {}; chanUse = {};
      p.zones.forEach(function (z) {
        var s = G.slot[z.id], r = s.r, c = s.c, x = colLeft(c), y = rowTop(r);
        node[z.id] = { r: r, c: c, x: x, y: y, cx: x + BW / 2, cy: y + BH / 2 };
      });
      var extCx = G.banded ? X0 + (W - M - X0) / 2 : W / 2;
      if (hasExt) node.EXT = { r: -1, c: null, x: extCx - BW / 2, y: M, cx: extCx, cy: M + BH / 2 };
    }
    function laneY(r) {
      var k = laneUse[r] = (laneUse[r] || 0) + 1;
      var n = laneCount[r] || k, h = laneH(r);
      return rowTop(r) + BH + (h - (n - 1) * TRACK_GAP) / 2 + (k - 1) * TRACK_GAP;
    }
    function portX(n, id, side) {
      var key = id + side, k = portUse[key] = (portUse[key] || 0) + 1;
      return n.cx + PORT_X[(k - 1) % PORT_X.length];
    }
    function portY(n, id) {
      var key = id + "side", k = portUse[key] = (portUse[key] || 0) + 1;
      return n.cy + PORT_Y[(k - 1) % PORT_Y.length];
    }
    function channelX(c) {
      var gapRight = c < cols - 1;      // the gap to the right of column c, or to its left on the last column
      var base = gapRight ? colLeft(c) + BW + GX / 2 : colLeft(c) - GX / 2;
      var key = gapRight ? c : c - 1, k = chanUse[key] = (chanUse[key] || 0) + 1;
      return base + CHANNEL[(k - 1) % CHANNEL.length];
    }

    function route() {
      place();
      return drawn.map(function (cd) {
        var a = node[cd.fromZone], b = node[cd.toZone], aid = cd.fromZone, bid = cd.toZone;
        if (b.r < a.r) { var t = a; a = b; b = t; t = aid; aid = bid; bid = t; }
        var pts;
        if (a.r === b.r && a.c != null && Math.abs(a.c - b.c) === 1) {
          var L = a.c < b.c ? a : b, R = L === a ? b : a, y = portY(a, "row" + a.r + ":" + Math.min(a.c, b.c));
          pts = [[L.x + BW, y], [R.x, y]];
        } else if (a.r === b.r) {
          // Under the row when there is a row below or nothing above; else over it.
          if (a.r < rows - 1 || (a.r === 0 && !hasExt)) {
            var ly = laneY(a.r), ax = portX(a, aid, "b"), bx = portX(b, bid, "b");
            pts = [[ax, a.y + BH], [ax, ly], [bx, ly], [bx, b.y + BH]];
          } else {
            var uy = laneY(a.r - 1), ax2 = portX(a, aid, "t"), bx2 = portX(b, bid, "t");
            pts = [[ax2, a.y], [ax2, uy], [bx2, uy], [bx2, b.y]];
          }
        } else if (b.r === a.r + 1) {
          var y1 = laneY(a.r), sx = portX(a, aid, "b"), ex = portX(b, bid, "t");
          pts = [[sx, a.y + BH], [sx, y1], [ex, y1], [ex, b.y]];
        } else {
          var yA = laneY(a.r), yB = laneY(b.r - 1), s2 = portX(a, aid, "b"), e2 = portX(b, bid, "t"), ch = channelX(b.c);
          pts = [[s2, a.y + BH], [s2, yA], [ch, yA], [ch, yB], [e2, yB], [e2, b.y]];
        }
        return { id: cd.id, points: pts,
          key: clip(cd.id + ": " + (cd.name ? cd.name + " " : "") + "(" + cd.fromZone + " to " + cd.toZone + ")", 90),
          name: cd.name || "", from: cd.fromZone, to: cd.toZone,
          note: noteText(cd) };
      });
    }
    route();
    laneCount = laneUse;
    var conduits = route();

    // Each id tag goes on its line's longest horizontal run, slid along the run
    // when it would cover a tag already placed.
    var tags = [];
    function clash(x, y, w) {
      return tags.some(function (t) { return Math.abs(t.x - x) < (t.w + w) / 2 + 4 && Math.abs(t.y - y) < 18; });
    }
    conduits.forEach(function (c) {
      var pts = c.points, w = idWidth(c.id), best = null;
      for (var i = 1; i < pts.length; i++) {
        if (pts[i][1] !== pts[i - 1][1]) continue;
        var len = Math.abs(pts[i][0] - pts[i - 1][0]);
        if (!best || len > best.len) best = { len: len, x0: Math.min(pts[i][0], pts[i - 1][0]), y: pts[i][1] };
      }
      var spot;
      if (best) {
        [0.5, 0.3, 0.7, 0.15, 0.85].some(function (f) { var x = best.x0 + best.len * f; if (!clash(x, best.y, w)) { spot = { x: x, y: best.y }; return true; } return false; });
        if (!spot) spot = { x: best.x0 + best.len / 2, y: best.y };
      } else {
        spot = { x: pts[0][0], y: (pts[0][1] + pts[1][1]) / 2 };
      }
      c.lx = spot.x; c.ly = spot.y;
      // The run the tag sits on, so a note beside it stays on its line.
      c.run = best ? { x0: best.x0, x1: best.x0 + best.len, y: best.y } : null;
      tags.push({ x: spot.x, y: spot.y, w: w });
    });

    function box(id, name, sub, isExt, safety, worstBand) {
      var q = node[id];
      return {
        id: id, x: q.x, y: q.y, cx: q.cx, w: BW, h: BH, ext: isExt,
        stroke: safety ? SAFETY : (worstBand ? RISK_COL[worstBand] : "#0F5FA6"),
        strokeWidth: safety ? 2.5 : (worstBand === "very-high" || worstBand === "high" ? 2.5 : 1.5),
        title: clip(id + (name ? ": " + name : ""), 30), sub: sub,
        safety: !!safety, band: worstBand || null
      };
    }
    var shows = { slt: false, sug: false };
    var boxes = p.zones.map(function (z) {
      var s = suggestZone(z, p);
      var sugBy = {}; Object.keys(s.byFR || {}).forEach(function (fr) { sugBy[fr] = s.byFR[fr].sl; });
      var tgt = maxDefined(z.slTargetByFR), sug = maxDefined(sugBy);
      var sub = [];
      // The same notation as a conduit's note ("SL-T 3"), and the risk in words.
      if (tgt != null) { sub.push("SL-T " + tgt); shows.slt = true; } else if (sug != null) { sub.push("Suggested SL " + sug); shows.sug = true; }
      if (s.worstRisk) sub.push("risk " + RISK_NAME[s.worstRisk].toLowerCase());
      if (s.safetyRelated) sub.push("SIS");
      var b = box(z.id, z.name, sub.join(" · "), false, s.safetyRelated, s.worstRisk);
      // Too wide for the box on one line: the SL part, then the rest.
      b.subLines = sub.length > 1 && subWidth(b.sub) > BW - 12 ? [sub[0], sub.slice(1).join(" · ")] : (b.sub ? [b.sub] : []);
      return b;
    });
    if (hasExt) { var eb = box("EXT", "external", "outside the SUC", true, false, null); eb.subLines = [eb.sub]; boxes.push(eb); }

    var boxesBottom = rowTop(rows - 1) + BH + laneH(rows - 1);

    // A conduit's SL-T and channels, beside its id tag where they fit: on its
    // run to the right or the left of the tag, else just above or below it,
    // clear of every box, tag, note already placed and other conduit's line.
    // One that fits nowhere is left out (the key and the tables carry it).
    var taken = tags.map(function (t) { return { x0: t.x - t.w / 2, x1: t.x + t.w / 2, y0: t.y - 8, y1: t.y + 8 }; });
    var walls = boxes.map(function (b) { return { x0: b.x - 2, x1: b.x + b.w + 2, y0: b.y - 2, y1: b.y + b.h + 2 }; });
    function overlaps(r, list) { return list.some(function (q) { return r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0; }); }
    function crossesLine(r, own) {
      return conduits.some(function (c) {
        if (c === own) return false;
        for (var i = 1; i < c.points.length; i++) {
          var a = c.points[i - 1], b = c.points[i];
          var sx0 = Math.min(a[0], b[0]), sx1 = Math.max(a[0], b[0]), sy0 = Math.min(a[1], b[1]), sy1 = Math.max(a[1], b[1]);
          if (sx0 <= r.x1 && sx1 >= r.x0 && sy0 <= r.y1 && sy1 >= r.y0) return true;
        }
        return false;
      });
    }
    var notes = [];
    conduits.forEach(function (c) {
      if (!c.note) return;
      var w = noteWidth(c.note), tw = idWidth(c.id);
      // Beside the tag only where its own line carries on that way (the
      // note sits on the line, never off its end); else above or below.
      var right = { x: c.lx + tw / 2 + 3 + w / 2, y: c.ly }, left = { x: c.lx - tw / 2 - 3 - w / 2, y: c.ly };
      var spots = [];
      if (!c.run || c.run.x1 >= right.x) spots.push(right);
      if (!c.run || c.run.x0 <= left.x) spots.push(left);
      spots.push({ x: c.lx, y: c.ly - 17 }, { x: c.lx, y: c.ly + 17 });
      var at = null;
      spots.some(function (s) {
        var r = { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - 7, y1: s.y + 7 };
        if (r.x0 < M / 2 || r.x1 > W - M / 2 || r.y0 < M / 2 || r.y1 > boxesBottom + BAND_PAD) return false;
        if (overlaps(r, walls) || overlaps(r, taken) || crossesLine(r, c)) return false;
        at = { s: s, r: r }; return true;
      });
      if (!at) return;
      taken.push(at.r);
      notes.push({ id: c.id, x: at.s.x, y: at.s.y, w: w, text: c.note });
    });

    // The bands' shading and labels, once the rows have their final places.
    var bands = G.bands.map(function (b, i) {
      var y0 = rowTop(b.r0) - BAND_PAD, y1 = rowTop(b.r1) + BH + BAND_PAD;
      return { id: b.id, label: b.label, x: M / 2, y: y0, w: W - M, h: y1 - y0, fill: BAND_FILL[i % 2], lx: M, ly: (y0 + y1) / 2 + 4 };
    });

    var keyTop = boxesBottom + (conduits.length ? 24 : 0);
    var keys = conduits.map(function (c, i) { return { x: M, y: keyTop + i * KEY_LINE, text: c.key }; });
    var keysEnd = keyTop + (conduits.length ? (conduits.length - 1) * KEY_LINE + 6 : 0);

    // The legend: what the drawing's marks mean, as far as they are used.
    var items = [];
    if (boxes.some(function (b) { return b.safety; })) items.push({ kind: "safety", text: "Safety related" });
    ["low", "medium", "high", "very-high"].forEach(function (band) {
      if (boxes.some(function (b) { return !b.safety && !b.ext && b.band === band; })) items.push({ kind: "band", band: band, text: "Worst unmitigated risk " + RISK_NAME[band].toLowerCase() });
    });
    if (hasExt) items.push({ kind: "ext", text: "Outside the SUC" });
    if (shows.slt || notes.some(function (n) { return /SL-T/.test(n.text); })) items.push({ kind: "text", term: "SL-T", text: "SL-T: highest on any foundational requirement" });
    if (shows.sug) items.push({ kind: "text", term: "Suggested SL", text: "Suggested SL: no SL-T set yet" });
    if (G.banded) items.push({ kind: "stripe", text: "Shaded rows: SolutionsPT house layering" });
    var legend = [], lx = M, ly = keysEnd + 14;
    items.forEach(function (it) {
      var w = (it.kind === "text" ? 0 : 24) + legendWidth(it.text) + 18;
      if (lx > M && lx + w > W - M) { lx = M; ly += LEGEND_LINE; }
      legend.push({ kind: it.kind, band: it.band || null, text: it.text, term: it.term || "", x: lx, y: ly });
      lx += w;
    });
    var H = (legend.length ? ly + LEGEND_LINE - 4 : keysEnd) + M;
    // drawH: the height of the drawing alone, without its key and legend (the
    // Word report prints those as text under the picture).
    return { W: W, H: H, drawH: boxesBottom + M, conduits: conduits, boxes: boxes, keys: keys, notes: notes, bands: bands, legend: legend, banded: G.banded };
  }

  // A conduit's note: its SL-T (the highest set) and its channels.
  function noteText(cd) {
    var bits = [], t = maxDefined(cd.slTargetByFR);
    if (t != null) bits.push("SL-T " + t);
    var ch = (cd.channels || []).filter(function (x) { return typeof x === "string" && x.trim(); }).join(", ");
    var chc = ch ? clipWords(ch, 24) : "";
    if (chc) bits.push(chc);
    return bits.join(" · ");
  }
  function idWidth(s) { return s.length * 6.4 + 8; }
  function noteWidth(s) { return s.length * 5.4 + 8; }
  function legendWidth(s) { return s.length * 6; }
  function subWidth(s) { return s.length * 5.4; }

  // svgEl(tag, attrs, children): the page's own element helper.
  function toSvg(L, svgEl) {
    // role img; a page that makes the zone boxes buttons sets it to group.
    var svg = svgEl("svg", { width: L.W, height: L.H, viewBox: "0 0 " + L.W + " " + L.H, role: "img", "aria-label": "Zone and conduit drawing" });
    (L.bands || []).forEach(function (b) {
      svg.appendChild(svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 6, fill: b.fill, stroke: "#DDE5EE", "stroke-width": 1, "data-band": b.id || "none" }));
      svg.appendChild(svgEl("text", { x: b.lx, y: b.ly, "font-size": 11, "font-weight": 600, fill: MUTED, text: b.label }));
    });
    L.conduits.forEach(function (c) {
      svg.appendChild(svgEl("polyline", { points: c.points.map(function (q) { return q[0] + "," + q[1]; }).join(" "), fill: "none", stroke: LINE, "stroke-width": 2, "stroke-linejoin": "round" }));
    });
    L.conduits.forEach(function (c) {
      var w = idWidth(c.id);
      svg.appendChild(svgEl("rect", { x: c.lx - w / 2, y: c.ly - 8, width: w, height: 16, rx: 3, fill: "#FFFFFF", stroke: LINE, "stroke-width": 1 }));
      svg.appendChild(svgEl("text", { x: c.lx, y: c.ly + 4, "text-anchor": "middle", "font-size": 10, "font-weight": 600, fill: TEXT, text: c.id }));
    });
    (L.notes || []).forEach(function (n) {
      var g = svgEl("g", { "data-conduit-note": n.id });
      g.appendChild(svgEl("rect", { x: n.x - n.w / 2, y: n.y - 7, width: n.w, height: 14, rx: 2, fill: "#FFFFFF", "fill-opacity": 0.92 }));
      g.appendChild(svgEl("text", { x: n.x, y: n.y + 3.5, "text-anchor": "middle", "font-size": 9.5, fill: MUTED, text: n.text }));
      svg.appendChild(g);
    });
    L.boxes.forEach(function (b) {
      // A zone's box carries its id, so the page can open the zone from it.
      var g = svgEl("g", b.ext ? {} : { "data-zone-id": b.id });
      g.appendChild(svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 5, fill: b.ext ? "#ECF1F6" : "#FFFFFF", stroke: b.stroke, "stroke-width": b.strokeWidth, "stroke-dasharray": b.ext ? "5,4" : "none" }));
      g.appendChild(svgEl("text", { x: b.cx, y: b.y + 26, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: TEXT, text: b.title }));
      subRows(b).forEach(function (s) { g.appendChild(svgEl("text", { x: b.cx, y: b.y + s.dy, "text-anchor": "middle", "font-size": 10, fill: MUTED, text: s.text })); });
      svg.appendChild(g);
    });
    L.keys.forEach(function (k) {
      svg.appendChild(svgEl("text", { x: k.x, y: k.y + 11, "font-size": 11, fill: MUTED, text: k.text }));
    });
    var lg = svgEl("g", { "data-legend": "" });
    (L.legend || []).forEach(function (it) {
      var sw = swatch(it);
      if (sw) lg.appendChild(svgEl("rect", { x: it.x, y: it.y + 2, width: 16, height: 10, rx: 2, fill: sw.fill, stroke: sw.stroke, "stroke-width": sw.width, "stroke-dasharray": sw.dash ? "3,2" : "none" }));
      lg.appendChild(svgEl("text", { x: it.x + (sw ? 22 : 0), y: it.y + 11, "font-size": 10.5, fill: MUTED, "data-legend-item": it.kind, text: it.text }));
    });
    svg.appendChild(lg);
    return svg;
  }
  // A box's lines under its title: one at 44, or two at 41 and 54.
  function subRows(b) {
    var ls = b.subLines || (b.sub ? [b.sub] : []);
    return ls.length > 1 ? [{ text: ls[0], dy: 41 }, { text: ls[1], dy: 54 }] : ls.map(function (s) { return { text: s, dy: 44 }; });
  }
  function swatch(it) {
    if (it.kind === "safety") return { fill: "#FFFFFF", stroke: SAFETY, width: 2.5 };
    if (it.kind === "band") return { fill: "#FFFFFF", stroke: RISK_COL[it.band], width: it.band === "high" || it.band === "very-high" ? 2.5 : 1.5 };
    if (it.kind === "ext") return { fill: "#ECF1F6", stroke: MUTED, width: 1, dash: true };
    if (it.kind === "stripe") return { fill: BAND_FILL[0], stroke: "#DDE5EE", width: 1 };
    return null;
  }

  // { bytes: Uint8Array (PNG), width, height } in CSS pixels, drawn at `scale`
  // times for print; null when the browser has no canvas.
  // opts.picture: the drawing alone (L.drawH tall), without the key and the
  // legend, for the Word report, which prints them as text under it.
  function toPng(L, scale, opts) {
    scale = scale || 3;
    var pic = !!(opts && opts.picture), H = pic ? L.drawH : L.H;
    var c = document.createElement("canvas");
    c.width = Math.round(L.W * scale); c.height = Math.round(H * scale);
    var g = c.getContext && c.getContext("2d");
    if (!g) return null;
    g.scale(scale, scale);
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, L.W, H);
    g.lineJoin = "round";
    function rrect(x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    (L.bands || []).forEach(function (b) {
      rrect(b.x, b.y, b.w, b.h, 6); g.fillStyle = b.fill; g.fill(); g.strokeStyle = "#DDE5EE"; g.lineWidth = 1; g.setLineDash([]); g.stroke();
      g.font = "600 11px " + FONT; g.fillStyle = MUTED; g.fillText(b.label, b.lx, b.ly);
    });
    L.conduits.forEach(function (cd) {
      g.strokeStyle = LINE; g.lineWidth = 2; g.setLineDash([]);
      g.beginPath();
      cd.points.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
      g.stroke();
    });
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    L.conduits.forEach(function (cd) {
      var w = idWidth(cd.id);
      rrect(cd.lx - w / 2, cd.ly - 8, w, 16, 3);
      g.fillStyle = "#FFFFFF"; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1; g.stroke();
      g.font = "600 10px " + FONT; g.fillStyle = TEXT; g.fillText(cd.id, cd.lx, cd.ly + 4);
    });
    (L.notes || []).forEach(function (n) {
      rrect(n.x - n.w / 2, n.y - 7, n.w, 14, 2); g.fillStyle = "rgba(255,255,255,0.92)"; g.fill();
      g.font = "9.5px " + FONT; g.fillStyle = MUTED; g.fillText(n.text, n.x, n.y + 3.5);
    });
    L.boxes.forEach(function (b) {
      rrect(b.x, b.y, b.w, b.h, 5);
      g.fillStyle = b.ext ? "#ECF1F6" : "#FFFFFF"; g.fill();
      g.setLineDash(b.ext ? [5, 4] : []);
      g.strokeStyle = b.stroke; g.lineWidth = b.strokeWidth; g.stroke();
      g.setLineDash([]);
      g.font = "600 12px " + FONT; g.fillStyle = TEXT;
      g.fillText(b.title, b.cx, b.y + 26);
      subRows(b).forEach(function (s) { g.font = "10px " + FONT; g.fillStyle = MUTED; g.fillText(s.text, b.cx, b.y + s.dy); });
    });
    g.textAlign = "left";
    if (!pic) L.keys.forEach(function (k) { g.font = "11px " + FONT; g.fillStyle = MUTED; g.fillText(k.text, k.x, k.y + 11); });
    (pic ? [] : (L.legend || [])).forEach(function (it) {
      var sw = swatch(it);
      if (sw) {
        rrect(it.x, it.y + 2, 16, 10, 2); g.fillStyle = sw.fill; g.fill();
        g.setLineDash(sw.dash ? [3, 2] : []); g.strokeStyle = sw.stroke; g.lineWidth = sw.width; g.stroke(); g.setLineDash([]);
      }
      g.font = "10.5px " + FONT; g.fillStyle = MUTED; g.fillText(it.text, it.x + (sw ? 22 : 0), it.y + 11);
    });
    var url = c.toDataURL("image/png");
    var bin = atob(url.slice(url.indexOf(",") + 1));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes: bytes, width: L.W, height: H };
  }

  return { layout: layout, toSvg: toSvg, toPng: toPng, bandOrder: bandOrder, noteText: noteText, swatch: swatch, RISK_NAME: RISK_NAME };
}());
