import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';
import { Modal } from 'react-native';


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
  liked?: boolean;
  feedback?: string;
}

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);
  const [feedback, setFeedback] = useState('');
  const [generations, setGenerations] = useState(0);

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

        const favTmdbIds = new Set((favsRes.data?.items || []).map((item: any) => item.tmdbId));
        const seenTmdbIds = new Set((seenRes.data?.items || []).map((item: any) => item.tmdbId));

        const enriched = (recsRes.data.recommendations || []).map((item: Recommendation) => ({
          ...item,
          favorite: favTmdbIds.has(item.tmdbId),
          seen: seenTmdbIds.has(item.tmdbId),
        }));

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
      setRecommendations((prev) =>
        prev.filter((r) => r.tmdbId !== item.tmdbId)
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
      setRecommendations((prev) =>
        prev.filter((r) => r.tmdbId !== item.tmdbId)
      );
      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: item.title });
    } catch (error: any) {
      console.warn('Error al marcar como favorito:', error?.response?.data || error.message);
      Toast.show({ type: 'error', text1: '⚠️ No se pudo agregar a favoritos', text2: 'Intenta nuevamente.' });
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedItem || !feedback || generations >= 2) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_URL}/recommendations/feedback`, {
        tmdbId: selectedItem.tmdbId,
        liked: true,
        feedback,
      }, { headers });

      const recsRes = await axios.post(`${API_URL}/recommendations`, {}, { headers });
      const newRecs: Recommendation[] = recsRes.data.recommendations || [];
      const currentTmdbIds = new Set(recommendations.map(r => r.tmdbId));
      const uniqueNewRecs = newRecs.filter(r => !currentTmdbIds.has(r.tmdbId));

      setRecommendations(prev => [...uniqueNewRecs, ...prev]);
      setGenerations((g) => g + 1);
      Toast.show({ type: 'success', text1: '🎯 Recomendación registrada', text2: '¡Se generaron nuevas sugerencias!' });
      setSelectedItem(null);
      setFeedback('');
    } catch (err) {
      console.warn('Error al enviar feedback o generar nuevas recomendaciones:', err);
      Toast.show({ type: 'error', text1: '❌ Error generando nuevas sugerencias' });
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

      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedItem(item)}
            className="flex-row mb-6 items-center gap-4"
          >
            <Image
              source={{ uri: item.posterUrl }}
              className="w-24 h-36 rounded-lg"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">{item.title}</Text>
              <Text className="text-zinc-400 text-xs mb-2">{item.releaseDate?.substring(0, 10)}</Text>
              <Text className="text-white text-sm mb-2" numberOfLines={3}>{item.overview}</Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => markAsSeen(item)}
                  className="px-3 py-1 rounded-full bg-purple-600"
                >
                  <Text className="text-white text-sm">⭐ Visto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => markAsFavorite(item)}
                  className="px-3 py-1 rounded-full bg-rose-600"
                >
                  <Text className="text-white text-sm">❤️ Favorito</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={!selectedItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View className="flex-1 bg-black bg-opacity-80 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-h-[80%]">
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-xl font-bold text-black mb-2">{selectedItem?.title}</Text>
              <Text className="text-gray-800 mb-4 text-sm">{selectedItem?.overview}</Text>

              <TextInput
                placeholder="¿Qué te gustó de esta recomendación?"
                value={feedback}
                onChangeText={setFeedback}
                className="bg-zinc-100 p-3 rounded-xl mb-4 text-black"
                multiline
              />

              <TouchableOpacity
                onPress={handleFeedbackSubmit}
                disabled={!feedback || generations >= 2}
                className="bg-purple-600 py-2 rounded-full mb-2"
              >
                <Text className="text-white text-center font-semibold">
                  {generations >= 2 ? '🔁 Límite alcanzado' : '💡 Nueva recomendación'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                className="bg-zinc-300 py-2 rounded-full"
              >
                <Text className="text-black text-center font-semibold">Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}