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
| `tests/` | Ujian tempatan: simulasi Apps Script + Playwright |

### Tab Google Sheet
`MULA`, `TETAPAN` (kunci/nilai), `MURID` (ID, Nama, Kelas, Rumah), `KESALAHAN` (Kod, Kesalahan, Kategori, Mata, Aktif, Pantas), `PENGGUNA` (pilihan: senarai emel), `REKOD`, `LAPORAN`.
- **Susunan lajur `REKOD` adalah tetap** (`REKOD_HEADERS` / indeks `R`). Jangan ubah susunannya; lajur baharu hanya boleh ditambah di hujung.
- `readStudents_()` mengesan lajur MURID melalui tajuk (Nama/Kelas/Rumah/No. MyKid…), jadi sekolah boleh menggunakan format sendiri.
- Kategori kesalahan: `Ringan` / `Sederhana` / `Berat` (1/2/3 juga diterima). Kod mesti unik.
- `ensureSetup_()` mesti selamat dijalankan berulang kali. `migrateIfNeeded_()` menjalankannya sekali bagi setiap versi baharu (tetapan `VERSI_DIPASANG`).

## Konvensyen kod
- Gaya ES5 (`var`, `function`) dalam `Code.gs` dan skrip klien, untuk konsisten dan selamat di pelayar lama.
- Fungsi peribadi pelayan berakhir dengan `_` (tidak boleh dipanggil dari klien). Fungsi yang dipanggil melalui `google.script.run` tidak mempunyai `_`.
- Pengesahan: setiap fungsi web app memanggil `auth_(ctx)` (kod akses / senarai PENGGUNA / kod admin).
- Pustaka luar hanya dari cdnjs, dengan versi tetap: `xlsx@0.18.5` dan `qrcodejs@1.0.0` (dalam `Setup.html`).
- Tulisan ke Sheet guna `LockService` + `setValues` pukal.

## Perkara yang pernah menyebabkan pepijat (jangan ulang)
- **No. KP sebagai nombor**: Excel/Sheets memaparkan `1.30927E+11`. Baca nilai mentah (`raw: true` di SheetJS, `getValues()` di pelayan). Pulihkan sifar depan bagi 11 digit. Tulis lajur ID dengan format teks (`setNumberFormat('@')`).
- **iPhone Safari**: `input[type=date|time]` melimpah keluar kotak. Perlukan `-webkit-appearance:none; min-width:0`.
- **Papan kekunci telefon**: mod taip (`body.kb`) menggulir kotak carian ke atas. Bar Simpan disorok hanya apabila `visualViewport` benar-benar mengecil (`body.kbopen`), **bukan** berdasarkan fokus, kerana iOS boleh menutup papan kekunci tanpa `blur`.
- **`ScriptApp.getService().getUrl()` tidak boleh dipercayai** jika ada beberapa deployment. Pautan yang disimpan/ditampal pengguna (`WEB_APP_URL`) diutamakan.
- **Pautan `/a/<domain>/macros/…`** gagal ("Sorry, unable to open the file") jika pelayar log masuk dengan beberapa akaun. Kongsikan pautan `/macros/s/…/exec`.
- Tajuk fail Excel seperti "SENARAI NAMA MURID…" bukan baris tajuk lajur. Pengesanan baris tajuk memerlukan ≥2 sel dan memilih baris yang paling banyak lajur dikenali.

## Ujian
Tiada clasp dan tiada akses Google sebenar dalam sesi awan. Gunakan simulasi:
```bash
cd tests && npm install && node build.js && node smoke.js
```
- `tests/mock-gas.js`: SpreadsheetApp/Session/LockService/ScriptApp/UrlFetchApp dalam memori, dan `google.script.run` yang memanggil fungsi `Code.gs` terus.
- `tests/build.js`: menjana `tests/out/app.html` (800 murid rawak, kod akses `1234`, kod admin `9999`), `tests/out/setup.html` dan `tests/out/murid.xlsx`.
- `tests/smoke.js`: ujian hujung-ke-hujung dengan Chromium (Playwright sudah dipasang, jangan pasang semula). Untuk paparan telefon, guna `devices['iPhone 13']`. WebKit tidak tersedia, jadi kelakuan khusus Safari tidak dapat diuji.
- cdnjs disekat dalam sesi awan; `build.js` mengambil pustaka yang sama dari npm.
- Selepas mengubah UI, ambil tangkapan skrin dan semak secara visual. Kemas kini `docs/img/` jika paparan berubah ketara.

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
