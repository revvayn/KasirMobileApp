# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Font: Satoshi

- Seluruh UI memakai font **Satoshi** (Fontshare, Free License — file di `assets/fonts/`).
- Font didaftarkan di `App.js` via `expo-font` (`useFonts`) dengan nama: `SatoshiRegular`, `SatoshiMedium`, `SatoshiBold`, `SatoshiBlack`, `SatoshiLight`.
- Pemetaan kelas Tailwind diformat via **plugin di `tailwind.config.js`** (bukan core `font-weight`), karena native TIDAK bisa menebalkan file font statis:
  - `font-thin`/`font-light` → `SatoshiLight`
  - `font-normal` → `SatoshiRegular`
  - `font-medium`/`font-semibold` → `SatoshiMedium`
  - `font-bold` → `SatoshiBold`
  - `font-extrabold`/`font-black` → `SatoshiBlack`
- Hasil kompilasi CSS: kelas `font-*` menyimpan BOTH `font-weight` DAN `font-family: Satoshi*`.
- `global.css`: base `font-family: SatoshiRegular` untuk web. `src/theme/theme.js` (`type.*`) memakai `fontFamily` Satoshi untuk pemakaian native non-Tailwind.
- `AppNavigator` header title memakai `SatoshiBold`.
- PENTING: saat menambah weight/font baru, daftarkan file `.ttf` di `App.js` + tambahkan mapping di plugin tailwind. Struk cetak (TransactionDetail) sengaja memakai `Courier New` (monospace) agar tampil seperti struk.

## Icons

- Icon library: `@expo/vector-icons` (sudah terpasang sebagai dependency, versi ~15.x untuk SDK 57).
- Gunakan `MaterialIcons` untuk ikon UI. Contoh di `src/screens/HomeScreen.js`:
  ```js
  import { MaterialIcons } from '@expo/vector-icons';
  import colors from '../theme/colors';

  <MaterialIcons name="bar-chart" size={20} color={colors.accent} />
  ```
- Nama ikon navigasi didefinisikan di array `navItems` (HomeScreen) via properti `icon`, lalu dirender di tombol menu.
- Warna ikon ambil dari `src/theme/colors.js` (mis. `colors.accent`), bukan hardcode.
- Jika butuh nama ikon baru, cek daftar valid MaterialIcons di https://icons.expo.fyi/Index/MaterialIcons .

---

# Projects: KasirMobileApp

Aplikasi kasir (POS) Expo SDK 57 (React Native + React Native Web) dengan backend Firebase Firestore. Menjalankan baik di native maupun web (`npm run web`).

## Tech Stack & Dependencies

- **Expo SDK 57** + **React Native 0.86** + **React 19.2**
- **NativeWind v4** — styling via className Tailwind (`tailwind.config.js` extends warna dari `src/theme/colors.js`)
- **React Navigation** native-stack (lihat `src/navigation/AppNavigator.js`)
- **Firebase Firestore** — `src/config/firebase.js`
- **Zustand** (`src/store/useCartStore.js`)
- **SheetJS `xlsx`** — export laporan ke file Excel
- **`expo-file-system`** (SDK 57, API baru `File`/`Directory`/`Paths`) + **`expo-sharing`** — menulis & share file di native
- **`expo-print`**, **`expo-image-picker`**, **`react-native-image-picker`** — dipakai di Payment/QRIS

Catatan: TIDAK ada script lint/typecheck di `package.json`. Verifikasi dengan meninjau kode secara manual / menjalankan aplikasi.

## Struktur Folder

```
src/
  config/firebase.js           # Inisialisasi Firebase
  theme/colors.js              # Palet warna sumber kebenaran (Tailwind + native props)
  theme/theme.js
  navigation/AppNavigator.js   # Stack navigator + judul tiap screen
  screens/                     # HomeScreen, DashboardScreen, HistoryScreen,
                               # ProductManagerScreen (modal), PaymentScreen,
                               # QRISSettingScreen, TransactionDetailScreen
  components/FilterBar.js      # Bar filter periode (Hari Ini/Bulan/Tahun/Semua/Tanggal)
  services/
    productService.js          # CRUD produk
    transactionService.js      # CRUD transaksi + statistik dashboard + delete batch
    paymentService.js
  store/useCartStore.js        # Zustand store keranjang
  utils/
    currency.js                # Format Rupiah (input live + parse + normalisasi)
    exportExcel.js             # Export transaksi ke .xlsx (web & native)
```

## Format Rupiah (src/utils/currency.js)

- `formatRupiah(value)` — tampilan: `Rp 1.500.000`.
- `formatRupiahInput(text, {prefix})` — format input live dengan pemisah ribuan (titik) + prefix `Rp ` pas user mengetik. Dipakai di field harga (ProductManagerScreen) & nominal uang (PaymentScreen).
- `parseRupiahInput(text)` — balik teks format ke angka (`"Rp 50.000"` → `50000`).
- `normalizeMoney(value, fallback)` — normalisasi nominal number/string berformat jadi angka baku; dipakai `createTransaction` di `transactionService.js` (totalAmount/paymentAmount/change).
- PENTING: saat menyimpan, jangan kirim string terformat ke Firestore — selalu `parseRupiahInput`/`normalizeMoney` dulu agar tersimpan angka (jika `Number("Rp 50.000")` => `NaN`).

## Skema Data Firestore

- `products` : `{ name, price, cost (harga modal), stock, imageUrl, category, description, createdAt }` — `cost` opsional; jika kosong default = harga jual, dipakai hitung laba.
- `transactions` : berisi `items` (array keranjang, tiap item menyimpan snapshot `cost` saat checkout), `totalAmount`, `paymentMethod` (`CASH`/`QRIS`), `change`, `paymentAmount`, `cashReceived`, `createdAt` (serverTimestamp), `formattedTime` (string, dihitung saat insert).

