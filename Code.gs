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

/** Versi SiDIA yang dipasang. Mesti sama dengan version.json di GitHub bagi setiap keluaran. */
var SIDIA_VERSION = '1.6.1';
/** Sumber kemas kini (repo awam GitHub). */
var SIDIA_REPO = 'g-03355699-tech/sidia';
/** Ikon web app (dihoskan di GitHub Pages). */
var SIDIA_ICON = 'https://g-03355699-tech.github.io/sidia/img/logo-96.png';

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
  ['KOD_GURU', '', 'PIN untuk Guru, Warden & Guru Disiplin. Tukar melalui web app (Laporan › PIN akses) atau wizard'],
  ['KOD_MURID', '', 'PIN untuk Pengawas / murid bertugas'],
  ['KOD_ADMIN', '', 'PIN Admin: laporan, padam rekod orang lain, tukar PIN. Jika kosong, semua pengguna boleh lihat laporan'],
  ['KOD_AKSES', '', 'Lama (sebelum v1.2). Digunakan untuk Guru & Pengawas hanya jika KOD_GURU / KOD_MURID kosong'],
  ['PERANAN', 'Guru,Warden,Pengawas,Guru Disiplin,Admin', 'Senarai peranan (pisahkan dengan koma)'],
  ['PERANAN_ADMIN', 'Admin,Guru Disiplin', 'Peranan dalam tab PENGGUNA yang dianggap admin'],
  ['LOKASI', 'Surau,Asrama,Kelas,Dewan Makan,Kantin,Padang,Pintu Pagar,Dewan', 'Senarai lokasi (pisahkan dengan koma)'],
  ['HAD_PADAM_JAM', '24', 'Pengguna biasa boleh padam rekod sendiri dalam tempoh ini (jam)'],
  ['ID_SPREADSHEET_MURID', '', 'Pilihan. Jika senarai murid berada dalam fail Google Sheet lain, tampal ID fail itu di sini'],
  ['TAB_MURID', 'MURID', 'Nama tab yang mengandungi senarai murid'],
  ['WEB_APP_URL', '', 'Pautan web app (diisi automatik oleh wizard)']
];

