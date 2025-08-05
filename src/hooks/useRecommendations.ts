import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';

export interface Recommendation {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  overview: string;
  releaseDate: string;
  voteAverage: number;
  mediaType: 'movie' | 'tv';
  reason: string;
  popularity?: number;
  seen?: boolean;
  favorite?: boolean;
  platforms?: string[];
  trailerUrl?: string;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const enrich = useCallback(
    (items: Recommendation[]) =>
      items.map(item => ({
        ...item,
        seen: seenIds.has(item.tmdbId),
        favorite: favoriteIds.has(item.tmdbId),
      })),
    [seenIds, favoriteIds]
  );

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [recsRes, favsRes, seenRes] = await Promise.all([
        axios.post(`${API_URL}/recommendations`, {}, { headers }),
        axios.get(`${API_URL}/favorites`, { headers }),
        axios.get(`${API_URL}/seen`, { headers }),
      ]);
      console.log('recsRes', recsRes.data);
      const recArray: Recommendation[] = Array.isArray(recsRes.data)
        ? recsRes.data
        : recsRes.data.recommendations || [];

      const favSet = new Set<number>(
        (favsRes.data.items || []).map((i: any) => i.tmdbId)
      );
      const seenSet = new Set<number>(
        (seenRes.data.items || []).map((i: any) => i.tmdbId)
      );

      setFavoriteIds(favSet);
      setSeenIds(seenSet);
      setRecommendations(enrich(recArray));
    } catch (err) {
      console.warn('Error cargando datos:', err);
      Toast.show({ type: 'error', text1: 'Error cargando datos' });
    } finally {
      setLoading(false);
    }
  }, [enrich]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { recommendations, setRecommendations, loading, seenIds, favoriteIds };
}
