/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* review-core.js
 *
 * The rules of a review, shared by the tools that write packs and read review
 * files (the assessment and risk tools) and the tool that does the opposite
 * (the report review tool). The canonical copy is shared/review-core.js;
 * tools/sync-shared.ps1 copies it to js/review-core.js in each module.
 *
 * It reads the two contracts (App.Data.contracts.reviewPack and .reviewFile,
 * generated from contracts/ by each module's build-data.ps1) and holds nothing
 * about any one tool. A tool keeps one store per assessment:
 *
 *   {
 *     reviewId,
 *     rounds:  [{ round, packId, createdAt, documents: [{ title, targetName, contentHash }], request, fieldLabels }],
 *     files:   [{ fileId, packId, round, reviewer, savedAt, importedAt, verdict, checklist, checklistTotal,
 *                 dismissedChecks, dismissedCheckTitles, confirmations }],
 *     threads: [{ comment, round, savedAt, fileId, status, reason, statusAt, replies, confirmedBy, withdrawn,
 *                 accepted, reopened }]
 *   }
 *
 * `comment` is the reviewer's, and an import may replace it (their later save
 * wins). Everything else on a thread is the author's, with one exception: when
 * the reviewer changes what a closed comment says (its severity, text or
 * suggested wording), the import opens it again and keeps the author's earlier
 * decision in `reopened`, so a point the reviewer escalated is never left
 * hidden as resolved. `accepted` is written by the tool's Accept:
 * { at, kind, revert, applied }, where revert is what undoing it needs.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  // help: what each severity means, shown to the reviewer as they choose and
  // to the author on the comments list.
  var SEVERITIES = [
    { id: "must-fix", label: "Must fix", help: "Wrong, misleading, or not fit to send to the client. The author's Issue check warns while any are open." },
    { id: "should-fix", label: "Should fix", help: "Weakens the report. The author should change it unless there is a good reason not to." },
    { id: "suggestion", label: "Suggestion", help: "An improvement the author can take or leave." }
  ];
  var STATUSES = { open: "Open", resolved: "Resolved", wontchange: "Won't change" };
  var VERDICTS = {
    none: "No verdict yet",
    approved: "Approved",
    "approved-with-comments": "Approved with comments",
    "changes-requested": "Changes requested"
  };

  function contract(name) {
    var c = window.App.Data && window.App.Data.contracts && window.App.Data.contracts[name];
    if (!c) throw new Error("The review contract " + name + " is not loaded.");
    return c;
  }
  function packSchema() { return contract("reviewPack").schema; }
  function fileSchema() { return contract("reviewFile").schema; }

  // Unique enough to merge by, across reviewers on different machines: the
  // time, then random bits from the browser's own generator.
  function newId(prefix) {
    var bits = "";
    try {
      var a = new Uint32Array(2);
      window.crypto.getRandomValues(a);
      bits = a[0].toString(36) + a[1].toString(36);
    } catch (e) {
      bits = Math.floor(Math.random() * 1e12).toString(36) + Math.floor(Math.random() * 1e12).toString(36);
    }
    return prefix + "-" + Date.now().toString(36) + "-" + bits;
  }

  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  // A save's time as a number, for ordering saves. A missing or unreadable
  // stamp is the oldest, never (as a string would be) later than every date.
  function stamp(x) { var t = Date.parse(x || ""); return isNaN(t) ? 0 : t; }

  // ---- reading files --------------------------------------------------------

  function parseJson(text) {
    try { return JSON.parse(String(text).replace(/^﻿/, "")); } catch (e) { return null; }
  }

  // { ok, kind: "pack"|"review", data, error }. What kind of file this is, or
  // why it is being refused. A file of another schema is never guessed at.
  function identify(text) {
    var t = String(text || "");
    // The mistakes people make: the Word or Excel report (a zip) or a PDF of
    // it, in place of the pack.
    if (/^PK/.test(t)) return { ok: false, error: "This is a Word or Excel file. Open the review pack (.json) the author sent, not the report itself." };
    if (/^%PDF/.test(t)) return { ok: false, error: "This is a PDF. Open the review pack (.json) the author sent, not the report itself." };
    var d = parseJson(t);
    if (!d || typeof d !== "object") return { ok: false, error: "This is not a review pack or a review file: it could not be read." };
    var s = d.schema;
    if (contract("reviewPack").acceptedSchemas.indexOf(s) !== -1) return checkPack(d);
    if (contract("reviewFile").acceptedSchemas.indexOf(s) !== -1) return checkFile(d);
    if (typeof s === "string" && /^spt-review-pack\//.test(s)) {
      return { ok: false, error: "This review pack is " + s + ", and this copy of the tool reads " + contract("reviewPack").acceptedSchemas.join(" or ") + ". Use the same version of the tools as the author." };
    }
    if (typeof s === "string" && /^spt-review\//.test(s)) {
      return { ok: false, error: "This review file is " + s + ", and this copy of the tool reads " + contract("reviewFile").acceptedSchemas.join(" or ") + ". Use the same version of the tools as the reviewer." };
    }
    return { ok: false, error: "This is not a review pack or a review file" + (s ? " (it says it is " + s + ")" : "") + "." };
  }
  function checkPack(d) {
    if (!d || contract("reviewPack").acceptedSchemas.indexOf(d.schema) === -1) return { ok: false, error: "This is not a review pack." };
    if (!d.packId || !Array.isArray(d.documents) || !d.documents.length) return { ok: false, error: "This review pack is incomplete: it holds no documents." };
    if (!d.engagement || typeof d.engagement !== "object") return { ok: false, error: "This review pack is incomplete: it has no engagement details. Ask the author to send it again." };
    if (d.documents.some(function (x) { return !x || !Array.isArray(x.blocks); })) return { ok: false, error: "This review pack is incomplete: a document in it has no report text. Ask the author to send it again." };
    return { ok: true, kind: "pack", data: d };
  }
  function checkFile(d) {
    if (!d || contract("reviewFile").acceptedSchemas.indexOf(d.schema) === -1) return { ok: false, error: "This is not a review file." };
    if (!d.packId || !Array.isArray(d.comments)) return { ok: false, error: "This review file is incomplete: it names no pack, or holds no comment list." };
    if (d.comments.some(function (c) { return !c || typeof c !== "object" || !c.id || !c.anchor || typeof c.anchor !== "object"; })) {
      return { ok: false, error: "This review file is damaged: some of its comments cannot be read." };
    }
    return { ok: true, kind: "review", data: d };
  }

  // ---- the author's store ----------------------------------------------------

  function emptyStore() { return { reviewId: newId("rv"), rounds: [], files: [], threads: [] }; }
  function normaliseStore(s) {
    s = s && typeof s === "object" ? s : emptyStore();
    if (!s.reviewId) s.reviewId = newId("rv");
    ["rounds", "files", "threads"].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    return s;
  }
  function lastRound(store) { return store.rounds.length ? store.rounds[store.rounds.length - 1] : null; }
  function roundOfPack(store, packId) { return store.rounds.filter(function (r) { return r.packId === packId; })[0] || null; }
  function findThread(store, id) { return store.threads.filter(function (t) { return t.comment.id === id; })[0] || null; }

  // What the next pack is: the same round while nothing has moved (the content
  // is as sent and nothing has come back for it, so a reviewer's file stays
  // good), otherwise a new round with a new pack id.
  function nextRound(store, docs) {
    var last = lastRound(store);
    if (!last) return { round: 1, packId: newId("rp"), isNew: true };
    var same = last.documents.length === docs.length && docs.every(function (d, i) { return d.contentHash === last.documents[i].contentHash; });
    var hasFiles = store.files.some(function (f) { return f.packId === last.packId; });
    if (same && !hasFiles) return { round: last.round, packId: last.packId, isNew: false };
    return { round: last.round + 1, packId: newId("rp"), isNew: true };
  }

  // Records a pack that has been written, with the author's note to the
  // reviewers when there is one, and the pack's own names for an item's fields
  // (so the comments list can say "threat source" where a pack says so).
  function recordRound(store, pack) {
    var entry = { round: pack.round, packId: pack.packId, createdAt: pack.createdAt,
      documents: pack.documents.map(function (d) { return { title: d.title, targetName: d.targetName, contentHash: d.contentHash }; }) };
    var rq = pack.request;
    if (rq && (norm(rq.note) || norm(rq.neededBy))) entry.request = { note: String(rq.note || "").trim(), neededBy: norm(rq.neededBy) };
    var fl = pack.engagement && pack.engagement.fieldLabels;
    if (fl && typeof fl === "object") entry.fieldLabels = JSON.parse(JSON.stringify(fl));
    var last = lastRound(store);
    if (last && last.packId === pack.packId) store.rounds[store.rounds.length - 1] = entry;
    else store.rounds.push(entry);
    return entry;
  }

  // What a pack carries of the rounds before it, so a reviewer can confirm a fix.
  function previousRound(store) {
    return {
      comments: store.threads.filter(function (t) { return !t.withdrawn; }).map(function (t) {
        return { comment: t.comment, status: t.status, reason: t.reason || "", replies: t.replies || [], round: t.round, confirmedBy: t.confirmedBy || [] };
      }),
      verdicts: store.files.filter(function (f) { return f.verdict && f.verdict.value && f.verdict.value !== "none"; }).map(function (f) {
        return { reviewer: f.reviewer, round: f.round, value: f.verdict.value, date: f.verdict.date || "", note: f.verdict.note || "" };
      })
    };
  }

  // ---- merging a review file in ---------------------------------------------

  // What a comment says, for telling a real change from a re-save.
  function substance(c) { return JSON.stringify([c.severity || "", norm(c.text), norm(c.suggestion || "")]); }

  // Merges one parsed review file. Never throws for a bad file: returns
  //   { ok: false, error } or { ok: true, reviewer, round, added, updated, reopened, removed, duplicate, older }
  function importFile(store, file) {
    var chk = checkFile(file);
    if (!chk.ok) return chk;
    var OLDER_COPY = " If you sent this pack from an older copy of the project, import the pack file here first, then the review files.";
    if (!store.rounds.length) return { ok: false, noPack: true, error: "No pack has been sent from here, so this review file has nothing to attach to. Open the assessment or risk project it was reviewed from." + OLDER_COPY };
    var round = roundOfPack(store, file.packId);
    if (!round) {
      return { ok: false, noPack: true, error: "This review file answers a different pack" + (file.reviewer ? " (from " + file.reviewer + ", round " + (file.round || "?") + ")" : "") + ", not one sent from here." + OLDER_COPY };
    }
    var fileId = file.fileId || (file.packId + "|" + norm(file.reviewer));
    var res = { ok: true, reviewer: file.reviewer || "Reviewer", round: round.round, added: 0, updated: 0, reopened: 0, removed: 0, duplicate: false, older: false, verdict: (file.verdict && file.verdict.value) || "none" };
    var rec = store.files.filter(function (f) { return f.fileId === fileId; })[0];
    // The same file saved under another name (a handover, or a reviewer who
    // corrected their name): said in the import line.
    if (rec && norm(rec.reviewer) && norm(rec.reviewer).toLowerCase() !== norm(res.reviewer).toLowerCase()) res.renamedFrom = rec.reviewer;
    if (rec && (rec.savedAt === file.savedAt || (stamp(rec.savedAt) && stamp(rec.savedAt) === stamp(file.savedAt)))) { res.duplicate = true; return res; }
    if (rec && stamp(rec.savedAt) > stamp(file.savedAt)) { res.older = true; return res; }

    var seen = {};
    file.comments.forEach(function (c) {
      if (!c || !c.id) return;
      seen[c.id] = true;
      var t = findThread(store, c.id);
      if (!t) {
        store.threads.push({ comment: c, round: round.round, savedAt: file.savedAt, fileId: fileId, status: "open", reason: "", replies: [], confirmedBy: [] });
        res.added++;
      } else if (stamp(t.savedAt) <= stamp(file.savedAt)) {
        if (JSON.stringify(t.comment) !== JSON.stringify(c)) res.updated++;
        // The reviewer changed what a closed comment says: it is open again,
        // and the author's earlier decision is kept to show beside it.
        if (t.status !== "open" && substance(t.comment) !== substance(c)) {
          t.reopened = { from: t.status, reason: t.reason || "", at: new Date().toISOString() };
          t.status = "open"; t.reason = ""; t.statusAt = t.reopened.at;
          res.reopened++;
        }
        t.comment = c; t.savedAt = file.savedAt; t.withdrawn = false;
      }
    });
    // A comment this reviewer has since deleted from their own file goes,
    // unless the author has already answered it, when it stays, marked.
    store.threads = store.threads.filter(function (t) {
      if (t.fileId !== fileId || t.round !== round.round || seen[t.comment.id]) return true;
      if ((t.replies && t.replies.length) || t.status !== "open") { t.withdrawn = true; return true; }
      res.removed++;
      return false;
    });
    // A confirmation this same file made before and has now taken back goes,
    // unless another of the reviewer's files still makes it. A later round's
    // file does not repeat an earlier round's confirmations, so only this
    // file's own earlier save is compared.
    var nowConfirmed = {};
    (file.confirmations || []).forEach(function (c) { if (c && c.commentId) nowConfirmed[c.commentId] = true; });
    if (rec) (rec.confirmations || []).forEach(function (c) {
      if (!c || nowConfirmed[c.commentId]) return;
      var t = findThread(store, c.commentId);
      if (!t || !t.confirmedBy) return;
      var elsewhere = store.files.some(function (f) {
        return f.fileId !== fileId && f.reviewer === res.reviewer &&
          (f.confirmations || []).some(function (x) { return x && x.commentId === c.commentId; });
      });
      if (!elsewhere) t.confirmedBy = t.confirmedBy.filter(function (n) { return n !== res.reviewer; });
    });
    (file.confirmations || []).forEach(function (c) {
      var t = c && findThread(store, c.commentId);
      if (!t) return;
      t.confirmedBy = t.confirmedBy || [];
      if (t.confirmedBy.indexOf(res.reviewer) === -1) t.confirmedBy.push(res.reviewer);
    });
    var titles = {};
    if (file.dismissedCheckTitles && typeof file.dismissedCheckTitles === "object") {
      Object.keys(file.dismissedCheckTitles).forEach(function (k) {
        if (typeof file.dismissedCheckTitles[k] === "string") titles[k] = file.dismissedCheckTitles[k];
      });
    }
    var entry = { fileId: fileId, packId: file.packId, round: round.round, reviewer: res.reviewer, savedAt: file.savedAt,
      importedAt: new Date().toISOString(), verdict: file.verdict || { value: "none" }, checklist: file.checklist || [],
      checklistTotal: Number(file.checklistTotal) || null,
      dismissedChecks: Array.isArray(file.dismissedChecks) ? file.dismissedChecks.slice() : [],
      dismissedCheckTitles: titles,
      confirmations: file.confirmations || [] };
    if (rec) store.files[store.files.indexOf(rec)] = entry; else store.files.push(entry);
    return res;
  }

  // Registers a pack this assessment sent from an older copy of the project
  // (the round was sent, then the project closed unsaved), so its review
  // files can be imported. matches: the tool's own word that the pack is for
  // this assessment (same instrument and client). Returns
  //   { ok: false, error } or { ok: true, already, round }.
  function adoptPack(store, pack, matches) {
    var chk = checkPack(pack);
    if (!chk.ok) return chk;
    var e = pack.engagement || {};
    if (!matches) {
      return { ok: false, error: "This pack is for " + (e.client || "another client") + (e.instrumentTitle ? ", " + e.instrumentTitle : "") + ", not this assessment." };
    }
    var have = roundOfPack(store, pack.packId);
    if (have) return { ok: true, already: true, round: have };
    if (store.rounds.length && pack.reviewId && store.reviewId !== pack.reviewId) {
      return { ok: false, error: "This pack belongs to a different review of this assessment, so it cannot be added to this one." };
    }
    if (!store.rounds.length && pack.reviewId) store.reviewId = pack.reviewId;
    var entry = recordRound({ reviewId: store.reviewId, rounds: [], files: [], threads: [] }, pack);
    store.rounds.push(entry);
    store.rounds.sort(function (a, b) { return (a.round - b.round) || (stamp(a.createdAt) - stamp(b.createdAt)); });
    return { ok: true, already: false, round: entry };
  }

  // ---- the author's actions --------------------------------------------------

  // { ok, error }. A reason is required for "won't change".
  function setStatus(store, id, status, reason) {
    var t = findThread(store, id);
    if (!t) return { ok: false, error: "That comment is not in this review." };
    if (!STATUSES[status]) return { ok: false, error: "Unknown status." };
    if (status === "wontchange" && !norm(reason)) return { ok: false, error: "Say why it will not change." };
    t.status = status;
    t.reason = status === "wontchange" ? norm(reason) : "";
    t.statusAt = new Date().toISOString();
    delete t.reopened;   // the author has answered the change
    return { ok: true };
  }
  function addReply(store, id, author, text) {
    var t = findThread(store, id);
    if (!t) return { ok: false, error: "That comment is not in this review." };
    if (!norm(text)) return { ok: false, error: "Write the reply first." };
    t.replies = t.replies || [];
    var r = { id: newId("r"), author: author || "Author", at: new Date().toISOString(), text: String(text).trim() };
    t.replies.push(r);
    return { ok: true, reply: r };
  }

  // ---- where the review stands ------------------------------------------------

  // The verdicts to act on: those of the latest round that has any files back.
  function latestVerdicts(store) {
    var withFiles = store.rounds.slice().reverse().filter(function (r) {
      return store.files.some(function (f) { return f.packId === r.packId; });
    })[0];
    if (!withFiles) return { round: null, files: [] };
    return { round: withFiles, files: store.files.filter(function (f) { return f.packId === withFiles.packId; }) };
  }
  function isApproval(v) { return v === "approved" || v === "approved-with-comments"; }
  function openMustFix(store) {
    return store.threads.filter(function (t) { return !t.withdrawn && t.status === "open" && t.comment.severity === "must-fix"; });
  }
  function names(list) {
    if (list.length < 2) return list.join("");
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }

  // The warnings a tool's Issue check and export dialog show. They only warn:
  // nothing here stops a final going out, so a lone contractor is never stuck.
  // currentHashes: the current documents' content hashes, or null while they
  // are not yet known (the "changed since approval" line waits for them).
  // opts (optional): { qaReviewBy }. With nothing ever sent and QA review by
  // filled in, the report was reviewed outside the tools: no "not reviewed".
  function warnings(store, currentHashes, opts) {
    store = normaliseStore(store);
    var out = [];
    var latest = latestVerdicts(store), last = lastRound(store);
    if (!store.files.length) {
      if (last || !(opts && norm(opts.qaReviewBy))) {
        out.push({ kind: "not-reviewed", text: last
          ? "Not reviewed yet: round " + last.round + " was sent, and no review has come back."
          : "Not reviewed yet: no review has come back for this report." });
      }
    } else if (last && !store.files.some(function (f) { return f.packId === last.packId; })) {
      out.push({ kind: "not-reviewed", text: "Round " + last.round + " was sent, and no review has come back for it yet." });
    }
    var requested = latest.files.filter(function (f) { return f.verdict && f.verdict.value === "changes-requested"; });
    if (requested.length) {
      out.push({ kind: "changes-requested", text: "Changes requested by " + names(requested.map(function (f) { return f.reviewer; })) + " (round " + latest.round.round + ")." });
    }
    // A reviewer who asked for changes in an earlier round and has not
    // answered a later one still stands: one quicker reviewer's approval of
    // the next round does not speak for them.
    var byReviewer = {};
    store.files.forEach(function (f) {
      var k = norm(f.reviewer).toLowerCase() || f.fileId;
      var cur = byReviewer[k];
      if (!cur || f.round > cur.round || (f.round === cur.round && stamp(f.savedAt) > stamp(cur.savedAt))) byReviewer[k] = f;
    });
    var waiting = Object.keys(byReviewer).map(function (k) { return byReviewer[k]; }).filter(function (f) {
      return latest.round && f.round < latest.round.round && f.verdict && f.verdict.value === "changes-requested";
    });
    waiting.forEach(function (f) {
      out.push({ kind: "changes-requested", text: "Changes requested by " + f.reviewer + " in round " + f.round + "; " + f.reviewer + " has not reviewed round " + latest.round.round + " yet." });
    });
    var must = openMustFix(store).length;
    if (must) out.push({ kind: "must-fix", count: must, text: plural(must, "must-fix review comment") + (must === 1 ? " is" : " are") + " still open." });
    var approvers = latest.files.filter(function (f) { return f.verdict && isApproval(f.verdict.value); });
    if (approvers.length && !requested.length && !waiting.length && currentHashes && latest.round) {
      var was = latest.round.documents.map(function (d) { return d.contentHash; });
      var same = was.length === currentHashes.length && was.every(function (h, i) { return h === currentHashes[i]; });
      if (!same) out.push({ kind: "changed-since-approval", text: "Approved by " + names(approvers.map(function (f) { return f.reviewer; })) + " in round " + latest.round.round + ", but the report has changed since." });
    }
    return out;
  }

  // ---- saving a text file, wherever the page may ask for a dialog ------------

  function inForeignFrame() {
    try { return window.top !== window.self && !window.top.location.href; } catch (e) { return true; }
  }
  function downloadText(text, name) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  // Writes a new file (a pack): the save dialog where the browser gives one,
  // otherwise a download. cb({ ok, method, name, handle, aborted, error }).
  function saveNewFile(text, name, description, cb) {
    function dl(blocked) { downloadText(text, name); cb({ ok: true, method: "download", name: name, blocked: !!blocked }); }
    if (typeof window.showSaveFilePicker !== "function" || inForeignFrame()) { dl(inForeignFrame()); return; }
    window.showSaveFilePicker({ suggestedName: name, types: [{ description: description, accept: { "application/json": [".json"] } }] })
      .then(function (h) {
        return h.createWritable().then(function (w) {
          return w.write(text).then(function () { return w.close(); });
        }).then(function () { cb({ ok: true, method: "file", name: h.name, handle: h }); });
      }, function (e) {
        if (e && e.name === "SecurityError") { dl(true); return; }
        cb({ ok: false, aborted: !!(e && e.name === "AbortError"), error: e && e.message });
      })
      .catch(function (e) { cb({ ok: false, error: e && e.message }); });
  }
  function fileSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "report"; }

  function copyText(text, cb) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var done = false;
      try { done = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      cb(done);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { cb(true); }, fallback);
    } else fallback();
  }

  window.App.ReviewCore = {
    SEVERITIES: SEVERITIES, STATUSES: STATUSES, VERDICTS: VERDICTS,
    packSchema: packSchema, fileSchema: fileSchema,
    newId: newId, norm: norm, plural: plural, stamp: stamp,
    parseJson: parseJson, identify: identify, checkPack: checkPack, checkFile: checkFile,
    emptyStore: emptyStore, normaliseStore: normaliseStore, lastRound: lastRound, roundOfPack: roundOfPack, findThread: findThread,
    nextRound: nextRound, recordRound: recordRound, previousRound: previousRound,
    importFile: importFile, adoptPack: adoptPack, setStatus: setStatus, addReply: addReply,
    latestVerdicts: latestVerdicts, isApproval: isApproval, openMustFix: openMustFix, warnings: warnings,
    saveNewFile: saveNewFile, downloadText: downloadText, inForeignFrame: inForeignFrame, fileSlug: fileSlug, copyText: copyText
  };
})();
