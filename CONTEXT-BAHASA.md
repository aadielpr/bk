# Manajemen Peternakan Broiler (Recording Pemeliharaan Broiler)

Mengelola pencatatan siklus pemeliharaan harian, konsumsi pakan, deplesi ayam, biaya obat-obatan (OVK), dan evaluasi performa produksi akhir untuk peternakan ayam broiler komersial.

## Istilah Domain

**Flok (Flock)**:
Satu kesatuan populasi anak ayam (DOC) yang dipelihara bersama dalam satu kandang mulai dari masa awal (chick-in) hingga panen selesai.
_Hindari_: Batch, kawanan, rombongan, populasi umum

**DOC (Day-Old Chick)**:
Anak ayam umur sehari yang baru menetas dan diterima di kandang pada hari pertama pemeliharaan.
_Avoid_: Bibit ayam, kuthuk, anak ayam

**Umur Hari (Day Age)**:
Umur pemeliharaan ayam dalam satuan hari, dihitung mulai dari hari ke-1 (saat chick-in) sampai hari panen.
_Hindari_: Hari ke-, usia, tanggal umur

**Daya Hidup (Livability)**:
Persentase jumlah ayam yang berhasil bertahan hidup dan dipanen terhadap total populasi awal DOC.
_Hindari_: Survival rate, persentase hidup, tingkat kelulusan hidup

**Deplesi (Depletion)**:
Pengurangan jumlah populasi ayam selama masa pemeliharaan, mencakup kematian tercatat (mortalitas) dan penyusutan/hilang.
_Hindari_: Kematian saja, susut, afkir

**Konsumsi Pakan (Feed Intake)**:
Jumlah pakan yang dihabiskan oleh ayam, diukur dalam satuan zak (karung 50 kg) atau gram per ekor per hari (Gr/ek).
_Hindari_: Makan, jatah pakan, konsumsi harian

**FCR (Feed Conversion Ratio)**:
Perbandingan antara total jumlah pakan yang dikonsumsi (kg) dengan total tonase bobot hidup ayam yang dihasilkan (kg).
_Hindari_: Konversi pakan, rasio pakan, efisiensi pakan

**ABW (Average Body Weight / Rata BW)**:
Bobot badan rata-rata per ekor ayam dalam satuan kilogram atau gram, diukur berkala maupun saat panen akhir.
_Hindari_: Berat rata-rata, timbangan ayam, bobot

**ADG (Average Daily Gain)**:
Rata-rata pertambahan bobot badan per ekor ayam setiap harinya dalam satuan gram/hari.
_Hindari_: Kenaikan bobot harian, laju tumbuh

**IP (Indeks Prestasi)**:
Angka standar industri unggas di Indonesia untuk menilai efisiensi dan keberhasilan pemeliharaan broiler secara menyeluruh, menggabungkan daya hidup, bobot rata-rata, FCR, dan rata-rata umur panen.
_Hindari_: EPEF, skor performa, nilai indeks

**OVK (Obat, Vaksin, Kimia)**:
Seluruh persediaan medis peternakan yang meliputi antibiotik, vitamin, vaksin, disinfektan, dan suplemen.
_Hindari_: Obat-obatan saja, suplai farmasi, medikasi

**Plafon OVK**:
Batas maksimal biaya anggaran obat yang dialokasikan untuk satu flok, dihitung dari tarif tetap per ekor dikalikan populasi awal DOC.
_Hindari_: Anggaran obat, batas biaya medis, kuota obat

**Tonase**:
Total berat kotor/bersih hidup dari seluruh ayam yang dipanen dan ditimbang dalam satuan kilogram.
_Hindari_: Berat total, timbangan panen, hasil timbang

**DO Panen (Delivery Order)**:
Surat jalan atau bukti timbang penyerahan ayam hasil panen ke armada/truk pembeli.
_Hindari_: Bon timbang, nota jalan, tiket timbang

---

## Kamus Kolom & Data

### 1. Data Induk & Ringkasan KPI Flok (Baris 1–14)

