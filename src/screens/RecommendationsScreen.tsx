
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';

interface Recommendation {
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

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [likedItem, setLikedItem] = useState<Recommendation | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [recommendationGenerations, setRecommendationGenerations] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  

  const enrichRecommendations = (
    items: Recommendation[],
    favTmdbIds: Set<number>,
    seenTmdbIds: Set<number>
  ): Recommendation[] => {
    return items.map((item) => ({
      ...item,
      favorite: favTmdbIds.has(item.tmdbId),
      seen: seenTmdbIds.has(item.tmdbId),
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [recsRes, favsRes, seenRes] = await Promise.all([
          axios.post(`${API_URL}/recommendations`, {}, { headers }),
          axios.get(`${API_URL}/favorites`, { headers }),
          axios.get(`${API_URL}/seen`, { headers }),
        ]);

        const favTmdbIdArray: number[] = (favsRes.data?.items || []).map((item: any) => item.tmdbId);
        const seenTmdbIdArray: number[] = (seenRes.data?.items || []).map((item: any) => item.tmdbId);

        const favTmdbIds = new Set<number>(favTmdbIdArray);
        const seenTmdbIds = new Set<number>(seenTmdbIdArray);

        setFavoriteIds(favTmdbIds);
        setSeenIds(seenTmdbIds);

        const enriched = enrichRecommendations(recsRes.data.recommendations || [], favTmdbIds, seenTmdbIds);

        setRecommendations(enriched);
      } catch (err) {
        console.warn('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAsSeen = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/seen`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSeenIds((prev) => {
        const updated = new Set<number>(prev);
        updated.add(item.tmdbId);
        return updated;
      });

      setRecommendations((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, seen: true } : r))
      );
      Toast.show({ type: 'success', text1: '✅ Marcado como visto', text2: item.title });
    } catch (error) {
      console.warn('Error al marcar como visto:', error);
      Toast.show({ type: 'error', text1: '⚠️ Error al marcar como visto', text2: 'Intenta nuevamente.' });
    }
  };

  const markAsFavorite = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/favorites`,
        { tmdbId: item.tmdbId, title: item.title, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFavoriteIds((prev) => {
        const updated = new Set(prev);
        updated.add(item.tmdbId);

        // 🔄 Enriquecer las recomendaciones con el nuevo estado de favoritos
        setRecommendations((prevRecs) =>
          enrichRecommendations(prevRecs, updated, seenIds)
        );

        return updated;
      });

      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: item.title });
    } catch (error: any) {
      console.warn('Error al marcar como favorito:', error?.response?.data || error.message);
      Toast.show({ type: 'error', text1: '⚠️ No se pudo agregar a favoritos', text2: 'Intenta nuevamente.' });
    }
  };


  const generateNewRecommendations = async () => {
    if (recommendationGenerations >= 2) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const body: any = {};

      if (initialPrompt.trim()) {
        body.feedback = initialPrompt.trim();
      }

      if (likedItem) {
        body.tmdbId = likedItem.tmdbId;
      }

      const res = await axios.post(
        `${API_URL}/recommendations`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newItems: Recommendation[] = res.data.recommendations || [];
      const existingIds = new Set(recommendations.map((r) => r.tmdbId));
      const uniqueNew = newItems.filter((r) => !existingIds.has(r.tmdbId));
      const enriched = enrichRecommendations(uniqueNew, favoriteIds, seenIds);

      setRecommendations((prev) => [...enriched, ...prev]);
      setRecommendationGenerations((prev) => prev + 1);
      setInitialPrompt('');
      setLikedItem(null);

      Toast.show({ type: 'success', text1: '🎯 Nuevas recomendaciones generadas' });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error generando recomendaciones' });
    }
  };


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 pt-10">
      <Text className="text-white text-2xl font-bold mb-4">🧠 Recomendaciones</Text>
      
      {recommendationGenerations < 3 && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="mb-4">
            <View className="bg-zinc-800 p-4 rounded-xl mb-4">
              <Text className="text-white mb-2 text-sm">Cuéntanos qué tipo de películas o series te gustan:</Text>
              <TextInput
                placeholder="Ej: Me gustan comedias románticas y dramas con finales inesperados"
                placeholderTextColor="#ccc"
                className="bg-white p-2 rounded mb-3 text-black"
                multiline
                value={initialPrompt}
                onChangeText={setInitialPrompt}
              />
              <TouchableOpacity
                  onPress={generateNewRecommendations}
                  className="bg-purple-600 p-2 rounded"
                >
                <Text className="text-white text-center">🎯 Obtener recomendaciones</Text>
              </TouchableOpacity>
            </View>
          
        </KeyboardAvoidingView>
      )}

      <FlatList
        data={recommendations.filter(r => !dismissedIds.has(r.id))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="mb-6">
            <TouchableOpacity onPress={() => setSelectedItem(item)} className="flex-row items-center gap-4">
              {item.posterUrl ? (
                <Image source={{ uri: item.posterUrl }} className="w-24 h-36 rounded-lg" resizeMode="cover" />
              ) : (
                <View className="w-24 h-36 bg-zinc-700 rounded-lg justify-center items-center">
                  <Text className="text-white text-xs text-center px-2">Póster no disponible</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold mb-1">{item.title}</Text>
                <Text className="text-zinc-400 text-xs mb-2">{item.releaseDate?.substring(0, 10)}</Text>
                <Text className="text-white text-sm mb-2" numberOfLines={3}>{item.overview}</Text>
                <View className="flex-row gap-2 flex-wrap">
                  <TouchableOpacity
                    onPress={() => markAsSeen(item)}
                    className={`px-3 py-1 rounded-full ${item.seen ? 'bg-purple-900' : 'bg-purple-600'}`}
                    disabled={item.seen}
                  >
                    <Text className="text-white text-sm">{item.seen ? '✅ Visto' : '⭐ Visto'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => markAsFavorite(item)}
                    className={`px-3 py-1 rounded-full ${item.favorite ? 'bg-rose-900' : 'bg-rose-600'}`}
                    disabled={item.favorite}
                  >
                    <Text className="text-white text-sm">{item.favorite ? '❤️ Agregado' : '❤️ Favorito'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDismissedIds(prev => new Set(prev).add(item.id))}
                    className="px-3 py-1 rounded-full bg-zinc-700"
                  >
                    <Text className="text-white text-sm">🙈 No me interesa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLikedItem(item)}
                    className="px-3 py-1 rounded-full bg-emerald-600"
                  >
                    <Text className="text-white text-sm">👍 Me gustó</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      {selectedItem && (
        <View className="absolute inset-0 bg-black bg-opacity-80 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full" style={{ maxHeight: '80%' }}>
            <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
              <Text className="text-xl font-bold mb-2 text-black">{selectedItem.title}</Text>
              <Text className="text-gray-800 mb-4 text-sm">{selectedItem.overview}</Text>
              <View className="flex-row justify-around items-center mb-4">
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">⭐ Votos</Text>
                  <Text className="text-yellow-600 font-bold text-base">{selectedItem.voteAverage}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">🔥 Popularidad</Text>
                  <Text className="text-pink-500 font-bold text-base">{selectedItem.popularity ?? '-'}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">🎬 Tipo</Text>
                  <Text className="text-green-600 font-bold text-base">{selectedItem.mediaType.toUpperCase()}</Text>
                </View>
              </View>

              {Array.isArray(selectedItem.platforms) && selectedItem.platforms.length > 0 && (
                <View className="mb-4">
                  <Text className="text-black font-semibold mb-1">Disponible en:</Text>
                  {selectedItem.platforms.map((platform) => (
                    <Text key={platform} className="text-zinc-700 text-sm">• {platform}</Text>
                  ))}
                </View>
              )}

              {selectedItem.trailerUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                  className="bg-rose-600 py-2 rounded-full mb-4"
                >
                  <Text className="text-white text-center font-semibold">▶️ Ver tráiler</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                className="bg-purple-600 py-2 rounded-full"
              >
                <Text className="text-white text-center font-semibold">Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
