import { db } from "../config/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  writeBatch,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { normalizeMoney } from "../utils/currency";

// Re-export helper Rupiah agar konsisten dipakai satu sumber
export { formatRupiah, formatRupiahInput, parseRupiahInput } from "../utils/currency";

/**
 * Menyimpan transaksi baru sekaligus mengurangi stok produk secara otomatis.
 * Menggunakan writeBatch agar operasi pembuatan riwayat dan pemotongan stok berjalan atomis.
 */
export const createTransaction = async (transactionData) => {
  try {
    const batch = writeBatch(db);

    // 1. Buat referensi dokumen transaksi baru di koleksi 'transactions'
    const transRef = doc(collection(db, "transactions"));

    // Normalisasi nilai nominal: terima number maupun string berformat
    // ("Rp 100.000", "100.000") lalu simpan sebagai angka baku.
    const normalizedTotal = normalizeMoney(transactionData.totalAmount);
    const normalizedPayment = normalizeMoney(
      transactionData.paymentAmount ?? transactionData.cashAmount ?? transactionData.cashReceived,
      normalizedTotal
    );
    const normalizedChange = normalizeMoney(
      transactionData.change,
      normalizedPayment > normalizedTotal ? normalizedPayment - normalizedTotal : 0
    );

    const payload = {
      ...transactionData,
      totalAmount: normalizedTotal,
      paymentAmount: normalizedPayment,
      cashReceived: normalizedPayment,
      change: normalizedChange,
      createdAt: serverTimestamp(),
      formattedTime: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    batch.set(transRef, payload);

    // 2. Potong stok setiap produk yang ada di dalam keranjang
    const items = Array.isArray(transactionData.items) ? transactionData.items.flat() : [];

    items.forEach((item) => {
      // Mengambil ID Dokumen produk di Firestore
      const productId = item.firestoreDocId || item.id || item.docId;
      const qtyPurchased = Number(item.qty || item.quantity || 1);

      if (productId) {
        const productRef = doc(db, "products", String(productId).trim());
        
        // Gunakan increment(-qtyPurchased) untuk mengurangi stok
        batch.update(productRef, {
          stock: increment(-qtyPurchased)
        });
      } else {
        console.warn("⚠️ Produk tidak memiliki ID Firestore yang valid untuk potong stok:", item);
      }
    });

    // 3. Eksekusi batch sekaligus
    await batch.commit();
    console.log("✅ Transaksi berhasil dibuat dan stok produk berhasil dipotong!");
    return { success: true, id: transRef.id };

  } catch (error) {
    console.error("❌ [createTransaction] Gagal memproses transaksi & potong stok:", error);
    return { success: false, error };
  }
};

// Mengambil seluruh riwayat transaksi
export const getTransactions = async () => {
  try {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      
      const item = {
        ...data,
        id: docSnap.id, // ID Dokumen Firestore Asli
        firestoreDocId: docSnap.id, // Cadangan ID Firestore
        createdAtDate: createdAtDate,
        formattedTime: createdAtDate.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      transactions.push(item);
    });

    console.log("📦 [getTransactions] Sample Data Pertama yang Di-fetch:", transactions[0]);
    return transactions;
  } catch (error) {
    console.error("❌ [getTransactions] Gagal mengambil riwayat transaksi:", error);
    return [];
  }
};

// Helper fungsi untuk memfilter array transaksi berdasarkan jenis filter atau tanggal
export const filterTransactionsByPeriod = (transactions, filterType, customDate = null) => {
  const now = new Date();

  return transactions.filter((trans) => {
    const transDate = trans.createdAtDate;
    if (!transDate) return true;

    if (filterType === 'custom' && customDate) {
      let target;
      if (typeof customDate === 'string' && customDate.includes('-')) {
        const [year, month, day] = customDate.split('-').map(Number);
        target = new Date(year, month - 1, day);
      } else {
        target = new Date(customDate);
      }

      return (
        transDate.getDate() === target.getDate() &&
        transDate.getMonth() === target.getMonth() &&
        transDate.getFullYear() === target.getFullYear()
      );
    } else if (filterType === 'today') {
      return (
        transDate.getDate() === now.getDate() &&
        transDate.getMonth() === now.getMonth() &&
        transDate.getFullYear() === now.getFullYear()
      );
    } else if (filterType === 'month') {
      return (
        transDate.getMonth() === now.getMonth() &&
        transDate.getFullYear() === now.getFullYear()
      );
    } else if (filterType === 'year') {
      return transDate.getFullYear() === now.getFullYear();
    }
    return true; // Mode 'all'
  });
};

