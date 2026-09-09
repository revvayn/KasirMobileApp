import { db } from "../config/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const productsCollection = collection(db, "products");

// Menggunakan URL Gambar Langsung dari Link
export const uploadProductImage = async (url) => {
  if (!url || url.trim() === "") {
    return "https://via.placeholder.com/150"; // Gambar default jika kosong
  }
  return url.trim();
};

// Ambil semua produk
export const getProducts = async () => {
  try {
    const data = await getDocs(productsCollection);
    return data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    return [];
  }
};

// Tambah produk baru
export const addProduct = async (name, price, stock, imageUrl, category = "", description = "", cost = null, variants = [], modifiers = [], minStock = 5) => {
  try {
    await addDoc(productsCollection, {
      name,
      price: Number(price),
      cost: cost === null || cost === "" ? Number(price) : Number(cost),
      stock: Number(stock),
      minStock: Number(minStock) || 5,
      imageUrl: imageUrl || "https://via.placeholder.com/150",
      category,
      description,
      variants: sanitizeVariants(variants),
      modifiers: sanitizeModifiers(modifiers),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Gagal menambah produk:", error);
  }
};

// Update produk
export const updateProduct = async (id, name, price, stock, imageUrl, category = "", description = "", cost = null, variants = [], modifiers = [], minStock = 5) => {
  try {
    const productDoc = doc(db, "products", id);
    await updateDoc(productDoc, {
      name,
      price: Number(price),
      cost: cost === null || cost === "" ? Number(price) : Number(cost),
      stock: Number(stock),
      minStock: Number(minStock) || 5,
      imageUrl: imageUrl || "https://via.placeholder.com/150",
      category,
      description,
      variants: sanitizeVariants(variants),
      modifiers: sanitizeModifiers(modifiers),
    });
  } catch (error) {
    console.error("Gagal memperbarui produk:", error);
  }
};

// Bersihkan daftar varian: buang entri tanpa nama, harga modal dalam angka baku.
export const sanitizeVariants = (variants) =>
  (Array.isArray(variants) ? variants : [])
    .filter((v) => v && v.name && String(v.name).trim() !== "")
    .map((v) => ({
      id: String(v.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      name: String(v.name).trim(),
      extraPrice: Number(v.extraPrice) || 0,
    }));

// Bersihkan daftar modifier: buang grup tanpa nama & hapus opsi kosong.
export const sanitizeModifiers = (modifiers) =>
  (Array.isArray(modifiers) ? modifiers : [])
    .filter((m) => m && m.name && String(m.name).trim() !== "")
    .map((m) => {
      const options = (Array.isArray(m.options) ? m.options : [])
        .map((o) => String(o || "").trim())
        .filter(Boolean);
      return {
        id: String(m.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        name: String(m.name).trim(),
        options,
      };
    })
    .filter((m) => m.options.length > 0);

// Hapus produk
export const deleteProduct = async (id) => {
  try {
    const productDoc = doc(db, "products", id);
    await deleteDoc(productDoc);
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
  }
};