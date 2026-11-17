# Senarai Perubahan SiDIA

## 1.4.0 (17 Nov 2026)
Reka bentuk semula UI/UX web app berdasarkan garis panduan UI UX Pro Max (produk pendidikan/LMS):
- **Sistem reka bentuk**: token warna semantik (teal pendidikan + amber), fon Inter, skala jejari/bayang/pergerakan yang konsisten
- **Mod gelap automatik** mengikut tetapan telefon, sesuai untuk semakan waktu Subuh/malam
- **Ikon SVG** menggantikan emoji (navigasi, menu Admin, butang)
- **Aksesibiliti**: kontras ≥4.5:1, cincin fokus, label ARIA, senarai murid boleh digunakan dengan papan kekunci (Space/Enter), notis diumumkan kepada pembaca skrin, Escape menutup tetingkap, zum tidak lagi dimatikan, `prefers-reduced-motion`
- **Sentuhan**: semua sasaran ≥44px, maklum balas tekan, petunjuk tab aktif (pil), ruang selamat iPhone (safe area)
- *Empty state* yang lebih membantu, sheet bawah dengan pemegang, butang × tunggal dalam kotak carian

## 1.3.0 (17 Nov 2026)
- **Laporan PDF rasmi** (Admin › Laporan › 📄 Muat turun PDF), dijana dalam pelayar:
  - header SiDIA (logo, nama sekolah, tempoh) dan footer (penyedia, tarikh, SULIT, Halaman X / Y) pada setiap halaman
  - ringkasan, kedudukan rumah dengan carta bar, tahap kesalahan, kesalahan, kelas, murid paling kerap
  - ruang tandatangan "Disediakan oleh" & "Disahkan oleh"; lampiran pilihan: senarai penuh rekod

## 1.2.3 (17 Nov 2026)
- Baiki (iPhone): menekan kotak carian murid tidak lagi menolak paparan ke atas sehingga skrin kosong
- Telefon: **skrin carian penuh**. Kotak carian sentiasa di bahagian atas skrin, senarai murid terus di bawahnya, dengan kiraan murid dipilih dan butang **Selesai**

## 1.2.2 (17 Nov 2026)
- Ikon SiDIA baharu (perisai dengan tanda ✓): favicon web app, logo di tajuk web app & wizard
- Halaman pengenalan: favicon, ikon skrin utama (iPhone/Android) dan web manifest

## 1.2.1 (17 Nov 2026)
- Kemas kini satu klik: mesej ralat kini menerangkan punca sebenar (suis Apps Script API OFF, API projek dinyahaktifkan, disekat pentadbir domain, atau kebenaran tidak lengkap) dan memaparkan mesej asal Google

## 1.2.0 (17 Nov 2026)
- **PIN berbeza mengikut peranan:** Guru & Warden, Murid (Pengawas) dan Admin. Pengawas tidak boleh log masuk sebagai guru
- **Tab Admin** (menggantikan tab Laporan) dengan submenu: Laporan, **PIN akses** (tukar PIN), **Tetapan sekolah**, **Kongsi pautan** (kod QR & mesej WhatsApp berasingan untuk guru dan pengawas), **Sistem** (versi & kemas kini dari telefon)
- Pengawas hanya melihat rekod sendiri, dan tab Admin disorok untuk mereka
- Wizard: tiga medan PIN dan dua butang WhatsApp
- **Panduan pengguna PDF**: Guru, Warden, Pengawas dan Admin (`docs/panduan/`)
- Baiki (keselamatan): PIN Admin sesi sebelumnya tidak lagi dibawa apabila pengguna lain log masuk pada telefon yang sama
- Baiki: peranan tidak lagi bertukar sendiri selepas PIN salah; tajuk dikosongkan di skrin log masuk

## 1.1.1 (17 Nov 2026)
- Keluaran ujian untuk kemas kini satu klik (tiada perubahan fungsi web app)
- Halaman pengenalan dikemas kini: pemilih kesalahan, ciri mesra telefon & kemas kini satu klik
- Ditambah: kerangka ujian `tests/` dan panduan projek `CLAUDE.md`

## 1.1.0 (17 Nov 2026)
- **Kemas kini satu klik**: menu *SiDIA › Semak kemas kini* dan notis dalam wizard
- **142 kesalahan standard** (Ringan / Sederhana / Berat), termasuk W01–W05 tidak hadir solat berjemaah
- Pemilih kesalahan baharu: tab ⭐ Pantas / Ringan / Sederhana / Berat, carian nama atau kod, senarai "kerap anda guna", amaran kesalahan Berat
- Lajur **Pantas** dalam tab KESALAHAN; wizard boleh tampal senarai kesalahan dari Excel
- Mod taip di telefon: kotak carian dan senarai tidak dilindungi papan kekunci; kiraan murid dipilih dalam kotak carian
- Baiki: bar Simpan hilang selepas papan kekunci ditutup (iPhone)
- Baiki: medan tarikh/masa bertindih di iPhone
- Baiki: No. KP murid menjadi `1.30927E+11` semasa muat naik Excel
- Baiki: wizard memaparkan pautan deployment lama; pautan yang ditampal kini diutamakan, dan ada butang *Tukar pautan*
- Bantuan untuk ralat "Sorry, unable to open the file" (akaun Google berganda)

## 1.0.0 (17 Nov 2026)
- Keluaran pertama: web app rekod disiplin pukal, wizard persediaan, laporan mata rumah, halaman pengenalan
