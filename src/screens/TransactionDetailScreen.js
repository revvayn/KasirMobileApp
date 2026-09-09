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
import { getItemOptionsLabel } from '../utils/cartLabel';
import { buildReceiptHtml, getInvoiceNumber, getItemsDiscountAmount } from '../utils/receiptHtml';
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
  const itemsDiscount = getItemsDiscountAmount(rawItems);
  const invoiceDiscount = Number(transaction.discountAmount || 0);
  const totalDiscount = itemsDiscount + invoiceDiscount;

  // Helper Alert Lintas Platform
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 1. Eksekusi Cetak Resi
  const handlePrint = async () => {
    try {
      setPrinting(true);
      const html = buildReceiptHtml(transaction);

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
      const html = buildReceiptHtml(transaction);

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
        <Text className="text-[13px] text-ink-muted mt-0.5">{getInvoiceNumber(transaction)}</Text>
        <Text className="text-xs text-ink-muted mt-0.5">{transaction.formattedTime || 'Baru Saja'}</Text>

        <View className="h-px bg-hairline my-2.5" />

        <Text className="font-bold text-ink mb-2">Produk Dibeli:</Text>
        {rawItems.map((item, index) => {
          const optionsLabel = getItemOptionsLabel(item);
          const itemDiscount = Number(item.discountPercent || 0);
          return (
            <View key={item?.firestoreDocId || item?.id || index} className="mb-1.5">
              <View className="flex-row justify-between">
                <Text className="text-sm text-ink flex-1">
                  {item?.name || item?.nama || 'Produk'} x{item?.qty || item?.quantity || 1}
                </Text>
                <Text className="text-sm font-bold text-ink">
                  Rp {Number(item?.subtotal || (item?.price * (item?.qty || 1)) || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              {(optionsLabel || itemDiscount > 0) ? (
                <Text className="text-[11px] font-medium text-ink-muted ml-1 mt-0.5" numberOfLines={2}>
                  {[optionsLabel, itemDiscount > 0 ? `diskon ${itemDiscount}%` : null].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          );
        })}

        <View className="h-px bg-hairline my-2.5" />

        <View className="flex-row justify-between my-1">
          <Text className="text-ink-muted text-sm">Metode Pembayaran:</Text>
          <Text className="font-bold text-ink text-sm">{transaction.paymentMethod}</Text>
        </View>

        {totalDiscount > 0 && (
          <View className="flex-row justify-between my-1">
            <Text className="text-ink-muted text-sm">Diskon:</Text>
            <Text className="font-bold text-danger text-sm">-Rp {totalDiscount.toLocaleString('id-ID')}</Text>
          </View>
        )}

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

        <TouchableOpacity
          className={`flex-1 bg-surface border border-hairline p-3.5 rounded-2xl items-center ${downloading ? 'opacity-60' : ''}`}
          onPress={handleDownloadPDF}
          disabled={printing || downloading}
          activeOpacity={0.9}
        >
          {downloading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text className="text-ink font-bold text-[15px]">Bagikan PDF</Text>
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