import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ayoo.delivery',
  appName: 'Ayoo Delivery',
  webDir: 'dist',
  server: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:4000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#6D28D9',
      showSpinner: true
    }
  }
};

export default config;
