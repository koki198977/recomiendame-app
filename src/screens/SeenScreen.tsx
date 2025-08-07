import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';
import StarRating from 'react-native-star-rating-widget';
import { useFocusEffect } from '@react-navigation/native';

interface SeenItem {
  tmdbId: number;
  userId: string;
  watchedAt: string;
  createdAt: string;
  tmdb?: {
    id: number;
    title: string;
    posterUrl?: string;
    releaseDate?: string;
    mediaType?: 'movie' | 'tv';
    overview?: string;
    genreIds?: number[];
    platforms?: string[];
  };
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
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalItem, setRatingModalItem] = useState<SeenItem | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmDeleteItem, setConfirmDeleteItem] = useState<SeenItem | null>(null);

  const fetchSeenAndRatings = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(0);
      setHasNextPage(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const take = 10;
      const skip = reset ? 0 : page * take;

      const [seenRes, ratingsRes] = await Promise.all([
        axios.get(
          `${API_URL}/seen?take=${take}&skip=${skip}&search=${searchQuery}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${API_URL}/ratings?take=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ratingMap = ratingsRes.data.ratings.items.reduce((acc: any, r: RatingItem) => {
        acc[r.tmdbId] = r;
        return acc;
      }, {});

      setRatings(ratingsRes.data.ratings.items);

      const enriched = seenRes.data.items.map((item: SeenItem) => ({
        ...item,
        alreadyRated: !!ratingMap[item.tmdbId],
      }));

      if (reset) {
        setSeen(enriched);
      } else {
        setSeen(prev => {
          const combined = [...prev, ...enriched];
          const dedup = new Map<number, SeenItem>();
          for (const it of combined) {
            dedup.set(it.tmdbId, it);
          }
          return Array.from(dedup.values());
        });
      }

      setHasNextPage(seenRes.data.hasNextPage);
      if (!reset) setPage(prev => prev + 1);
    } catch (err) {
      console.warn('Error al cargar items vistos o ratings:', err);
      Toast.show({
        type: 'error',
        text1: '⚠️ Error al cargar datos',
        text2: 'Verifica tu conexión o vuelve a intentar',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeenAndRatings(true);
    }, [])
  );

  const handleOpenModal = (item: SeenItem) => {
    const previous = ratings.find(r => r.tmdbId === item.tmdbId);
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
          title: ratingModalItem.tmdb?.title || '',
          mediaType: ratingModalItem.tmdb?.mediaType || 'movie',
          rating: ratingValue,
          comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: 'success',
        text1: '✅ Puntuado',
        text2: `Gracias por calificar "${ratingModalItem.tmdb?.title}"`,
      });

      setSeen(prev =>
        prev.map(item =>
          item.tmdbId === ratingModalItem.tmdbId
            ? { ...item, alreadyRated: true }
            : item
        )
      );

      setRatings(prev => [
        ...prev.filter(r => r.tmdbId !== ratingModalItem.tmdbId),
        { tmdbId: ratingModalItem.tmdbId, rating: ratingValue, comment },
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

  const handleRemoveSeen = async (tmdbId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_URL}/seen/${tmdbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSeen(prev => prev.filter(item => item.tmdbId !== tmdbId));
      setConfirmDeleteItem(null);

      Toast.show({
        type: 'success',
        text1: '🗑️ Eliminado',
        text2: 'Contenido eliminado de vistos.',
      });
    } catch (err) {
      console.warn('Error al eliminar de vistos:', err);
      Toast.show({
        type: 'error',
        text1: '❌ Error al eliminar',
        text2: 'Intenta nuevamente',
      });
    }
  };

  const handleDeleteRating = async () => {
    if (!ratingModalItem) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_URL}/ratings/${ratingModalItem.tmdbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: 'success',
        text1: '🗑️ Evaluación eliminada',
        text2: `"${ratingModalItem.tmdb?.title}" fue eliminada de tus evaluaciones.`,
      });

      setRatings(prev => prev.filter(r => r.tmdbId !== ratingModalItem.tmdbId));
      setSeen(prev =>
        prev.map(item =>
          item.tmdbId === ratingModalItem.tmdbId
            ? { ...item, alreadyRated: false }
            : item
        )
      );
      setRatingModalItem(null);
    } catch (err) {
      console.warn('Error al eliminar evaluación:', err);
      Toast.show({
        type: 'error',
        text1: '❌ Error al eliminar',
        text2: 'Intenta nuevamente',
      });
    }
  };

  if (loading && !seen.length) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 pt-10">
      <Text className="text-white text-2xl font-bold mb-4">
        👁️‍🗨️ Vistos recientemente
      </Text>

      <TextInput
        value={searchQuery}
        onChangeText={text => setSearchQuery(text)}
        onSubmitEditing={() => fetchSeenAndRatings(true)}
        placeholder="Buscar entre tus vistos"
        placeholderTextColor="#aaa"
        className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-4"
      />

      {seen.length === 0 ? (
        <Text className="text-zinc-400 text-center mt-10">
          Aún no has marcado ítems como vistos.
        </Text>
      ) : (
        <FlatList
          data={seen}
          keyExtractor={(item, idx) => `${item.tmdbId}-${item.userId}-${idx}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSeenAndRatings(true);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !loadingMore) fetchSeenAndRatings();
          }}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator color="#a855f7" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="mb-6 w-[48%]">
              {item.tmdb?.posterUrl ? (
                <Image
                  source={{ uri: item.tmdb.posterUrl }}  
                  className="w-full h-56 rounded-xl mb-2"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-56 bg-zinc-700 rounded-xl mb-2 justify-center items-center">
                  <Text className="text-white text-xs px-2 text-center">
                    Sin póster
                  </Text>
                </View>
              )}

              <Text className="text-white text-sm font-semibold mb-1 text-center">
                {item.tmdb?.title || 'Sin título'}
              </Text>

              <View className="flex-row justify-center gap-2 mb-1">
                <Text
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.tmdb?.mediaType === 'movie'
                      ? 'bg-indigo-600'
                      : 'bg-green-600'
                  } text-white`}
                >
                  {(item.tmdb?.mediaType || 'N/A').toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                className={`px-3 py-1 rounded-full mx-auto ${
                  item.alreadyRated ? 'bg-purple-900' : 'bg-purple-600'
                }`}
                onPress={() => handleOpenModal(item)}
              >
                <Text className="text-white text-sm">
                  {item.alreadyRated ? '✏️ Editar evaluación' : '⭐ Evaluar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDeleteItem(item)}
                className="mt-2 px-3 py-1 rounded-full mx-auto bg-red-600"
              >
                <Text className="text-white text-sm">
                  🗑️ Quitar de vistos
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal de puntuación */}
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
              {ratingModalItem.tmdb?.title || 'Sin título'}
            </Text>

            <StarRating
              rating={ratingValue}
              onChange={setRatingValue}
              starSize={36}
              color="#a855f7"
            />

            <Text className="text-black mt-4 mb-2 w-full">
              Comentario:
            </Text>
            <TextInput
              placeholder="¿Qué te pareció?"
              value={comment}
              onChangeText={setComment}
              multiline
              className="bg-zinc-100 rounded-lg p-3 text-black w-full h-28"
            />

            <View className="flex-row justify-end w-full mt-6 gap-3 flex-wrap">
              <TouchableOpacity
                onPress={() => setRatingModalItem(null)}
                className="px-4 py-2 bg-zinc-300 rounded-full"
              >
                <Text className="text-black font-semibold">Cancelar</Text>
              </TouchableOpacity>

              {ratings.find(r => r.tmdbId === ratingModalItem.tmdbId) && (
                <TouchableOpacity
                  onPress={handleDeleteRating}
                  className="px-4 py-2 bg-red-600 rounded-full"
                >
                  <Text className="text-white font-semibold">
                    Eliminar
                  </Text>
                </TouchableOpacity>
              )}

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

      {/* Modal de confirmación para eliminar */}
      {confirmDeleteItem && (
        <Modal transparent animationType="fade" visible>
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-lg font-bold text-black mb-4 text-center">
                ¿Quitar "{confirmDeleteItem.tmdb?.title}" de tus vistos?
              </Text>
              <View className="flex-row justify-end gap-4">
                <TouchableOpacity
                  onPress={() => setConfirmDeleteItem(null)}
                  className="bg-zinc-300 px-4 py-2 rounded-full"
                >
                  <Text className="text-black font-semibold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemoveSeen(confirmDeleteItem.tmdbId)}
                  className="bg-red-600 px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-semibold">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
