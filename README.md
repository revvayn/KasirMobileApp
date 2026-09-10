# KasirMobileApp

Aplikasi kasir (POS) berbasis **Expo SDK 57** (React Native + React Native Web) dengan backend **Firebase Firestore**. Menjalankan di Android, iOS, maupun browser.

## Fitur

- 🔐 **Login & Role** — akun **Admin** / **Kasir** berbasis Firebase Auth. Akun pertama yang dibuat otomatis jadi Admin; menu sensitif (Kelola Produk, Manajemen Pengguna, Pengaturan QRIS) hanya untuk Admin.
- 📦 **Katalog & Manajemen Produk** — daftar produk 2 kolom, pencarian, tambah/edit/hapus produk lewat modal bottom sheet, upload foto via URL, statistik stok (menipis/habis ambang **Stok Minimum**), **varian** (cth. Panas/Dingin + tambahan harga) & **modifier** (cth. Level Pedas).
- 🛒 **Keranjang & Pembayaran** — keranjang pintar memisahkan item beda varian/catatan (Kopi Panas vs Kopi Dingin), modal pilih varian/modifier/catatan, total otomatis; keranjang **tersimpan otomatis** walau app ditutup.
- 🏷️ **Diskon Produk** — admin set diskon 0–100% per produk (slider di Kelola Produk); dipakai otomatis saat kasir menjual (badge `-X%` di katalog, harga terdiskon di struk/Excel).
- 💵 **Pembayaran TUNAI & QRIS** — auto-refresh QRIS 60 detik, cetak struk, dan **nomor invoice otomatis** (`INV-YYYYMMDD-NNNN`).
- 🧾 **Riwayat Transaksi** — pagination, lihat detail, **cetak ulang struk**, hapus per item / batch per filter.
- 📊 **Dashboard Laporan** — Total Pendapatan, Laba & Margin, Total Transaksi, Item Terjual, **Pendapatan per Kategori**, Produk Terlaris (progress bar), Transaksi Terbaru; filter Hari Ini/Bulan/Tahun/Semua/Tanggal/**Rentang**.
- 🔁 **Rekap Shift / Penutupan** — layar **Closing**: ringkasan + filter **tanggal** & **user kasir** (admin bebas pilih, kasir terkunci ke akunnya), total, tunai, QRIS, laba, per kategori, per kasir + cetak/share PDF.
- 👥 **Manajemen Pengguna** (Admin) — buat/hapus akun kasir, ubah role & nama.
- 📈 **Export Excel** — ekspor laporan transaksi sesuai filter ke file `.xlsx` (2 sheet: Transaksi — dengan kolom **Nomor Invoice** & **Diskon** — dan Detail Penjualan). Berjalan di web (unduh langsung) & native (share sheet).
- ⚡ **Stok atomis** — stok produk otomatis berkurang saat transaksi dibuat (`writeBatch` + `increment`).
- 🔌 **Offline persistence (web)** — cache Firestore di browser (`persistentLocalCache`) sehingga data tetap terbaca saat offline.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Styling | NativeWind v4 (Tailwind), font Satoshi |
| Font | Satoshi (Fontshare, TTF di `assets/fonts/`), dimuat via `expo-font` |
| Backend | Firebase Firestore |
| Navigasi | React Navigation (native-stack) |
| State | Zustand |
| Export Excel | SheetJS `xlsx` |
| File (native) | `expo-file-system` (API `File`/`Paths`) + `expo-sharing` |
| Lainnya | `expo-print`, `expo-image-picker`, `react-native-image-picker` |

## Prasyarat

- Node.js (disarankan versi LTS terbaru)
- Expo CLI (opsional, bisa lewat `npx expo`)
- Akun Google / project Firebase

## Instalasi

```bash
# 1. Clone/letakkan project, lalu install dependency
npm install

# 2. (Opsional) pastikan dependency Expo sesuai SDK
npx expo install --fix
```

## Konfigurasi Firebase

Project ini memakai Firebase Auth + Firestore + Storage. Ubah konfigurasi di `src/config/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

Aktifkan layanan:
1. **Firestore Database** — buat collection `products`, `transactions`, `users`, `settings`, `counters`.
2. **Authentication** — aktifkan penyedia **Email/Password**.
3. **(Opsional) Storage** untuk unggah gambar.
4. **Rules (WAJIB sebelum dipakai)** — salin `firestore.rules` di root project ke tab Rules di console, lalu publish. Ringkas aturan:
   - `products`: baca untuk yang login; tulis (buat/hapus & semua field) hanya **admin**; **kasir hanya boleh meng-update field `stock`** (dipakai `processPayment` untuk memotong stok saat transaksi).
   - `transactions`/`counters`: baca/tulis (kasir & admin membuat transaksi).
   - `settings` (QRIS): baca untuk yang login, tulis hanya **admin**.
   - `users`: user boleh tulis/update akunnya sendiri; **admin** boleh baca/tulis semua.

### Bootstrap Akun Pertama

Setelah dijadikan `authenticated` + rules aktif, buka aplikasi → pilih **"Belum punya akun? Buat akun pertama (Admin)"**. Akun pertama otomatis terdaftar sebagai **Admin**. Setelah itu **nonaktifkan pendaftaran publik** di `firestore.rules` (ubah `allow create: if signedIn()` di `users` menjadi `false`, atau hapus mode registrasi di `LoginScreen.js`) dan buat akun kasir lain lewat **Manajemen Pengguna**.

## Menjalankan Aplikasi

```bash
# Web
npm run web

# Android
npm run android

# iOS
npm run ios

# Start dev server (bisa scan QR di Expo Go)
npm start
```

## Build APK (EAS Build)

Project sudah dikonfigurasi untuk build ke Android via **EAS Build**:

- **`app.json`** — identitas & metadata aplikasi:
  - `name` / `slug`: `KasirMobileApp`, `version`: `1.0.0`
  - `android.package`: `com.revvayn.KasirMobileApp` (ID unik untuk Play Store / install)
  - `android.adaptiveIcon`: ikon adaptif (foreground/background/monochrome) Android 8+
  - `plugins`: `expo-sharing`, `expo-font` (modul native yang harus ter-prebuild)
  - `extra.eas.projectId`: `752e380c-5f5e-4117-9947-f8bda78ee050` (harus sama dengan project EAS kamu)
- **`eas.json`** — profil build:
  - `development` → **development client** (`distribution: internal`, `developmentClient: true`) untuk debugging di device tanpa Play Store.
  - `preview` → **APK internal** (`buildType: "apk"`) — distribusi langsung install ke HP lain.
  - `production` → **AAB** untuk Play Store (`autoIncrement: true` — versi naik otomatis tiap build).
  - `cli.appVersionSource: "remote"` — versi dikelola oleh EAS dari project (`app.json` `version` sebagai basis).

### Cara Build

```bash
# 1. Install EAS CLI & login ke akun Expo
npm install -g eas-cli
eas login

# 2. Inisialisasi project EAS (sekali saja, jika projectId belum terhubung)
eas init --id 752e380c-5f5e-4117-9947-f8bda78ee050

# 3. Build APK preview (untuk diinstall langsung / dibagikan)
eas build -p android --profile preview

# 4. Build development client (jalankan di JS lewat npx expo start)
eas build -p android --profile development

# 5. Build production AAB (upload ke Play Store)
eas build -p android --profile production
```

Hasil build muncul di halaman https://expo.dev/accounts/_/projects/KasirMobileApp/builds atau jalan `eas build:list`.

> **Alternatif (tanpa cloud):** untuk APK debug lokal selama pengembangan:
> `npx expo run:android` — menghasilkan APK debug di `android/app/build/outputs/apk/debug/`.
> Catatan: build lokal butuh Android SDK yang terinstal + perangkat/emulator.

### Sebelum Build ke Produksi

- Pastikan `src/config/firebase.js` berisi kunci Firebase yang benar (web SDK). Aplikasi butuh koneksi internet saat build digunakan (sync data ke Firestore).
- Cek `package.json` → `version` + `app.json` → `version` sesuai target rilis.
- Untuk install APK preview di HP, aktifkan "Install from unknown sources" di pengaturan Android.
- Keystore dikelola otomatis oleh EAS (jangan hilangkan `app.json` `android.package`).

## Skema Data Firestore

### `products`

| Field | Tipe | Keterangan |
|---|---|---|
| `name` | string | Nama produk (wajib) |
| `price` | number | Harga jual satuan |
| `cost` | number | Harga modal (opsional, default harga jual) — dasar hitung laba |
| `stock` | number | Jumlah stok |
| `imageUrl` | string | URL foto produk |
| `category` | string | Kategori (opsional) |
| `description` | string | Deskripsi (opsional) |
| `minStock` | number | Ambang **Stok Minimum** (default 5) untuk badge "Menipis" |
| `variants` | array | Varian `[{ id, name, extraPrice }]` — cth. Panas +Rp 0, Dingin +Rp 2.000 (opsional) |
| `modifiers` | array | Modifier `[{ id, name, options: string[] }]` — cth. Level Pedas (opsional) |
| `discountPercent` | number | Diskon produk 0–100 (di-set admin; dipakai otomatis saat dijual) |
| `createdAt` | timestamp | Waktu dibuat |

### `transactions`

| Field | Tipe | Keterangan |
|---|---|---|
| `invoiceNumber` | string | Nomor invoice `INV-YYYYMMDD-NNNN` (counter harian di `counters/invoice-YYYYMMDD`) |
| `items` | array | Daftar keranjang `{ name, qty, price, cost (snapshot modal), variant, modifiers, customNote, unitPrice, subtotal, discountPercent, firestoreDocId, category }` |
| `subtotal` | number | Total semua item (net harga terdiskon produk) |
| `discountPercent` | number | Diskon invoice — selalu 0 (diskon hanya milik produk) |
| `discountAmount` | number | Rupiah diskon invoice — selalu 0 |
| `totalAmount` | number | Total akhir yang dibayar (net item terdiskon) |
| `paymentMethod` | string | `CASH` / `QRIS` |
| `paymentAmount` | number | Uang yang dibayar |
| `cashReceived` | number | Alias uang yang dibayar (konsisten dengan detail struk) |
| `change` | number | Kembalian |
| `cashier` | object | `{ uid, email }` kasir yang menginput (dipakai filter rekap per user) |
| `createdAt` | timestamp | Waktu transaksi (serverTimestamp) |
| `formattedTime` | string | Waktu terformat (dihitung saat insert) |

> **Penting:** `processPayment` memotong stok produk secara atomis lewat `writeBatch` + `increment(-qty)`. Setiap `item` menyimpan snapshot `cost` saat checkout agar laba historis tetap akurat. Nomor invoice di-generate lewat `runTransaction` di atas dokumen counter harian.

## Struktur Project

```
src/
  config/firebase.js           # Inisialisasi Firebase (Auth + Firestore, offline web)
  theme/colors.js              # Palet warna (sumber kebenaran Tailwind + native)
  theme/theme.js
  navigation/AppNavigator.js   # Stack navigator + gate login (LoginScreen vs stack)
  screens/                     # Login, Home, Dashboard, History, ProductManager,
                               # Payment, QRISSetting, TransactionDetail, Closing,
                               # UserManager
  components/
    FilterBar.js               # Filter periode (Hari Ini/Bulan/Tahun/Semua/Tanggal/Rentang) + chip cepat
    DateField.js               # Field tanggal lintas platform (web: input date, native: date picker OS)
    ProductOptionModal.js      # Modal pilih varian/modifier/catatan + diskon item
    CartItemsSheet.js          # Bottom sheet edit per-kombinasi di keranjang
  services/
    productService.js          # CRUD produk
    transactionService.js      # Transaksi + statistik + delete batch
    paymentService.js          # Payment + invoice counter + QRIS
    authService.js             # Auth email/password + role admin/kasir
  store/
    useCartStore.js            # Zustand store keranjang (persisted "kasir-cart")
    useAuthStore.js            # Zustand store sesi (user + role)
  utils/
    currency.js                # Format Rupiah (input live + parse + normalisasi)
    cartLabel.js               # Label varian/modifier/catatan (badge & struk)
    exportExcel.js             # Export transaksi ke .xlsx
    receiptHtml.js             # Builder HTML struk (dipakai semua layar cetak)
```

## Screen Baru

| Screen | Fungsi | Akses |
|---|---|---|
| **Login** | Masuk email/password; mode "buat akun pertama" untuk bootstrap Admin | Publik |
| **Closing** | Rekap shift/harian (total, tunai, QRIS, laba, per kategori, per kasir) + cetak/share PDF | Semua user login |
| **UserManager** | Buat/hapus akun, ubah role & nama kasir | Admin |

## Menjalankan Build Web

```bash
npm run build:web   # = npx expo export --platform web
```

## Screens & Alur

| Screen | Fungsi |
|---|---|
| **Login** | Autentikasi email/password; bootstrap akun admin pertama |
| **Home** | Katalog produk 2 kolom **per kategori** + keranjang (persisted), harga terdiskon; kasir hanya melihat menu ini + Rekap |
| **Dashboard** | Ringkasan laporan, laba/margin, pendapatan per kategori, produk terlaris, transaksi terbaru (admin) |
| **History** | Riwayat transaksi, pagination, reprint struk, hapus, export Excel (admin) |
| **ProductManager** | CRUD produk dengan modal bottom sheet (Stok Minimum + Diskon 0–100%) (admin) |
| **Payment** | Input bayar tunai/QRIS, auto-refresh QRIS, ringkasan pesanan, cetak struk |
| **QRISSetting** | Pengaturan QRIS (admin) |
| **TransactionDetail** | Detail transaksi setelah sukses (invoice number, diskon, cetak PDF) |
| **Closing** | Rekap shift/harian — filter tanggal & user kasir (kasir hanya akunnya sendiri) + cetak/share |
| **UserManager** | Manajemen pengguna — CRUD lengkap (admin) |

## Konvensi Desain

- Palet: `bg #F6F3EE` (krem), `surface #FFFFFF`, `ink #20201D`, `primary #1F1D1B`, `accent #FF7A29`, `success`, `danger`. Ikon selalu melewati `colors.*`, tidak hardcode.
- Kartu: radius besar (`rounded-2xl`/`rounded-card`), border `hairline`, shadow ringan.
- Header layar: kotak `bg-surface` `rounded-b-[28px]`, judul + ikon 40px, search bar.
- Tombol aksi ikon `w-10 h-10 rounded-2xl` dengan bg tint: `*-soft`.
- Alert/konfirmasi memakai pola lintas-platform: `window.alert`/`window.confirm` di web, `Alert.alert` di native.

## Font

Aplikasi memakai **Satoshi** (lisensi bebas dari Fontshare). File TTF ada di `assets/fonts/` (Regular, Medium, Bold, Black, Light) dan dimuat di `App.js` lewat `expo-font` (`useFonts`). Kelas Tailwind `font-bold`, `font-extrabold`, `font-medium`, dst. dipetakan ke file Satoshi yang sesuai via plugin di `tailwind.config.js`. Struk cetak (TransactionDetail) tetap memakai `Courier New` agar tampil seperti struk asli.

## Lisensi

Project pribadi — silakan sesuaikan kebutuhan Anda sendiri.