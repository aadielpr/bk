# Broiler Farm Management

Manages the daily lifecycle, feed consumption, flock mortality, medication expenditure, and final production performance metrics for commercial broiler chicken farming.

## Technology Stack

- **Web:** Solid.js single-page application (SPA)
- **Mobile:** Expo
- **Server:** Express
- **Language:** TypeScript across web, mobile, and server
- **Runtime and package manager:** Bun
- **Database:** PostgreSQL
- **Cache:** Redis
- **Object storage:** Cloudflare R2

## Language

**Flock**:
A single group of day-old chicks (DOC) reared together in one coop from placement through final harvest.
_Avoid_: Batch, herd, population, lot

**Broiler Farm**:
A broiler operation that manages one or more coops.

**Super Admin**:
The app-owner account with access across farms, coops, cycles, PT Templates, and user provisioning. The app is private: the Super Admin provisions each farm user and assigns exactly one role, Owner or Operator; there is no public self-registration. It is separate from farm Owner and Operator accounts.
_Avoid_: Farm Owner, Admin

**Coop (Kandang)**:
A physical chicken house within a Broiler Farm where a Flock is reared. Only one Production Cycle may be active in a coop at a time.
_Avoid_: House, unit

**Farm Membership**:
A farm account's attachment to exactly one Broiler Farm with exactly one role, Owner or Operator; a person involved in multiple farms has separate accounts. The Super Admin account is separate and has app-wide access.
_Avoid_: Account role, multi-farm membership

**Owner**:
An account type that can access all coops in its farm and is the only farm account type that can start or close a Production Cycle.
_Avoid_: Admin

**Operator**:
A distinct account type that can record activity only for coops assigned to it in its farm. An Operator account cannot start or close a Production Cycle.
_Avoid_: Caretaker

**Production Cycle (Siklus)**:
A rearing period in one coop from DOC placement through final harvest, managing exactly one Flock and using a selected PT Template Version. Only an Owner may start or close a cycle; every bird must be accounted for before closure. A coop may have successive cycles but only one active cycle at a time.
_Avoid_: Batch, season

**Daily Report**:
One date-specific record for a coop's active Production Cycle, covering routine flock conditions and daily measurements. Repeated feed deliveries, OVK use, and harvests are separate entries associated with that report date; corrections create a new version, and the latest version is current.
_Avoid_: Log row

**Daily Report Version**:
A submitted snapshot of the whole Daily Report, including its routine fields and associated activity entries. Each submitted correction, including after cycle closure, creates a new version rather than replacing the prior one; Owners and Super Admins can review all versions, while Operators use the latest.
_Avoid_: Overwrite

**DOC (Day-Old Chick)**:
The initial newly-hatched chicks received at placement on day 1.
_Avoid_: Bibit, anak ayam, chick-in

**DOC Supplier (PT)**:
The company that supplies the DOC placed into a Production Cycle; each cycle records its DOC Supplier.
_Avoid_: Chick source

**PT Template**:
An app-managed set of a PT's feed types, performance targets, and IP calculation, selected by the Owner for a Production Cycle.
_Avoid_: Standard sheet

**PT Template Version**:
A revision of a PT Template used by a Production Cycle. A Super Admin may apply a newer version to one cycle without changing the version used by other cycles.
_Avoid_: Standard sheet revision

**Day Age**:
The age of the flock in days, starting from Day 1 on chick-in day up to harvest.
_Avoid_: Hari ke-, umur ayam, umur

**Livability (Daya Hidup)**:
The percentage of the initial flock that survived and was successfully harvested.
_Avoid_: Survival rate, persentase hidup

**Depletion (Deplesi)**:
The reduction in flock population over time, partitioned into recorded mortality and unaccounted shrinkage.
_Avoid_: Kematian, loss, susut

**Feed Intake (Konsumsi Pakan)**:
The quantity of feed consumed by a Flock, recorded as 50 kg sacks by feed type and optionally expressed as grams per live bird per day (Gr/ek).
_Avoid_: Makan, jatah pakan, konsumsi

**Feed Type (Jenis Pakan)**:
A PT-specific feed product used by a Flock, such as SB-10, SB-11, or SB-12, measured in 50 kg sacks.
_Avoid_: Feed category

**Feed Stock (Persediaan Pakan)**:
The quantity of each Feed Type held at one coop, increased by deliveries and reduced by recorded consumption.
_Avoid_: Farm-wide stock

**FCR (Feed Conversion Ratio)**:
The ratio of total feed consumed (kg) to total live harvest weight produced (kg).
_Avoid_: Konversi pakan, rasio pakan

