import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProducts } from '../services/productService';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { signOut } from '../services/authService';
import ProductOptionModal from '../components/ProductOptionModal';
import CartItemsSheet from '../components/CartItemsSheet';
import { getItemOptionsLabel } from '../utils/cartLabel';
import colors from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartSheetProductId, setCartSheetProductId] = useState(null);
  const [cartSheetProductName, setCartSheetProductName] = useState('');

  const role = useAuthStore((s) => s.role);

  const cart = useCartStore((s) => s.cart);
  const addToCart = useCartStore((s) => s.addToCart);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showAlert('Error', 'Gagal mengambil data produk.');
    }
  };

  // Helper Alert Lintas Platform
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getDocId = (item) => item.firestoreDocId || item.id || item.docId;

  const hasOptions = (product) =>
    (product?.variants && product.variants.length > 0) ||
    (product?.modifiers && product.modifiers.length > 0);

  const showStockLimitAlert = () =>
    showAlert('Batas Stok', 'Jumlah melebihi stok yang tersedia.');

  // Klik produk:
  // - Punya varian/opsi → buka modal pilihan (mode batch: bisa tambah
  //   beberapa kombinasi berbeda sekaligus tanpa keluar modal).
  // - Tanpa opsi (sembako) → langsung masuk keranjang.
  const handleProductPress = (product) => {
    const stockLimit = Number(product.stock || 0);
    if (stockLimit <= 0) {
      showAlert('Stok Habis', 'Produk ini tidak tersedia.');
      return;
    }

    if (hasOptions(product)) {
      setSelectedProduct(product);
      return;
    }

    const result = addToCart(product, {});
    if (!result.ok && result.reason === 'STOCK_LIMIT') showStockLimitAlert();
  };

  const handleConfirmOptions = (options) => {
    if (!selectedProduct) return { ok: false };
    const result = addToCart(selectedProduct, options);
    if (!result.ok && result.reason === 'STOCK_LIMIT') showStockLimitAlert();
    return result;
  };

  // Tombol + pada kartu: tambah kombinasi varian yang sama seperti item di keranjang
  const handlePlus = (cartItem) => {
    const result = addToCart(cartItem, {
      variant: cartItem.variant,
      modifiers: cartItem.modifiers,
      customNote: cartItem.customNote,
    });
    if (!result.ok && result.reason === 'STOCK_LIMIT') showStockLimitAlert();
  };

  // Buka sheet daftar kombinasi produk ini di keranjang
  const openCartSheet = (product) => {
    setCartSheetProductId(getDocId(product));
    setCartSheetProductName(product.name || product.nama || 'Produk');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      useAuthStore.getState().logout();
    } catch (error) {
      showAlert('Gagal', 'Tidak dapat keluar. Coba lagi.');
    }
  };

  const confirmClearCart = () => {
    const action = () => clearCart();
    if (Platform.OS === 'web') {
      if (window.confirm('Kosongkan seluruh isi keranjang?')) action();
      return;
    }
    Alert.alert('Kosongkan Keranjang', 'Yakin ingin mengosongkan seluruh isi keranjang?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kosongkan', style: 'destructive', onPress: action },
    ]);
  };

  const cartSheetItems =
    cartSheetProductId != null
      ? cart.filter((c) => getDocId(c) === cartSheetProductId)
      : [];

  // Jumlah item produk ini yang sudah ada di keranjang (untuk cek stok di modal batch)
  const selectedProductCartQty =
    selectedProduct != null
      ? cart
          .filter((c) => getDocId(c) === getDocId(selectedProduct))
          .reduce((sum, c) => sum + (Number(c.qty) || 0), 0)
      : 0;

  const calculateTotal = () =>
    cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  // Arahkan ke Payment (Disesuaikan dengan AppNavigator 'Payment')
  const handleCheckout = () => {
    if (cart.length === 0) return;

    navigation.navigate('Payment', {
      cartItems: cart,
      totalAmount: calculateTotal(),
    });
  };

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const name = (p.name || p.nama || '').toLowerCase();
      return name.includes(q);
    });
  }, [products, searchQuery]);

  // Kelompokkan produk berdasarkan kategori
  const groupedSections = useMemo(() => {
    const map = {};
    filteredProducts.forEach((p) => {
      const cat = (p.category || '').trim() || 'Lainnya';
      (map[cat] = map[cat] || []).push(p);
    });
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'id'))
      .map((cat) => ({ key: cat, title: cat, data: map[cat] }));
  }, [filteredProducts]);

  // Kartu produk (2 kolom). SectionList bawaan tidak mendukung `numColumns`
  // baik di native maupun react-native-web, jadi baris 2 kolom dirakit manual.
  const renderProductCard = (item) => {
    const itemId = getDocId(item);
    const inCartItems = cart.filter((c) => getDocId(c) === itemId);
    const cartQty = inCartItems.reduce((sum, c) => sum + c.qty, 0);
    const firstCartItem = inCartItems[0];
    const outOfStock = Number(item.stock || 0) <= 0;
    const minStock = Number(item.minStock ?? 5);
    const lowStock = !outOfStock && Number(item.stock) <= minStock;

    return (
      <TouchableOpacity
        className={`basis-[48%] bg-surface rounded-[20px] overflow-hidden border-[1.5px] ${
          cartQty > 0 ? 'border-accent shadow-md' : 'border-hairline'
        }`}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.85}
        disabled={outOfStock}
      >
        <View className="relative">
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
            className="w-full h-[110px]"
            resizeMode="cover"
          />
          {Number(item.discountPercent || 0) > 0 && (
            <View className="absolute top-2 left-2 bg-danger px-2 py-0.5 rounded-full">
              <Text className="text-white font-extrabold text-[11px]">
                -{item.discountPercent}%
              </Text>
            </View>
          )}
          {outOfStock && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-extrabold text-[11px] tracking-wide">Stok Habis</Text>
              </View>
            </View>
          )}
{!outOfStock && (
                  <View
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full ${
                      lowStock ? 'bg-danger-soft' : 'bg-success-soft'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${lowStock ? 'text-danger' : 'text-success'}`}>
                      {lowStock ? `Menipis (${item.stock})` : `Stok ${item.stock}`}
                    </Text>
                  </View>
                )}
              </View>

        <View className="p-3">
          <Text className="text-[13px] font-bold text-ink mb-1" numberOfLines={1}>
            {item.name || item.nama}
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-[15px] font-extrabold text-accent">
              Rp {(Number(item.price || 0) * (1 - (Number(item.discountPercent) || 0) / 100)).toLocaleString('id-ID')}
            </Text>
            {Number(item.discountPercent || 0) > 0 && (
              <Text className="text-[10px] font-medium text-ink-muted ml-1.5 line-through">
                Rp {Number(item.price || 0).toLocaleString('id-ID')}
              </Text>
            )}
          </View>

          {cartQty > 0 &&
            (inCartItems.length === 1 && firstCartItem ? (
              <>
                <TouchableOpacity
                  onPress={() => hasOptions(item) && setSelectedProduct(item)}
                  disabled={!hasOptions(item)}
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-medium text-ink-muted mt-1" numberOfLines={1}>
                    {getItemOptionsLabel(firstCartItem)}
                    {Number(firstCartItem.discountPercent || 0) > 0
                      ? ` · diskon ${firstCartItem.discountPercent}%`
                      : ''}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center justify-between mt-2 bg-bg rounded-xl px-1.5 py-1">
                  <TouchableOpacity
                    className="w-7 h-7 rounded-lg bg-danger items-center justify-center"
                    onPress={() => decreaseQty(firstCartItem.cartId)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialIcons name="remove" size={16} color="#fff" />
                  </TouchableOpacity>
                  <Text className="font-extrabold text-ink text-sm">{cartQty}</Text>
                  <TouchableOpacity
                    className="w-7 h-7 rounded-lg bg-primary items-center justify-center"
                    onPress={() => handlePlus(firstCartItem)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialIcons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="mt-2 flex-row items-center justify-between bg-bg rounded-xl px-2.5 py-1.5">
                <TouchableOpacity
                  className="flex-1"
                  onPress={() => hasOptions(item) && setSelectedProduct(item)}
                  disabled={!hasOptions(item)}
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-semibold text-ink" numberOfLines={1}>
                    {cartQty} item · {getItemOptionsLabel(firstCartItem)}
                    {inCartItems.length > 1 ? ` +${inCartItems.length - 1} varian` : ''}
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center ml-2">
                  <Text className="font-extrabold text-accent text-[13px] mr-2">{cartQty}×</Text>
                  <TouchableOpacity
                    className="w-7 h-7 rounded-lg bg-accent items-center justify-center"
                    onPress={() => openCartSheet(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialIcons name="tune" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      </TouchableOpacity>
    );
  };

  const isAdmin = role === 'admin';

  // Menu (chips) digate oleh role:
  // - Admin: semua menu.
  // - Kasir: HANYA katalog produk + rekap miliknya (Closing). Dashboard/Riwayat/Produk/QRIS/Akun
  //   disembunyikan.
  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: 'bar-chart', adminOnly: true },
    { key: 'ProductManager', label: 'Produk', icon: 'inventory-2', adminOnly: true },
    { key: 'History', label: 'Riwayat', icon: 'history', adminOnly: true },
    { key: 'QRISSetting', label: 'QRIS', icon: 'qr-code', adminOnly: true },
    { key: 'Closing', label: 'Rekap', icon: 'fact-check', adminOnly: false },
    { key: 'UserManager', label: 'Akun', icon: 'people', adminOnly: true },
  ]
    .filter((nav) => !nav.adminOnly || isAdmin)
    .map(({ adminOnly, ...rest }) => rest);

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View className="bg-surface px-5 pt-5 pb-4 rounded-b-[28px] shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-[13px] font-medium text-ink-muted">Selamat Datang</Text>
            <Text className="text-2xl font-extrabold text-ink -tracking-tight">Katalog Produk</Text>
          </View>
          {totalItemsInCart > 0 && (
            <View className="bg-accent w-10 h-10 rounded-full items-center justify-center mr-2">
              <Text className="text-white font-extrabold text-sm">{totalItemsInCart}</Text>
            </View>
          )}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-bg items-center justify-center"
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <MaterialIcons name="logout" size={19} color={colors['ink-muted']} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-bg rounded-2xl px-4 py-3">
          <MaterialIcons name="search" size={20} color={colors['ink-muted']} />
          <TextInput
            className="flex-1 text-sm font-medium text-ink ml-3"
            placeholder="Cari produk..."
            placeholderTextColor={colors['ink-muted']}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={colors['ink-muted']} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigasi */}
      <View className="px-5 mt-4 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {navItems.map((nav) => (
            <TouchableOpacity
              key={nav.key}
              className="flex-row items-center bg-surface rounded-2xl px-4 py-2.5 border border-hairline"
              onPress={() => navigation.navigate(nav.key)}
              activeOpacity={0.75}
            >
              <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-2.5">
                <MaterialIcons name={nav.icon} size={18} color={colors.accent} />
              </View>
              <Text className="text-[12px] font-bold text-ink">{nav.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid Produk — dikelompokkan per kategori (baris 2 kolom manual) */}
      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => String(getDocId(item))}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View className="px-5 pb-2.5 pt-3 bg-bg">
            <Text className="text-[15px] font-extrabold text-ink -tracking-tight">{section.title}</Text>
            <Text className="text-[10px] font-medium text-ink-muted">{section.data.length} produk</Text>
          </View>
        )}
        renderItem={({ index, section }) => {
          if (index % 2 !== 0) return null;
          const firstItem = section.data[index];
          const secondItem = section.data[index + 1];
          return (
            <View className="flex-row justify-between px-5 mb-3">
              {renderProductCard(firstItem)}
              {secondItem ? renderProductCard(secondItem) : <View className="basis-[48%]" />}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-3">
              <MaterialIcons name="inventory-2" size={28} color={colors['ink-muted']} />
            </View>
            <Text className="text-[13px] font-bold text-ink-muted">
              {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </Text>
          </View>
        }
      />

      {/* Floating Checkout */}
      {cart.length > 0 && (
        <View className="absolute bottom-6 left-4 right-4">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 px-5 flex-row justify-between items-center shadow-xl"
            onPress={handleCheckout}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center">
              <View className="bg-white/15 w-9 h-9 rounded-xl items-center justify-center mr-3">
                <MaterialIcons name="shopping-cart" size={18} color="#fff" />
              </View>
              <View>
                <Text className="text-white/70 text-[11px] font-medium">{cart.length} item · {totalItemsInCart} qty</Text>
                <Text className="text-white font-extrabold text-base">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center"
                onPress={confirmClearCart}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialIcons name="delete-sweep" size={17} color="#fff" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-[13px] mr-1">Bayar</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Pilihan Varian & Modifier (batch) */}
      <ProductOptionModal
        visible={!!selectedProduct}
        product={selectedProduct}
        existingCartQty={selectedProductCartQty}
        onClose={() => setSelectedProduct(null)}
        onConfirm={handleConfirmOptions}
      />

      {/* Sheet kombinasi item per produk */}
      <CartItemsSheet
        visible={cartSheetProductId != null}
        productName={cartSheetProductName}
        items={cartSheetItems}
        onClose={() => setCartSheetProductId(null)}
        onIncrease={(cartId) => {
          const res = increaseQty(cartId);
          if (!res.ok && res.reason === 'STOCK_LIMIT') showStockLimitAlert();
        }}
        onDecrease={decreaseQty}
        onRemove={removeFromCart}
      />
    </View>
  );
}
