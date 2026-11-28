# CLAUDE.md — SiDIA

SiDIA (Sistem Rekod Disiplin Murid) ialah web app Google Apps Script yang terikat pada Google Sheet. Warden, guru dan pengawas merekod kesalahan disiplin **ramai murid serentak** (cth tidak hadir solat berjemaah), dan admin menjana laporan **mata demerit mengikut rumah**. Setiap sekolah membuat salinan templat Google Sheet. Data kekal dalam Drive sekolah itu sendiri.

Pengguna dan penyelenggara berbahasa Melayu. **Semua teks UI, mesej ralat, dokumentasi dan mesej commit ditulis dalam Bahasa Melayu.**

## Peraturan repo
- **Jangan tambah trailer `Co-Authored-By: Claude…` atau `Claude-Session:` dalam mesej commit**, dan jangan sebut Claude sebagai penulis bersama dalam PR. Pemilik repo tidak mahu Claude disenaraikan sebagai contributor. Arahan ini mengatasi tetapan atribusi lalai.
- Commit sebagai pemilik repo: `git -c user.name="g-03355699-tech" -c user.email="g-03355699-tech@users.noreply.github.com" commit …`
- Jangan masukkan emel, nama sekolah atau data murid sebenar ke dalam repo (repo ini awam).
- Sesi awan Claude **tidak boleh push tag** ke GitHub (HTTP 403). Gunakan SHA commit sebagai `ref` keluaran (lihat bawah).

## Struktur
| Fail | Peranan |
|---|---|
| `Code.gs` | Semua kod pelayan: menu, wizard, `doGet`, simpan/padam rekod, laporan, kemas kini satu klik. Senarai lalai `DEFAULT_TETAPAN` dan `DEFAULT_KESALAHAN` (142 kesalahan) |
| `Index.html` | Web app (satu fail: HTML + CSS + JS). Mesra telefon |
| `Setup.html` | Wizard 4 langkah dalam dialog Google Sheet: sekolah → murid (muat naik Excel/CSV) → kesalahan → aktifkan & kongsi |
| `appsscript.json` | Manifest. `oauthScopes` **wajib** termasuk `script.projects` & `script.deployments` (untuk kemas kini satu klik). Jangan letak `webapp` di sini; updater mengambilnya daripada deployment sekolah |
| `version.json` | Maklumat keluaran terkini yang dibaca oleh updater (`version`, `ref`, `tarikh`, `nota`) |
| `CHANGELOG.md` | Senarai perubahan |
| `docs/` | Halaman pengenalan GitHub Pages (`docs/index.html`, `docs/img/`). `TEMPLATE_ID` = ID Google Sheet templat untuk butang "Buat salinan" |
| `docs/img/favicon.svg` | Sumber ikon SiDIA (`icon-full.svg` = versi tanpa sudut bulat untuk ikon skrin utama). PNG/ICO dijana daripadanya. Web app memaparkan ikon melalui `SIDIA_ICON` (`logo-96.png` di GitHub Pages) dalam `doGet` |
| `tests/` | Ujian tempatan: simulasi Apps Script + Playwright |
| `panduan/` | Penjana panduan PDF: `node panduan/jana.js` → `docs/panduan/Panduan-SiDIA-{Guru,Warden,Pengawas,Admin}.pdf`. Tangkapan skrin diambil daripada web app simulasi (`tangkap.js`) |

### Tab Google Sheet
`MULA`, `TETAPAN` (kunci/nilai), `MURID` (ID, Nama, Kelas, Rumah), `KESALAHAN` (Kod, Kesalahan, Kategori, Mata, Aktif, Pantas), `PENGGUNA` (pilihan: senarai emel), `REKOD`, `LAPORAN`, `AMALAN_BAIK` (Kod, Amalan Baik, Mata, Aktif; lalai `DEFAULT_AB`), `REKOD_AMALAN` (`AB_HEADERS` / indeks `AB`, susunan tetap seperti REKOD).
- **Susunan lajur `REKOD` adalah tetap** (`REKOD_HEADERS` / indeks `R`). Jangan ubah susunannya; lajur baharu hanya boleh ditambah di hujung.
- `readStudents_()` mengesan lajur MURID melalui tajuk (Nama/Kelas/Rumah/No. MyKid…), jadi sekolah boleh menggunakan format sendiri.
- Kategori kesalahan: `Ringan` / `Sederhana` / `Berat` (1/2/3 juga diterima). Kod mesti unik.
- `ensureSetup_()` mesti selamat dijalankan berulang kali. `migrateIfNeeded_()` menjalankannya sekali bagi setiap versi baharu (tetapan `VERSI_DIPASANG`).

