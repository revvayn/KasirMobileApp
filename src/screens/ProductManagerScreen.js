import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  uploadProductImage 
} from '../services/productService';

export default function ProductManagerScreen() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Menggunakan URL Link
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handleSave = async () => {
    if (!name || !price || stock === '') {
      Alert.alert('Peringatan', 'Harap isi nama, harga, dan stok!');
      return;
    }

    setUploading(true);

    try {
      const finalImageUrl = await uploadProductImage(imageUrl);

      if (editingId) {
        await updateProduct(editingId, name, price, stock, finalImageUrl, category, description);
      } else {
        await addProduct(name, price, stock, finalImageUrl, category, description);
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setPrice(item.price !== undefined && item.price !== null ? String(item.price) : '0');
    setStock(item.stock !== undefined && item.stock !== null ? String(item.stock) : '0');
    setCategory(item.category || '');
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    fetchProducts();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
    setCategory('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</Text>

      {/* Form Input */}
      <TextInput style={styles.input} placeholder="Nama Produk" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Kategori (misal: Komponen)" value={category} onChangeText={setCategory} />
      <TextInput style={styles.input} placeholder="Harga (Rp)" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <TextInput style={styles.input} placeholder="Stok" keyboardType="numeric" value={stock} onChangeText={setStock} />
      <TextInput 
        style={[styles.input, { height: 60 }]} 
        placeholder="Deskripsi Produk" 
        multiline 
        value={description} 
        onChangeText={setDescription} 
      />

      {/* Input Link Foto Gambar */}
      <TextInput 
        style={styles.input} 
        placeholder="Link Foto Produk (https://...)" 
        value={imageUrl} 
        onChangeText={setImageUrl} 
      />

      {/* Preview Gambar dari Link */}
      {imageUrl ? (
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        </View>
      ) : null}

      {/* Tombol Simpan / Batal */}
      {uploading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginVertical: 10 }} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
            <Text style={styles.btnText}>{editingId ? 'Update Produk' : 'Simpan Produk'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={resetForm}>
              <Text style={styles.btnText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Daftar Produk */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
              style={styles.productImage}
            />
            <View style={styles.info}>
              <Text style={styles.prodName}>{item.name}</Text>
              {item.category ? <Text style={styles.prodCategory}>{item.category}</Text> : null}
              <Text style={styles.prodPrice}>
                Rp {item.price ? item.price.toLocaleString('id-ID') : '0'}
              </Text>
              <Text style={styles.prodStock}>Stok: {item.stock ?? 0}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={styles.editText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>🗑️ Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  previewImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#ccc' },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnSave: { backgroundColor: '#2e7d32' },
  btnCancel: { backgroundColor: '#757575' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1 },
  prodName: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  prodCategory: { fontSize: 11, color: '#007AFF', marginBottom: 2 },
  prodPrice: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  prodStock: { color: '#666', fontSize: 12 },
  actionRow: { gap: 10 },
  editText: { color: '#007AFF', fontWeight: '600' },
  deleteText: { color: '#d32f2f', fontWeight: '600' }
});