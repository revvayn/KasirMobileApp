import { db } from '../config/firebase';
import {
  collection,
  writeBatch,
  doc,
  increment,
  serverTimestamp,
  getDoc,
  runTransaction,
  setDoc,
} from 'firebase/firestore';

// ---- QRIS ----

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

// Simpan URL QRIS (bugfix: sebelumnya belum diimplementasikan)
export const saveQRISUrl = async (url) => {
  try {
    await setDoc(doc(db, 'settings', 'qris'), { url: String(url || '').trim(), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (error) {
    console.error('❌ [saveQRISUrl] Error saving QRIS:', error);
    return false;
  }
};

// ---- Nomor Invoice ----
// Format: INV-YYYYMMDD-NNNN. Per-hari via dokumen counter di koleksi 'counters'.
const getNextInvoiceNumber = async () => {
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counterRef = doc(db, 'counters', `invoice-${dateKey}`);

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? Number(snap.data().lastNumber || 0) : 0;
    const value = current + 1;
    tx.set(counterRef, { lastNumber: value });
    return value;
  });

  return `INV-${dateKey}-${String(next).padStart(4, '0')}`;
};

// ---- Pembayaran ----

// Memproses pembayaran sekaligus memotong stok produk secara atomis.
// options: { cashier } — identitas kasir { uid, email, displayName? } untuk filter rekap per user.
// Diskon hanya milik produk (items[].discountPercent); tidak ada diskon invoice.
export const processPayment = async (
  cartItems,
  totalAmount,
  paymentMethod,
  cashReceived,
  change,
  options = {}
) => {
  try {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('❌ [processPayment] Cart items kosong atau tidak valid.');
      return { success: false, message: 'Keranjang belanja kosong.' };
    }

    const batch = writeBatch(db);

    // 1. Buat Referensi Dokumen Transaksi Baru
    const transRef = doc(collection(db, 'transactions'));

    // Nomor invoice dalam transaksi atomis yang sama dengan pembuatan transaksi
    const invoiceNumber = await getNextInvoiceNumber();

    // Snapshot harga modal (cost) per item agar laba historis tetap akurat
    const cleanItems = cartItems.flat().map((item) => ({
      ...item,
      cost: Number(item.cost ?? item.hargaModal ?? 0),
    }));
    const formattedTimeStr = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const invoiceDiscountPercent = Math.min(
      Math.max(Number(options.discountPercent) || 0, 0),
      100
    );
    const subtotal = cleanItems.reduce(
      (sum, it) => sum + (Number(it.subtotal) || 0),
      0
    );
    const invoiceDiscountAmount =
      invoiceDiscountPercent > 0
        ? Math.round(subtotal * (invoiceDiscountPercent / 100))
        : Number(options.discountAmount) || 0;

    const transactionData = {
      items: cleanItems,
      invoiceNumber,
      totalAmount: Number(totalAmount) || 0,
      subtotal,
      discountPercent: invoiceDiscountPercent,
      discountAmount: invoiceDiscountAmount,
      paymentMethod: paymentMethod || 'CASH',
      paymentAmount: Number(cashReceived) || Number(totalAmount) || 0,
      cashReceived: Number(cashReceived) || Number(totalAmount) || 0,
      change: Number(change) || 0,
      cashier: options.cashier
        ? {
            uid: String(options.cashier.uid || ''),
            email: String(options.cashier.email || ''),
            displayName: String(options.cashier.displayName || options.cashier.email || ''),
          }
        : null,
      createdAt: serverTimestamp(),
      formattedTime: formattedTimeStr,
    };

    batch.set(transRef, transactionData);

    // 2. Konsolidasi Quantity produk yang memiliki ID sama
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

    // 3. Potong stok setiap produk unik
    Object.keys(productQtyMap).forEach((productId) => {
      const qtyToDeduct = productQtyMap[productId];
      batch.update(doc(db, 'products', productId), {
        stock: increment(-qtyToDeduct),
      });
    });

    // 4. Eksekusi batch transaksi secara atomis
    await batch.commit();

    console.log(`✅ [processPayment] ${invoiceNumber} berhasil & stok terpotong!`);

    return {
      success: true,
      transaction: {
        id: transRef.id,
        ...transactionData,
      },
    };
  } catch (error) {
    console.error('❌ [processPayment] Gagal memproses pembayaran & potong stok:', error);
    return { success: false, error: error.message || error };
  }
};