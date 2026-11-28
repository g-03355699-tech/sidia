# Senarai Perubahan SiDIA

## 1.10.0 (28 Nov 2026)
- **Susun atur baharu sepadan dengan Kelasku** (warna teal SiDIA dikekalkan): fon Poppins, kad putih tanpa sempadan
  - senarai kesalahan, murid dan rekod terkini dipaparkan sebagai jubin dengan jalur warna di kiri (hijau ringan, jingga sederhana, merah berat; teal apabila murid dipilih)
  - header memaparkan nombor versi; menu bawah menanda tab aktif dengan warna teal
  - butang sekunder kelabu, cip tapisan berbentuk pil, medan carian dengan ikon kanta
  - menu Admin: jubin menu dan kad **Ringkasan** (murid, kelas, kesalahan, rekod)
- Wizard persediaan (Google Sheet) menggunakan fon dan bentuk yang sama
- Tiada perubahan pada warna tema, data, PIN atau cara merekod

## 1.9.0 (23 Nov 2026)
- **Peranan baharu: Majlis Tertinggi** (pengawas kanan) dengan **PIN sendiri** (`KOD_MT`)
  - boleh merekod, melihat semua rekod terkini, dan membuka **Laporan** (termasuk PDF, CSV & Laporan Kesalahan Murid)
  - seperti pengawas untuk senarai kesalahan & Amalan Baik (lihat sahaja); tiada akses PIN, tetapan atau kemas kini (disekat juga di pelayan)
  - admin menetapkan PIN di **Admin › PIN akses** atau dalam wizard; butang WhatsApp khas dalam Kongsi pautan
  - sekolah sedia ada: peranan "Majlis Tertinggi" ditambah secara automatik ke senarai peranan
- **Laporan: butang "Hari ini"**

## 1.8.0 (19 Nov 2026)
- **Amalan baik**: tab baharu **Amalan Baik** di menu bawah untuk merekod amalan baik murid (mata merit)
  - guru, warden, guru disiplin dan admin boleh merekod; pengawas boleh melihat sahaja
  - guru dan admin boleh menambah dan mengubah jenis amalan baik
  - 18 jenis amalan baik lalai (AB01–AB18), tab baharu AMALAN_BAIK dan REKOD_AMALAN dicipta secara automatik
  - mata amalan baik mengikut rumah (tahun semasa) dan rekod terkini
- Baiki: pilihan murid yang belum disimpan tidak lagi dipulihkan kepada pengguna lain pada telefon yang sama

## 1.7.0 (19 Nov 2026)
- **Peti keluar untuk talian lemah**: setiap simpanan disimpan dahulu dalam telefon. Jika talian putus atau tiada jawapan dalam 30 saat, rekod dihantar semula secara automatik (apabila talian pulih, app dibuka semula, kembali ke skrin, dan setiap minit)
- Rekod tidak berganda walaupun dihantar semula: setiap simpanan mempunyai ID unik yang disemak oleh pelayan
- Status *rekod belum dihantar* di bahagian atas skrin, dengan butang **Hantar sekarang** dan **Butiran** (cuba semula atau buang simpanan yang gagal)
- Skrin "Menyimpan…" tidak lagi berpusing tanpa henti (had 30 saat)
- Pilihan murid yang dipulihkan kini termasuk tarikh, masa, lokasi dan catatan asal

## 1.6.1 (18 Nov 2026)
- Jumlah rekod di sebelah nama murid kini dua **lencana bulat**: tahun semasa (hijau, merah jika > 3) dan keseluruhan (biru, jingga jika > 10)

## 1.6.0 (18 Nov 2026)
- **Jumlah rekod kesalahan di sebelah nama murid**: NAMA MURID [tahun semasa] [keseluruhan], untuk semua pengguna. Dikira terus daripada tab REKOD, dikemas kini selepas simpan/batal/padam. Merah jika 5 rekod atau lebih pada tahun semasa
- **Laporan Kesalahan Murid**: cari murid dan lihat semua kesalahannya, dengan eksport **PDF** (header/footer rasmi, ringkasan mengikut kesalahan, ruang tandatangan) dan **CSV**. Untuk semua pengguna: di Admin › Laporan dan tab Terkini

## 1.5.0 (17 Nov 2026)
- Senarai kesalahan lalai kini **137 kesalahan**, sama dengan senarai salah laku Infomurid: W01–W05 (tidak hadir solat berjemaah) dibuang
- Sekolah sedia ada: W01–W05 dinyahaktifkan secara automatik dalam tab KESALAHAN (Aktif = Tidak) selepas kemas kini. Rekod lama tidak diubah dan masih dikira dalam laporan
- **Sunting senarai kesalahan di web app** (🛡️ Admin › Senarai kesalahan): guru, warden, guru disiplin dan admin boleh menambah kesalahan, mengubah nama, kategori dan mata demerit, menanda ⭐ pilihan pantas, serta menyahaktifkan atau memadam kesalahan. Pengawas tidak boleh
  - kesalahan yang sudah ada rekod: kod dikunci dan tidak boleh dipadam (nyahaktifkan sahaja) supaya laporan lama kekal
  - perubahan terus muncul dalam skrin Rekod
- Extension SiDIA → Infomurid 1.0.2: rekod dengan kod yang tiada dalam Infomurid dilangkau secara automatik

## Extension SiDIA → Infomurid 1.0.1 (17 Nov 2026)
- Butang **Import SiDIA** kini di sebelah butang Excel
- Klik ikon SiDIA pada toolbar Chrome membuka panel import (berfungsi walaupun tab Infomurid dibuka sebelum extension dipasang)

## Extension SiDIA → Infomurid 1.0.0 (17 Nov 2026)
- Extension Chrome baharu (`infomurid-extension/`, muat turun `sidia-infomurid.zip`) untuk **import rekod kesalahan dari tab REKOD ke Infomurid** (Kemaskini salah laku) secara pukal
- Padanan murid ikut nama (+ kelas), padanan kod kesalahan automatik, pemetaan kod tambahan (cth W01–W05) diingat
- Langkau rekod yang sudah ada dalam Infomurid atau pernah diimport

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