var DEFAULT_KESALAHAN = [
  // [Kod, Kesalahan, Kategori, Mata, Aktif, Pantas]
  ["111", "BERJUDI", "Berat", 9, "Ya", ""],
  ["114", "MELAWAN/MENGANCAM/MEMUKUL/MENCEDERAKAN PENGAWAS", "Berat", 9, "Ya", ""],
  ["115", "MEMERAS UGUT", "Berat", 9, "Ya", ""],
  ["116", "MEMBULI/PELACOAN", "Berat", 9, "Ya", ""],
  ["117", "MENGANGOTAI KUMPULAN HARAM/KONGSI GELAP", "Berat", 9, "Ya", ""],
  ["118", "MENYALAHGUNAKAN DADAH", "Berat", 9, "Ya", ""],
  ["119", "MEMBAWA SENJATA BERBAHAYA", "Berat", 9, "Ya", ""],
  ["120", "MENCABUL KEHORMATAN", "Berat", 9, "Ya", ""],
  ["121", "MENGANCAM/MEMUKUL/MENCEDERAKAN PELAJAR LAIN", "Berat", 9, "Ya", ""],
  ["122", "MENCEROBOH BILIK KHAS/KEDAI KOPERASI/PEJABAT SEKOLAH ATAU ASRAMA", "Berat", 9, "Ya", ""],
  ["124", "MENUNJUK PERASAAN/BERPIKET/MENGGANGGU KETENTERAMAN SEKOLAH", "Berat", 9, "Ya", ""],
  ["125", "BERTARUH SECARA BESAR-BESARAN", "Berat", 9, "Ya", ""],
  ["221", "BERCUMBU-CUMBUAN", "Berat", 9, "Ya", ""],
  ["222", "BERKHALWAT", "Berat", 9, "Ya", ""],
  ["223", "MEMBAWA BAHAN LUCAH KE SEKOLAH", "Berat", 9, "Ya", ""],
  ["224", "MENGINTAI PELAJAR-PELAJAR PEREMPUAN", "Berat", 9, "Ya", ""],
  ["225", "MENGGUNAKAN KATA/PERBUATAN LUCAH", "Berat", 9, "Ya", ""],
  ["226", "MELUKIS DAN MENULIS KATA-KATA DAN GAMBAR-GAMBAR LUCAH", "Berat", 9, "Ya", ""],
  ["551", "BERKELAKUAN KASAR TERHADAP GURU", "Berat", 9, "Ya", ""],
  ["555", "MENYIMPAN ROKOK", "Berat", 9, "Ya", ""],
  ["556", "MENGHISAP ROKOK", "Berat", 9, "Ya", ""],
  ["560", "MEMINUM MINUMAN KERAS", "Berat", 9, "Ya", ""],
  ["662", "MEROSAKKAN HARTA BENDA PENGETUA/GURU BESAR DAN GURU-GURU", "Berat", 9, "Ya", ""],
  ["663", "MEROSAKKAN HARTA BENDA KANTIN", "Berat", 9, "Ya", ""],
  ["911", "BERGADUH/BERKELAHI", "Berat", 9, "Ya", ""],
  ["913", "KESALAHAN SIBER", "Berat", 9, "Ya", ""],
  ["A11", "PENGLIBATAN DALAM POLITIK", "Berat", 9, "Ya", ""],
  ["B01", "MELAKUKAN MANA - MANA KESALAHAN SEDERHANA KALI KE 3", "Berat", 30, "Ya", ""],
  ["B02", "MENYIMPAN, MEMBAWA, MENGHISAP ATAU TERBABIT DALAM KEGIATAN DADAH", "Berat", 30, "Ya", ""],
  ["B03", "MEMBAWA, MENYIMPAN, MENGHISAP ATAU MENGEDARKAN BAHAN TEMBAKAU/VAPE/ROKOK ELEKTRONIK", "Berat", 30, "Ya", ""],
  ["B04", "MEMBAWA MEMINUM, MENYIMPAN ATAU MENGEDAR MINUMAN KERAS ATAU SEBARANG BENDA YANG MEMABUKKAN /MENGKHAYALKAN.", "Berat", 30, "Ya", ""],
  ["B05", "MENYEBABKAN / MELAKUKAN PERGADUHAN ATAU KEKERASAN.", "Berat", 30, "Ya", ""],
  ["B06", "MELAWAN, MENGANCAM, MEMUKUL, MENGUGUT ATAU MENCEDERAKAN GURU / PENGAWAS MURID.", "Berat", 30, "Ya", ""],
  ["B07", "BIADAP TERHADAP GURU/PENGAWAS/MURID.", "Berat", 30, "Ya", ""],
  ["B08", "MEMERAS UGUT GURU/ PENGAWAS/ MURID.", "Berat", 30, "Ya", ""],
  ["B09", "MEMBAWA/ MENGGUNAKAN SENJATA ATAU ALAT BERBAHAYA.", "Berat", 30, "Ya", ""],
  ["B10", "MELAKUKAN BULI (PELANCOAN), PENDERAAN ATAU PAKSAAN TERHADAP MURID LAIN.", "Berat", 30, "Ya", ""],
  ["B11", "MENCURI, MEROMPAK, MEMECAH MASUK DAN MENCEROBOH KAWASAN LARANGAN.", "Berat", 30, "Ya", ""],
  ["B12", "MELAKUKAN PERJUDIAN ATAU MEMBABITKAN DIRI DALAM PERTARUHAN.", "Berat", 30, "Ya", ""],
  ["B13", "MENCETAK, MENERBIT, MEMPAMER, MENGEDAR ATAU MENYIMPAN RENCANA, MAJALAH ATAU PITA RAKAMAN DAN MULTIMEDIA TERLARANG.", "Berat", 30, "Ya", ""],
  ["B14", "MEMBABITKAN DIRI DALAM KUMPULAN HARAM", "Berat", 30, "Ya", ""],
  ["B15", "MENCABUL KEHORMATAN GURU/ MURID.", "Berat", 30, "Ya", ""],
  ["B16", "MELAKUKAN ZINA, LIWAT, HUBUNGAN LUAR TABII.", "Berat", 30, "Ya", ""],
  ["B17", "MELACUR/MENJADI BOHSIA/BOHJAN/PONDAN.", "Berat", 30, "Ya", ""],
  ["B18", "BERSEKEDUDUKAN ATAU MEMBABITKAN DIRI DALAM KEGIATAN TIDAK BERMORAL.", "Berat", 30, "Ya", ""],
  ["B19", "MENGINTAI MURID PEREMPUAN/LELAKI", "Berat", 30, "Ya", ""],
  ["B20", "MENULIS ATAU MENGELUARKAN KENYATAAN AKHBAR YANG MENCEMARKAN.", "Berat", 30, "Ya", ""],
  ["B21", "MEROSAKKAN HARTA BENDA SEKOLAH/GURU", "Berat", 30, "Ya", ""],
  ["B22", "MEMBAWA ATAU MENGGUNAKAN BAHAN LETUPAN.", "Berat", 30, "Ya", ""],
  ["B23", "MENULIS/MELUKIS PERKATAAN ATAU GAMBAR LUCAH ATAU MELAKUKAN PERBUATAN LUCAH.", "Berat", 30, "Ya", ""],
  ["B24", "MEMBABITKAN DIRI DALAM TUNJUK PERASAAN,PERHIMPUNAN HARAM ATAU RUSUHAN.", "Berat", 30, "Ya", ""],
  ["B25", "MENYALAHGUNAKAN ALAT PERMAINAN,ELEKTRONIK ATAU BAHAN-BAHAN MULTIMEDIA.", "Berat", 30, "Ya", ""],
  ["B26", "MEMBAWA ATAU MENGGUNAKAN ALAT YANG MENYEBABKAN KECEDERAAN ATAU MENGGANGGU PENGAJARAN DAN PEMBELAJARAN/PEPERIKAAN ATAU UJIAN.", "Berat", 30, "Ya", ""],
  ["B27", "MENGGANGGU ATAU MEMBABITKAN DIRI DALAM ACARA KEBUDAYAAN YANG BERTENTANGAN DENGAN MASYARAKAT MALAYSIA.", "Berat", 30, "Ya", ""],
  ["B28", "MENGANJUR ATAU MEMBABITKAN DIRI DALAM ACARA KEBUDAYAAN TANPA KEBENARAN PIHAK SEKOLAH, JABATAN PENDIDIKAN NEGERI DAN KEMENTERIAN PENDIDIKAN MALAYSIA.", "Berat", 30, "Ya", ""],
  ["B29", "MELAKUKAN PONTENG SEKOLAH BERTERUSAN (BERTURUT-TURUT) SELAMA 30 HARI ATAU BERKALA TERUS (TIDAK BRTURUT-TURUT) SELAMA 60 HARI SELAMA 1 TAHUN SESI PERSEKOLAHAN.", "Berat", 30, "Ya", ""],
  ["B30", "MENGGANGGU/MENJEJASKAN KUASA GURU BESAR, PENGETUA ATAU GURU YANG MENJALANKAN TUGAS.", "Berat", 30, "Ya", ""],
  ["B31", "MEMBAWA MASUK TETAMU DARI LUAR KE KAWASAN SEKOLAH TANPA KEBENARAN.", "Berat", 30, "Ya", ""],
  ["B32", "MENGEDAR, MEMILIKI, MEMBAWA, MELUKIS DAN MEMPAMERKAN BAHAN LUCAH.", "Berat", 30, "Ya", ""],
  ["B33", "MENGELUARKAN KATA-KATA LUCAH DAN KESAT.", "Berat", 30, "Ya", ""],
  ["B34", "MELAKUKAN HUBUNGAN YANG DICURIGAI.", "Berat", 30, "Ya", ""],
  ["B35", "KESALAHAN-KESALAHAN LAIN YANG DIFIKIRKAN TERMASUK DALAM KATEGORI INI.", "Berat", 30, "Ya", ""],
  ["B36", "BERKHALAWAT/BERDUA-DUAAN DI TEMPAT YANG TIDAK SEPATUTNYA", "Berat", 30, "Ya", ""],
  ["L03", "LAIN-LAIN KES DALAM KATEGORI INI", "Berat", 9, "Ya", ""],
  ["112", "MENCURI", "Sederhana", 3, "Ya", ""],
  ["331", "RAMBUT PANJANG/ FESYEN RAMBUT KETERLALUAN", "Sederhana", 3, "Ya", ""],
  ["551-2", "BERKELAKUAN KASAR TERHADAP PELAJAR LAIN", "Sederhana", 3, "Ya", ""],
  ["552", "BERKELAKUAN KASAR TERHADAP PENGAWAS", "Sederhana", 3, "Ya", ""],
  ["554", "BERBAHASA KESAT", "Sederhana", 3, "Ya", ""],
  ["557", "MENGGANGGU PROSES PENGAJARAN DAN PEMBELAJARAN", "Sederhana", 3, "Ya", ""],
  ["558", "TIDAK MENGHORMATI GURU", "Sederhana", 3, "Ya", ""],
  ["559", "TIDAK MENGHORMATI PENGAWAS", "Sederhana", 3, "Ya", ""],
  ["661", "MEROSAKKAN HARTA BENDA SEKOLAH", "Sederhana", 3, "Ya", ""],
  ["664", "MEROSAKKAN HARTA BAENADA MURID", "Sederhana", 3, "Ya", ""],
  ["771", "MENIPU YANG MELIBATKAN WANG", "Sederhana", 3, "Ya", ""],
  ["772", "MENIPU YANG MELIBATKAN KEPERCAYAAN", "Sederhana", 3, "Ya", ""],
  ["881", "PONTENG KELAS", "Sederhana", 3, "Ya", ""],
  ["882", "PONTENG SEKOLAH", "Sederhana", 3, "Ya", ""],
  ["884", "PONTENG KEGIATAN LUAR BILIK DARJAH/KO-KURIKULUM", "Sederhana", 3, "Ya", ""],
  ["885", "PONTENG UJIAN", "Sederhana", 3, "Ya", ""],
  ["886", "PONTENG PEPERIKSAAN", "Sederhana", 3, "Ya", ""],
  ["887", "PONTENG UNTUK KELAS TAMBAHAN/ KELAS PERSEDIAAN", "Sederhana", 3, "Ya", ""],
  ["888", "PONTENG ASRAMA", "Sederhana", 3, "Ya", ""],
  ["912", "KENAKALAN/HOOLIGANISM", "Sederhana", 3, "Ya", ""],
  ["L02", "LAIN-LAIN KES DALAM KATEGORI INI", "Sederhana", 3, "Ya", ""],
  ["S01", "MELAKUKAN MANA-MANA KESALAHAN RINGAN MELEBIHI 3 KALI.", "Sederhana", 10, "Ya", ""],
  ["S02", "MENYALAHGUNAKAN/MENGGUNAKAN PERALATAN/SUMBER BEKALAN ELEKTRIK SEKOLAH TANPA KEBENARAN.", "Sederhana", 10, "Ya", ""],
  ["S03", "KELUAR DARI KAWASAN TANPA KEBENARAN.", "Sederhana", 10, "Ya", ""],
  ["S04", "TIDAK AMANAH, MENIPU, MEMBOHONG DAN MENIRU KETIKA UJIAN PEPERIKSAAN", "Sederhana", 10, "Ya", ""],
  ["S05", "PONTENG SEBARANG ACARA RASMI SEKOLAH.", "Sederhana", 10, "Ya", ""],
  ["S06", "TIDAK MENGHORMATI LAGU-LAGU/BENDERA/JATA SEKOLAH, NEGERI DAN KEBANGSAAN.", "Sederhana", 10, "Ya", ""],
  ["S07", "FESYEN RAMBUT KETERLALUAN SEPERTI PUNK/ SKINHEAD ATAU BERWARNA.", "Sederhana", 10, "Ya", ""],
  ["S08", "MENCONTENG PADA HARTA SEKOLAH.", "Sederhana", 10, "Ya", ""],
  ["S09", "MEMAKAI BARANG KEMAS KETERLALUAN, SEPERTI MENINDIK TELINGA DAN MEMAKAI SUBANG BERLEBIHAN DARIPADA SATU PADA SATU CUPING TELINGA.", "Sederhana", 10, "Ya", ""],
  ["S10", "KESALAHAN LAIN YANG DIFIKIR TERMASUK DALAM KATEGORI INI.", "Sederhana", 10, "Ya", ""],
  ["S11", "MEMBAWA TELEFON BIMBIT KE SEKOLAH", "Sederhana", 10, "Ya", "Ya"],
  ["332", "BERKUKU PANJANG", "Ringan", 1, "Ya", ""],
  ["333", "BERMISAI/ BERJANGGUT PANJANG", "Ringan", 1, "Ya", ""],
  ["334", "MEMAKAI PAKAIAN TIDAK MENGIKUT PERATURAN SEKOLAH", "Ringan", 1, "Ya", ""],
  ["335", "MEMAKAI BARANG-BARANG PERHIASAN YANG DILARANG KE SEKOLAH", "Ringan", 1, "Ya", ""],
  ["441", "BERKELIARAN DI KAWASAN SEKOLAH", "Ringan", 1, "Ya", ""],
  ["442", "DATANG LEWAT KE SEKOLAH", "Ringan", 1, "Ya", ""],
  ["443", "LEWAT KE PERHIMPUNAN", "Ringan", 1, "Ya", ""],
  ["444", "MAKAN DI KANTIN DI LUAR WAKTU REHAT YANG DITETAPKAN", "Ringan", 1, "Ya", ""],
  ["445", "LEWAT PULANG KE ASRAMA", "Ringan", 1, "Ya", ""],
  ["883", "PONTENG PERHIMPUNAN", "Ringan", 1, "Ya", ""],
  ["L01", "LAIN-LAIN KES", "Ringan", 1, "Ya", ""],
  ["R01", "MENYIMPAN MISAI, JANGGUT ATAU JAMBANG.", "Ringan", 3, "Ya", ""],
  ["R02", "BERAMBUT PANJANG ATAU MENYERUPAI KUMPULAN TERTENTU.", "Ringan", 3, "Ya", "Ya"],
  ["R03", "BERMAIN DALAM BILIK DARJAH, KORIDOR ATAU KAWASAN YANG DILARANG.", "Ringan", 3, "Ya", ""],
  ["R04", "MENGGUNAKAN DAN MEMBAWA KELUAR SEBARANG PERALATAN BILIK DARJAH DAN SEKOLAH TANPA KEBENARAN", "Ringan", 3, "Ya", ""],
  ["R05", "KELUAR DARI BILIK DARJAH TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R06", "BERADA DI KANTIN PADA WAKTU PERSEKOLAHAN (KECUALI WAKTU REHAT) TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R07", "MENYIMPAN ATAU MENGGUNAKAN ALAT PERMAINAN KEPUNYAAN SEKOLAH TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R08", "MENGGUNAKAN ALAT HIBURAN ATAU ELEKTRONIK SEKOLAH TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R09", "MEMASUKI ATAU TIDAK MEMATUHI ARAHAN MAKMAL /BENGKEL /BILIK KHAS.", "Ringan", 3, "Ya", ""],
  ["R10", "MEMAKAI BARANG KEMAS ATAU PERHIASAN ATAU ALAT SOLEK KECUALI JAM.", "Ringan", 3, "Ya", ""],
  ["R11", "MEMASUKI BILIK KHAS TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R12", "MAKAN ATAU MINUM DI BILIK DARJAH.", "Ringan", 3, "Ya", ""],
  ["R13", "MELAKUKAN PEMBAZIRAN AIR/ELEKTRIK", "Ringan", 3, "Ya", ""],
  ["R14", "TIDAK MEMAKAI PAKAIAN SEKOLAH YANG LENGKAP.", "Ringan", 3, "Ya", "Ya"],
  ["R15", "SEMUA KESALAHAN BERSABIT DENGAN PEMBELAJARAN (TIDAK MEMBAWA BUKU, TIDAK MEMBUAT KERJA RUMAH, TIDAK MEMBERI PERHATIAN DAN LAIN-LAIN)", "Ringan", 3, "Ya", ""],
  ["R16", "DATANG LEWAT KE SEKOLAH.", "Ringan", 3, "Ya", "Ya"],
  ["R17", "LEWAT BERGERAK KE PERHIMPUNAN/ BENGKEL/ MAKMAL.", "Ringan", 3, "Ya", ""],
  ["R18", "BISING DALAM BILIK DARJAH SEHINGGA MENGGANGU KELAS LAIN.", "Ringan", 3, "Ya", ""],
  ["R19", "MENUNGANG ATAU MEMANDU KENDERAAN DALAM KAWASAN SEKOLAH", "Ringan", 3, "Ya", ""],
  ["R20", "BERJALAN-JALAN TANPA KEBENARAN.", "Ringan", 3, "Ya", ""],
  ["R21", "TIDAK MEMBUAT GERAKERJA YANG DITUGASKAN.", "Ringan", 3, "Ya", ""],
  ["R22", "MENGGANGU KAWASAN.", "Ringan", 3, "Ya", ""],
  ["R23", "MENGGANGU GURU.", "Ringan", 3, "Ya", ""],
  ["R24", "LEWAT MASUK KELAS.", "Ringan", 3, "Ya", "Ya"],
  ["R25", "MENGOTORKAN KELAS.", "Ringan", 3, "Ya", ""],
  ["R26", "TIDAK DUDUK SETEMPAT.", "Ringan", 3, "Ya", ""],
  ["R27", "KESALAHAN LAIN YANG DIFIKIRKAN TERMASUK DALAM KATEGORI INI.", "Ringan", 3, "Ya", ""],
  ["R28", "LEWAT KE SURAU/MASJID", "Ringan", 3, "Ya", "Ya"],
  ["R29", "MEMAKAI PAKAIAN YANG TIDAK LENGKAP", "Ringan", 3, "Ya", ""],
  ["R30", "PONTENG KELAS.", "Ringan", 3, "Ya", "Ya"]
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
    .addItem('Guna senarai kesalahan standard SiDIA…', 'gunaKesalahanStandard')
    .addSeparator()
    .addItem('⬆️ Semak kemas kini SiDIA…', 'semakKemasKiniMenu')
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

  var k = ensureSheet_(ss, SH.KESALAHAN, ['Kod', 'Kesalahan', 'Kategori', 'Mata', 'Aktif', 'Pantas']);
  if (k.getLastRow() < 2) writeOffenses_(DEFAULT_KESALAHAN);
  else if (!k.getRange(1, 6).getValue()) k.getRange(1, 6).setValue('Pantas').setFontWeight('bold').setBackground('#e6f4f2');

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
  var offenses = kes.getLastRow() > 1 ? kes.getRange(2, 1, kes.getLastRow() - 1, 6).getDisplayValues()
    .filter(function (r) { return r[0] || r[1]; }) : [];
  return {
    tetapan: {
      NAMA_SEKOLAH: s.NAMA_SEKOLAH === 'SMK Contoh' ? '' : s.NAMA_SEKOLAH,
      KOD_GURU: s.KOD_GURU || s.KOD_AKSES, KOD_MURID: s.KOD_MURID || s.KOD_AKSES, KOD_ADMIN: s.KOD_ADMIN,
      LOKASI: s.LOKASI, PERANAN: s.PERANAN
    },
    murid: murid,
    offenses: offenses,
    webAppUrl: detectWebAppUrl_(),
    scriptUrl: 'https://script.google.com/d/' + ScriptApp.getScriptId() + '/edit',
    versi: SIDIA_VERSION,
    versiTerkini: (function () { try { return latestRelease_().version; } catch (e) { return ''; } })(),
    email: currentEmail_()
  };
}

