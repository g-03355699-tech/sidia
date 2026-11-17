# SiDIA — Sistem Rekod Disiplin Murid

Sistem rekod disiplin murid sekolah berasaskan Google Sheet + Google Apps Script. Direka untuk merekod kesalahan **ramai murid serentak** (cth tidak hadir solat berjemaah) dengan pantas oleh warden, guru dan pengawas, serta menjana **laporan mata demerit mengikut rumah**.

## Ciri utama
- Carian pantas ~800+ murid (taip + Enter, ejaan Mohd/Muhammad, Nor/Nur dianggap sama)
- Pilih ikut kelas/dorm, atau tampal senarai nama dari WhatsApp/Excel
- Simpan ratusan rekod sekali tekan; rekod berganda dihalang
- Laporan mata rumah, kelas, kesalahan, murid + eksport CSV
- Mod kod akses atau senarai emel DELIMa
- Boleh digunakan oleh mana-mana sekolah (salin templat)

🌐 **Halaman pengenalan: https://g-03355699-tech.github.io/sidia/**

---

## Cara mula (untuk sekolah)
1. Buka halaman pengenalan dan klik **Buat salinan SiDIA**. Google Sheet SiDIA akan disalin ke Drive anda.
2. Dalam Google Sheet itu, klik menu **SiDIA › 🚀 Mula di sini**. Wizard akan membantu anda:
   - isi nama sekolah, kod akses dan kod admin
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
| `appsscript.json` | Tetapan projek (zon waktu Malaysia) |
| `docs/` | Halaman pengenalan (GitHub Pages) |

## Pemasangan manual (tanpa templat)
1. Cipta Google Sheet baharu › **Extensions › Apps Script**.
2. Tampal `Code.gs`. Tambah fail HTML `Index` dan `Setup`, kemudian tampal isinya. (Pilihan) tampal `appsscript.json`.
3. Simpan, muat semula Google Sheet, kemudian klik **SiDIA › 🚀 Mula di sini**.

> Selepas mengubah kod, gunakan **Deploy › Manage deployments › ✎ Edit › Version: New version** supaya pautan kekal sama.

## Untuk penyelenggara: menyediakan templat "Buat salinan"
1. Pasang SiDIA secara manual dalam Google Sheet baharu bernama **SiDIA (Templat)**. Buka wizard sekali supaya semua tab dicipta, kemudian tutup tanpa mengisi apa-apa. Padam tab kosong *Sheet1* jika ada.
2. **Share › General access › Anyone with the link › Viewer**.
3. Salin ID fail (bahagian antara `/d/` dan `/edit` dalam URL) dan isikan dalam `TEMPLATE_ID` di `docs/index.html`.
4. Uji pautan `https://docs.google.com/spreadsheets/d/<ID>/copy` dalam tetingkap Incognito.
   Jika akaun DELIMa anda tidak dibenarkan berkongsi di luar domain, simpan templat dalam akaun Gmail peribadi.

## Cara merekod ramai murid dengan pantas (cth: tidak turun solat)
1. Pilih kesalahan (cth *Tidak hadir solat Subuh berjemaah*). Pilihan ini kekal untuk rekod seterusnya.
2. Pilih murid menggunakan salah satu cara:
   - **Taip + Enter**: taip `hafiz 4a` dan tekan Enter untuk memilih murid teratas. Kotak carian dikosongkan supaya anda boleh terus taip nama seterusnya. Ejaan *Mohd/Muhd/Muhammad* dan *Nor/Noor/Nur* dianggap sama.
   - **Ikut kelas / dorm**: pilih kelas, tekan **Pilih semua**, kemudian buang tanda murid yang hadir.
   - **Tampal senarai**: tampal senarai nama daripada WhatsApp atau Excel. Sistem memadankan nama secara automatik dan meminta anda memilih jika ada nama yang sama.
3. Tekan **Simpan** dan sahkan. Ratusan murid boleh disimpan dalam satu klik.
- Jika murid yang sama sudah direkod untuk kesalahan yang sama pada tarikh yang sama (cth dua pengawas merekod serentak), rekod itu **tidak** disimpan dua kali.
- Pilihan yang belum disimpan kekal walaupun telefon tertutup atau internet terputus.
- Rekod yang tersilap boleh dibatalkan serta-merta, atau dipadam di tab **Terkini** dalam tempoh 24 jam.

## Senarai kesalahan
SiDIA disertakan dengan **142 kesalahan standard** (Ringan / Sederhana / Berat), termasuk 5 kesalahan tidak hadir solat berjemaah (W01–W05).
- Di web app, kesalahan dipilih melalui tab **⭐ Pantas / Ringan / Sederhana / Berat**, atau dicari ikut nama atau kod (cth `rokok`, `R16`). Kesalahan yang kerap digunakan oleh setiap pengguna dipaparkan paling atas.
- Tandakan lajur **Pantas** dalam tab KESALAHAN (atau ⭐ dalam wizard) untuk kesalahan yang selalu direkod.
- Sekolah yang mempunyai senarai sendiri boleh **tampal terus dari Excel** dalam wizard (langkah 3). Lajur Kod/Code, Kesalahan/Description, Kategori/Category (1/2/3) dan Mata/Demerit dikenal pasti secara automatik.
- Menu **SiDIA › Guna senarai kesalahan standard SiDIA** menggantikan tab KESALAHAN dengan senarai standard. Rekod lama tidak terjejas.

## Laporan & markah rumah
Buka tab **Laporan** (perlukan kod admin) dan pilih tempoh. Paparan menunjukkan:
- Jumlah kes dan **mata demerit mengikut rumah**
- Mengikut kesalahan, kelas dan murid (murid yang paling kerap)
- Eksport **CSV** (dibuka dalam Excel/Sheets) atau **Tulis ke tab LAPORAN** dalam Google Sheet

Jumlah mata ditolak bagi setiap rumah = jumlah lajur *Mata* dalam tab KESALAHAN. Ubah nilai mata dalam tab itu mengikut dasar sekolah.

## Dua mod keselamatan
- **Mod mudah** (tab PENGGUNA kosong): sesiapa yang mempunyai pautan dan `KOD_AKSES` boleh merekod. Pengguna mengisi nama dan peranan sekali sahaja.
- **Mod senarai emel**: isi tab PENGGUNA (Emel, Nama, Peranan). Hanya emel dalam senarai boleh masuk, dan peranan *Admin / Guru Disiplin* boleh melihat laporan.

## Privasi
Setiap sekolah menyimpan data dalam salinan Google Sheet sendiri, dalam Google Drive sekolah masing-masing. Pembangun SiDIA tidak boleh mengakses data mana-mana sekolah.
