# SiDIA — Sistem Rekod Disiplin Murid

Sistem rekod disiplin murid sekolah berasaskan Google Sheet + Google Apps Script. Direka untuk merekod kesalahan **ramai murid serentak** (cth tidak hadir solat berjemaah) dengan pantas oleh warden, guru dan pengawas, serta menjana **laporan mata demerit mengikut rumah**.

## Ciri utama
- Carian pantas ~800+ murid (taip + Enter, ejaan Mohd/Muhammad, Nor/Nur dianggap sama)
- Pilih ikut kelas/dorm, atau tampal senarai nama dari WhatsApp/Excel
- Simpan ratusan rekod sekali tekan; rekod berganda dihalang
- Laporan mata rumah, kelas, kesalahan, murid + eksport CSV
- PIN berbeza untuk Guru/Warden, Murid (Pengawas) dan Admin; admin boleh menukar PIN dari telefon
- Menu Admin di telefon: laporan, PIN, tetapan sekolah, kongsi pautan (QR & WhatsApp), kemas kini
- Panduan pengguna PDF untuk guru, warden, pengawas dan admin
- Boleh digunakan oleh mana-mana sekolah (salin templat)

🌐 **Halaman pengenalan: https://g-03355699-tech.github.io/sidia/**

---

## Cara mula (untuk sekolah)
1. Buka halaman pengenalan dan klik **Buat salinan SiDIA**. Google Sheet SiDIA akan disalin ke Drive anda.
2. Dalam Google Sheet itu, klik menu **SiDIA › 🚀 Mula di sini**. Wizard akan membantu anda:
   - isi nama sekolah dan tiga PIN (Guru & Warden, Murid/Pengawas, Admin)
   - muat naik senarai murid (Excel/CSV/ODS; satu fail, satu tab setiap kelas, atau satu fail setiap kelas)
   - semak senarai kesalahan & mata demerit
   - aktifkan web app (**Deploy › New deployment › Web app**, sekali sahaja), kemudian dapatkan pautan + kod QR untuk dikongsi
3. Kongsi pautan kepada guru, warden dan pengawas. Di telefon: *Add to Home Screen*.

Kali pertama, Google akan meminta kebenaran. Jika keluar amaran *"Google hasn't verified this app"*, klik **Advanced › Go to SiDIA**. Skrip itu berjalan dalam akaun anda sendiri.

### Ralat "Sorry, unable to open the file at present"
Pelayar log masuk dengan lebih daripada satu akaun Google. Buang `/a/<domain>` daripada pautan web app (`https://script.google.com/macros/s/…/exec`), buka dalam Incognito, atau tukar **Who has access** kepada **Anyone** dan gunakan kod akses.

## Fail
| Fail | Fungsi |
|---|---|
| `Code.gs` | Kod pelayan (baca murid, simpan rekod, laporan, wizard) |
| `Index.html` | Web app untuk merekod (telefon & komputer) |
| `Setup.html` | Wizard persediaan dalam Google Sheet |
| `appsscript.json` | Tetapan projek (zon waktu, kebenaran) |
| `version.json` | Maklumat keluaran terkini untuk kemas kini satu klik |
| `CHANGELOG.md` | Senarai perubahan setiap versi |
| `panduan/` | Penjana panduan PDF (`node panduan/jana.js` → `docs/panduan/*.pdf`) |
| `tests/` | Ujian tempatan (simulasi Apps Script + Playwright): `cd tests && npm install && npm test` |
| `CLAUDE.md` | Panduan projek untuk pembantu AI (Claude Code) |
| `docs/` | Halaman pengenalan (GitHub Pages) |

## Pemasangan manual (tanpa templat)
1. Cipta Google Sheet baharu › **Extensions › Apps Script**.
2. Tampal `Code.gs`. Tambah fail HTML `Index` dan `Setup`, kemudian tampal isinya.
3. **Project Settings ⚙ › tandakan "Show appsscript.json manifest file in editor"**, kemudian tampal isi `appsscript.json`. Fail ini wajib untuk kemas kini satu klik.
4. Simpan, muat semula Google Sheet, kemudian klik **SiDIA › 🚀 Mula di sini**.

