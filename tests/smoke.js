/* Ujian hujung-ke-hujung (Playwright + Chromium). Guna:
 *   cd tests && npm install && node build.js && node smoke.js
 * Tangkapan skrin disimpan di tests/out/*.png */
const { chromium, devices } = require('playwright');
const path = require('path'), out = path.join(__dirname, 'out'), url = f => 'file://' + path.join(out, f);
let fails = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const errs = [];

  // ---------- web app (iPhone) ----------
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('app: ' + e.message));
  await p.goto(url('app.html')); await p.waitForSelector('#vLogin:not(.hidden)');
  await p.fill('#inNama', 'Cikgu Ujian'); await p.fill('#inPin', '0000'); await p.click('#btnLogin'); await p.waitForTimeout(300);
  ok(/Kod akses/.test(await p.textContent('#loginMsg')), 'kod akses salah ditolak');
  await p.fill('#inPin', '1234'); await p.click('#btnLogin'); await p.waitForSelector('#vRekod:not(.hidden)'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.students.length) === 800, '800 murid dimuatkan');
  await p.fill('#offQ', 'lewat surau'); await p.press('#offQ', 'Enter');
  ok(/R28/.test(await p.textContent('#offChosen')), 'carian kesalahan + Enter memilih R28');
  await p.fill('#q', 'muhammad'); await p.press('#q', 'Enter');
  ok(/^MOHD|^MUHAMMAD|^MUHD/.test(await p.evaluate(() => S.byId[[...S.sel.keys()][0]].nama)), 'alias Muhammad = Mohd');
  await p.evaluate(() => document.activeElement.blur());
  await p.selectOption('#fKelas', '3 CEMERLANG'); await p.click('[data-act=all]');
  const n = await p.evaluate(() => S.sel.size);
  await p.click('#btnSave'); await p.click('#btnDoSave'); await p.waitForTimeout(400);
  ok(new RegExp(n + ' rekod disimpan').test(await p.textContent('#modalBody')), n + ' rekod disimpan sekaligus');
  await p.click('text=Rekod seterusnya');
  await p.selectOption('#fKelas', '3 CEMERLANG'); await p.click('[data-act=all]'); await p.click('#btnSave'); await p.click('#btnDoSave'); await p.waitForTimeout(400);
  ok(/0 rekod disimpan/.test(await p.textContent('#modalBody')), 'rekod berganda dihalang');
  await p.click('text=Rekod seterusnya');
  await p.click('nav.tabs button[data-v=vLaporan]'); await p.fill('#inAdminPin', '9999'); await p.click('#btnAdmin'); await p.waitForTimeout(400);
  ok(/Mata demerit mengikut rumah/.test(await p.textContent('#reportOut')), 'laporan mata rumah dijana');
  await p.screenshot({ path: path.join(out, 'app-laporan.png') });

  // ---------- wizard ----------
  const w = await b.newPage({ viewport: { width: 920, height: 660 } }); w.on('pageerror', e => errs.push('wizard: ' + e.message));
  w.on('dialog', d => d.accept());
  await w.goto(url('setup.html')); await w.waitForTimeout(400);
  await w.fill('#namaSekolah', 'SMK Ujian'); await w.click('#btnNext'); await w.waitForSelector('#s2:not(.hidden)');
  await w.setInputFiles('#file', path.join(out, 'murid.xlsx')); await w.waitForTimeout(600);
  const ids = await w.evaluate(() => W.rows.map(r => r[0]));
  ok(ids.length === 60, 'Excel 2 tab → 60 murid (baris judul & JUMLAH diabaikan)');
  ok(ids.every(id => /^\d{12}$/.test(id)), 'No. KP 12 digit penuh (bukan 1.3E+11)');
  await w.click('#btnNext'); await w.waitForSelector('#s3:not(.hidden)');
  ok(/142 kesalahan/.test(await w.textContent('#offCount')), '142 kesalahan standard');
  await w.click('#btnNext'); await w.waitForSelector('#s4:not(.hidden)');
  await w.evaluate(() => { window.MOCK_URL = 'https://script.google.com/a/sekolah.edu.my/macros/s/AKfyTEST/exec'; });
  await w.click('#btnCheck'); await w.waitForTimeout(300);
  ok(await w.inputValue('#appUrl') === 'https://script.google.com/macros/s/AKfyTEST/exec', 'pautan web app tanpa /a/domain/');
  await w.screenshot({ path: path.join(out, 'wizard-siap.png') });

  ok(!errs.length, 'tiada ralat JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} ujian GAGAL` : '\nSemua ujian lulus');
  process.exit(fails ? 1 : 0);
})();
