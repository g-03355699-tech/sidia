# SiDIA — Sistem Rekod Disiplin Murid

Sistem rekod disiplin murid sekolah berasaskan Google Sheet + Google Apps Script. Direka untuk merekod kesalahan **ramai murid serentak** (cth tidak hadir solat berjemaah) dengan pantas oleh warden, guru dan pengawas, serta menjana **laporan mata demerit mengikut rumah**.

## Ciri utama
- Carian pantas ~800+ murid (taip + Enter, ejaan Mohd/Muhammad, Nor/Nur dianggap sama)
- Pilih ikut kelas/dorm, atau tampal senarai nama dari WhatsApp/Excel
- Simpan ratusan rekod sekali tekan; rekod berganda dihalang
- Laporan mata rumah, kelas, kesalahan, murid + eksport CSV
- Mod kod akses atau senarai emel DELIMa
- Boleh digunakan oleh mana-mana sekolah (salin templat)

---

## Panduan Pemasangan

Sistem rekod disiplin murid berasaskan **Google Sheet + Google Apps Script**. Percuma, tiada pelayan, dan boleh digunakan dengan akaun DELIMa.

## Fail
| Fail | Fungsi |
|---|---|
| `Code.gs` | Kod pelayan (baca murid, simpan rekod, laporan) |
| `Index.html` | Paparan web app (telefon & komputer) |
| `appsscript.json` | Tetapan projek (zon waktu Malaysia) |

## Pemasangan (±10 minit, sekali sahaja)
1. Buka Google Sheet yang mengandungi senarai murid (atau cipta yang baharu).
2. **Extensions › Apps Script**.
3. Padam isi `Code.gs`, tampal isi `Code.gs` daripada folder ini.
4. Klik **＋ › HTML**, namakan `Index`, kemudian tampal isi `Index.html`.
5. (Pilihan) Project Settings › tandakan *Show "appsscript.json"* dan tampal isinya.
6. Simpan, kembali ke Sheet, dan muat semula. Menu **SiDIA** akan muncul.
7. Pilih **SiDIA › 1. Sediakan sistem** dan benarkan akses (Allow). Tab TETAPAN, KESALAHAN, PENGGUNA, REKOD dan MURID akan dicipta.
8. Isi tab **TETAPAN**: nama sekolah, `KOD_AKSES` (cth 4821) dan `KOD_ADMIN`.
9. Tampal senarai murid ke tab **MURID**. Sistem mengesan tajuk lajur secara automatik: *Nama*, *Kelas*, *Rumah / Rumah Sukan* dan *ID / No. MyKid / No. KP*.
   Jika senarai murid berada dalam fail lain, isi `ID_SPREADSHEET_MURID` dan `TAB_MURID`.
10. **SiDIA › 2. Semak senarai murid** untuk memastikan semua lajur dikesan.
11. Di Apps Script: **Deploy › New deployment › Web app**
    - Execute as: **Me**
    - Who has access: **Anyone within moe-dl.edu.my** (atau *Anyone* jika pengawas tiada akaun DELIMa; kod akses akan melindungi sistem)
12. Salin pautan web app dan kongsikan dalam kumpulan WhatsApp guru, warden dan pengawas. Di telefon: *Add to Home Screen*.

> Selepas mengubah kod, gunakan **Deploy › Manage deployments › Edit › New version** supaya pautan kekal sama.

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

## Laporan & markah rumah
Buka tab **Laporan** (perlukan kod admin) dan pilih tempoh. Paparan menunjukkan:
- Jumlah kes dan **mata demerit mengikut rumah**
- Mengikut kesalahan, kelas dan murid (murid yang paling kerap)
- Eksport **CSV** (dibuka dalam Excel/Sheets) atau **Tulis ke tab LAPORAN** dalam Google Sheet

Jumlah mata ditolak bagi setiap rumah = jumlah lajur *Mata* dalam tab KESALAHAN. Ubah nilai mata dalam tab itu mengikut dasar sekolah.

## Dua mod keselamatan
- **Mod mudah** (tab PENGGUNA kosong): sesiapa yang mempunyai pautan dan `KOD_AKSES` boleh merekod. Pengguna mengisi nama dan peranan sekali sahaja.
- **Mod senarai emel**: isi tab PENGGUNA (Emel, Nama, Peranan). Hanya emel dalam senarai boleh masuk, dan peranan *Admin / Guru Disiplin* boleh melihat laporan.

## Untuk sekolah lain
Kongsi Google Sheet anda sebagai **templat** (File › Make a copy; kosongkan tab MURID dan REKOD dahulu). Sekolah lain cuma perlu membuat salinan, mengisi TETAPAN dan MURID, kemudian melakukan Deploy sendiri. Data setiap sekolah kekal dalam Google Drive sekolah masing-masing.
