// src/screens/SeenScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';
import StarRating from 'react-native-star-rating-widget';
import { getPoster } from '../utils/tmdb';

interface SeenItem {
  id: string;
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  createdAt: string;
  posterUrl?: string;
  releaseDate?: string;
  alreadyRated?: boolean;
}

interface RatingItem {
  tmdbId: number;
  rating: number;
  comment?: string;
}

export default function SeenScreen() {
  const [seen, setSeen] = useState<SeenItem[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalItem, setRatingModalItem] = useState<SeenItem | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  const fetchSeenAndRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [seenRes, ratingsRes] = await Promise.all([
        axios.get(`${API_URL}/seen`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/ratings?take=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ratingMap = ratingsRes.data.ratings.items.reduce((acc: any, r: RatingItem) => {
        acc[r.tmdbId] = r;
        return acc;
      }, {});

      setRatings(ratingsRes.data.ratings.items);

      const enriched = await Promise.all(
        seenRes.data.items.map(async (item: SeenItem) => {
          try {
            const posterUrl = await getPoster(item.tmdbId, item.mediaType);
            return { ...item, posterUrl, alreadyRated: !!ratingMap[item.tmdbId] };
          } catch {
            return { ...item, alreadyRated: !!ratingMap[item.tmdbId] };
          }
        })
      );

      setSeen(enriched);
    } catch (err) {
      console.warn('Error al cargar items vistos o ratings:', err);
      Toast.show({
        type: 'error',
        text1: '⚠️ Error al cargar datos',
        text2: 'Verifica tu conexión o vuelve a intentar',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeenAndRatings();
  }, []);

  const handleOpenModal = (item: SeenItem) => {
    const previous = ratings.find((r) => r.tmdbId === item.tmdbId);
    setRatingModalItem(item);
    setRatingValue(previous?.rating ?? 0);
    setComment(previous?.comment ?? '');
  };

  const handleSendRating = async () => {
    if (!ratingModalItem) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/ratings`,
        {
          tmdbId: ratingModalItem.tmdbId,
          title: ratingModalItem.title,
          mediaType: ratingModalItem.mediaType,
          rating: ratingValue,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Toast.show({
        type: 'success',
        text1: '✅ Puntuado',
        text2: `Gracias por calificar "${ratingModalItem.title}"`,
      });

      // ✅ Actualizamos la lista de vistos
      setSeen((prev) =>
        prev.map((item) =>
          item.tmdbId === ratingModalItem.tmdbId
            ? { ...item, alreadyRated: true }
            : item
        )
      );

      // ✅ Actualizamos ratings
      setRatings((prev) => [
        ...prev.filter((r) => r.tmdbId !== ratingModalItem.tmdbId),
        {
          tmdbId: ratingModalItem.tmdbId,
          rating: ratingValue,
          comment,
        },
      ]);

      setRatingModalItem(null);
    } catch (err) {
      console.warn('Error al puntuar:', err);
      Toast.show({
        type: 'error',
        text1: '❌ Error al puntuar',
        text2: 'Intenta nuevamente',
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
      <Text className="text-white text-2xl font-bold mb-4">👁️‍🗨️ Vistos recientemente</Text>

      {seen.length === 0 ? (
        <Text className="text-zinc-400 text-center mt-10">Aún no has marcado ítems como vistos.</Text>
      ) : (
        <FlatList
          data={seen}
          keyExtractor={(item) => `${item.tmdbId}-${item.createdAt}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View className="mb-6 w-[48%]">
              {item.posterUrl ? (
                <Image
                  source={{ uri: item.posterUrl }}
                  className="w-full h-56 rounded-xl mb-2"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-56 bg-zinc-700 rounded-xl mb-2 justify-center items-center">
                  <Text className="text-white text-xs px-2 text-center">Sin póster</Text>
                </View>
              )}

              <Text className="text-white text-sm font-semibold mb-1 text-center">
                {item.title}
              </Text>

              <View className="flex-row justify-center gap-2 mb-1">
                <Text
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.mediaType === 'movie' ? 'bg-indigo-600' : 'bg-green-600'
                  } text-white`}
                >
                  {item.mediaType.toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full mx-auto ${
                  item.alreadyRated ? 'bg-purple-900' : 'bg-purple-600'
                }`}
                onPress={() => handleOpenModal(item)}
                disabled={item.alreadyRated}
              >
                <View className="flex-row items-center gap-1">
                  <Text className="text-white text-sm">
                    {item.alreadyRated ? '✅ Evaluado' : '⭐ Evaluar'}
                  </Text>
                  {item.alreadyRated && (
                    <Text className="text-yellow-400 text-sm font-semibold">
                      ⭐ {ratings.find((r) => r.tmdbId === item.tmdbId)?.rating}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal */}
      {ratingModalItem && (
        <View className="absolute inset-0 bg-black bg-opacity-80 justify-center items-center px-4">
          <ScrollView
            className="bg-white rounded-2xl w-full"
            contentContainerStyle={{
              padding: 24,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            style={{ maxHeight: '85%' }}
          >
            <Text className="text-black text-2xl font-bold mb-4 text-center">
              {ratingModalItem.title}
            </Text>

            <StarRating
              rating={ratingValue}
              onChange={setRatingValue}
              starSize={36}
              color="#a855f7"
            />

            <Text className="text-black mt-4 mb-2 w-full">Comentario:</Text>
            <TextInput
              placeholder="¿Qué te pareció?"
              value={comment}
              onChangeText={setComment}
              multiline
              className="bg-zinc-100 rounded-lg p-3 text-black w-full h-28"
            />

            <View className="flex-row justify-end w-full mt-6 gap-3">
              <TouchableOpacity
                onPress={() => setRatingModalItem(null)}
                className="px-4 py-2 bg-zinc-300 rounded-full"
              >
                <Text className="text-black font-semibold">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendRating}
                className="px-4 py-2 bg-purple-600 rounded-full"
              >
                <Text className="text-white font-semibold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