function wizSaveSchool(o) {
  o = o || {};
  var nama = String(o.NAMA_SEKOLAH || '').trim();
  if (!nama) throw new Error('Sila isi nama sekolah.');
  savePins_({ guru: o.KOD_GURU, murid: o.KOD_MURID, admin: o.KOD_ADMIN }, false);
  ['NAMA_SEKOLAH', 'LOKASI'].forEach(function (k) {
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

/** rows = [[kod, kesalahan, kategori, mata, aktif, pantas], ...] */
function wizSaveOffenses(rows) {
  rows = (rows || []).filter(function (r) { return String(r[1] || '').trim(); });
  if (!rows.length) throw new Error('Sekurang-kurangnya satu kesalahan diperlukan.');
  var seen = {}, out = [];
  rows.forEach(function (r, i) {
    var kod = String(r[0] || '').trim().toUpperCase() || ('X' + ('0' + (i + 1)).slice(-2));
    if (seen[kod]) throw new Error('Kod kesalahan berulang: ' + kod + '. Setiap kod mesti unik.');
    seen[kod] = 1;
    out.push([kod, String(r[1]).trim(), String(r[2] || '').trim(), parseFloat(r[3]) || 0,
      isNo_(r[4]) ? 'Tidak' : 'Ya', isYes_(r[5]) ? 'Ya' : '']);
  });
  writeOffenses_(out);
  return { disimpan: out.length };
}

function wizDefaultOffenses() { return DEFAULT_KESALAHAN; }

/** Menu: gantikan tab KESALAHAN dengan senarai standard. Rekod lama tidak terjejas. */
function gunaKesalahanStandard() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('Guna senarai kesalahan standard?',
    'Tab KESALAHAN akan diganti dengan ' + DEFAULT_KESALAHAN.length + ' kesalahan standard SiDIA ' +
    '(Ringan / Sederhana / Berat). Rekod sedia ada dalam tab REKOD tidak diubah.\n\nTeruskan?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  ensureSetup_();
  writeOffenses_(DEFAULT_KESALAHAN);
  ui.alert('Selesai: ' + DEFAULT_KESALAHAN.length + ' kesalahan dimasukkan. Tandakan lajur "Pantas" untuk kesalahan yang kerap digunakan.');
}

function writeOffenses_(rows) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.KESALAHAN);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, Math.max(6, sh.getLastColumn())).clearContent();
  sh.getRange(1, 1, 1, 6).setValues([['Kod', 'Kesalahan', 'Kategori', 'Mata', 'Aktif', 'Pantas']]).setFontWeight('bold').setBackground('#e6f4f2');
  sh.getRange(2, 1, rows.length, 1).setNumberFormat('@'); // kod seperti 111 / 551 kekal sebagai teks
  sh.getRange(2, 1, rows.length, 6).setValues(rows.map(function (r) {
    return [String(r[0]), r[1], r[2], r[3], r[4] || 'Ya', r[5] || ''];
  }));
  sh.setColumnWidth(2, 460);
}

