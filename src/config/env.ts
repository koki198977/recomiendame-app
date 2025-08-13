import Constants from 'expo-constants';

const extra = (Constants?.expoConfig?.extra ?? (Constants as any)?.manifest?.extra) || {};

export const ENV = {
  API_URL: String(extra.API_URL || ''),
  TMDB_API_KEY: String(extra.TMDB_API_KEY || ''),
};