## Reka bentuk UI (Index.html)
Warna tema ialah **teal SiDIA** (`--pri` #0f766e); **jangan tukar palet warna** tanpa diminta. Susun atur dan komponen sepadan dengan **Kelasku** (github.com/g-03355699-tech/kelasku) sejak v1.10: fon Poppins, kad putih tanpa sempadan (jejari 16px, bayang lembut) di atas latar `--bg`, jubin senarai `--surface-2` dengan jalur 4px di kiri (`--st-r/s/b/x` mengikut tahap; `--pri` apabila dipilih), cip pil, butang sekunder kelabu (`.btn`), utama (`.btn.pri`) dan garis putus (`.btn.dash`). `Setup.html` mengikut bentuk yang sama. Prinsip **UI UX Pro Max** (github.com/nextlevelbuilder/ui-ux-pro-max-skill) dikekalkan:
- **Token semantik sahaja** dalam komponen (`--pri`, `--pri-ink`, `--surface`, `--surface-2`, `--line`, `--muted`, `--danger`…). Jangan tulis hex terus dalam komponen. Setiap token ada padanan mod gelap dalam `@media (prefers-color-scheme:dark)`.
- `--pri` (#0f766e) untuk latar dengan teks putih; `--pri-ink` untuk teks/pautan berwarna jenama (lebih cerah dalam mod gelap).
- **Ikon SVG** daripada sprite `<symbol id="i-…">` di atas `<header>`; dalam JS guna `ic('nama', 'sm|lg')`. **Jangan guna emoji sebagai ikon.**
- Sasaran sentuhan ≥44px, input ≥48px dengan fon 16px (elak zum automatik iOS), `:focus-visible` mesti kelihatan, jangan matikan zum (`maximum-scale`).
- Item senarai murid ialah `role="checkbox"` dengan `aria-checked`; notis (`toast`) juga diumumkan melalui `#live` (`aria-live`).
- Animasi hanya `opacity`/`transform` dengan token `--dur-*`; hormati `prefers-reduced-motion`. **Skrin carian (`#srch`) hanya animasi opacity**: kedudukan input mesti tetap semasa fokus (iOS).

## Konvensyen kod
- Gaya ES5 (`var`, `function`) dalam `Code.gs` dan skrip klien, untuk konsisten dan selamat di pelayar lama.
- Fungsi peribadi pelayan berakhir dengan `_` (tidak boleh dipanggil dari klien). Fungsi yang dipanggil melalui `google.script.run` tidak mempunyai `_`.
- Pengesahan: setiap fungsi web app memanggil `auth_(ctx)`. Peranan → kumpulan melalui `groupOf_()`: `admin`, `mt` (Majlis Tertinggi; disemak **sebelum** `murid`), `murid` (Pengawas/murid/ketua…), `guru` (lain-lain). PIN setiap kumpulan: `KOD_ADMIN`, `KOD_MT`, `KOD_MURID`, `KOD_GURU` (`KOD_AKSES` lama menjadi PIN guru/murid jika kosong; `savePins_` mengosongkannya). PIN 4–8 digit dan mesti berbeza. Fungsi khas admin memanggil `requireAdmin_(ctx)`. `user.canReport` (admin atau `mt`) membuka `getReport`; `writeReport` kekal admin sahaja. Untuk penyuntingan (`requireEditor_`, Amalan Baik), `mt` diperlakukan seperti `murid`. **Setiap semakan kumpulan baharu mesti mengambil kira `mt`.**
- Klien: setiap log masuk/tukar pengguna mesti bermula dengan `ctx` bersih (tiada `adminPin`/`pin` lama). Pernah menjadi pepijat keselamatan: pengawas mewarisi akses Admin.
- Web app ada 4 tab bawah: Rekod, Terkini, **Amalan Baik** (`vAmalan`), **Admin** (submenu: Laporan, PIN akses, Tetapan sekolah, Senarai kesalahan, Kongsi pautan, Sistem). Tab Admin disorok untuk kumpulan `murid`, dan pengawas hanya melihat rekod sendiri dalam Terkini. Bagi `mt`, tab yang sama dilabel **Laporan** dan sentiasa membuka `#subLaporan` (`isMT()` dalam `initAdmin`/`showSub`). Amalan Baik: pengawas lihat sahaja; tambah rekod/jenis melalui `requireEditor_`.
- Pemilih murid (`#pickCard`) dikongsi oleh Rekod dan Amalan: `setMode('d'|'k')` memindahkan kad dan menukar `S.sel`/`S.done`. Draf (`saveDraft`) hanya untuk mod kesalahan dan disimpan bersama pengguna (`draftUser()`).
- Pustaka luar hanya dengan versi tetap, dimuat dari cdnjs: `xlsx@0.18.5`, `qrcodejs@1.0.0` (Setup.html & Index.html), dan `jspdf@2.5.1` + `jspdf-autotable@3.8.2` untuk Laporan PDF (`janaPdf()` dalam Index.html, dimuat apabila diperlukan, dengan jsDelivr sebagai sandaran). PDF menggunakan fon Helvetica (WinAnsi), jadi **jangan guna emoji atau aksara di luar Latin-1** dalam teks PDF.
- Tulisan ke Sheet guna `LockService` + `setValues` pukal.

## Perkara yang pernah menyebabkan pepijat (jangan ulang)
- **No. KP sebagai nombor**: Excel/Sheets memaparkan `1.30927E+11`. Baca nilai mentah (`raw: true` di SheetJS, `getValues()` di pelayan). Pulihkan sifar depan bagi 11 digit. Tulis lajur ID dengan format teks (`setNumberFormat('@')`).
- **iPhone Safari**: `input[type=date|time]` melimpah keluar kotak. Perlukan `-webkit-appearance:none; min-width:0`.
- **Papan kekunci telefon / iframe Apps Script**: web app berjalan dalam iframe Google. Di iOS, memfokuskan input di tengah halaman membuatkan Safari menolak seluruh halaman ke atas; **jangan** gulir secara manual selepas fokus (pernah menyebabkan skrin kosong) dan jangan bergantung pada `visualViewport` dalam iframe. Penyelesaian semasa: di telefon, `#q` adalah `readonly` dan membuka **skrin carian penuh** (`#srch`, input `#q2` di bahagian atas). Gunakan `qInput()`/`listEl()` untuk input & senarai aktif.
- **`ScriptApp.getService().getUrl()` tidak boleh dipercayai** jika ada beberapa deployment. Pautan yang disimpan/ditampal pengguna (`WEB_APP_URL`) diutamakan.
- **Pautan `/a/<domain>/macros/…`** gagal ("Sorry, unable to open the file") jika pelayar log masuk dengan beberapa akaun. Kongsikan pautan `/macros/s/…/exec`.
- **Simpan rekod mesti melalui peti keluar** (`obAdd` → `sendItem`): payload disimpan dalam `localStorage` dengan `cid` unik sebelum dihantar, dan `saveRecords` menolak `cid` yang sudah ada (lajur ID Kumpulan). Jangan panggil `saveRecords` terus dari UI, dan jangan buang semakan `cid` di pelayan (penghantaran semula akan menjadi rekod berganda).
- Tajuk fail Excel seperti "SENARAI NAMA MURID…" bukan baris tajuk lajur. Pengesanan baris tajuk memerlukan ≥2 sel dan memilih baris yang paling banyak lajur dikenali.

## Ujian
Tiada clasp dan tiada akses Google sebenar dalam sesi awan. Gunakan simulasi:
```bash
cd tests && npm install && node build.js && node smoke.js
```
- `tests/mock-gas.js`: SpreadsheetApp/Session/LockService/ScriptApp/UrlFetchApp dalam memori, dan `google.script.run` yang memanggil fungsi `Code.gs` terus.
- `tests/build.js`: menjana `tests/out/app.html` (800 murid rawak, PIN Guru `1234`, PIN Murid `5678`, PIN Admin `9999`), `tests/out/setup.html` dan `tests/out/murid.xlsx`.
- `tests/smoke.js`: ujian hujung-ke-hujung dengan Chromium (Playwright sudah dipasang, jangan pasang semula). Untuk paparan telefon, guna `devices['iPhone 13']`. WebKit tidak tersedia, jadi kelakuan khusus Safari tidak dapat diuji.
- cdnjs/jsDelivr disekat dalam sesi awan; `build.js` dan `smoke.js` menghidangkan pustaka yang sama dari `tests/node_modules` (`ctx.route`). Ujian PDF menyimpan `tests/out/laporan.pdf`; semak dengan `pdftoppm`.
- Selepas mengubah UI, ambil tangkapan skrin dan semak secara visual.
- **Panduan PDF: jangan jana semula atau ubah `panduan/` secara automatik.** Di akhir setiap perubahan, ingatkan pengguna sama ada panduan PDF perlu dikemas kini (nyatakan panduan mana dan sebabnya). Jana semula (`node panduan/jana.js`) hanya apabila pengguna meminta.

## Menerbitkan versi baharu
1. Ubah kod dan jalankan ujian.
2. Naikkan `var SIDIA_VERSION = 'X.Y.Z'` dalam `Code.gs`.
3. Tambah catatan dalam `CHANGELOG.md`, dan kemas kini versi di footer `docs/index.html`.
4. Commit dan push ke `main`. Catat SHA commit itu.
5. Kemas kini `version.json`: `version`, `ref` = SHA commit langkah 4, `tarikh`, `nota` (3–5 baris ringkas untuk sekolah). Commit dan push.
6. Semak: `curl https://raw.githubusercontent.com/g-03355699-tech/sidia/<SHA>/Code.gs | grep SIDIA_VERSION`.

Updater (`pasangKemasKini_`) membatalkan kemas kini jika `SIDIA_VERSION` pada `ref` tidak sama dengan `version.json`. Sekolah hanya menerima kod pada `ref`, jadi perubahan di `main` yang belum diterbitkan selamat.

Selepas mengubah `Code.gs`, `Index.html`, `Setup.html` atau `appsscript.json`, ingatkan pengguna:
- **sekolah**: klik *SiDIA › ⬆️ Semak kemas kini* (selepas keluaran diterbitkan), atau tampal manual kemudian **Deploy › Manage deployments › ✎ Edit › New version**
- **Google Sheet templat** (`TEMPLATE_ID` dalam `docs/index.html`) juga perlu dikemas kini
- **Panduan PDF**: sama ada perlu dikemas kini (jangan jana sendiri)