**ABW (Average Body Weight / Rata BW)**:
The average live weight per bird in kilograms or grams, measured at weekly checkpoints or at harvest.
_Avoid_: Bobot rata-rata, berat ayam, bobot

**ADG (Average Daily Gain)**:
The average daily weight gain per bird in grams per day over the rearing duration.
_Avoid_: Pertambahan bobot harian, laju tumbuh

**IP (Indeks Prestasi / Performance Index)**:
The standard composite metric evaluating total broiler production efficiency, combining livability, average weight, FCR, and average harvest age.
_Avoid_: EPEF, skor performa, indeks performa

**OVK (Obat, Vaksin, Kimia)**:
Medication, vaccines, supplements, and sanitizing chemicals allocated to a flock.
_Avoid_: Obat-obatan, medical supplies, farm pharmacy

**OVK Plafon**:
The budgeted maximum expenditure allowance for medication per flock, calculated as a fixed rate per initial DOC placed.
_Avoid_: Budget obat, batas obat, plafon

**Tonase**:
The total live weight in kilograms of birds harvested and sold.
_Avoid_: Total berat, total timbang, berat panen

**Delivery Order (DO)**:
A harvest transport dispatch record detailing the bird count and weighed tonnage loaded into buyer trucks.
_Avoid_: Surat jalan, nota timbang, bon panen

---

## Field & Column Dictionary

### 1. Flock Header & Configuration (Rows 1–14)

| Field / Cell | Name                       | Type       | Description                                              | Formula / Rule                   |
| :----------- | :------------------------- | :--------- | :------------------------------------------------------- | :------------------------------- |
| `A11`        | Peternak                   | **Input**  | Name of the farmer or farm caretaker.                    | Manual text                      |
| `F11`        | Kandang / Unit             | **Input**  | House/coop unit identifier (e.g. `F00`).                 | Manual text                      |
| `A12`        | Periode                    | **Input**  | Production cycle period or rearing season.               | Manual text                      |
| `A14`        | DOC Placed (Populasi Awal) | **Input**  | Total initial chicks placed on Day 1 (e.g. `5000`).      | Manual number                    |
| `C14`        | Basis Percent              | **Input**  | Standard denominator constant (`100.0`).                 | Constant                         |
| `B1`         | Daya Hidup (Ekor)          | **Result** | Total birds harvested across all weekly periods.         | `=Z26+Z34+Z42+Z50+Z58+Z66`       |
| `D1`         | Daya Hidup (%)             | **Result** | Final livability percentage of the flock.                | `=(B1/A14)*100`                  |
| `B2`         | Deplesi Real (Ekor)        | **Result** | Total dead birds recorded throughout the cycle.          | `=P26+P34+P42+P50+P58+P66`       |
| `D3`         | Deplesi Data (%)           | **Result** | Total flock loss percentage (mortality + shrinkage).     | `=100-D1`                        |
| `B4`         | Rata Umur (Hari)           | **Result** | Weighted average harvest age in days.                    | `=AC67/B1`                       |
| `B5`         | Tonase Panen (Kg)          | **Result** | Total live weight harvested across all weekly periods.   | `=AA26+AA34+AA42+AA50+AA58+AA66` |
| `B6`         | Rata BW (Kg)               | **Result** | Final average body weight in kilograms per bird.         | `=B5/B1`                         |
| `D6`         | Rata BW (Gram)             | **Result** | Final average body weight in grams per bird.             | `=B6*1000`                       |
| `E6`         | ADG (Gr/hari)              | **Result** | Average daily gain in grams per day.                     | `=D6/B4`                         |
| `B7`         | Pakan Masuk (Zak)          | **Result** | Total feed delivered in 50 kg bags.                      | `=K68`                           |
| `D7`         | Pakan Masuk (Kg)           | **Result** | Total feed delivered converted to kilograms.             | `=B7*50`                         |
| `B8`         | Pakan Terpakai (Zak)       | **Result** | Total feed consumed in 50 kg bags.                       | `=G26+G34+G42+G50+G58+G66`       |
| `D8`         | Pakan Terpakai (Kg)        | **Result** | Total feed consumed converted to kilograms.              | `=B8*50`                         |
| `B9`         | Pakan Sisa (Zak)           | **Result** | Remaining feed stock in bags.                            | `=B7-B8`                         |
| `D9`         | Pakan Sisa (Kg)            | **Result** | Remaining feed stock in kilograms.                       | `=B9*50`                         |
| `J2`         | FCR                        | **Result** | Feed Conversion Ratio (total kg feed / total kg weight). | `=D8/B5`                         |
| `J5`         | IP (Indeks Prestasi)       | **Result** | Composite farm efficiency index.                         | `=((D1*B6)/(J2*B4))*100`         |

