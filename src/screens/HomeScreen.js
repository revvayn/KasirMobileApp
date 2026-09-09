import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProducts } from '../services/productService';
import colors from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

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

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: 'bar-chart' },
    { key: 'ProductManager', label: 'Produk', icon: 'inventory-2' },
    { key: 'History', label: 'Riwayat', icon: 'history' },
    { key: 'QRISSetting', label: 'QRIS', icon: 'qr-code' },
  ];

  return (
    <View className="flex-1 bg-bg px-4 pt-4">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-2xl font-extrabold text-ink -tracking-tight">Katalog Produk</Text>
          <Text className="text-[13px] font-medium text-ink-muted mt-0.5">
            {products.length} produk tersedia
          </Text>
        </View>
        {totalItemsInCart > 0 && (
          <View className="bg-primary px-3.5 py-1.5 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-accent mr-2" />
            <Text className="text-white font-bold text-[13px]">{totalItemsInCart} item</Text>
          </View>
        )}
      </View>

      {/* Grid Produk */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => String(getDocId(item) || index)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const itemId = getDocId(item);
          const inCartItem = cart.find((c) => getDocId(c) === itemId);
          const cartQty = inCartItem ? inCartItem.qty : 0;
          const outOfStock = Number(item.stock || 0) <= 0;

          return (
            <TouchableOpacity
              className={`basis-[48%] bg-surface rounded-card p-3 shadow-md border-[1.5px] ${
                cartQty > 0 ? 'border-accent' : 'border-transparent'
              }`}
              onPress={() => addToCart(item)}
              activeOpacity={0.85}
              disabled={outOfStock}
            >
              <View className="rounded-2xl overflow-hidden mb-2 bg-surface-alt">
                <Image
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                  className="w-full h-[108px]"
                  resizeMode="cover"
                />
                {outOfStock && (
                  <View className="absolute inset-0 bg-black/55 items-center justify-center">
                    <Text className="text-white font-extrabold text-xs tracking-wide">Habis</Text>
                  </View>
                )}
              </View>

              <Text className="text-sm font-bold text-ink mb-1.5" numberOfLines={1}>
                {item.name || item.nama}
              </Text>

              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-extrabold text-ink shrink">
                  Rp {Number(item.price || 0).toLocaleString('id-ID')}
                </Text>
                <View className="bg-surface-alt rounded-full px-2 py-0.5 ml-1.5">
                  <Text className="text-[10px] font-bold text-accent">Stok {item.stock}</Text>
                </View>
              </View>

              {cartQty > 0 && (
                <View className="flex-row items-center justify-center mt-2 bg-bg rounded-full py-1">
                  <TouchableOpacity
                    className="w-[26px] h-[26px] rounded-full bg-primary items-center justify-center"
                    onPress={() => removeFromCart(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="text-base font-bold text-white -mt-px">–</Text>
                  </TouchableOpacity>
                  <Text className="font-extrabold mx-4 text-ink text-sm">{cartQty}</Text>
                  <TouchableOpacity
                    className="w-[26px] h-[26px] rounded-full bg-primary items-center justify-center"
                    onPress={() => addToCart(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text className="text-base font-bold text-white -mt-px">+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <View className="w-14 h-14 rounded-full border-2 border-dashed border-hairline items-center justify-center mb-3" />
            <Text className="text-[13px] font-medium text-ink-muted">Belum ada produk</Text>
          </View>
        }
      />

      {/* Ringkasan Keranjang mengambang */}
      <View className="bg-surface rounded-card p-4 mt-2 mb-2 shadow-xl">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-medium text-ink-muted">Keranjang · {cart.length} jenis</Text>
          <Text className="text-xl font-extrabold text-ink">Rp {calculateTotal().toLocaleString('id-ID')}</Text>
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-3.5 items-center ${cart.length === 0 ? 'bg-hairline' : 'bg-primary'}`}
          onPress={handleCheckout}
          disabled={cart.length === 0}
          activeOpacity={0.9}
        >
          <Text className="text-white font-bold text-[15px] tracking-wide">Lanjut Pembayaran</Text>
        </TouchableOpacity>
      </View>

      {/* Navigasi Tambahan */}
      <View className="flex-row justify-between mb-4 gap-2">
        {navItems.map((nav) => (
          <TouchableOpacity
            key={nav.key}
            className="flex-1 items-center bg-surface rounded-2xl py-3 border border-hairline"
            onPress={() => navigation.navigate(nav.key)}
            activeOpacity={0.75}
          >
            <View className="w-8 h-8 rounded-full bg-accent-soft items-center justify-center mb-1.5">
              <MaterialIcons name={nav.icon} size={20} color={colors.accent} />
            </View>
            <Text className="text-[11px] font-bold text-ink">{nav.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
