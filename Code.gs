/**
 * SiDIA — Sistem Rekod Disiplin Murid (Google Apps Script)
 * Versi 1.0
 *
 * Tab yang digunakan dalam Google Sheet:
 *   TETAPAN    – tetapan sekolah (nama, kod akses, lokasi, peranan)
 *   MURID      – senarai murid (Nama, Kelas, Rumah, ID/No. MyKid ...)
 *   KESALAHAN  – senarai kesalahan & mata demerit
 *   PENGGUNA   – (pilihan) senarai emel yang dibenarkan + peranan
 *   REKOD      – semua rekod kesalahan (diisi oleh web app)
 *   LAPORAN    – dijana daripada menu / web app
 */

var SH = {
  TETAPAN: 'TETAPAN',
  MURID: 'MURID',
  KESALAHAN: 'KESALAHAN',
  PENGGUNA: 'PENGGUNA',
  REKOD: 'REKOD',
  LAPORAN: 'LAPORAN',
  MULA: 'MULA'
};

var REKOD_HEADERS = [
  'ID Rekod', 'Masa Rekod', 'Tarikh Kejadian', 'Masa Kejadian', 'ID Murid',
  'Nama Murid', 'Kelas', 'Rumah', 'Kod', 'Kesalahan', 'Kategori', 'Mata',
  'Pelapor', 'Emel Pelapor', 'Peranan', 'Lokasi', 'Catatan', 'ID Kumpulan'
];
// indeks lajur REKOD (0-based)
var R = {
  ID: 0, MASA_REKOD: 1, TARIKH: 2, MASA: 3, ID_MURID: 4, NAMA: 5, KELAS: 6,
  RUMAH: 7, KOD: 8, KESALAHAN: 9, KATEGORI: 10, MATA: 11, PELAPOR: 12,
  EMEL: 13, PERANAN: 14, LOKASI: 15, CATATAN: 16, KUMPULAN: 17
};

var DEFAULT_TETAPAN = [
  ['NAMA_APP', 'SiDIA', 'Nama yang dipaparkan di web app'],
  ['NAMA_SEKOLAH', 'SMK Contoh', 'Nama sekolah anda'],
  ['KOD_AKSES', '', 'Pilihan. Jika diisi, pengguna perlu masukkan kod ini sebelum boleh merekod (sesuai untuk pengawas)'],
  ['KOD_ADMIN', '', 'Pilihan. Kod untuk buka Laporan & padam rekod orang lain. Jika kosong, semua pengguna boleh lihat laporan'],
  ['PERANAN', 'Guru,Warden,Pengawas,Guru Disiplin,Admin', 'Senarai peranan (pisahkan dengan koma)'],
  ['PERANAN_ADMIN', 'Admin,Guru Disiplin', 'Peranan dalam tab PENGGUNA yang dianggap admin'],
  ['LOKASI', 'Surau,Asrama,Kelas,Dewan Makan,Kantin,Padang,Pintu Pagar,Dewan', 'Senarai lokasi (pisahkan dengan koma)'],
  ['HAD_PADAM_JAM', '24', 'Pengguna biasa boleh padam rekod sendiri dalam tempoh ini (jam)'],
  ['ID_SPREADSHEET_MURID', '', 'Pilihan. Jika senarai murid berada dalam fail Google Sheet lain, tampal ID fail itu di sini'],
  ['TAB_MURID', 'MURID', 'Nama tab yang mengandungi senarai murid'],
  ['WEB_APP_URL', '', 'Pautan web app (diisi automatik oleh wizard)']
];

var DEFAULT_KESALAHAN = [
  ['S01', 'Tidak hadir solat Subuh berjemaah', 'Ibadah', 2, 'Ya'],
  ['S02', 'Tidak hadir solat Zohor berjemaah', 'Ibadah', 2, 'Ya'],
  ['S03', 'Tidak hadir solat Asar berjemaah', 'Ibadah', 2, 'Ya'],
  ['S04', 'Tidak hadir solat Maghrib berjemaah', 'Ibadah', 2, 'Ya'],
  ['S05', 'Tidak hadir solat Isyak berjemaah', 'Ibadah', 2, 'Ya'],
  ['S06', 'Lewat ke surau', 'Ibadah', 1, 'Ya'],
  ['A01', 'Tidak hadir prep malam', 'Asrama', 2, 'Ya'],
  ['A02', 'Bising selepas waktu tidur', 'Asrama', 2, 'Ya'],
  ['A03', 'Dorm / katil tidak kemas', 'Asrama', 1, 'Ya'],
  ['A04', 'Lewat masuk dewan makan', 'Asrama', 1, 'Ya'],
  ['K01', 'Lewat ke sekolah', 'Kehadiran', 1, 'Ya'],
  ['K02', 'Ponteng kelas', 'Kehadiran', 5, 'Ya'],
  ['K03', 'Tidak hadir perhimpunan', 'Kehadiran', 2, 'Ya'],
  ['P01', 'Pakaian tidak kemas / tidak lengkap', 'Kekemasan', 1, 'Ya'],
  ['P02', 'Rambut panjang / tidak kemas', 'Kekemasan', 2, 'Ya'],
  ['P03', 'Kuku panjang', 'Kekemasan', 1, 'Ya'],
  ['L01', 'Membuang sampah merata-rata', 'Kebersihan', 2, 'Ya'],
  ['L02', 'Membawa telefon bimbit tanpa kebenaran', 'Disiplin', 5, 'Ya'],
  ['L03', 'Berkelakuan biadab / kurang sopan', 'Disiplin', 5, 'Ya'],
  ['L04', 'Bergaduh', 'Disiplin', 10, 'Ya']
];