---

### 2. Daily Log Table (Rows 15–66, Columns A–AD)

| Col    | Header                     | Type               | Description                                                            | Formula / Rule                                                   |
| :----- | :------------------------- | :----------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **A**  | TGL                        | **Input / Result** | Calendar date. Day 1 is input; subsequent days increment sequentially. | Day 1: Input (`2025-11-23`)<br>Day 2+: `=A_prev + 1`             |
| **B**  | AGE                        | **Input**          | Flock age in days (1 to 42).                                           | Predefined sequence                                              |
| **C**  | PAKAN > STD > Gr/ek        | **Input**          | Target daily feed intake benchmark per bird (grams).                   | Management breed standard                                        |
| **D**  | PAKAN > STD > CUM          | **Result**         | Cumulative target feed intake per bird (grams).                        | Day 1: `=C19`<br>Day 2+: `=D_prev + C_curr`                      |
| **E**  | PAKAN > STD > ZAK DAY      | **Result**         | Projected daily feed requirement in bags for the remaining flock.      | `=(T_curr * C_curr) / 50000`                                     |
| **F**  | PAKAN > STD > ZAK CUM      | **Result**         | Cumulative projected feed requirement in bags.                         | Day 1: `=E19`<br>Day 2+: `=F_prev + E_curr`                      |
| **G**  | PAKAN > ACTUAL > ZAK DAY   | **Input**          | Actual feed consumed that day in bags (50 kg/bag).                     | Daily manual recording                                           |
| **H**  | PAKAN > ACTUAL > ZAK CUM   | **Result**         | Cumulative actual feed consumed in bags.                               | Day 1: `=G19`<br>Day 2+: `=H_prev + G_curr`                      |
| **I**  | PAKAN > ACTUAL > Gr/ek     | **Result**         | Actual daily feed consumed per live bird in grams.                     | `=(G_curr * 50000) / T_curr`                                     |
| **J**  | PAKAN > ACTUAL > Gr/ek CUM | **Result**         | Cumulative actual feed consumed per live bird in grams.                | `=(H_curr * 50000) / T_curr`                                     |
| **K**  | MASUK > SB 10 AC           | **Input**          | Delivery of starter feed type SB 10 AC (bags).                         | Manual delivery receipt                                          |
| **L**  | MASUK > SB 11 AC           | **Input**          | Delivery of grower feed type SB 11 AC (bags).                          | Manual delivery receipt                                          |
| **M**  | MASUK > SB 11 C-1          | **Input**          | Delivery of grower feed type SB 11 C-1 (bags).                         | Manual delivery receipt                                          |
| **N**  | MASUK > SB 12              | **Input**          | Delivery of finisher feed type SB 12 (bags).                           | Manual delivery receipt                                          |
| **O**  | SISA PAKAN                 | **Result**         | Feed inventory balance remaining in coop storage (bags).               | Day 1: `=K+L+M+N-G`<br>Day 2+: `=O_prev + K+L+M+N - G_curr`      |
| **P**  | DEPLESI > ACTUAL > MATI    | **Input**          | Dead birds counted and removed that day.                               | Daily manual count                                               |
| **Q**  | DEPLESI > JML              | **Result**         | Cumulative dead birds recorded up to that day.                         | Day 1: `=P19`<br>Day 2+: `=Q_prev + P_curr`                      |
| **R**  | DEPLESI > CUM%             | **Result**         | Cumulative mortality rate relative to initial DOC.                     | `=(Q_curr / A14) * 100`                                          |
| **S**  | DEPLESI > STD > CUM%       | **Input**          | Target maximum cumulative mortality rate benchmark (%).                | Management breed standard                                        |
| **T**  | SISA Ayam                  | **Result**         | Current live birds remaining inside the coop.                          | Day 1: `=A14 - P19 - Z19`<br>Day 2+: `=T_prev - P_curr - Z_curr` |
| **U**  | FCR > Std                  | **Input**          | Cumulative FCR target benchmark at each day of age.                    | Management breed standard                                        |
| **V**  | BODY WEIGHT > STD > ABW    | **Input**          | Target average body weight benchmark in grams.                         | Management breed standard                                        |
| **W**  | BODY WEIGHT > STD > ADG    | **Input**          | Target daily weight gain benchmark in grams/day.                       | Management breed standard                                        |
| **X**  | BODY WEIGHT > ACT > Normal | **Input**          | Periodic live bird sample average weight in grams.                     | Manual scale sample                                              |
| **Y**  | Sortiran                   | **Input**          | Weak or defective birds culled/separated.                              | Daily manual count                                               |
| **Z**  | Panen > Ekor               | **Input**          | Headcount of birds harvested and loaded that day.                      | Harvest weighing record                                          |
| **AA** | Panen > Tonase             | **Input**          | Total live weight (kg) harvested and loaded that day.                  | Harvest weighing record                                          |
| **AB** | Panen > Rata BW            | **Result**         | Average body weight (kg) of birds harvested that day.                  | `=AA_curr / Z_curr`                                              |
| **AC** | Rata Umur Product          | **Result**         | Day age multiplied by harvested bird count (for weighted avg age).     | `=B_curr * Z_curr`                                               |
| **AD** | KETERANGAN                 | **Input**          | Observations, treatments, necropsy notes, or weather.                  | Manual text                                                      |

