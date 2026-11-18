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
  ok((await p.textContent('#q2N')).trim() === '2' && await p.isVisible('#q2N'), 'kiraan dipilih dalam kotak carian');
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
  // ---------- jumlah rekod di sebelah nama ----------
  const idK = await p.evaluate(() => Object.keys(S.done)[0]);
  ok(JSON.stringify(await p.evaluate(id => S.kiraan[id], idK)) === '[1,1]', 'kiraan rekod murid (tahun semasa, keseluruhan) dikemas kini selepas simpan');
  ok(await p.evaluate(id => /<i class="t"[^>]*>1<\/i><i class="a"[^>]*>1<\/i>/.test(itemHtml(S.byId[id], '')), idK), 'lencana tahun semasa (hijau) & keseluruhan (biru) di sebelah nama');
  ok(await p.evaluate(() => { const o = S.kiraan; S.kiraan = { z: [4, 11] }; const h = kcHtml('z'); S.kiraan = o; return /class="t hi"/.test(h) && /class="a hi"/.test(h); }) &&
     await p.evaluate(() => { const o = S.kiraan; S.kiraan = { z: [3, 10] }; const h = kcHtml('z'); S.kiraan = o; return !/hi/.test(h); }), 'merah jika tahun semasa > 3, jingga jika keseluruhan > 10');
  ok(await p.evaluate(id => { saveRecords({ nama: 'X', peranan: 'Guru', pin: '1234' }, { kod: 'R14', tarikh: '2024-03-04', ids: [id] }); const k = kiraanMurid_([id])[id]; return k[0] === 1 && k[1] === 2; }, idK), 'rekod tahun lepas dikira dalam keseluruhan sahaja');
  ok(await p.evaluate(() => { const k = kiraanMurid_(); return Object.keys(k).length > 0 && Object.keys(getBootstrap({ nama: 'X', peranan: 'Guru', pin: '1234' }).kiraan).length === Object.keys(k).length; }), 'getBootstrap memulangkan kiraan untuk guru');
  await p.click('text=Rekod seterusnya');
  // ---------- menu Admin ----------
  // ---------- senarai kesalahan (guru tanpa PIN Admin) ----------
  await p.click('nav.tabs button[data-v=vAdmin]'); await p.waitForTimeout(150);
  ok(await p.isVisible('#guruTools') && await p.isVisible('#adminGate'), 'guru: butang Senarai kesalahan tanpa PIN Admin');
  await p.click('#guruTools [data-sub=subKesalahan]'); await p.waitForSelector('#kesList .off');
  ok(await p.locator('#kesList .off').count() === 137, 'senarai kesalahan aktif (137) dipaparkan');
  await p.screenshot({ path: path.join(out, 'app-kesalahan-senarai.png') });
  await p.click('#btnKesBaru'); await p.fill('#kKod', 'z01'); await p.fill('#kTeks', 'TIDAK MEMBAWA KAD MATRIK');
  await p.selectOption('#kKat', 'Sederhana'); await p.check('#kPantas');
  await p.screenshot({ path: path.join(out, 'app-kesalahan-ubah.png') });
  await p.click('#kSimpan'); await p.waitForTimeout(400);
  const z = await p.evaluate(() => S.offenses.filter(o => o.kod === 'Z01')[0]);
  ok(z && z.kategori === 'Sederhana' && z.mata === 5 && z.pantas, 'tambah kesalahan Z01 (kod huruf besar, mata ikut kategori, pantas)');
  ok(/Z01/.test(await p.textContent('#offList')) || await p.evaluate(() => quickList().pin.some(o => o.kod === 'Z01')), 'Z01 terus muncul dalam skrin Rekod');
  await p.click('#btnKesBaru'); await p.fill('#kKod', 'R28'); await p.fill('#kTeks', 'PENDUA'); await p.click('#kSimpan'); await p.waitForTimeout(300);
  ok(/sudah digunakan/.test(await p.textContent('#toast').catch(() => '')) || await p.isVisible('#kSimpan'), 'kod pendua ditolak');
  await p.click('#kBatal');
  await p.fill('#kesQ', 'R28'); await p.click('#kesList [data-kk=R28]');
  ok(await p.getAttribute('#kKod', 'readonly') !== null && !(await p.isVisible('#kPadam')), 'R28 sudah digunakan: kod dikunci, tiada butang Padam');
  await p.fill('#kMata', '4'); await p.click('#kSimpan'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.offenses.filter(o => o.kod === 'R28')[0].mata) === 4 && await p.evaluate(() => S.off && S.off.mata) === 4, 'ubah mata R28 (kesalahan dipilih turut dikemas kini)');
  await p.fill('#kesQ', 'Z01'); await p.click('#kesList [data-kk=Z01]'); await p.uncheck('#kAktif'); await p.click('#kSimpan'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => S.offenses.some(o => o.kod === 'Z01'))), 'nyahaktif Z01: hilang daripada skrin Rekod');
  await p.fill('#kesQ', ''); await p.click('#kesTabs [data-kt=x]');
  ok(/Z01/.test(await p.textContent('#kesList')), 'Z01 dalam tab Tidak aktif');
  p.once('dialog', d => d.accept()); await p.click('#kesList [data-kk=Z01]'); await p.click('#kPadam'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !_ss.sheets.KESALAHAN.d.some(r => r[0] === 'Z01')), 'padam kesalahan yang belum digunakan');
  ok(await p.evaluate(() => { try { saveOffense({ peranan: 'Pengawas', nama: 'X', pin: '5678' }, { kod: 'Q1', kesalahan: 'UJIAN', kategori: 'Ringan', mata: 1 }, ''); return false; } catch (e) { return /Pengawas tidak boleh/.test(e.message); } }), 'pelayan: pengawas tidak boleh mengubah senarai kesalahan');
  await p.click('#subKesalahan [data-back]');
  // ---------- menu Admin ----------
  await p.fill('#inAdminPin', '1111'); await p.click('#btnAdmin'); await p.waitForTimeout(300);
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
  // ---------- Laporan Kesalahan Murid ----------
  ok(await p.isVisible('#subLaporan #lmCard'), 'kotak carian Laporan Kesalahan Murid dalam Admin › Laporan');
  const top = await p.evaluate(() => { const k = kiraanMurid_(); return Object.keys(k).sort((a, b) => k[b][1] - k[a][1])[0]; });
  const topNama = await p.evaluate(id => S.byId[id].nama, top), topN = await p.evaluate(id => kiraanMurid_()[id][1], top);
  await p.fill('#lmQ', topNama); await p.waitForSelector('#lmRes [data-lm]');
  await p.click('#lmRes [data-lm="' + top + '"]'); await p.waitForSelector('#lmOut table');
  ok(await p.locator('#lmOut tbody tr').count() === topN, 'semua kesalahan murid dipaparkan (' + topN + ' rekod)');
  await p.screenshot({ path: path.join(out, 'app-laporan-murid.png'), fullPage: true });
  const [dlc] = await Promise.all([p.waitForEvent('download'), p.click('#lmCsv')]);
  const csvM = require('fs').readFileSync(await dlc.path(), 'utf8');
  ok(csvM.trim().split('\n').length === topN + 1 && csvM.indexOf(topNama) > 0, 'CSV laporan murid');
  const [dlp] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.click('#lmPdf')]);
  const pdfM = path.join(out, 'laporan-murid.pdf'); await dlp.saveAs(pdfM);
  const txtM = require('child_process').execFileSync('pdftotext', ['-layout', pdfM, '-']).toString();
  ok(/LAPORAN KESALAHAN MURID/.test(txtM) && txtM.indexOf(topNama) >= 0 && /Ringkasan Mengikut Kesalahan/.test(txtM) && /SULIT/.test(txtM), 'PDF laporan murid: tajuk, nama, ringkasan, header/footer');
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
  ok(await p.evaluate(id => !!S.kiraan && S.kiraan[id][1] >= 1, top), 'pengawas juga melihat jumlah rekod');
  ok(await p.isVisible('#vTerkini #lmCard'), 'pengawas: Laporan Kesalahan Murid di tab Terkini');
  await p.fill('#lmQ', topNama); await p.waitForSelector('#lmRes [data-lm]'); await p.click('#lmRes [data-lm="' + top + '"]'); await p.waitForSelector('#lmOut table');
  ok(await p.locator('#lmOut tbody tr').count() === topN, 'pengawas boleh melihat laporan kesalahan murid');

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
  ok(/137 kesalahan/.test(await w.textContent('#offCount')), '137 kesalahan standard');
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
