// Utilitas format mata uang (Rupiah) — sumber kebenaran untuk
// input nominal (live formatting dengan pemisah ribuan) & tampilan.

/**
 * Format angka untuk tampilan, mis. 1500000 -> "Rp 1.500.000".
 */
export const formatRupiah = (value) =>
  `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`;

/**
 * Format teks input nominal secara live.
 * Menghapus karakter non-digit lalu menambahkan pemisah ribuan (titik)
 * dan prefix "Rp " sehingga kelihatan langsung saat user mengetik.
 *
 * Contoh: "50000" -> "Rp 50.000"
 */
export const formatRupiahInput = (text, { prefix = true } = {}) => {
  const digits = String(text || '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  const number = digits === '' ? 0 : parseInt(digits, 10);
  const formatted = number.toLocaleString('id-ID');
  return prefix ? `Rp ${formatted}` : formatted;
};

/**
 * Parsing teks hasil format kembali menjadi angka.
 * "Rp 1.500.000" -> 1500000. Mengembalikan 0 jika kosong.
 */
export const parseRupiahInput = (text) => {
  const digits = String(text || '').replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
};

/**
 * Normalisasi nilai nominal dari berbagai sumber (number / string berformat)
 * menjadi angka baku. Mendukung "Rp 1.500.000", "1.500.000", 1500000.
 */
export const normalizeMoney = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    const parsed = parseRupiahInput(value);
    return Number.isNaN(parsed) ? fallback : Number(parsed);
  }
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};