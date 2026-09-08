import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Button, 
  Alert, 
  Platform 
} from 'react-native';
import { getProducts } from '../services/productService';

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
          subtotal: price 
        }
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

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Katalog Produk</Text>

      {/* Grid / List Produk */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => String(getDocId(item) || index)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const itemId = getDocId(item);
          const inCartItem = cart.find((c) => getDocId(c) === itemId);
          const cartQty = inCartItem ? inCartItem.qty : 0;

          return (
            <TouchableOpacity 
              style={styles.productCard} 
              onPress={() => addToCart(item)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                style={styles.cardImage}
              />
              <Text style={styles.productName} numberOfLines={1}>{item.name || item.nama}</Text>
              <Text style={styles.productPrice}>Rp {Number(item.price || 0).toLocaleString('id-ID')}</Text>
              <Text style={styles.productStock}>Stok: {item.stock}</Text>

              {cartQty > 0 && (
                <View style={styles.qtyBadgeContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.cartQtyText}>{cartQty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Ringkasan Keranjang */}
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Keranjang ({cart.length} Jenis)</Text>
        <Text style={styles.cartTotal}>Total: Rp {calculateTotal().toLocaleString('id-ID')}</Text>
        
        <Button 
          title="Lanjut Pembayaran" 
          color="#2e7d32" 
          onPress={handleCheckout} 
          disabled={cart.length === 0} 
        />
      </View>

      {/* Navigasi Tambahan */}
      <View style={styles.navRow}>
        <Button title="📊 Dashboard" onPress={() => navigation.navigate('Dashboard')} color="#1e88e5" />
        <Button title="📦 Produk" onPress={() => navigation.navigate('ProductManager')} color="#007AFF" />
        <Button title="📜 Riwayat" onPress={() => navigation.navigate('History')} color="#555" />
        <Button title="⚙️ QRIS" onPress={() => navigation.navigate('QRISSetting')} color="#e65100" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f4f6f8' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  productCard: { flex: 0.48, backgroundColor: '#fff', borderRadius: 10, padding: 10, elevation: 2, alignItems: 'center' },
  cardImage: { width: '100%', height: 100, borderRadius: 8, marginBottom: 8, backgroundColor: '#eee' },
  productName: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  productPrice: { color: '#2e7d32', fontWeight: 'bold', marginTop: 2 },
  productStock: { fontSize: 11, color: '#777', marginTop: 2 },
  qtyBadgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  cartQtyText: { fontWeight: 'bold', marginHorizontal: 6, color: '#333' },
  cartContainer: { backgroundColor: '#fff', padding: 14, borderRadius: 10, elevation: 3, marginTop: 8 },
  cartTitle: { fontWeight: 'bold', fontSize: 14 },
  cartTotal: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginVertical: 6 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 4 }
});