---

### 3. Medication & Health Supplies / OVK Table (Rows 15–35, Columns AF–AO)

| Col / Cell    | Header             | Type       | Description                                                  | Formula / Rule        |
| :------------ | :----------------- | :--------- | :----------------------------------------------------------- | :-------------------- |
| **AF**        | No                 | **Input**  | Line item index (1 to 15).                                   | Sequence              |
| **AG**        | Nama Obat          | **Input**  | Commercial name of medicine, vaccine, or supplement.         | Manual text catalog   |
| **AH16:AH30** | Harga Satuan       | **Input**  | Unit price in IDR per bottle/pack.                           | Contract price list   |
| **AI**        | @ 1                | **Input**  | Quantity issued/used in distribution batch 1.                | Manual quantity       |
| **AJ**        | @ 2                | **Input**  | Quantity issued/used in distribution batch 2.                | Manual quantity       |
| **AK**        | @ 3                | **Input**  | Quantity issued/used in distribution batch 3.                | Manual quantity       |
| **AL**        | Jumlah 1           | **Result** | Cost of medication in batch 1 (IDR).                         | `=AH * AI`            |
| **AM**        | Jumlah 2           | **Result** | Cost of medication in batch 2 (IDR).                         | `=AH * AJ`            |
| **AN**        | Jumlah 3           | **Result** | Cost of medication in batch 3 (IDR).                         | `=AH * AK`            |
| **AO31**      | Total OVK Terpakai | **Result** | Total flock medication expenditure (IDR).                    | `=AL31 + AM31 + AN31` |
| **AH33**      | Max Plafon OVK     | **Result** | Maximum allowable medication budget (Rp 400/DOC).            | `=A14 * 400`          |
| **AH34**      | Sisa Plafon OVK    | **Result** | Remaining unspent medication budget credit (IDR).            | `=AH33 - AO31`        |
| **AH35**      | Rataan OVK / Ekor  | **Result** | Realized medication cost per initial bird placed (IDR/ekor). | `=AO31 / A14`         |

---

### 4. Harvest Delivery Order Breakdown Table (Rows 15–35, Columns AQ–AY)

| Col / Cell         | Header             | Type       | Description                                                 | Formula / Rule                 |
| :----------------- | :----------------- | :--------- | :---------------------------------------------------------- | :----------------------------- |
| **AQ**             | NO                 | **Input**  | Weighing scale ticket / truck load index (1 to 15).         | Sequence                       |
| **AR, AT, AV, AX** | EKOR               | **Input**  | Number of birds crated per weighing ticket or batch.        | Scale ticket count             |
| **AS, AU, AW, AY** | KG                 | **Input**  | Net weight (kg) recorded per weighing ticket or batch.      | Scale ticket weight            |
| **Row 31 (AR:AY)** | Subtotal Ekor & Kg | **Result** | Column totals for each truck or buyer weighing session.     | `=SUM(col16:col30)`            |
| **AS33**           | Total Ekor DO      | **Result** | Sum of all birds accounted for on delivery slips.           | `=SUM(AR31, AT31, AV31, AX31)` |
| **AS34**           | Total Tonase DO    | **Result** | Sum of all net weight on delivery slips (kg).               | `=SUM(AS31, AU31, AW31, AY31)` |
| **AS35**           | Rataan DO          | **Result** | Overall average bird weight across all delivery slips (kg). | `=AS34 / AS33`                 |