## Kemas kini ke versi baharu (untuk sekolah)
SiDIA boleh mengemas kini dirinya sendiri. Pautan web app kekal sama, dan data murid serta rekod tidak diubah.

**Sekali sahaja:** buka https://script.google.com/home/usersettings dan hidupkan **Google Apps Script API** (ON).

**Setiap kali ada versi baharu:**
1. Dalam Google Sheet SiDIA, klik **SiDIA › ⬆️ Semak kemas kini SiDIA…** Wizard (**🚀 Mula di sini**) juga memaparkan notis apabila versi baharu tersedia.
2. Baca senarai perubahan, kemudian klik **Yes**.
3. Muat semula Google Sheet. Jika Google meminta kebenaran baharu, klik **Continue › Allow**.

Proses ini:
- memuat turun kod keluaran terkini dari GitHub
- menggantikan fail `Code`, `Index`, `Setup` dan `appsscript` (fail lain milik sekolah dikekalkan)
- mencipta versi baharu dan mengemas kini deployment web app sedia ada, dengan tetapan akses (*Who has access*) dikekalkan

**Jika suis Apps Script API disekat oleh pentadbir domain:** kemas kini secara manual. Tampal semula `Code.gs`, `Index.html`, `Setup.html` dan `appsscript.json` daripada repo ini (cawangan `main`), kemudian **Deploy › Manage deployments › ✎ Edit › Version: New version › Deploy**.

> **Kali pertama sahaja:** sekolah yang memasang SiDIA sebelum versi 1.1.0 perlu menampal keempat-empat fail secara manual sekali (termasuk `appsscript.json`). Selepas itu, kemas kini satu klik boleh digunakan.

## Untuk penyelenggara: menerbitkan versi baharu
1. Buat perubahan kod dan uji.
2. Naikkan nombor versi di **dua** tempat:
   - `Code.gs` → `var SIDIA_VERSION = 'X.Y.Z';`
   - `version.json` → `version`, `ref` (`vX.Y.Z`), `tarikh` dan `nota` (senarai perubahan ringkas yang dipaparkan kepada sekolah)
3. Tambah catatan dalam `CHANGELOG.md`.
4. Commit dan push kod keluaran ke `main`. Kemudian isikan **SHA commit** itu (atau nama tag, cth `vX.Y.Z`) dalam `ref` di `version.json`, commit dan push sekali lagi. `ref` menentukan versi kod yang dimuat turun oleh sekolah.
5. Kemas kini Google Sheet templat menggunakan menu **⬆️ Semak kemas kini** supaya salinan baharu mendapat versi terkini.

Sekolah hanya menerima kod daripada **`ref`** (commit/tag) yang dinyatakan dalam `version.json`. Perubahan di cawangan `main` yang belum diterbitkan tidak sampai kepada sekolah. Kemas kini juga dibatalkan jika versi dalam `Code.gs` pada tag itu tidak sepadan dengan `version.json`.

## Untuk penyelenggara: menyediakan templat "Buat salinan"
1. Pasang SiDIA secara manual dalam Google Sheet baharu bernama **SiDIA (Templat)**. Buka wizard sekali supaya semua tab dicipta, kemudian tutup tanpa mengisi apa-apa. Padam tab kosong *Sheet1* jika ada.
2. **Share › General access › Anyone with the link › Viewer**.
3. Salin ID fail (bahagian antara `/d/` dan `/edit` dalam URL) dan isikan dalam `TEMPLATE_ID` di `docs/index.html`.
4. Uji pautan `https://docs.google.com/spreadsheets/d/<ID>/copy` dalam tetingkap Incognito.
   Jika akaun DELIMa anda tidak dibenarkan berkongsi di luar domain, simpan templat dalam akaun Gmail peribadi.

