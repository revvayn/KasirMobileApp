import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, filterTransactionsByPeriod, deleteTransaction, deleteTransactionsByBatch } from '../services/transactionService';
import FilterBar from '../components/FilterBar';
import colors from '../theme/colors';

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
        <View className="flex-1 p-4 bg-bg">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-extrabold text-ink">Riwayat Penjualan</Text>
                {filteredTransactions.length > 0 && (
                    <TouchableOpacity className="bg-danger-soft px-2.5 py-1.5 rounded-lg border border-danger" onPress={handleDeleteByFilter} activeOpacity={0.8}>
                        <Text className="text-danger font-bold text-xs">Hapus Filter Ini</Text>
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
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
            ) : displayedTransactions.length === 0 ? (
                <Text className="text-center text-ink-muted mt-8">Tidak ada riwayat transaksi pada periode ini.</Text>
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
                            <TouchableOpacity className="bg-surface p-3.5 rounded-card mb-3 shadow-md" onPress={() => handleDetail(item)} activeOpacity={0.8}>
                                <View className="flex-row justify-between mb-2 border-b border-hairline pb-1.5">
                                    <View>
                                        <Text className="font-bold text-ink">
                                            #{itemId ? String(itemId).substring(0, 8) : 'N/A'}
                                        </Text>
                                        <Text className="text-[11px] text-ink-muted mt-0.5 mb-1">{item.formattedTime || 'Baru Saja'}</Text>

                                        <View className={`self-start px-2 py-0.5 rounded mt-1 ${item.paymentMethod === 'QRIS' ? 'bg-accent-soft' : 'bg-success-soft'}`}>
                                            <Text className={`text-[11px] font-bold tracking-wide ${item.paymentMethod === 'QRIS' ? 'text-accent' : 'text-success'}`}>
                                                {item.paymentMethod === 'QRIS' ? 'QRIS' : 'TUNAI'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="items-end">
                                        <Text className="font-extrabold text-success text-base">
                                            Rp {Number(item.totalAmount || 0).toLocaleString('id-ID')}
                                        </Text>
                                        {item.paymentMethod === 'CASH' && item.change > 0 && (
                                            <Text className="text-[11px] text-danger mt-0.5">
                                                Kembali: Rp {Number(item.change || 0).toLocaleString('id-ID')}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Ringkasan Item */}
                                <View className="my-1.5">
                                    {rawItems.slice(0, 3).map((prod, idx) => (
                                        <Text key={`${itemId || 'tx'}_item_${prod?.id || idx}`} className="text-[13px] text-ink-muted mb-0.5" numberOfLines={1}>
                                            • {prod?.name || prod?.nama || 'Produk'} x{prod?.qty || prod?.quantity || 1} = Rp {Number(prod?.subtotal || (prod?.price * (prod?.qty || 1)) || 0).toLocaleString('id-ID')}
                                        </Text>
                                    ))}
                                    {rawItems.length > 3 && (
                                        <Text className="text-[11px] text-accent italic mt-0.5 font-semibold">+ {rawItems.length - 3} produk lainnya...</Text>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row justify-between mt-2.5 pt-2 border-t border-hairline gap-2">
                                    <TouchableOpacity className="bg-primary py-2 px-3.5 rounded-lg items-center flex-[0.68]" onPress={() => handleDetail(item)} activeOpacity={0.85}>
                                        <Text className="text-white font-bold text-[13px]">Lihat Detail</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="bg-danger-soft py-2 px-3.5 rounded-lg items-center flex-[0.28] border border-danger"
                                        activeOpacity={0.85}
                                        onPress={(e) => {
                                            if (e && typeof e.stopPropagation === 'function') {
                                                e.stopPropagation();
                                            }
                                            handleDeleteSingle(item);
                                        }}
                                    >
                                        <Text className="text-danger font-bold text-[13px]">Hapus</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListFooterComponent={() =>
                        displayedTransactions.length < filteredTransactions.length ? (
                            <TouchableOpacity className="bg-surface border border-hairline p-3 rounded-2xl items-center my-3" onPress={handleLoadMore} activeOpacity={0.85}>
                                <Text className="text-ink font-bold">
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
