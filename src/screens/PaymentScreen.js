import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getQRISUrl, processPayment } from '../services/paymentService';
import colors from '../theme/colors';
import { formatRupiahInput, parseRupiahInput } from '../utils/currency';

export default function PaymentScreen({ route, navigation }) {
  const { cartItems = [], totalAmount = 0 } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [qrisUrl, setQrisUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQRIS();
  }, []);

  const fetchQRIS = async () => {
    const url = await getQRISUrl();
    setQrisUrl(url);
  };

  const handleCashChange = (text) => {
    const formatted = formatRupiahInput(text);
    setCashReceived(formatted);
    const received = parseRupiahInput(formatted);
    const computedChange = received - totalAmount;
    setChange(computedChange > 0 ? computedChange : 0);
  };

  const handleFinishPayment = async () => {
    if (paymentMethod === 'CASH') {
      const received = parseRupiahInput(cashReceived);
      if (received < totalAmount) {
        Alert.alert('Pembayaran Gagal', 'Uang yang diterima kurang dari total tagihan!');
        return;
      }
    }

    if (paymentMethod === 'QRIS' && !qrisUrl) {
      Alert.alert('QRIS Belum Diatur', 'Link QRIS toko belum ada. Silakan atur di menu Pengaturan QRIS.');
      return;
    }

    setLoading(true);

    try {
      // Memanggil processPayment
      const result = await processPayment(
        cartItems,
        totalAmount,
        paymentMethod,
        paymentMethod === 'CASH' ? parseRupiahInput(cashReceived) : totalAmount,
        paymentMethod === 'CASH' ? change : 0
      );

      setLoading(false);

      // Pengecekan status keberhasilan
      if (result && (result.success || result === true)) {
        const transactionData = result.transaction || {
          id: 'TRX-' + Date.now(),
          items: cartItems,
          totalAmount: Number(totalAmount),
          paymentMethod: paymentMethod,
          cashReceived: paymentMethod === 'CASH' ? parseRupiahInput(cashReceived) : Number(totalAmount),
          change: paymentMethod === 'CASH' ? Number(change) : 0,
          formattedTime: new Date().toLocaleString('id-ID'),
        };

        // Otomatis mengganti layar ke TransactionDetail tanpa tertahan Alert
        navigation.replace('TransactionDetail', {
          transaction: transactionData,
        });

      } else {
        const errorMsg = result?.error || 'Terjadi kesalahan saat memproses transaksi ke database.';
        Alert.alert('Gagal', String(errorMsg));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error eksekusi transaksi:", error);
      Alert.alert('Error', 'Terjadi kesalahan sistem saat memproses pembayaran.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-xl font-extrabold text-ink -tracking-tight mb-4">Metode Pembayaran</Text>

      <View className="bg-primary p-4 rounded-card mb-4 items-center shadow-md">
        <Text className="text-[13px] text-white opacity-75 font-semibold">Total Tagihan</Text>
        <Text className="text-[26px] font-extrabold text-white mt-1">Rp {totalAmount.toLocaleString('id-ID')}</Text>
      </View>

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
          <Text className="text-xs font-bold text-ink self-start mb-2">Scan QRIS di Bawah Ini</Text>
          {qrisUrl ? (
            <Image source={{ uri: qrisUrl }} className="w-[200px] h-[200px] rounded-2xl my-2" />
          ) : (
            <Text className="text-danger my-2 text-center">Belum ada QRIS yang diupload. Silakan atur di menu QRIS.</Text>
          )}
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
