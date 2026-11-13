/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* zone-map.js: the zone and conduit drawing, laid out once and drawn two ways.
 *
 * layout(p, suggestZone) places a box per zone (up to three to a row) and the
 * external network above them when a conduit leaves the SUC. Conduits never
 * run behind a box: two zones side by side are joined straight across the gap
 * between them; anything else leaves a box from its top or bottom edge and
 * runs along the gaps between the rows (and, to skip a row, down the gap
 * between two columns). Each line carries its conduit's id, and a key under
 * the boxes gives each id's name and ends.
 *
 * toSvg() draws the layout for the Zones & conduits page; toPng() draws the
 * same on a canvas for the Word report, synchronously, because the report is
 * built in one pass (js/exports.js).
 */
window.RiskZoneMap = (function () {
  "use strict";

  var BW = 200, BH = 64, GX = 90, GY = 80, M = 20, KEY_LINE = 16;
  var RISK_COL = { "low": "#2E7D52", "medium": "#C28A1E", "high": "#B23A33", "very-high": "#7A241F" };
  var LINE = "#7F93A8", TEXT = "#1A2533", MUTED = "#5A6B7B";
  var FONT = "\"Segoe UI\", Arial, sans-serif";
  var PORT_X = [0, -36, 36, -72, 72], PORT_Y = [0, -14, 14], CHANNEL = [0, -14, 14, -28, 28];
  var TRACK_GAP = 22, LANE_PAD = 22;   // lines in a lane sit TRACK_GAP apart, so their 16px id tags never touch

  function maxDefined(obj) {
    var best = null;
    Object.keys(obj || {}).forEach(function (k) { if (typeof obj[k] === "number" && (best == null || obj[k] > best)) best = obj[k]; });
    return best;
  }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  // null when there are no zones.
  function layout(p, suggestZone) {
    if (!p.zones.length) return null;
    var cols = Math.min(3, p.zones.length);
    var rows = Math.ceil(p.zones.length / cols);
    var known = {}; p.zones.forEach(function (z) { known[z.id] = true; });
    var drawn = p.conduits.filter(function (c) {
      var ok = function (id) { return id === "EXT" || known[id]; };
      return ok(c.fromZone) && ok(c.toZone) && c.fromZone !== c.toZone;
    });
    var hasExt = drawn.some(function (c) { return c.fromZone === "EXT" || c.toZone === "EXT"; });
    var W = cols * BW + (cols - 1) * GX + 2 * M;
    function colLeft(c) { return M + c * (BW + GX); }

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
      p.zones.forEach(function (z, i) {
        var r = Math.floor(i / cols), c = i % cols, x = colLeft(c), y = rowTop(r);
        node[z.id] = { r: r, c: c, x: x, y: y, cx: x + BW / 2, cy: y + BH / 2 };
      });
      if (hasExt) node.EXT = { r: -1, c: null, x: W / 2 - BW / 2, y: M, cx: W / 2, cy: M + BH / 2 };
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
          key: clip(cd.id + ": " + (cd.name ? cd.name + " " : "") + "(" + cd.fromZone + " to " + cd.toZone + ")", 90) };
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
      tags.push({ x: spot.x, y: spot.y, w: w });
    });

    function box(id, name, sub, isExt, safety, worstBand) {
      var q = node[id];
      return {
        x: q.x, y: q.y, cx: q.cx, w: BW, h: BH, ext: isExt,
        stroke: safety ? "#C28A1E" : (worstBand ? RISK_COL[worstBand] : "#0F5FA6"),
        strokeWidth: safety ? 2.5 : (worstBand === "very-high" || worstBand === "high" ? 2.5 : 1.5),
        title: clip(id + (name ? ": " + name : ""), 30), sub: sub
      };
    }
    var boxes = p.zones.map(function (z) {
      var s = suggestZone(z, p);
      var sugBy = {}; Object.keys(s.byFR || {}).forEach(function (fr) { sugBy[fr] = s.byFR[fr].sl; });
      var tgt = maxDefined(z.slTargetByFR), sug = maxDefined(sugBy);
      var sub = [];
      if (tgt != null) sub.push("SL-T≤" + tgt); else if (sug != null) sub.push("sug SL≤" + sug);
      if (s.worstRisk) sub.push("risk " + s.worstRisk);
      if (s.safetyRelated) sub.push("SIS");
      return box(z.id, z.name, sub.join(" · "), false, s.safetyRelated, s.worstRisk);
    });
    if (hasExt) boxes.push(box("EXT", "external", "outside the SUC", true, false, null));

    var boxesBottom = rowTop(rows - 1) + BH + laneH(rows - 1);
    var keyTop = boxesBottom + (conduits.length ? 24 : 0);
    var keys = conduits.map(function (c, i) { return { x: M, y: keyTop + i * KEY_LINE, text: c.key }; });
    var H = keyTop + (conduits.length ? (conduits.length - 1) * KEY_LINE + 6 : 0) + M;
    return { W: W, H: H, conduits: conduits, boxes: boxes, keys: keys };
  }

  function idWidth(s) { return s.length * 6.4 + 8; }

  // svgEl(tag, attrs, children): the page's own element helper.
  function toSvg(L, svgEl) {
    var svg = svgEl("svg", { width: L.W, height: L.H, viewBox: "0 0 " + L.W + " " + L.H, role: "img", "aria-label": "Zone and conduit drawing" });
    L.conduits.forEach(function (c) {
      svg.appendChild(svgEl("polyline", { points: c.points.map(function (q) { return q[0] + "," + q[1]; }).join(" "), fill: "none", stroke: LINE, "stroke-width": 2, "stroke-linejoin": "round" }));
    });
    L.conduits.forEach(function (c) {
      var w = idWidth(c.id);
      svg.appendChild(svgEl("rect", { x: c.lx - w / 2, y: c.ly - 8, width: w, height: 16, rx: 3, fill: "#FFFFFF", stroke: LINE, "stroke-width": 1 }));
      svg.appendChild(svgEl("text", { x: c.lx, y: c.ly + 4, "text-anchor": "middle", "font-size": 10, "font-weight": 600, fill: TEXT, text: c.id }));
    });
    L.boxes.forEach(function (b) {
      var g = svgEl("g", {});
      g.appendChild(svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 5, fill: b.ext ? "#ECF1F6" : "#FFFFFF", stroke: b.stroke, "stroke-width": b.strokeWidth, "stroke-dasharray": b.ext ? "5,4" : "none" }));
      g.appendChild(svgEl("text", { x: b.cx, y: b.y + 26, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: TEXT, text: b.title }));
      if (b.sub) g.appendChild(svgEl("text", { x: b.cx, y: b.y + 44, "text-anchor": "middle", "font-size": 10, fill: MUTED, text: b.sub }));
      svg.appendChild(g);
    });
    L.keys.forEach(function (k) {
      svg.appendChild(svgEl("text", { x: k.x, y: k.y + 11, "font-size": 11, fill: MUTED, text: k.text }));
    });
    return svg;
  }

  // { bytes: Uint8Array (PNG), width, height } in CSS pixels, drawn at `scale`
  // times for print; null when the browser has no canvas.
  function toPng(L, scale) {
    scale = scale || 3;
    var c = document.createElement("canvas");
    c.width = Math.round(L.W * scale); c.height = Math.round(L.H * scale);
    var g = c.getContext && c.getContext("2d");
    if (!g) return null;
    g.scale(scale, scale);
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, L.W, L.H);
    g.lineJoin = "round";
    L.conduits.forEach(function (cd) {
      g.strokeStyle = LINE; g.lineWidth = 2; g.setLineDash([]);
      g.beginPath();
      cd.points.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
      g.stroke();
    });
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    L.conduits.forEach(function (cd) {
      var w = idWidth(cd.id);
      g.beginPath();
      if (g.roundRect) g.roundRect(cd.lx - w / 2, cd.ly - 8, w, 16, 3); else g.rect(cd.lx - w / 2, cd.ly - 8, w, 16);
      g.fillStyle = "#FFFFFF"; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1; g.stroke();
      g.font = "600 10px " + FONT; g.fillStyle = TEXT; g.fillText(cd.id, cd.lx, cd.ly + 4);
    });
    L.boxes.forEach(function (b) {
      g.beginPath();
      if (g.roundRect) g.roundRect(b.x, b.y, b.w, b.h, 5); else g.rect(b.x, b.y, b.w, b.h);
      g.fillStyle = b.ext ? "#ECF1F6" : "#FFFFFF"; g.fill();
      g.setLineDash(b.ext ? [5, 4] : []);
      g.strokeStyle = b.stroke; g.lineWidth = b.strokeWidth; g.stroke();
      g.setLineDash([]);
      g.font = "600 12px " + FONT; g.fillStyle = TEXT;
      g.fillText(b.title, b.cx, b.y + 26);
      if (b.sub) { g.font = "10px " + FONT; g.fillStyle = MUTED; g.fillText(b.sub, b.cx, b.y + 44); }
    });
    g.textAlign = "left";
    L.keys.forEach(function (k) { g.font = "11px " + FONT; g.fillStyle = MUTED; g.fillText(k.text, k.x, k.y + 11); });
    var url = c.toDataURL("image/png");
    var bin = atob(url.slice(url.indexOf(",") + 1));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes: bytes, width: L.W, height: L.H };
  }

  return { layout: layout, toSvg: toSvg, toPng: toPng };
}());
