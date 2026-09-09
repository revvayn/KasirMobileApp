import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getTransactions,
  filterTransactionsByPeriod,
  deleteTransaction,
  deleteTransactionsByBatch,
} from '../services/transactionService';
import FilterBar from '../components/FilterBar';
import colors from '../theme/colors';
import { exportTransactionsToExcel, formatRupiah } from '../utils/exportExcel';

export default function HistoryScreen({ navigation }) {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // State Filter & Pagination
  const [filter, setFilter] = useState('all');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Helper untuk mengekstrak Document ID Firestore secara konsisten
  const getDocId = (item) => {
    if (!item) return null;
    return item.firestoreDocId || item.id || item.docId || item.key || null;
  };

  // Auto reload data setiap kali layar mendapat fokus kembali
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  useEffect(() => {
    applyFilter();
  }, [filter, customDate, allTransactions]);

  useEffect(() => {
    paginateData();
  }, [filteredTransactions, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showAlert('Error', 'Gagal memuat riwayat transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const filtered = filterTransactionsByPeriod(allTransactions, filter, customDate);
    setFilteredTransactions(filtered || []);
    setPage(1); // Reset halaman ke 1 saat filter berubah
  };

  const paginateData = () => {
    const paginated = filteredTransactions.slice(0, page * ITEMS_PER_PAGE);
    setDisplayedTransactions(paginated);
  };

  const handleLoadMore = () => {
    if (displayedTransactions.length < filteredTransactions.length) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // Helper Dialog Alert Lintas Platform (Web & Mobile)
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Export ke Excel sesuai filter yang sedang aktif
  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      showAlert('Info', 'Tidak ada data untuk diexport pada periode filter ini.');
      return;
    }

    setExporting(true);
    try {
      const filterLabel = { today: 'Hari_Ini', month: 'Bulan_Ini', year: 'Tahun_Ini', all: 'Semua', custom: 'Tanggal' }[filter];
      await exportTransactionsToExcel(filteredTransactions, `laporan_transaksi_${filterLabel}`);
      showAlert('Export Berhasil', `File Excel (${filteredTransactions.length} transaksi) berhasil dibuat.`);
    } catch (error) {
      showAlert('Export Gagal', 'Terjadi kesalahan saat membuat file Excel.');
    } finally {
      setExporting(false);
    }
  };

  // Navigasi ke Layar Detail Transaksi
  const handleDetail = (item) => {
    const rawItems = Array.isArray(item.items) ? item.items.flat() : [];
    navigation.navigate('TransactionDetail', {
      transaction: {
        ...item,
        items: rawItems,
      },
    });
  };

  // Hapus Single Item Lintas Platform
  const handleDeleteSingle = (itemData) => {
    const targetId = getDocId(itemData);

    if (!targetId) {
      showAlert('Error', 'ID Transaksi tidak valid atau tidak ditemukan.');
      console.error('Data item tidak memiliki ID Firestore:', itemData);
      return;
    }

    const executeDelete = async () => {
      setLoading(true);
      try {
        const success = await deleteTransaction(targetId);
        if (success) {
          setAllTransactions((prev) => prev.filter((tx) => getDocId(tx) !== targetId));
          showAlert('Berhasil', 'Transaksi telah dihapus.');
        } else {
          showAlert('Gagal', 'Gagal menghapus transaksi dari Firestore.');
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showAlert('Error', 'Terjadi kesalahan sistem saat menghapus.');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Apakah Anda yakin ingin menghapus riwayat transaksi ini?');
      if (confirm) executeDelete();
    } else {
      Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus riwayat transaksi ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Hapus Batch berdasarkan Filter Lintas Platform
  const handleDeleteByFilter = () => {
    if (filteredTransactions.length === 0) {
      showAlert('Info', 'Tidak ada riwayat transaksi pada periode filter ini.');
      return;
    }

    const executeBatchDelete = async () => {
      setLoading(true);
      try {
        const targetIds = filteredTransactions
          .map((tx) => getDocId(tx))
          .filter((id) => id !== null && id !== undefined && id !== 'undefined');

        if (targetIds.length === 0) {
          showAlert('Error', 'Tidak ada ID transaksi valid yang dapat dihapus.');
          return;
        }

        const success = await deleteTransactionsByBatch(targetIds);

        if (success) {
          setAllTransactions((prev) => prev.filter((tx) => !targetIds.includes(getDocId(tx))));
          showAlert('Berhasil', 'Semua riwayat transaksi pada filter ini telah dihapus.');
        } else {
          showAlert('Gagal', 'Gagal menghapus beberapa riwayat transaksi.');
        }
      } catch (error) {
        console.error('Error batch deleting transactions:', error);
        showAlert('Error', 'Terjadi kesalahan sistem saat menghapus batch.');
      } finally {
        setLoading(false);
      }
    };

    const confirmMsg = `Anda akan menghapus ${filteredTransactions.length} transaksi pada periode ini. Tindakan ini tidak dapat dibatalkan!`;

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`Hapus Riwayat Filter\n\n${confirmMsg}`);
      if (confirm) executeBatchDelete();
    } else {
      Alert.alert('Hapus Riwayat Filter', confirmMsg, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Semua', style: 'destructive', onPress: executeBatchDelete },
      ]);
    }
  };

  // Statistik berdasarkan filter aktif
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  const totalItemsSold = filteredTransactions.reduce((sum, t) => {
    const items = Array.isArray(t.items) ? t.items.flat() : [];
    return sum + items.reduce((s, it) => s + (Number(it.qty || it.quantity) || 0), 0);
  }, 0);

  const summaryCard = (label, value, subLabel, icon, tint, soft) => (
    <View className="flex-1 p-3.5 rounded-[18px] bg-surface border border-hairline">
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: soft }}>
          <MaterialIcons name={icon} size={16} color={tint} />
        </View>
        <Text className="text-[11px] font-bold text-ink-muted">{label}</Text>
      </View>
      <Text className="text-[17px] font-extrabold text-ink" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-[10px] font-medium text-ink-muted mt-0.5">{subLabel}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View className="bg-surface px-5 pt-5 pb-4 rounded-b-[28px] shadow-sm mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center mr-3">
              <MaterialIcons name="history" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-[13px] font-medium text-ink-muted">Riwayat Penjualan</Text>
              <Text className="text-[19px] font-extrabold text-ink -tracking-tight">Riwayat</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-success-soft items-center justify-center"
              onPress={handleExport}
              disabled={exporting}
              activeOpacity={0.8}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <MaterialIcons name="file-download" size={20} color={colors.success} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-danger-soft items-center justify-center"
              onPress={handleDeleteByFilter}
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete-sweep" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter */}
        <View className="mt-4">
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            customDate={customDate}
            setCustomDate={setCustomDate}
          />
        </View>

        {/* Ringkasan filter aktif + Export */}
        {filteredTransactions.length > 0 && (
          <View className="mt-1.5">
            <View className="flex-row gap-2.5">
              {summaryCard('Total Penjualan', formatRupiah(totalRevenue), `${filteredTransactions.length} transaksi`, 'payments', colors.success, colors['success-soft'])}
              {summaryCard('Item Terjual', `${totalItemsSold} pcs`, `${totalItemsSold} produk rerata`, 'inventory', colors.accent, colors['accent-soft'])}
            </View>
            <TouchableOpacity
              className="mt-2.5 bg-primary rounded-2xl py-3 flex-row items-center justify-center"
              onPress={handleExport}
              disabled={exporting}
              activeOpacity={0.85}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="file-download" size={18} color="#fff" />
                  <Text className="text-white font-bold text-[13px] ml-2">
                    Export Excel ({filteredTransactions.length} data)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Daftar Transaksi */}
      {loading && page === 1 ? (
        <View className="items-center pt-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayedTransactions.length === 0 ? (
        <View className="items-center pt-20 px-8">
          <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-3">
            <MaterialIcons name="receipt-long" size={26} color={colors['ink-muted']} />
          </View>
          <Text className="text-center text-ink-muted text-[13px] font-medium">
            Tidak ada riwayat transaksi pada periode ini.
          </Text>
        </View>
      ) : (
        <FlatList
          className="px-4"
          data={displayedTransactions}
          keyExtractor={(item, index) => String(getDocId(item) || index)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const rawItems = Array.isArray(item.items) ? item.items.flat() : [];
            const itemId = getDocId(item);
            const isQRIS = item.paymentMethod === 'QRIS';

            return (
              <TouchableOpacity
                className="bg-surface rounded-[20px] mb-3 overflow-hidden border border-hairline"
                onPress={() => handleDetail(item)}
                activeOpacity={0.85}
              >
                <View className="flex-row items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-hairline">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isQRIS ? 'bg-accent-soft' : 'bg-success-soft'}`}>
                      <MaterialIcons name={isQRIS ? 'qr-code' : 'payments'} size={18} color={isQRIS ? colors.accent : colors.success} />
                    </View>
                    <View>
                      <Text className="font-bold text-[13px] text-ink">#{itemId ? String(itemId).substring(0, 8) : 'N/A'}</Text>
                      <Text className="text-[11px] text-ink-muted mt-0.5">{item.formattedTime || 'Baru Saja'}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-extrabold text-success text-base">
                      {formatRupiah(item.totalAmount)}
                    </Text>
                    <View className="mt-1">
                      {isQRIS ? (
                        <Text className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md overflow-hidden">QRIS</Text>
                      ) : (
                        <Text className="text-[10px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded-md overflow-hidden">TUNAI</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Ringkasan Item */}
                <View className="px-4 py-2.5 bg-bg/60">
                  {rawItems.slice(0, 2).map((prod, idx) => (
                    <View key={`${itemId || 'tx'}_item_${prod?.id || idx}`} className="flex-row items-center justify-between py-0.5">
                      <Text className="text-[12px] text-ink font-medium flex-1" numberOfLines={1}>
                        {prod?.name || prod?.nama || 'Produk'} × {prod?.qty || prod?.quantity || 1}
                      </Text>
                      <Text className="text-[12px] text-ink-muted ml-2">
                        {formatRupiah(prod?.subtotal || (prod?.price || 0) * (prod?.qty || 1))}
                      </Text>
                    </View>
                  ))}
                  {rawItems.length > 2 && (
                    <Text className="text-[11px] text-accent italic mt-1 font-semibold">
                      + {rawItems.length - 2} produk lainnya...
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row px-4 py-3 gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary py-2.5 rounded-xl items-center flex-row justify-center"
                    onPress={() => handleDetail(item)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="visibility" size={15} color="#fff" />
                    <Text className="text-white font-bold text-[12px] ml-1.5">Lihat Detail</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-danger-soft py-2.5 px-4 rounded-xl items-center border border-danger"
                    activeOpacity={0.85}
                    onPress={(e) => {
                      if (e && typeof e.stopPropagation === 'function') {
                        e.stopPropagation();
                      }
                      handleDeleteSingle(item);
                    }}
                  >
                    <MaterialIcons name="delete-outline" size={17} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            displayedTransactions.length < filteredTransactions.length ? (
              <TouchableOpacity
                className="bg-surface border border-hairline p-3.5 rounded-2xl items-center my-2 flex-row justify-center"
                onPress={handleLoadMore}
                activeOpacity={0.85}
              >
                <MaterialIcons name="expand-more" size={18} color={colors.primary} />
                <Text className="text-ink font-bold ml-1">
                  Muat Lainnya ({filteredTransactions.length - displayedTransactions.length})
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}