function isYes_(v) { return v === true || /^(ya|yes|y|1|true|✓|x)$/i.test(String(v == null ? '' : v).trim()); }
function isNo_(v) { return v === false || /^(tidak|no|n|0|false)$/i.test(String(v == null ? '' : v).trim()); }

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

/**
 * Pautan web app. Pautan yang disimpan (ditampal pengguna) diutamakan, kerana
 * ScriptApp.getService().getUrl() boleh memulangkan deployment lama jika
 * projek mempunyai lebih daripada satu deployment.
 */
function detectWebAppUrl_() {
  var saved = getSettings_().WEB_APP_URL || '';
  if (saved) return saved;
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  if (/\/exec$/.test(url)) { setSetting_('WEB_APP_URL', url); return url; }
  return '';
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
    .setFaviconUrl(SIDIA_ICON)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Maklumat awal (tanpa data murid) untuk paparan log masuk. */
function getConfig() {
  migrateIfNeeded_();
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
    needPin: !users.length && !!(pinFor_(s, 'guru') || pinFor_(s, 'murid') || pinFor_(s, 'admin')),
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
    kiraan: kiraanMurid_(),
    warnings: info.warnings
  };
}

/**
 * Bilangan rekod bagi setiap ID murid: {id: [tahun semasa, keseluruhan]}, dikira terus daripada tab REKOD.
 * Hanya lajur Tarikh Kejadian dan ID Murid dibaca, jadi pantas walaupun puluhan ribu rekod, dan sentiasa tepat
 * (termasuk selepas rekod dipadam terus dalam Google Sheet). Dipaparkan kepada semua pengguna.
 * ids (pilihan): hanya pulangkan kiraan bagi ID ini ([0, 0] jika tiada rekod).
 */
function kiraanMurid_(ids) {
  var sh = rekodSheet_(), last = sh.getLastRow(), all = {};
  var tahun = todayStr_().slice(0, 4);
  if (last >= 2) {
    var idv = sh.getRange(2, R.ID_MURID + 1, last - 1, 1).getDisplayValues();
    var tv = sh.getRange(2, R.TARIKH + 1, last - 1, 1).getValues();
    for (var i = 0; i < idv.length; i++) {
      var id = String(idv[i][0]).trim();
      if (!id) continue;
      var k = all[id] || (all[id] = [0, 0]);
      k[1]++;
      if (dateStr_(tv[i][0]).slice(0, 4) === tahun) k[0]++;
    }
  }
  if (!ids) return all;
  var out = {};
  ids.forEach(function (id) { id = String(id); out[id] = all[id] || [0, 0]; });
  return out;
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
    return { disimpan: rows.length, pendua: skipped, tidakDijumpai: notFound, batch: rows.length ? batch : null,
      kiraan: kiraanMurid_(ids) };
  } finally {
    lock.releaseLock();
  }
}

