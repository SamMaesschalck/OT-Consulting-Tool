/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* report-sections.js
 *
 * What a consultant's section override means, in one place, so the assessment
 * tool and the risk tool cannot drift apart: how a section is keyed, how a
 * stored order applies, how a store is patched, and the pass that applies the
 * overrides to a Word document's heading tree. The canonical copy is
 * shared/report-sections.js; tools/sync-shared.ps1 copies it into both tools.
 *
 * A store is { <sectionKey>: { title, hidden, prose, order } }, plus whatever a
 * tool keeps beside those fields (the assessment tool's glossary terms).
 *
 * Built docx paragraphs are write-only: their text and level go into internal
 * XML and cannot be read back. So an exporter tags what it makes, at
 * construction, and everything here reads only the tags:
 *
 *   __headingLevel  1 or 2: this node opens a section
 *   __headingText   the heading it prints
 *   __boundaryOnly  closes the section before it, but is never looked up (a
 *                   zone's own heading: its text is a name, not a title)
 *   __noProse       a section repeated per target, each with different wording:
 *                   a prose override must not replace them all
 *   __isBody        a plain paragraph, part of a section's opening run
 *   __text          what that paragraph says
 *   __keepInRun     not part of the opening run's wording, and not stopping it:
 *                   it stays when the run is rewritten
 *   __attribution   a licence statement: survives its section being hidden
 */
(function () {
  "use strict";
  window.App = window.App || {};

  // A section is keyed by a slug of its GENERATED heading, never its displayed
  // one, so renaming a section keeps its key and the override survives. Target
  // names are stripped first: "Posture summary - BPCS" and "Posture summary -
  // SIS" are one section seen from two zones.
  function sectionKey(title, names) {
    var t = String(title || "");
    // Longest first, so a zone called "BPCS" does not chew a hole in the middle
    // of a zone called "BPCS - basic process control".
    (names || []).slice().sort(function (a, b) { return b.length - a.length; })
      .forEach(function (n) { t = t.split(n).join(" "); });
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

  // Patch fields; a field set to null or "" is removed, and a section left with
  // nothing is dropped entirely, so "no customisation" never persists as clutter.
  function patchSection(store, key, patch) {
    var cur = Object.assign({}, store[key] || {}, patch);
    Object.keys(cur).forEach(function (k) {
      var v = cur[k];
      if (v === null || v === undefined || v === "" || v === false ||
          (Array.isArray(v) && v.length === 0)) delete cur[k];
    });
    if (Object.keys(cur).length) store[key] = cur;
    else delete store[key];
    return store;
  }

  // The overrides, applied over the document's heading tree.
  //
  //   hidden  the heading and everything under it, up to the next heading of
  //           the same or a higher level, is dropped. On screen it is only
  //           dimmed: the consultant still has to be able to put it back.
  //   title   the heading is rebuilt with the new text at the same level.
  //   prose   the run of body paragraphs OPENING the section is replaced.
  //           Tables, charts and bullets are left alone: prose is the part that
  //           is a judgement call, the numbers are not.
  //
  // hooks:
  //   keyOf(node)              the section key of a tagged heading
  //   heading(node, title)     a heading like this one, with this text
  //   body(line)               a body paragraph for one line of prose
  //   rescued                  a list to put kept attributions in; without one
  //                            they go at the end of the list returned
  //   keepHidden               leave hidden sections in (a preview, which dims
  //                            them); only the Word file leaves them out
  function applyOverrides(children, custom, hooks) {
    if (!custom || !Object.keys(custom).length) return children;
    var kept = [];

    // Recursive: an h2 nested under an h1 is its own section and has to be
    // visited in its own right. Walking flat would let the first h1 swallow
    // every h2 below it, which is exactly what it did until it was caught.
    function walk(nodes) {
      var out = [], i = 0;
      while (i < nodes.length) {
        var n = nodes[i];
        if (!n || !n.__headingLevel) { out.push(n); i++; continue; }

        var lvl = n.__headingLevel;
        // A boundary-only heading closes the section before it but is never
        // looked up: its text is a zone name, which the key strips to nothing,
        // so every zone would share one key and an override on it would take
        // all of them. A heading whose key slugs to nothing cannot be addressed
        // for the same reason.
        var key = n.__boundaryOnly ? "" : hooks.keyOf(n);
        var c = key ? custom[key] : null;

        // Everything belonging to this section: up to the next heading at the
        // same level or above.
        var end = i + 1;
        while (end < nodes.length) {
          var m = nodes[end];
          if (m && m.__headingLevel && m.__headingLevel <= lvl) break;
          end++;
        }
        var section = nodes.slice(i + 1, end);
        i = end;

        if (c && c.hidden && !hooks.keepHidden) {        // heading and subtree
          section.forEach(function (x) { if (x && x.__attribution) kept.push(x); });
          continue;
        }
        var shown = c && c.title ? hooks.heading(n, c.title) : n;
        // A renamed heading keeps the key of the section it is (see probeSections).
        if (shown !== n) shown.__sectionKey = key;
        out.push(shown);

        if (c && c.prose && !n.__noProse) {
          // The generated wording that OPENS the section: the run of body
          // paragraphs before the first table, chart, bullet or sub-heading.
          var k = 0, pinned = [];
          while (k < section.length && section[k] && (section[k].__isBody || section[k].__keepInRun)) {
            if (section[k].__keepInRun) pinned.push(section[k]);
            k++;
          }
          section = section.slice(k);
          var paras = [];
          String(c.prose).split(/\n/).forEach(function (line) {
            if (line.trim() !== "") paras.push(hooks.body(line.trim()));
          });
          section = paras.concat(pinned).concat(section);
        }

        out = out.concat(walk(section));
      }
      return out;
    }
    var result = walk(children);
    if (!kept.length) return result;
    if (hooks.rescued) { hooks.rescued.push.apply(hooks.rescued, kept); return result; }
    return result.concat(kept);
  }

  // For a review and a preview: the wording that opens each section of a list of
  // nodes, { key, title, level, boundary, repeat, targetName, texts } once per
  // heading, by the same rule applyOverrides uses to decide what a prose override
  // replaces. A renamed heading carries its key in __sectionKey. The nodes are
  // only read.
  function probeSections(nodes, keyOf, into) {
    (nodes || []).forEach(function (n, i) {
      if (!n || !n.__headingLevel || n.__headingText == null) return;
      var key = n.__boundaryOnly ? "" : (n.__sectionKey || keyOf(n));
      var texts = [];
      for (var k = i + 1; k < nodes.length && nodes[k] && (nodes[k].__isBody || nodes[k].__keepInRun); k++) {
        if (nodes[k].__isBody && String(nodes[k].__text || "").trim() !== "") texts.push(nodes[k].__text);
      }
      into.push({ key: key, title: n.__headingText, level: n.__headingLevel, boundary: !!n.__boundaryOnly,
                  repeat: !!n.__noProse, targetName: n.__targetName || "", texts: texts });
    });
    return into;
  }

  window.App.ReportSections = {
    sectionKey: sectionKey,
    applyOrder: applyOrder,
    patchSection: patchSection,
    applyOverrides: applyOverrides,
    probeSections: probeSections
  };
})();
