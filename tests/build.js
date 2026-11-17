/* Jana tests/out/app.html (web app) dan tests/out/setup.html (wizard) dengan
 * Code.gs + simulasi Apps Script + 800 murid rawak. Guna: node tests/build.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(path.join(root, 'Code.gs'), path.join(out, 'code.js'));
fs.copyFileSync(path.join(__dirname, 'mock-gas.js'), path.join(out, 'mock-gas.js'));
fs.copyFileSync(require.resolve('xlsx/dist/xlsx.full.min.js'), path.join(out, 'xlsx.full.min.js'));
fs.copyFileSync(path.join(path.dirname(require.resolve('qrcodejs2/package.json')), 'qrcode.min.js'), path.join(out, 'qrcode.min.js'));

// 800 murid rawak (boleh diulang)
let seed = 7; const r = n => { seed = (seed * 16807) % 2147483647; return seed % n; };
const L = ['AHMAD', 'MUHAMMAD', 'MOHD', 'AMIRUL', 'HAZIQ', 'ADAM', 'DANIAL', 'IRFAN', 'HAFIZ', 'AQIL', 'SYAFIQ', 'ABD'];
const P = ['NUR', 'SITI', 'AISYAH', 'FATIMAH', 'NURUL', 'ALYA', 'ZULAIKHA', 'IMAN', 'BALQIS', 'NOOR'];
const sL = ['HAFIZ', 'AIMAN', 'DANISH', 'FARHAN', 'HAKIMI', 'ARIF', 'RAHMAN', 'IKHWAN'], sP = ['IZZATI', 'NADHIRAH', 'SOFEA', 'QISTINA', 'ATHIRAH', 'HUMAIRA', 'AQILAH'];
const F = ['ALI', 'OMAR', 'YUSOF', 'ISMAIL', 'IBRAHIM', 'ABDULLAH', 'HASSAN', 'RAHMAN', 'ZAKARIA', 'SULAIMAN', 'ROSLAN', 'AZMAN'];
const kelas = []; for (const t of [1, 2, 3, 4, 5]) for (const k of ['AMANAH', 'BESTARI', 'CEMERLANG', 'DEDIKASI']) kelas.push(t + ' ' + k);
const rows = [['BIL', 'NAMA MURID', 'NO. MYKID', 'KELAS', 'RUMAH SUKAN']];
for (let i = 0; i < 800; i++) {
  const n = r(2) ? `${L[r(12)]} ${sL[r(8)]} BIN ${F[r(12)]}` : `${P[r(10)]} ${sP[r(7)]} BINTI ${F[r(12)]}`;
  rows.push([i + 1, n, String(80000000000 + i * 137).padStart(12, '0'), kelas[r(20)], ['MERAH', 'BIRU', 'HIJAU', 'KUNING'][r(4)]]);
}
const seedScript = `<script>
ensureSetup_();
_ss.sheets.MURID = new MockSheet('MURID'); _ss.sheets.MURID.d = ${JSON.stringify(rows)};
_ss.sheets.TETAPAN.d.forEach(function (r) { if (r[0] === 'KOD_GURU') r[1] = '1234'; if (r[0] === 'KOD_MURID') r[1] = '5678'; if (r[0] === 'KOD_ADMIN') r[1] = '9999';
  if (r[0] === 'WEB_APP_URL') r[1] = 'https://script.google.com/a/sekolah.edu.my/macros/s/AKfyUJIAN/exec'; if (r[0] === 'NAMA_SEKOLAH') r[1] = 'SMK Contoh'; });
</script>`;
const head = '<script src="mock-gas.js"></script>\n<script src="code.js"></script>\n';

const idx = fs.readFileSync(path.join(root, 'Index.html'), 'utf8');
fs.writeFileSync(path.join(out, 'app.html'), idx.replace('<script>\n/* ============ API', head + seedScript + '\n<script>\n/* ============ API'));

let setup = fs.readFileSync(path.join(root, 'Setup.html'), 'utf8')
  .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\/[^"]+/, 'xlsx.full.min.js')
  .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/[^"]+/, 'qrcode.min.js');
setup = setup.replace('<script src="xlsx.full.min.js">', head + '<script>window.MOCK_EMAIL="cikgu@sekolah.edu.my";</script>\n<script src="xlsx.full.min.js">');
fs.writeFileSync(path.join(out, 'setup.html'), setup);

// fail Excel ujian: satu tab setiap kelas, baris judul, No. KP sebagai nombor
const XLSX = require('xlsx'); const wb = XLSX.utils.book_new();
for (const k of ['4 AMANAH', '4 BESTARI']) {
  const aoa = [['SENARAI NAMA MURID 2026'], ['KELAS: ' + k], [], ['BIL', 'NAMA MURID', 'NO. MYKID', 'RUMAH SUKAN']];
  for (let i = 1; i <= 30; i++) aoa.push([i, (i % 2 ? 'MUHAMMAD AMIR ' : 'NUR AINA ') + k.split(' ')[1] + ' ' + i + (i % 2 ? ' BIN ALI' : ' BINTI OMAR'), 130101010100 + i + (k[2] === 'B' ? 100 : 0), ['MERAH', 'BIRU', 'HIJAU', 'KUNING'][i % 4]]);
  aoa.push([], ['', 'JUMLAH', 30]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), k);
}
XLSX.writeFile(wb, path.join(out, 'murid.xlsx'));
console.log('Siap: tests/out/app.html, tests/out/setup.html, tests/out/murid.xlsx');
