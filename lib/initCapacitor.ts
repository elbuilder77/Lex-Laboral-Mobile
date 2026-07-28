import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export const initCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Status Bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0F172A' });

      // Keyboard
      if (Capacitor.getPlatform() === 'ios') {
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
      }

      // App back button
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });

      // Hide Splash Screen
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);

    } catch (e) {
      console.warn('Capacitor initialization error:', e);
    }
  }
};
