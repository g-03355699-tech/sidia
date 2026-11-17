/* Ujian extension SiDIA → Infomurid dengan pelayan Infomurid tiruan.
 * Semua nama murid di sini adalah rekaan.
 * Jalankan: cd tests && node infomurid-ext.js */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EXT = path.resolve(__dirname, '..', 'infomurid-extension');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const KELAS = [{ id: '4', kod: '1BERLIAN' }, { id: '5', kod: '1DELIMA' }, { id: '20', kod: '4BERLIAN' }, { id: '37', kod: 'KELUAR' }];
const MURID = {
  '4': [['1001', 'ALI BIN ABU'], ['1002', 'SITI AMINAH BINTI HASSAN'], ['1003', 'AHMAD BIN ISMAIL']],
  '5': [['1101', 'AHMAD BIN ISMAIL'], ['1102', 'NUR HANIS BINTI ROSLI']],
  '20': [['2001', 'DANIEL HAKIM BIN ZAINAL'], ['2002', 'MUHAMMAD FARIS BIN OMAR']],
  '37': [['9001', 'BEKAS MURID BIN KELUAR']]
};
const OFFENCES = [['61', 'MEMBAWA TELEFON BIMBIT KE SEKOLAH', 'S11'], ['124', 'TIDAK MEMAKAI PAKAIAN SEKOLAH YANG LENGKAP.', 'R14'],
  ['138', 'LEWAT KE SURAU/MASJID', 'R28'], ['53', 'PONTENG KEGIATAN LUAR BILIK DARJAH/KO-KURIKULUM', '884']];
const offOpts = (id) => `<select class="form-control" id="${id}" name="x"><option value="">-Pilih Salahlaku-</option>` +
  OFFENCES.map(o => `<option value="${o[0]}">${o[1]}                                [${o[2]}]</option>`).join('') + '</select>';

const existing = [['2026-11-10', '9pm', 'ALI BIN ABU', '1BERLIAN', 'S11', 'ASPURA']];
const table = () => `<table class="table" id="table_sahsiah"><tbody><tr><th>BIL</th><th>TARIKH</th><th>MASA</th><th>NAMA MURID</th><th>KELAS</th><th>KOD SALAHLAKU</th><th>TEMPAT KEJADIAN</th><th>TINDAKAN</th><th></th></tr>` +
  existing.map((r, i) => `<tr><td>${i + 1}</td><td>\n ${r[0]}\n</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>001</td><td></td></tr>`).join('') + '</tbody></table>';
const page = () => `<!DOCTYPE html><html><head><title>Infomurid</title></head><body><h2>Sahsiah Murid</h2>
<select id="ddSession"><option value="">-Pilih Tahun-</option><option value="25">2025</option><option value="26" selected>2026</option></select>
<select id="ddClassIndex"><option value="">-Pilih Kelas-</option>${KELAS.map(k => `<option value="${k.id}">${k.kod}</option>`).join('')}</select>
<div id="main">${table()}</div></body></html>`;

const saved = [];
async function route(r) {
  const u = new URL(r.request().url());
  const p = u.pathname;
  const html = (b) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: b });
  if (p === '/Discipline/Index') return html(u.searchParams.get('pvflag') ? table() : page());
  if (p === '/Discipline/CreateGroup') return html(`<div>${offOpts('ddOffence')}<select id="ddAction"><option value="">-Pilih Hukuman-</option></select><select id="ddSession"></select></div>`);
  if (p === '/Discipline/Create') return html(`<form>${offOpts('OffenceID')}<select id="ActionID"><option value="">-Pilih Hukuman-</option><option value="1">Amaran[001]</option><option value="2">Rotan 1X[002]</option></select></form>`);
  if (p === '/Sumbangan/RefreshStudentList') {
    const list = MURID[u.searchParams.get('classid')] || [];
    return html(`<select id="ddClass">${KELAS.map(k => `<option value="${k.id}">${k.kod}</option>`).join('')}</select><table>` +
      list.map(m => `<tr><td><input type="checkbox" class="studentid" id="${m[0]}" value="${m[1]}"></td><td>${m[1]}</td></tr>`).join('') + '</table>');
  }
  if (p === '/Discipline/BulkSave' && r.request().method() === 'POST') {
    const body = new URLSearchParams(r.request().postData());
    const vm = {}; const st = [];
    for (const [k, v] of body) {
      let m = k.match(/^viewmodel\[(\w+)\]$/); if (m) vm[m[1]] = v;
      m = k.match(/^students\[(\d+)\]\[(\w+)\]$/); if (m) { st[m[1]] = st[m[1]] || {}; st[m[1]][m[2]] = v; }
    }
    saved.push({ vm, students: st, sessionid: body.get('sessionid') });
    if (vm.OffenceID === '138') return html('<div>Error: simulasi ralat pelayan</div>');
    st.forEach(s => existing.push([vm.DateCommitted, vm.TimeCommitted, s.Name, s.ClassCode, OFFENCES.find(o => o[0] === vm.OffenceID)[2], vm.Place]));
    return html('<div>OK</div>');
  }
  return r.fulfill({ status: 404, body: 'tiada' });
}

