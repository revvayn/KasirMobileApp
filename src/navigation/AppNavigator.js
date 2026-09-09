import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProductManagerScreen from '../screens/ProductManagerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PaymentScreen from '../screens/PaymentScreen';
import QRISSettingScreen from '../screens/QRISSettingScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';

import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.surface,
        headerTitleStyle: { fontFamily: 'SatoshiBold', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Kasir Utama' }} 
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard Penjualan' }} 
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: 'Riwayat Transaksi' }} 
      />
      <Stack.Screen 
        name="ProductManager" 
        component={ProductManagerScreen} 
        options={{ title: 'Kelola Produk' }} 
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{ title: 'Pembayaran' }} 
      />
      <Stack.Screen 
        name="QRISSetting" 
        component={QRISSettingScreen} 
        options={{ title: 'Pengaturan QRIS' }} 
      />
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen} 
        options={{ 
          title: 'Detail Transaksi',
          headerBackVisible: false // Mencegah kasir kembali ke layar pembayaran setelah transaksi sukses
        }} 
      />
    </Stack.Navigator>
  );
}