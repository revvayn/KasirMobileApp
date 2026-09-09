// App.js
import "./global.css";
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import AppNavigator from './src/navigation/AppNavigator';
import { auth } from './src/config/firebase';
import { useAuthStore } from './src/store/useAuthStore';
import { ensureUserRole } from './src/services/authService';
import colors from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    SatoshiBlack: require('./assets/fonts/Satoshi-Black.ttf'),
    SatoshiBold: require('./assets/fonts/Satoshi-Bold.ttf'),
    SatoshiMedium: require('./assets/fonts/Satoshi-Medium.ttf'),
    SatoshiRegular: require('./assets/fonts/Satoshi-Regular.ttf'),
    SatoshiLight: require('./assets/fonts/Satoshi-Light.ttf'),
  });

  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const logout = useAuthStore((s) => s.logout);

  // Restore sesi dari Firebase Auth saat app dibuka.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const role = await ensureUserRole(fbUser.uid, fbUser.email);
          setUser({ uid: fbUser.uid, email: fbUser.email });
          setRole(role);
        } catch (error) {
          console.error('Gagal validasi role:', error);
          setUser({ uid: fbUser.uid, email: fbUser.email });
          setRole('kasir');
        }
      } else {
        logout();
      }
    });
    return unsub;
  }, [setUser, setRole, logout]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}