/* =========================================================
 *  MENU & PERSEDIAAN
 * ========================================================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('SiDIA')
    .addItem('🚀 Mula di sini (wizard persediaan)', 'bukaWizard')
    .addSeparator()
    .addItem('Semak senarai murid', 'semakMuridMenu')
    .addItem('Jana laporan mata rumah…', 'janaLaporanMenu')
    .addItem('Baiki / cipta semula tab sistem', 'setupSistem')
    .addToUi();
  try {
    var url = getSettings_().WEB_APP_URL;
    SpreadsheetApp.getActive().toast(url ? 'Pautan web app: ' + url : 'Klik menu SiDIA › 🚀 Mula di sini untuk bermula.', 'SiDIA', 8);
  } catch (e) {}
}

/** Menu lama: cipta tab yang hilang (tanpa memadam data). */
function setupSistem() {
  ensureSetup_();
  SpreadsheetApp.getUi().alert('Tab sistem SiDIA telah disemak dan dicipta (jika perlu).\n\nGunakan menu SiDIA › 🚀 Mula di sini untuk wizard persediaan.');
}

/** Cipta semua tab yang diperlukan. Selamat dijalankan berulang kali. */
function ensureSetup_() {
  var ss = SpreadsheetApp.getActive();

  var t = ensureSheet_(ss, SH.TETAPAN, ['Tetapan', 'Nilai', 'Keterangan']);
  if (t.getLastRow() < 2) {
    t.getRange(2, 1, DEFAULT_TETAPAN.length, 3).setValues(DEFAULT_TETAPAN);
    t.setColumnWidth(1, 200); t.setColumnWidth(2, 320); t.setColumnWidth(3, 520);
  } else {
    // tambah tetapan baharu yang belum ada (untuk naik taraf versi)
    var have = t.getRange(2, 1, t.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); });
    DEFAULT_TETAPAN.forEach(function (row) { if (have.indexOf(row[0]) < 0) t.appendRow(row); });
  }

  var k = ensureSheet_(ss, SH.KESALAHAN, ['Kod', 'Kesalahan', 'Kategori', 'Mata', 'Aktif']);
  if (k.getLastRow() < 2) {
    k.getRange(2, 1, DEFAULT_KESALAHAN.length, 5).setValues(DEFAULT_KESALAHAN);
    k.setColumnWidth(2, 340);
  }

  var tabMurid = getSettings_().TAB_MURID || SH.MURID;
  if (!getSettings_().ID_SPREADSHEET_MURID && !ss.getSheetByName(tabMurid)) {
    ensureSheet_(ss, tabMurid, ['ID', 'Nama', 'Kelas', 'Rumah']);
  }

  var p = ensureSheet_(ss, SH.PENGGUNA, ['Emel', 'Nama', 'Peranan']);
  if (p.getLastRow() < 2) {
    p.getRange('E1').setValue('Biarkan tab ini kosong untuk mod mudah (sesiapa yang ada pautan + kod akses boleh merekod). ' +
      'Jika diisi, HANYA emel dalam senarai ini boleh guna web app.');
  }

  ensureSheet_(ss, SH.REKOD, REKOD_HEADERS).setFrozenRows(1);
  ensureMulaSheet_(ss);
}

/** Tab MULA: arahan ringkas yang dilihat sebaik sahaja salinan dibuka. */
function ensureMulaSheet_(ss) {
  var sh = ss.getSheetByName(SH.MULA);
  if (sh) return sh;
  sh = ss.insertSheet(SH.MULA, 0);
  var rows = [
    ['SiDIA — Sistem Rekod Disiplin Murid'],
    [''],
    ['SELAMAT DATANG! Ikut 3 langkah ini:'],
    ['1.  Klik menu  SiDIA  ›  🚀 Mula di sini   (di bar menu atas, sebelah "Help" / "Bantuan")'],
    ['      Kali pertama, Google akan minta kebenaran: klik Continue › pilih akaun anda › Allow.'],
    ['      Jika keluar amaran "Google hasn\'t verified this app": klik Advanced › Go to SiDIA.'],
    ['2.  Dalam wizard: isi maklumat sekolah dan muat naik fail senarai murid (Excel / CSV).'],
    ['3.  Aktifkan web app dan kongsi pautan / kod QR kepada guru, warden & pengawas.'],
    [''],
    ['Semua data disimpan dalam Google Drive anda sendiri. Jangan padam atau tukar nama tab sistem.'],
    ['Panduan penuh: https://g-03355699-tech.github.io/sidia/']
  ];
  sh.getRange(1, 1, rows.length, 1).setValues(rows);
  sh.getRange('A1').setFontSize(20).setFontWeight('bold').setFontColor('#0f766e');
  sh.getRange('A3').setFontSize(13).setFontWeight('bold');
  sh.getRange('A4').setFontWeight('bold').setFontSize(12);
  sh.setColumnWidth(1, 900);
  sh.setHiddenGridlines && sh.setHiddenGridlines(true);
  return sh;
}

