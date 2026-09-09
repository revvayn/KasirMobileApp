import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { listUsers, createKasirUser, updateUserProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import colors from '../theme/colors';

const inputClass = 'border border-hairline rounded-2xl px-4 py-3 bg-bg text-ink text-sm';

export default function UserManagerScreen() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('kasir');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data || []);
    } catch (error) {
      showAlert('Gagal', 'Tidak dapat memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!email.trim() || password.length < 6) {
      showAlert('Peringatan', 'Email wajib diisi dan kata sandi minimal 6 karakter.');
      return;
    }
    setSaving(true);
    try {
      await createKasirUser({ email: email.trim(), password, displayName: name.trim(), role });
      setShowForm(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('kasir');
      fetchUsers();
      showAlert('Berhasil', 'Akun pengguna berhasil dibuat.');
    } catch (error) {
      const msg = error?.code === 'auth/email-already-in-use' ? 'Email sudah terpakai.' : 'Gagal membuat akun.';
      showAlert('Gagal', msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmRoleChange = (user) => {
    const action = () =>
      updateUserProfile(user.id, { role: user.role === 'admin' ? 'kasir' : 'admin' }).then(fetchUsers);
    if (Platform.OS === 'web') {
      if (window.confirm(`Ubah role ${user.email} menjadi ${user.role === 'admin' ? 'kasir' : 'admin'}?`)) action();
      return;
    }
    Alert.alert('Ubah Role', `Jadikan ${user.email} sebagai ${user.role === 'admin' ? 'kasir' : 'admin'}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Ubah', onPress: action },
    ]);
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="bg-surface px-5 pt-5 pb-4 rounded-b-[28px] shadow-sm mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center mr-3">
              <MaterialIcons name="people" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-[13px] font-medium text-ink-muted">Manajemen Pengguna</Text>
              <Text className="text-[19px] font-extrabold text-ink -tracking-tight">Akun & Role</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-accent px-4 py-2.5 rounded-2xl flex-row items-center"
            onPress={() => setShowForm((v) => !v)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="person-add" size={18} color="#fff" />
            <Text className="text-white font-bold text-[13px] ml-1">Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showForm && (
        <View className="mx-4 mb-4 bg-surface rounded-card p-4 border border-hairline">
          <Text className="text-sm font-bold text-ink mb-3">Buat Akun Baru</Text>
          <TextInput className={`${inputClass} mb-2.5`} placeholder="Nama tampilan (opsional)" placeholderTextColor={colors['ink-muted']} value={name} onChangeText={setName} />
          <TextInput className={`${inputClass} mb-2.5`} placeholder="Email" placeholderTextColor={colors['ink-muted']} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput className={`${inputClass} mb-3`} placeholder="Kata sandi (min. 6 karakter)" placeholderTextColor={colors['ink-muted']} secureTextEntry value={password} onChangeText={setPassword} />
          <View className="flex-row gap-2 mb-3">
            {['kasir', 'admin'].map((r) => (
              <TouchableOpacity
                key={r}
                className={`flex-1 py-2 rounded-xl border items-center ${role === r ? 'bg-primary border-primary' : 'bg-bg border-hairline'}`}
                onPress={() => setRole(r)}
                activeOpacity={0.8}
              >
                <Text className={`text-[12px] font-bold capitalize ${role === r ? 'text-white' : 'text-ink-muted'}`}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            className="bg-primary rounded-2xl py-3 items-center flex-row justify-center"
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="person-add" size={16} color="#fff" />
                <Text className="text-white font-bold ml-1.5">Simpan Akun</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          className="px-4"
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelf = currentUser?.uid === item.id;
            const isAdmin = item.role === 'admin';
            return (
              <View className="bg-surface rounded-[18px] mb-2.5 flex-row items-center border border-hairline p-3">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isAdmin ? 'bg-accent-soft' : 'bg-success-soft'}`}>
                  <MaterialIcons name={isAdmin ? 'admin-panel-settings' : 'storefront'} size={18} color={isAdmin ? colors.accent : colors.success} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-[13px] text-ink" numberOfLines={1}>
                    {item.displayName || item.email}
                    {isSelf ? ' (Anda)' : ''}
                  </Text>
                  <Text className="text-[11px] text-ink-muted mt-0.5">{item.email}</Text>
                  <View className={`self-start mt-1 px-2 py-0.5 rounded-md ${isAdmin ? 'bg-accent-soft' : 'bg-success-soft'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-accent' : 'text-success'}`}>{item.role}</Text>
                  </View>
                </View>
                {!isSelf && (
                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-bg items-center justify-center"
                    onPress={() => confirmRoleChange(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="swap-horiz" size={16} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-3">
                <MaterialIcons name="people-outline" size={26} color={colors['ink-muted']} />
              </View>
              <Text className="text-[13px] font-bold text-ink-muted">Belum ada pengguna.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}