| Sel / Kolom | Nama Bidang              | Tipe      | Deskripsi                                                    | Rumus / Aturan                   |
| :---------- | :----------------------- | :-------- | :----------------------------------------------------------- | :------------------------------- |
| `A11`       | Peternak                 | **Input** | Nama peternak atau penanggung jawab pemeliharaan.            | Teks manual (`Salahuddin`)       |
| `F11`       | Kandang / Unit           | **Input** | Kode identitas kandang atau unit flok.                       | Teks manual (`F00`)              |
| `A12`       | Periode                  | **Input** | Periode siklus pemeliharaan yang berjalan.                   | Teks manual                      |
| `A14`       | DOC Awal (Populasi Awal) | **Input** | Jumlah total anak ayam yang dimasukkan pada hari ke-1.       | Angka manual (`5000`)            |
| `C14`       | Basis Persen             | **Input** | Nilai pengali persentase standar (`100.0`).                  | Konstanta                        |
| `B1`        | Daya Hidup (Ekor)        | **Hasil** | Total ekor ayam yang berhasil dipanen dari seluruh minggu.   | `=Z26+Z34+Z42+Z50+Z58+Z66`       |
| `D1`        | Daya Hidup (%)           | **Hasil** | Persentase akhir daya hidup ayam terhadap populasi DOC awal. | `=(B1/A14)*100`                  |
| `B2`        | Deplesi Real (Ekor)      | **Hasil** | Total ayam mati yang tercatat selama satu siklus.            | `=P26+P34+P42+P50+P58+P66`       |
| `D3`        | Deplesi Data (%)         | **Hasil** | Total deplesi keseluruhan flok (kematian + susut).           | `=100-D1`                        |
| `B4`        | Rata Umur (Hari)         | **Hasil** | Rata-rata tertimbang umur ayam saat dipanen.                 | `=AC67/B1`                       |
| `B5`        | Tonase Panen (Kg)        | **Hasil** | Total bobot timbang panen hidup (kg) dari seluruh minggu.    | `=AA26+AA34+AA42+AA50+AA58+AA66` |
| `B6`        | Rata BW (Kg)             | **Hasil** | Bobot badan rata-rata akhir ayam dalam satuan kg.            | `=B5/B1`                         |
| `D6`        | Rata BW (Gram)           | **Hasil** | Bobot badan rata-rata akhir ayam dalam satuan gram.          | `=B6*1000`                       |
| `E6`        | ADG (Gram/hari)          | **Hasil** | Rata-rata pertambahan bobot harian per ekor per hari.        | `=D6/B4`                         |
| `B7`        | Pakan Masuk (Zak)        | **Hasil** | Total penerimaan pakan dalam satuan zak (50 kg/zak).         | `=K68`                           |
| `D7`        | Pakan Masuk (Kg)         | **Hasil** | Total penerimaan pakan dalam satuan kilogram.                | `=B7*50`                         |
| `B8`        | Pakan Terpakai (Zak)     | **Hasil** | Total konsumsi pakan dalam satuan zak.                       | `=G26+G34+G42+G50+G58+G66`       |
| `D8`        | Pakan Terpakai (Kg)      | **Hasil** | Total konsumsi pakan dalam satuan kilogram.                  | `=B8*50`                         |
| `B9`        | Pakan Sisa (Zak)         | **Hasil** | Sisa stok pakan di gudang kandang dalam satuan zak.          | `=B7-B8`                         |
| `D9`        | Pakan Sisa (Kg)          | **Hasil** | Sisa stok pakan di gudang kandang dalam satuan kilogram.     | `=B9*50`                         |
| `J2`        | FCR                      | **Hasil** | Rasio konversi pakan (total kg pakan / total kg tonase).     | `=D8/B5`                         |
| `J5`        | IP (Indeks Prestasi)     | **Hasil** | Skor indeks prestasi performa pemeliharaan ayam.             | `=((D1*B6)/(J2*B4))*100`         |

---

### 2. Tabel Pencatatan Harian / Recording (Baris 15–66, Kolom A–AD)

