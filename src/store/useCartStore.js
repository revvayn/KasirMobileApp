import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bangun cartId unik dari kombinasi: product ID + varian + pilihan modifier + catatan.
// Produk yang sama tetapi varian/catatan berbeda akan menjadi item terpisah.
const buildCartId = (productId, variant, modifiers, customNote) =>
  [
    productId || '',
    variant?.id || '',
    (modifiers || [])
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((m) => `${m.id}:${m.option || m.options || ''}`)
      .join('|'),
    String(customNote || '').trim(),
  ].join('__');

// Harga satuan akhir setelah diskon % per item (dibulatkan ke rupiah utuh).
export const calcUnitPrice = (basePrice, extraPrice, discountPercent = 0) => {
  const rate = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
  const raw = Number(basePrice) + Number(extraPrice);
  return Math.round(raw * (1 - rate / 100));
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      // Tambah produk ke keranjang dengan opsi varian/modifier/catatan/diskon.
      // Kombinasi yang sama menambah qty (menggunakan diskon terbaru);
      // kombinasi berbeda jadi item terpisah.
      addToCart: (product, options = {}) => {
        const {
          variant = null,
          modifiers = [],
          customNote = '',
          quantity = 1,
          discountPercent = 0,
        } = options;

        const productId = product.firestoreDocId || product.id || product.docId;
        const stockLimit = Number(product.stock || 0);
        const basePrice = Number(product.price) || 0;
        const extraPrice = Number(variant?.extraPrice) || 0;
        const rate = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
        const unitPrice = calcUnitPrice(basePrice, extraPrice, rate);
        const note = String(customNote || '').trim();

        const newCartId = buildCartId(productId, variant, modifiers, note);
        const currentCart = get().cart;
        const existingIndex = currentCart.findIndex(
          (item) => item.cartId === newCartId
        );

        if (existingIndex > -1) {
          const existing = currentCart[existingIndex];
          if (existing.qty + quantity > stockLimit) {
            return { ok: false, reason: 'STOCK_LIMIT' };
          }
          const qty = existing.qty + quantity;
          // Pakai diskon terbaru dari opsi (default memakai diskon lama).
          const nextRate =
            options.discountPercent !== undefined
              ? rate
              : Number(existing.discountPercent) || 0;
          const nextUnitPrice = calcUnitPrice(basePrice, extraPrice, nextRate);
          set({
            cart: currentCart.map((item) =>
              item.cartId === newCartId
                ? {
                    ...item,
                    qty,
                    discountPercent: nextRate,
                    unitPrice: nextUnitPrice,
                    subtotal: nextUnitPrice * qty,
                  }
                : item
            ),
          });
          return { ok: true, qty };
        }

        if (quantity > stockLimit) {
          return { ok: false, reason: 'STOCK_LIMIT' };
        }

        const cartItem = {
          cartId: newCartId,
          id: productId,
          firestoreDocId: productId,
          docId: productId,
          name: product.name || product.nama || 'Produk',
          price: basePrice,
          unitPrice,
          cost: Number(product.cost ?? 0),
          stock: stockLimit,
          imageUrl: product.imageUrl,
          category: product.category,
          qty: quantity,
          subtotal: unitPrice * quantity,
          variant: variant ? { ...variant } : null,
          modifiers: (modifiers || []).map((m) => ({
            id: m.id,
            name: m.name,
            option: m.option || m.options || '',
          })),
          customNote: note,
          discountPercent: rate,
        };

        set({ cart: [...currentCart, cartItem] });
        return { ok: true, qty: quantity };
      },

      // Ubah diskon % satu baris item keranjang (per kartId).
      setItemDiscount: (cartId, discountPercent) => {
        const rate = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
        set({
          cart: get().cart.map((item) => {
            if (item.cartId !== cartId) return item;
            const extra = Number(item.variant?.extraPrice) || 0;
            const unitPrice = calcUnitPrice(item.price, extra, rate);
            return {
              ...item,
              discountPercent: rate,
              unitPrice,
              subtotal: unitPrice * item.qty,
            };
          }),
        });
      },

      // Naikkan jumlah item keranjang berdasarkan cartId (pakai opsi yang sudah dipilih).
      increaseQty: (cartId) => {
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.cartId === cartId);
        if (!existing) return { ok: false };

        if (existing.qty + 1 > Number(existing.stock || 0)) {
          return { ok: false, reason: 'STOCK_LIMIT' };
        }

        set({
          cart: currentCart.map((item) =>
            item.cartId === cartId
              ? {
                  ...item,
                  qty: item.qty + 1,
                  subtotal: item.unitPrice * (item.qty + 1),
                }
              : item
          ),
        });
        return { ok: true };
      },

      // Kurangi qty; hapus item jika qty sisa 1.
      decreaseQty: (cartId) => {
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.cartId === cartId);
        if (!existing) return;

        if (existing.qty > 1) {
          set({
            cart: currentCart.map((item) =>
              item.cartId === cartId
                ? {
                    ...item,
                    qty: item.qty - 1,
                    subtotal: item.unitPrice * (item.qty - 1),
                  }
                : item
            ),
          });
        } else {
          set({ cart: currentCart.filter((item) => item.cartId !== cartId) });
        }
      },

      // Hapus item dari keranjang
      removeFromCart: (cartId) => {
        set({ cart: get().cart.filter((item) => item.cartId !== cartId) });
      },

      // Bersihkan keranjang (setelah transaksi selesai / tombol kosongkan)
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'kasir-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);