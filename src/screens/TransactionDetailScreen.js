import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform 
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function TransactionDetailScreen({ route, navigation }) {
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { transaction } = route.params || {};

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Data transaksi tidak ditemukan.</Text>
        <TouchableOpacity style={styles.btnBack} onPress={() => navigation.navigate('History')}>
          <Text style={styles.btnText}>Ke Riwayat Transaksi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rawItems = Array.isArray(transaction.items) ? transaction.items.flat() : [];

  // Helper Alert Lintas Platform
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // HTML Template untuk Struk Thermal 58mm / A4 PDF
  const generateReceiptHTML = () => {
    const itemsHtml = rawItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 4px 0; font-size: 12px;">${item?.name || item?.nama || 'Produk'} x${item?.qty || item?.quantity || 1}</td>
          <td style="padding: 4px 0; font-size: 12px; text-align: right;">Rp ${(
            Number(item?.subtotal || (item?.price * (item?.qty || 1)) || 0)
          ).toLocaleString('id-ID')}</td>
        </tr>
      `
      )
      .join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 280px; 
              margin: 0 auto; 
              padding: 10px; 
            }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .row-flex { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin: 0;">STRUK PENJUALAN</h2>
            <p style="font-size: 10px; margin: 2px 0;">ID: #${transaction.id ? String(transaction.id).substring(0, 10) : 'N/A'}</p>
            <p style="font-size: 10px; margin: 2px 0;">${transaction.formattedTime || new Date().toLocaleString('id-ID')}</p>
          </div>

          <div class="divider"></div>

          <table>
            ${itemsHtml}
          </table>

          <div class="divider"></div>

          <div class="row-flex">
            <span>Metode:</span>
            <span class="bold">${transaction.paymentMethod || 'CASH'}</span>
          </div>
          <div class="row-flex" style="font-size: 14px; margin-top: 4px;">
            <span class="bold">TOTAL:</span>
            <span class="bold">Rp ${Number(transaction.totalAmount || 0).toLocaleString('id-ID')}</span>
          </div>

          ${
            transaction.paymentMethod === 'CASH'
              ? `
            <div class="row-flex">
              <span>Bayar:</span>
              <span>Rp ${Number(transaction.cashReceived || transaction.totalAmount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div class="row-flex">
              <span>Kembali:</span>
              <span>Rp ${Number(transaction.change || 0).toLocaleString('id-ID')}</span>
            </div>
          `
              : ''
          }

          <div class="divider"></div>
          <div class="text-center" style="margin-top: 10px; font-size: 11px;">
            <p style="margin: 0;">Terima Kasih</p>
            <p style="margin: 2px 0;">Selamat Belanja Kembali!</p>
          </div>
        </body>
      </html>
    `;
  };

  // 1. Eksekusi Cetak Resi
  const handlePrint = async () => {
    try {
      setPrinting(true);
      const html = generateReceiptHTML();

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Gagal mencetak struk:', error);
      showAlert('Gagal Cetak', 'Terjadi kesalahan saat menghubungkan ke printer.');
    } finally {
      setPrinting(false);
    }
  };

  // Eksekusi Unduh / Share Resi PDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const html = generateReceiptHTML();

      // 1. Penanganan khusus untuk platform Web
      if (Platform.OS === 'web') {
        showAlert('Simpan PDF di Web', 'Gunakan tombol "Cetak Struk", lalu ubah tujuan printer menjadi "Save as PDF" / "Simpan sebagai PDF".');
        setDownloading(false);
        return;
      }

      // 2. Eksekusi untuk platform Mobile (Android / iOS)
      const pdfFile = await Print.printToFileAsync({ html });

      if (!pdfFile || !pdfFile.uri) {
        throw new Error('Gagal menghasilkan file PDF.');
      }

      // Cek ketersediaan fitur Sharing
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(pdfFile.uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Simpan atau Bagikan Resi PDF',
        });
      } else {
        showAlert('Informasi', `PDF berhasil disimpan di: ${pdfFile.uri}`);
      }
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      showAlert('Gagal Unduh', 'Terjadi kesalahan saat membuat dokumen PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Rincian Transaksi</Text>
        <Text style={styles.transId}>ID: #{transaction.id ? String(transaction.id).substring(0, 10) : 'N/A'}</Text>
        <Text style={styles.timeText}>🕒 {transaction.formattedTime || 'Baru Saja'}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>Produk Dibeli:</Text>
        {rawItems.map((item, index) => (
          <View key={item?.firestoreDocId || item?.id || index} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item?.name || item?.nama || 'Produk'} x{item?.qty || item?.quantity || 1}
            </Text>
            <Text style={styles.itemSubtotal}>
              Rp {Number(item?.subtotal || (item?.price * (item?.qty || 1)) || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Metode Pembayaran:</Text>
          <Text style={styles.infoValue}>{transaction.paymentMethod}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Tagihan:</Text>
          <Text style={styles.totalValue}>
            Rp {Number(transaction.totalAmount || 0).toLocaleString('id-ID')}
          </Text>
        </View>

        {transaction.paymentMethod === 'CASH' && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Uang Diterima:</Text>
              <Text style={styles.infoValue}>
                Rp {Number(transaction.cashReceived || transaction.totalAmount || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kembalian:</Text>
              <Text style={styles.changeValue}>
                Rp {Number(transaction.change || 0).toLocaleString('id-ID')}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {/* Tombol Cetak Resi */}
        <TouchableOpacity 
          style={[styles.btnPrint, printing && styles.btnDisabled]} 
          onPress={handlePrint}
          disabled={printing || downloading}
        >
          {printing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrintText}>🖨️ Cetak Struk</Text>
          )}
        </TouchableOpacity>

      </View>

      {/* Tombol Kembali ke Riwayat */}
      <TouchableOpacity style={styles.btnHistory} onPress={() => navigation.navigate('History')}>
        <Text style={styles.btnHistoryText}>📜 Lihat Semua Riwayat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, elevation: 2, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  transId: { fontSize: 13, color: '#666', marginTop: 2 },
  timeText: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  sectionHeader: { fontWeight: 'bold', color: '#555', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: 14, color: '#333', flex: 1 },
  itemSubtotal: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  infoLabel: { color: '#666', fontSize: 14 },
  infoValue: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  totalValue: { fontWeight: 'bold', color: '#2e7d32', fontSize: 16 },
  changeValue: { fontWeight: 'bold', color: '#d32f2f', fontSize: 14 },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  btnPrint: { flex: 1, backgroundColor: '#2e7d32', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDownload: { flex: 1, backgroundColor: '#0288d1', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnPrintText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnDownloadText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnHistory: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  btnHistoryText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  btnBack: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});