/* SiDIA → Infomurid: panel import dalam halaman Kemaskini salah laku.
 * Semua permintaan ke Infomurid dibuat dari halaman ini (asal yang sama),
 * menggunakan sesi log masuk pengguna. Tiada data dihantar ke pihak lain. */
(function () {
  'use strict';
  if (!/\/discipline\//i.test(location.pathname)) return; // hanya halaman salah laku
  if (window.__sidiaImport) { if (window.__sidiaOpen) window.__sidiaOpen(); return; }
  window.__sidiaImport = true;

  var C = SidiaCore;
  var ORIGIN = location.origin;
  var LALAI_HUKUMAN = [
    { id: '1', text: 'Amaran[001]' }, { id: '2', text: 'Rotan 1X[002]' }, { id: '3', text: 'Rotan 2X[003]' },
    { id: '4', text: 'Rotan 3X[004]' }, { id: '5', text: 'Gantung sekolah[005]' }, { id: '6', text: 'Buang sekolah[006]' }
  ];

  var state = {
    records: [],      // rekod SiDIA selepas dibaca
    groups: [],       // kumpulan selepas semakan
    offences: [], actions: [], students: [], byName: {}, byClass: {}, existing: {},
    store: { peta: {}, petaMurid: {}, diimport: {}, tetapan: {} }
  };

  /* ---------- storan ---------- */
  function loadStore(cb) {
    try {
      chrome.storage.local.get(['peta', 'petaMurid', 'diimport', 'tetapan'], function (v) {
        state.store.peta = v.peta || {};
        state.store.petaMurid = v.petaMurid || {};
        state.store.diimport = v.diimport || {};
        state.store.tetapan = v.tetapan || {};
        cb();
      });
    } catch (e) { cb(); }
  }
  function saveStore(keys) {
    var o = {};
    keys.forEach(function (k) { o[k] = state.store[k]; });
    try { chrome.storage.local.set(o); } catch (e) { /* abaikan */ }
  }

  /* ---------- DOM ringkas ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v; // hanya untuk ikon SVG statik
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  var ICON = {
    upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'
  };
  function ic(n, cls) {
    return h('span', { 'class': 'ic ' + (cls || ''), 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[n] + '</svg>' });
  }

  /* ---------- fetch Infomurid ---------- */
  function getHtml(path) {
    return fetch(ORIGIN + path, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) {
        if (/\/Account\/Login/i.test(r.url)) throw new Error('Sesi Infomurid tamat. Sila log masuk semula.');
        if (!r.ok) throw new Error('Infomurid membalas ' + r.status + ' untuk ' + path.split('?')[0]);
        return r.text();
      });
  }
  function pool(items, n, fn) {
    var i = 0, out = new Array(items.length);
    function next() {
      if (i >= items.length) return Promise.resolve();
      var k = i++;
      return fn(items[k], k).then(function (v) { out[k] = v; return next(); });
    }
    var runners = [];
    for (var j = 0; j < Math.min(n, items.length); j++) runners.push(next());
    return Promise.all(runners).then(function () { return out; });
  }

  /* ---------- UI ---------- */
  var host = h('div', { id: 'sidia-import-host' });
  var root = host.attachShadow({ mode: 'open' });
  var style = h('style', { text: CSS() });
  root.appendChild(style);

  var fab = h('button', { 'class': 'fab', type: 'button', onclick: openPanel }, [ic('upload'), h('span', { text: 'Import SiDIA' })]);
  root.appendChild(fab);

  var overlay = h('div', { 'class': 'overlay', hidden: true, onclick: function (e) { if (e.target === overlay) closePanel(); } });
  var panel = h('section', { 'class': 'panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sd-title' });
  overlay.appendChild(panel);
  root.appendChild(overlay);
  var live = h('div', { 'class': 'sr', 'aria-live': 'polite' });
  root.appendChild(live);

  // elemen yang dirujuk
  var el = {};

  function build() {
    var sesiOpts = [];
    var ddSession = document.querySelector('#ddSession');
    var thisYear = String(new Date().getFullYear());
    if (ddSession) {
      Array.prototype.forEach.call(ddSession.options, function (o) {
        if (o.value) sesiOpts.push({ id: o.value, text: o.text.trim() });
      });
    }
    var t = state.store.tetapan;

    el.file = h('input', { type: 'file', accept: '.csv,.tsv,.txt,text/csv', id: 'sd-file', onchange: onFile });
    el.paste = h('textarea', { id: 'sd-paste', rows: '4', placeholder: 'Atau tampal di sini: pilih baris dalam tab REKOD (termasuk tajuk), salin (Ctrl+C) dan tampal (Ctrl+V).' });
    el.readInfo = h('p', { 'class': 'note', id: 'sd-readinfo' });

    el.sesi = h('select', { id: 'sd-sesi' }, sesiOpts.map(function (o) {
      return h('option', { value: o.id, text: o.text, selected: (ddSession && ddSession.value ? o.id === ddSession.value : o.text === thisYear) || null });
    }));
    el.dari = h('input', { type: 'date', id: 'sd-dari' });
    el.hingga = h('input', { type: 'date', id: 'sd-hingga' });
    el.hukuman = h('select', { id: 'sd-hukuman' }, [h('option', { value: '', text: '(dimuat semasa semakan)' })]);
    el.masa = h('input', { type: 'text', id: 'sd-masa', value: t.masaLalai || '-', maxlength: '20' });
    el.lokasi = h('input', { type: 'text', id: 'sd-lokasi', value: t.lokasiLalai || 'SEKOLAH', maxlength: '60' });
    el.pelapor = h('input', { type: 'checkbox', id: 'sd-pelapor', checked: t.pelapor === false ? null : true });
    el.langkau = h('input', { type: 'checkbox', id: 'sd-langkau', checked: true });

    el.semak = h('button', { 'class': 'btn pri', type: 'button', id: 'sd-semak', onclick: onSemak }, [ic('refresh'), h('span', { text: 'Semak dengan Infomurid' })]);
    el.result = h('div', { id: 'sd-result' });
    el.importBtn = h('button', { 'class': 'btn pri', type: 'button', id: 'sd-import', disabled: true, onclick: onImport }, [ic('upload'), h('span', { text: 'Import' })]);
    el.log = h('ol', { 'class': 'log', id: 'sd-log' });

    panel.appendChild(h('header', { 'class': 'hd' }, [
      h('div', null, [
        h('h2', { id: 'sd-title', text: 'Import rekod SiDIA' }),
        h('p', { 'class': 'sub', text: 'Daripada tab REKOD Google Sheet SiDIA ke Kemaskini salah laku Infomurid' })
      ]),
      h('button', { 'class': 'icon-btn', type: 'button', 'aria-label': 'Tutup', onclick: closePanel }, [ic('x')])
    ]));

    var body = h('div', { 'class': 'bd' });
    body.appendChild(h('div', { 'class': 'card' }, [
      h('h3', { text: '1. Data SiDIA' }),
      h('p', { 'class': 'note', text: 'Dalam Google Sheet SiDIA, buka tab REKOD › Fail › Muat turun › Nilai dipisahkan koma (.csv).' }),
      h('label', { 'class': 'file', 'for': 'sd-file' }, [ic('upload'), h('span', { text: 'Pilih fail CSV' })]),
      el.file,
      el.paste,
      h('button', { 'class': 'btn', type: 'button', onclick: onPaste, text: 'Baca data yang ditampal' }),
      el.readInfo
    ]));
    body.appendChild(h('div', { 'class': 'card' }, [
      h('h3', { text: '2. Tetapan' }),
      h('div', { 'class': 'grid' }, [
        field('Tahun Infomurid', el.sesi),
        field('Hukuman', el.hukuman),
        field('Tarikh dari', el.dari),
        field('Tarikh hingga', el.hingga),
        field('Masa jika kosong', el.masa),
        field('Lokasi jika kosong', el.lokasi)
      ]),
      h('label', { 'class': 'chk' }, [el.pelapor, h('span', { text: 'Tulis nama pelapor SiDIA dalam Ulasan' })]),
      h('label', { 'class': 'chk' }, [el.langkau, h('span', { text: 'Langkau rekod yang sudah ada dalam Infomurid (nama + tarikh + kod sama)' })]),
      el.semak
    ]));
    body.appendChild(h('div', { 'class': 'card' }, [
      h('h3', { text: '3. Semakan & import' }),
      el.result,
      el.log
    ]));
    panel.appendChild(body);
    panel.appendChild(h('footer', { 'class': 'ft' }, [el.importBtn]));
  }

  function field(label, input) {
    return h('label', { 'class': 'fld' }, [h('span', { text: label }), input]);
  }

  function openPanel() {
    overlay.hidden = false;
    fab.hidden = true;
    setTimeout(function () { panel.querySelector('.icon-btn').focus(); }, 0);
    document.addEventListener('keydown', onKey, true);
  }
  function closePanel() {
    overlay.hidden = true;
    fab.hidden = false;
    document.removeEventListener('keydown', onKey, true);
    fab.focus();
  }
  function onKey(e) { if (e.key === 'Escape' && !overlay.hidden) { e.stopPropagation(); closePanel(); } }

  function say(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); }
  function log(msg, kind) {
    el.log.appendChild(h('li', { 'class': kind || '' }, [kind === 'ok' ? ic('check', 'sm') : kind === 'err' ? ic('alert', 'sm') : null, h('span', { text: msg })]));
    el.log.scrollTop = el.log.scrollHeight;
  }
  function setInfo(msg, kind) { el.readInfo.className = 'note ' + (kind || ''); el.readInfo.textContent = msg; say(msg); }

  /* ---------- langkah 1: baca ---------- */
  function onFile() {
    var f = el.file.files && el.file.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { readText(String(rd.result), f.name); };
    rd.onerror = function () { setInfo('Fail tidak dapat dibaca.', 'err'); };
    rd.readAsText(f, 'utf-8');
  }
  function onPaste() {
    if (!el.paste.value.trim()) { setInfo('Tiada data ditampal.', 'err'); return; }
    readText(el.paste.value, 'data tampal');
  }
  function readText(text, nama) {
    try {
      var recs = C.rowsToRecords(C.parseDelimited(text));
      var bad = recs.filter(function (r) { return !r.tarikh; }).length;
      state.records = recs.filter(function (r) { return r.tarikh; });
      if (!state.records.length) throw new Error('Tiada rekod sah dijumpai dalam ' + nama + '.');
      var ds = state.records.map(function (r) { return r.tarikh; }).sort();
      var dahImport = state.records.filter(function (r) { return state.store.diimport[r.id]; }).length;
      // lalai: mula selepas rekod terakhir yang diimport, jika ada
      el.dari.value = ds[0];
      el.hingga.value = ds[ds.length - 1];
      setInfo(state.records.length + ' rekod dibaca daripada ' + nama + ' (' + ds[0] + ' hingga ' + ds[ds.length - 1] + ').' +
        (dahImport ? ' ' + dahImport + ' rekod pernah diimport melalui extension ini dan akan dilangkau.' : '') +
        (bad ? ' ' + bad + ' baris tanpa tarikh sah diabaikan.' : ''), 'ok');
      el.result.textContent = '';
      el.importBtn.disabled = true;
    } catch (e) {
      state.records = [];
      setInfo(e.message, 'err');
    }
  }

  /* ---------- langkah 2: semak ---------- */
  function onSemak() {
    if (!state.records.length) { setInfo('Sila baca data SiDIA dahulu (langkah 1).', 'err'); return; }
    var sesi = el.sesi.value;
    if (!sesi) { log('Sila pilih tahun.', 'err'); return; }
    state.store.tetapan.masaLalai = el.masa.value.trim() || '-';
    state.store.tetapan.lokasiLalai = el.lokasi.value.trim() || 'SEKOLAH';
    state.store.tetapan.pelapor = el.pelapor.checked;
    saveStore(['tetapan']);

    el.semak.disabled = true;
    el.importBtn.disabled = true;
    el.result.textContent = '';
    el.log.textContent = '';
    log('Memuatkan senarai kesalahan, hukuman dan murid daripada Infomurid…');

    var kelas = [];
    var ddc = document.querySelector('#ddClassIndex');
    if (ddc) Array.prototype.forEach.call(ddc.options, function (o) {
      if (o.value && !/^KELUAR$/i.test(o.text.trim())) kelas.push({ id: o.value, text: o.text.trim() });
    });

    getHtml('/Discipline/CreateGroup?sessionid=' + encodeURIComponent(sesi))
      .then(function (html) {
        var d = C.toDoc(html);
        state.offences = C.parseOffences(d);
        state.actions = C.parseActions(d);
        if (state.offences.length && state.actions.length) return;
        return getHtml('/Discipline/Create?sessionid=' + encodeURIComponent(sesi)).then(function (h2) {
          var d2 = C.toDoc(h2);
          if (!state.offences.length) state.offences = C.parseOffences(d2);
          if (!state.actions.length) state.actions = C.parseActions(d2);
        });
      })
      .then(function () {
        if (!state.offences.length) {
          // sandaran: borang dalam halaman semasa
          state.offences = C.parseOffences(document);
        }
        if (!state.actions.length) state.actions = C.parseActions(document);
        if (!state.actions.length) state.actions = LALAI_HUKUMAN;
        if (!state.offences.length) throw new Error('Senarai kesalahan Infomurid tidak dapat dibaca.');
        fillHukuman();
        log(state.offences.length + ' kesalahan dan ' + state.actions.length + ' jenis hukuman dimuatkan.', 'ok');
        if (!kelas.length) {
          return getHtml('/Sumbangan/RefreshStudentList?sessionid=' + encodeURIComponent(sesi) + '&classid=0')
            .then(function (html) { return [C.parseStudents(C.toDoc(html), '')]; });
        }
        return pool(kelas, 4, function (k) {
          return getHtml('/Sumbangan/RefreshStudentList?sessionid=' + encodeURIComponent(sesi) + '&classid=' + encodeURIComponent(k.id))
            .then(function (html) { return C.parseStudents(C.toDoc(html), k.text); });
        });
      })
      .then(function (lists) {
        var seen = {};
        state.students = [];
        lists.forEach(function (l) { (l || []).forEach(function (s) { if (!seen[s.id]) { seen[s.id] = 1; state.students.push(s); } }); });
        state.byName = C.buildStudentIndex(state.students);
        state.byClass = {};
        state.students.forEach(function (s) { var k = C.normClass(s.kelas); (state.byClass[k] = state.byClass[k] || []).push(s); });
        if (!state.students.length) throw new Error('Senarai murid Infomurid kosong untuk tahun ini.');
        log(state.students.length + ' murid dimuatkan daripada ' + Math.max(kelas.length, 1) + ' kelas.', 'ok');
        return getHtml('/Discipline/Index?sessionid=' + encodeURIComponent(sesi) + '&classid=&pvflag=1')
          .then(function (html) { state.existing = C.parseExisting(C.toDoc(html)); })
          .catch(function () { state.existing = {}; log('Rekod sedia ada tidak dapat disemak; semakan pendua dilangkau.', 'err'); });
      })
      .then(function () {
        analyse();
        render();
        el.result.parentNode.scrollIntoView({ block: 'start' });
      })
      .catch(function (e) { log(e.message || String(e), 'err'); })
      .then(function () { el.semak.disabled = false; });
  }

  function fillHukuman() {
    el.hukuman.textContent = '';
    var saved = state.store.tetapan.hukuman;
    state.actions.forEach(function (a, i) {
      el.hukuman.appendChild(h('option', { value: a.id, text: a.text, selected: (saved ? a.id === saved : i === 0) || null }));
    });
  }

  function analyse() {
    var dari = el.dari.value || '0000-00-00', hingga = el.hingga.value || '9999-99-99';
    var recs = state.records.filter(function (r) { return r.tarikh >= dari && r.tarikh <= hingga; });
    var semua = C.groupRecords(recs);
    semua.forEach(function (g) { g.offence = C.offenceFor(state.offences, g.kod, state.store.peta); });
    // kod yang tiada dalam Infomurid (cth W01–W05) dilangkau
    state.dilangkau = { n: 0, kod: [] };
    semua.forEach(function (g) {
      if (g.offence) return;
      state.dilangkau.n += g.rekod.length;
      if (state.dilangkau.kod.indexOf(g.kod) < 0) state.dilangkau.kod.push(g.kod);
    });
    state.groups = semua.filter(function (g) { return g.offence; });
    state.groups.forEach(function (g) {
      g.pilih = true;
      g.rekod.forEach(function (r) {
        r.status = ''; r.murid = null; r.ralat = '';
        if (state.store.diimport[r.id]) { r.status = 'diimport'; return; }
        var manual = r.idMurid && state.store.petaMurid[r.idMurid];
        var m = manual ? { murid: state.students.filter(function (s) { return s.id === manual; })[0] } : null;
        if (!m || !m.murid) m = C.matchStudent(state.byName, r.nama, r.kelas);
        if (!m.murid) { r.status = 'tiada'; r.ralat = m.ralat; return; }
        r.murid = m.murid;
        if (el.langkau.checked && g.offence && state.existing[r.tarikh + '|' + C.normName(m.murid.nama) + '|' + g.offence.kod]) { r.status = 'pendua'; return; }
        r.status = 'sedia';
      });
    });
  }

  function countReady() {
    var n = 0;
    state.groups.forEach(function (g) {
      if (!g.pilih || !g.offence) return;
      g.rekod.forEach(function (r) { if (r.status === 'sedia') n++; });
    });
    return n;
  }

  function render() {
    el.result.textContent = '';
    var dl = state.dilangkau || { n: 0, kod: [] };
    var notaLangkau = dl.n ? h('p', { 'class': 'note', text: dl.n + ' rekod dilangkau kerana kod ' + dl.kod.join(', ') + ' tiada dalam senarai salah laku Infomurid.' }) : null;
    if (!state.groups.length) {
      el.result.appendChild(h('p', { 'class': 'note', text: dl.n ? 'Tiada rekod yang boleh diimport.' : 'Tiada rekod dalam julat tarikh yang dipilih.' }));
      if (notaLangkau) el.result.appendChild(notaLangkau);
      updateImportBtn();
      return;
    }
    var tot = { sedia: 0, tiada: 0, pendua: 0, diimport: 0, kod: 0 };
    state.groups.forEach(function (g) { g.rekod.forEach(function (r) { tot[r.status === 'sedia' && !g.offence ? 'kod' : r.status]++; }); });
    el.result.appendChild(h('div', { 'class': 'chips' }, [
      chip('ok', tot.sedia + ' sedia diimport'),
      tot.tiada ? chip('err', tot.tiada + ' murid tidak sepadan') : null,
      tot.pendua ? chip('mut', tot.pendua + ' sudah ada dalam Infomurid') : null,
      tot.diimport ? chip('mut', tot.diimport + ' pernah diimport') : null,
      dl.n ? chip('mut', dl.n + ' dilangkau (kod tiada dalam Infomurid)') : null
    ]));
    if (notaLangkau) el.result.appendChild(notaLangkau);

    var list = h('div', { 'class': 'groups' });
    state.groups.forEach(function (g, gi) { list.appendChild(renderGroup(g, gi)); });
    el.result.appendChild(list);
    updateImportBtn();
  }

  function chip(kind, text) { return h('span', { 'class': 'chip ' + kind, text: text }); }

  function renderGroup(g, gi) {
    var ready = g.rekod.filter(function (r) { return r.status === 'sedia'; }).length;
    var sel = h('select', { 'aria-label': 'Kesalahan Infomurid untuk kod ' + g.kod, onchange: function () {
      var o = state.offences.filter(function (x) { return x.id === sel.value; })[0] || null;
      // gunakan pilihan ini untuk semua kumpulan dengan kod yang sama, dan ingat untuk kali seterusnya
      state.groups.forEach(function (x) { if (x.kod === g.kod) x.offence = o; });
      if (o) state.store.peta[g.kod] = o.id; else delete state.store.peta[g.kod];
      saveStore(['peta']);
      analyseKeep();
    } }, [h('option', { value: '', text: '— Pilih kesalahan Infomurid —' })].concat(state.offences.map(function (o) {
      return h('option', { value: o.id, text: '[' + o.kod + '] ' + o.text, selected: (g.offence && g.offence.id === o.id) || null });
    })));
    var cb = h('input', { type: 'checkbox', checked: g.pilih || null, 'aria-label': 'Import kumpulan ini', onchange: function () { g.pilih = cb.checked; updateImportBtn(); } });

    var details = h('details', null, [h('summary', { text: g.rekod.length + ' murid · ' + ready + ' sedia' })]);
    var ul = h('ul', { 'class': 'murid' });
    g.rekod.forEach(function (r) { ul.appendChild(renderMurid(r)); });
    details.appendChild(ul);

    return h('div', { 'class': 'grp' + (g.offence ? '' : ' warn') }, [
      h('div', { 'class': 'grp-hd' }, [
        h('label', { 'class': 'chk tight' }, [cb, h('strong', { text: g.tarikh })]),
        h('span', { 'class': 'muted', text: [C.fmtMasa(g.masa, el.masa.value), g.lokasi || el.lokasi.value, g.pelapor].filter(Boolean).join(' · ') })
      ]),
      h('div', { 'class': 'grp-off' }, [
        h('span', { 'class': 'kod', text: g.kod }),
        h('span', { 'class': 'muted', text: g.kesalahan || '' })
      ]),
      sel,
      details
    ]);
  }

  function renderMurid(r) {
    var label = { sedia: 'Sedia', tiada: r.ralat || 'Tidak sepadan', pendua: 'Sudah ada', diimport: 'Pernah diimport' }[r.status];
    var li = h('li', { 'class': r.status }, [
      h('span', { 'class': 'nm', text: r.nama + (r.kelas ? ' (' + r.kelas + ')' : '') }),
      h('span', { 'class': 'st', text: label })
    ]);
    if (r.status === 'tiada') {
      var calon = state.byClass[C.normClass(r.kelas)] || [];
      if (calon.length) {
        var s = h('select', { 'aria-label': 'Padankan ' + r.nama + ' secara manual', onchange: function () {
          if (r.idMurid) {
            if (s.value) state.store.petaMurid[r.idMurid] = s.value; else delete state.store.petaMurid[r.idMurid];
            saveStore(['petaMurid']);
          } else {
            r.manual = s.value;
          }
          analyseKeep();
        } }, [h('option', { value: '', text: 'Padankan secara manual (' + r.kelas + ')…' })].concat(calon.map(function (c) {
          return h('option', { value: c.id, text: c.nama });
        })));
        li.appendChild(s);
      }
    }
    return li;
  }

  /** Analisis semula tanpa membuang pilihan kumpulan (selepas pengguna menukar padanan). */
  function analyseKeep() {
    var pilih = {}, manual = {};
    state.groups.forEach(function (g) { pilih[g.key] = g.pilih; g.rekod.forEach(function (r) { if (r.manual) manual[r.id] = r.manual; }); });
    analyse();
    state.groups.forEach(function (g) {
      if (pilih[g.key] !== undefined) g.pilih = pilih[g.key];
      g.rekod.forEach(function (r) {
        if (r.status === 'tiada' && manual[r.id]) {
          var m = state.students.filter(function (s) { return s.id === manual[r.id]; })[0];
          if (m) { r.murid = m; r.manual = manual[r.id]; r.status = 'sedia'; }
        }
      });
    });
    render();
  }

  function updateImportBtn() {
    var n = countReady();
    el.importBtn.disabled = n === 0;
    el.importBtn.querySelector('span:last-child').textContent = n ? 'Import ' + n + ' rekod ke Infomurid' : 'Import';
  }

  /* ---------- langkah 3: import ---------- */
  function onImport() {
    var n = countReady();
    if (!n) return;
    var sesi = el.sesi.value;
    var sesiText = el.sesi.options[el.sesi.selectedIndex] ? el.sesi.options[el.sesi.selectedIndex].text : sesi;
    if (!el.hukuman.value) { log('Sila pilih hukuman.', 'err'); return; }
    var hukumanText = el.hukuman.options[el.hukuman.selectedIndex].text;
    if (!window.confirm('Import ' + n + ' rekod ke Infomurid tahun ' + sesiText + ' dengan hukuman "' + hukumanText + '"?')) return;
    state.store.tetapan.hukuman = el.hukuman.value;
    saveStore(['tetapan']);

    var kerja = state.groups.filter(function (g) {
      return g.pilih && g.offence && g.rekod.some(function (r) { return r.status === 'sedia'; });
    });
    el.importBtn.disabled = true;
    el.semak.disabled = true;
    log('Mula import ' + n + ' rekod (' + kerja.length + ' kumpulan)…');
    var berjaya = 0, gagal = 0;

    pool(kerja, 1, function (g) {
      var rekod = g.rekod.filter(function (r) { return r.status === 'sedia'; });
      var seen = {};
      var murid = [];
      rekod.forEach(function (r) { if (!seen[r.murid.id]) { seen[r.murid.id] = 1; murid.push(r.murid); } });
      var ulasan = [g.catatan, el.pelapor.checked && g.pelapor ? 'Pelapor: ' + g.pelapor + ' (SiDIA)' : 'Diimport dari SiDIA']
        .filter(Boolean).join(' | ').slice(0, 500);
      var body = C.bulkSaveBody(sesi, {
        tarikh: g.tarikh,
        masa: C.fmtMasa(g.masa, el.masa.value.trim() || '-'),
        offenceId: g.offence.id,
        actionId: el.hukuman.value,
        lokasi: (g.lokasi || el.lokasi.value.trim() || 'SEKOLAH').slice(0, 60),
        ulasan: ulasan
      }, murid);
      return fetch(ORIGIN + '/Discipline/BulkSave', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
        body: body
      }).then(function (r) {
        if (/\/Account\/Login/i.test(r.url)) throw new Error('Sesi Infomurid tamat. Sila log masuk semula.');
        return r.text().then(function (t) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          if (t.indexOf('Error:') > -1) {
            var d = C.toDoc(t);
            throw new Error((d.body ? d.body.textContent : t).replace(/\s+/g, ' ').trim().slice(0, 200));
          }
        });
      }).then(function () {
        var now = new Date().toISOString().slice(0, 10);
        rekod.forEach(function (r) { state.store.diimport[r.id] = now; r.status = 'diimport'; });
        saveStore(['diimport']);
        berjaya += rekod.length;
        log(g.tarikh + ' · ' + g.kod + ': ' + murid.length + ' murid disimpan.', 'ok');
      }).catch(function (e) {
        gagal += rekod.length;
        log(g.tarikh + ' · ' + g.kod + ': gagal (' + (e.message || e) + ').', 'err');
      });
    }).then(function () {
      log('Selesai: ' + berjaya + ' rekod diimport' + (gagal ? ', ' + gagal + ' gagal' : '') + '.', gagal ? 'err' : 'ok');
      say('Import selesai. ' + berjaya + ' rekod diimport.');
      render();
      el.semak.disabled = false;
      refreshTable(sesi);
    });
  }

  /** Muat semula jadual dalam halaman (sama seperti RefreshSahsiah() Infomurid). */
  function refreshTable(sesi) {
    var main = document.querySelector('#main');
    var ddSession = document.querySelector('#ddSession');
    if (!main || !ddSession || ddSession.value !== sesi) return;
    var ddc = document.querySelector('#ddClassIndex');
    getHtml('/Discipline/Index?sessionid=' + encodeURIComponent(sesi) + '&classid=' + encodeURIComponent(ddc ? ddc.value : '') + '&pvflag=1')
      .then(function (html) {
        var d = C.toDoc(html);
        var t = d.querySelector('#table_sahsiah');
        var cur = main.querySelector('#table_sahsiah');
        if (t && cur) cur.replaceWith(document.importNode(t, true));
      }).catch(function () { /* pengguna boleh muat semula sendiri */ });
  }

  function CSS() {
    return [
      ':host{all:initial}',
      '*{box-sizing:border-box}',
      '.wrap,.fab,.overlay{--pri:#0f766e;--pri-ink:#0f766e;--surface:#fff;--surface-2:#f1f5f4;--line:#d5dedc;--text:#13201e;--muted:#5b6b68;--danger:#b42318;--danger-bg:#fdecea;--ok-bg:#e6f4f2;--dur-1:.15s;',
      'font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--text)}',
      '@media (prefers-color-scheme:dark){.fab,.overlay{--pri:#0f766e;--pri-ink:#5eead4;--surface:#16201f;--surface-2:#1f2b2a;--line:#33423f;--text:#e6efed;--muted:#9fb1ad;--danger:#fca5a5;--danger-bg:#3b1d1b;--ok-bg:#12312d}}',
      '.ic{display:inline-flex;width:20px;height:20px;flex:none}.ic svg{width:100%;height:100%}.ic.sm{width:16px;height:16px}',
      '.fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;gap:8px;align-items:center;min-height:48px;padding:0 18px;border:0;border-radius:24px;background:var(--pri);color:#fff;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}',
      '.fab[hidden],.overlay[hidden]{display:none}',
      'button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible,label.file:focus-within{outline:3px solid #f59e0b;outline-offset:2px}',
      '.overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:flex;justify-content:flex-end}',
      '.panel{width:min(760px,100%);height:100%;background:var(--surface);color:var(--text);display:flex;flex-direction:column;box-shadow:-8px 0 30px rgba(0,0,0,.3);animation:sd-in var(--dur-1) ease-out}',
      '@keyframes sd-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}',
      '@media (prefers-reduced-motion:reduce){.panel{animation:none}}',
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line)}',
      'h2{margin:0;font-size:20px}h3{margin:0 0 8px;font-size:16px}.sub{margin:2px 0 0;color:var(--muted);font-size:13px}',
      '.icon-btn{width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}',
      '.icon-btn:hover{background:var(--surface-2)}',
      '.bd{flex:1;min-height:0;overflow:auto;padding:16px 20px 32px;display:flex;flex-direction:column;gap:14px}',
      '.card{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--surface)}',
      '.note{margin:6px 0;color:var(--muted);font-size:13px}.note.ok{color:var(--pri-ink)}.note.err{color:var(--danger)}',
      '.muted{color:var(--muted);font-size:13px}',
      'input[type=file]{position:absolute;width:1px;height:1px;opacity:0}',
      'label.file{display:inline-flex;gap:8px;align-items:center;min-height:44px;padding:0 16px;border:1px dashed var(--pri-ink);border-radius:10px;color:var(--pri-ink);cursor:pointer;font-weight:600;margin:4px 0 8px}',
      'textarea,select,input[type=text],input[type=date]{width:100%;min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:15px}',
      'textarea{min-height:80px;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:13px}',
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin-bottom:8px}@media (max-width:560px){.grid{grid-template-columns:1fr}}',
      '.fld{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}',
      '.chk{display:flex;gap:10px;align-items:center;min-height:40px;cursor:pointer}.chk input{width:20px;height:20px;accent-color:var(--pri)}.chk.tight{min-height:0}',
      '.btn{display:inline-flex;gap:8px;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--text);font:inherit;font-weight:600;cursor:pointer;margin-top:8px}',
      '.btn.pri{background:var(--pri);border-color:var(--pri);color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}',
      '.ft{padding:12px 20px;border-top:1px solid var(--line);background:var(--surface);display:flex;justify-content:flex-end}.ft .btn{margin:0;width:100%;max-width:360px}',
      '.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.chip{padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600}',
      '.chip.ok{background:var(--ok-bg);color:var(--pri-ink)}.chip.err{background:var(--danger-bg);color:var(--danger)}.chip.mut{background:var(--surface-2);color:var(--muted)}',
      '.groups{display:flex;flex-direction:column;gap:10px}',
      '.grp{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}.grp.warn{border-color:var(--danger)}',
      '.grp-hd{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}',
      '.grp-off{display:flex;gap:8px;align-items:baseline}.kod{font-weight:700;color:var(--pri-ink);font-family:ui-monospace,Consolas,monospace}',
      'summary{cursor:pointer;min-height:32px;display:flex;align-items:center;color:var(--muted);font-size:13px}',
      'ul.murid{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}',
      'ul.murid li{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:6px 8px;border-radius:6px;background:var(--surface-2);font-size:13px}',
      'ul.murid li select{grid-column:1/-1;min-height:40px;font-size:14px}',
      'ul.murid li .st{font-weight:600;color:var(--muted)}ul.murid li.sedia .st{color:var(--pri-ink)}ul.murid li.tiada .st{color:var(--danger)}',
      '.log{margin:10px 0 0;padding-left:0;list-style:none;max-height:200px;overflow:auto;font-size:13px}',
      '.log li{display:flex;gap:6px;align-items:flex-start;padding:3px 0}.log li.ok{color:var(--pri-ink)}.log li.err{color:var(--danger)}',
      '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}'
    ].join('\n');
  }

  /** Butang dalam halaman, di sebelah butang Excel (lebih mudah dilihat). */
  function addInlineButton() {
    if (document.getElementById('sidia-import-btn')) return;
    var excel = document.getElementById('btnexcel');
    if (!excel || !excel.parentNode) return;
    var b = document.createElement('button');
    b.id = 'sidia-import-btn';
    b.type = 'button';
    b.className = 'btn btn-success';
    b.style.marginLeft = '4px';
    b.textContent = 'Import SiDIA';
    b.addEventListener('click', function (e) { e.preventDefault(); openPanel(); });
    excel.parentNode.insertBefore(b, excel.nextSibling);
  }

  var opened = false;
  window.__sidiaOpen = function () { if (opened) openPanel(); else pendingOpen = true; };
  var pendingOpen = false;
  try {
    chrome.runtime.onMessage.addListener(function (msg, _s, reply) {
      if (msg && msg.type === 'sidia-open') { window.__sidiaOpen(); reply({ ok: true }); }
    });
  } catch (e) { /* abaikan */ }

  loadStore(function () {
    build();
    document.documentElement.appendChild(host);
    opened = true;
    addInlineButton();
    // #main dimuat semula oleh Infomurid (AJAX) apabila tahun/kelas ditukar
    var main = document.getElementById('main');
    if (main && window.MutationObserver) new MutationObserver(addInlineButton).observe(main, { childList: true });
    if (pendingOpen) openPanel();
  });
})();