## Cara merekod ramai murid dengan pantas (cth: tidak turun solat)
1. Pilih kesalahan (cth *Lewat ke surau/masjid*). Pilihan ini kekal untuk rekod seterusnya.
2. Pilih murid menggunakan salah satu cara:
   - **Taip + Enter**: taip `hafiz 4a` dan tekan Enter untuk memilih murid teratas. Kotak carian dikosongkan supaya anda boleh terus taip nama seterusnya. Ejaan *Mohd/Muhd/Muhammad* dan *Nor/Noor/Nur* dianggap sama.
   - **Ikut kelas / dorm**: pilih kelas, tekan **Pilih semua**, kemudian buang tanda murid yang hadir.
   - **Tampal senarai**: tampal senarai nama daripada WhatsApp atau Excel. Sistem memadankan nama secara automatik dan meminta anda memilih jika ada nama yang sama.
3. Tekan **Simpan** dan sahkan. Ratusan murid boleh disimpan dalam satu klik.
- Jika murid yang sama sudah direkod untuk kesalahan yang sama pada tarikh yang sama (cth dua pengawas merekod serentak), rekod itu **tidak** disimpan dua kali.
- Pilihan yang belum disimpan kekal walaupun telefon tertutup atau internet terputus.
- Rekod yang tersilap boleh dibatalkan serta-merta, atau dipadam di tab **Terkini** dalam tempoh 24 jam.

## Senarai kesalahan
SiDIA disertakan dengan **137 kesalahan standard** (Ringan / Sederhana / Berat), sama dengan senarai salah laku Infomurid. Untuk kehadiran surau gunakan *R28 Lewat ke surau/masjid*, atau tambah kod sekolah sendiri dalam tab KESALAHAN (kod yang tiada dalam Infomurid tidak akan diimport ke Infomurid).
- Di web app, kesalahan dipilih melalui tab **⭐ Pantas / Ringan / Sederhana / Berat**, atau dicari ikut nama atau kod (cth `rokok`, `R16`). Kesalahan yang kerap digunakan oleh setiap pengguna dipaparkan paling atas.
- **Sunting di web app:** guru, warden, guru disiplin dan admin boleh membuka **🛡️ Admin › Senarai kesalahan** (tanpa PIN Admin) untuk menambah kesalahan, mengubah nama/kategori/mata demerit, menanda ⭐ pilihan pantas, atau menyahaktifkan kesalahan. Pengawas tidak boleh. Kesalahan yang sudah ada rekod tidak boleh dipadam atau ditukar kodnya (nyahaktifkan sahaja), supaya laporan lama kekal.
- Tandakan lajur **Pantas** dalam tab KESALAHAN (atau ⭐ dalam wizard) untuk kesalahan yang selalu direkod.
- Sekolah yang mempunyai senarai sendiri boleh **tampal terus dari Excel** dalam wizard (langkah 3). Lajur Kod/Code, Kesalahan/Description, Kategori/Category (1/2/3) dan Mata/Demerit dikenal pasti secara automatik.
- Menu **SiDIA › Guna senarai kesalahan standard SiDIA** menggantikan tab KESALAHAN dengan senarai standard. Rekod lama tidak terjejas.

## Laporan & markah rumah
Buka tab **🛡️ Admin › Laporan** (perlukan PIN Admin) dan pilih tempoh. Paparan menunjukkan:
- Jumlah kes dan **mata demerit mengikut rumah**
- Mengikut kesalahan, kelas dan murid (murid yang paling kerap)
- **📄 Laporan PDF rasmi**: header & footer pada setiap halaman (logo, nama sekolah, tempoh, SULIT, nombor halaman), kotak ringkasan, kedudukan rumah dengan carta, tahap kesalahan, kesalahan, kelas, murid paling kerap, ruang tandatangan, dan lampiran rekod penuh (pilihan)
- Eksport **CSV** (dibuka dalam Excel/Sheets) atau **Tulis ke tab LAPORAN** dalam Google Sheet

