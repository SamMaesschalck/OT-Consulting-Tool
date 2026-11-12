/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* storage.js: App.DocStorage, the project file, the file Save writes back to
 * and the autosave copy (docs/document-tool-design.md 5.2, 5.9).
 *
 * The file half follows modules/assessments/js/storage.js: Save writes in
 * place through the File System Access API where the browser allows it and
 * downloads otherwise. The handle is kept WITH the id of the document it
 * belongs to and is used for no other. It is kept in memory only: every way a
 * document arrives either adopts a handle the user has just chosen or forgets
 * the one there was (5.9), so a handle remembered from an earlier session
 * could never be used, and not keeping one means it can never be misused.
 *
 * The autosave copy is wholly in IndexedDB, behind bytesStore: localStorage
 * is about 5 MB for the whole origin and is shared with the other tools.
 * localStorage holds one small pointer per copy, which is all the offer on
 * start reads. No caller waits for the store: every call is fire-and-forget
 * with its failure handled, and a store that fails only switches autosave off.
 */
(function () {
  "use strict";
  window.App = window.App || {};
  var A = window.App;

  function self() { return A.DocStorage; }
  function isBlob(b) { return !!b && typeof b.size === "number" && typeof b.arrayBuffer === "function"; }

  // ---------- the project file ----------
  var fileHandle = null, fileHandleId = null;
  // Open and Save share one remembered folder: where this person keeps documents.
  var PICKER_ID = "spt-document";
  var FILE_TYPES = [{ description: "Document file", accept: { "application/json": [".json"] } }];

  // The browser refuses the file dialogs to a page framed by a page of
  // another origin (the suite's folder build). There the tool saves by
  // download and loads through the file input.
  function inForeignFrame() {
    try { return window.top !== window.self && !window.top.location.href; } catch (e) { return true; }
  }
  function supportsFilePickers() { return typeof window.showSaveFilePicker === "function" && !inForeignFrame(); }
  function canPick() { return supportsFilePickers() && typeof window.showOpenFilePicker === "function"; }

  function ensureWritePermission(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    return handle.queryPermission({ mode: "readwrite" }).then(function (p) {
      if (p === "granted") return true;
      return handle.requestPermission({ mode: "readwrite" }).then(function (p2) { return p2 === "granted"; });
    }).catch(function () { return false; });
  }
  // The project file is JSON. A handle to anything else (the Word file an
  // import was read from, above all) is never kept and never written.
  function isProjectName(name) { return /\.json$/i.test(String(name || "")); }

  // Called once a load has gone through, never before: a file that failed to
  // load must not become the file Save writes over.
  function adopt(handle, docId) {
    if (!handle || !docId || !isProjectName(handle.name)) { forget(); return false; }
    fileHandle = handle; fileHandleId = docId;
    return true;
  }
  function forget() { fileHandle = null; fileHandleId = null; }
  function currentName() { return fileHandle ? fileHandle.name : ""; }

  function suggestedName(doc) {
    var info = (doc && doc.info) || {};
    var name = [String(info.title || "").trim() || "Untitled document", String(info.revision || "").trim()].filter(Boolean).join(" ");
    // What Windows will not have in a file name, and a trailing dot or space.
    name = name.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120).replace(/[. ]+$/, "");
    return (name || "Untitled document") + ".json";
  }

  // As the model makes one (it keeps its own to itself).
  function newDocId() {
    var M = A.DocModel;
    if (M && typeof M.newDocId === "function") return M.newDocId();
    return "doc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }

  // Resolves { name, how: "file" or "download", handle?, blocked? }, or null
  // when the user closed the save dialog. Rejects only when the file could
  // not be written. It is never refused for size (3.5).
  //
  // The dialog is asked for before the file is built: the browser opens it
  // only in answer to a recent click, and building a large file takes time.
  //
  // opts.onSnapshot is called at the moment the text of the document is
  // taken for the file: what is changed after it is not in the file.
  //
  // A document saved into ANOTHER file than the one it is in (Save as under a
  // new name, or the first save of a file that was loaded without its handle)
  // becomes a document of its own: the new file is written with a new id, and
  // the document in memory takes that id once the file is written. The result
  // then carries oldId. Two files with one id would share one autosave copy,
  // and each would be taken for the other. opts.fromName is the name of the
  // file the document was loaded from, where no handle came with it. A
  // document that has never been in a file keeps its id, and so does every
  // save by download (there is no telling which file a download becomes).
  function save(doc, opts) {
    opts = opts || {};
    var M = A.DocModel, V = A.Version || {}, name = suggestedName(doc);
    function build() {
      doc.savedAt = new Date().toISOString();
      doc.savedBy = { product: (A.Product && A.Product.name) || "", version: V.number || "" };
      if (typeof opts.onSnapshot === "function") opts.onSnapshot();
      return M.toFile(doc);
    }
    // The file with another id in it. The model reads the id as it starts,
    // before anything is awaited, so the document in memory keeps its own id
    // until the file is known to be written.
    function buildAs(id) {
      var mine = doc.id;
      doc.id = id;
      try { return build(); } finally { doc.id = mine; }
    }
    function sameName(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }
    // Resolves true when the file chosen is another file than the one this
    // document is in.
    function another(handle) {
      var mine = fileHandle && fileHandleId === doc.id ? fileHandle : null;
      if (mine === handle) return Promise.resolve(false);
      if (mine) {
        if (typeof mine.isSameEntry !== "function") return Promise.resolve(!sameName(mine.name, handle.name));
        try {
          return Promise.resolve(mine.isSameEntry(handle)).then(function (same) { return !same; }, function () { return !sameName(mine.name, handle.name); });
        } catch (e) { return Promise.resolve(!sameName(mine.name, handle.name)); }
      }
      return Promise.resolve(!!opts.fromName && !sameName(opts.fromName, handle.name));
    }
    function byDownload(blocked) {
      return build().then(function (blob) {
        self().download(blob, name);
        return { name: name, how: "download", blocked: !!blocked };
      });
    }
    function writeTo(handle) {
      if (!isProjectName(handle.name)) return Promise.reject(new Error("A document file is saved as .json. Choose a name ending in .json."));
      var newId = null;
      return ensureWritePermission(handle).then(function (granted) {
        if (!granted) throw new Error("The browser did not give permission to write the file.");
        return another(handle);
      }).then(function (other) {
        if (!other) return build();
        newId = newDocId();
        return buildAs(newId);
      }).then(function (blob) {
        return handle.createWritable().then(function (w) { return w.write(blob).then(function () { return w.close(); }); });
      }).then(function () {
        var was = doc.id;
        if (newId) doc.id = newId;
        fileHandle = handle; fileHandleId = doc.id;
        return { name: handle.name, how: "file", handle: handle, oldId: newId ? was : null };
      });
    }
    function pick() {
      var o = { id: PICKER_ID, suggestedName: name, types: FILE_TYPES, excludeAcceptAllOption: true };
      // Given a file, the dialog opens in that file's folder.
      if (fileHandle) o.startIn = fileHandle;
      function ask(options, retry) {
        return window.showSaveFilePicker(options).then(writeTo, function (e) {
          if (e && e.name === "AbortError") return null;
          // Refused for a security reason (a frame, or the click has
          // expired): the work still has to reach a file.
          if (e && e.name === "SecurityError") return byDownload(true);
          // A remembered folder that has gone must never be why a save fails.
          if (retry) return ask({ suggestedName: name, types: FILE_TYPES }, false);
          throw new Error((e && e.message) || "The save dialog could not be opened.");
        });
      }
      return ask(o, true);
    }
    if (!supportsFilePickers()) return byDownload(inForeignFrame());
    if (opts.saveAs) return pick();
    // Only ever this document's own file. Anything else goes to the dialog,
    // which is the safe way to be wrong.
    if (fileHandle && fileHandleId && fileHandleId === doc.id) return writeTo(fileHandle).catch(function () { return pick(); });
    return pick();
  }

  // Resolves { file, handle }, or null when the dialog was closed. Rejects
  // when the dialog could not be opened (the caller then uses the file input).
  function openWithPicker() {
    if (!canPick()) return Promise.reject(new Error("The file dialog is not available here."));
    return window.showOpenFilePicker({
      id: PICKER_ID, multiple: false,
      types: [{ description: "Document file or Word file", accept: {
        "application/json": [".json"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
      } }]
    }).then(function (handles) {
      var handle = handles && handles[0];
      if (!handle) return null;
      return handle.getFile().then(function (file) { return { file: file, handle: handle }; });
    }, function (e) {
      if (e && e.name === "AbortError") return null;
      throw e;
    });
  }

  // ---------- the store behind autosave ----------
  // A thin wrapper over IndexedDB: one record per document for the document
  // without its bytes, and one per picture or part for its Blob. IndexedDB
  // cannot be run in headless Edge (open never settles), so everything with a
  // decision in it is above this seam and the tests put an in-memory object
  // in its place.
  var DB_NAME = "spt-document-autosave", DOCS = "docs", BLOBS = "blobs", dbPromise = null;
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var done = false;
      // A failure is not remembered: the next time the store is asked whether
      // it works, it tries again.
      function fail(e) { if (!done) { done = true; dbPromise = null; reject(e || new Error("Browser storage is not available.")); } }
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () {
          req.result.createObjectStore(DOCS);
          req.result.createObjectStore(BLOBS);
        };
        req.onerror = function () { fail(req.error); };
        req.onblocked = function () { fail(); };
        req.onsuccess = function () { if (!done) { done = true; resolve(req.result); } };
      } catch (e) { fail(e); }
      // Storage that never answers must not leave anything waiting.
      setTimeout(fail, 3000);
    });
    return dbPromise;
  }
  function inStores(mode, work) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction([DOCS, BLOBS], mode), out;
        tx.oncomplete = function () { resolve(out); };
        tx.onerror = tx.onabort = function () { reject(tx.error || new Error("Browser storage failed.")); };
        work(tx.objectStore(DOCS), tx.objectStore(BLOBS), function (v) { out = v; });
      });
    });
  }
  function blobRange(docId) { return IDBKeyRange.bound(docId + "|", docId + "|￿"); }
  var idbStore = {
    putDoc: function (docId, json) { return inStores("readwrite", function (docs) { docs.put(json, docId); }); },
    getDoc: function (docId) {
      return inStores("readonly", function (docs, blobs, set) {
        var g = docs.get(docId);
        g.onsuccess = function () { set(g.result == null ? null : g.result); };
      });
    },
    putBlob: function (docId, key, blob) { return inStores("readwrite", function (docs, blobs) { blobs.put(blob, docId + "|" + key); }); },
    getBlobs: function (docId) {
      return inStores("readonly", function (docs, blobs, set) {
        var out = {};
        set(out);
        blobs.openCursor(blobRange(docId)).onsuccess = function (ev) {
          var cur = ev.target.result;
          if (!cur) return;
          out[String(cur.key).slice(docId.length + 1)] = cur.value;
          cur["continue"]();
        };
      });
    },
    remove: function (docId) {
      return inStores("readwrite", function (docs, blobs) { docs["delete"](docId); blobs["delete"](blobRange(docId)); });
    },
    ok: function () { return openDb().then(function () { return true; }, function () { return false; }); }
  };
  var store = idbStore;

  // ---------- autosave ----------
  var KEY_POINTERS = "spt-document:autosave:v1";   // { <doc id>: { id, title, time, newer } }
  var DELAY = 1200, KEEP = 8;
  var status = "unknown", listeners = [];
  var timer = null, waiting = null;
  // The copy on offer. Nothing is written over it until the user has said
  // whether they want it (restore or discard), even if they open the same
  // document from its file meanwhile.
  var held = null;

  // ---------- which window has which document open ----------
  // The pointers and the store are shared by every window of the tool in this
  // browser, so a window has to know which copies belong to a document that
  // is open in another one: those are neither cleared away nor offered as
  // work a crash left behind. Each window holds a Web Lock, shared, named
  // after the document it has open, for as long as it has it open; the
  // browser lets go of it by itself when the window closes or crashes. Where
  // the browser has no locks, or they never answer, a window behaves as if it
  // were the only one, and writeDoc below puts back whatever another window
  // then takes from under an open document.
  var LOCK = "spt-document:open:", LOCK_WAIT = 2000;
  var lockSeam;              // set by the tests in place of navigator.locks
  var ownId = null, ownRelease = null;
  var live = {};             // ids open in a window, as the locks last said
  var known = false;         // the locks have answered, or there are none to ask
  function lockManager() {
    if (lockSeam !== undefined) return lockSeam;
    try { return navigator.locks && typeof navigator.locks.request === "function" && typeof navigator.locks.query === "function" ? navigator.locks : null; }
    catch (e) { return null; }
  }
  function own(docId) {
    docId = docId || null;
    if (docId === ownId) return;
    if (ownRelease) { ownRelease(); ownRelease = null; }
    ownId = docId;
    var locks = lockManager();
    if (!docId || !locks) return;
    var release, until = new Promise(function (resolve) { release = resolve; });
    ownRelease = release;
    try {
      Promise.resolve(locks.request(LOCK + docId, { mode: "shared" }, function () { return until; })).then(null, function () {});
    } catch (e) {}
  }
  // Resolves once it is known which documents are open in a window (at once
  // where there are no locks, and after a short wait where they do not answer).
  var asked = 0;
  function askLocks() {
    var locks = lockManager(), n = ++asked;
    if (!locks) { live = {}; known = true; return Promise.resolve(); }
    return new Promise(function (resolve) {
      var done = false;
      // Only the answer to the latest question is taken: an earlier one that
      // comes in late says how things were, not how they are.
      function end(map) { if (done) return; done = true; if (n === asked) { live = map; known = true; } resolve(); }
      setTimeout(function () { end({}); }, LOCK_WAIT);
      try {
        Promise.resolve(locks.query()).then(function (q) {
          var map = {};
          ((q && q.held) || []).forEach(function (l) {
            var n = String((l && l.name) || "");
            if (n.indexOf(LOCK) === 0) map[n.slice(LOCK.length)] = true;
          });
          end(map);
        }, function () { end({}); });
      } catch (e) { end({}); }
    });
  }
  // Open in another window. This window's own document shows among the locks
  // too, and is told apart by its id.
  function elsewhere(id) { return id !== ownId && live[id] === true; }

  function setStatus(s) {
    if (status === s) return;
    status = s;
    listeners.forEach(function (fn) { try { fn(s); } catch (e) {} });
  }
  function probe() {
    var mine = store;
    status = "unknown";
    var p;
    try { p = Promise.resolve(mine.ok()); } catch (e) { p = Promise.resolve(false); }
    p.then(function (ok) { if (store === mine) setStatus(ok ? "on" : "off"); }, function () { if (store === mine) setStatus("off"); });
  }
  // One call on the store, never awaited by anyone. A failure switches
  // autosave off, which the header then says.
  function call(name, args) {
    try { return Promise.resolve(store[name].apply(store, args)).then(null, function () { setStatus("off"); }); }
    catch (e) { setStatus("off"); return Promise.resolve(); }
  }
  function pointers() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY_POINTERS) || "{}");
      return v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } catch (e) { return {}; }
  }
  function setPointers(map) { try { localStorage.setItem(KEY_POINTERS, JSON.stringify(map)); } catch (e) {} }
  function point(doc, newer) {
    var map = pointers();
    map[doc.id] = { id: doc.id, title: String((doc.info && doc.info.title) || "").slice(0, 120), time: new Date().toISOString(), newer: !!newer };
    // A handful of copies at most: the oldest go, with their bytes.
    var ids = Object.keys(map).sort(function (a, b) { return String(map[b].time).localeCompare(String(map[a].time)); });
    ids.slice(KEEP).forEach(function (id) { if (id !== held && id !== ownId && !elsewhere(id)) { delete map[id]; call("remove", [id]); } });
    setPointers(map);
  }
  function putBytes(doc, keys) {
    keys.forEach(function (k) {
      var e = (doc.media && doc.media[k]) || (doc.parts && doc.parts[k]);
      if (e && isBlob(e.blob)) call("putBlob", [doc.id, k, e.blob]);
    });
  }
  function allKeys(doc) { var used = A.DocModel.usedKeys(doc); return used.media.concat(used.parts); }
  // The id of a document whose every picture and part has just been written
  // and whose record has not followed yet (an import that has just arrived).
  var whole = null;
  function writeDoc(doc) {
    if (!doc || status === "off" || doc.id === held) return;
    // No pointer: this is the copy's first write, or the copy was taken from
    // under an open document (another window cleared or discarded it). Its
    // pictures and parts go in again, so the copy is whole whatever happened.
    if (!pointers()[doc.id] && whole !== doc.id) putBytes(doc, allKeys(doc));
    whole = null;
    call("putDoc", [doc.id, JSON.stringify(A.DocModel.shell(doc))]);
    point(doc, true);
  }
  function flush() {
    clearTimeout(timer); timer = null;
    var doc = waiting; waiting = null;
    writeDoc(doc);
  }
  var autosave = {
    // what: { blocks }, { info }, { structure }, { media: [keys] } or
    // { parts: [keys] } as App.DocApp.touched is given, or { all: true } for
    // every picture and part of a document that has just arrived. With
    // clean: true the bytes are written and nothing is marked unsaved (a
    // project file that has just been opened).
    note: function (doc, what) {
      if (!doc || status === "off") return;
      what = what || {};
      var keys = (what.media || []).concat(what.parts || []);
      if (what.all) keys = allKeys(doc);
      // Nothing goes over the copy on offer, its bytes included: a file with
      // the same id (the same document, or one made from it by an earlier
      // version's Save as) must not change what Restore would bring back.
      // When the offer is answered, the open document is written in full.
      if (doc.id !== held) {
        putBytes(doc, keys);
        if (what.all && !what.clean) whole = doc.id;
      }
      if (what.clean) {
        // What was waiting to be written for this document is an earlier
        // state of it (the same file opened again): it must not follow.
        if (waiting && waiting.id === doc.id) { clearTimeout(timer); timer = null; waiting = null; }
        if (doc.id !== held) point(doc, false);
        return;
      }
      waiting = doc;
      clearTimeout(timer);
      timer = setTimeout(flush, DELAY);
    },
    // Writes what is waiting now (the page is closing).
    flush: function () { if (waiting) flush(); },
    // The document is in a file as it stands: the copy stays (a Save does not
    // remove it) but is no longer newer than the file. A write still waiting
    // would say otherwise.
    saved: function (doc) {
      if (!doc) return;
      if (waiting === doc) { clearTimeout(timer); timer = null; waiting = null; }
      if (status !== "off" && doc.id !== held) point(doc, false);
    },
    // The newest copy that holds unsaved work, { id, title, time }, or null.
    // Copies that hold none belong to documents closed with the browser: they
    // are cleared away here, once it is known which documents are open in a
    // window (check, below). The copy of the document open in this window, or
    // in another one, is neither cleared nor offered: it is somebody's live
    // work. The copy already on offer stays the one on offer while it lasts.
    offer: function () {
      var map = pointers(), best = null, changed = false, was = held;
      Object.keys(map).forEach(function (id) {
        var p = map[id];
        if (!p || typeof p !== "object" || p.id !== id) { delete map[id]; changed = true; return; }
        if (elsewhere(id) || (id === ownId && id !== was)) return;
        if (!p.newer) {
          if (known && id !== ownId) { delete map[id]; changed = true; call("remove", [id]); }
          return;
        }
        if (id === was || (!(best && best.id === was) && (!best || String(p.time) > String(best.time)))) best = p;
      });
      if (changed) setPointers(map);
      held = best ? best.id : null;
      return best ? { id: best.id, title: best.title || "", time: best.time || "" } : null;
    },
    // Asks which documents are open in a window, then resolves what offer()
    // gives with that known. offer() alone answers at once, from what was
    // last known; the shell shows that and puts it right when this resolves.
    check: function () { return askLocks().then(function () { return autosave.offer(); }); },
    // The document open in this window (null for none, and for the tour).
    own: own,
    // Resolves the document in the memory form, or null when there is no
    // copy. A picture or part whose bytes did not come back has blob null and
    // missing true (App.DocModel.missing lists the blocks).
    restore: function (docId) {
      var mine = store, got;
      try { got = Promise.all([mine.getDoc(docId), mine.getBlobs(docId)]); } catch (e) { got = Promise.reject(e); }
      return got.then(function (r) {
        if (typeof r[0] !== "string") return null;
        var obj = JSON.parse(r[0]), blobs = r[1] || {};
        ["media", "parts"].forEach(function (group) {
          Object.keys(obj[group] || {}).forEach(function (k) {
            if (obj[group][k] && isBlob(blobs[k])) obj[group][k].blob = blobs[k];
          });
        });
        var doc = A.DocModel.normalise(obj);
        if (held === docId) held = null;
        // It is this window's document from here on, so a look for offers
        // that answers just now does not offer it a second time.
        own(docId);
        return doc;
      });
    },
    // offer (optional) is the offer being turned down. The copy is left
    // where it is, and false comes back, when it has been written since that
    // offer was made: a window has taken it up and it is live work again.
    discard: function (docId, offer) {
      var map = pointers();
      if (held === docId) held = null;
      if (offer && map[docId] && offer.time && String(map[docId].time) !== String(offer.time)) return false;
      if (map[docId]) { delete map[docId]; setPointers(map); }
      if (waiting && waiting.id === docId) { clearTimeout(timer); timer = null; waiting = null; }
      call("remove", [docId]);
      return true;
    },
    // The open document's unsaved work is thrown away on purpose (the suite
    // closes the tool): its copy goes, unless it is the copy on offer, which
    // nobody has answered and which stays offered. Resolves once the store
    // has removed it.
    drop: function (docId) {
      if (!docId || docId === held) return Promise.resolve();
      if (waiting && waiting.id === docId) { clearTimeout(timer); timer = null; waiting = null; }
      var map = pointers();
      if (map[docId]) { delete map[docId]; setPointers(map); }
      return call("remove", [docId]);
    },
    // "on", "off" or "unknown" (the store has not answered yet).
    status: function () { return status; },
    onStatus: function (fn) { if (typeof fn === "function") { listeners.push(fn); fn(status); } }
  };

  A.DocStorage = {
    save: save, openWithPicker: openWithPicker, adopt: adopt, forget: forget, currentName: currentName,
    download: download, autosave: autosave,
    supportsFilePickers: supportsFilePickers, canPick: canPick, inForeignFrame: inForeignFrame, suggestedName: suggestedName,
    KEY_POINTERS: KEY_POINTERS
  };
  // Replaced whole by the tests. A new store is asked whether it works, so
  // the header's "Autosave is off" follows the store in use.
  Object.defineProperty(A.DocStorage, "bytesStore", {
    enumerable: true,
    get: function () { return store; },
    set: function (s) { store = s || idbStore; probe(); }
  });
  // The lock manager, navigator.locks unless a test has put its own here
  // (null: a browser with none). What was learnt from the one before is
  // forgotten, and the lock this window holds is taken again from the new one.
  Object.defineProperty(A.DocStorage, "locks", {
    enumerable: true,
    get: function () { return lockManager(); },
    set: function (l) {
      var mine = ownId;
      own(null);
      lockSeam = l;
      live = {}; known = false; asked++;
      own(mine);
    }
  });
  probe();
})();
