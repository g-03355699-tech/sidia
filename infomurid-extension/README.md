# SiDIA → Infomurid (extension Chrome)

Import rekod kesalahan daripada tab **REKOD** Google Sheet SiDIA ke **Infomurid › GURU DISIPLIN › Kemaskini salah laku**, secara pukal. Tidak perlu lagi menaip semula setiap murid.

## Cara ia berfungsi
- Extension menambah butang **Import SiDIA** di penjuru kanan bawah halaman `infomurid.com/Discipline/…`.
- Data dibaca daripada fail CSV tab REKOD (atau ditampal terus dari Google Sheet).
- Murid dipadankan dengan senarai murid Infomurid mengikut **nama** (dan **kelas** jika ada nama yang sama).
- Kod kesalahan SiDIA (cth `S11`, `R14`, `884`) dipadankan dengan kod dalam senarai salah laku Infomurid. Kod yang tiada dalam Infomurid (cth `W01`–`W05` solat berjemaah) perlu dipilih sekali sahaja; pilihan itu diingat.
- Rekod disimpan melalui fungsi **Tambah Rekod (Kelompok)** Infomurid, satu kumpulan bagi setiap tarikh + kesalahan.
- Rekod yang sudah ada dalam Infomurid (nama + tarikh + kod sama) dan rekod yang pernah diimport akan dilangkau.

Semua permintaan dibuat terus dari pelayar anda ke Infomurid menggunakan log masuk anda. Tiada data dihantar ke tempat lain.

## Pasang (sekali sahaja)
1. Muat turun [`sidia-infomurid.zip`](https://g-03355699-tech.github.io/sidia/sidia-infomurid.zip) dan **ekstrak** (Extract All) ke satu folder yang kekal, contohnya `Dokumen\sidia-infomurid`.
2. Buka Chrome, taip `chrome://extensions` di bar alamat.
3. Hidupkan **Developer mode** (penjuru kanan atas).
4. Klik **Load unpacked** dan pilih folder yang diekstrak tadi (folder yang mengandungi `manifest.json`).
5. Ikon SiDIA akan muncul dalam senarai extension. Jangan padam folder itu.

> Microsoft Edge juga boleh: `edge://extensions` › **Developer mode** › **Load unpacked**.

## Guna
1. Dalam Google Sheet SiDIA, buka tab **REKOD** › **Fail › Muat turun › Nilai dipisahkan koma (.csv)**.
   Atau pilih baris dalam tab REKOD (termasuk baris tajuk), tekan Ctrl+C.
2. Log masuk Infomurid dan buka **GURU DISIPLIN › Kemaskini salah laku**.
3. Klik **Import SiDIA** › **Pilih fail CSV** (atau tampal data, kemudian **Baca data yang ditampal**).
4. Pilih **Tahun**, julat **Tarikh**, **Hukuman** (lalai: Amaran) dan klik **Semak dengan Infomurid**.
5. Semak senarai:
   - kumpulan berbingkai merah: pilih kesalahan Infomurid yang setara untuk kod tersebut
   - **Tidak dijumpai**: buka senarai murid dan pilih nama yang betul dalam kelas yang sama (diingat untuk kali seterusnya)
   - nyahtanda kumpulan yang tidak mahu diimport
6. Klik **Import N rekod ke Infomurid** dan sahkan.

## Nota
- Masa SiDIA `21:30` ditulis sebagai `9.30pm`. Jika masa kosong, nilai "Masa jika kosong" digunakan.
- Lokasi kosong diganti dengan "Lokasi jika kosong" (lalai `SEKOLAH`).
- Ulasan Infomurid = Catatan SiDIA + nama pelapor (boleh dimatikan).
- Senarai rekod yang telah diimport disimpan dalam pelayar ini sahaja. Jika memakai komputer lain, semakan pendua Infomurid (nama + tarikh + kod) masih melindungi daripada rekod berganda.
- Jika Infomurid mengubah reka bentuk halamannya, extension mungkin perlu dikemas kini.