| Kolom  | Judul Kolom                    | Tipe              | Deskripsi                                                                     | Rumus / Aturan                                                                   |
| :----- | :----------------------------- | :---------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **A**  | **TGL**                        | **Input / Hasil** | Tanggal kalender. Hari ke-1 diisi manual; hari berikutnya bertambah otomatis. | Hari 1: Input (`2025-11-23`)<br>Hari 2+: `=A_sebelumnya+1`                       |
| **B**  | **AGE**                        | **Input**         | Umur flok dalam hari (1 sampai 42).                                           | Deret urutan tetap                                                               |
| **C**  | **PAKAN > STD > Gr/ek**        | **Input**         | Standar target konsumsi pakan harian per ekor (gram).                         | Standar pedoman bibit/strain                                                     |
| **D**  | **PAKAN > STD > CUM**          | **Hasil**         | Standar kumulatif target pakan per ekor (gram).                               | Hari 1: `=C19`<br>Hari 2+: `=D_sebelumnya+C_hari_ini`                            |
| **E**  | **PAKAN > STD > ZAK DAY**      | **Hasil**         | Estimasi kebutuhan pakan harian flok dalam zak (50 kg).                       | `=(T_hari_ini * C_hari_ini) / 50000`                                             |
| **F**  | **PAKAN > STD > ZAK CUM**      | **Hasil**         | Estimasi kumulatif kebutuhan pakan flok dalam zak.                            | Hari 1: `=E19`<br>Hari 2+: `=F_sebelumnya+E_hari_ini`                            |
| **G**  | **PAKAN > ACTUAL > ZAK DAY**   | **Input**         | Realisasi konsumsi pakan harian dalam zak.                                    | Pencatatan manual harian                                                         |
| **H**  | **PAKAN > ACTUAL > ZAK CUM**   | **Hasil**         | Akumulasi realisasi konsumsi pakan dalam zak.                                 | Hari 1: `=G19`<br>Hari 2+: `=H_sebelumnya+G_hari_ini`                            |
| **I**  | **PAKAN > ACTUAL > Gr/ek**     | **Hasil**         | Realisasi konsumsi pakan per ekor ayam hidup per hari (gram).                 | `=(G_hari_ini * 50000) / T_hari_ini`                                             |
| **J**  | **PAKAN > ACTUAL > Gr/ek CUM** | **Hasil**         | Akumulasi realisasi konsumsi pakan per ekor (gram).                           | `=(H_hari_ini * 50000) / T_hari_ini`                                             |
| **K**  | **MASUK > SB 10 AC**           | **Input**         | Pakan masuk jenis starter SB 10 AC (zak).                                     | Bukti surat jalan pakan                                                          |
| **L**  | **MASUK > SB 11 AC**           | **Input**         | Pakan masuk jenis grower SB 11 AC (zak).                                      | Bukti surat jalan pakan                                                          |
| **M**  | **MASUK > SB 11 C-1**          | **Input**         | Pakan masuk jenis grower SB 11 C-1 (zak).                                     | Bukti surat jalan pakan                                                          |
| **N**  | **MASUK > SB 12**              | **Input**         | Pakan masuk jenis finisher SB 12 (zak).                                       | Bukti surat jalan pakan                                                          |
| **O**  | **PAKAN > SISA**               | **Hasil**         | Sisa stok pakan di gudang kandang (zak).                                      | Hari 1: `=K+L+M+N-G`<br>Hari 2+: `=O_sebelumnya + MASUK - G_hari_ini`            |
| **P**  | **DEPLESI > ACTUAL > MATI**    | **Input**         | Jumlah ayam mati yang diafkir dan dikeluarkan pada hari itu.                  | Hitungan bangkai harian                                                          |
| **Q**  | **DEPLESI > JML**              | **Hasil**         | Akumulasi jumlah ayam mati hingga hari tersebut.                              | Hari 1: `=P19`<br>Hari 2+: `=Q_sebelumnya+P_hari_ini`                            |
| **R**  | **DEPLESI > CUM%**             | **Hasil**         | Akumulasi persentase kematian terhadap DOC awal.                              | `=(Q_hari_ini / A14) * 100`                                                      |
| **S**  | **DEPLESI > STD > CUM%**       | **Input**         | Standar toleransi batas kumulatif mortalitas (%).                             | Standar pedoman bibit/strain                                                     |
| **T**  | **SISA Ayam**                  | **Hasil**         | Populasi ayam hidup yang tersisa di dalam kandang.                            | Hari 1: `=A14 - P19 - Z19`<br>Hari 2+: `=T_sebelumnya - P_hari_ini - Z_hari_ini` |
| **U**  | **FCR > Std**                  | **Input**         | Standar kumulatif FCR pada umur tersebut.                                     | Standar pedoman bibit/strain                                                     |
| **V**  | **BODY WEIGHT > STD > ABW**    | **Input**         | Standar target bobot badan rata-rata per ekor (gram).                         | Standar pedoman bibit/strain                                                     |
| **W**  | **BODY WEIGHT > STD > ADG**    | **Input**         | Standar target pertambahan bobot harian (gram/hari).                          | Standar pedoman bibit/strain                                                     |
| **X**  | **BODY WEIGHT > ACT > Normal** | **Input**         | Realisasi hasil timbang sampel bobot ayam normal (gram).                      | Sampel timbangan rutin                                                           |
| **Y**  | **Sortiran**                   | **Input**         | Jumlah ayam kerdil, cacat, atau dipisahkan.                                   | Hitungan manual harian                                                           |
| **Z**  | **Panen > Ekor**               | **Input**         | Jumlah ekor ayam yang ditangkap dan dipanen pada hari itu.                    | Bukti rekap timbang panen                                                        |
| **AA** | **Panen > Tonase**             | **Input**         | Total berat timbangan ayam yang dipanen pada hari itu (kg).                   | Bukti rekap timbang panen                                                        |
| **AB** | **Panen > Rata BW**            | **Hasil**         | Rata-rata bobot ayam yang dipanen pada hari itu (kg/ekor).                    | `=AA_hari_ini / Z_hari_ini`                                                      |
| **AC** | **Panen > Rata Umur**          | **Hasil**         | Hasil kali umur dan ekor panen (`Umur * Ekor`).                               | `=B_hari_ini * Z_hari_ini`                                                       |
| **AD** | **KETERANGAN**                 | **Input**         | Catatan kondisi cuaca, perlakuan khusus, atau gejala sakit.                   | Teks manual                                                                      |