/* =========================================================
 *  WIZARD PERSEDIAAN (dialog dalam Google Sheet)
 * ========================================================= */

function bukaWizard() {
  ensureSetup_();
  var html = HtmlService.createHtmlOutputFromFile('Setup').setWidth(920).setHeight(660);
  SpreadsheetApp.getUi().showModalDialog(html, 'SiDIA — Persediaan Sekolah');
}

function wizGetState() {
  ensureSetup_();
  var s = getSettings_();
  var murid = { count: 0, kelas: 0, rumah: [], error: '' };
  try {
    var st = readStudents_().students.filter(function (x) { return !/^CONTOH/i.test(x[1]); });
    var k = {}, r = {};
    st.forEach(function (x) { k[x[2]] = 1; if (x[3]) r[x[3]] = 1; });
    murid = { count: st.length, kelas: Object.keys(k).length, rumah: Object.keys(r).sort(), error: '' };
  } catch (e) { murid.error = e.message; }
  var kes = SpreadsheetApp.getActive().getSheetByName(SH.KESALAHAN);
  var offenses = kes.getLastRow() > 1 ? kes.getRange(2, 1, kes.getLastRow() - 1, 5).getDisplayValues()
    .filter(function (r) { return r[0] || r[1]; }) : [];
  return {
    tetapan: {
      NAMA_SEKOLAH: s.NAMA_SEKOLAH === 'SMK Contoh' ? '' : s.NAMA_SEKOLAH,
      KOD_AKSES: s.KOD_AKSES, KOD_ADMIN: s.KOD_ADMIN, LOKASI: s.LOKASI, PERANAN: s.PERANAN
    },
    murid: murid,
    offenses: offenses,
    webAppUrl: detectWebAppUrl_(),
    scriptUrl: 'https://script.google.com/d/' + ScriptApp.getScriptId() + '/edit',
    email: currentEmail_()
  };
}

function wizSaveSchool(o) {
  o = o || {};
  var nama = String(o.NAMA_SEKOLAH || '').trim();
  if (!nama) throw new Error('Sila isi nama sekolah.');
  ['NAMA_SEKOLAH', 'KOD_AKSES', 'KOD_ADMIN', 'LOKASI'].forEach(function (k) {
    if (o[k] != null) setSetting_(k, String(o[k]).trim());
  });
  try { SpreadsheetApp.getActive().rename('SiDIA — ' + nama); } catch (e) {}
  return true;
}

/**
 * Simpan senarai murid daripada wizard.
 * rows = [[id, nama, kelas, rumah], ...]; mode = 'ganti' | 'tambah'
 */
function wizSaveStudents(rows, mode) {
  rows = (rows || []).filter(function (r) { return r && String(r[1] || '').trim(); });
  if (!rows.length) throw new Error('Tiada murid untuk disimpan.');
  if (rows.length > 5000) throw new Error('Terlalu banyak baris (maksimum 5000).');
  var ss = SpreadsheetApp.getActive();
  setSetting_('TAB_MURID', SH.MURID);
  setSetting_('ID_SPREADSHEET_MURID', '');
  var sh = ss.getSheetByName(SH.MURID) || ss.insertSheet(SH.MURID);
  var existing = [];
  if (mode === 'tambah' && sh.getLastRow() > 1) {
    existing = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getDisplayValues()
      .filter(function (r) { return r[1] && !/^CONTOH/i.test(r[1]); });
  }
  var seen = {}, out = [];
  existing.concat(rows).forEach(function (r) {
    var id = String(r[0] || '').trim(), nama = String(r[1]).trim().replace(/\s+/g, ' ');
    var kelas = String(r[2] || '').trim().replace(/\s+/g, ' ').toUpperCase();
    var rumah = String(r[3] || '').trim().toUpperCase();
    if (!id) id = autoId_(nama);
    var base = id, n = 2;
    while (seen[id]) id = base + '-' + (n++);
    seen[id] = 1;
    out.push([id, nama.toUpperCase(), kelas, rumah]);
  });
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['ID', 'Nama', 'Kelas', 'Rumah']]).setFontWeight('bold').setBackground('#e6f4f2');
  sh.setFrozenRows(1);
  sh.getRange(2, 1, out.length, 1).setNumberFormat('@'); // kekalkan sifar di depan No. MyKid
  sh.getRange(2, 1, out.length, 4).setValues(out);
  sh.setColumnWidth(2, 340);
  return { disimpan: out.length };
}