### Laporan Kesalahan Murid
Cari seorang murid untuk melihat **semua kesalahan yang pernah direkod** (tarikh, masa, kod, kesalahan, mata, pelapor, lokasi, catatan), jumlah kes dan mata demerit, kemudian muat turun **PDF** (dengan ringkasan dan ruang tandatangan) atau **CSV**. Boleh digunakan oleh **semua pengguna**: di **🛡️ Admin › Laporan**, dan di tab **Terkini** (untuk guru, warden dan pengawas).

### Jumlah rekod di sebelah nama murid
Semasa merekod, guru, warden dan admin melihat jumlah rekod kesalahan setiap murid di sebelah nama (cth **FADLINA QISTINA BINTI FADLY AZLINE `5`**; merah jika 5 atau lebih). Jumlah dikira terus daripada tab REKOD semasa web app dibuka, jadi tiada lajur tambahan diperlukan dalam tab MURID dan jumlahnya sentiasa tepat. Pengawas tidak melihat jumlah ini.

Jumlah mata ditolak bagi setiap rumah = jumlah lajur *Mata* dalam tab KESALAHAN. Ubah nilai mata dalam tab itu mengikut dasar sekolah.

## PIN & peranan
| Peranan | PIN | Boleh |
|---|---|---|
| Guru, Warden, Guru Disiplin | **PIN Guru & Warden** (`KOD_GURU`) | Rekod, lihat semua rekod terkini, padam rekod sendiri, **sunting senarai kesalahan** |
| Pengawas / murid bertugas | **PIN Murid** (`KOD_MURID`) | Rekod, lihat & padam **rekod sendiri** sahaja. Tiada menu Admin |
| Admin | **PIN Admin** (`KOD_ADMIN`) | Semua, termasuk menu **🛡️ Admin**: laporan, tukar PIN, tetapan sekolah, senarai kesalahan, kongsi pautan, kemas kini |

- PIN ialah 4–8 digit, dan setiap peranan mesti mempunyai PIN berbeza. Guru boleh membuka menu Admin dengan memasukkan PIN Admin.
- **Tukar PIN:** admin buka **🛡️ Admin › PIN akses** di telefon. Pengguna kumpulan itu perlu log masuk semula dengan PIN baharu.
- **Mod senarai emel (pilihan):** isi tab PENGGUNA (Emel, Nama, Peranan). Hanya emel dalam senarai boleh masuk, dan PIN Guru/Murid tidak digunakan.
- Sekolah yang menggunakan `KOD_AKSES` (sebelum v1.2) tidak terjejas: kod itu kekal sah sehingga admin menetapkan PIN baharu.

## Import ke Infomurid
Extension Chrome dalam folder [`infomurid-extension/`](infomurid-extension/) membolehkan guru disiplin mengimport rekod tab REKOD ke **Infomurid › Kemaskini salah laku** secara pukal. Muat turun [`sidia-infomurid.zip`](https://g-03355699-tech.github.io/sidia/sidia-infomurid.zip) dan ikut [arahan pemasangan](infomurid-extension/README.md).

## Panduan pengguna (PDF)
- [Panduan Guru](https://github.com/g-03355699-tech/sidia/raw/main/docs/panduan/Panduan-SiDIA-Guru.pdf)
- [Panduan Warden](https://github.com/g-03355699-tech/sidia/raw/main/docs/panduan/Panduan-SiDIA-Warden.pdf)
- [Panduan Murid (Pengawas)](https://github.com/g-03355699-tech/sidia/raw/main/docs/panduan/Panduan-SiDIA-Pengawas.pdf)
- [Panduan Admin](https://github.com/g-03355699-tech/sidia/raw/main/docs/panduan/Panduan-SiDIA-Admin.pdf)

Panduan dijana daripada web app sebenar. Selepas paparan berubah, jana semula dengan `node panduan/jana.js` (perlu `cd tests && npm install` sekali).

## Privasi
Setiap sekolah menyimpan data dalam salinan Google Sheet sendiri, dalam Google Drive sekolah masing-masing. Pembangun SiDIA tidak boleh mengakses data mana-mana sekolah.
