import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'Recomiéndame',
  slug: 'recomiendame-app',
  version: '1.0.5',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  scheme: 'recomiendame',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.kokialvarez.recomiendame',
    buildNumber: '5',
    associatedDomains: ['applinks:recomiendameapp.cl'],
    infoPlist: {
      LSApplicationQueriesSchemes: ['youtube', 'vnd.youtube'],
    },
  },
  android: {
    package: 'com.kokialvarez.recomiendame',
    versionCode: 5,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    permissions: ['android.permission.INTERNET'],
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'recomiendame' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'recomiendameapp.cl',
            pathPrefix: '/favoritos',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: {
    API_URL: process.env.API_URL,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    eas: {
      projectId: '210898d5-ff3c-443f-8119-8b0cdd9d4f3b',
    },
  },
};

export default config;
