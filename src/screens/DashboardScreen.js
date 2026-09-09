import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getDashboardStats } from '../services/transactionService';
import FilterBar from '../components/FilterBar';
import colors from '../theme/colors';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    topProducts: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State Filter
  const [filter, setFilter] = useState('all');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboard();
  }, [filter, customDate]);

  const loadDashboard = async () => {
    setLoading(true);
    const data = await getDashboardStats(filter, customDate);
    setStats(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await getDashboardStats(filter, customDate);
    setStats(data);
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text className="text-2xl font-extrabold text-ink -tracking-tight mb-3">Ringkasan Penjualan</Text>

      {/* Filter Component */}
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <>
          <View className="mb-4 gap-3">
            <View className="p-4 rounded-card bg-primary shadow-md">
              <Text className="text-white text-[13px] font-semibold opacity-75">Total Pendapatan</Text>
              <Text className="text-white text-[26px] font-extrabold mt-2">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 p-3.5 rounded-card bg-surface border border-hairline">
                <Text className="text-xs font-semibold text-ink-muted">Total Transaksi</Text>
                <Text className="text-ink text-xl font-extrabold mt-2">{stats.totalTransactions}</Text>
              </View>

              <View className="flex-1 p-3.5 rounded-card bg-surface border border-hairline">
                <Text className="text-xs font-semibold text-ink-muted">Item Terjual</Text>
                <Text className="text-ink text-xl font-extrabold mt-2">{stats.totalItemsSold} pcs</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface p-4 rounded-card mb-4 shadow-md">
            <Text className="text-[17px] font-bold text-ink mb-3">Produk Terlaris</Text>
            {stats.topProducts.length === 0 ? (
              <Text className="text-xs font-medium text-ink-muted italic my-2">Tidak ada penjualan di periode ini.</Text>
            ) : (
              stats.topProducts.map((item, index) => (
                <View key={index} className="flex-row items-center py-2.5 border-b border-hairline">
                  <View className="w-6 h-6 rounded-full bg-accent-soft items-center justify-center mr-2">
                    <Text className="font-extrabold text-accent text-xs">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm font-medium text-ink">{item.name}</Text>
                  <Text className="font-bold text-ink-muted text-xs">{item.qty} terjual</Text>
                </View>
              ))
            )}
          </View>

          <View className="bg-surface p-4 rounded-card mb-4 shadow-md">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[17px] font-bold text-ink">Transaksi Terbaru</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text className="text-accent font-bold text-[13px]">Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {stats.recentTransactions.length === 0 ? (
              <Text className="text-xs font-medium text-ink-muted italic my-2">Tidak ada transaksi di periode ini.</Text>
            ) : (
              stats.recentTransactions.map((item) => (
                <View key={item.id} className="flex-row justify-between items-center py-2.5 border-b border-hairline">
                  <View>
                    <Text className="font-bold text-[13px] text-ink">#{item.id.substring(0, 8)}</Text>
                    <Text className="text-xs font-medium text-ink-muted mt-0.5">{item.formattedTime}</Text>
                  </View>
                  <Text className="font-extrabold text-success text-sm">
                    Rp {item.totalAmount?.toLocaleString('id-ID')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
