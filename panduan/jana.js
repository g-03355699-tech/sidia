/* Jana panduan pengguna SiDIA dalam format PDF (A4).
 *
 *   cd tests && npm install && cd .. && node panduan/jana.js
 *
 * Langkah: bina simulasi (tests/build.js) → tangkapan skrin web app sebenar (tangkap.js)
 * → susun HTML setiap panduan → cetak ke PDF dengan Chromium → docs/panduan/*.pdf
 * Jalankan semula selepas paparan web app berubah. */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
require('../tests/build.js');
const tangkap = require('./tangkap.js');

const VERSI = (fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8').match(/SIDIA_VERSION = '([^']+)'/) || [])[1] || '';
const IMG = path.join(__dirname, 'out', 'img');
const OUT = path.join(__dirname, '..', 'docs', 'panduan');
const img = n => 'data:image/png;base64,' + fs.readFileSync(path.join(IMG, n + '.png')).toString('base64');

/* ---------------- blok kandungan ---------------- */
const step = (n, tajuk, isi, gambar) =>
  `<div class="step${gambar ? '' : ' nogambar'}"><div class="tx"><div class="sh"><span class="n">${n}</span><h3>${tajuk}</h3></div>${isi}</div>` +
  (gambar ? `<div class="shot">${[].concat(gambar).map(g => `<img src="${img(g)}">`).join('')}</div>` : '') + '</div>';
const lebar = (n, tajuk, isi, gambar) =>
  `<div class="step wide"><div class="sh"><span class="n">${n}</span><h3>${tajuk}</h3></div>${isi}<img class="wideimg" src="${img(gambar)}"></div>`;
const tip = t => `<div class="tip"><b>Petua</b> ${t}</div>`;
const amaran = t => `<div class="warn"><b>Penting</b> ${t}</div>`;
const seksyen = (t, sub) => `<h2>${t}</h2>${sub ? `<p class="lead">${sub}</p>` : ''}`;

const BUKA = (pinNama) => step('1', 'Buka SiDIA di telefon',
  `<p>Buka pautan SiDIA yang dikongsi oleh admin sekolah (biasanya melalui WhatsApp), atau imbas kod QR dengan kamera telefon.</p>
   <p><b>Tambah ke skrin utama</b> supaya SiDIA boleh dibuka seperti aplikasi:</p>
   <ul><li><b>iPhone (Safari):</b> ketik ikon Kongsi <span class="k">⬆</span> › <i>Add to Home Screen</i></li>
   <li><b>Android (Chrome):</b> ketik <span class="k">⋮</span> › <i>Add to Home screen</i></li></ul>
   <p>Anda juga perlukan <b>${pinNama}</b>. Dapatkan PIN ini daripada admin.</p>
   ${tip('Jika keluar mesej <i>"Sorry, unable to open the file"</i>, telefon anda log masuk dengan beberapa akaun Google. Buka pautan dalam tetingkap Incognito, atau minta admin menghantar pautan yang bermula dengan <code>script.google.com/macros/s/</code>.')}`);

const LOGIN = (n, peranan, pinNama, gambar) => step(n, 'Log masuk',
  `<ol><li>Isi <b>nama penuh</b> anda. Nama ini dicatat sebagai pelapor pada setiap rekod.</li>
   <li>Pilih peranan <b>${peranan}</b>.</li>
   <li>Masukkan <b>${pinNama}</b> dan ketik <b>Masuk</b>.</li></ol>
   <p>Nama, peranan dan PIN diingati di telefon anda, jadi anda tidak perlu log masuk semula setiap kali.</p>
   ${tip('Untuk menukar pengguna (cth telefon dikongsi), ketik nama anda di penjuru kanan atas.')}
   ${amaran('PIN berbeza mengikut peranan. PIN Pengawas tidak boleh digunakan untuk log masuk sebagai Guru atau Warden. Jangan kongsi PIN anda dengan orang lain.')}`, gambar);

const KESALAHAN = n => step(n, 'Pilih kesalahan',
  `<p>Kesalahan disusun dalam tab:</p>
   <ul><li><b>⭐ Pantas</b>: kesalahan harian (tidak hadir solat, datang lewat, pakaian, rambut, telefon) dan kesalahan yang paling kerap <i>anda</i> rekod.</li>
   <li><b>Ringan · Sederhana · Berat</b>: semua kesalahan mengikut tahap. Warna kod: <span class="sev r">hijau</span> Ringan, <span class="sev s">oren</span> Sederhana, <span class="sev b">merah</span> Berat.</li></ul>
   <p>Atau <b>cari</b> ikut nama atau kod, contohnya <code>rokok</code>, <code>ponteng</code> atau <code>R16</code>, kemudian ketik kesalahan itu.</p>
   ${tip('Kesalahan yang dipilih kekal untuk rekod seterusnya. Ketik <b>Tukar</b> untuk memilih kesalahan lain.')}`, ['kesalahan', 'kesalahan-cari']);

const BUTIRAN = n => step(n, 'Semak tarikh, masa dan lokasi',
  `<p><b>Tarikh</b> dan <b>masa</b> diisi secara automatik. Ubah jika anda merekod kejadian yang berlaku lebih awal.</p>
   <p>Pilih <b>lokasi</b> (cth Surau, Asrama, Pintu Pagar). Lokasi diingati untuk rekod seterusnya.</p>
   <p><b>Catatan</b> adalah pilihan, contohnya "Dorm B" atau "tanpa kebenaran warden".</p>`, 'kesalahan-pilih');

const PILIH_MURID = (n) =>
  seksyen('Pilih murid: tiga cara', 'Pilih cara yang paling sesuai dengan situasi. Ketiga-tiga cara boleh digabungkan sebelum menekan Simpan.') +
  step(n + 'a', 'Taip nama & tekan Enter',
    `<p>Taip sebahagian nama dan/atau kelas, contohnya <code>hafiz 4</code>. Murid teratas (bergaris hijau di kiri) terus dipilih apabila anda menekan <b>Enter</b> pada papan kekunci.</p>
     <p>Kotak carian dikosongkan secara automatik, jadi anda boleh terus menaip nama seterusnya. Bilangan murid yang dipilih dipaparkan dalam kotak carian (cth <b>✓ 3</b>).</p>
     ${tip('Ejaan <i>Mohd / Muhd / Muhammad</i> dan <i>Nor / Noor / Nur</i> dianggap sama. Anda juga boleh ketik terus nama dalam senarai.')}`, 'cari') +
  step(n + 'b', 'Ikut kelas: pilih semua, buang yang hadir',
    `<p>Paling pantas untuk semakan kehadiran (solat berjemaah, perhimpunan, prep):</p>
     <ol><li>Pilih <b>kelas</b> dalam senarai pilihan.</li>
     <li>Ketik <b>Pilih semua</b>.</li>
     <li>Ketik nama murid yang <b>hadir</b> untuk membuang tanda.</li></ol>
     <p>Murid bertanda ✓ ialah murid yang akan direkod. Anda boleh menukar kelas dan menambah murid kelas lain sebelum menyimpan.</p>`, 'kelas') +
  step(n + 'c', 'Tampal senarai nama',
    `<p>Ada senarai nama daripada ketua dorm, ketua kelas atau WhatsApp?</p>
     <ol><li>Salin senarai itu, kemudian ketik <b>📋 Tampal senarai</b>.</li>
     <li>Tampal (satu nama setiap baris) dan ketik <b>Padankan</b>.</li>
     <li>SiDIA memadankan nama secara automatik. Jika ada nama yang sama, pilih murid yang betul, kemudian ketik <b>Tambah</b>.</li></ol>
     ${tip('Sertakan kelas jika ada nama yang sama, contohnya <i>Nur Izzati 4 Amanah</i>.')}`, 'tampal');

const SIMPAN = n => step(n, 'Simpan & sahkan',
  `<ol><li>Ketik <b>Simpan (bilangan)</b> di bahagian bawah skrin.</li>
   <li>Semak ringkasan (kesalahan, tarikh, bilangan murid), kemudian ketik <b>Sahkan & simpan</b>.</li></ol>
   <p>Selesai! Semua murid direkod sekaligus. Jika tersilap, ketik <b>Batal rekod ini</b> dengan segera: pilihan murid akan dipulihkan untuk dibetulkan.</p>
   ${tip('Murid yang sudah direkod untuk kesalahan yang sama pada tarikh yang sama <b>tidak</b> direkod dua kali, walaupun direkod oleh orang lain. SiDIA memaparkan nama murid tersebut.')}`, ['sahkan', 'selesai']);

const TERKINI = (n, murid) => step(n, 'Semak rekod terkini',
  `<p>Tab <b>🕘 Terkini</b> memaparkan rekod yang baru disimpan${murid ? ' oleh <b>anda</b>' : ''}: kesalahan, tarikh, lokasi, pelapor dan senarai murid.</p>
   <p>Rekod anda sendiri boleh <b>dipadam</b> dalam tempoh 24 jam (tempoh ditetapkan oleh admin). Selepas itu, minta admin memadamnya.</p>
   ${murid ? '' : tip('Tandakan <b>rekod saya sahaja</b> untuk melihat rekod yang anda buat sahaja.')}`, murid ? 'pengawas-terkini' : 'terkini');

const SOALAN = (extra) => seksyen('Soalan lazim') + `<div class="faq">
  <p><b>Internet terputus semasa merekod?</b> Murid yang dipilih tidak hilang. Buka semula SiDIA dan pilihan anda akan dipulihkan. Ketik Simpan apabila internet kembali.</p>
  <p><b>Label "sudah direkod" pada nama murid?</b> Murid itu sudah direkod untuk kesalahan yang sama dalam sesi ini.</p>
  <p><b>Murid tiada dalam senarai / maklumat salah?</b> Maklumkan kepada admin untuk mengemas kini senarai murid.</p>
  <p><b>"PIN tidak sah"?</b> Semak peranan yang dipilih. PIN mungkin telah ditukar oleh admin, jadi minta PIN terkini.</p>
  ${extra || ''}</div>`;

/* ---------------- panduan ---------------- */
const PANDUAN = [
  {
    fail: 'Panduan-SiDIA-Guru.pdf', peranan: 'Guru', warna: '#0f766e',
    subtajuk: 'Merekod kesalahan disiplin murid dengan pantas dari telefon',
    untuk: 'Guru, Guru Disiplin dan guru bertugas mingguan',
    perlu: ['Pautan SiDIA daripada admin sekolah', 'PIN Guru & Warden'],
    isi: () =>
      seksyen('Bermula') + BUKA('PIN Guru & Warden') + LOGIN('2', 'Guru (atau Guru Disiplin)', 'PIN Guru & Warden', 'login') +
      seksyen('Merekod kesalahan', 'Contoh: semasa perhimpunan, beberapa murid didapati berambut panjang.') +
      KESALAHAN('3') + BUTIRAN('4') + PILIH_MURID('5') + SIMPAN('6') +
      seksyen('Selepas merekod') + TERKINI('7') +
      step('8', 'Menu Admin (Guru Disiplin / PK HEM)',
        `<p>Guru yang diberi <b>PIN Admin</b> boleh membuka tab <b>🛡️ Admin</b> untuk:</p>
         <ul><li><b>Laporan</b> mata demerit mengikut rumah, kelas, kesalahan dan murid, termasuk eksport ke Excel (CSV)</li>
         <li><b>PIN akses</b>, <b>Tetapan sekolah</b>, <b>Kongsi pautan</b> dan <b>Sistem</b></li></ul>
         <p>Lihat <i>Panduan SiDIA: Admin</i> untuk butiran.</p>`, ['admin', 'laporan']) +
      SOALAN()
  },
  {
    fail: 'Panduan-SiDIA-Warden.pdf', peranan: 'Warden', warna: '#0f766e',
    subtajuk: 'Semakan solat berjemaah, prep dan disiplin asrama dalam beberapa saat',
    untuk: 'Warden asrama dan guru bertugas asrama',
    perlu: ['Pautan SiDIA daripada admin sekolah', 'PIN Guru & Warden (sama dengan guru)'],
    isi: () =>
      seksyen('Bermula') + BUKA('PIN Guru & Warden') + LOGIN('2', 'Warden', 'PIN Guru & Warden', 'login') +
      seksyen('Senario: semakan solat Subuh berjemaah', 'Selepas solat Subuh, 40 murid tidak turun ke surau. Begini cara merekod mereka dalam masa kurang seminit.') +
      step('3', 'Pilih kesalahan solat dari tab ⭐ Pantas',
        `<p>Dalam tab <b>⭐ Pantas</b>, ketik kesalahan mengikut waktu solat:</p>
         <table class="mini"><tr><th>Kod</th><th>Kesalahan</th></tr>
         <tr><td>W01</td><td>Tidak hadir solat Subuh berjemaah</td></tr><tr><td>W02</td><td>… Zohor</td></tr>
         <tr><td>W03</td><td>… Asar</td></tr><tr><td>W04</td><td>… Maghrib</td></tr><tr><td>W05</td><td>… Isyak</td></tr>
         <tr><td>R28</td><td>Lewat ke surau/masjid</td></tr></table>
         <p>Kemudian pilih lokasi <b>Surau</b>.</p>
         ${tip('Setiap waktu solat mempunyai kod sendiri. Murid yang ponteng Subuh dan Isyak pada hari yang sama direkod sebagai dua kesalahan yang berbeza.')}`, ['kesalahan', 'kesalahan-pilih']) +
      step('4', 'Pilih kelas, Pilih semua, buang yang hadir',
        `<ol><li>Pilih kelas atau dorm (ikut senarai kelas sekolah).</li><li>Ketik <b>Pilih semua</b>.</li>
         <li>Ketik nama murid yang <b>hadir</b> untuk membuang tanda.</li>
         <li>Ulang untuk kelas lain. Murid yang sudah ditanda dikekalkan.</li></ol>
         <p>Jika ketua dorm memberi senarai nama yang tidak hadir, gunakan <b>📋 Tampal senarai</b> (lihat langkah 6).</p>`, 'kelas') +
      SIMPAN('5') +
      seksyen('Cara lain memilih murid') +
      step('6', 'Tampal senarai daripada ketua dorm',
        `<p>Minta ketua dorm menghantar senarai nama murid yang tidak hadir melalui WhatsApp. Salin senarai itu, ketik <b>📋 Tampal senarai</b>, tampal, kemudian ketik <b>Padankan</b>. SiDIA memadankan nama walaupun ejaannya sedikit berbeza.</p>`, 'tampal') +
      step('7', 'Taip nama & tekan Enter',
        `<p>Untuk beberapa murid sahaja (cth lewat masuk dewan makan atau bising selepas waktu tidur): taip sebahagian nama dan tekan <b>Enter</b>. Murid teratas terus dipilih, dan anda boleh terus menaip nama seterusnya.</p>`, 'cari') +
      seksyen('Selepas merekod') + TERKINI('8') +
      SOALAN(`<p><b>Dua warden merekod murid yang sama?</b> Tiada masalah. SiDIA tidak menyimpan rekod kedua bagi murid, kesalahan dan tarikh yang sama.</p>
              <p><b>Kesalahan asrama tiada dalam senarai?</b> Minta admin menambahnya dalam senarai kesalahan (Google Sheet › SiDIA › Mula di sini › Kesalahan).</p>`)
  },
  {
    fail: 'Panduan-SiDIA-Pengawas.pdf', peranan: 'Murid (Pengawas)', warna: '#0f766e',
    subtajuk: 'Panduan untuk pengawas dan murid bertugas',
    untuk: 'Pengawas sekolah, pengawas asrama dan murid yang diberi tugas merekod',
    perlu: ['Pautan SiDIA daripada guru penasihat pengawas', 'PIN Murid (Pengawas)'],
    isi: () =>
      `<div class="amanah"><h3>Amanah seorang pengawas</h3><ul>
        <li>Rekod hanya kesalahan yang anda <b>lihat sendiri</b>, dengan jujur dan adil.</li>
        <li><b>Jangan</b> merekod kerana marah, dendam atau atas permintaan kawan.</li>
        <li><b>Jangan kongsi PIN</b> anda dengan murid lain. Nama anda dicatat pada setiap rekod.</li>
        <li>Jika ragu-ragu, rujuk guru bertugas sebelum merekod.</li></ul></div>` +
      seksyen('Bermula') + BUKA('PIN Murid (Pengawas)') + LOGIN('2', 'Pengawas', 'PIN Murid (Pengawas)', 'login-pengawas') +
      seksyen('Senario: bertugas di pintu pagar', 'Murid datang lewat ke sekolah. Rekod mereka satu demi satu semasa mereka melepasi pintu pagar.') +
      step('3', 'Pilih kesalahan & lokasi',
        `<p>Dalam tab <b>⭐ Pantas</b>, ketik <b>R16 Datang lewat ke sekolah</b>. Anda juga boleh menaip <code>lewat</code> dalam kotak carian kesalahan.</p>
         <p>Pilih lokasi <b>Pintu Pagar</b>.</p>`, 'pengawas-kesalahan') +
      step('4', 'Taip nama setiap murid & tekan Enter',
        `<ol><li>Tanya nama dan kelas murid.</li><li>Taip sebahagian nama dan kelas, contohnya <code>danish 4</code>, kemudian tekan <b>Enter</b>.</li>
         <li>Ulang untuk murid seterusnya. Bilangan murid dipaparkan dalam kotak carian.</li></ol>
         ${tip('Jika murid yang dipilih salah, ketik namanya dalam senarai untuk membuang tanda.')}`, 'pengawas-rekod') +
      SIMPAN('5') +
      seksyen('Selepas merekod') + TERKINI('6', true) +
      SOALAN(`<p><b>Kenapa saya tidak nampak tab Admin atau laporan?</b> Laporan hanya untuk guru dan admin. Pengawas boleh merekod dan melihat rekod sendiri sahaja.</p>
              <p><b>Tersilap rekod selepas 24 jam?</b> Maklumkan kepada guru penasihat pengawas untuk dipadam.</p>`)
  },
  {
    fail: 'Panduan-SiDIA-Admin.pdf', peranan: 'Admin', warna: '#0f766e',
    subtajuk: 'Persediaan sistem, PIN, laporan mata rumah dan kemas kini',
    untuk: 'Guru Disiplin, PK HEM atau guru yang menguruskan SiDIA',
    perlu: ['Akaun Google sekolah (DELIMa)', 'Fail Excel/CSV senarai murid', 'PIN Admin'],
    isi: () =>
      seksyen('Persediaan (sekali sahaja, ±10 minit)', 'Dibuat di komputer. Buka halaman SiDIA dan klik <b>Buat salinan SiDIA</b>, kemudian dalam Google Sheet klik menu <b>SiDIA › 🚀 Mula di sini</b>.') +
      lebar('1', 'Maklumat sekolah & PIN',
        `<p>Isi nama sekolah dan tiga PIN (4–8 digit, setiap satu berbeza): <b>PIN Guru & Warden</b>, <b>PIN Murid (Pengawas)</b> dan <b>PIN Admin</b>.</p>`, 'wizard-1') +
      lebar('2', 'Muat naik senarai murid',
        `<p>Muat naik fail Excel/CSV. Lajur Nama, Kelas, Rumah dan No. MyKid dikesan secara automatik. Fail boleh mengandungi satu tab setiap kelas. Semak pratonton (No. KP mesti 12 digit), kemudian simpan.</p>`, 'wizard-2') +
      lebar('3', 'Kesalahan & mata demerit',
        `<p>Semak 142 kesalahan standard. Ubah mata, nyahaktifkan kesalahan yang tidak digunakan, tandakan <b>⭐</b> untuk pilihan pantas, atau <b>tampal senarai sekolah anda dari Excel</b>.</p>`, 'wizard-3') +
      lebar('4', 'Aktifkan web app & kongsi',
        `<p>Ikut arahan dalam wizard: <b>Deploy › New deployment › Web app</b>, dengan <i>Execute as: Me</i> dan <i>Who has access: Anyone</i> (dilindungi PIN). Kemudian kongsi pautan atau kod QR.</p>`, 'wizard-4b') +
      seksyen('Menu Admin di telefon', 'Tab <b>🛡️ Admin</b> dibuka dengan PIN Admin, atau dengan log masuk menggunakan peranan Admin.') +
      step('5', 'Menu Admin',
        `<p>Lima menu: <b>Laporan</b>, <b>PIN akses</b>, <b>Tetapan sekolah</b>, <b>Kongsi pautan</b> dan <b>Sistem</b>. Statistik ringkas (murid, kelas, kesalahan, rekod) dipaparkan di bawah.</p>`, 'admin') +
      step('6', 'Laporan mata rumah',
        `<p>Pilih tempoh (Minggu ini, Bulan ini, Tahun ini, atau tarikh sendiri), kemudian ketik <b>Jana laporan</b>. Laporan menunjukkan:</p>
         <ul><li>jumlah kes, murid terlibat dan <b>mata ditolak bagi setiap rumah</b></li><li>pecahan mengikut kesalahan dan kelas</li><li>20 murid dengan mata tertinggi</li></ul>
         <p>Eksport ke CSV (dibuka dalam Excel), atau <b>Tulis ke tab LAPORAN</b> dalam Google Sheet.</p>`, 'laporan') +
      step('7', 'Tukar PIN',
        `<p>Tukar PIN apabila PIN bocor, pada awal penggal, atau apabila pengawas bertukar. Ketik <b>🎲 Jana</b> untuk PIN rawak, kemudian <b>Simpan PIN</b>.</p>
         <p>Semua pengguna dalam kumpulan yang PIN-nya ditukar perlu log masuk semula. SiDIA terus membuka <b>Kongsi pautan</b> supaya PIN baharu boleh dihantar melalui WhatsApp.</p>
         ${amaran('Simpan PIN Admin di tempat selamat. Jika terlupa, pemilik Google Sheet boleh melihatnya dalam tab TETAPAN (KOD_ADMIN).')}`, 'pin') +
      step('8', 'Tetapan sekolah & Kongsi pautan',
        `<p><b>Tetapan sekolah:</b> nama sekolah, senarai lokasi, dan tempoh guru/pengawas boleh memadam rekod sendiri.</p>
         <p><b>Kongsi pautan:</b> kod QR untuk dipaparkan di bilik guru, dan dua mesej WhatsApp berasingan: guru & warden (dengan PIN Guru), dan pengawas (dengan PIN Murid). PIN Admin tidak pernah dimasukkan dalam mesej.</p>`, ['tetapan', 'kongsi']) +
      step('9', 'Sistem & kemas kini',
        `<p>Memaparkan versi SiDIA. Apabila versi baharu tersedia, ketik <b>⬆️ Kemas kini</b>. Pautan web app kekal sama dan data tidak diubah.</p>
         <p>Syarat (sekali sahaja, oleh pemilik Google Sheet): hidupkan <b>Google Apps Script API</b> di <code>script.google.com/home/usersettings</code>.</p>
         <p>Senarai murid dan senarai kesalahan diurus melalui Google Sheet › <b>SiDIA › 🚀 Mula di sini</b>.</p>`, 'sistem') +
      SOALAN(`<p><b>Rumah dipaparkan dua kali dalam laporan (cth "WJ" dan "WAJA")?</b> Nama rumah dalam senarai murid tidak seragam. Betulkan dalam tab MURID dengan Find & replace.</p>
              <p><b>Pengguna tidak dapat membuka pautan?</b> Kongsi pautan dari menu Kongsi (tanpa <code>/a/domain/</code>). Pastikan <i>Who has access</i> ditetapkan kepada <b>Anyone</b> jika ada pengguna tanpa akaun sekolah.</p>`)
  }
];

/* ---------------- templat halaman ---------------- */
const CSS = `
@page { size: A4; margin: 14mm 15mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, 'DejaVu Sans', sans-serif; color: #18212b; font-size: 10pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cover { background: linear-gradient(135deg, #0f766e, #0b5a54); color: #fff; border-radius: 6mm; padding: 10mm 11mm 9mm; margin-bottom: 7mm; }
.cover .logo { font-weight: 800; font-size: 13pt; letter-spacing: .02em; opacity: .9; }
.cover h1 { font-size: 26pt; line-height: 1.1; margin: 4mm 0 2mm; letter-spacing: -.02em; }
.cover .sub { font-size: 12pt; opacity: .92; margin: 0 0 6mm; }
.cover .meta { display: flex; gap: 8mm; font-size: 9pt; }
.cover .meta div { background: rgba(255,255,255,.12); border-radius: 3mm; padding: 3mm 4mm; flex: 1; }
.cover .meta b { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; opacity: .8; margin-bottom: 1mm; }
.cover ul { margin: 0; padding-left: 4mm; }
h2 { font-size: 15pt; color: #0b5a54; margin: 7mm 0 1mm; padding-bottom: 1.5mm; border-bottom: 1.5pt solid #d6ebe8; break-after: avoid; }
p.lead { color: #4b5864; margin: 1mm 0 4mm; }
.step { display: grid; grid-template-columns: 1fr 50mm; gap: 7mm; margin: 4mm 0 6mm; break-inside: avoid; align-items: start; }
.step.nogambar { grid-template-columns: 1fr; }
.step.wide { display: block; }
.sh { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
.sh .n { flex: 0 0 auto; min-width: 8mm; height: 8mm; padding: 0 2mm; border-radius: 4mm; background: #0f766e; color: #fff; font-weight: 700; display: grid; place-items: center; font-size: 10pt; }
.sh h3 { margin: 0; font-size: 12pt; }
.tx p { margin: 0 0 2.2mm; } .tx ul, .tx ol, .step.wide ul { margin: 0 0 2.5mm; padding-left: 5mm; } li { margin: .6mm 0; }
.shot { display: flex; flex-direction: column; gap: 3mm; }
.shot img { width: 50mm; border-radius: 5mm; border: .6mm solid #1b1b1b; box-shadow: 0 1mm 3mm rgba(0,0,0,.15); }
.wideimg { width: 118mm; display: block; margin-left: auto; margin-right: auto; border-radius: 3mm; border: .3mm solid #dde2e7; box-shadow: 0 1mm 3mm rgba(0,0,0,.08); margin-top: 2mm; }
.tip, .warn { border-radius: 2.5mm; padding: 2.5mm 3.5mm; margin: 2.5mm 0; font-size: 9.3pt; }
.tip { background: #e3f3f1; border-left: 1mm solid #0f766e; } .tip b { color: #0b5a54; }
.warn { background: #fff4e5; border-left: 1mm solid #d97706; } .warn b { color: #9a4a07; }
.tip b, .warn b { margin-right: 1mm; }
code { background: #eef2f4; border-radius: 1mm; padding: .2mm 1.2mm; font-family: 'JetBrains Mono', monospace; font-size: 8.8pt; }
.k { display: inline-block; border: .3mm solid #b8c1ca; border-radius: 1mm; padding: 0 1.2mm; font-size: 9pt; }
.sev { border-radius: 1mm; padding: 0 1.5mm; font-weight: 700; font-size: 8.8pt; }
.sev.r { background: #e3f5e8; color: #146c36; } .sev.s { background: #fff0d4; color: #8a4b00; } .sev.b { background: #fde3df; color: #b42318; }
table.mini { border-collapse: collapse; margin: 1mm 0 3mm; font-size: 9pt; } table.mini td, table.mini th { border-bottom: .3mm solid #dde2e7; padding: 1mm 3mm 1mm 0; text-align: left; } table.mini th { color: #5f6b78; font-size: 8pt; text-transform: uppercase; }
.faq p { margin: 0 0 3mm; break-inside: avoid; }
.amanah { border: .5mm solid #0f766e; border-radius: 4mm; padding: 4mm 6mm; margin-bottom: 4mm; background: #f4faf9; }
.amanah h3 { margin: 0 0 2mm; color: #0b5a54; font-size: 12pt; } .amanah ul { margin: 0; padding-left: 5mm; }
`;

function html(g) {
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Panduan SiDIA: ${g.peranan}</title><style>${CSS}</style></head><body>
  <div class="cover"><div class="logo">✓ SiDIA · Sistem Rekod Disiplin Murid</div>
  <h1>Panduan ${g.peranan}</h1><p class="sub">${g.subtajuk}</p>
  <div class="meta"><div><b>Untuk</b>${g.untuk}</div><div><b>Anda perlukan</b><ul>${g.perlu.map(x => `<li>${x}</li>`).join('')}</ul></div></div></div>
  ${g.isi()}
  </body></html>`;
}

(async () => {
  console.log('Mengambil tangkapan skrin…');
  await tangkap();
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  for (const g of PANDUAN) {
    await p.setContent(html(g), { waitUntil: 'load' });
    await p.pdf({
      path: path.join(OUT, g.fail), format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-family:Inter,sans-serif;font-size:7.5pt;color:#7a8692;padding:0 15mm;display:flex;justify-content:space-between">
        <span>SiDIA ${VERSI} · Panduan ${g.peranan}</span><span>Halaman <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '14mm', bottom: '16mm', left: '15mm', right: '15mm' }
    });
    console.log('✓ docs/panduan/' + g.fail);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
