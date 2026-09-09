import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform 
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getTransactionProfit } from '../services/transactionService';
import colors from '../theme/colors';

export default function TransactionDetailScreen({ route, navigation }) {
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { transaction } = route.params || {};

  if (!transaction) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-base text-ink-muted mb-4">Data transaksi tidak ditemukan.</Text>
        <TouchableOpacity className="bg-primary p-3 rounded-2xl" onPress={() => navigation.navigate('History')} activeOpacity={0.9}>
          <Text className="text-white font-bold">Ke Riwayat Transaksi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rawItems = Array.isArray(transaction.items) ? transaction.items.flat() : [];
  const profitData = getTransactionProfit(transaction);

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
    <ScrollView className="flex-1 p-4 bg-bg">
      <View className="bg-surface p-4 rounded-card shadow-md mb-4">
        <Text className="text-lg font-extrabold text-ink">Rincian Transaksi</Text>
        <Text className="text-[13px] text-ink-muted mt-0.5">#{transaction.id ? String(transaction.id).substring(0, 10) : 'N/A'}</Text>
        <Text className="text-xs text-ink-muted mt-0.5">{transaction.formattedTime || 'Baru Saja'}</Text>

        <View className="h-px bg-hairline my-2.5" />

        <Text className="font-bold text-ink mb-2">Produk Dibeli:</Text>
        {rawItems.map((item, index) => (
          <View key={item?.firestoreDocId || item?.id || index} className="flex-row justify-between mb-1.5">
            <Text className="text-sm text-ink flex-1">
              {item?.name || item?.nama || 'Produk'} x{item?.qty || item?.quantity || 1}
            </Text>
            <Text className="text-sm font-bold text-ink">
              Rp {Number(item?.subtotal || (item?.price * (item?.qty || 1)) || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        ))}

        <View className="h-px bg-hairline my-2.5" />

        <View className="flex-row justify-between my-1">
          <Text className="text-ink-muted text-sm">Metode Pembayaran:</Text>
          <Text className="font-bold text-ink text-sm">{transaction.paymentMethod}</Text>
        </View>

        <View className="flex-row justify-between my-1">
          <Text className="text-ink-muted text-sm">Total Tagihan:</Text>
          <Text className="font-extrabold text-success text-base">
            Rp {Number(transaction.totalAmount || 0).toLocaleString('id-ID')}
          </Text>
        </View>

        <View className="flex-row justify-between my-1">
          <Text className="text-ink-muted text-sm">Harga Modal:</Text>
          <Text className="font-bold text-ink text-sm">
            Rp {Number(profitData.cost || 0).toLocaleString('id-ID')}
          </Text>
        </View>
        <View className="flex-row justify-between my-1">
          <Text className="text-ink-muted text-sm">Laba Kotor:</Text>
          <Text className="font-extrabold text-success text-sm">
            Rp {Number(profitData.profit || 0).toLocaleString('id-ID')}
            {profitData.revenue > 0 && (
              <Text className="text-[11px] font-medium text-ink-muted">
                {' '}({profitData.margin.toFixed(1)}%)
              </Text>
            )}
          </Text>
        </View>

        {transaction.paymentMethod === 'CASH' && (
          <>
            <View className="flex-row justify-between my-1">
              <Text className="text-ink-muted text-sm">Uang Diterima:</Text>
              <Text className="font-bold text-ink text-sm">
                Rp {Number(transaction.cashReceived || transaction.totalAmount || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View className="flex-row justify-between my-1">
              <Text className="text-ink-muted text-sm">Kembalian:</Text>
              <Text className="font-bold text-danger text-sm">
                Rp {Number(transaction.change || 0).toLocaleString('id-ID')}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-between mb-2.5 gap-2.5">
        {/* Tombol Cetak Resi */}
        <TouchableOpacity 
          className={`flex-1 bg-primary p-3.5 rounded-2xl items-center ${printing ? 'opacity-60' : ''}`}
          onPress={handlePrint}
          disabled={printing || downloading}
          activeOpacity={0.9}
        >
          {printing ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text className="text-white font-bold text-[15px]">Cetak Struk</Text>
          )}
        </TouchableOpacity>

      </View>

      {/* Tombol Kembali ke Riwayat */}
      <TouchableOpacity className="bg-surface border border-hairline p-3.5 rounded-2xl items-center mb-8" onPress={() => navigation.navigate('History')} activeOpacity={0.85}>
        <Text className="text-ink font-bold text-base">Lihat Semua Riwayat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
