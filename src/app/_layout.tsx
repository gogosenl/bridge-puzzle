import { Asset } from 'expo-asset';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AudioProvider } from '@/state/audio';
import { ProgressProvider } from '@/state/progress';
import { SettingsProvider } from '@/state/settings';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 180, fade: true });

const startupAssets = [
  require('../../assets/game/valley.png'),
  require('../../assets/ui/logo.png'),
  require('../../assets/ui/gorsen-games.png'),
  require('../../assets/ui/star.png'),
  require('../../assets/ui/hint-coin-v1.png'),
  require('../../assets/ui/layer-token-v1.png'),
];

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let active = true;
    Asset.loadAsync(startupAssets)
      .catch((error: unknown) => console.warn('Startup assets could not be preloaded.', error))
      .finally(() => {
        if (active) setAssetsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRootLayout = useCallback(() => {
    if (assetsReady) void SplashScreen.hideAsync();
  }, [assetsReady]);

  if (!assetsReady) return null;

  return (
    <View onLayout={handleRootLayout} style={styles.root}>
      <SettingsProvider>
        <AudioProvider>
          <ProgressProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: styles.root }} />
          </ProgressProvider>
        </AudioProvider>
      </SettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07100e' },
});
