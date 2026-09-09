import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getDashboardStats } from '../services/transactionService';
import FilterBar from '../components/FilterBar';
import colors from '../theme/colors';
import { getInvoiceNumber } from '../utils/receiptHtml';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalItemsSold: 0,
    topProducts: [],
    recentTransactions: [],
    categoryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State Filter
  const [filter, setFilter] = useState('all');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [rangeStart, setRangeStart] = useState(
    () => new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [rangeEnd, setRangeEnd] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboard();
  }, [filter, customDate, rangeStart, rangeEnd]);

  const loadDashboard = async () => {
    setLoading(true);
    const data = await getDashboardStats(filter, customDate, rangeStart, rangeEnd);
    setStats(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await getDashboardStats(filter, customDate, rangeStart, rangeEnd);
    setStats(data);
    setRefreshing(false);
  };

  const formatRupiah = (value) => `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`;

  // Hitung rata-rata transaksi & item per transaksi
  const avgTransaction =
    stats.totalTransactions > 0
      ? Math.round(stats.totalRevenue / stats.totalTransactions)
      : 0;
  const itemsPerTransaction =
    stats.totalTransactions > 0
      ? (stats.totalItemsSold / stats.totalTransactions).toFixed(1)
      : '0';

  const statCards = [
    {
      label: 'Laba Kotor',
      value: formatRupiah(stats.totalProfit),
      icon: 'trending-up',
      tint: colors.success,
      soft: colors['success-soft'],
    },
    {
      label: 'Margin Laba',
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: 'percent',
      tint: colors.accent,
      soft: colors['accent-soft'],
    },
    {
      label: 'Total Transaksi',
      value: String(stats.totalTransactions),
      icon: 'receipt-long',
      tint: colors.accent,
      soft: colors['accent-soft'],
    },
    {
      label: 'Item Terjual',
      value: `${stats.totalItemsSold} pcs`,
      icon: 'inventory',
      tint: colors.success,
      soft: colors['success-soft'],
    },
    {
      label: 'Rata-rata Nilai',
      value: formatRupiah(avgTransaction),
      icon: 'trending-up',
      tint: '#4A6CF7',
      soft: '#E7EBFD',
    },
    {
      label: 'Item / Transaksi',
      value: `${itemsPerTransaction}`,
      icon: 'shopping-bag',
      tint: '#C05621',
      soft: '#FDEACF',
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-[13px] font-medium text-ink-muted">Laporan Penjualan</Text>
          <Text className="text-2xl font-extrabold text-ink -tracking-tight">Dashboard</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-2xl bg-accent-soft items-center justify-center"
            onPress={() => navigation.navigate('Closing')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="fact-check" size={19} color={colors.accent} />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center">
            <MaterialIcons name="monitoring" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* Filter Component */}
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
        rangeStart={rangeStart}
        setRangeStart={setRangeStart}
        rangeEnd={rangeEnd}
        setRangeEnd={setRangeEnd}
      />

      {loading ? (
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Hero Revenue Card */}
          <View className="bg-primary rounded-[26px] p-5 mb-4 shadow-lg overflow-hidden">
            <View className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
            <View className="absolute -right-2 -top-2 w-20 h-20 rounded-full bg-white/5" />
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-accent items-center justify-center mr-3">
                  <MaterialIcons name="payments" size={18} color="#fff" />
                </View>
                <Text className="text-white/80 text-[13px] font-semibold">Total Pendapatan</Text>
              </View>
              <MaterialIcons name="north-east" size={18} color={colors.accent} />
            </View>
            <Text className="text-white text-[30px] font-extrabold -tracking-tight">
              {formatRupiah(stats.totalRevenue)}
            </Text>
            <View className="flex-row items-center mt-1.5 gap-1">
              <View className="bg-white/15 rounded-full px-2.5 py-1">
                <Text className="text-white text-[11px] font-bold">
                  Laba {formatRupiah(stats.totalProfit)}
                </Text>
              </View>
              <View className="bg-success/90 rounded-full px-2.5 py-1">
                <Text className="text-white text-[11px] font-bold">
                  Margin {stats.profitMargin.toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text className="text-white/60 text-xs font-medium mt-1.5">
              {stats.totalTransactions} transaksi berhasil · {stats.totalItemsSold} item terjual
            </Text>
          </View>

          {/* Stat Grid 2x2 */}
          <View className="flex-row flex-wrap justify-between gap-3 mb-4">
            {statCards.map((card) => (
              <View
                key={card.label}
                className="w-[48%] bg-surface p-4 rounded-[20px] border border-hairline"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: card.soft }}
                  >
                    <MaterialIcons name={card.icon} size={18} color={card.tint} />
                  </View>
                  <MaterialIcons name="more-horiz" size={18} color={colors['ink-muted']} />
                </View>
                <Text className="text-[22px] font-extrabold text-ink" numberOfLines={1} adjustsFontSizeToFit>
                  {card.value}
                </Text>
                <Text className="text-xs font-medium text-ink-muted mt-1">{card.label}</Text>
              </View>
            ))}
          </View>

          {/* Produk Terlaris */}
          <View className="bg-surface p-4 rounded-[22px] mb-4 shadow-sm border border-hairline">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-2.5">
                  <MaterialIcons name="local-fire-department" size={18} color={colors.accent} />
                </View>
                <Text className="text-[16px] font-bold text-ink">Produk Terlaris</Text>
              </View>
              <Text className="text-[11px] font-bold text-ink-muted">TOP 5</Text>
            </View>

            {stats.topProducts.length === 0 ? (
              <Text className="text-xs font-medium text-ink-muted italic my-3">Tidak ada penjualan di periode ini.</Text>
            ) : (
              stats.topProducts.map((item, index) => {
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', colors['accent-soft'], colors['accent-soft']];
                const maxQty = stats.topProducts[0].qty || 1;
                const barWidth = Math.max((item.qty / maxQty) * 100, 8);
                return (
                  <View key={index} className="py-2.5">
                    <View className="flex-row items-center mb-1.5">
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center mr-2.5"
                        style={{ backgroundColor: rankColors[index] }}
                      >
                        <Text className={`font-extrabold text-xs ${index > 2 ? 'text-accent' : 'text-ink'}`}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="font-extrabold text-ink-muted text-xs">{item.qty} terjual</Text>
                    </View>
                    <View className="ml-10 h-2 rounded-full bg-bg overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, backgroundColor: colors.accent }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Pendapatan per Kategori */}
          <View className="bg-surface p-4 rounded-[22px] mb-4 shadow-sm border border-hairline">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-2.5">
                <MaterialIcons name="category" size={18} color={colors.accent} />
              </View>
              <Text className="text-[16px] font-bold text-ink">Pendapatan per Kategori</Text>
            </View>

            {stats.categoryBreakdown.length === 0 ? (
              <Text className="text-xs font-medium text-ink-muted italic my-3">
                Tidak ada penjualan di periode ini.
              </Text>
            ) : (
              <View>
                {stats.categoryBreakdown.map((k, index) => {
                  const maxRevenue = stats.categoryBreakdown[0].revenue || 1;
                  const pct = (k.revenue / maxRevenue) * 100;
                  return (
                    <View key={k.category} className={`py-2 ${index !== stats.categoryBreakdown.length - 1 ? 'border-b border-hairline' : ''}`}>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                          {k.category}
                        </Text>
                        <Text className="text-xs font-bold text-ink-muted mr-2">{k.qty} pcs</Text>
                        <Text className="font-extrabold text-ink text-[13px]">
                          {formatRupiah(k.revenue)}
                        </Text>
                      </View>
                      <View className="ml-1 h-2 rounded-full bg-bg overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: colors.success }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Transaksi Terbaru */}
          <View className="bg-surface p-4 rounded-[22px] mb-4 shadow-sm border border-hairline">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-success-soft items-center justify-center mr-2.5">
                  <MaterialIcons name="history" size={18} color={colors.success} />
                </View>
                <Text className="text-[16px] font-bold text-ink">Transaksi Terbaru</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text className="text-accent font-bold text-[13px]">Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {stats.recentTransactions.length === 0 ? (
              <View className="items-center py-8">
                <View className="w-14 h-14 rounded-full bg-bg items-center justify-center mb-2.5">
                  <MaterialIcons name="receipt-long" size={24} color={colors['ink-muted']} />
                </View>
                <Text className="text-xs font-medium text-ink-muted italic">
                  Tidak ada transaksi di periode ini.
                </Text>
              </View>
            ) : (
              stats.recentTransactions.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center justify-between py-3 ${
                    index !== stats.recentTransactions.length - 1 ? 'border-b border-hairline' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-bg items-center justify-center mr-3">
                      <Text className="text-[10px] font-extrabold text-ink-muted">
                        {item.formattedTime?.split(',')[0]}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-bold text-[13px] text-ink">{getInvoiceNumber(item)}</Text>
                      <Text className="text-[11px] font-medium text-ink-muted mt-0.5">{item.formattedTime}</Text>
                    </View>
                  </View>
                  <Text className="font-extrabold text-success text-sm">
                    {formatRupiah(item.totalAmount)}
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
