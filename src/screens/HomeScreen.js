import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProducts } from '../services/productService';
import colors from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
      setCart([]); // Reset keranjang saat kembali ke halaman utama
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

  const addToCart = (product) => {
    const productId = getDocId(product);
    const stockLimit = Number(product.stock || 0);

    if (stockLimit <= 0) {
      showAlert('Stok Habis', 'Produk ini tidak tersedia.');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => getDocId(item) === productId);

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].qty;
        if (currentQty >= stockLimit) {
          showAlert('Batas Stok', 'Jumlah melebihi stok yang tersedia.');
          return prevCart;
        }

        const updatedCart = [...prevCart];
        const newQty = currentQty + 1;
        const price = Number(product.price || 0);

        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          qty: newQty,
          subtotal: newQty * price,
        };
        return updatedCart;
      }

      const price = Number(product.price || 0);
      return [
        ...prevCart,
        {
          ...product,
          firestoreDocId: productId,
          qty: 1,
          subtotal: price,
        },
      ];
    });
  };

  const removeFromCart = (product) => {
    const productId = getDocId(product);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => getDocId(item) === productId);

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        const currentQty = updatedCart[existingIndex].qty;
        const price = Number(product.price || 0);

        if (currentQty > 1) {
          const newQty = currentQty - 1;
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            qty: newQty,
            subtotal: newQty * price,
          };
          return updatedCart;
        } else {
          // Jika qty sisa 1, hapus item dari keranjang
          return updatedCart.filter((item) => getDocId(item) !== productId);
        }
      }
      return prevCart;
    });
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  // Arahkan ke Payment (Disesuaikan dengan AppNavigator 'Payment')
  const handleCheckout = () => {
    if (cart.length === 0) return;

    navigation.navigate('Payment', {
      cartItems: cart,
      totalAmount: calculateTotal(),
    });
  };

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = (p.name || p.nama || '').toLowerCase();
    return name.includes(q);
  });

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: 'bar-chart' },
    { key: 'ProductManager', label: 'Produk', icon: 'inventory-2' },
    { key: 'History', label: 'Riwayat', icon: 'history' },
    { key: 'QRISSetting', label: 'QRIS', icon: 'qr-code' },
  ];

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
            <View className="bg-accent w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-white font-extrabold text-sm">{totalItemsInCart}</Text>
            </View>
          )}
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

      {/* Grid Produk */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => String(getDocId(item) || index)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const itemId = getDocId(item);
          const inCartItem = cart.find((c) => getDocId(c) === itemId);
          const cartQty = inCartItem ? inCartItem.qty : 0;
          const outOfStock = Number(item.stock || 0) <= 0;

          return (
            <TouchableOpacity
              className={`basis-[48%] bg-surface rounded-[20px] overflow-hidden border-[1.5px] ${
                cartQty > 0 ? 'border-accent shadow-md' : 'border-hairline'
              }`}
              onPress={() => addToCart(item)}
              activeOpacity={0.85}
              disabled={outOfStock}
            >
              <View className="relative">
                <Image
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                  className="w-full h-[110px]"
                  resizeMode="cover"
                />
                {outOfStock && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white font-extrabold text-[11px] tracking-wide">Stok Habis</Text>
                    </View>
                  </View>
                )}
                {!outOfStock && (
                  <View className="absolute top-2 right-2 bg-success-soft px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-success">Stok {item.stock}</Text>
                  </View>
                )}
              </View>

              <View className="p-3">
                <Text className="text-[13px] font-bold text-ink mb-1" numberOfLines={1}>
                  {item.name || item.nama}
                </Text>
                <Text className="text-[15px] font-extrabold text-accent">
                  Rp {Number(item.price || 0).toLocaleString('id-ID')}
                </Text>

                {cartQty > 0 && (
                  <View className="flex-row items-center justify-between mt-2.5 bg-bg rounded-xl px-1.5 py-1">
                    <TouchableOpacity
                      className="w-7 h-7 rounded-lg bg-danger items-center justify-center"
                      onPress={() => removeFromCart(item)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text className="font-extrabold text-ink text-sm">{cartQty}</Text>
                    <TouchableOpacity
                      className="w-7 h-7 rounded-lg bg-primary items-center justify-center"
                      onPress={() => addToCart(item)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-[13px] mr-1">Bayar</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
