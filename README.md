# KasirMobileApp

Aplikasi kasir (POS) berbasis **Expo SDK 57** (React Native + React Native Web) dengan backend **Firebase Firestore**. Menjalankan di Android, iOS, maupun browser.

## Fitur

- 📦 **Katalog & Manajemen Produk** — daftar produk 2 kolom, pencarian, tambah/edit/hapus produk lewat modal bottom sheet, upload foto via URL, statistik stok (menipis/habis), **varian** (cth. Panas/Dingin + tambahan harga) & **modifier** (cth. Level Pedas).
- 🛒 **Keranjang & Pembayaran** — keranjang pintar memisahkan item beda varian/catatan (Kopi Panas vs Kopi Dingin), modal pilih varian/modifier/catatan, total harga otomatis.
- 💵 **Pembayaran TUNAI & QRIS** — dukungan print struk dan QRIS.
- 📊 **Dashboard Laporan** — Total Pendapatan, Total Transaksi, Item Terjual, Rata-rata Nilai, Item/Transaksi, Produk Terlaris (progress bar), Transaksi Terbaru; filter Hari Ini/Bulan/Tahun/Semua/Tanggal.
- 🧾 **Riwayat Transaksi** — pagination, lihat detail, hapus per item / batch per filter.
- 📈 **Export Excel** — ekspor laporan transaksi sesuai filter ke file `.xlsx` (2 sheet: Transaksi & Detail Penjualan). Berjalan di web (unduh langsung) & native (share sheet).
- ⚡ **Stok atomis** — stok produk otomatis berkurang saat transaksi dibuat (`writeBatch` + `increment`).

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

Project ini memakai Firebase secara langsung (tanpa dashboard auth). Ubah konfigurasi di `src/config/firebase.js`:

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
1. **Firestore Database** — buat collection `products` dan `transactions`.
2. **(Opsional) Storage** untuk unggah gambar.
3. Sesuaikan aturan keamanan (untuk pengembangan bisa `if false` / authenticated — sesuaikan kebutuhan Anda).

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
| `variants` | array | Varian `[{ id, name, extraPrice }]` — cth. Panas +Rp 0, Dingin +Rp 2.000 (opsional) |
| `modifiers` | array | Modifier `[{ id, name, options: string[] }]` — cth. Level Pedas (opsional) |
| `createdAt` | timestamp | Waktu dibuat |

### `transactions`

| Field | Tipe | Keterangan |
|---|---|---|
| `items` | array | Daftar keranjang `{ name, qty, price, cost (snapshot modal), variant, modifiers, customNote, unitPrice, subtotal, firestoreDocId }` |
| `totalAmount` | number | Total transaksi |
| `paymentMethod` | string | `CASH` / `QRIS` |
| `paymentAmount` | number | Uang yang dibayar |
| `cashReceived` | number | Alias uang yang dibayar (konsisten dengan detail struk) |
| `change` | number | Kembalian |
| `createdAt` | timestamp | Waktu transaksi (serverTimestamp) |
| `formattedTime` | string | Waktu terformat (dihitung saat insert) |

> **Penting:** `createTransaction`/`processPayment` memotong stok produk secara atomis lewat `writeBatch` + `increment(-qty)`. Setiap `item` menyimpan snapshot `cost` saat checkout agar laba historis tetap akurat.

## Struktur Project

```
src/
  config/firebase.js           # Inisialisasi Firebase
  theme/colors.js              # Palet warna (sumber kebenaran Tailwind + native)
  theme/theme.js
  navigation/AppNavigator.js   # Stack navigator
  screens/                     # Home, Dashboard, History, ProductManager,
                               # Payment, QRISSetting, TransactionDetail
  components/FilterBar.js      # Filter periode (Hari Ini/Bulan/Tahun/Semua/Tanggal)
  components/ProductOptionModal.js # Modal pilih varian/modifier/catatan
  services/
    productService.js          # CRUD produk
    transactionService.js      # Transaksi + statistik + delete batch
    paymentService.js
  store/useCartStore.js        # Zustand store keranjang (unique cartId per varian)
  utils/currency.js           # Format Rupiah (input live + parse + normalisasi)
  utils/cartLabel.js          # Label varian/modifier/catatan (badge & struk)
  utils/exportExcel.js        # Export transaksi ke .xlsx
```

## Screens & Alur

| Screen | Fungsi |
|---|---|
| **Home** | Katalog produk 2 kolom, search, navigasi chips, keranjang, floating checkout |
| **Dashboard** | Ringkasan laporan + filter + produk terlaris + transaksi terbaru |
| **History** | Riwayat transaksi, pagination, hapus, export Excel |
| **ProductManager** | CRUD produk dengan modal bottom sheet |
| **Payment** | Input bayar tunai/QRIS, ringkasan pesanan (varian/badge), print struk |
| **QRISSetting** | Pengaturan QRIS |
| **TransactionDetail** | Detail transaksi setelah sukses |

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