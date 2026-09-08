import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: [],

  // Tambah produk ke keranjang
  addToCart: (product) => {
    const currentCart = get().cart;
    const existingIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      // Jika produk sudah ada, tambah quantity
      const updatedCart = [...currentCart];
      updatedCart[existingIndex].qty += 1;
      set({ cart: updatedCart });
    } else {
      // Jika produk belum ada, masukkan sebagai item baru dengan qty 1
      set({ cart: [...currentCart, { ...product, qty: 1 }] });
    }
  },

  // Kurangi quantity atau hapus item jika qty = 1
  decreaseQty: (productId) => {
    const currentCart = get().cart;
    const existingItem = currentCart.find((item) => item.id === productId);

    if (existingItem.qty > 1) {
      set({
        cart: currentCart.map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        ),
      });
    } else {
      // Hapus dari keranjang jika qty mencapai 0
      set({ cart: currentCart.filter((item) => item.id !== productId) });
    }
  },

  // Hapus item dari keranjang
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.id !== productId) });
  },

  // Bersihkan keranjang (setelah transaksi selesai)
  clearCart: () => set({ cart: [] }),

  // Hitung total harga seluruh item di keranjang
  getTotalPrice: () => {
    return get().cart.reduce((total, item) => total + item.price * item.qty, 0);
  },
}));