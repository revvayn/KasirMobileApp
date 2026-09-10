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
  components/ProductOptionModal.js # Modal pilih varian/modifier/catatan saat kasir tap produk
  services/
    productService.js          # CRUD produk
    transactionService.js      # CRUD transaksi + statistik dashboard + delete batch
    paymentService.js
  store/useCartStore.js        # Zustand store keranjang (unique cartId per varian/catatan)
  utils/
    currency.js                # Format Rupiah (input live + parse + normalisasi)
    exportExcel.js             # Export transaksi ke .xlsx (web & native)
    cartLabel.js               # Label varian/modifier/catatan untuk badge & struk
```

## Format Rupiah (src/utils/currency.js)

- `formatRupiah(value)` — tampilan: `Rp 1.500.000`.
- `formatRupiahInput(text, {prefix})` — format input live dengan pemisah ribuan (titik) + prefix `Rp ` pas user mengetik. Dipakai di field harga (ProductManagerScreen) & nominal uang (PaymentScreen).
- `parseRupiahInput(text)` — balik teks format ke angka (`"Rp 50.000"` → `50000`).
- `normalizeMoney(value, fallback)` — normalisasi nominal number/string berformat jadi angka baku; dipakai `createTransaction` di `transactionService.js` (totalAmount/paymentAmount/change).
- PENTING: saat menyimpan, jangan kirim string terformat ke Firestore — selalu `parseRupiahInput`/`normalizeMoney` dulu agar tersimpan angka (jika `Number("Rp 50.000")` => `NaN`).

## Skema Data Firestore

- `products` : `{ name, price, cost (harga modal), stock, imageUrl, category, description, createdAt }` — `cost` opsional; jika kosong default = harga jual, dipakai hitung laba. `variants` & `modifiers` opsional (produk sembako/ritel boleh tanpa keduanya):
  - `variants`: `[{ id, name, extraPrice }]` — varian dengan tambahan harga, cth. Panas +Rp 0, Dingin +Rp 2.000.
  - `modifiers`: `[{ id, name, options: string[] }]` — grup pilihan catatan, cth. Level Pedas ["Normal","Pedas","Pedas Banget"]. Saat save, `extraPrice` diparsing dulu dengan `parseRupiahInput`.
- `transactions` : berisi `items` (array keranjang, tiap item menyimpan snapshot `cost`, `variant`, `modifiers`, `customNote`, `unitPrice` saat checkout), `totalAmount`, `paymentMethod` (`CASH`/`QRIS`), `change`, `paymentAmount`, `cashReceived`, `createdAt` (serverTimestamp), `formattedTime` (string, dihitung saat insert).

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
- Katalog produk **2 kolom dikelompokkan per kategori** (SectionList; baris 2 kolom dirakit manual karena SectionList/RNW tidak mendukung `numColumns`). Header + search bar. Keranjang (Zustand `useCartStore`, persistence `kasir-cart`). `getDocId(item)` = `firestoreDocId || id || docId`.
- Klik produk: jika punya `variants`/`modifiers` → buka `ProductOptionModal` (mode **batch**); jika sembako/ritel → langsung `addToCart` tanpa modal. Di kartu produk tampil badge opsi item ke-1 yang sudah dikeranjangkan (label bisa diketuk untuk membuka modal lagi).

### ProductOptionModal (src/components/ProductOptionModal.js)
- Modal bottom sheet **mode batch**: 1 varian, checklist pilihan per modifier, catatan manual, stepper jumlah — lalu tombol **"Tambah ke Daftar"** memasukkan pilihan × qty ke daftar pesanan (kombinasi identik digabung). Lane berbeda varian/opsi/catatan bisa ditambah bergantian **tanpa keluar modal** (cth. 2 nasi goreng pedas + 1 normal). Tombol **"Masukkan N Item ke Keranjang"** meng-commit semua ke `addToCart`.
- Baca prop `existingCartQty` (jumlah produk ini di keranjang) untuk membatasi stok: `remainingStock = product.stock - existingCartQty - batchQty`; commit dibatalkan bila `stockExceeded`.
- Harga: `(hargaDasar + extraPriceVarian) * quantity` dengan `calcUnitPrice` (diskon produk dilekatkan). `onConfirm(line)` me-return hasil `addToCart`; jika `!ok` (STOCK_LIMIT) modal tidak ditutup.
- Default pilihan: varian pertama (jika ada), opsi pertama tiap modifier.

### useCartStore (src/store/useCartStore.js)
- `addToCart(product, options)` membangun `cartId` unik dari `productDocId + variantId + modifiers.join() + customNote`. Kombinasi sama → qty bertambah; beda varian/catatan → item terpisah.
- Item menyimpan snapshot `variant`, `modifiers`, `customNote`, `unitPrice` (harga akhir per unit), `cost`, `subtotal`, `stock` (limit qty).
- Aksi: `addToCart`, `increaseQty`, `decreaseQty`, `removeFromCart`, `clearCart`, `getTotalPrice`. `addToCart`/`increaseQty` me-return `{ ok, reason: 'STOCK_LIMIT' }` bila melewati stok.
- Label badge/struk dibuat via `src/utils/cartLabel.js` (`getItemOptionsLabel`).

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
- Form tambah/edit dalam **Modal bottom sheet** (native `Modal` animationType slide) — pola yang dipilih agar list tetap rapi (badan form di dalam `ScrollView`, header/tombol tetap di bawah).
- Seksi dinamis **Varian** (nama + tambahan harga `+Rp`, diformat `formatRupiahInput`, diparsing `parseRupiahInput` saat save) dan **Modifier** (nama grup + daftar opsi; tambah/hapus baris). Produk sembako/ritel cukup kosongkan seksi ini.
- Validasi wajib: nama, harga jual ≥ 0, stok ≥ 0; **Harga Modal (Rp)** opsional (default = harga jual jika kosong). Konfirmasi hapus sebelum dieksekusi.
- Field **Stok Minimum** (`minStock`, default 5): dipakai stat "Stok Menipis" & badge "Menipis"/"Habis" di list. `addProduct`/`updateProduct` menerima `minStock`.
- Field **Diskon Produk** (`discountPercent`, 0–100 dalam kelipatan 5): dipilih lewat **ScrollView horizontal** ("geser ke samping 0%–100%"). Diskon MELEKAT pada produk dan otomatis dipakai saat kasir menjual; list produk & HomeScreen menampilkan badge `-X%`. `addProduct`/`updateProduct` menerima `discountPercent`.

### Auth & Role (baru sejak sesi ini)
- Firebase **Email/Password** (`src/config/firebase.js` export `auth`). `App.js` subscribe `onAuthStateChanged` → restore sesi ke `useAuthStore`.
- `AppNavigator` **gate login**: jika `!user` render `LoginScreen` (di luar stack), jika `loading` render `null`.
- Role disimpan di doc `users/{uid}` → `role: 'admin' | 'kasir'` (`ensureUserRole`). **Bootstrap**: user PERTAMA yang terdaftar otomatis Admin (via `registerUser` di LoginScreen); berikutnya jadi kasir.
- **Menu per role (HomeScreen.navItems)**: `admin` melihat Semua menu (Dashboard, Kelola Produk, Riwayat, QRIS, Rekap, Manajemen Akun). `kasir` HANYA **katalog produk** + **Rekap** (menu admin `adminOnly: true` disembunyikan, difilter `isAdmin`). Screen lain tetap di navigator tapi tak punya pintu untuk kasir.
- Rules wajib deploy: `firestore.rules` di root. Baca → semua yang login; tulis `users` → pemilik/`isAdmin()`; tulis `settings` → admin; update `products` → admin **atau hanya field `stock`** (kasir, dipakai `processPayment`); `transactions`/`counters` → siapa saja yang login. Nonaktifkan pendaftaran publik di `users` setelah bootstrap (lihat README).

### Diskon (milik PRODUCT, bukan keranjang)
- Admin set diskon per produk di **ProductManagerScreen** (`discountPercent` 0–100 via `@react-native-community/slider`, step 5). Diskon tersimpan di dokumen produk.
- `useCartStore.addToCart` membaca `product.discountPercent` sendiri — kasir TIDAK bisa memilih diskon di `ProductOptionModal`/`CartItemsSheet` (UI diskon per-item di keranjang sudah DIHAPUS).
- `calcUnitPrice = round((basePrice + extraPrice) * (1 - pct/100))` (export dari useCartStore). Item keranjang menyimpan snapshot `discountPercent` (dari produk) agar struk/Excel/receipt tetap valid.
- **TIDAK ada diskon invoice** (UI di `PaymentScreen` sudah DIHAPUS). `totalAmount` = total net item terdiskon. `Transaction.discountPercent/discountAmount` = 0. Struk/Excel menampilkan diskon item dari snapshot `items[].discountPercent` (`getItemsDiscountAmount`).

### Nomor Invoice & Reprint
- Format `INV-YYYYMMDD-NNNN` dari `runTransaction` pada `counters/invoice-YYYYMMDD` di `processPayment`.
- `utils/receiptHtml.js`: `buildReceiptHtml(transaction)` (html struk, font `Courier New`) + `getInvoiceNumber(transaction)` + `getItemsDiscountAmount(items)`. Dipakai `TransactionDetailScreen` (prints & share PDF), `HistoryScreen` (reprint per baris, tombol `print` hijau-accent), `ClosingScreen`.

### ClosingScreen (Rekap Shift/Harian)
- Tombol di `DashboardScreen` header → navigasi `Closing`. FILTER: **tanggal** (default hari ini) + **user** untuk admin (chip "Semua User"/pilih kasir dari `listUsers`); kasir terkunci ke akunnya sendiri (`useAuthStore.user.uid`).
- Ringkasan: total/tunai/QRIS/laba, breakdown **per kategori** (`item.category`) & **per kasir** (`transaction.cashier.uid`). `processPayment` menyimpan `cashier: {uid,email,displayName}` dari `options.cashier` (dikirim PaymentScreen dari `useAuthStore`).
- Tombol share/cetak PDF via `Print.printToFileAsync` + `Sharing.shareAsync`. `buildClosingHtml` menyertakan label user & tanggal.

### useAuthStore & Cart Persist
- `useAuthStore`: `user`, `role`, `loading`, `refreshRole`, `logout` (persist ke AsyncStorage key `"kasir-auth"`).
- `useCartStore` persist key **`"kasir-cart"`**: keranjang TIDAK dibersihkan saat ganti screen/app restart; hanya setelah `processPayment` sukses atau tombol `delete-sweep` di floating checkout bar. `getTotalPrice` tidak ada — hitung via `items.reduce(subtotal)`.

### Offline Persistence (Web Only)
- `firebase.js`: platform `web` pakai `initializeFirestore` + `persistentLocalCache({tabManager: persistentSingleTabManager})`; native tetap `getFirestore`. Jangan pakai `enableIndexedDbPersistence` (deprecated di SDK v12).

## Export Excel (src/utils/exportExcel.js)

- `exportTransactionsToExcel(transactions, label)` — menghasilkan `.xlsx` dengan 2 sheet:
  1. `Transaksi` — ringkasan per transaksi (No, **Nomor Invoice**, Tanggal, Metode, Jumlah Item, Subtotal, **Diskon**, Total, Harga Modal, Laba Kotor, Uang Diterima, Kembalian).
  2. `Detail Penjualan` — satu baris per item produk (No, Nomor Invoice, Nama Produk, Harga Satuan, Qty, Subtotal, Laba).
- **Web**: `XLSX.writeFile` → unduhan langsung browser.
- **Native**: `XLSX.write` (base64) → `new File(Paths.cache, filename)` (`create({overwrite:true, intermediates:true})` + `write(base64, {encoding:'base64'})`) → `Sharing.shareAsync(file.uri)`.
- Nama file dibersihkan (`sanitizeFilename`) + timestamp. Impor API SDK 57 dari `expo-file-system`: `import { File, Paths } from 'expo-file-system'`.
- Laba dihitung dari `item.cost` snapshot di transaksi (transaksi lama tanpa `cost` dianggap 0). Biarkan `buildWorkbook` internal dikembangkan jika kolom report berubah. `formatRupiah` diexport juga untuk dipakai screen lain.

## Konvensi Lintas Platform (Web + Native)

- Alert: `showAlert(title, message)` — pakai `window.alert` di web, `Alert.alert` di native. Contoh di HomeScreen/HistoryScreen.
- Konfirmasi hapus: `window.confirm` di web, `Alert.alert` dengan tombol destructive di native.
- `FilterBar` memakai `<input type="date">` di web dan `TextInput` di native; chip **Rentang** memakai dua input `rangeStart`/`rangeEnd` (`YYYY-MM-DD`).
- Hindari hardcode warna — gunakan `colors.*` agar konsisten semua platform.

## Scripts (package.json)

- Tidak ada lint/typecheck. Verifikasi via `npm run build:web` (`expo export --platform web`) — harus sukses sebelum menyerahkan kode.