/* Tangkapan skrin untuk panduan PDF, diambil daripada web app sebenar (simulasi tests/).
 * Dipanggil oleh jana.js. Output: panduan/out/img/*.png */
const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs');
const tout = path.join(__dirname, '..', 'tests', 'out');
const img = path.join(__dirname, 'out', 'img');

module.exports = async function tangkap() {
  fs.mkdirSync(img, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 });
  await ctx.route('**/qrcodejs/**', r => r.fulfill({ path: path.join(tout, 'qrcode.min.js'), contentType: 'text/javascript' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  const shot = async (n, opt) => { await p.waitForTimeout(150); await p.screenshot({ path: path.join(img, n + '.png'), ...(opt || {}) }); };
  const top = () => p.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });

  await p.goto('file://' + path.join(tout, 'app.html'));
  await p.waitForSelector('#vLogin:not(.hidden)');
  await p.fill('#inNama', 'Cikgu Aminah'); await p.selectOption('#inPeranan', 'Warden'); await p.fill('#inPin', '1234');
  await shot('login');
  await p.click('#btnLogin'); await p.waitForSelector('#vRekod:not(.hidden)'); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.removeItem('sidia_offUse'); setOffense(null); renderOffList(); });
  await top(); await shot('kesalahan');
  await p.fill('#offQ', 'rokok'); await top(); await shot('kesalahan-cari');
  await p.fill('#offQ', ''); await p.click('#offList .off >> nth=0');
  await p.selectOption('#inLokasi', 'Surau');
  await top(); await shot('kesalahan-pilih');
  // taip + Enter
  await p.tap('#q'); await p.fill('#q2', 'hafiz 4'); await shot('cari');
  await p.fill('#q2', ''); await p.tap('#srchDone');
  // ikut kelas
  await p.selectOption('#fKelas', '4 BESTARI'); await p.click('[data-act=all]');
  const it = p.locator('.item'); for (const i of [1, 4]) await it.nth(i).click();
  await p.evaluate(() => { const h = document.querySelector('header').offsetHeight; window.scrollTo(0, document.getElementById('fKelas').getBoundingClientRect().top + scrollY - h - 70); document.activeElement.blur(); });
  await shot('kelas');
  // sahkan
  await p.click('#btnSave'); await shot('sahkan');
  await p.click('#btnDoSave'); await p.waitForTimeout(500); await shot('selesai');
  await p.click('text=Rekod seterusnya');
  await p.selectOption('#fKelas', '');
  // tampal senarai
  await top(); await p.click('#btnPaste');
  await p.fill('#pasteTxt', '1. Adam Arif 3 Bestari\n2. Nur Izzati\n3. Siti Aqilah 2 Amanah');
  await p.click('#btnMatch'); await p.waitForTimeout(200); await shot('tampal');
  await p.click('#modalBody .btn:has-text("Tutup")');
  // terkini
  await p.click('nav.tabs button[data-v=vTerkini]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const d = document.querySelector('#recentList details'); if (d) d.open = true; });
  await top(); await shot('terkini');
  // amalan baik
  await p.click('nav.tabs button[data-v=vAmalan]'); await p.waitForSelector('#abList .off');
  await top(); await shot('amalan');
  await p.click('#abList [data-ab=AB01]'); await p.selectOption('#fKelas', '4 BESTARI'); await p.click('[data-act=all]');
  await p.click('#btnSave'); await p.waitForTimeout(150); await shot('amalan-sahkan');
  await p.click('#btnDoSaveKb'); await p.waitForTimeout(500); await p.click('#modalBody .btn.pri');
  await p.selectOption('#fKelas', '');
  await p.evaluate(() => { const d = document.querySelector('#abRecent'); window.scrollTo(0, d.getBoundingClientRect().top + window.scrollY - 330); });
  await shot('amalan-rumah');
  await p.click('nav.tabs button[data-v=vRekod]');
  // admin
  await p.click('nav.tabs button[data-v=vAdmin]'); await top(); await shot('admin-pin-masuk');
  await p.fill('#inAdminPin', '9999'); await p.click('#btnAdmin'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.toast') && document.querySelector('.toast').remove());
  await top(); await shot('admin');
  await p.click('[data-sub=subLaporan]'); await p.click('#btnReport'); await p.waitForTimeout(500); await top(); await shot('laporan');
  await p.click('#subLaporan [data-back]');
  await p.click('[data-sub=subPin]'); await top(); await shot('pin');
  await p.click('#subPin [data-back]');
  await p.click('[data-sub=subTetapan]'); await top(); await shot('tetapan');
  await p.click('#subTetapan [data-back]');
  await p.click('[data-sub=subKongsi]'); await p.waitForTimeout(400); await top(); await shot('kongsi');
  await p.click('#subKongsi [data-back]');
  await p.click('[data-sub=subSistem]'); await top(); await shot('sistem');
  await p.click('#subSistem [data-back]');
  await p.click('#adminHome [data-sub=subKesalahan]'); await p.waitForSelector('#kesList .off'); await top(); await shot('senarai-kesalahan');
  await p.fill('#kesQ', 'R28'); await p.click('#kesList [data-kk=R28]'); await p.waitForTimeout(200); await shot('senarai-kesalahan-ubah');
  await p.click('#kBatal');
  // pengawas
  await p.click('#hdrWho'); await p.waitForSelector('#vLogin:not(.hidden)');
  await p.fill('#inNama', 'Haziq (Pengawas)'); await p.selectOption('#inPeranan', 'Pengawas'); await p.fill('#inPin', '5678');
  await shot('login-pengawas');
  await p.click('#btnLogin'); await p.waitForSelector('#vRekod:not(.hidden)'); await p.waitForTimeout(300);
  await p.evaluate(() => { setOffense(null); renderOffList(); });
  await p.fill('#offQ', 'lewat'); await top(); await shot('pengawas-kesalahan');
  await p.evaluate(() => { setOffense(S.offenses.find(o => o.kod === 'R16')); });
  await p.selectOption('#inLokasi', 'Pintu Pagar');
  await top(); await p.tap('#q');
  for (const q of ['danish', 'aqilah 2']) { await p.fill('#q2', q); await p.press('#q2', 'Enter'); }
  await p.fill('#q2', 'irfan 5');
  await p.evaluate(() => document.querySelector('.toast') && document.querySelector('.toast').remove());
  await shot('pengawas-rekod');
  await p.fill('#q2', ''); await p.press('#q2', 'Enter'); await p.tap('#srchDone');
  await p.evaluate(() => { const f = document.querySelector('#list .item'); }); 
  await p.click('#btnSave'); await p.click('#btnDoSave'); await p.waitForTimeout(500); await p.click('text=Rekod seterusnya');
  await p.click('nav.tabs button[data-v=vTerkini]'); await p.waitForTimeout(500); await top(); await shot('pengawas-terkini');
  await p.click('nav.tabs button[data-v=vAmalan]'); await p.waitForSelector('#abViewOnly:not(.hidden)'); await p.waitForTimeout(300); await top(); await shot('pengawas-amalan');

  // wizard (komputer)
  const w = await b.newPage({ viewport: { width: 920, height: 660 }, deviceScaleFactor: 2 });
  w.on('pageerror', e => errs.push('wizard: ' + e.message)); w.on('dialog', d => d.accept());
  await w.goto('file://' + path.join(tout, 'setup.html')); await w.waitForTimeout(400);
  await w.fill('#namaSekolah', 'SMK Contoh'); await w.fill('#kodGuru', '4821'); await w.fill('#kodMurid', '2650'); await w.fill('#kodAdmin', '7390');
  await w.screenshot({ path: path.join(img, 'wizard-1.png') });
  await w.click('#btnNext'); await w.waitForSelector('#s2:not(.hidden)');
  await w.setInputFiles('#file', path.join(tout, 'murid.xlsx')); await w.waitForTimeout(600);
  await w.evaluate(() => document.querySelector('main').scrollTo(0, 330));
  await w.screenshot({ path: path.join(img, 'wizard-2.png') });
  await w.click('#btnNext'); await w.waitForSelector('#s3:not(.hidden)');
  await w.screenshot({ path: path.join(img, 'wizard-3.png') });
  await w.click('#btnNext'); await w.waitForSelector('#s4:not(.hidden)');
  await w.screenshot({ path: path.join(img, 'wizard-4a.png') });
  await w.evaluate(() => { window.MOCK_URL = 'https://script.google.com/macros/s/AKfycbContohSiDIA/exec'; });
  await w.click('#btnCheck'); await w.waitForTimeout(400);
  await w.screenshot({ path: path.join(img, 'wizard-4b.png') });
  await b.close();
  if (errs.length) throw new Error('Ralat JS semasa tangkapan skrin: ' + errs.join(' | '));
};
