/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* assets.js — the project-wide asset register (phase 6a), without the page.
 *
 * Every asset still lives in its zone (zone.assets, ids AS1...). This file
 * reads them as one register, moves one to another zone (a threat's links
 * then follow js/migrate.js pruneDangling, as for a removed asset), and reads
 * rows pasted from a spreadsheet: tab-separated, Excel's quoting and line
 * endings, a header row recognised by its English names, or a column mapping
 * chosen when there is none or a heading is not known (a field chosen for
 * two columns reads the first). preview() says what each row will do and
 * any problem with it (unknown zone, repeated tag, type not known and set to
 * Other, an update that renames); apply() does it. Callers take the undo point
 * (js/app.js undoMark) before apply, so a paste undoes as one step.
 *
 * Pure apart from the project it is given. js/ui-assets.js is the page.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Assets = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine;

  // ---------- The register ----------

  // Every asset with its zone, in zone order then the zone's own order.
  function all(project) {
    var out = [];
    project.zones.forEach(function (z) { (z.assets || []).forEach(function (a, i) { if (a && typeof a === "object") out.push({ a: a, zone: z, index: i }); }); });
    return out;
  }
  function find(project, id) {
    var hit = null;
    all(project).some(function (r) { if (r.a.id === id) { hit = r; return true; } return false; });
    return hit;
  }

  // Moves an asset to the end of another zone's list. A threat's link to it
  // goes where the zone's threats can no longer name it (the prune). Returns
  // { from, to, dropped } (the threat links dropped), or null.
  function linkCount(project) {
    return project.zones.concat(project.conduits).reduce(function (n, o) {
      return n + (o.threats || []).reduce(function (k, t) { return k + ((t && t.assetIds) || []).length; }, 0);
    }, 0);
  }
  function move(project, id, toZoneId) {
    var r = find(project, id), to = E.findZone(project, toZoneId);
    if (!r || !to || r.zone === to) return null;
    var before = linkCount(project);
    r.zone.assets.splice(r.zone.assets.indexOf(r.a), 1);
    to.assets.push(r.a);
    R.Migrate.pruneDangling(project);
    return { from: r.zone.id, to: to.id, dropped: before - linkCount(project) };
  }

  // Sets one of the register's fields on an asset: an optional field is
  // written only when given and goes again when cleared.
  function setField(a, key, value) {
    var v = typeof value === "string" ? value : "";
    if (key === "name") { a.name = v; return; }
    if (key === "type") { a.type = M.ASSET_TYPES.indexOf(v) >= 0 ? v : "other"; return; }
    if (key === "link") { if (M.ASSET_LINKS.indexOf(v) >= 0) a.link = v; else delete a.link; return; }
    if (key === "criticality") { if (M.ASSET_CRITICALITY.indexOf(v) >= 0) a.criticality = v; else delete a.criticality; return; }
    if (M.ASSET_TEXT_FIELDS.indexOf(key) >= 0) { if (v.trim()) a[key] = v; else delete a[key]; }
  }

  // ---------- Reading a paste ----------

  // Rows and cells of tab-separated text as a spreadsheet copies it: cells
  // split by tabs, rows by CRLF, LF or CR, a cell wrapped in double quotes
  // when it holds a tab, a line break or a quote (a quote inside doubled).
  // Cells are trimmed; empty rows are dropped. A cell that opens a quote and
  // never closes it is read again with the quote as a plain character, so
  // it cannot swallow the rest of the paste.
  function parseTable(text) {
    var s = String(text == null ? "" : text), start = s.charCodeAt(0) === 0xFEFF ? 1 : 0, literal = {};
    for (;;) {
      var rows = [], row = [], cell = "", i = start, n = s.length, quoted = false, fresh = true, openAt = -1;
      while (i < n) {
        var ch = s.charAt(i);
        if (quoted) {
          if (ch === '"') {
            if (s.charAt(i + 1) === '"') { cell += '"'; i += 2; continue; }
            quoted = false; i++; continue;
          }
          cell += ch; i++; continue;
        }
        if (ch === '"' && fresh && !literal[i]) { quoted = true; fresh = false; openAt = i; i++; continue; }
        if (ch === "\t") { row.push(cell); cell = ""; fresh = true; i++; continue; }
        if (ch === "\r" || ch === "\n") {
          row.push(cell); rows.push(row); row = []; cell = ""; fresh = true;
          i += (ch === "\r" && s.charAt(i + 1) === "\n") ? 2 : 1;
          continue;
        }
        cell += ch; fresh = false; i++;
      }
      if (quoted) { literal[openAt] = true; continue; }
      if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
      return rows.map(function (r) { return r.map(function (c) { return c.replace(/\r\n?/g, "\n").trim(); }); })
        .filter(function (r) { return r.some(function (c) { return !!c; }); });
    }
  }

  // The headings recognised, in English, after lower case and punctuation
  // read as spaces ("Firmware ver." reads "firmware ver").
  var HEADINGS = {
    zone: ["zone", "zone id", "zone name", "security zone"],
    name: ["name", "names", "asset", "assets", "asset name", "asset names", "device", "device name", "equipment", "description"],
    type: ["type", "asset type", "device type", "category", "class", "kind"],
    link: ["connection", "connection type", "connectivity", "link"],
    tag: ["tag", "tags", "tag number", "tag no", "tag id", "asset tag", "hostname", "host name", "host", "tag or hostname", "tag hostname"],
    vendor: ["vendor", "manufacturer", "make", "supplier", "oem"],
    model: ["model", "model number", "model no", "part number", "product"],
    version: ["version", "firmware", "firmware version", "firmware ver", "software version", "sw version", "fw version", "os version", "firmware or software version", "firmware software version"],
    location: ["location", "site", "area", "room", "building", "cabinet", "panel"],
    criticality: ["criticality", "critical", "importance"],
    owner: ["owner", "asset owner", "responsible", "custodian"],
    notes: ["notes", "note", "comments", "comment", "remarks"]
  };
  var FIELDS = ["zone", "name", "type", "link", "tag", "vendor", "model", "version", "location", "criticality", "owner", "notes"];
  function normHead(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function fieldOfHeading(s) {
    var k = normHead(s);
    if (!k) return null;
    for (var i = 0; i < FIELDS.length; i++) if (HEADINGS[FIELDS[i]].indexOf(k) >= 0) return FIELDS[i];
    return null;
  }

  // What a paste holds: { rows (the data rows), header (the heading cells,
  // or null), columns, mapping (a field or null per column), unknown (the
  // columns whose heading is not known), needsMapping }. A first row is the
  // header when one of its cells is the name's heading, or two of them are
  // known headings. With no header the columns are taken as name, type and
  // connection, as Paste several on a zone reads them, until mapped.
  function read(text) {
    var rows = parseTable(text);
    var columns = rows.reduce(function (n, r) { return Math.max(n, r.length); }, 0);
    var first = rows[0] || [], seen = {};
    var guess = first.map(function (c) { var f = fieldOfHeading(c); if (f && seen[f]) return null; if (f) seen[f] = true; return f; });
    var known = guess.filter(Boolean).length;
    var isHeader = rows.length > 0 && (guess.indexOf("name") >= 0 || known >= 2);
    var mapping = [], unknown = [], header = null;
    if (isHeader) {
      header = first.slice();
      rows = rows.slice(1);
      for (var c = 0; c < columns; c++) {
        mapping.push(guess[c] || null);
        if (!guess[c] && String(first[c] || "").trim()) unknown.push(c);
      }
    } else {
      for (var d = 0; d < columns; d++) mapping.push(["name", "type", "link"][d] || null);
    }
    return { rows: rows, header: header, columns: columns, mapping: mapping, unknown: unknown,
      needsMapping: isHeader ? unknown.length > 0 : columns > 1 };
  }

  // ---------- What each row will do ----------

  var FIXED_WORDS = ["fixed", "wired", "permanent", "ethernet", "cabled"];
  var CRIT_WORDS = {
    high: "high", h: "high", critical: "high", "very high": "high", "1": "high",
    medium: "medium", med: "medium", m: "medium", moderate: "medium", "2": "medium",
    low: "low", l: "low", minor: "low", "3": "low"
  };
  function critFrom(s) { return CRIT_WORDS[normHead(s)] || null; }
  function tagKey(s) { return String(s || "").trim().toLowerCase(); }
  function zoneFrom(project, s) {
    var k = String(s || "").trim().toLowerCase();
    if (!k) return null;
    return project.zones.filter(function (z) { return z.id.toLowerCase() === k; })[0] ||
      project.zones.filter(function (z) { return String(z.name || "").trim().toLowerCase() === k; })[0] ||
      project.zones.filter(function (z) { return (z.id + " " + (z.name || "")).trim().toLowerCase() === k; })[0] || null;
  }
  function q(s) { return "“" + s + "”"; }
  function labelOf(f) { return String((M.ASSET_FIELD_LABEL || {})[f] || f).toLowerCase(); }

  // opts: { zoneId: the zone for rows without one (or with one not found),
  //         updateExisting: a row whose tag an asset already has updates it }.
  // Each row: { n (its number among the data rows), values, zoneId, action
  // ("add" | "update" | "skip"), target (the asset updated, { a, zone }),
  // problems: [text] }.
  // The columns mapped to a field another column already holds: { column:
  // the first column of that field }. Only the first is read.
  function duplicates(mapping) {
    var first = {}, out = {};
    (mapping || []).forEach(function (f, c) { if (!f) return; if (first[f] == null) first[f] = c; else out[c] = first[f]; });
    return out;
  }

  function preview(project, parsed, mapping, opts) {
    opts = opts || {};
    var chosen = opts.zoneId ? E.findZone(project, opts.zoneId) : null;
    var tagSeen = {}, existing = {}, dup = duplicates(mapping);
    all(project).forEach(function (r) { var k = tagKey(r.a.tag); if (k && !existing[k]) existing[k] = r; });
    return parsed.rows.map(function (cells, i) {
      var v = {}, problems = [], out = { n: i + 1, values: v, zoneId: null, action: "add", target: null, problems: problems };
      var twice = [];
      (mapping || []).forEach(function (f, c) {
        if (!f || cells[c] == null || !String(cells[c]).trim()) return;
        if (dup[c] != null) { if (twice.indexOf(f) < 0) twice.push(f); return; }
        v[f] = String(cells[c]).trim();
      });
      twice.forEach(function (f) { problems.push("Two columns are read as " + labelOf(f) + "; the first is used."); });
      // Not named: a new asset takes its tag as its name; an update keeps its own.
      var named = !!v.name;
      if (!v.name && v.tag) v.name = v.tag;
      if (!v.name) { problems.push("No name; left out."); out.action = "skip"; return out; }
      if (v.type != null) {
        var t = E.assetTypeFrom(v.type);
        if (t === "other" && normHead(v.type) !== "other") problems.push("Type " + q(v.type) + " not known; set to Other.");
        v.typeId = t;
      }
      if (v.link != null) {
        var lk = E.assetLinkFrom(v.link);
        if (!lk && FIXED_WORDS.indexOf(normHead(v.link)) < 0) problems.push("Connection " + q(v.link) + " not known; set to Fixed.");
        v.linkId = lk || "";
      }
      if (v.criticality != null) {
        var cr = critFrom(v.criticality);
        if (!cr) problems.push("Criticality " + q(v.criticality) + " not known; left blank.");
        v.criticalityId = cr || "";
      }
      // The zone: the one named, else the one chosen for the paste.
      var z = v.zone != null ? zoneFrom(project, v.zone) : null;
      var zoneMissing = v.zone != null && !z;
      z = z || chosen;
      out.zoneId = z ? z.id : null;
      // A tag repeated in the paste, and one an asset already has. A tag is
      // taken by a row only once that row is added or updated, so a row left
      // out does not block a later one with the same tag.
      var k = tagKey(v.tag);
      var ex = k && existing[k] ? existing[k] : null;
      if (ex && opts.updateExisting) {
        out.target = ex;
        if (k && tagSeen[k]) { problems.push("Repeats the tag of row " + tagSeen[k] + "; left out."); out.action = "skip"; return out; }
        out.action = "update";
        // An update writes only what the paste gives: a row with no name
        // keeps the asset's own.
        if (!named) delete v.name;
        tagSeen[k] = out.n;
        if (zoneMissing) problems.push("Zone " + q(v.zone) + " not found; updated in place.");
        else if (v.zone != null && z && z !== ex.zone) problems.push("Already in " + ex.zone.id + " as " + ex.a.id + "; updated there, not moved.");
        if (v.name && String(ex.a.name || "") !== v.name) problems.push("Renames " + ex.a.id + (ex.a.name ? " from " + ex.a.name : "") + ".");
        return out;
      }
      if (zoneMissing) problems.push("Zone " + q(v.zone) + " not found" + (chosen ? "; goes to " + chosen.id + "." : "."));
      if (k && tagSeen[k]) { problems.push("Repeats the tag of row " + tagSeen[k] + "; left out."); out.action = "skip"; return out; }
      if (ex) {
        out.target = ex; out.action = "skip";
        problems.push("Tag already on " + ex.a.id + " in " + ex.zone.id + "; left out unless Update existing is ticked.");
        return out;
      }
      if (!z) { problems.push("No zone to add it to."); out.action = "skip"; return out; }
      if (k) tagSeen[k] = out.n;
      return out;
    });
  }

  // Does what the preview says: adds the new assets (each a new id) and
  // updates the matched ones (only the fields the paste gives). Returns
  // { added, updated, skipped, zones (the ids added to) }.
  function apply(project, rows) {
    var res = { added: 0, updated: 0, skipped: 0, zones: [] };
    function fill(a, v, isNew) {
      if (v.name) a.name = v.name;
      if (v.typeId) a.type = v.typeId; else if (isNew) a.type = "other";
      if (v.linkId != null) setField(a, "link", v.linkId);
      if (v.criticalityId) a.criticality = v.criticalityId;
      M.ASSET_TEXT_FIELDS.forEach(function (k) { if (v[k]) a[k] = v[k]; });
    }
    rows.forEach(function (r) {
      if (r.action === "update" && r.target) { fill(r.target.a, r.values, false); res.updated++; return; }
      if (r.action !== "add") { res.skipped++; return; }
      var z = E.findZone(project, r.zoneId);
      if (!z) { res.skipped++; return; }
      var a = M.newAsset(project, { name: "", type: "other" });
      fill(a, r.values, true);
      z.assets.push(a);
      if (res.zones.indexOf(z.id) < 0) res.zones.push(z.id);
      res.added++;
    });
    return res;
  }

  return {
    all: all, find: find, move: move, setField: setField,
    parseTable: parseTable, read: read, preview: preview, apply: apply, duplicates: duplicates,
    FIELDS: FIELDS, fieldOfHeading: fieldOfHeading, critFrom: critFrom
  };
}());