/** ID stabil daripada nama (jika fail tiada lajur ID / MyKid). */
function autoId_(nama) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(nama).toUpperCase().replace(/[^A-Z0-9]/g, ''));
  var hex = bytes.slice(0, 5).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
  return 'N' + hex.toUpperCase();
}

/** rows = [[kod, kesalahan, kategori, mata, aktif], ...] */
function wizSaveOffenses(rows) {
  rows = (rows || []).filter(function (r) { return String(r[1] || '').trim(); });
  if (!rows.length) throw new Error('Sekurang-kurangnya satu kesalahan diperlukan.');
  var seen = {}, out = [];
  rows.forEach(function (r, i) {
    var kod = String(r[0] || '').trim().toUpperCase() || ('X' + ('0' + (i + 1)).slice(-2));
    if (seen[kod]) throw new Error('Kod kesalahan berulang: ' + kod);
    seen[kod] = 1;
    out.push([kod, String(r[1]).trim(), String(r[2] || '').trim(), parseFloat(r[3]) || 0, r[4] === false || /^(tidak|no)$/i.test(r[4]) ? 'Tidak' : 'Ya']);
  });
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.KESALAHAN);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 5).clearContent();
  sh.getRange(2, 1, out.length, 5).setValues(out);
  return { disimpan: out.length };
}

function wizCheckDeploy(manualUrl) {
  if (manualUrl) {
    manualUrl = String(manualUrl).trim();
    if (!/^https:\/\/script\.google\.com\/.+\/exec(\?.*)?$/.test(manualUrl)) {
      throw new Error('Pautan tidak sah. Pautan web app bermula dengan https://script.google.com/ dan berakhir dengan /exec');
    }
    setSetting_('WEB_APP_URL', manualUrl);
    return manualUrl;
  }
  return detectWebAppUrl_();
}

function detectWebAppUrl_() {
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  if (/\/exec$/.test(url)) {
    if (getSettings_().WEB_APP_URL !== url) setSetting_('WEB_APP_URL', url);
    return url;
  }
  return getSettings_().WEB_APP_URL || '';
}

function setSetting_(key, val) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.TETAPAN);
  var last = sh.getLastRow();
  var keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim().toUpperCase() === key) { sh.getRange(i + 2, 2).setValue(val); return; }
  }
  var desc = '';
  DEFAULT_TETAPAN.forEach(function (r) { if (r[0] === key) desc = r[2]; });
  sh.appendRow([key, val, desc]);
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e6f4f2');
    sh.setFrozenRows(1);
  }
  return sh;
}

function semakMuridMenu() {
  var ui = SpreadsheetApp.getUi();
  try {
    var info = readStudents_();
    var kelas = {}, rumah = {};
    info.students.forEach(function (s) { kelas[s[2]] = 1; rumah[s[3] || '(tiada)'] = 1; });
    ui.alert('Senarai murid OK',
      'Jumlah murid: ' + info.students.length + '\n' +
      'Kelas: ' + Object.keys(kelas).length + '\n' +
      'Rumah: ' + Object.keys(rumah).join(', ') + '\n\n' +
      'Lajur dikesan: ' + info.detected + (info.warnings.length ? '\n\nAmaran:\n- ' + info.warnings.join('\n- ') : ''),
      ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Masalah senarai murid', e.message, ui.ButtonSet.OK);
  }
}

function janaLaporanMenu() {
  var ui = SpreadsheetApp.getUi();
  var today = todayStr_();
  var a = ui.prompt('Laporan mata rumah', 'Tarikh mula (yyyy-mm-dd):', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var b = ui.prompt('Laporan mata rumah', 'Tarikh akhir (yyyy-mm-dd). Kosongkan untuk hari ini (' + today + '):', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var rep = buildReport_(a.getResponseText().trim() || '2000-01-01', b.getResponseText().trim() || today);
  writeReportSheet_(rep);
  SpreadsheetApp.getActive().getSheetByName(SH.LAPORAN).activate();
}

/* =========================================================
 *  WEB APP
 * ========================================================= */

function doGet() {
  var s = getSettings_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(s.NAMA_APP || 'SiDIA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Maklumat awal (tanpa data murid) untuk paparan log masuk. */
function getConfig() {
  var s = getSettings_();
  var users = readUsers_();
  var email = currentEmail_();
  var me = null;
  users.forEach(function (u) { if (u.email === email) me = u; });
  return {
    namaApp: s.NAMA_APP || 'SiDIA',
    namaSekolah: s.NAMA_SEKOLAH || '',
    peranan: splitList_(s.PERANAN || 'Guru,Warden,Pengawas'),
    lokasi: splitList_(s.LOKASI || ''),
    needPin: !users.length && !!String(s.KOD_AKSES || '').trim(),
    userListMode: users.length > 0,
    email: email,
    listedUser: me
  };
}

/** Data utama: murid + kesalahan. */
function getBootstrap(ctx) {
  var user = auth_(ctx);
  var info = readStudents_();
  return {
    user: user,
    students: info.students,
    offenses: readOffenses_(),
    warnings: info.warnings
  };
}

/**
 * Simpan rekod secara pukal.
 * payload = {kod, tarikh:'yyyy-mm-dd', masa:'HH:mm', lokasi, catatan, ids:[...]}
 */
function saveRecords(ctx, payload) {
  var user = auth_(ctx);
  if (!user.nama) throw new Error('Sila isi nama pelapor.');
  payload = payload || {};
  var ids = (payload.ids || []).map(String);
  if (!ids.length) throw new Error('Tiada murid dipilih.');
  if (ids.length > 1000) throw new Error('Terlalu banyak murid dalam satu rekod (maksimum 1000).');

  var off = null;
  readOffenses_().forEach(function (o) { if (o.kod === payload.kod) off = o; });
  if (!off) throw new Error('Kesalahan "' + payload.kod + '" tidak dijumpai.');

  var tarikh = String(payload.tarikh || todayStr_());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh)) throw new Error('Format tarikh tidak sah.');
  var masa = String(payload.masa || '').slice(0, 5);

  var byId = {};
  readStudents_().students.forEach(function (s) { byId[s[0]] = s; });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = rekodSheet_();
    // semak pendua: murid + kesalahan + tarikh yang sama
    var existing = {};
    var last = sh.getLastRow();
    if (last >= 2) {
      var start = Math.max(2, last - 4000);
      var vals = sh.getRange(start, 1, last - start + 1, REKOD_HEADERS.length).getValues();
      vals.forEach(function (r) {
        if (dateStr_(r[R.TARIKH]) === tarikh && String(r[R.KOD]) === off.kod) existing[String(r[R.ID_MURID])] = 1;
      });
    }

    var batch = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    var now = new Date();
    var parts = tarikh.split('-');
    var tarikhDate = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var rows = [], skipped = [], notFound = [], seen = {};
    ids.forEach(function (id) {
      if (seen[id]) return; seen[id] = 1;
      var s = byId[id];
      if (!s) { notFound.push(id); return; }
      if (existing[id] && !payload.benarkanPendua) { skipped.push(s[1] + ' (' + s[2] + ')'); return; }
      rows.push([
        batch + '-' + (rows.length + 1), now, tarikhDate, masa ? "'" + masa : '', "'" + id,
        s[1], s[2], s[3], off.kod, off.kesalahan, off.kategori, off.mata,
        user.nama, user.email, user.peranan, payload.lokasi || '', payload.catatan || '', batch
      ]);
    });
    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, REKOD_HEADERS.length).setValues(rows);
      SpreadsheetApp.flush();
    }
    return { disimpan: rows.length, pendua: skipped, tidakDijumpai: notFound, batch: rows.length ? batch : null };
  } finally {
    lock.releaseLock();
  }
}

