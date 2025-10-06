import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'recomendador-app',
  slug: 'recomendador-app',
  icon: './assets/icon.png',
  ios: { supportsTablet: true },
  extra: {
    API_URL: process.env.API_URL,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    eas: {
      projectId: 'c37a421b-7fd9-434e-a250-e14ec36e1618',
    },
  },
  android: {
    package: 'cl.edicloud.recomiendameapp',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    }
  },
};

export default config;
