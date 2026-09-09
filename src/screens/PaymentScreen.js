import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { getQRISUrl, processPayment } from '../services/paymentService';
import { useCartStore } from '../store/useCartStore';
import { getItemOptionsLabel } from '../utils/cartLabel';
import colors from '../theme/colors';
import { formatRupiahInput, parseRupiahInput } from '../utils/currency';

const INVOICE_DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25];

export default function PaymentScreen({ route, navigation }) {
  const { cartItems = [], totalAmount = 0 } = route.params || {};

  const clearCart = useCartStore((s) => s.clearCart);

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [qrisUrl, setQrisUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [refreshIn, setRefreshIn] = useState(60);

  const invoiceDiscountAmount = Math.round(totalAmount * (invoiceDiscount / 100));
  const totalPayable = totalAmount - invoiceDiscountAmount;

  const fetchQRIS = async () => {
    const url = await getQRISUrl();
    setQrisUrl(url);
    setRefreshIn(60);
  };

  useEffect(() => {
    fetchQRIS();
  }, []);

  // #12: QRIS auto-refresh (ulangi ambil konfigurasi terbaru tiap 60 detik)
  useEffect(() => {
    if (paymentMethod !== 'QRIS') return;
    const interval = setInterval(() => {
      fetchQRIS();
    }, 60000);
    const ticker = setInterval(() => {
      setRefreshIn((t) => (t > 0 ? t - 1 : 60));
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [paymentMethod]);

  const handleCashChange = (text) => {
    const formatted = formatRupiahInput(text);
    setCashReceived(formatted);
    const received = parseRupiahInput(formatted);
    const computedChange = received - totalPayable;
    setChange(computedChange > 0 ? computedChange : 0);
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleFinishPayment = async () => {
    if (paymentMethod === 'CASH') {
      const received = parseRupiahInput(cashReceived);
      if (received < totalPayable) {
        showAlert('Pembayaran Gagal', 'Uang yang diterima kurang dari total tagihan!');
        return;
      }
    }

    if (paymentMethod === 'QRIS' && !qrisUrl) {
      showAlert('QRIS Belum Diatur', 'Link QRIS toko belum ada. Silakan atur di menu Pengaturan QRIS.');
      return;
    }

    setLoading(true);

    try {
      const result = await processPayment(
        cartItems,
        totalPayable,
        paymentMethod,
        paymentMethod === 'CASH' ? parseRupiahInput(cashReceived) : totalPayable,
        paymentMethod === 'CASH' ? change : 0,
        { discountPercent: invoiceDiscount, discountAmount: invoiceDiscountAmount }
      );

      setLoading(false);

      if (result && (result.success || result === true)) {
        const transactionData = result.transaction || {
          id: 'TRX-' + Date.now(),
          items: cartItems,
          totalAmount: Number(totalPayable),
          paymentMethod: paymentMethod,
          cashReceived: paymentMethod === 'CASH' ? parseRupiahInput(cashReceived) : Number(totalPayable),
          change: paymentMethod === 'CASH' ? Number(change) : 0,
          discountPercent: invoiceDiscount,
          discountAmount: invoiceDiscountAmount,
          formattedTime: new Date().toLocaleString('id-ID'),
        };

        clearCart();
        navigation.replace('TransactionDetail', {
          transaction: transactionData,
        });
      } else {
        const errorMsg = result?.error || 'Terjadi kesalahan saat memproses transaksi ke database.';
        showAlert('Gagal', String(errorMsg));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error eksekusi transaksi:", error);
      showAlert('Error', 'Terjadi kesalahan sistem saat memproses pembayaran.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-xl font-extrabold text-ink -tracking-tight mb-4">Metode Pembayaran</Text>

      <View className="bg-primary p-4 rounded-card mb-4 items-center shadow-md">
        <Text className="text-[13px] text-white opacity-75 font-semibold">Total Tagihan</Text>
        <Text className="text-[26px] font-extrabold text-white mt-1">
          Rp {totalPayable.toLocaleString('id-ID')}
        </Text>
        {invoiceDiscount > 0 && (
          <Text className="text-white/70 text-[11px] font-medium mt-1">
            (diskon invoice {invoiceDiscount}% = -Rp {invoiceDiscountAmount.toLocaleString('id-ID')})
          </Text>
        )}
      </View>

      {/* Diskon Invoice */}
      <View className="bg-surface p-4 rounded-card mb-4 border border-hairline">
        <Text className="text-xs font-bold text-ink-muted mb-2">Diskon Invoice (opsional)</Text>
        <View className="flex-row flex-wrap">
          {INVOICE_DISCOUNT_OPTIONS.map((pct) => {
            const selected = invoiceDiscount === pct;
            return (
              <TouchableOpacity
                key={pct}
                className={`px-3.5 py-2 rounded-2xl border mr-2 mb-2 ${
                  selected ? 'bg-primary border-primary' : 'bg-bg border-hairline'
                }`}
                onPress={() => setInvoiceDiscount(pct)}
                activeOpacity={0.8}
              >
                <Text className={`text-[13px] font-bold ${selected ? 'text-white' : 'text-ink'}`}>
                  {pct}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Ringkasan Pesanan */}
      {cartItems.length > 0 && (
        <View className="bg-surface p-4 rounded-card mb-4 shadow-md border border-hairline">
          <Text className="text-xs font-bold text-ink-muted mb-2.5">
            Ringkasan Pesanan ({cartItems.length} jenis)
          </Text>
          {cartItems.map((item, index) => {
            const optionsLabel = getItemOptionsLabel(item);
            const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
            const itemDiscount = Number(item.discountPercent || 0);
            return (
              <View
                key={item.cartId || `${item.firestoreDocId || item.id || 'item'}_${index}`}
                className={`py-2 ${index !== cartItems.length - 1 ? 'border-b border-hairline' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-bold text-[13px] text-ink" numberOfLines={1}>
                    {item.name || item.nama || 'Produk'}
                    <Text className="text-ink-muted font-medium"> x{item.qty}</Text>
                  </Text>
                  <Text className="font-extrabold text-[13px] text-ink ml-2">
                    Rp {((Number(item.subtotal) || 0)).toLocaleString('id-ID')}
                  </Text>
                </View>
                {optionsLabel ? (
                  <Text className="text-[11px] font-medium text-ink-muted mt-0.5" numberOfLines={2}>
                    {optionsLabel}
                    {itemDiscount > 0 ? ` · diskon ${itemDiscount}%` : ''}
                  </Text>
                ) : itemDiscount > 0 ? (
                  <Text className="text-[11px] font-medium text-ink-muted mt-0.5">
                    Diskon {itemDiscount}% ({formatRupiahInput(item.unitPrice)})
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row justify-between mb-4 gap-3">
        <TouchableOpacity
          className={`flex-1 py-4 rounded-2xl border-[1.5px] items-center ${
            paymentMethod === 'CASH' ? 'border-primary bg-primary' : 'border-hairline bg-surface'
          }`}
          onPress={() => setPaymentMethod('CASH')}
          activeOpacity={0.85}
        >
          <Text className={`font-bold text-[15px] tracking-wide ${paymentMethod === 'CASH' ? 'text-white' : 'text-ink-muted'}`}>TUNAI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 rounded-2xl border-[1.5px] items-center ${
            paymentMethod === 'QRIS' ? 'border-primary bg-primary' : 'border-hairline bg-surface'
          }`}
          onPress={() => setPaymentMethod('QRIS')}
          activeOpacity={0.85}
        >
          <Text className={`font-bold text-[15px] tracking-wide ${paymentMethod === 'QRIS' ? 'text-white' : 'text-ink-muted'}`}>QRIS</Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'CASH' && (
        <View className="bg-surface p-4 rounded-card mb-4 items-center shadow-md">
          <Text className="text-xs font-bold text-ink self-start mb-2">Nominal Uang Diterima</Text>
          <TextInput
            className="w-full border border-hairline rounded-lg p-2.5 mb-3 bg-bg text-ink text-[15px] font-extrabold"
            placeholder="Rp 50.000"
            placeholderTextColor={colors['ink-muted']}
            keyboardType="numeric"
            value={cashReceived}
            onChangeText={handleCashChange}
          />
          <Text className="text-xs font-bold text-ink self-start mb-2">Kembalian</Text>
          <Text className="text-xl font-extrabold text-danger self-start">Rp {change.toLocaleString('id-ID')}</Text>
        </View>
      )}

      {paymentMethod === 'QRIS' && (
        <View className="bg-surface p-4 rounded-card mb-4 items-center shadow-md">
          <Text className="text-xs font-bold text-ink self-start mb-1">Scan QRIS di Bawah Ini</Text>
          {qrisUrl ? (
            <Image source={{ uri: qrisUrl }} className="w-[180px] h-[180px] rounded-2xl my-2" />
          ) : (
            <Text className="text-danger my-2 text-center">Belum ada QRIS yang diupload. Silakan atur di menu QRIS.</Text>
          )}
          <Text className="text-[10px] font-medium text-ink-muted">
            QRIS diperbarui otomatis · {refreshIn}s
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <TouchableOpacity className="bg-primary p-4 rounded-2xl items-center mb-8" onPress={handleFinishPayment} activeOpacity={0.9}>
          <Text className="text-white font-bold text-base">Selesaikan Transaksi</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}