import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Card, 
  Button, 
  Portal, 
  Dialog,
  TextInput,
  Chip
} from 'react-native-paper';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 40 }}>
      <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 16, fontWeight: 'bold' }}>
        👁️‍🗨️ Vistos recientemente
      </Text>

      <Searchbar
        placeholder="Buscar entre tus vistos"
        onChangeText={text => setSearchQuery(text)}
        onSubmitEditing={() => fetchSeenAndRatings(true)}
        value={searchQuery}
        style={{ marginBottom: 16, backgroundColor: '#1f1f1f' }}
        iconColor="#aaa"
        inputStyle={{ color: '#fff' }}
      />

      {seen.length === 0 ? (
        <Text style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
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
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color="#a855f7" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={{ 
              width: '48%', 
              marginBottom: 24, 
              backgroundColor: '#1f1f1f',
              borderRadius: 12
            }}>
              <Card.Cover
                source={item.tmdb?.posterUrl ? { uri: item.tmdb.posterUrl } : undefined}
                style={{ height: 224, borderRadius: 12 }}
                resizeMode="cover"
              />
              {!item.tmdb?.posterUrl && (
                <View style={{ 
                  height: 224, 
                  borderRadius: 12, 
                  backgroundColor: '#333', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', paddingHorizontal: 8 }}>
                    Sin póster
                  </Text>
                </View>
              )}

              <Card.Content style={{ padding: 12 }}>
                <Text 
                  variant="titleSmall" 
                  style={{ 
                    color: '#fff', 
                    fontWeight: '600', 
                    marginBottom: 8, 
                    textAlign: 'center' 
                  }}
                  numberOfLines={2}
                >
                  {item.tmdb?.title || 'Sin título'}
                </Text>

                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Chip
                    mode="outlined"
                    style={{ 
                      backgroundColor: item.tmdb?.mediaType === 'movie' ? '#4f46e5' : '#10b981',
                      borderColor: item.tmdb?.mediaType === 'movie' ? '#4f46e5' : '#10b981'
                    }}
                    textStyle={{ color: '#fff', fontSize: 10 }}
                  >
                    {(item.tmdb?.mediaType || 'N/A').toUpperCase()}
                  </Chip>
                </View>

                <Button
                  mode="contained"
                  onPress={() => handleOpenModal(item)}
                  style={{ 
                    backgroundColor: item.alreadyRated ? '#7c3aed' : '#a855f7',
                    borderRadius: 20,
                    marginBottom: 8
                  }}
                  contentStyle={{ paddingVertical: 4 }}
                  labelStyle={{ fontSize: 12 }}
                  icon={item.alreadyRated ? "pencil" : "star"}
                >
                  {item.alreadyRated ? 'Editar evaluación' : 'Evaluar'}
                </Button>

                <Button
                  mode="contained"
                  onPress={() => setConfirmDeleteItem(item)}
                  style={{ backgroundColor: '#dc2626', borderRadius: 20 }}
                  contentStyle={{ paddingVertical: 4 }}
                  labelStyle={{ fontSize: 12 }}
                  icon="delete"
                >
                  Quitar de vistos
                </Button>
              </Card.Content>
            </Card>
          )}
        />
      )}

      {/* Dialog de puntuación */}
      <Portal>
        <Dialog
          visible={ratingModalItem !== null}
          onDismiss={() => setRatingModalItem(null)}
          style={{ backgroundColor: '#fff' }}
        >
          <Dialog.Title style={{ textAlign: 'center' }}>
            {ratingModalItem?.tmdb?.title || 'Sin título'}
          </Dialog.Title>
          <Dialog.Content>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <StarRating
                rating={ratingValue}
                onChange={setRatingValue}
                starSize={36}
                color="#a855f7"
              />
            </View>

            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Comentario:
            </Text>
            <TextInput
              placeholder="¿Qué te pareció?"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={{ backgroundColor: '#f3f4f6' }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRatingModalItem(null)}>
              Cancelar
            </Button>

            {ratings.find(r => r.tmdbId === ratingModalItem?.tmdbId) && (
              <Button onPress={handleDeleteRating} textColor="#dc2626">
                Eliminar
              </Button>
            )}

            <Button onPress={handleSendRating} mode="contained">
              Enviar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog de confirmación para eliminar */}
      <Portal>
        <Dialog
          visible={confirmDeleteItem !== null}
          onDismiss={() => setConfirmDeleteItem(null)}
        >
          <Dialog.Title>Confirmar eliminación</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              ¿Quitar "{confirmDeleteItem?.tmdb?.title}" de tus vistos?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteItem(null)}>
              Cancelar
            </Button>
            <Button 
              onPress={() => handleRemoveSeen(confirmDeleteItem?.tmdbId!)}
              textColor="#dc2626"
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