// Eksport CSV tab REKOD (seperti Fail › Muat turun › CSV)
const H = 'ID Rekod,Masa Rekod,Tarikh Kejadian,Masa Kejadian,ID Murid,Nama Murid,Kelas,Rumah,Kod,Kesalahan,Kategori,Mata,Pelapor,Emel Pelapor,Peranan,Lokasi,Catatan,ID Kumpulan';
const rows = [
  ['b1-1', '10/11/2026 21:05:00', '10/11/2026', '21:00', '0101', 'ALI BIN ABU', '1 BERLIAN', 'MERAH', 'S11', 'MEMBAWA TELEFON', 'Sederhana', '5', 'Cikgu A', '', 'Warden', 'ASPURA', '', 'b1'],
  ['b2-1', '15/11/2026 07:40:00', '15/11/2026', '07:30', '0101', 'Ali bin Abu', '1 BERLIAN', 'MERAH', 'R14', 'TIDAK MEMAKAI PAKAIAN', 'Ringan', '2', 'Cikgu B', '', 'Guru', '', 'Baju "tiada", nama', 'b2'],
  ['b2-2', '15/11/2026 07:40:00', '15/11/2026', '07:30', '0102', 'SITI AMINAH BT HASSAN', '1 BERLIAN', 'BIRU', 'R14', 'TIDAK MEMAKAI PAKAIAN', 'Ringan', '2', 'Cikgu B', '', 'Guru', '', 'Baju "tiada", nama', 'b2'],
  ['b2-3', '15/11/2026 07:40:00', '15/11/2026', '07:30', '0103', 'AHMAD BIN ISMAIL', '1 DELIMA', 'BIRU', 'R14', 'TIDAK MEMAKAI PAKAIAN', 'Ringan', '2', 'Cikgu B', '', 'Guru', '', 'Baju "tiada", nama', 'b2'],
  ['b2-4', '15/11/2026 07:40:00', '15/11/2026', '07:30', '0104', 'NAMA SALAH EJA', '4 BERLIAN', 'BIRU', 'R14', 'TIDAK MEMAKAI PAKAIAN', 'Ringan', '2', 'Cikgu B', '', 'Guru', '', 'Baju "tiada", nama', 'b2'],
  ['b3-1', '16/11/2026 05:50:00', '16/11/2026', '05:45', '0201', 'DANIEL HAKIM BIN ZAINAL', '4 BERLIAN', 'HIJAU', 'W01', 'TIDAK HADIR SOLAT SUBUH BERJEMAAH', 'Ringan', '3', 'Pengawas C', '', 'Pengawas', 'SURAU', '', 'b3'],
  ['b3-2', '16/11/2026 05:50:00', '16/11/2026', '05:45', '0202', 'MUHAMMAD FARIS BIN OMAR', '4 BERLIAN', 'HIJAU', 'W01', 'TIDAK HADIR SOLAT SUBUH BERJEMAAH', 'Ringan', '3', 'Pengawas C', '', 'Pengawas', 'SURAU', '', 'b3'],
  ['b4-1', '01/10/2026 05:50:00', '01/10/2026', '', '0202', 'MUHAMMAD FARIS BIN OMAR', '4 BERLIAN', 'HIJAU', '884', 'PONTENG', 'Ringan', '3', 'Cikgu D', '', 'Guru', '', '', 'b4']
];
const csv = [H].concat(rows.map(r => r.map(c => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(','))).join('\r\n');
const csvPath = path.join(OUT, 'rekod-sidia.csv');
fs.writeFileSync(csvPath, '﻿' + csv);

function assert(c, m) { if (!c) { throw new Error('GAGAL: ' + m); } console.log('  ok  ' + m); }

(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sidia-ext-'));
  const ctx = await chromium.launchPersistentContext(userDir, {
    headless: false, // extension memerlukan --headless=new
    args: ['--headless=new', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1
  });
  await ctx.route('https://www.infomurid.com/**', route);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('https://www.infomurid.com/Discipline/Index');

  const fab = p.locator('#sidia-import-host >> .fab');
  await fab.waitFor({ timeout: 10000 });
  assert(true, 'butang Import SiDIA muncul');
  await fab.click();
  await p.locator('#sidia-import-host >> #sd-file').setInputFiles(csvPath);
  const info = await p.locator('#sidia-import-host >> #sd-readinfo').textContent();
  console.log('     ' + info);
  assert(/8 rekod dibaca/.test(info), 'CSV dibaca (8 rekod)');
  assert(await p.locator('#sidia-import-host >> #sd-dari').inputValue() === '2026-10-01', 'tarikh mula lalai');
  await p.locator('#sidia-import-host >> #sd-dari').fill('2026-11-01');
  await p.locator('#sidia-import-host >> #sd-semak').click();
  await p.locator('#sidia-import-host >> .groups').waitFor({ timeout: 10000 });
  const chips = await p.locator('#sidia-import-host >> .chips').textContent();
  console.log('     ' + chips);
  assert(/3 sedia diimport/.test(chips), '3 rekod sedia (Ali R14, Siti BT, Ahmad 1DELIMA)');
  assert(/2 menunggu pilihan kesalahan/.test(chips), 'W01 menunggu pemetaan');
  assert(/1 murid tidak sepadan/.test(chips), '1 murid tidak sepadan');
  assert(/1 sudah ada/.test(chips), 'pendua dikesan (Ali S11 10/11)');
  assert(await p.locator('#sidia-import-host >> .grp.warn').count() === 1, 'kod W01 perlu dipetakan');
  await p.screenshot({ path: path.join(OUT, 'ext-semak.png') });

  // petakan W01 → R28 (Lewat ke surau)
  await p.locator('#sidia-import-host >> .grp.warn select').first().selectOption('138');
  // padanan manual murid salah eja
  await p.locator('#sidia-import-host >> details').nth(1).evaluate(d => d.open = true);
  await p.locator('#sidia-import-host >> li.tiada select').selectOption('2001');
  const btn = await p.locator('#sidia-import-host >> #sd-import').textContent();
  console.log('     ' + btn);
  assert(/Import 6 rekod/.test(btn), '6 rekod sedia selepas pemetaan');
  await p.screenshot({ path: path.join(OUT, 'ext-sedia.png') });

  await p.locator('#sidia-import-host >> #sd-import').click();
  await p.locator('#sidia-import-host >> .log li', { hasText: 'Selesai' }).waitFor({ timeout: 10000 });
  const logText = await p.locator('#sidia-import-host >> #sd-log').textContent();
  console.log('     ' + logText.replace(/\s+/g, ' '));
  assert(saved.length === 2, '2 panggilan BulkSave (R14, W01→R28)');
  const r14 = saved.find(s => s.vm.OffenceID === '124');
  assert(r14 && r14.students.length === 4, 'R14: 4 murid');
  assert(r14.vm.DateCommitted === '2026-11-15' && r14.vm.TimeCommitted === '7.30am', 'tarikh & masa diformat');
  assert(r14.vm.Place === 'SEKOLAH' && r14.vm.ActionID === '1' && r14.sessionid === '26', 'lokasi lalai, hukuman, tahun');
  assert(/Pelapor: Cikgu B/.test(r14.vm.Comment) && /Baju "tiada"/.test(r14.vm.Comment), 'ulasan mengandungi catatan & pelapor');
  assert(r14.students.some(s => s.StudentID === '1101' && s.ClassCode === '1DELIMA'), 'nama sama dibezakan mengikut kelas');
  assert(r14.students.some(s => s.StudentID === '2001'), 'padanan manual digunakan');
  assert(/gagal/.test(logText), 'ralat "Error:" daripada pelayan dilaporkan');
  assert(errors.length === 0, 'tiada ralat JavaScript: ' + errors.join('; '));
  await p.screenshot({ path: path.join(OUT, 'ext-selesai.png') });

  // semak semula: R14 kini "pernah diimport", pemetaan W01 diingat
  await p.locator('#sidia-import-host >> #sd-semak').click();
  await p.waitForTimeout(800);
  const chips2 = await p.locator('#sidia-import-host >> .chips').textContent();
  console.log('     ' + chips2);
  assert(/4 pernah diimport/.test(chips2) && /2 sedia/.test(chips2), 'rekod yang berjaya tidak diimport dua kali; yang gagal boleh dicuba semula');
  assert(await p.locator('#sidia-import-host >> .grp.warn').count() === 0, 'pemetaan W01 diingat');

  // paparan telefon
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: path.join(OUT, 'ext-telefon.png') });
  await ctx.close();
  console.log('\nSemua ujian extension lulus.');
})().catch(e => { console.error(e); process.exit(1); });
