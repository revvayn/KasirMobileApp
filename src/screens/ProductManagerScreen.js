import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
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
import colors from '../theme/colors';

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
    <View className="flex-1 p-4 bg-bg">
      <Text className="text-[19px] font-extrabold text-ink -tracking-tight mb-3">
        {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
      </Text>

      {/* Form Input */}
      <TextInput className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink" placeholder="Nama Produk" placeholderTextColor={colors['ink-muted']} value={name} onChangeText={setName} />
      <TextInput className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink" placeholder="Kategori (misal: Komponen)" placeholderTextColor={colors['ink-muted']} value={category} onChangeText={setCategory} />
      <TextInput className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink" placeholder="Harga (Rp)" placeholderTextColor={colors['ink-muted']} keyboardType="numeric" value={price} onChangeText={setPrice} />
      <TextInput className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink" placeholder="Stok" placeholderTextColor={colors['ink-muted']} keyboardType="numeric" value={stock} onChangeText={setStock} />
      <TextInput 
        className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink h-[60px]" 
        placeholder="Deskripsi Produk" 
        placeholderTextColor={colors['ink-muted']}
        multiline 
        value={description} 
        onChangeText={setDescription} 
      />

      {/* Input Link Foto Gambar */}
      <TextInput 
        className="border border-hairline rounded-2xl p-2.5 mb-2.5 bg-surface text-ink" 
        placeholder="Link Foto Produk (https://...)" 
        placeholderTextColor={colors['ink-muted']}
        value={imageUrl} 
        onChangeText={setImageUrl} 
      />

      {/* Preview Gambar dari Link */}
      {imageUrl ? (
        <View className="items-center mb-3">
          <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-2xl bg-surface-alt" />
        </View>
      ) : null}

      {/* Tombol Simpan / Batal */}
      {uploading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <View className="flex-row gap-2.5 mb-4">
          <TouchableOpacity className="flex-1 p-4 rounded-2xl items-center bg-primary" onPress={handleSave} activeOpacity={0.9}>
            <Text className="text-white font-bold">{editingId ? 'Update Produk' : 'Simpan Produk'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity className="flex-1 p-4 rounded-2xl items-center bg-surface border border-hairline" onPress={resetForm} activeOpacity={0.9}>
              <Text className="text-ink font-bold">Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Daftar Produk */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="flex-row bg-surface p-3 rounded-card mb-2.5 items-center shadow-md">
            <Image
              source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
              className="w-[60px] h-[60px] rounded-2xl mr-3 bg-surface-alt"
            />
            <View className="flex-1">
              <Text className="font-bold text-[15px] text-ink" numberOfLines={1}>{item.name}</Text>
              {item.category ? <Text className="text-[11px] text-accent font-bold mt-0.5 mb-0.5">{item.category}</Text> : null}
              <Text className="text-ink font-extrabold text-[13px] mt-0.5">
                Rp {item.price ? item.price.toLocaleString('id-ID') : '0'}
              </Text>
              <Text className="text-ink-muted text-xs mt-0.5">Stok: {item.stock ?? 0}</Text>
            </View>
            <View className="gap-2.5 items-end">
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text className="text-accent font-bold text-xs">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text className="text-danger font-bold text-xs">Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
