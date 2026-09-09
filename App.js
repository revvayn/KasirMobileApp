// App.js
import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import colors from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    SatoshiBlack: require('./assets/fonts/Satoshi-Black.ttf'),
    SatoshiBold: require('./assets/fonts/Satoshi-Bold.ttf'),
    SatoshiMedium: require('./assets/fonts/Satoshi-Medium.ttf'),
    SatoshiRegular: require('./assets/fonts/Satoshi-Regular.ttf'),
    SatoshiLight: require('./assets/fonts/Satoshi-Light.ttf'),
  });

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