PENTING: Dokumen produk wajib punya stok yang cukup — `createTransaction` mengurangi stok produkk secara atomis lewat `writeBatch` + `increment(-qty)`.

## Desain System (UI Convention Modern)

- **Palet**: `bg #F6F3EE` (krem), `surface #FFFFFF` (kartu), `ink #20201D` (teks utama), `ink-muted`, `primary #1F1D1B`, `accent #FF7A29` (oranye), `success`, `danger`.
  Warna ikon TIDAK hardcode — selalu lewat `colors.*` (import `../theme/colors`).
- **Desain kartu**: radius besar (`rounded-card` = 22px, atau `rounded-[20px]/[22px]/[26px]`), `bg-surface`, border `border-hairline` tipis, shadow ringan (`shadow-sm`).
- **Header screens**: kotak putih `bg-surface` dengan `rounded-b-[28px]`, berisi judul + ikon logo-40px (bulat `rounded-2xl` bg-primary), lalu search bar (`MaterialIcons search` + TextInput di `bg-bg` pill) dan/atau tombol aksi.
- **Tombol aksi ikon**: `w-10 h-10 rounded-2xl` dengan bg tint-soft (`bg-success-soft`/`bg-danger-soft`/`bg-accent-soft`) dan ikon warna tint. Tombol utama: `bg-primary rounded-2xl` dengan teks putih bold + ikon.
- **Kartu statistik**: petak kecil dengan badge ikon (`w-8/9 h-8/9 rounded-xl` bg-soft + MaterialIcons warna tint), angka `font-extrabold`, label kecil `text-ink-muted`.
- **Hero/CTA**: kartu `bg-primary rounded-[26px]` dengan dekorasi lingkaran `bg-white/5` di pojok, angka besar `text-[28-30px] font-extrabold`.
- **Empty state**: ikon dalam lingkaran `bg-surface-alt` + teks `text-ink-muted`.
- Aksesibilitas: tombol kecil diberi `hitSlop` bila perlu; teks truncate `numberOfLines={1}` pada nama produk; `adjustsFontSizeToFit` untuk angka besar.

## Detail per Screen (agar konsisten saat dikembangkan)

### HomeScreen
- Katalog produk 2 kolom + keranjang (state lokal, di-reset tiap `navigation focus`).
- Header + search bar, navigasi horizontal (chips), Floating checkout button muncul hanya jika `cart.length > 0`.
- `getDocId(item)` = `firestoreDocId || id || docId`.

### DashboardScreen
- Filter: `FilterBar`. Stats dari `getDashboardStats(filter, customDate)`.
- Hero revenue card + badge Laba & Margin + grid statistik (Laba Kotor, Margin, Total Transaksi, Item Terjual, Rata-rata Nilai, Item/Transaksi) + Produk Terlaris (dengan progress bar) + Transaksi Terbaru.
- `getDashboardStats` mengembalikan juga: `totalCost`, `totalProfit`, `profitMargin` (%). Laba dihitung dari snapshot `item.cost` per transaksi (`getTransactionProfit`).

### HistoryScreen
- Filter + pagination (10/halaman), hapus single & batch-dengan-filter.
- Ringkasan filter: Total Penjualan, Laba Kotor (+margin), Item Terjual, Harga Modal.
- Fitur **Export Excel**: tombol header (ikon hijau) + tombol utama membawa seluruh data `filteredTransactions`.

### ProductManagerScreen
- Daftar produk + statistik mini (Total Produk, Total Stok, Stok Menipis).
- Form tambah/edit dalam **Modal bottom sheet** (native `Modal` animationType slide) — pola yang dipilih agar list tetap rapi.
- Validasi wajib: nama, harga jual ≥ 0, stok ≥ 0; **Harga Modal (Rp)** opsional (default = harga jual jika kosong). Konfirmasi hapus sebelum dieksekusi.

## Export Excel (src/utils/exportExcel.js)

- `exportTransactionsToExcel(transactions, label)` — menghasilkan `.xlsx` dengan 2 sheet:
  1. `Transaksi` — ringkasan per transaksi (No, ID, Tanggal, Metode, Jumlah Item, Total, Harga Modal, Laba Kotor, Uang Diterima, Kembalian).
  2. `Detail Penjualan` — satu baris per item produk (No, ID, Tanggal, Nama Produk, Harga, Harga Modal, Qty, Subtotal, Laba).
- **Web**: `XLSX.writeFile` → unduhan langsung browser.
- **Native**: `XLSX.write` (base64) → `new File(Paths.cache, filename)` (`create({overwrite:true, intermediates:true})` + `write(base64, {encoding:'base64'})`) → `Sharing.shareAsync(file.uri)`.
- Nama file dibersihkan (`sanitizeFilename`) + timestamp. Impor API SDK 57 dari `expo-file-system`: `import { File, Paths } from 'expo-file-system'`.
- Laba dihitung dari `item.cost` snapshot di transaksi (transaksi lama tanpa `cost` dianggap 0). Biarkan `buildWorkbook` internal dikembangkan jika kolom report berubah. `formatRupiah` diexport juga untuk dipakai screen lain.

## Konvensi Lintas Platform (Web + Native)

- Alert: `showAlert(title, message)` — pakai `window.alert` di web, `Alert.alert` di native. Contoh di HomeScreen/HistoryScreen.
- Konfirmasi hapus: `window.confirm` di web, `Alert.alert` dengan tombol destructive di native.
- `FilterBar` memakai `<input type="date">` di web dan `TextInput` di native.
- Hindari hardcode warna — gunakan `colors.*` agar konsisten semua platform.