/** Rekod terkini (dikumpul mengikut kumpulan simpanan). */
function getRecent(ctx, opts) {
  var user = auth_(ctx);
  opts = opts || {};
  if (user.group === 'murid' && !user.isAdmin) opts.milikSaya = true; // pengawas hanya lihat rekod sendiri
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
    var rowsToDelete = [], idTerlibat = {};
    vals.forEach(function (r, i) {
      if (String(r[R.KUMPULAN]) !== batch) return;
      if (idMurid && String(r[R.ID_MURID]) !== String(idMurid)) return;
      var t = r[R.MASA_REKOD] instanceof Date ? r[R.MASA_REKOD] : new Date(r[R.MASA_REKOD]);
      if (!user.isAdmin && !(isOwner_(user, r) && (new Date() - t) < hadMs)) {
        throw new Error('Anda tidak dibenarkan memadam rekod ini (bukan rekod anda atau melebihi had masa).');
      }
      rowsToDelete.push(i + 2);
      idTerlibat[String(r[R.ID_MURID]).replace(/^'/, '')] = 1;
    });
    // padam dari bawah, gabungkan baris berturutan
    for (var j = rowsToDelete.length - 1; j >= 0;) {
      var end = rowsToDelete[j], k = j;
      while (k > 0 && rowsToDelete[k - 1] === rowsToDelete[k] - 1) k--;
      sh.deleteRows(rowsToDelete[k], end - rowsToDelete[k] + 1);
      j = k - 1;
    }
    return { dipadam: rowsToDelete.length, kiraan: kiraanMurid_(Object.keys(idTerlibat)) };
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

/**
 * Laporan Kesalahan Murid: semua rekod bagi seorang murid. Boleh digunakan oleh semua pengguna yang log masuk.
 * Pulangan: {murid:{id,nama,kelas,rumah}, rekod:[...], jumlahMata, tahap:{Ringan:n,...}}
 */
function getStudentReport(ctx, idMurid) {
  auth_(ctx);
  idMurid = String(idMurid || '').trim();
  if (!idMurid) throw new Error('Sila pilih murid.');
  var murid = null;
  try { readStudents_().students.forEach(function (s) { if (String(s[0]) === idMurid) murid = { id: s[0], nama: s[1], kelas: s[2], rumah: s[3] }; }); } catch (e) {}
  var sh = rekodSheet_(), last = sh.getLastRow();
  var vals = last >= 2 ? sh.getRange(2, 1, last - 1, REKOD_HEADERS.length).getValues() : [];
  var rekod = [], jumlahMata = 0, tahap = {};
  vals.forEach(function (r) {
    if (String(r[R.ID_MURID]).replace(/^'/, '').trim() !== idMurid) return;
    var mata = parseFloat(r[R.MATA]) || 0;
    var kat = String(r[R.KATEGORI] || '');
    jumlahMata += mata;
    tahap[kat] = (tahap[kat] || 0) + 1;
    if (!murid) murid = { id: idMurid, nama: r[R.NAMA], kelas: r[R.KELAS], rumah: r[R.RUMAH] };
    rekod.push({ tarikh: dateStr_(r[R.TARIKH]), masa: String(r[R.MASA] || '').replace(/^'/, ''), kod: String(r[R.KOD]), kesalahan: String(r[R.KESALAHAN]),
      kategori: kat, mata: mata, pelapor: String(r[R.PELAPOR] || ''), peranan: String(r[R.PERANAN] || ''),
      lokasi: String(r[R.LOKASI] || ''), catatan: String(r[R.CATATAN] || '') });
  });
  if (!murid) throw new Error('Murid tidak dijumpai.');
  rekod.sort(function (a, b) { return (b.tarikh + b.masa).localeCompare(a.tarikh + a.masa); });
  return { murid: murid, rekod: rekod, jumlahMata: Math.round(jumlahMata * 10) / 10, tahap: tahap };
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

/* ---------- PIN & peranan ----------
 * Tiga kumpulan: 'guru' (Guru, Warden, Guru Disiplin, lain-lain), 'murid' (Pengawas/murid) dan 'admin'.
 * Setiap kumpulan mempunyai PIN sendiri dalam TETAPAN (KOD_GURU, KOD_MURID, KOD_ADMIN).
 * KOD_AKSES (versi lama) menjadi PIN guru & murid jika KOD_GURU / KOD_MURID kosong. */
function groupOf_(peranan) {
  var p = lower_(peranan);
  if (/admin/.test(p)) return 'admin';
  if (/pengawas|murid|pelajar|ketua|prefect|exco/.test(p)) return 'murid';
  return 'guru';
}
function pinFor_(s, group) {
  if (group === 'admin') return String(s.KOD_ADMIN || '').trim();
  var k = group === 'murid' ? s.KOD_MURID : s.KOD_GURU;
  return String(k || s.KOD_AKSES || '').trim();
}

function auth_(ctx) {
  ctx = ctx || {};
  var s = getSettings_();
  var email = currentEmail_();
  var users = readUsers_();
  var adminRoles = splitList_(s.PERANAN_ADMIN || 'Admin,Guru Disiplin').map(lower_);
  var kodAdmin = pinFor_(s, 'admin');
  var adminByPin = !!kodAdmin && String(ctx.adminPin || '').trim() === kodAdmin;
  var user;
  if (users.length) {
    var u = null;
    users.forEach(function (x) { if (x.email === email) u = x; });
    if (!u) throw new Error('AKSES_DITOLAK: Emel ' + (email || '(tidak dapat dikenal pasti — log masuk dengan akaun sekolah)') + ' tiada dalam senarai pengguna. Hubungi admin.');
    user = { email: email, nama: u.nama || email, peranan: u.peranan || '', fromList: true };
    user.group = groupOf_(user.peranan);
    user.isAdmin = adminRoles.indexOf(lower_(user.peranan)) >= 0 || adminByPin;
  } else {
    var peranan = String(ctx.peranan || '').trim().slice(0, 40);
    var group = groupOf_(peranan);
    var pin = pinFor_(s, group);
    var anyPin = pinFor_(s, 'guru') || pinFor_(s, 'murid') || kodAdmin;
    if (group === 'admin' && !kodAdmin && anyPin) {
      throw new Error('KOD_SALAH: PIN Admin belum ditetapkan. Log masuk sebagai Guru, atau tetapkan KOD_ADMIN dalam tab TETAPAN.');
    }
    if (pin && String(ctx.pin || '').trim() !== pin) {
      throw new Error('KOD_SALAH: PIN tidak sah untuk peranan ' + (peranan || 'ini') + '.');
    }
    user = { email: email, nama: String(ctx.nama || '').trim().slice(0, 80), peranan: peranan, group: group, fromList: false };
    user.isAdmin = group === 'admin' || (kodAdmin ? adminByPin : true);
  }
  user.pinMode = !users.length;
  return user;
}

/** Admin: lihat PIN semasa (untuk borang tukar PIN). */
function getPins(ctx) {
  var user = auth_(ctx);
  if (!user.isAdmin) throw new Error('ADMIN_DIPERLUKAN: Hanya admin boleh melihat PIN.');
  var s = getSettings_();
  return { guru: pinFor_(s, 'guru'), murid: pinFor_(s, 'murid'), admin: pinFor_(s, 'admin') };
}

/** Admin: tukar PIN. pins = {guru, murid, admin}. Semua pengguna kumpulan itu perlu log masuk semula. */
function tukarPin(ctx, pins) {
  var user = auth_(ctx);
  if (!user.isAdmin) throw new Error('ADMIN_DIPERLUKAN: Hanya admin boleh menukar PIN.');
  savePins_(pins || {}, true);
  return getPins({ nama: user.nama, peranan: 'Admin', pin: String((pins || {}).admin || '').trim() });
}

/* ---------- Menu Admin (web app) ---------- */
function requireAdmin_(ctx) {
  var user = auth_(ctx);
  if (!user.isAdmin) throw new Error('ADMIN_DIPERLUKAN: Hanya admin boleh membuka menu ini.');
  return user;
}

/** Maklumat untuk menu Admin: tetapan, statistik, versi, pautan. */
function getAdminInfo(ctx) {
  requireAdmin_(ctx);
  var s = getSettings_();
  var murid = 0, kelas = {}, rumah = {};
  try { readStudents_().students.forEach(function (x) { murid++; kelas[x[2]] = 1; if (x[3]) rumah[x[3]] = 1; }); } catch (e) {}
  var rekod = Math.max(0, rekodSheet_().getLastRow() - 1);
  var terkini = '';
  try { terkini = latestRelease_().version; } catch (e) {}
  return {
    tetapan: { NAMA_SEKOLAH: s.NAMA_SEKOLAH, LOKASI: s.LOKASI, HAD_PADAM_JAM: s.HAD_PADAM_JAM },
    pins: { guru: pinFor_(s, 'guru'), murid: pinFor_(s, 'murid'), admin: pinFor_(s, 'admin') },
    stat: { murid: murid, kelas: Object.keys(kelas).length, rumah: Object.keys(rumah).sort(), rekod: rekod, kesalahan: readOffenses_().length },
    versi: SIDIA_VERSION, versiTerkini: terkini,
    sheetUrl: SpreadsheetApp.getActive().getUrl(),
    webAppUrl: detectWebAppUrl_(),
    userListMode: readUsers_().length > 0
  };
}

function saveTetapanSekolah(ctx, o) {
  requireAdmin_(ctx);
  o = o || {};
  var nama = String(o.NAMA_SEKOLAH || '').trim();
  if (!nama) throw new Error('Nama sekolah tidak boleh kosong.');
  var jam = parseFloat(o.HAD_PADAM_JAM);
  if (!(jam >= 0 && jam <= 720)) throw new Error('Had padam mesti antara 0 dan 720 jam.');
  setSetting_('NAMA_SEKOLAH', nama);
  setSetting_('LOKASI', splitList_(o.LOKASI || '').join(','));
  setSetting_('HAD_PADAM_JAM', String(jam));
  return true;
}

function adminKemasKini(ctx) {
  requireAdmin_(ctx);
  return wizKemasKini();
}

function savePins_(p, adminRequired) {
  var v = { guru: String(p.guru || '').trim(), murid: String(p.murid || '').trim(), admin: String(p.admin || '').trim() };
  var label = { guru: 'Guru & Warden', murid: 'Murid (Pengawas)', admin: 'Admin' };
  Object.keys(v).forEach(function (k) {
    if (v[k] && !/^\d{4,8}$/.test(v[k])) throw new Error('PIN ' + label[k] + ' mesti 4–8 digit nombor.');
  });
  if (adminRequired && !v.admin) throw new Error('PIN Admin tidak boleh kosong.');
  if (v.guru && v.guru === v.murid) throw new Error('PIN Guru & Warden dan PIN Murid mesti berbeza.');
  if (v.admin && (v.admin === v.guru || v.admin === v.murid)) throw new Error('PIN Admin mesti berbeza daripada PIN lain.');
  setSetting_('KOD_GURU', v.guru);
  setSetting_('KOD_MURID', v.murid);
  setSetting_('KOD_ADMIN', v.admin);
  setSetting_('KOD_AKSES', ''); // kod lama tidak lagi sah selepas PIN baharu ditetapkan
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
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getDisplayValues()
    .filter(function (r) { return String(r[0]).trim() && String(r[1]).trim() && !/^(tidak|no|n|x|0)$/i.test(String(r[4]).trim()); })
    .map(function (r) {
      return {
        kod: String(r[0]).trim(), kesalahan: String(r[1]).trim(), kategori: String(r[2]).trim(),
        mata: parseFloat(r[3]) || 0, pantas: /^(ya|yes|y|1|true|✓|x)$/i.test(String(r[5]).trim())
      };
    });
}

/* ============ SUNTING SENARAI KESALAHAN (web app) ============ */

/** Guru, warden, guru disiplin dan admin boleh mengubah senarai kesalahan; pengawas tidak. */
function requireEditor_(ctx) {
  var user = auth_(ctx);
  if (user.group === 'murid' && !user.isAdmin) throw new Error('AKSES_DITOLAK: Pengawas tidak boleh mengubah senarai kesalahan.');
  return user;
}

function kesalahanSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SH.KESALAHAN);
  if (!sh) sh = ensureSheet_(ss, SH.KESALAHAN, ['Kod', 'Kesalahan', 'Kategori', 'Mata', 'Aktif', 'Pantas']);
  return sh;
}

/** Bilangan rekod bagi setiap kod dalam tab REKOD. */
function kodUsage_() {
  var sh = rekodSheet_(), last = sh.getLastRow(), out = {};
  if (last < 2) return out;
  sh.getRange(2, R.KOD + 1, last - 1, 1).getDisplayValues().forEach(function (r) {
    var k = String(r[0]).trim().toUpperCase();
    if (k) out[k] = (out[k] || 0) + 1;
  });
  return out;
}

function offenseRows_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 6).getDisplayValues().map(function (r, i) {
    return { row: i + 2, kod: String(r[0]).trim(), kesalahan: String(r[1]).trim(), kategori: String(r[2]).trim(),
      mata: parseFloat(r[3]) || 0, aktif: !isNo_(r[4]), pantas: isYes_(r[5]) };
  }).filter(function (o) { return o.kod || o.kesalahan; });
}

/** Semua kesalahan (termasuk tidak aktif) untuk skrin sunting. */
function getOffensesEdit(ctx) {
  requireEditor_(ctx);
  var use = kodUsage_();
  return offenseRows_(kesalahanSheet_()).map(function (o) {
    delete o.row;
    o.guna = use[o.kod.toUpperCase()] || 0;
    return o;
  });
}

function normKategori_(k) {
  k = String(k || '').trim().toLowerCase();
  if (k === 'ringan' || k === '1') return 'Ringan';
  if (k === 'sederhana' || k === '2') return 'Sederhana';
  if (k === 'berat' || k === '3') return 'Berat';
  throw new Error('Kategori mesti Ringan, Sederhana atau Berat.');
}

/**
 * Tambah atau kemas kini satu kesalahan.
 * o = {kod, kesalahan, kategori, mata, aktif, pantas}; kodAsal = kod sebelum diubah ('' untuk kesalahan baharu).
 */
function saveOffense(ctx, o, kodAsal) {
  requireEditor_(ctx);
  o = o || {};
  var kod = String(o.kod || '').trim().toUpperCase();
  var teks = String(o.kesalahan || '').replace(/\s+/g, ' ').trim();
  kodAsal = String(kodAsal || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9\-]{0,9}$/.test(kod)) throw new Error('Kod mesti 1–10 aksara (huruf, nombor atau -), cth R31.');
  if (teks.length < 3) throw new Error('Sila isi nama kesalahan.');
  if (teks.length > 300) throw new Error('Nama kesalahan terlalu panjang (maksimum 300 aksara).');
  var kategori = normKategori_(o.kategori);
  var mata = Number(o.mata);
  if (!isFinite(mata) || mata < 0 || mata > 100) throw new Error('Mata demerit mesti nombor antara 0 hingga 100.');
  mata = Math.round(mata * 10) / 10;

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = kesalahanSheet_();
    var rows = offenseRows_(sh);
    var asal = null, dup = null;
    rows.forEach(function (r) {
      var k = r.kod.toUpperCase();
      if (kodAsal && k === kodAsal) asal = r;
      if (k === kod && k !== kodAsal) dup = r;
    });
    if (dup) throw new Error('Kod ' + kod + ' sudah digunakan untuk "' + dup.kesalahan + '".');
    if (kodAsal && !asal) throw new Error('Kesalahan ' + kodAsal + ' tidak dijumpai. Muat semula senarai.');
    if (asal && kod !== kodAsal) {
      var n = kodUsage_()[kodAsal] || 0;
      if (n) throw new Error('Kod ' + kodAsal + ' sudah digunakan dalam ' + n + ' rekod, jadi kod tidak boleh ditukar. Nyahaktifkan kesalahan ini dan tambah kesalahan baharu.');
    }
    var row = [kod, teks, kategori, mata, o.aktif === false ? 'Tidak' : 'Ya', o.pantas ? 'Ya' : ''];
    var r = asal ? asal.row : Math.max(sh.getLastRow(), 1) + 1;
    sh.getRange(r, 1, 1, 1).setNumberFormat('@');
    sh.getRange(r, 1, 1, 6).setValues([row]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { offenses: readOffensesSafe_(), kod: kod };
}

/** Padam kesalahan yang belum pernah digunakan. Yang sudah digunakan hanya boleh dinyahaktifkan. */
function deleteOffense(ctx, kod) {
  requireEditor_(ctx);
  kod = String(kod || '').trim().toUpperCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var n = kodUsage_()[kod] || 0;
    if (n) throw new Error('Kod ' + kod + ' sudah digunakan dalam ' + n + ' rekod. Nyahaktifkan sahaja supaya laporan lama kekal.');
    var sh = kesalahanSheet_();
    var t = offenseRows_(sh).filter(function (r) { return r.kod.toUpperCase() === kod; })[0];
    if (!t) throw new Error('Kesalahan ' + kod + ' tidak dijumpai.');
    sh.deleteRows(t.row, 1);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { offenses: readOffensesSafe_() };
}

function readOffensesSafe_() {
  try { return readOffenses_(); } catch (e) { return []; }
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
  var range = sh.getDataRange();
  var values = range.getDisplayValues();
  var rawValues = range.getValues(); // untuk No. KP yang disimpan sebagai nombor (dipapar 1.30927E+11)
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
    var id = '';
    if (map.id >= 0) {
      var rv = rawValues[r][map.id];
      id = typeof rv === 'number' && rv % 1 === 0 && Math.abs(rv) >= 1e6 ? String(rv) : String(row[map.id] || '').trim();
      if (/^\d{11}$/.test(id)) id = '0' + id;
    }
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


/* =========================================================
 *  KEMAS KINI SATU KLIK
 *  Memuat turun kod keluaran terkini dari GitHub dan memasangnya ke dalam
 *  projek Apps Script ini melalui Apps Script API, kemudian mengemas kini
 *  deployment web app sedia ada (pautan kekal sama). Data dalam Google Sheet
 *  tidak disentuh.
 *  Syarat (sekali sahaja): https://script.google.com/home/usersettings
 *  › Google Apps Script API › ON
 * ========================================================= */

var SIDIA_FILES = [
  { name: 'Code', type: 'SERVER_JS', path: 'Code.gs' },
  { name: 'Index', type: 'HTML', path: 'Index.html' },
  { name: 'Setup', type: 'HTML', path: 'Setup.html' },
  { name: 'appsscript', type: 'JSON', path: 'appsscript.json' }
];

function semakKemasKiniMenu() {
  var ui = SpreadsheetApp.getUi();
  var rel;
  try { rel = latestRelease_(); } catch (e) {
    ui.alert('Tidak dapat menyemak kemas kini', e.message, ui.ButtonSet.OK); return;
  }
  if (compareVersion_(rel.version, SIDIA_VERSION) <= 0) {
    ui.alert('SiDIA terkini', 'Anda sudah menggunakan versi terkini (' + SIDIA_VERSION + ').', ui.ButtonSet.OK); return;
  }
  var nota = (rel.nota || []).map(function (n) { return '• ' + n; }).join('\n');
  var r = ui.alert('Versi baharu SiDIA ' + rel.version,
    'Versi anda: ' + SIDIA_VERSION + '\nVersi baharu: ' + rel.version + (rel.tarikh ? ' (' + rel.tarikh + ')' : '') +
    (nota ? '\n\nApa yang baharu:\n' + nota : '') +
    '\n\nKod akan dikemas kini dan web app dikemas kini secara automatik. Pautan web app kekal sama. Data murid & rekod tidak diubah.\n\nKemas kini sekarang?',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  try {
    var res = pasangKemasKini_(rel);
    ui.alert('✅ SiDIA dikemas kini ke versi ' + rel.version,
      (res.deployment ? 'Web app telah dikemas kini (pautan sama).\n\n' :
        'Kod telah dikemas kini, tetapi tiada deployment web app dijumpai. Lakukan Deploy › New deployment › Web app.\n\n') +
      'Muat semula (refresh) halaman Google Sheet ini. Jika Google meminta kebenaran baharu, klik Continue › Allow.',
      ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Kemas kini gagal', e.message, ui.ButtonSet.OK);
  }
}

/** Dipanggil dari wizard. */
function wizKemasKini() {
  var rel = latestRelease_();
  if (compareVersion_(rel.version, SIDIA_VERSION) <= 0) return { versi: SIDIA_VERSION, sudahTerkini: true };
  var res = pasangKemasKini_(rel);
  return { versi: rel.version, deployment: res.deployment };
}

function latestRelease_() {
  var url = 'https://raw.githubusercontent.com/' + SIDIA_REPO + '/main/version.json?t=' + Date.now();
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('Tidak dapat membaca maklumat versi dari GitHub (HTTP ' + resp.getResponseCode() + ').');
  var rel = JSON.parse(resp.getContentText());
  if (!rel.version || !rel.ref) throw new Error('Fail version.json tidak lengkap.');
  return rel;
}

function compareVersion_(a, b) {
  var pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
    var d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

function pasangKemasKini_(rel) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var scriptId = ScriptApp.getScriptId();
    var api = 'https://script.googleapis.com/v1/projects/' + scriptId;

    // 1. kandungan semasa projek (untuk kekalkan fail tambahan sekolah)
    var current = scriptApi_('get', api + '/content').files || [];

    // 2. muat turun fail keluaran baharu (ikut tag, bukan cawangan main)
    var fresh = SIDIA_FILES.map(function (f) {
      var url = 'https://raw.githubusercontent.com/' + SIDIA_REPO + '/' + encodeURIComponent(rel.ref) + '/' + f.path;
      var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (r.getResponseCode() !== 200) throw new Error('Gagal memuat turun ' + f.path + ' (HTTP ' + r.getResponseCode() + ').');
      return { name: f.name, type: f.type, source: r.getContentText() };
    });
    var newCode = fresh[0].source;
    if (newCode.indexOf("var SIDIA_VERSION = '" + rel.version + "'") < 0) {
      throw new Error('Versi dalam Code.gs (' + rel.ref + ') tidak sepadan dengan ' + rel.version + '. Kemas kini dibatalkan.');
    }

    // 3. deployment web app sedia ada
    var deps = (scriptApi_('get', api + '/deployments').deployments || []).filter(function (d) {
      return (d.entryPoints || []).some(function (e) { return e.entryPointType === 'WEB_APP'; }) && d.deploymentConfig && d.deploymentConfig.versionNumber;
    });
    var saved = getSettings_().WEB_APP_URL || '';
    var dep = null;
    deps.forEach(function (d) {
      var wa = d.entryPoints.filter(function (e) { return e.entryPointType === 'WEB_APP'; })[0].webApp || {};
      if (saved && wa.url && sameWebApp_(wa.url, saved)) dep = d;
    });
    if (!dep && deps.length) dep = deps.sort(function (a, b) { return String(b.updateTime).localeCompare(String(a.updateTime)); })[0];

    // 4. manifest: kekalkan tetapan akses web app sekolah ini
    var manifest = JSON.parse(fresh[3].source);
    var oldManifest = current.filter(function (f) { return f.name === 'appsscript'; })[0];
    var oldWebapp = null;
    try { oldWebapp = JSON.parse(oldManifest.source).webapp || null; } catch (e) {}
    if (dep) {
      var cfg = (dep.entryPoints.filter(function (e) { return e.entryPointType === 'WEB_APP'; })[0].webApp || {}).entryPointConfig;
      if (cfg && cfg.access) oldWebapp = { access: cfg.access, executeAs: cfg.executeAs || 'USER_DEPLOYING' };
    }
    if (oldWebapp) manifest.webapp = oldWebapp; else delete manifest.webapp;
    fresh[3].source = JSON.stringify(manifest, null, 2);

    // 5. gabung: ganti fail SiDIA, kekalkan fail lain milik sekolah
    var ours = {}; SIDIA_FILES.forEach(function (f) { ours[f.name] = 1; });
    var keep = current.filter(function (f) {
      if (ours[f.name]) return false;
      // fail kod SiDIA lama dengan nama lain (cth "Kod") — buang supaya fungsi tidak bertindih
      if (f.type === 'SERVER_JS' && /function readStudents_\(|var SIDIA_VERSION/.test(f.source || '')) return false;
      return true;
    }).map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
    scriptApi_('put', api + '/content', { files: fresh.concat(keep) });

    // 6. versi baharu + kemas kini deployment (pautan kekal)
    var ver = scriptApi_('post', api + '/versions', { description: 'SiDIA ' + rel.version });
    var updated = null;
    if (dep) {
      updated = scriptApi_('put', api + '/deployments/' + dep.deploymentId, {
        deploymentConfig: {
          scriptId: scriptId, versionNumber: ver.versionNumber, manifestFileName: 'appsscript',
          description: 'SiDIA ' + rel.version
        }
      });
    }
    return { versionNumber: ver.versionNumber, deployment: updated ? updated.deploymentId : null, kept: keep.map(function (f) { return f.name; }) };
  } finally {
    lock.releaseLock();
  }
}

function sameWebApp_(a, b) {
  var id = function (u) { var m = String(u).match(/\/s\/([^/]+)\//); return m ? m[1] : u; };
  return id(a) === id(b);
}

function scriptApi_(method, url, body) {
  var opt = {
    method: method, muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  };
  if (body) opt.payload = JSON.stringify(body);
  var r = UrlFetchApp.fetch(url, opt);
  var code = r.getResponseCode(), txt = r.getContentText();
  if (code >= 200 && code < 300) return txt ? JSON.parse(txt) : {};
  var msg = txt;
  try { msg = JSON.parse(txt).error.message || txt; } catch (e) {}
  throw new Error(scriptApiHelp_(code, txt) + '\n\nMesej Google (' + code + '): ' + String(msg).slice(0, 300));
}

/** Terangkan ralat Apps Script API mengikut punca sebenar. */
function scriptApiHelp_(code, txt) {
  var manual = 'Sebagai alternatif, kemas kini secara manual: tampal semula Code.gs, Index.html, Setup.html dan appsscript.json dari GitHub, ' +
    'kemudian Deploy › Manage deployments › ✎ Edit › Version: New version › Deploy.';
  if (/User has not enabled the Apps Script API/i.test(txt)) {
    return 'Suis "Google Apps Script API" untuk akaun anda masih OFF.\n\n' +
      '1. Buka https://script.google.com/home/usersettings\n2. Hidupkan "Google Apps Script API" (ON)\n' +
      '3. Tunggu 2–5 minit, kemudian cuba lagi.\n\nPastikan anda log masuk dengan akaun yang sama dengan pemilik Google Sheet ini.';
  }
  if (/has not been used in project|SERVICE_DISABLED|accessNotConfigured|it is disabled/i.test(txt)) {
    return 'Apps Script API tidak diaktifkan untuk projek Google Cloud skrip ini.\n\n' +
      'Jika anda baru menghidupkan suis di https://script.google.com/home/usersettings, tunggu 5–10 minit dan cuba lagi. ' +
      'Jika masih gagal, akaun ini tidak dapat menggunakan kemas kini satu klik.\n\n' + manual;
  }
  if (code === 403) {
    return 'Google menolak permintaan kemas kini (tiada kebenaran). Kemungkinan pentadbir domain menyekat Apps Script API untuk akaun sekolah, ' +
      'atau anda bukan pemilik/editor projek skrip ini.\n\n' + manual;
  }
  if (code === 401) {
    return 'Kebenaran (authorization) tidak lengkap. Muat semula Google Sheet, buka mana-mana menu SiDIA, dan klik Allow jika diminta. ' +
      'Pastikan appsscript.json mengandungi kebenaran script.projects dan script.deployments.';
  }
  return 'Kemas kini gagal semasa menghubungi Apps Script API.\n\n' + manual;
}

/** Jalankan persediaan tab yang baharu selepas kemas kini (sekali bagi setiap versi). */
// Kod yang tiada dalam Infomurid dan dibuang daripada senarai lalai sejak 1.5.0
var KOD_DIBUANG_1_5 = ['W01', 'W02', 'W03', 'W04', 'W05'];

function versiLebihRendah_(a, b) {
  var x = String(a).split('.'), y = String(b).split('.');
  for (var i = 0; i < 3; i++) {
    var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
    if (d) return d < 0;
  }
  return false;
}

/** Tetapkan Aktif = Tidak (dan buang Pantas) bagi kod tertentu dalam tab KESALAHAN. Rekod lama tidak diubah. */
function nyahaktifKod_(kodList) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SH.KESALAHAN);
  if (!sh || sh.getLastRow() < 2) return 0;
  var rg = sh.getRange(2, 1, sh.getLastRow() - 1, 6);
  var vals = rg.getValues(), n = 0;
  vals.forEach(function (r) {
    if (kodList.indexOf(String(r[0]).trim().toUpperCase()) >= 0 && !/^tidak$/i.test(String(r[4]).trim())) {
      r[4] = 'Tidak'; r[5] = ''; n++;
    }
  });
  if (n) sh.getRange(2, 5, vals.length, 2).setValues(vals.map(function (r) { return [r[4], r[5]]; }));
  return n;
}

function migrateIfNeeded_() {
  try {
    if (getSettings_().VERSI_DIPASANG === SIDIA_VERSION) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return;
    try {
      var dahulu = getSettings_().VERSI_DIPASANG;
      if (dahulu === SIDIA_VERSION) return;
      ensureSetup_();
      if (dahulu && versiLebihRendah_(dahulu, '1.5.0')) nyahaktifKod_(KOD_DIBUANG_1_5);
      setSetting_('VERSI_DIPASANG', SIDIA_VERSION);
    } finally { lock.releaseLock(); }
  } catch (e) { console.warn('migrasi: ' + e.message); }
}
