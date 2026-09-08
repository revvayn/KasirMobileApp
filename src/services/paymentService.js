import { db } from '../config/firebase';
import { 
    collection, 
    writeBatch, 
    doc, 
    increment, 
    serverTimestamp,
    getDoc 
} from 'firebase/firestore';

// Ambil URL QRIS dari Firestore
export const getQRISUrl = async () => {
    try {
        const docRef = doc(db, 'settings', 'qris');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().url || '';
        }
        return '';
    } catch (error) {
        console.error('❌ [getQRISUrl] Error fetching QRIS:', error);
        return '';
    }
};

// Memproses pembayaran sekaligus memotong stok otomatis secara aman
export const processPayment = async (cartItems, totalAmount, paymentMethod, cashReceived, change) => {
    try {
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            console.error('❌ [processPayment] Cart items kosong atau tidak valid.');
            return { success: false, message: 'Keranjang belanja kosong.' };
        }

        const batch = writeBatch(db);

        // 1. Buat Referensi Dokumen Transaksi Baru
        const transRef = doc(collection(db, 'transactions'));
        
        const cleanItems = cartItems.flat();
        const formattedTimeStr = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const transactionData = {
            items: cleanItems,
            totalAmount: Number(totalAmount) || 0,
            paymentMethod: paymentMethod || 'CASH',
            cashReceived: Number(cashReceived) || 0,
            change: Number(change) || 0,
            createdAt: serverTimestamp(),
            formattedTime: formattedTimeStr,
        };

        batch.set(transRef, transactionData);

        // 2. Gabungkan (Konsolidasi) Quantity Produk yang Memiliki ID Sama
        // Menghindari error batch update berulang pada dokumen produk yang sama
        const productQtyMap = {};

        cleanItems.forEach((item) => {
            const productId = item.firestoreDocId || item.id || item.docId;
            const qtyPurchased = Number(item.qty || item.quantity || 1);

            if (productId) {
                const cleanId = String(productId).trim();
                productQtyMap[cleanId] = (productQtyMap[cleanId] || 0) + qtyPurchased;
            } else {
                console.warn('⚠️ [processPayment] Produk tidak memiliki ID Firestore yang valid:', item);
            }
        });

        // 3. Potong Stok Setiap Produk Unik di Koleksi 'products'
        Object.keys(productQtyMap).forEach((productId) => {
            const qtyToDeduct = productQtyMap[productId];
            const productRef = doc(db, 'products', productId);

            batch.update(productRef, {
                stock: increment(-qtyToDeduct)
            });
        });

        // 4. Eksekusi Batch Transaksi secara Atomis
        await batch.commit();

        console.log(`✅ [processPayment] Transaksi ${transRef.id} berhasil & stok terpotong!`);

        return {
            success: true,
            transaction: {
                id: transRef.id,
                ...transactionData,
            }
        };
    } catch (error) {
        console.error('❌ [processPayment] Gagal memproses pembayaran & potong stok:', error);
        return { success: false, error: error.message || error };
    }
};