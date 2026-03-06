import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'Recomiéndame',
  slug: 'recomiendame-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'cl.edicloud.recomiendameapp',
    infoPlist: {
      LSApplicationQueriesSchemes: ['youtube', 'vnd.youtube'],
    },
  },
  android: {
    package: 'cl.edicloud.recomiendameapp',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    permissions: ['android.permission.INTERNET'],
  },
  extra: {
    API_URL: process.env.API_URL,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    eas: {
      projectId: 'c37a421b-7fd9-434e-a250-e14ec36e1618',
    },
  },
};

export default config;