/** Rekod terkini (dikumpul mengikut kumpulan simpanan). */
function getRecent(ctx, opts) {
  var user = auth_(ctx);
  opts = opts || {};
  var sh = rekodSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { batches: [] };
  var start = Math.max(2, last - 1500);
  var vals = sh.getRange(start, 1, last - start + 1, REKOD_HEADERS.length).getValues();
  var s = getSettings_();
  var hadMs = (parseFloat(s.HAD_PADAM_JAM) || 24) * 3600 * 1000;
  var map = {}, order = [];
  for (var i = vals.length - 1; i >= 0; i--) {
    var r = vals[i];
    var b = String(r[R.KUMPULAN] || r[R.ID]);
    if (opts.milikSaya && !isOwner_(user, r)) continue;
    if (!map[b]) {
      if (order.length >= 40) continue;
      var t = r[R.MASA_REKOD] instanceof Date ? r[R.MASA_REKOD] : new Date(r[R.MASA_REKOD]);
      map[b] = {
        batch: b, masaRekod: fmtDateTime_(t), tarikh: dateStr_(r[R.TARIKH]), masa: String(r[R.MASA] || ''),
        kod: r[R.KOD], kesalahan: r[R.KESALAHAN], pelapor: r[R.PELAPOR], peranan: r[R.PERANAN],
        lokasi: r[R.LOKASI], catatan: r[R.CATATAN], murid: [],
        canDelete: user.isAdmin || (isOwner_(user, r) && (new Date() - t) < hadMs)
      };
      order.push(b);
    }
    map[b].murid.push([r[R.NAMA], r[R.KELAS]]);
  }
  return { batches: order.map(function (b) { map[b].murid.reverse(); return map[b]; }) };
}

