/* SiDIA → Infomurid: fungsi teras (tanpa UI).
 * Membaca eksport tab REKOD SiDIA (CSV atau tampal dari Google Sheet),
 * membaca halaman Infomurid, memadankan murid & kesalahan, dan menyediakan
 * data untuk /Discipline/BulkSave. */
var SidiaCore = (function () {
  'use strict';

  // Susunan lajur tab REKOD SiDIA (sama dengan REKOD_HEADERS dalam Code.gs)
  var REKOD_HEADERS = [
    'ID Rekod', 'Masa Rekod', 'Tarikh Kejadian', 'Masa Kejadian', 'ID Murid',
    'Nama Murid', 'Kelas', 'Rumah', 'Kod', 'Kesalahan', 'Kategori', 'Mata',
    'Pelapor', 'Emel Pelapor', 'Peranan', 'Lokasi', 'Catatan', 'ID Kumpulan'
  ];
  var KEYS = ['id', 'masaRekod', 'tarikh', 'masa', 'idMurid', 'nama', 'kelas', 'rumah',
    'kod', 'kesalahan', 'kategori', 'mata', 'pelapor', 'emel', 'peranan', 'lokasi', 'catatan', 'kumpulan'];

  /* ---------- CSV / TSV ---------- */
  function parseDelimited(text) {
    text = String(text || '').replace(/^﻿/, '');
    var firstLine = text.split(/\r?\n/)[0] || '';
    var delim = firstLine.indexOf('\t') >= 0 ? '\t'
      : (firstLine.split(';').length > firstLine.split(',').length ? ';' : ',');
    var rows = [], row = [], cell = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"' && cell === '') {
        q = true;
      } else if (c === delim) {
        row.push(cell); cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }

  function normHead(h) { return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  /** Tukar baris mentah kepada objek rekod. Mengesan baris tajuk REKOD jika ada. */
  function rowsToRecords(rows) {
    var map = null, start = 0, want = {};
    REKOD_HEADERS.forEach(function (h, i) { want[normHead(h)] = KEYS[i]; });
    for (var r = 0; r < Math.min(rows.length, 5); r++) {
      var m = {}, hits = 0;
      rows[r].forEach(function (h, ci) { var k = want[normHead(h)]; if (k && m[k] === undefined) { m[k] = ci; hits++; } });
      if (hits >= 4 && m.nama !== undefined && m.kod !== undefined) { map = m; start = r + 1; break; }
    }
    if (!map) {
      // tiada tajuk: anggap susunan REKOD asal (tampal baris sahaja)
      if (!rows.length || rows[0].length < 12) {
        throw new Error('Format tidak dikenali. Gunakan tab REKOD SiDIA (sertakan baris tajuk).');
      }
      map = {}; KEYS.forEach(function (k, i) { map[k] = i; });
    }
    var out = [];
    for (var i = start; i < rows.length; i++) {
      var o = {};
      KEYS.forEach(function (k) { o[k] = map[k] === undefined ? '' : String(rows[i][map[k]] == null ? '' : rows[i][map[k]]).trim(); });
      o.tarikh = parseDate(o.tarikh);
      if (!o.nama || !o.kod) continue;
      if (!o.id) o.id = 'baris-' + (i + 1) + '-' + o.tarikh + '-' + o.kod + '-' + o.nama;
      out.push(o);
    }
    return out;
  }

  var BULAN = { jan: 1, feb: 2, mac: 3, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, ogo: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dis: 12, dec: 12 };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /** Pelbagai format tarikh → 'yyyy-mm-dd' (format Malaysia: hari/bulan/tahun). */
  function parseDate(s) {
    s = String(s || '').trim();
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
    m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/);
    if (m) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[A-Za-z]*[\s\-,]+(\d{4})/);
    if (m && BULAN[m[2].toLowerCase()]) return m[3] + '-' + pad(BULAN[m[2].toLowerCase()]) + '-' + pad(+m[1]);
    return '';
  }

  /** '21:30' → '9.30pm' (gaya yang biasa digunakan dalam Infomurid). */
  function fmtMasa(s, lalai) {
    s = String(s || '').trim();
    var m = s.match(/^(\d{1,2})[:.](\d{2})/);
    if (!m) return s || lalai || '-';
    var h = +m[1], mm = m[2];
    if (h > 23) return s;
    var ap = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + '.' + mm + ap;
  }

  /* ---------- Normalisasi untuk padanan ---------- */
  function normName(s) {
    return String(s || '').toUpperCase()
      .replace(/\bBT\.?\s/g, 'BINTI ').replace(/\bBIN\s*TI\b/g, 'BINTI')
      .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function normClass(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function normKod(s) { return String(s || '').toUpperCase().replace(/\s+/g, ''); }

  /* ---------- Bacaan HTML Infomurid ---------- */
  function toDoc(html) { return new DOMParser().parseFromString(html, 'text/html'); }

  function readOptions(sel) {
    if (!sel) return [];
    return Array.prototype.slice.call(sel.options)
      .filter(function (o) { return o.value !== ''; })
      .map(function (o) { return { id: o.value, text: o.text.replace(/\s+/g, ' ').trim() }; });
  }

  /** Senarai kesalahan Infomurid: [{id, kod, text}] daripada <select> OffenceID/ddOffence. */
  function parseOffences(doc) {
    var sel = doc.querySelector('#ddOffence') || doc.querySelector('select[name="Discipline.OffenceID"]') || doc.querySelector('#OffenceID');
    return readOptions(sel).map(function (o) {
      var m = o.text.match(/\[([^\]]+)\]\s*$/);
      return { id: o.id, kod: m ? normKod(m[1]) : '', text: m ? o.text.slice(0, m.index).trim() : o.text };
    });
  }

  function parseActions(doc) {
    var sel = doc.querySelector('#ddAction') || doc.querySelector('select[name="Discipline.ActionID"]') || doc.querySelector('#ActionID');
    return readOptions(sel);
  }

  /** Murid dalam partial /Sumbangan/RefreshStudentList: input.studentid (id = StudentID, value = nama). */
  function parseStudents(doc, kelasLalai) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('input.studentid'), function (el) {
      var id = el.getAttribute('id') || '';
      var tr = el.closest ? el.closest('tr') : null;
      var cells = tr ? Array.prototype.map.call(tr.cells, function (td) { return td.textContent.replace(/\s+/g, ' ').trim(); }) : [];
      var name = (el.value && el.value !== 'on') ? el.value : (cells.filter(function (t) { return /[A-Za-z]{3,}\s+[A-Za-z]/.test(t); })[0] || '');
      if (!id || !name) return;
      out.push({ id: id.replace(/^chk\w*_/, ''), nama: name.trim(), kelas: kelasLalai || '' });
    });
    return out;
  }

  /** Rekod sedia ada dalam jadual #table_sahsiah: kunci tarikh|nama|kod. */
  function parseExisting(doc) {
    var keys = {};
    var t = doc.querySelector('#table_sahsiah');
    if (!t) return keys;
    Array.prototype.forEach.call(t.querySelectorAll('tr'), function (tr) {
      var c = Array.prototype.map.call(tr.cells, function (td) { return td.textContent.replace(/\s+/g, ' ').trim(); });
      if (c.length < 6 || !/^\d+$/.test(c[0])) return;
      keys[parseDate(c[1]) + '|' + normName(c[3]) + '|' + normKod(c[5])] = 1;
    });
    return keys;
  }

  /* ---------- Padanan ---------- */
  function buildStudentIndex(students) {
    var byName = {};
    students.forEach(function (s) {
      var k = normName(s.nama);
      (byName[k] = byName[k] || []).push(s);
    });
    return byName;
  }

  function matchStudent(idx, nama, kelas) {
    var list = idx[normName(nama)] || [];
    if (list.length === 1) return { murid: list[0] };
    if (list.length > 1) {
      var k = normClass(kelas);
      var f = list.filter(function (s) { return normClass(s.kelas) === k; });
      if (f.length === 1) return { murid: f[0] };
      return { ralat: 'Nama sama lebih daripada seorang' };
    }
    return { ralat: 'Tidak dijumpai dalam Infomurid' };
  }

  /** Auto-padan kod SiDIA → OffenceID Infomurid. mapping = pilihan pengguna yang disimpan. */
  function offenceFor(offences, kod, mapping) {
    kod = normKod(kod);
    if (mapping && mapping[kod]) {
      var saved = offences.filter(function (o) { return o.id === String(mapping[kod]); })[0];
      if (saved) return saved;
    }
    return offences.filter(function (o) { return o.kod === kod; })[0] || null;
  }

  /** Kumpulkan rekod: satu BulkSave bagi setiap (tarikh, masa, kod, lokasi, catatan). */
  function groupRecords(records) {
    var map = {}, order = [];
    records.forEach(function (r) {
      var key = [r.tarikh, r.masa, normKod(r.kod), r.lokasi, r.catatan, r.pelapor].join('\u0001');
      if (!map[key]) { map[key] = { key: key, tarikh: r.tarikh, masa: r.masa, kod: normKod(r.kod), kesalahan: r.kesalahan, lokasi: r.lokasi, catatan: r.catatan, pelapor: r.pelapor, rekod: [] }; order.push(key); }
      map[key].rekod.push(r);
    });
    return order.map(function (k) { return map[k]; }).sort(function (a, b) {
      return a.tarikh < b.tarikh ? -1 : a.tarikh > b.tarikh ? 1 : 0;
    });
  }

  /** Badan POST /Discipline/BulkSave (format $.param jQuery, sama seperti SaveBulk() Infomurid). */
  function bulkSaveBody(sessionId, vm, students) {
    var p = new URLSearchParams();
    p.append('viewmodel[StudentID]', '0');
    p.append('viewmodel[DateCommitted]', vm.tarikh);
    p.append('viewmodel[TimeCommitted]', vm.masa);
    p.append('viewmodel[OffenceID]', vm.offenceId);
    p.append('viewmodel[ActionID]', vm.actionId);
    p.append('viewmodel[Place]', vm.lokasi);
    p.append('viewmodel[Comment]', vm.ulasan || '');
    p.append('sessionid', String(sessionId));
    students.forEach(function (s, i) {
      p.append('students[' + i + '][StudentID]', s.id);
      p.append('students[' + i + '][Name]', s.nama);
      p.append('students[' + i + '][ClassCode]', s.kelas || '');
      p.append('students[' + i + '][House]', '');
    });
    return p.toString();
  }

  var api = {
    REKOD_HEADERS: REKOD_HEADERS, parseDelimited: parseDelimited, rowsToRecords: rowsToRecords,
    parseDate: parseDate, fmtMasa: fmtMasa, normName: normName, normClass: normClass, normKod: normKod,
    toDoc: toDoc, parseOffences: parseOffences, parseActions: parseActions, parseStudents: parseStudents,
    parseExisting: parseExisting, buildStudentIndex: buildStudentIndex, matchStudent: matchStudent,
    offenceFor: offenceFor, groupRecords: groupRecords, bulkSaveBody: bulkSaveBody
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();
