import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mediaplayer.app',
  appName: 'MediaPlayer',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