function deleteBatch(ctx, batch, idMurid) {
  var user = auth_(ctx);
  batch = String(batch || '');
  if (!batch) throw new Error('Tiada ID kumpulan.');
  var s = getSettings_();
  var hadMs = (parseFloat(s.HAD_PADAM_JAM) || 24) * 3600 * 1000;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = rekodSheet_();
    var last = sh.getLastRow();
    if (last < 2) return { dipadam: 0 };
    var vals = sh.getRange(2, 1, last - 1, REKOD_HEADERS.length).getValues();
    var rowsToDelete = [];
    vals.forEach(function (r, i) {
      if (String(r[R.KUMPULAN]) !== batch) return;
      if (idMurid && String(r[R.ID_MURID]) !== String(idMurid)) return;
      var t = r[R.MASA_REKOD] instanceof Date ? r[R.MASA_REKOD] : new Date(r[R.MASA_REKOD]);
      if (!user.isAdmin && !(isOwner_(user, r) && (new Date() - t) < hadMs)) {
        throw new Error('Anda tidak dibenarkan memadam rekod ini (bukan rekod anda atau melebihi had masa).');
      }
      rowsToDelete.push(i + 2);
    });
    // padam dari bawah, gabungkan baris berturutan
    for (var j = rowsToDelete.length - 1; j >= 0;) {
      var end = rowsToDelete[j], k = j;
      while (k > 0 && rowsToDelete[k - 1] === rowsToDelete[k] - 1) k--;
      sh.deleteRows(rowsToDelete[k], end - rowsToDelete[k] + 1);
      j = k - 1;
    }
    return { dipadam: rowsToDelete.length };
  } finally {
    lock.releaseLock();
  }
}

/** Laporan untuk web app (termasuk data mentah untuk eksport CSV). */
function getReport(ctx, from, to) {
  var user = auth_(ctx);
  if (!user.isAdmin) throw new Error('ADMIN_DIPERLUKAN: Laporan memerlukan kod admin.');
  return buildReport_(from, to);
}

/** Tulis laporan ke tab LAPORAN dan pulangkan pautan. */
function writeReport(ctx, from, to) {
  var user = auth_(ctx);
  if (!user.isAdmin) throw new Error('ADMIN_DIPERLUKAN: Laporan memerlukan kod admin.');
  var rep = buildReport_(from, to);
  var sh = writeReportSheet_(rep);
  return { url: SpreadsheetApp.getActive().getUrl() + '#gid=' + sh.getSheetId() };
}

/* =========================================================
 *  LAPORAN
 * ========================================================= */

function buildReport_(from, to) {
  from = String(from || '2000-01-01'); to = String(to || todayStr_());
  var sh = rekodSheet_();
  var last = sh.getLastRow();
  var vals = last >= 2 ? sh.getRange(2, 1, last - 1, REKOD_HEADERS.length).getValues() : [];
  var rumah = {}, kes = {}, kelas = {}, murid = {}, rows = [];

  // pastikan semua rumah muncul walaupun tiada kesalahan
  try { readStudents_().students.forEach(function (s) { var h = s[3] || '(Tiada rumah)'; if (!rumah[h]) rumah[h] = { rumah: h, kes: 0, mata: 0, murid: {} }; }); } catch (e) {}

  vals.forEach(function (r) {
    var d = dateStr_(r[R.TARIKH]);
    if (!d || d < from || d > to) return;
    var mata = parseFloat(r[R.MATA]) || 0;
    var h = String(r[R.RUMAH] || '(Tiada rumah)');
    var idm = String(r[R.ID_MURID]);
    if (!rumah[h]) rumah[h] = { rumah: h, kes: 0, mata: 0, murid: {} };
    rumah[h].kes++; rumah[h].mata += mata; rumah[h].murid[idm] = 1;

    var kk = String(r[R.KOD]);
    if (!kes[kk]) kes[kk] = { kod: kk, kesalahan: r[R.KESALAHAN], kes: 0, mata: 0 };
    kes[kk].kes++; kes[kk].mata += mata;

    var kl = String(r[R.KELAS]);
    if (!kelas[kl]) kelas[kl] = { kelas: kl, kes: 0, mata: 0 };
    kelas[kl].kes++; kelas[kl].mata += mata;

    if (!murid[idm]) murid[idm] = { id: idm, nama: r[R.NAMA], kelas: kl, rumah: h, kes: 0, mata: 0 };
    murid[idm].kes++; murid[idm].mata += mata;

    rows.push([d, String(r[R.MASA] || ''), idm, r[R.NAMA], kl, h, kk, r[R.KESALAHAN], r[R.KATEGORI], mata,
      r[R.PELAPOR], r[R.PERANAN], r[R.LOKASI], r[R.CATATAN]]);
  });

  var byMata = function (a, b) { return b.mata - a.mata || b.kes - a.kes; };
  return {
    from: from, to: to, jumlahKes: rows.length,
    rumah: Object.keys(rumah).map(function (k) { var o = rumah[k]; return { rumah: o.rumah, kes: o.kes, mata: o.mata, murid: Object.keys(o.murid).length }; }).sort(byMata),
    kesalahan: Object.keys(kes).map(function (k) { return kes[k]; }).sort(byMata),
    kelas: Object.keys(kelas).map(function (k) { return kelas[k]; }).sort(byMata),
    murid: Object.keys(murid).map(function (k) { return murid[k]; }).sort(byMata),
    rekodHeaders: ['Tarikh', 'Masa', 'ID Murid', 'Nama', 'Kelas', 'Rumah', 'Kod', 'Kesalahan', 'Kategori', 'Mata', 'Pelapor', 'Peranan', 'Lokasi', 'Catatan'],
    rekod: rows
  };
}

