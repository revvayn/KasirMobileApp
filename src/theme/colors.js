// Nilai warna mentah dipakai di dua tempat:
// 1. tailwind.config.js (di-extend ke palet Tailwind)
// 2. Komponen native yang butuh warna langsung, bukan className
//    (ActivityIndicator color, placeholderTextColor, dll — properti ini
//    tidak bisa di-style lewat className karena bukan bagian dari style tree)

module.exports = {
  bg: '#F6F3EE',
  surface: '#FFFFFF',
  'surface-alt': '#FBF3E9',
  ink: '#20201D',
  'ink-muted': '#8A8378',
  primary: '#1F1D1B',
  accent: '#FF7A29',
  'accent-soft': '#FFE7D3',
  success: '#1F8A4C',
  'success-soft': '#E4F4EA',
  danger: '#D64545',
  'danger-soft': '#FBE7E7',
  hairline: '#ECE6DC',
};
