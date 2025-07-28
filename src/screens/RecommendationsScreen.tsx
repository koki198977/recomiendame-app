import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
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
}


export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: Recommendation[] = res.data.recommendations || [];

        // Inicializa flags para UI
        const enriched = data.map((item) => ({
          ...item,
          seen: false,
          favorite: false,
        }));

        setRecommendations(enriched);
      } catch (err) {
        console.warn('Error al cargar recomendaciones:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const markAsSeen = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/seen`,
        {
          tmdbId: item.tmdbId,
          title: item.title,
          mediaType: item.mediaType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, seen: true } : r
        )
      );

      Toast.show({
        type: 'success',
        text1: '✅ Marcado como visto',
        text2: item.title,
      });
    } catch (error) {
      console.warn('Error al marcar como visto:', error);
      Toast.show({
        type: 'error',
        text1: '⚠️ Error al marcar como visto',
        text2: 'Intenta nuevamente.',
      });
    }
  };

    const markAsFavorite = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/favorites`,
        {
          tmdbId: item.tmdbId,
          title: item.title,
          mediaType: item.mediaType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, favorite: true } : r
        )
      );
      Toast.show({
        type: 'success',
        text1:  '❤️ Agregado a favoritos',
        text2: item.title,
      });
    } catch (error: any) {
      console.warn('Error al marcar como favorito:', error?.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: '⚠️ Error No se pudo marcar como favorito',
        text2: 'Intenta nuevamente.',
      });
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
            {item.posterUrl ? (
              <Image
                source={{ uri: item.posterUrl }}
                className="w-24 h-36 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-24 h-36 bg-zinc-700 rounded-lg justify-center items-center">
                <Text className="text-white text-xs text-center px-2">Póster no disponible</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">{item.title}</Text>
              <Text className="text-zinc-400 text-xs mb-2">
                {item.releaseDate?.substring(0, 10)}
              </Text>
              <Text className="text-white text-sm mb-2" numberOfLines={3}>
                {item.overview}
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => markAsSeen(item)}
                  className={`px-3 py-1 rounded-full ${item.seen ? 'bg-purple-900' : 'bg-purple-600'}`}
                  disabled={item.seen}
                >
                  <Text className="text-white text-sm">
                    {item.seen ? '✅ Visto' : '⭐ Visto'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => markAsFavorite(item)}
                  className={`px-3 py-1 rounded-full ${item.favorite ? 'bg-rose-900' : 'bg-rose-600'}`}
                  disabled={item.favorite}
                >
                  <Text className="text-white text-sm">
                    {item.favorite ? '❤️ Agregado' : '❤️ Favorito'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      {selectedItem && (
        <View className="absolute inset-0 bg-black bg-opacity-80 justify-center items-center px-6">
          <View
            className="bg-white rounded-2xl w-full"
            style={{ maxHeight: '80%' }}
          >
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                flexGrow: 1,
                justifyContent: 'space-between',
              }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-xl font-bold mb-2 text-black">{selectedItem.title}</Text>

              <Text className="text-gray-800 mb-4 text-sm">{selectedItem.overview}</Text>

              <View className="flex-row justify-around items-center mb-4">
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">⭐ Votos</Text>
                  <Text className="text-yellow-600 font-bold text-base">
                    {selectedItem.voteAverage}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">🔥 Popularidad</Text>
                  <Text className="text-pink-500 font-bold text-base">
                    {(selectedItem.popularity ?? '-') as any}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-gray-600 text-xs">🎬 Tipo</Text>
                  <Text className="text-green-600 font-bold text-base">
                    {selectedItem.mediaType.toUpperCase()}
                  </Text>
                </View>
              </View>

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
