import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getQRISUrl, saveQRISUrl } from '../services/paymentService';

export default function QRISSettingScreen({ navigation }) {
  const [qrisUrl, setQrisUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadQRIS();
  }, []);

  const loadQRIS = async () => {
    setFetching(true);
    const url = await getQRISUrl();
    setQrisUrl(url);
    setFetching(false);
  };

  const handleSave = async () => {
    if (!qrisUrl || qrisUrl.trim() === '') {
      Alert.alert('Peringatan', 'Harap masukkan link foto QRIS terlebih dahulu!');
      return;
    }

    setLoading(true);
    const success = await saveQRISUrl(qrisUrl);
    setLoading(false);

    if (success) {
      Alert.alert('Berhasil', 'Link QRIS toko berhasil disimpan!', [
        { 
          text: 'OK', 
          onPress: () => {
            if (navigation && navigation.canGoBack()) navigation.goBack();
          } 
        }
      ]);
    } else {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan QRIS ke database.');
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pengaturan QRIS Toko</Text>
      <Text style={styles.subtitle}>Masukkan link URL gambar QRIS toko Anda (contoh: dari Imgur atau hosting publik)</Text>

      <TextInput
        style={styles.input}
        placeholder="https://i.imgur.com/contoh.jpg"
        value={qrisUrl}
        onChangeText={setQrisUrl}
        autoCapitalize="none"
      />

      {qrisUrl ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Pratinjau QRIS Saat Ini:</Text>
          <Image
            source={{ uri: qrisUrl }}
            style={styles.qrisImage}
            onError={() => Alert.alert('Format Salah', 'Link gambar tidak valid atau tidak bisa dimuat.')}
          />
        </View>
      ) : (
        <View style={styles.qrisErrorBox}>
          <Text style={styles.qrisErrorText}>Belum ada QRIS yang tersimpan.</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
          <Text style={styles.btnText}>Simpan Link QRIS</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f6f8' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff', marginBottom: 16 },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  previewLabel: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '600' },
  qrisImage: { width: 220, height: 220, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  qrisErrorBox: { width: '100%', height: 150, backgroundColor: '#eaeaea', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 20 },
  qrisErrorText: { color: '#777', fontSize: 13 },
  btnSave: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});