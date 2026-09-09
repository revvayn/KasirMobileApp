// Sistem desain bersama untuk seluruh aplikasi.
// Ganti nilai di sini untuk mengubah tampilan di semua layar sekaligus.

export const colors = {
  // Latar
  bg: '#F6F3EE',          // krem hangat, bukan putih polos
  surface: '#FFFFFF',      // kartu, panel
  surfaceAlt: '#FBF3E9',   // panel aksen lembut (pengganti pastel di referensi)

  // Teks
  ink: '#20201D',          // hitam kebiruan hangat untuk judul
  inkMuted: '#8A8378',     // teks sekunder / caption
  inkOnDark: '#FFFFFF',

  // Aksi
  primary: '#1F1D1B',      // tombol CTA utama, hampir hitam (mengikuti referensi)
  primaryPressed: '#000000',
  accent: '#FF7A29',       // oranye hangat — badge, harga, status terpilih
  accentSoft: '#FFE7D3',

  // Semantik
  success: '#1F8A4C',
  successSoft: '#E4F4EA',
  danger: '#D64545',
  dangerSoft: '#FBE7E7',

  border: '#ECE6DC',
  overlay: 'rgba(32,32,29,0.06)',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const type = {
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontWeight: '500', color: colors.inkMuted },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 14, fontWeight: '500', color: colors.ink },
  caption: { fontSize: 12, fontWeight: '500', color: colors.inkMuted },
  price: { fontSize: 15, fontWeight: '800', color: colors.ink },
};

// Bayangan lembut ala kartu modern (bukan elevation Material default yang keras)
export const shadow = {
  card: {
    shadowColor: '#20201D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: '#20201D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
