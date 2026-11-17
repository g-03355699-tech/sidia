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
  // cdnjs mungkin disekat dalam sesi awan: hidangkan pustaka QR dari salinan tempatan
  await ctx.route('**/jspdf.umd.min.js', r => r.fulfill({ path: path.join(__dirname, 'node_modules/jspdf/dist/jspdf.umd.min.js'), contentType: 'text/javascript' }));
  await ctx.route('**/jspdf.plugin.autotable.min.js', r => r.fulfill({ path: path.join(__dirname, 'node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js'), contentType: 'text/javascript' }));
  await ctx.route('**/qrcodejs/**', r => r.fulfill({ path: path.join(out, 'qrcode.min.js'), contentType: 'text/javascript' }));
  p.on('pageerror', e => errs.push('app: ' + e.message));
  await p.goto(url('app.html')); await p.waitForSelector('#vLogin:not(.hidden)');
  await p.fill('#inNama', 'Cikgu Ujian'); await p.fill('#inPin', '0000'); await p.click('#btnLogin'); await p.waitForTimeout(300);
  ok(/PIN tidak sah/.test(await p.textContent('#loginMsg')), 'PIN salah ditolak');
  await p.fill('#inPin', '1234'); await p.click('#btnLogin'); await p.waitForSelector('#vRekod:not(.hidden)'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.students.length) === 800, '800 murid dimuatkan');
  await p.fill('#offQ', 'lewat surau'); await p.press('#offQ', 'Enter');
  ok(/R28/.test(await p.textContent('#offChosen')), 'carian kesalahan + Enter memilih R28');
  await p.tap('#q'); await p.waitForSelector('#srch:not(.hidden)');
  ok(await p.evaluate(() => document.activeElement.id) === 'q2', 'telefon: ketik carian membuka skrin carian penuh');
  ok(Math.round((await p.locator('#q2').boundingBox()).y) < 20, 'kotak carian berada di atas skrin');
  await p.fill('#q2', 'muhammad'); await p.press('#q2', 'Enter');
  await p.fill('#q2', 'nur'); await p.tap('#list2 .item >> nth=0'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.sel.size) === 2 && await p.evaluate(() => document.activeElement.id) === 'q2', 'ketik nama: dipilih, papan kekunci kekal');
  ok(/✓ 2/.test(await p.textContent('#q2N')), 'kiraan dipilih dalam kotak carian');
  await p.screenshot({ path: path.join(out, 'app-carian.png') });
  await p.tap('#srchDone');
  ok(await p.isVisible('#saveBar') && !(await p.isVisible('#srch')), 'Selesai: kembali, bar Simpan kelihatan');
  await p.evaluate(() => { S.sel.delete([...S.sel.keys()][1]); updateSaveBar(); });
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
  // ---------- menu Admin ----------
  await p.click('nav.tabs button[data-v=vAdmin]'); await p.fill('#inAdminPin', '1111'); await p.click('#btnAdmin'); await p.waitForTimeout(300);
  ok(await p.isVisible('#adminGate'), 'PIN Admin salah ditolak');
  await p.fill('#inAdminPin', '9999'); await p.click('#btnAdmin'); await p.waitForTimeout(400);
  ok(await p.isVisible('#adminHome'), 'menu Admin dibuka dengan PIN Admin');
  await p.screenshot({ path: path.join(out, 'app-admin.png') });
  // data realistik: ~300 rekod rawak dalam bulan ini
  await p.evaluate(() => {
    const off = readOffenses_(), st = readStudents_().students, d = new Date();
    let seed = 3; const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n; };
    const pick = () => off[[0, 0, 0, 1, 2, 5, 10, 13, 15, 20, 30, 70, 90, 100, 120][rnd(15)] % off.length];
    for (let k = 0; k < 40; k++) {
      const day = 1 + rnd(Math.max(1, d.getDate())), o = pick();
      const ids = Array.from({ length: 1 + rnd(14) }, () => st[rnd(st.length)][0]);
      const tg = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + day).slice(-2);
      saveRecords({ nama: ['Ustaz Hakim', 'Cikgu Aminah', 'Haziq (Pengawas)'][rnd(3)], peranan: 'Guru', pin: '1234' }, { kod: o.kod, tarikh: tg, masa: '07:15', lokasi: 'Surau', ids: ids });
    }
  });
  await p.click('[data-sub=subLaporan]'); await p.click('#btnReport'); await p.waitForTimeout(400);
  ok(/Mata demerit mengikut rumah/.test(await p.textContent('#reportOut')), 'laporan mata rumah dijana');
  await p.fill('#pdfJawatan', 'Guru Disiplin'); await p.check('#pdfLampiran');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('#btnPdf')]);
  const pdfPath = path.join(out, 'laporan.pdf'); await dl.saveAs(pdfPath);
  const txt = require('child_process').execFileSync('pdftotext', ['-layout', pdfPath, '-']).toString();
  const nPages = (txt.match(/\f/g) || []).length;
  ok(/LAPORAN DISIPLIN MURID/.test(txt) && /Kedudukan Rumah/.test(txt) && /Lampiran/.test(txt), 'PDF: tajuk, bahagian & lampiran ada');
  ok(nPages >= 3 && (txt.match(/SULIT/g) || []).length === nPages && new RegExp('Halaman ' + nPages + ' / ' + nPages).test(txt), 'PDF: header/footer & nombor halaman pada setiap halaman (' + nPages + ' halaman)');
  await p.click('#subLaporan [data-back]');
  await p.click('[data-sub=subTetapan]'); await p.fill('#tNama', 'SMK Ujian Baharu'); await p.click('#btnSaveTetapan'); await p.waitForTimeout(300);
  ok(await p.textContent('#hdrSchool') === 'SMK Ujian Baharu', 'tetapan sekolah disimpan');
  await p.click('[data-sub=subKongsi]'); await p.waitForTimeout(200);
  ok((await p.inputValue('#shareUrl')).indexOf('/a/') < 0 && /PIN 5678/.test(await p.textContent('#kongsiBody')), 'kongsi: pautan bersih + PIN pengawas');
  await p.click('#subKongsi [data-back]');
  p.on('dialog', d => d.accept());
  await p.click('[data-sub=subPin]'); await p.fill('#pinMurid', '1234'); await p.click('#btnSavePin'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => getSettings_().KOD_MURID) === '5678', 'PIN sama untuk Guru & Murid ditolak');
  await p.fill('#pinMurid', '2468'); await p.click('#btnSavePin'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => getSettings_().KOD_MURID) === '2468', 'admin tukar PIN Murid');
  await p.screenshot({ path: path.join(out, 'app-kongsi.png') });

  // ---------- pengawas ----------
  await p.click('#hdrWho'); await p.waitForSelector('#vLogin:not(.hidden)');
  await p.fill('#inNama', 'Haziq Pengawas'); await p.selectOption('#inPeranan', 'Pengawas');
  await p.fill('#inPin', '5678'); await p.click('#btnLogin'); await p.waitForTimeout(300);
  ok(/PIN tidak sah/.test(await p.textContent('#loginMsg')), 'PIN Murid lama tidak sah selepas ditukar');
  await p.fill('#inPin', '1234'); await p.click('#btnLogin'); await p.waitForTimeout(300);
  ok(/PIN tidak sah/.test(await p.textContent('#loginMsg')) && await p.inputValue('#inPeranan') === 'Pengawas', 'pengawas tidak boleh guna PIN Guru (peranan kekal)');
  await p.fill('#inPin', '2468'); await p.click('#btnLogin'); await p.waitForSelector('#vRekod:not(.hidden)'); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#tabAdmin')), 'tab Admin disorok untuk pengawas');
  await p.click('nav.tabs button[data-v=vTerkini]'); await p.waitForTimeout(400);
  ok(/Belum ada rekod/.test(await p.textContent('#recentList')), 'pengawas hanya melihat rekod sendiri');

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
