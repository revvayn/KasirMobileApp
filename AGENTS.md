# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

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
