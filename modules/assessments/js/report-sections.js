/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* report-sections.js
 *
 * What a consultant's section override means, in one place, so the assessment
 * tool and the risk tool cannot drift apart: how a section is keyed, how a
 * stored order applies, how a store is patched, and the pass that applies the
 * overrides to a Word document's heading tree. The canonical copy is
 * shared/report-sections.js; tools/sync-shared.ps1 copies it into both tools.
 *
 * A store is { <sectionKey>: { title, hidden, prose, order, paragraphs } }, plus
 * whatever a tool keeps beside those fields (the assessment tool's glossary
 * terms). paragraphs is a list of { from, to, at }: one paragraph of the
 * section's opening, as generated (from), reworded (to) when a review
 * suggestion was accepted on it. It is optional and additive: a store without
 * it reads as before, and a build that does not know it ignores it.
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
 *   __placeholder   a red prompt still to be answered (on a paragraph, or on a
 *                   run inside one); the probe counts those a rewrite of the
 *                   opening run would take out
 *   __replaces      set by the pass: the generated text this paragraph was
 *                   printed in place of (a paragraph replacement that applied)
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

  // ---- one paragraph of a section's opening, reworded ----------------------
  //
  // An accepted review suggestion replaces the one paragraph it is on, and
  // leaves the rest of the opening as generated: the figures in the other
  // paragraphs keep updating, and the consultant's input still prints. The
  // paragraph is found by its generated text (from). When nothing in the
  // opening reads that any more, the replacement does not apply and the
  // generated text prints: it is never a deletion. paragraphStatus says which
  // apply, so the author can be told.
  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function linesOf(text) {
    return String(text == null ? "" : text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  }
  function paragraphsOf(c) {
    return (c && Array.isArray(c.paragraphs) ? c.paragraphs : []).filter(function (p) {
      return p && typeof p === "object" && norm(p.from) !== "" && norm(p.to) !== "";
    });
  }
  function paragraphFor(list, from) {
    var f = norm(from);
    return paragraphsOf({ paragraphs: list }).filter(function (p) { return norm(p.from) === f; })[0] || null;
  }
  // A new list with the replacement for one generated paragraph set, or taken
  // out (to null or empty, or the same words as from: nothing is stored for
  // wording that is as generated). The list given is not changed.
  function setParagraph(list, from, to, at) {
    var f = norm(from), out = paragraphsOf({ paragraphs: list }).filter(function (p) { return norm(p.from) !== f; });
    if (f && norm(to) !== "" && norm(to) !== f) out.push({ from: f, to: linesOf(to).join("\n"), at: at || new Date().toISOString() });
    return out;
  }
  // Lines of opening wording with the replacements put in: what prints when
  // there is no whole-run rewrite. For an editor that starts from the text as
  // printed.
  function applyParagraphs(texts, list) {
    var out = [];
    (texts || []).forEach(function (t) {
      var p = paragraphFor(list, t);
      if (p) out = out.concat(linesOf(p.to)); else out.push(t);
    });
    return out;
  }
  // Where each stored replacement stands, against what the build's probes say
  // printed (one list of probeSections rows per document):
  //   applied    a paragraph was printed in its place
  //   hidden     its section is hidden, so nothing of it prints
  //   rewritten  the opening has a whole-run rewrite, which comes first
  //   changed    no paragraph of the opening reads its `from` any more
  function paragraphStatus(custom, probes) {
    var out = [];
    Object.keys(custom || {}).forEach(function (key) {
      var c = custom[key];
      paragraphsOf(c).forEach(function (p) {
        var title = "", applied = false, repeat = false;
        (probes || []).forEach(function (probe) {
          (probe || []).forEach(function (s) {
            if (s.key !== key) return;
            if (!title) title = s.title || "";
            if (s.repeat) repeat = true;
            if ((s.from || []).some(function (f) { return f != null && norm(f) === norm(p.from); })) applied = true;
          });
        });
        out.push({ key: key, title: title, from: p.from, to: p.to, at: p.at || "",
          state: c.hidden ? "hidden" : applied ? "applied" : (c.prose && !repeat) ? "rewritten" : "changed" });
      });
    });
    return out;
  }
  // What the author is told about a replacement that is not in the report.
  // Null for one that is.
  var PARAGRAPH_NOTES = {
    changed: "No longer applies: the text it replaced has changed.",
    hidden: "Not printed: its section is hidden.",
    rewritten: "Does not apply: the opening of its section has since been rewritten as a whole."
  };
  function paragraphNote(state) { return PARAGRAPH_NOTES[state] || null; }

  // The overrides, applied over the document's heading tree.
  //
  //   hidden  the heading and everything under it, up to the next heading of
  //           the same or a higher level, is dropped. On screen it is only
  //           dimmed: the consultant still has to be able to put it back.
  //   title   the heading is rebuilt with the new text at the same level.
  //   prose   the run of body paragraphs OPENING the section is replaced.
  //           Tables, charts and bullets are left alone: prose is the part that
  //           is a judgement call, the numbers are not.
  //   paragraphs  only without a prose rewrite: a paragraph of the opening run
  //           whose text is a replacement's `from` is printed as its `to`, one
  //           paragraph per line. Every other paragraph, a red prompt, a pinned
  //           statement and everything below the run are left as generated.
  //
  // hooks:
  //   keyOf(node)              the section key of a tagged heading
  //   heading(node, title)     a heading like this one, with this text
  //   body(line)               a body paragraph for one line of prose, or null
  //                            to leave the line out
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
            var made = line.trim() !== "" ? hooks.body(line.trim()) : null;
            if (made) paras.push(made);
          });
          section = paras.concat(pinned).concat(section);
        } else if (c && paragraphsOf(c).length) {
          // One paragraph at a time. A paragraph that carries a red prompt is
          // never replaced: the prompt would go unanswered and uncounted.
          var done = [], r = 0;
          for (; r < section.length && section[r] && (section[r].__isBody || section[r].__keepInRun); r++) {
            var node = section[r];
            var swap = node.__isBody && !hasPrompt(node) ? paragraphFor(c.paragraphs, node.__text) : null;
            var made = swap ? replacement(swap, hooks) : [];
            if (made.length) done = done.concat(made); else done.push(node);
          }
          section = done.concat(section.slice(r));
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

  // The paragraphs a replacement prints, each tagged with what it replaced.
  function replacement(p, hooks) {
    var made = [];
    linesOf(p.to).forEach(function (line) {
      var b = hooks.body(line);
      if (b) { b.__replaces = p.from; made.push(b); }
    });
    return made;
  }

  // Does a node print a red prompt: tagged on the paragraph itself, or on a run
  // inside it (the library keeps a paragraph's children on .root).
  function hasPrompt(n) {
    if (!n || typeof n !== "object") return false;
    if (n.__placeholder) return true;
    return Array.isArray(n.root) && n.root.some(hasPrompt);
  }

  // For a review and a preview: the wording that opens each section of a list of
  // nodes, { key, title, level, boundary, repeat, targetName, texts, from, prompts }
  // once per heading, by the same rule applyOverrides uses to decide what a prose
  // override replaces. prompts counts the red prompts in that run which a rewrite
  // would take out (one kept by __keepInRun is not counted: it stays). from runs
  // beside texts: the generated text a paragraph was printed in place of, or
  // null for one printed as generated. A renamed heading carries its key in
  // __sectionKey. The nodes are only read.
  function probeSections(nodes, keyOf, into) {
    (nodes || []).forEach(function (n, i) {
      if (!n || !n.__headingLevel || n.__headingText == null) return;
      var key = n.__boundaryOnly ? "" : (n.__sectionKey || keyOf(n));
      var texts = [], from = [], prompts = 0;
      for (var k = i + 1; k < nodes.length && nodes[k] && (nodes[k].__isBody || nodes[k].__keepInRun); k++) {
        if (nodes[k].__isBody && String(nodes[k].__text || "").trim() !== "") {
          texts.push(nodes[k].__text);
          from.push(nodes[k].__replaces != null ? nodes[k].__replaces : null);
        }
        if (nodes[k].__isBody && hasPrompt(nodes[k])) prompts++;
      }
      into.push({ key: key, title: n.__headingText, level: n.__headingLevel, boundary: !!n.__boundaryOnly,
                  repeat: !!n.__noProse, targetName: n.__targetName || "", texts: texts, from: from, prompts: prompts });
    });
    return into;
  }

  window.App.ReportSections = {
    sectionKey: sectionKey,
    applyOrder: applyOrder,
    patchSection: patchSection,
    applyOverrides: applyOverrides,
    probeSections: probeSections,
    paragraphsOf: paragraphsOf,
    paragraphFor: paragraphFor,
    setParagraph: setParagraph,
    applyParagraphs: applyParagraphs,
    paragraphStatus: paragraphStatus,
    paragraphNote: paragraphNote
  };
})();
