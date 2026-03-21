import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';

import { LanguageProvider } from '@/i18n';
import { setupNotificationHandler } from '@/hooks/useNotificationPermission';
import { useStoreReview } from '@/hooks/useStoreReview';

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

function AppNavigator() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);
  useStoreReview();

  useEffect(() => { bootstrap(); }, []);

  async function bootstrap() {
    try {
      await Font.loadAsync({
        'Amiri-Regular':     require('../../assets/fonts/Amiri-Regular.ttf'),
        'Amiri-Bold':        require('../../assets/fonts/Amiri-Bold.ttf'),
        'Outfit-Regular':    require('../../assets/fonts/Outfit-Regular.ttf'),
        'Outfit-Medium':     require('../../assets/fonts/Outfit-Medium.ttf'),
        'Outfit-SemiBold':   require('../../assets/fonts/Outfit-SemiBold.ttf'),
        'Outfit-Bold':       require('../../assets/fonts/Outfit-Bold.ttf'),
        'Outfit-ExtraBold':  require('../../assets/fonts/Outfit-ExtraBold.ttf'),
      });
    } catch {
      // Font yüklenemezse sistem fontuna düş, crash yapma
    }

    const onboarded = await AsyncStorage.getItem('@salah_onboarded');
    setReady(true);
    await SplashScreen.hideAsync();
    router.replace(onboarded ? '/(tabs)' : '/onboarding');
  }

  // Bildirime tıklandığında ana ekrana yönlendir
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)');
    });
    return () => sub.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A2A1E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}