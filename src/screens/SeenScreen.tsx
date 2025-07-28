import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
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
}

export default function SeenScreen() {
  const [seen, setSeen] = useState<SeenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalItem, setRatingModalItem] = useState<SeenItem | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchSeen = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/seen`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const enriched = await Promise.all(
          res.data.items.map(async (item: SeenItem) => {
            try {
              const posterUrl = await getPoster(item.tmdbId, item.mediaType);
              return { ...item, posterUrl };
            } catch (e) {
              console.warn(`❌ No se pudo obtener póster para ${item.title}`);
              return { ...item };
            }
          })
        );

        setSeen(enriched);
      } catch (err: any) {
        console.warn('Error al cargar items vistos:', err?.response?.data || err.message);
        Toast.show({
          type: 'error',
          text1: '⚠️ Error al cargar vistos',
          text2: 'Verifica tu conexión o vuelve a intentar',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSeen();
  }, []);

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
          renderItem={({ item }) => (
            <View className="flex-row mb-4 bg-zinc-900 rounded-xl overflow-hidden">
              {item.posterUrl ? (
                <Image
                  source={{ uri: item.posterUrl }}
                  className="w-24 h-36"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-24 h-36 bg-zinc-700 justify-center items-center">
                  <Text className="text-white text-xs px-2 text-center">Sin póster</Text>
                </View>
              )}

              <View className="flex-1 p-3 justify-between">
                <View>
                  <Text className="text-white text-lg font-bold">{item.title}</Text>
                  <Text className="text-zinc-400 text-sm">{item.releaseDate?.substring(0, 10)}</Text>
                </View>
                <View className="flex-row mt-2 gap-3">
                  <Text className={`text-xs px-2 py-1 rounded-full ${item.mediaType === 'movie' ? 'bg-indigo-600' : 'bg-green-600'} text-white`}>
                    {item.mediaType.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    className="bg-purple-600 px-3 py-1 rounded-full"
                    onPress={() => {
                      setRatingModalItem(item);
                      setRatingValue(0);
                      setComment('');
                    }}
                  >
                    <Text className="text-white text-sm">⭐ Evaluar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {ratingModalItem && (
        <View className="absolute inset-0 bg-black bg-opacity-80 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-h-[80%] p-5">
            <Text className="text-black text-xl font-bold mb-3">{ratingModalItem.title}</Text>

            <StarRating
              rating={ratingValue}
              onChange={setRatingValue}
              starSize={32}
              color="#a855f7"
            />

            <Text className="text-black mt-4 mb-1">Comentario:</Text>
            <TextInput
              placeholder="¿Qué te pareció?"
              value={comment}
              onChangeText={setComment}
              multiline
              className="bg-zinc-100 rounded-lg p-3 text-black h-24"
            />

            <View className="flex-row justify-end mt-4 gap-3">
              <TouchableOpacity
                onPress={() => setRatingModalItem(null)}
                className="px-4 py-2 bg-zinc-300 rounded-full"
              >
                <Text className="text-black font-semibold">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
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
                    setRatingModalItem(null);
                  } catch (err: any) {
                    console.warn('Error al puntuar:', err?.response?.data || err.message);
                    Toast.show({
                      type: 'error',
                      text1: '❌ Error al puntuar',
                      text2: 'Intenta nuevamente',
                    });
                  }
                }}
                className="px-4 py-2 bg-purple-600 rounded-full"
              >
                <Text className="text-white font-semibold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}