---

### 3. Tabel Pemakaian OVK / Obat, Vaksin, Kimia (Baris 15–35, Kolom AF–AO)

| Kolom / Sel   | Judul Kolom            | Tipe      | Deskripsi                                           | Rumus / Aturan         |
| :------------ | :--------------------- | :-------- | :-------------------------------------------------- | :--------------------- |
| **AF**        | **No**                 | **Input** | Nomor urut item obat (1 sampai 15).                 | Urutan                 |
| **AG**        | **Nama Obat**          | **Input** | Nama merek dagang obat, vitamin, atau disinfektan.  | Katalog teks           |
| **AH16:AH30** | **Harga Satuan**       | **Input** | Harga per kemasan/botol dalam Rupiah (Rp).          | Daftar harga kemitraan |
| **AI**        | **@ 1**                | **Input** | Jumlah kuantitas pemakaian pada tahap/minggu 1.     | Angka pemakaian        |
| **AJ**        | **@ 2**                | **Input** | Jumlah kuantitas pemakaian pada tahap/minggu 2.     | Angka pemakaian        |
| **AK**        | **@ 3**                | **Input** | Jumlah kuantitas pemakaian pada tahap/minggu 3.     | Angka pemakaian        |
| **AL**        | **Jumlah 1**           | **Hasil** | Subtotal biaya obat tahap 1 (Rp).                   | `=Harga * @1`          |
| **AM**        | **Jumlah 2**           | **Hasil** | Subtotal biaya obat tahap 2 (Rp).                   | `=Harga * @2`          |
| **AN**        | **Jumlah 3**           | **Hasil** | Subtotal biaya obat tahap 3 (Rp).                   | `=Harga * @3`          |
| **AO31**      | **Total OVK Terpakai** | **Hasil** | Total seluruh realisasi pengeluaran OVK (Rp).       | `=AL31 + AM31 + AN31`  |
| **AH33**      | **Max Plafon**         | **Hasil** | Batas maksimal anggaran OVK (Rp 400 per ekor DOC).  | `=A14 * 400`           |
| **AH34**      | **Sisa Plafon**        | **Hasil** | Sisa anggaran OVK yang tidak terpakai/surplus (Rp). | `=AH33 - AO31`         |
| **AH35**      | **Rataan / Ekor**      | **Hasil** | Realisasi biaya obat per ekor DOC awal (Rp/ekor).   | `=AO31 / A14`          |

---

### 4. Tabel Rincian DO / Timbang Panen (Baris 15–35, Kolom AQ–AY)

| Kolom / Sel          | Judul Kolom            | Tipe      | Deskripsi                                                  | Rumus / Aturan                 |
| :------------------- | :--------------------- | :-------- | :--------------------------------------------------------- | :----------------------------- |
| **AQ**               | **NO**                 | **Input** | Nomor urut penimbangan atau armada truk (1 sampai 15).     | Urutan                         |
| **AR, AT, AV, AX**   | **EKOR**               | **Input** | Jumlah ekor ayam yang ditimbang per nota/ritel.            | Bukti timbang fisik            |
| **AS, AU, AW, AY**   | **KG**                 | **Input** | Berat total timbangan ayam hidup per nota/ritel (kg).      | Bukti timbang fisik            |
| **Baris 31 (AR:AY)** | **Subtotal Ekor & Kg** | **Hasil** | Total per sesi timbang atau per armada truk.               | `=SUM(baris16:baris30)`        |
| **AS33**             | **Total Ekor DO**      | **Hasil** | Total seluruh ekor ayam dari seluruh surat jalan/DO.       | `=SUM(AR31, AT31, AV31, AX31)` |
| **AS34**             | **Total Tonase DO**    | **Hasil** | Total seluruh bobot timbangan panen dari DO (kg).          | `=SUM(AS31, AU31, AW31, AY31)` |
| **AS35**             | **Rataan DO**          | **Hasil** | Bobot rata-rata ayam per ekor dari rekap surat jalan (kg). | `=AS34 / AS33`                 |
