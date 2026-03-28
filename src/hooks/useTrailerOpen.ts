import { useRef, useEffect } from 'react';
import { AppState, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../config/env';
import { extractVideoId } from '../utils/extractVideoId';

/**
 * Opens a YouTube trailer and reports watched time when the user returns to the app.
 * Stores tmdbId in a ref to avoid stale closure issues.
 */
export function useTrailerOpen() {
  const sessionRef = useRef<{ tmdbId: number; openedAt: number } | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        sessionRef.current !== null
      ) {
        const { tmdbId, openedAt } = sessionRef.current;
        const watchedSecs = Math.floor((Date.now() - openedAt) / 1000);
        sessionRef.current = null;

        if (watchedSecs <= 0) return;

        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) return;
          await axios.post(
            `${ENV.API_URL}/activity/trailer-view`,
            { tmdbId, watchedSecs },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          console.log('[useTrailerOpen] Tracked trailer view:', { tmdbId, watchedSecs });
        } catch (err) {
          console.error('[useTrailerOpen] Error sending trailer view:', err);
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const openTrailer = (trailerUrl: string, tmdbId: number) => {
    const videoId = extractVideoId(trailerUrl);
    const url = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : trailerUrl;
    sessionRef.current = { tmdbId, openedAt: Date.now() };
    Linking.openURL(url);
  };

  return { openTrailer };
}
