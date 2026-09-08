import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, filterTransactionsByPeriod, deleteTransaction, deleteTransactionsByBatch } from '../services/transactionService';
import FilterBar from '../components/FilterBar';

export default function HistoryScreen({ navigation }) {
    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [displayedTransactions, setDisplayedTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

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
            console.error('❌ Data item tidak memiliki ID Firestore:', itemData);
            return;
        }

        const executeDelete = async () => {
            setLoading(true);
            try {
                const success = await deleteTransaction(targetId);
                if (success) {
                    setAllTransactions((prev) =>
                        prev.filter((tx) => getDocId(tx) !== targetId)
                    );
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
            Alert.alert(
                'Konfirmasi Hapus',
                'Apakah Anda yakin ingin menghapus riwayat transaksi ini?',
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus', style: 'destructive', onPress: executeDelete },
                ]
            );
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
                    setAllTransactions((prev) =>
                        prev.filter((tx) => !targetIds.includes(getDocId(tx)))
                    );
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
            Alert.alert(
                'Hapus Riwayat Filter',
                confirmMsg,
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus Semua', style: 'destructive', onPress: executeBatchDelete },
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Riwayat Penjualan</Text>
                {filteredTransactions.length > 0 && (
                    <TouchableOpacity style={styles.btnBulkDelete} onPress={handleDeleteByFilter}>
                        <Text style={styles.btnBulkDeleteText}>🗑️ Hapus Filter Ini</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Component */}
            <FilterBar
                filter={filter}
                setFilter={setFilter}
                customDate={customDate}
                setCustomDate={setCustomDate}
            />

            {loading && page === 1 ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : displayedTransactions.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada riwayat transaksi pada periode ini.</Text>
            ) : (
                <FlatList
                    data={displayedTransactions}
                    keyExtractor={(item, index) => String(getDocId(item) || index)}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    renderItem={({ item }) => {
                        const rawItems = Array.isArray(item.items) ? item.items.flat() : [];
                        const itemId = getDocId(item);

                        return (
                            <TouchableOpacity style={styles.card} onPress={() => handleDetail(item)} activeOpacity={0.8}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.transId}>
                                            ID: #{itemId ? String(itemId).substring(0, 8) : 'N/A'}
                                        </Text>
                                        <Text style={styles.timeText}>🕒 {item.formattedTime || 'Baru Saja'}</Text>

                                        <View style={[styles.methodBadge, item.paymentMethod === 'QRIS' ? styles.badgeQris : styles.badgeCash]}>
                                            <Text style={styles.methodText}>
                                                {item.paymentMethod === 'QRIS' ? '📱 QRIS' : '💵 CASH'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.totalText}>
                                            Rp {Number(item.totalAmount || 0).toLocaleString('id-ID')}
                                        </Text>
                                        {item.paymentMethod === 'CASH' && item.change > 0 && (
                                            <Text style={styles.changeText}>
                                                Kembali: Rp {Number(item.change || 0).toLocaleString('id-ID')}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Ringkasan Item */}
                                <View style={styles.itemList}>
                                    {rawItems.slice(0, 3).map((prod, idx) => (
                                        <Text key={`${itemId || 'tx'}_item_${prod?.id || idx}`} style={styles.itemText} numberOfLines={1}>
                                            • {prod?.name || prod?.nama || 'Produk'} x{prod?.qty || prod?.quantity || 1} = Rp {Number(prod?.subtotal || (prod?.price * (prod?.qty || 1)) || 0).toLocaleString('id-ID')}
                                        </Text>
                                    ))}
                                    {rawItems.length > 3 && (
                                        <Text style={styles.moreItemsText}>+ {rawItems.length - 3} produk lainnya...</Text>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.btnDetail} onPress={() => handleDetail(item)}>
                                        <Text style={styles.btnDetailText}>👁️ Lihat Detail</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.btnDelete}
                                        onPress={(e) => {
                                            if (e && typeof e.stopPropagation === 'function') {
                                                e.stopPropagation();
                                            }
                                            handleDeleteSingle(item);
                                        }}
                                    >
                                        <Text style={styles.btnDeleteText}>🗑️ Hapus</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListFooterComponent={() =>
                        displayedTransactions.length < filteredTransactions.length ? (
                            <TouchableOpacity style={styles.btnLoadMore} onPress={handleLoadMore}>
                                <Text style={styles.btnLoadMoreText}>
                                    Muat Lebih Banyak ({filteredTransactions.length - displayedTransactions.length})
                                </Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    btnBulkDelete: { backgroundColor: '#ffebee', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ef5350' },
    btnBulkDeleteText: { color: '#c62828', fontWeight: 'bold', fontSize: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 30 },
    card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 6 },
    transId: { fontWeight: 'bold', color: '#333' },
    timeText: { fontSize: 11, color: '#777', marginTop: 2, marginBottom: 4 },
    totalText: { fontWeight: 'bold', color: '#2e7d32', fontSize: 16 },
    changeText: { fontSize: 11, color: '#d32f2f', marginTop: 2 },
    methodBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    badgeCash: { backgroundColor: '#e8f5e9' },
    badgeQris: { backgroundColor: '#e3f2fd' },
    methodText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
    itemList: { marginVertical: 6 },
    itemText: { fontSize: 13, color: '#444', marginBottom: 2 },
    moreItemsText: { fontSize: 11, color: '#007AFF', fontStyle: 'italic', marginTop: 2 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    btnDetail: { backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, flex: 0.68, alignItems: 'center' },
    btnDetailText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    btnDelete: { backgroundColor: '#ffebee', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, flex: 0.28, alignItems: 'center', borderWidth: 1, borderColor: '#ffcdd2' },
    btnDeleteText: { color: '#c62828', fontWeight: 'bold', fontSize: 13 },
    btnLoadMore: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 12 },
    btnLoadMoreText: { color: '#333', fontWeight: 'bold' },
});