function writeReportSheet_(rep) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SH.LAPORAN) || ss.insertSheet(SH.LAPORAN);
  sh.clear();
  var s = getSettings_();
  var out = [];
  out.push(['LAPORAN DISIPLIN — ' + (s.NAMA_SEKOLAH || ''), '', '', '']);
  out.push(['Tempoh: ' + rep.from + ' hingga ' + rep.to + '   |   Jumlah kes: ' + rep.jumlahKes, '', '', '']);
  out.push(['', '', '', '']);
  out.push(['MATA DEMERIT MENGIKUT RUMAH', '', '', '']);
  out.push(['Rumah', 'Bil. Kes', 'Bil. Murid Terlibat', 'Jumlah Mata Ditolak']);
  rep.rumah.forEach(function (x) { out.push([x.rumah, x.kes, x.murid, x.mata]); });
  out.push(['', '', '', '']);
  out.push(['MENGIKUT KESALAHAN', '', '', '']);
  out.push(['Kod', 'Kesalahan', 'Bil. Kes', 'Jumlah Mata']);
  rep.kesalahan.forEach(function (x) { out.push([x.kod, x.kesalahan, x.kes, x.mata]); });
  out.push(['', '', '', '']);
  out.push(['MENGIKUT KELAS', '', '', '']);
  out.push(['Kelas', 'Bil. Kes', 'Jumlah Mata', '']);
  rep.kelas.forEach(function (x) { out.push([x.kelas, x.kes, x.mata, '']); });
  sh.getRange(1, 1, out.length, 4).setValues(out);

  // senarai murid di sebelah kanan
  var m = [['MURID (paling banyak mata)', '', '', '', ''], ['Nama', 'Kelas', 'Rumah', 'Bil. Kes', 'Mata']];
  rep.murid.forEach(function (x) { m.push([x.nama, x.kelas, x.rumah, x.kes, x.mata]); });
  sh.getRange(1, 6, m.length, 5).setValues(m);

  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  out.forEach(function (row, i) {
    if (/^(MATA DEMERIT|MENGIKUT)/.test(String(row[0]))) sh.getRange(i + 1, 1).setFontWeight('bold').setFontColor('#0f766e');
    if (['Rumah', 'Kod', 'Kelas'].indexOf(row[0]) >= 0) sh.getRange(i + 1, 1, 1, 4).setFontWeight('bold').setBackground('#e6f4f2');
  });
  sh.getRange(1, 6).setFontWeight('bold').setFontColor('#0f766e');
  sh.getRange(2, 6, 1, 5).setFontWeight('bold').setBackground('#e6f4f2');
  sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 260); sh.setColumnWidth(6, 280);
  return sh;
}

/* =========================================================
 *  PEMBANTU
 * ========================================================= */

function auth_(ctx) {
  ctx = ctx || {};
  var s = getSettings_();
  var email = currentEmail_();
  var users = readUsers_();
  var adminRoles = splitList_(s.PERANAN_ADMIN || 'Admin,Guru Disiplin').map(lower_);
  var kodAdmin = String(s.KOD_ADMIN || '').trim();
  var adminByPin = !!kodAdmin && String(ctx.adminPin || '').trim() === kodAdmin;
  var user;
  if (users.length) {
    var u = null;
    users.forEach(function (x) { if (x.email === email) u = x; });
    if (!u) throw new Error('AKSES_DITOLAK: Emel ' + (email || '(tidak dapat dikenal pasti — log masuk dengan akaun sekolah)') + ' tiada dalam senarai pengguna. Hubungi admin.');
    user = { email: email, nama: u.nama || email, peranan: u.peranan || '', fromList: true };
    user.isAdmin = adminRoles.indexOf(lower_(user.peranan)) >= 0 || adminByPin;
  } else {
    var kod = String(s.KOD_AKSES || '').trim();
    if (kod && String(ctx.pin || '').trim() !== kod) throw new Error('KOD_SALAH: Kod akses tidak sah.');
    user = { email: email, nama: String(ctx.nama || '').trim().slice(0, 80), peranan: String(ctx.peranan || '').trim().slice(0, 40), fromList: false };
    user.isAdmin = kodAdmin ? adminByPin : true;
  }
  return user;
}

function isOwner_(user, r) {
  var em = String(r[R.EMEL] || '').toLowerCase();
  if (user.email && em) return em === user.email;
  return lower_(r[R.PELAPOR]) === lower_(user.nama);
}

function currentEmail_() {
  try { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); } catch (e) { return ''; }
}

function getSettings_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.TETAPAN);
  var out = {};
  DEFAULT_TETAPAN.forEach(function (r) { out[r[0]] = r[1]; });
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues().forEach(function (r) {
    var k = String(r[0]).trim().toUpperCase();
    if (k) out[k] = String(r[1]).trim();
  });
  return out;
}

function readUsers_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.PENGGUNA);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 3).getDisplayValues()
    .filter(function (r) { return /@/.test(r[0]); })
    .map(function (r) { return { email: lower_(r[0]), nama: String(r[1]).trim(), peranan: String(r[2]).trim() }; });
}

