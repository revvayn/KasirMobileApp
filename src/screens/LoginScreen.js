import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signIn, ensureUserRole, registerUser } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import colors from '../theme/colors';

export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('Peringatan', 'Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      const role = await ensureUserRole(user.uid, user.email);
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setRole(role);
    } catch (error) {
      const msg =
        error?.code === 'auth/invalid-credential'
          ? 'Email atau kata sandi salah.'
          : error?.message || 'Gagal masuk. Periksa koneksi internet.';
      showAlert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  // Pendaftaran publik: hanya untuk bootstrap. User PERTAMA otomatis jadi Admin
  // (lihat ensureUserRole); akun berikutnya jadi kasir.
  const handleRegister = async () => {
    if (!email.trim() || !password || password.length < 6) {
      showAlert('Peringatan', 'Email wajib diisi dan kata sandi minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser({ email: email.trim(), password, displayName: displayName.trim() });
      useAuthStore.getState().setUser({ uid: user.uid, email: user.email });
      useAuthStore.getState().setRole(user.role);
    } catch (error) {
      const msg =
        error?.code === 'auth/email-already-in-use'
          ? 'Email sudah terdaftar. Gunakan akun untuk masuk.'
          : error?.message || 'Gagal membuat akun.';
      showAlert('Gagal Daftar', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Kosongkan password ketika layar ditutup agar tidak tersimpan di state.
    return () => setPassword('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRegister = mode === 'register';

  return (
    <View className="flex-1 bg-bg px-6 justify-center">
      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
          <MaterialIcons name="storefront" size={30} color="#fff" />
        </View>
        <Text className="text-2xl font-extrabold text-ink -tracking-tight">
          {isRegister ? 'Buat Akun Pertama' : 'Kasir Masuk'}
        </Text>
        <Text className="text-[13px] font-medium text-ink-muted mt-1 text-center">
          {isRegister
            ? 'Akun pertama otomatis menjadi Admin. Setelah itu buat kasir lewat Manajemen Pengguna.'
            : 'Masuk dengan akun kasir/admin yang sudah dibuat.'}
        </Text>
      </View>

      <View className="bg-surface rounded-card p-5 border border-hairline shadow-sm">
        {isRegister && (
          <>
            <Text className="text-xs font-bold text-ink-muted mb-1.5 ml-1">Nama Lengkap</Text>
            <View className="flex-row items-center bg-bg rounded-2xl px-4 mb-3.5">
              <MaterialIcons name="person-outline" size={18} color={colors['ink-muted']} />
              <TextInput
                className="flex-1 py-3.5 text-sm font-medium text-ink ml-2.5"
                placeholder="Nama kasir / admin"
                placeholderTextColor={colors['ink-muted']}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </>
        )}

        <Text className="text-xs font-bold text-ink-muted mb-1.5 ml-1">Email</Text>
        <View className="flex-row items-center bg-bg rounded-2xl px-4 mb-3.5">
          <MaterialIcons name="mail-outline" size={18} color={colors['ink-muted']} />
          <TextInput
            className="flex-1 py-3.5 text-sm font-medium text-ink ml-2.5"
            placeholder="kasir@toko.com"
            placeholderTextColor={colors['ink-muted']}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text className="text-xs font-bold text-ink-muted mb-1.5 ml-1">Kata Sandi</Text>
        <View className="flex-row items-center bg-bg rounded-2xl px-4 mb-4">
          <MaterialIcons name="lock-outline" size={18} color={colors['ink-muted']} />
          <TextInput
            className="flex-1 py-3.5 text-sm font-medium text-ink ml-2.5"
            placeholder="••••••••"
            placeholderTextColor={colors['ink-muted']}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={isRegister ? handleRegister : handleLogin}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center flex-row justify-center"
            onPress={isRegister ? handleRegister : handleLogin}
            activeOpacity={0.9}
          >
            <MaterialIcons name={isRegister ? 'person-add' : 'login'} size={18} color="#fff" />
            <Text className="text-white font-bold text-[15px] ml-2">
              {isRegister ? 'Buat Akun & Masuk' : 'Masuk'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="items-center mt-4 py-1"
          onPress={() => {
            setMode(isRegister ? 'login' : 'register');
            setPassword('');
          }}
          activeOpacity={0.7}
        >
          <Text className="text-xs font-bold text-accent">
            {isRegister
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Buat akun pertama (Admin)'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-[11px] font-medium text-ink-muted text-center mt-5">
        {isRegister
          ? 'Setelah admin dibuat, matikan pendaftaran publik lewat Firebase console untuk keamanan.'
          : 'Koneksi internet diperlukan untuk login & sinkronisasi data.'}
      </Text>
    </View>
  );
}