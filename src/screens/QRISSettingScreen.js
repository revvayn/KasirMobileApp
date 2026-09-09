import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getQRISUrl, saveQRISUrl } from '../services/paymentService';
import colors from '../theme/colors';

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
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
      <Text className="text-xl font-extrabold text-ink -tracking-tight mb-1">Pengaturan QRIS Toko</Text>
      <Text className="text-[13px] font-medium text-ink-muted mb-4">Masukkan link URL gambar QRIS toko Anda (contoh: dari Imgur atau hosting publik)</Text>

      <TextInput
        className="border border-hairline rounded-2xl p-4 bg-surface text-ink mb-4"
        placeholder="https://i.imgur.com/contoh.jpg"
        placeholderTextColor={colors['ink-muted']}
        value={qrisUrl}
        onChangeText={setQrisUrl}
        autoCapitalize="none"
      />

      {qrisUrl ? (
        <View className="items-center mb-6">
          <Text className="text-xs font-bold text-ink mb-2">Pratinjau QRIS Saat Ini</Text>
          <Image
            source={{ uri: qrisUrl }}
            className="w-[220px] h-[220px] rounded-card border border-hairline bg-surface"
            onError={() => Alert.alert('Format Salah', 'Link gambar tidak valid atau tidak bisa dimuat.')}
          />
        </View>
      ) : (
        <View className="w-full h-[150px] bg-surface-alt justify-center items-center rounded-2xl mb-6">
          <Text className="text-[13px] font-medium text-ink-muted">Belum ada QRIS yang tersimpan.</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <TouchableOpacity className="bg-primary p-3.5 rounded-2xl items-center mb-8 shadow-md" onPress={handleSave} activeOpacity={0.9}>
          <Text className="text-white font-bold text-base">Simpan Link QRIS</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
