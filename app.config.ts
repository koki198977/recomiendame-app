import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'recomiendame-app',
  slug: 'recomiendame-app',
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
  },
};

export default config;