function readOffenses_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.KESALAHAN);
  if (!sh || sh.getLastRow() < 2) throw new Error('Tab KESALAHAN kosong. Jalankan menu SiDIA > Sediakan sistem.');
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getDisplayValues()
    .filter(function (r) { return String(r[0]).trim() && String(r[1]).trim() && !/^(tidak|no|n|x|0)$/i.test(String(r[4]).trim()); })
    .map(function (r) {
      return { kod: String(r[0]).trim(), kesalahan: String(r[1]).trim(), kategori: String(r[2]).trim(), mata: parseFloat(r[3]) || 0 };
    });
}

/**
 * Baca senarai murid. Lajur dikesan secara automatik daripada tajuk:
 * Nama (wajib), Kelas, Rumah, ID / No. MyKid / No. KP / Angka Giliran.
 * Pulangan: students = [[id, nama, kelas, rumah], ...]
 */
function readStudents_() {
  var s = getSettings_();
  var ss = s.ID_SPREADSHEET_MURID ? SpreadsheetApp.openById(s.ID_SPREADSHEET_MURID) : SpreadsheetApp.getActive();
  var tab = s.TAB_MURID || SH.MURID;
  var sh = ss.getSheetByName(tab);
  if (!sh) throw new Error('Tab murid "' + tab + '" tidak dijumpai. Semak TETAPAN > TAB_MURID.');
  var values = sh.getDataRange().getDisplayValues();
  var hr = -1, map = null;
  for (var i = 0; i < Math.min(10, values.length); i++) {
    map = mapHeaders_(values[i]);
    if (map.nama >= 0) { hr = i; break; }
  }
  if (hr < 0) throw new Error('Tiada lajur "Nama" dijumpai dalam tab ' + tab + '.');
  var warnings = [];
  if (map.kelas < 0) warnings.push('Lajur Kelas tidak dijumpai.');
  if (map.rumah < 0) warnings.push('Lajur Rumah tidak dijumpai — laporan mata rumah tidak dapat dikira.');
  if (map.id < 0) warnings.push('Lajur ID/No. MyKid tidak dijumpai — nombor baris digunakan sebagai ID (jangan susun semula senarai).');

  var out = [], seen = {};
  for (var r = hr + 1; r < values.length; r++) {
    var row = values[r];
    var nama = String(row[map.nama] || '').trim();
    if (!nama) continue;
    var id = map.id >= 0 ? String(row[map.id] || '').trim() : '';
    if (!id) id = 'R' + (r + 1);
    if (seen[id]) { warnings.push('ID berulang: ' + id); id = id + '_' + (r + 1); }
    seen[id] = 1;
    out.push([
      id, nama,
      map.kelas >= 0 ? String(row[map.kelas] || '').trim() : '',
      map.rumah >= 0 ? String(row[map.rumah] || '').trim().toUpperCase() : ''
    ]);
  }
  if (!out.length) warnings.unshift('Senarai murid kosong. Pentadbir perlu jalankan menu SiDIA › Mula di sini.');
  var hdr = values[hr];
  var detected = ['nama', 'kelas', 'rumah', 'id'].filter(function (k) { return map[k] >= 0; })
    .map(function (k) { return k + '="' + hdr[map[k]] + '"'; }).join(', ');
  return { students: out, warnings: warnings.slice(0, 10), detected: detected };
}

function mapHeaders_(row) {
  var h = row.map(function (x) { return lower_(x); });
  function find(pats, exclude) {
    for (var i = 0; i < h.length; i++) {
      if (!h[i] || (exclude && exclude.test(h[i]))) continue;
      for (var j = 0; j < pats.length; j++) if (pats[j].test(h[i])) return i;
    }
    return -1;
  }
  return {
    nama: find([/^nama( penuh)?( murid| pelajar)?$/, /^nama/, /^name/, /nama murid/, /nama pelajar/], /kelas|rumah|bapa|ibu|penjaga|guru/),
    kelas: find([/^kelas/, /^class/, /tingkatan/, /^ting/], /guru/),
    rumah: find([/^rumah/, /rumah sukan/, /^house/, /sukan/]),
    id: find([/^id( murid| pelajar)?$/, /mykid/, /mykad/, /no\.? ?(kp|k\/p|ic|kad)/, /kad pengenalan/, /angka giliran/, /no\.? ?(pend|daftar|matrik)/, /^id/])
  };
}

function rekodSheet_() {
  var ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(SH.REKOD) || ensureSheet_(ss, SH.REKOD, REKOD_HEADERS);
}

function splitList_(s) {
  return String(s || '').split(/[,\n]/).map(function (x) { return x.trim(); }).filter(String);
}
function lower_(x) { return String(x == null ? '' : x).trim().toLowerCase(); }
function tz_() { return Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur'; }
function todayStr_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function fmtDateTime_(d) {
  if (!(d instanceof Date) || isNaN(d)) return '';
  return Utilities.formatDate(d, tz_(), 'dd/MM/yyyy HH:mm');
}
function dateStr_(v) {
  if (v instanceof Date) return isNaN(v) ? '' : Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  var s = String(v || '').trim();
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return s;
}
