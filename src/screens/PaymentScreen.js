import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getQRISUrl, processPayment } from '../services/paymentService';

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
    setCashReceived(text);
    const received = parseFloat(text) || 0;
    const computedChange = received - totalAmount;
    setChange(computedChange > 0 ? computedChange : 0);
  };

  const handleFinishPayment = async () => {
    if (paymentMethod === 'CASH') {
      const received = parseFloat(cashReceived) || 0;
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
        paymentMethod === 'CASH' ? cashReceived : totalAmount,
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
          cashReceived: paymentMethod === 'CASH' ? Number(cashReceived) : Number(totalAmount),
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Metode Pembayaran</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Tagihan:</Text>
        <Text style={styles.totalText}>Rp {totalAmount.toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.methodContainer}>
        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'CASH' && styles.selectedMethod]}
          onPress={() => setPaymentMethod('CASH')}
        >
          <Text style={[styles.methodText, paymentMethod === 'CASH' && styles.selectedMethodText]}>💵 Tunai (CASH)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, paymentMethod === 'QRIS' && styles.selectedMethod]}
          onPress={() => setPaymentMethod('QRIS')}
        >
          <Text style={[styles.methodText, paymentMethod === 'QRIS' && styles.selectedMethodText]}>📱 QRIS</Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'CASH' && (
        <View style={styles.sectionBox}>
          <Text style={styles.label}>Nominal Uang Diterima:</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 50000"
            keyboardType="numeric"
            value={cashReceived}
            onChangeText={handleCashChange}
          />
          <Text style={styles.label}>Kembalian:</Text>
          <Text style={styles.changeText}>Rp {change.toLocaleString('id-ID')}</Text>
        </View>
      )}

      {paymentMethod === 'QRIS' && (
        <View style={styles.sectionBox}>
          <Text style={styles.label}>Scan QRIS di Bawah Ini:</Text>
          {qrisUrl ? (
            <Image source={{ uri: qrisUrl }} style={styles.qrisImage} />
          ) : (
            <Text style={styles.errorText}>Belum ada QRIS yang diupload. Silakan atur di menu QRIS.</Text>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.btnFinish} onPress={handleFinishPayment}>
          <Text style={styles.btnFinishText}>Selesaikan Transaksi</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  summaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 16, elevation: 2, alignItems: 'center' },
  summaryTitle: { fontSize: 14, color: '#666' },
  totalText: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32', marginTop: 4 },
  methodContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  methodButton: { flex: 0.48, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', alignItems: 'center' },
  selectedMethod: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  methodText: { fontWeight: 'bold', color: '#555' },
  selectedMethodText: { color: '#2e7d32' },
  sectionBox: { backgroundColor: '#fff', padding: 16, borderRadius: 10, elevation: 2, marginBottom: 16, alignItems: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', alignSelf: 'flex-start', marginBottom: 8 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
  changeText: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f', alignSelf: 'flex-start' },
  qrisImage: { width: 200, height: 200, borderRadius: 8, marginVertical: 10 },
  errorText: { color: '#d32f2f', marginVertical: 10, textAlign: 'center' },
  btnFinish: { backgroundColor: '#2e7d32', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  btnFinishText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});