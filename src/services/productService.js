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
export const addProduct = async (name, price, stock, imageUrl, category = "", description = "", cost = null) => {
  try {
    await addDoc(productsCollection, {
      name,
      price: Number(price),
      cost: cost === null || cost === "" ? Number(price) : Number(cost),
      stock: Number(stock),
      imageUrl: imageUrl || "https://via.placeholder.com/150",
      category,
      description,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Gagal menambah produk:", error);
  }
};

// Update produk
export const updateProduct = async (id, name, price, stock, imageUrl, category = "", description = "", cost = null) => {
  try {
    const productDoc = doc(db, "products", id);
    await updateDoc(productDoc, {
      name,
      price: Number(price),
      cost: cost === null || cost === "" ? Number(price) : Number(cost),
      stock: Number(stock),
      imageUrl: imageUrl || "https://via.placeholder.com/150",
      category,
      description,
    });
  } catch (error) {
    console.error("Gagal memperbarui produk:", error);
  }
};

// Hapus produk
export const deleteProduct = async (id) => {
  try {
    const productDoc = doc(db, "products", id);
    await deleteDoc(productDoc);
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
  }
};