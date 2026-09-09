import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatRupiah } from './currency';

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Menyusun semua baris data untuk lembar kerja dari daftar transaksi.
 * Menghasilkan dua sheet: "Transaksi" (ringkasan per transaksi) dan
 * "Detail Penjualan" (satu baris per item produk).
 */
const buildWorkbook = (transactions) => {
  const transRows = [
    [
      'No',
      'Nomor Invoice',
      'Tanggal / Waktu',
      'Metode Pembayaran',
      'Jumlah Item',
      'Subtotal',
      'Diskon',
      'Total',
      'Harga Modal',
      'Laba Kotor',
      'Uang Diterima',
      'Kembalian',
    ],
  ];

  const detailRows = [
    ['No', 'Nomor Invoice', 'Nama Produk', 'Harga Satuan', 'Qty', 'Subtotal', 'Laba'],
  ];

  transactions.forEach((tx, index) => {
    const rawItems = Array.isArray(tx.items) ? tx.items.flat() : [];
    const itemCount = rawItems.reduce(
      (sum, it) => sum + (Number(it.qty || it.quantity) || 0),
      0
    );
    const txId = tx.firestoreDocId || tx.id || tx.docId || '';
    const invoice = tx.invoiceNumber || (txId ? `#${String(txId).substring(0, 8)}` : 'N/A');

    let transCost = 0;
    let transProfit = 0;
    let subtotal = 0;
    let discount = Number(tx.discountAmount || 0) || 0;
    rawItems.forEach((it) => {
      const qty = Number(it.qty || it.quantity) || 1;
      const unitCost = Number(it.cost || it.hargaModal || 0) || 0;
      const itSubtotal = Number(it.subtotal || (it.price * qty)) || 0;
      subtotal += itSubtotal;
      transCost += unitCost * qty;
      transProfit += itSubtotal - unitCost * qty;
      const discPct = Number(it.discountPercent || 0);
      if (discPct > 0) {
        const rawUnit = Number(it.price || 0) + Number(it.variant?.extraPrice || 0);
        discount += (rawUnit - Math.round(rawUnit * (1 - discPct / 100))) * qty;
      }
    });

    transRows.push([
      index + 1,
      invoice,
      tx.formattedTime || '',
      tx.paymentMethod || 'CASH',
      itemCount,
      subtotal,
      discount || 0,
      Number(tx.totalAmount) || 0,
      transCost,
      transProfit,
      Number(tx.paymentAmount) || Number(tx.cashAmount) || Number(tx.cashReceived) || 0,
      Number(tx.change) || 0,
    ]);

    rawItems.forEach((it, itemIdx) => {
      const qty = Number(it.qty || it.quantity) || 1;
      const unitCost = Number(it.cost || it.hargaModal || 0) || 0;
      const subtotalItem = Number(it.subtotal || (it.price * qty)) || 0;
      detailRows.push([
        `${index + 1}.${itemIdx + 1}`,
        invoice,
        it.name || it.nama || 'Tanpa Nama',
        Number(it.unitPrice || it.price) || 0,
        qty,
        subtotalItem,
        subtotalItem - unitCost * qty,
      ]);
    });
  });

  const wb = XLSX.utils.book_new();

  const transSheet = XLSX.utils.aoa_to_sheet(transRows);
  transSheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, transSheet, 'Transaksi');

  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
  detailSheet['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Detail Penjualan');

  return wb;
};

const sanitizeFilename = (name) =>
  (name || 'laporan_transaksi')
    .replace(/[^\w\-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 60);

/**
 * Export daftar transaksi ke file .xlsx (sesuai filter yang diterapkan).
 * - Web: memicu unduhan via browser.
 * - Mobile: menulis file di cache lalu membuka share sheet.
 */
export const exportTransactionsToExcel = async (transactions, label = 'laporan_transaksi') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('Tidak ada data untuk diexport.');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${sanitizeFilename(label)}_${timestamp}.xlsx`;

  try {
    const wb = buildWorkbook(transactions);

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
      return { filename };
    }

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx', compression: true });
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true, intermediates: true });
    file.write(base64, { encoding: 'base64' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: MIME_XLSX,
        dialogTitle: 'Export Laporan Transaksi',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    }
    return { filename };
  } catch (error) {
    console.error('Gagal membuat file Excel:', error);
    throw error;
  }
};

export { formatRupiah };