// Mengolah statistik untuk Dashboard
export const getDashboardStats = async (filterType = 'all', customDate = null) => {
  try {
    const allTransactions = await getTransactions();
    const filteredTransactions = filterTransactionsByPeriod(allTransactions, filterType, customDate);

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const productSalesMap = {};

    filteredTransactions.forEach((trans) => {
      totalRevenue += Number(trans.totalAmount) || 0;

      if (Array.isArray(trans.items)) {
        const itemsList = trans.items.flat();
        itemsList.forEach((item) => {
          const qty = Number(item.qty || item.quantity) || 0;
          const name = item.name || item.nama || "Tanpa Nama";
          
          totalItemsSold += qty;
          productSalesMap[name] = (productSalesMap[name] || 0) + qty;
        });
      }
    });

    const topProducts = Object.keys(productSalesMap)
      .map((name) => ({ name, qty: productSalesMap[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalTransactions: filteredTransactions.length,
      totalRevenue,
      totalItemsSold,
      topProducts,
      recentTransactions: filteredTransactions.slice(0, 5),
    };
  } catch (error) {
    console.error("Gagal mengambil statistik dashboard: ", error);
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalItemsSold: 0,
      topProducts: [],
      recentTransactions: [],
    };
  }
};

// Hapus 1 Transaksi
export const deleteTransaction = async (id) => {
  console.log("🔍 [deleteTransaction] Argumen 'id' yang diterima:", id, "| Tipe data:", typeof id);

  if (!id) {
    console.error("❌ [deleteTransaction] Abort! ID bernilai null/undefined.");
    return false;
  }

  try {
    const stringId = String(id).trim();
    const docRef = doc(db, 'transactions', stringId);

    console.log("🚀 [deleteTransaction] Mencoba hapus ke Path Firestore:", docRef.path);
    
    await deleteDoc(docRef);

    console.log("✅ [deleteTransaction] Perintah deleteDoc berhasil dieksekusi untuk Path:", docRef.path);
    return true;
  } catch (error) {
    console.error('❌ [deleteTransaction] Gagal menghapus dokumen di Firestore:', error);
    return false;
  }
};

// Hapus Transaksi secara Batch (Multiple)
export const deleteTransactionsByBatch = async (ids = []) => {
  console.log("🔍 [deleteTransactionsByBatch] Array IDs yang diterima:", ids);

  if (!ids || ids.length === 0) {
    console.warn("⚠️ [deleteTransactionsByBatch] Array IDs kosong.");
    return true;
  }
  
  try {
    const cleanIds = ids.map((id) => String(id).trim()).filter(Boolean);
    const CHUNK_SIZE = 450;

    for (let i = 0; i < cleanIds.length; i += CHUNK_SIZE) {
      const chunk = cleanIds.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      console.log(`🚀 [deleteTransactionsByBatch] Memproses Batch chunk ${i / CHUNK_SIZE + 1}:`, chunk);

      chunk.forEach((id) => {
        const docRef = doc(db, 'transactions', id);
        batch.delete(docRef);
      });

      await batch.commit();
    }
    
    console.log("✅ [deleteTransactionsByBatch] Commit Batch berhasil diselesaikan!");
    return true;
  } catch (error) {
    console.error('❌ [deleteTransactionsByBatch] Gagal menghapus batch di Firestore:', error);
    return false;
  }
};