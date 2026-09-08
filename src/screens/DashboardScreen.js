import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getDashboardStats } from '../services/transactionService';
import FilterBar from '../components/FilterBar';

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
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.headerTitle}>Ringkasan Penjualan</Text>

      {/* Filter Component */}
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#1e88e5' }]}>
              <Text style={styles.cardLabel}>Total Pendapatan</Text>
              <Text style={styles.cardValueLarge}>
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </Text>
            </View>

            <View style={styles.rowGrid}>
              <View style={[styles.statCardHalf, { backgroundColor: '#43a047' }]}>
                <Text style={styles.cardLabel}>Total Transaksi</Text>
                <Text style={styles.cardValue}>{stats.totalTransactions}</Text>
              </View>

              <View style={[styles.statCardHalf, { backgroundColor: '#fb8c00' }]}>
                <Text style={styles.cardLabel}>Item Terjual</Text>
                <Text style={styles.cardValue}>{stats.totalItemsSold} pcs</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🔥 Produk Terlaris (Top 5)</Text>
            {stats.topProducts.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada penjualan di periode ini.</Text>
            ) : (
              stats.topProducts.map((item, index) => (
                <View key={index} style={styles.topProductRow}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productQty}>{item.qty} terjual</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📋 Transaksi Terbaru</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.linkText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {stats.recentTransactions.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada transaksi di periode ini.</Text>
            ) : (
              stats.recentTransactions.map((item) => (
                <View key={item.id} style={styles.recentRow}>
                  <View>
                    <Text style={styles.transId}>ID: #{item.id.substring(0, 8)}</Text>
                    <Text style={styles.timeText}>{item.formattedTime}</Text>
                  </View>
                  <Text style={styles.transAmount}>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  statsGrid: { marginBottom: 16, gap: 12 },
  statCard: { padding: 16, borderRadius: 12, elevation: 3 },
  rowGrid: { flexDirection: 'row', gap: 12 },
  statCardHalf: { flex: 1, padding: 14, borderRadius: 12, elevation: 3 },
  cardLabel: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },
  cardValueLarge: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  cardValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  sectionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linkText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  emptyText: { color: '#888', fontStyle: 'italic', marginVertical: 8 },
  topProductRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rankText: { width: 30, fontWeight: 'bold', color: '#fb8c00' },
  productName: { flex: 1, fontWeight: '500', color: '#333' },
  productQty: { fontWeight: 'bold', color: '#555' },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  transId: { fontWeight: 'bold', fontSize: 13, color: '#444' },
  timeText: { fontSize: 11, color: '#888', marginTop: 2 },
  transAmount: { fontWeight: 'bold', color: '#2e7d32', fontSize: 14 }
});