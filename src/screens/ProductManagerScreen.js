import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../services/productService';
import colors from '../theme/colors';
import { formatRupiahInput, parseRupiahInput } from '../utils/currency';

export default function ProductManagerScreen() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State form
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [variants, setVariants] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);

  const genKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const data = await getProducts();
    setProducts(data || []);
    setLoadingProducts(false);
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCost('');
    setStock('');
    setMinStock('5');
    setDiscountPercent(0);
    setCategory('');
    setDescription('');
    setImageUrl('');
    setVariants([]);
    setModifierGroups([]);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setName(item.name || item.nama || '');
    setPrice(formatRupiahInput(item.price));
    setCost(formatRupiahInput(item.cost));
    setStock(item.stock !== undefined && item.stock !== null ? String(item.stock) : '0');
    setMinStock(item.minStock !== undefined && item.minStock !== null ? String(item.minStock) : '5');
    setDiscountPercent(Number(item.discountPercent) || 0);
    setCategory(item.category || '');
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
    setVariants(
      (item.variants || []).map((v) => ({
        key: v.id || genKey(),
        name: v.name || '',
        extraPrice: formatRupiahInput(v.extraPrice),
      }))
    );
    setModifierGroups(
      (item.modifiers || []).map((m) => ({
        key: m.id || genKey(),
        name: m.name || '',
        options: Array.isArray(m.options) ? m.options.map(String) : [''],
      }))
    );
    setModalVisible(true);
  };

  const validateAndSave = async () => {
    if (!name.trim()) {
      showAlert('Peringatan', 'Nama produk wajib diisi.');
      return;
    }
    const priceValue = parseRupiahInput(price);
    if (price === '' || priceValue < 0) {
      showAlert('Peringatan', 'Harga jual produk wajib diisi dengan benar.');
      return;
    }
    const costValue = parseRupiahInput(cost);
    if (cost !== '' && (isNaN(costValue) || costValue < 0)) {
      showAlert('Peringatan', 'Harga modal produk wajib diisi dengan benar.');
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      showAlert('Peringatan', 'Stok produk wajib diisi dengan benar.');
      return;
    }

    setSaving(true);

    try {
      const finalImageUrl = await uploadProductImage(imageUrl);

      // Bangun data varian & modifier (only non-empty) — extraPrice diparsing ke angka baku
      const variantsData = variants
        .filter((v) => v.name.trim() !== '')
        .map((v) => ({
          id: v.key,
          name: v.name.trim(),
          extraPrice: parseRupiahInput(v.extraPrice),
        }));
      const modifiersData = modifierGroups
        .filter((g) => g.name.trim() !== '' && g.options.some((o) => o.trim() !== ''))
        .map((g) => ({
          id: g.key,
          name: g.name.trim(),
          options: g.options.map((o) => o.trim()).filter(Boolean),
        }));

      if (editingId) {
        await updateProduct(
          editingId,
          name.trim(),
          priceValue,
          stock,
          finalImageUrl,
          category.trim(),
          description.trim(),
          cost !== '' ? costValue : null,
          variantsData,
          modifiersData,
          Number(minStock) || 5,
          Number(discountPercent) || 0
        );
      } else {
        await addProduct(
          name.trim(),
          priceValue,
          stock,
          finalImageUrl,
          category.trim(),
          description.trim(),
          cost !== '' ? costValue : null,
          variantsData,
          modifiersData,
          Number(minStock) || 5,
          Number(discountPercent) || 0
        );
      }

      setModalVisible(false);
      fetchProducts();
      showAlert('Berhasil', editingId ? 'Produk berhasil diperbarui.' : 'Produk berhasil disimpan.');
    } catch (error) {
      console.error('Gagal menyimpan produk:', error);
      showAlert('Gagal', 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Hapus produk ini?')) {
        handleDelete(id);
      }
      return;
    }
    Alert.alert('Hapus Produk', 'Yakin ingin menghapus produk ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    if (editingId === id) {
      setModalVisible(false);
      resetForm();
    }
    fetchProducts();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCost('');
    setStock('');
    setDiscountPercent(0);
    setCategory('');
    setDescription('');
    setImageUrl('');
    setVariants([]);
    setModifierGroups([]);
  };

  // ---- Helpers form dinamis Varian & Modifier ----
  const addVariant = () =>
    setVariants((prev) => [...prev, { key: genKey(), name: '', extraPrice: '' }]);
  const updateVariant = (key, field, value) =>
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)));
  const removeVariant = (key) => setVariants((prev) => prev.filter((v) => v.key !== key));

  const addModifierGroup = () =>
    setModifierGroups((prev) => [...prev, { key: genKey(), name: '', options: [''] }]);
  const updateModifierGroup = (key, field, value) =>
    setModifierGroups((prev) => prev.map((g) => (g.key === key ? { ...g, [field]: value } : g)));
  const addModifierOption = (key) =>
    setModifierGroups((prev) =>
      prev.map((g) => (g.key === key ? { ...g, options: [...g.options, ''] } : g))
    );
  const updateModifierOption = (key, index, value) =>
    setModifierGroups((prev) =>
      prev.map((g) =>
        g.key === key ? { ...g, options: g.options.map((o, i) => (i === index ? value : o)) } : g
      )
    );
  const removeModifierOption = (key, index) =>
    setModifierGroups((prev) =>
      prev.map((g) =>
        g.key === key ? { ...g, options: g.options.filter((_, i) => i !== index) } : g
      )
    );
  const removeModifierGroup = (key) =>
    setModifierGroups((prev) => prev.filter((g) => g.key !== key));

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (p.name || p.nama || '').toLowerCase().includes(q);
  });

  const previewUri = imageUrl.trim().startsWith('http')
    ? imageUrl.trim()
    : null;

  const inputClass =
    'border border-hairline rounded-2xl px-4 py-3.5 bg-bg text-ink text-sm mb-3';
  const labelClass = 'text-xs font-bold text-ink-muted mb-1.5 ml-1';

  const lowStockCount = products.filter(
    (p) => Number(p.stock) <= (Number(p.minStock) || 5)
  ).length;
  const totalStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View className="bg-surface px-5 pt-5 pb-4 rounded-b-[28px] shadow-sm mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-primary items-center justify-center mr-3">
              <MaterialIcons name="inventory-2" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-[13px] font-medium text-ink-muted">Manajemen Produk</Text>
              <Text className="text-[19px] font-extrabold text-ink -tracking-tight">Produk</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-accent px-4 py-2.5 rounded-2xl flex-row items-center"
            onPress={openAddModal}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text className="text-white font-bold text-[13px] ml-1">Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Search produk */}
        <View className="flex-row items-center bg-bg rounded-2xl px-4 py-2.5 mt-4">
          <MaterialIcons name="search" size={18} color={colors['ink-muted']} />
          <TextInput
            className="flex-1 text-sm font-medium text-ink ml-2.5"
            placeholder="Cari produk..."
            placeholderTextColor={colors['ink-muted']}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={18} color={colors['ink-muted']} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Statistik mini */}
      {products.length > 0 && (
        <View className="flex-row gap-2.5 px-4 mb-3">
          <View className="flex-1 flex-row items-center bg-surface rounded-2xl px-3 py-2.5 border border-hairline">
            <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-2">
              <MaterialIcons name="category" size={16} color={colors.accent} />
            </View>
            <View>
              <Text className="text-[15px] font-extrabold text-ink">{products.length}</Text>
              <Text className="text-[10px] font-medium text-ink-muted">Total Produk</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center bg-surface rounded-2xl px-3 py-2.5 border border-hairline">
            <View className="w-8 h-8 rounded-xl bg-success-soft items-center justify-center mr-2">
              <MaterialIcons name="inventory" size={16} color={colors.success} />
            </View>
            <View>
              <Text className="text-[15px] font-extrabold text-ink">{totalStock}</Text>
              <Text className="text-[10px] font-medium text-ink-muted">Total Stok</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center bg-surface rounded-2xl px-3 py-2.5 border border-hairline">
            <View className="w-8 h-8 rounded-xl bg-danger-soft items-center justify-center mr-2">
              <MaterialIcons name="warning" size={16} color={colors.danger} />
            </View>
            <View>
              <Text className="text-[15px] font-extrabold text-ink">{lowStockCount}</Text>
              <Text className="text-[10px] font-medium text-ink-muted">Stok Menipis</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daftar Produk */}
      {loadingProducts ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          className="px-4"
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const outOfStock = Number(item.stock) <= 0;
            const lowStock = !outOfStock && Number(item.stock) <= (Number(item.minStock) || 5);
            return (
              <View className="bg-surface rounded-[18px] mb-2.5 flex-row items-center border border-hairline overflow-hidden">
                <Image
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                  className="w-[72px] h-[72px] bg-surface-alt"
                  resizeMode="cover"
                />
                <View className="flex-1 px-3 py-2.5">
                  <Text className="font-bold text-[14px] text-ink" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {item.category ? (
                      <View className="bg-accent-soft px-1.5 py-0.5 rounded-md mr-1.5">
                        <Text className="text-[10px] font-bold text-accent">{item.category}</Text>
                      </View>
                    ) : null}
                    <View
                      className={`px-1.5 py-0.5 rounded-md ${
                        outOfStock
                          ? 'bg-danger-soft'
                          : lowStock
                          ? 'bg-danger-soft'
                          : 'bg-success-soft'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          outOfStock || lowStock ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {outOfStock ? 'Habis' : `Stok ${item.stock}`}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-ink font-extrabold text-[13px] mt-1">
                    Rp {(Number(item.price) || 0).toLocaleString('id-ID')}
                  </Text>
                  {Number(item.discountPercent || 0) > 0 && (
                    <View className="self-start bg-danger-soft px-1.5 py-0.5 rounded-md mt-1">
                      <Text className="text-[10px] font-bold text-danger">
                        Diskon -{item.discountPercent}%
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-2 pr-3">
                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-primary items-center justify-center"
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-danger-soft items-center justify-center"
                    onPress={() => confirmDelete(item.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="delete-outline" size={17} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-3">
                <MaterialIcons name="search-off" size={26} color={colors['ink-muted']} />
              </View>
              <Text className="text-[13px] font-bold text-ink-muted">
                {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  className="mt-4 bg-primary px-5 py-3 rounded-2xl flex-row items-center"
                  onPress={openAddModal}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text className="text-white font-bold text-[13px] ml-1.5">Tambah Produk Pertama</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Modal Form Produk */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-[28px] pt-5 pb-7 px-5 h-[92%] max-h-[92%]">
            <View className="w-10 h-1.5 rounded-full bg-hairline self-center mb-4" />

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-accent-soft items-center justify-center mr-2.5">
                  <MaterialIcons
                    name={editingId ? 'edit' : 'inventory-2'}
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <Text className="text-[17px] font-extrabold text-ink">
                  {editingId ? 'Edit Produk' : 'Tambah Produk'}
                </Text>
              </View>
              <TouchableOpacity
                className="w-9 h-9 rounded-xl bg-bg items-center justify-center"
                onPress={() => !saving && setModalVisible(false)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={20} color={colors['ink-muted']} />
              </TouchableOpacity>
            </View>

            {/* Preview Gambar */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <View className="items-center mb-4">
              {previewUri ? (
                <View className="rounded-2xl overflow-hidden border border-hairline">
                  <Image source={{ uri: previewUri }} className="w-[110px] h-[110px]" resizeMode="cover" />
                </View>
              ) : (
                <View className="w-[110px] h-[110px] rounded-2xl bg-bg border border-dashed border-hairline items-center justify-center">
                  <MaterialIcons name="image-outline" size={28} color={colors['ink-muted']} />
                  <Text className="text-[10px] font-bold text-ink-muted mt-2">Belum ada foto</Text>
                </View>
              )}
            </View>

            <Text className={labelClass}>Nama Produk</Text>
            <TextInput
              className={inputClass}
              placeholder="Contoh: HDD 1TB"
              placeholderTextColor={colors['ink-muted']}
              value={name}
              onChangeText={setName}
            />

            <Text className={labelClass}>Kategori</Text>
            <TextInput
              className={inputClass}
              placeholder="Contoh: Komponen / Aksesoris"
              placeholderTextColor={colors['ink-muted']}
              value={category}
              onChangeText={setCategory}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className={labelClass}>Harga Jual (Rp)</Text>
                <TextInput
                  className={`${inputClass} font-extrabold`}
                  placeholder="Rp 0"
                  placeholderTextColor={colors['ink-muted']}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(text) => setPrice(formatRupiahInput(text))}
                />
              </View>
              <View className="flex-1">
                <Text className={labelClass}>Stok</Text>
                <TextInput
                  className={inputClass}
                  placeholder="0"
                  placeholderTextColor={colors['ink-muted']}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <Text className={labelClass}>Stok Minimum (peringatan stok menipis)</Text>
            <TextInput
              className={inputClass}
              placeholder="5"
              placeholderTextColor={colors['ink-muted']}
              keyboardType="numeric"
              value={minStock}
              onChangeText={setMinStock}
            />

            {/* Diskon Produk — slider 0%-100% */}
            <View className="mb-1">
              <View className="flex-row items-center justify-between mb-1 ml-1">
                <Text className="text-xs font-bold text-ink-muted">Diskon Produk</Text>
                {discountPercent > 0 ? (
                  <View className="bg-danger-soft px-2 py-0.5 rounded-md">
                    <Text className="text-[11px] font-extrabold text-danger">-{discountPercent}%</Text>
                  </View>
                ) : (
                  <Text className="text-[11px] font-medium text-ink-muted">Tidak ada</Text>
                )}
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={discountPercent}
                onValueChange={(v) => setDiscountPercent(Math.round(v))}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.hairline}
                thumbTintColor={colors.primary}
              />
              <View className="flex-row justify-between px-1">
                <Text className="text-[10px] font-medium text-ink-muted">0%</Text>
                <Text className="text-[10px] font-medium text-ink-muted">100%</Text>
              </View>
              <Text className="text-[10px] font-medium text-ink-muted mb-3 ml-1">
                Diskon dipakai otomatis saat kasir menjual produk ini.
              </Text>
            </View>

            <Text className={labelClass}>Harga Modal (Rp)</Text>
            <TextInput
              className={`${inputClass} font-medium`}
              placeholder="Kosongkan jika sama dengan harga jual"
              placeholderTextColor={colors['ink-muted']}
              keyboardType="numeric"
              value={cost}
              onChangeText={(text) => setCost(formatRupiahInput(text))}
            />

            <Text className={labelClass}>Deskripsi</Text>
            <TextInput
              className={`${inputClass} h-[70px] text-left`}
              placeholder="Deskripsi singkat produk"
              placeholderTextColor={colors['ink-muted']}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <Text className={labelClass}>Link Foto Produk</Text>
            <TextInput
              className={inputClass}
              placeholder="https://..."
              placeholderTextColor={colors['ink-muted']}
              autoCapitalize="none"
              autoCorrect={false}
              value={imageUrl}
              onChangeText={setImageUrl}
            />

            {/* === Varian (opsional) === */}
            <View className="mt-2 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-ink-muted ml-1">
                  Varian — Tambahan Harga
                </Text>
                <TouchableOpacity
                  className="flex-row items-center bg-accent-soft px-2.5 py-1.5 rounded-xl"
                  onPress={addVariant}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add" size={15} color={colors.accent} />
                  <Text className="text-accent font-bold text-[11px] ml-1">Varian</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-[10px] font-medium text-ink-muted mt-1 mb-2 ml-1">
                Contoh: Panas +Rp 0, Dingin +Rp 2.000. Kosongkan jika produk tanpa varian.
              </Text>

              {variants.map((v) => (
                <View key={v.key} className="flex-row items-center gap-2 mb-2">
                  <TextInput
                    className={`${inputClass} flex-1 mb-0`}
                    placeholder="Nama varian (cth. Dingin)"
                    placeholderTextColor={colors['ink-muted']}
                    value={v.name}
                    onChangeText={(text) => updateVariant(v.key, 'name', text)}
                  />
                  <TextInput
                    className={`${inputClass} mb-0 w-[110px] font-medium`}
                    placeholder="+ Rp"
                    placeholderTextColor={colors['ink-muted']}
                    keyboardType="numeric"
                    value={v.extraPrice}
                    onChangeText={(text) =>
                      updateVariant(v.key, 'extraPrice', formatRupiahInput(text))
                    }
                  />
                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-danger-soft items-center justify-center"
                    onPress={() => removeVariant(v.key)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="close" size={17} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* === Modifier / Catatan Tambahan (opsional) === */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-ink-muted ml-1">Modifier</Text>
                <TouchableOpacity
                  className="flex-row items-center bg-accent-soft px-2.5 py-1.5 rounded-xl"
                  onPress={addModifierGroup}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add" size={15} color={colors.accent} />
                  <Text className="text-accent font-bold text-[11px] ml-1">Modifier</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-[10px] font-medium text-ink-muted mt-1 mb-2 ml-1">
                Contoh: Level Pedas → Normal / Pedas / Pedas Banget.
              </Text>

              {modifierGroups.map((g) => (
                <View
                  key={g.key}
                  className="mb-3 p-3 rounded-2xl bg-bg border border-hairline"
                >
                  <View className="flex-row items-center">
                    <TextInput
                      className={`${inputClass} flex-1 mb-0`}
                      placeholder="Nama modifier (cth. Level Pedas)"
                      placeholderTextColor={colors['ink-muted']}
                      value={g.name}
                      onChangeText={(text) => updateModifierGroup(g.key, 'name', text)}
                    />
                    <TouchableOpacity
                      className="w-9 h-9 rounded-xl bg-danger-soft items-center justify-center ml-2"
                      onPress={() => removeModifierGroup(g.key)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="delete-outline" size={17} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {g.options.map((option, optionIndex) => (
                    <View key={`${g.key}_opt_${optionIndex}`} className="flex-row items-center mt-2">
                      <Text className="text-[11px] font-bold text-ink-muted w-9">
                        #{optionIndex + 1}
                      </Text>
                      <TextInput
                        className={`${inputClass} flex-1 mb-0`}
                        placeholder="Nama opsi (cth. Pedas Banget)"
                        placeholderTextColor={colors['ink-muted']}
                        value={option}
                        onChangeText={(text) =>
                          updateModifierOption(g.key, optionIndex, text)
                        }
                      />
                      {g.options.length > 1 && (
                        <TouchableOpacity
                          className="w-8 h-8 rounded-xl bg-danger-soft items-center justify-center ml-2"
                          onPress={() => removeModifierOption(g.key, optionIndex)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <MaterialIcons name="close" size={15} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    className="flex-row items-center justify-center bg-surface border border-hairline rounded-xl py-2 mt-2"
                    onPress={() => addModifierOption(g.key)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="add" size={15} color={colors.accent} />
                    <Text className="text-accent font-bold text-[11px] ml-1">Tambah Opsi</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            </ScrollView>

            <View className="flex-row gap-2.5 mt-1">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl items-center bg-surface border border-hairline"
                onPress={() => !saving && setModalVisible(false)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text className="text-ink font-bold">Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-2xl items-center flex-row justify-center ${
                  saving ? 'bg-hairline' : 'bg-primary'
                }`}
                onPress={validateAndSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <MaterialIcons name="save" size={18} color="#fff" />
                    <Text className="text-white font-bold ml-2">{editingId ? 'Update' : 'Simpan'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}