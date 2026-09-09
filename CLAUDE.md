@AGENTS.md
# CLAUDE.md

## Project

Aplikasi kasir (POS) React Native — katalog produk, keranjang, pembayaran
tunai/QRIS, riwayat transaksi, cetak struk. UI berbahasa Indonesia.
Backend: Firebase Firestore (lihat `src/config/firebase.js`).

## Stack

- Expo SDK 57 (React Native 0.86, Reanimated v4 bawaan)
- NativeWind v4.2.0+ untuk styling — **wajib** >= 4.2.0, versi di bawah itu
  tidak kompatibel dengan Reanimated v4 bawaan SDK 57 (gejalanya: `className`
  diam-diam tidak menghasilkan style apa pun, tanpa error)
- `tailwindcss@^3.4.17` — bukan v4.x. Tailwind v4 hanya untuk NativeWind v5
  (belum dipakai di project ini)
- React Navigation (`@react-navigation/native-stack`)
- `expo-print` / `expo-sharing` untuk cetak & bagikan struk PDF

Install NativeWind dengan `npx expo install` (bukan `npm install` biasa)
supaya versi `react-native-reanimated` & `react-native-safe-area-context`
otomatis disesuaikan dengan SDK 57:

```bash
npx expo install nativewind@^4.2.0 tailwindcss@^3.4.17 react-native-reanimated react-native-safe-area-context
```

## Styling

- Semua styling pakai `className` (utility Tailwind via NativeWind).
  **Jangan** pakai `StyleSheet.create` untuk komponen baru/yang diubah.
- Palet warna terpusat di `src/theme/colors.js`, di-extend ke
  `tailwind.config.js`. Jangan hardcode hex color langsung di komponen.
- Beberapa props native tidak bisa disentuh `className` karena bukan bagian
  dari style tree — ambil warnanya langsung dari `src/theme/colors.js`:
  `ActivityIndicator` (`color`), `TextInput` (`placeholderTextColor`),
  `Stack.Navigator` (`headerStyle`, `headerTintColor`).
- **Tidak pakai emoji di UI.** Untuk identitas visual/ikon, pakai monogram
  huruf dalam badge bulat, dot indicator kecil, atau bentuk geometris polos
  (border, circle) — bukan emoji glyph.
- Tidak ada icon library ter-install (mis. `lucide-react-native`) — jangan
  asumsikan tersedia kecuali sudah dicek di `package.json`.

## Konvensi kode

- Struktur folder: `src/screens`, `src/components`, `src/services`,
  `src/navigation`, `src/store`, `src/theme`.
- Saat restyle/ubah tampilan, **logic tidak boleh ikut berubah** (fetch data,
  perhitungan keranjang, validasi stok, filter, delete, generate struk HTML,
  dll.) — hanya lapisan render/style yang disentuh.
- Bahasa UI dan pesan Alert: Bahasa Indonesia.
- File di `src/services/` berisi `console.log`/`console.error` dengan emoji
  untuk debug internal — itu boleh dibiarkan, tidak tampil ke user, jadi di
  luar aturan "tidak pakai emoji di UI" di atas.

## Known issue: Metro "Cannot read properties of undefined (reading 'transformFile')"

Ini bukan bug di `metro.config.js`/`babel.config.js` project — ini gejala
`metro` atau `@expo/metro-config` ter-duplikasi di `node_modules` (umum
terjadi di Windows setelah menambah dependency baru). Tandanya: traceback
menunjukkan path bersarang seperti
`node_modules\expo\node_modules\@expo\metro-config\...`.

Fix (urutan penting):

```bash
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
npx expo install --fix
npx expo-doctor
npx expo start -c
```

## Referensi

- Setup NativeWind lengkap: `SETUP-TAILWIND.md`
- Troubleshoot error Metro di atas: `TROUBLESHOOT-metro-transformFile.md`