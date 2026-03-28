import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../config/env';

interface TrailerViewTrackerOptions {
  tmdbId: number;
}

/**
 * Hook that tracks trailer view events and reports them to the backend.
 * Handles PAUSED (2) and ENDED (0) player states only.
 */
export function useTrailerViewTracker({ tmdbId }: TrailerViewTrackerOptions) {
  const lastProcessedStateRef = useRef<number | null>(null);

  const handlePlayerEvent = async (state: number, currentTime: number): Promise<void> => {
    // Only process ENDED (0) and PAUSED (2)
    if (state !== 0 && state !== 2) return;

    // Avoid duplicate consecutive events for the same state
    if (lastProcessedStateRef.current === state) return;
    lastProcessedStateRef.current = state;

    // Get auth token
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    // Calculate watched seconds
    const watchedSecs = Math.round(currentTime);
    if (watchedSecs <= 0) return;

    try {
      await axios.post(
        `${ENV.API_URL}/activity/trailer-view`,
        { tmdbId, watchedSecs },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('[useTrailerViewTracker] Error sending trailer view:', error);
    }
  };

  return { handlePlayerEvent };
}
