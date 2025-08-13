import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
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
import { ENV } from '../config/env';
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
          `${ENV.API_URL}/seen?take=${take}&skip=${skip}&search=${searchQuery}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${ENV.API_URL}/ratings?take=1000`, {
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
        `${ENV.API_URL}/ratings`,
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
      await axios.delete(`${ENV.API_URL}/seen/${tmdbId}`, {
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
      await axios.delete(`${ENV.API_URL}/ratings/${ratingModalItem.tmdbId}`, {
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
                             <View style={{ position: 'relative' }}>
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
                 
                 {/* Banda del tipo de medio en la esquina superior derecha */}
                 <View style={{
                   position: 'absolute',
                   top: 8,
                   right: 8,
                   backgroundColor: item.tmdb?.mediaType === 'movie' ? '#4f46e5' : '#10b981',
                   paddingHorizontal: 6,
                   paddingVertical: 2,
                   borderRadius: 4,
                   shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.3,
                   shadowRadius: 3,
                   elevation: 3,
                 }}>
                   <Text style={{
                     color: '#fff',
                     fontSize: 10,
                     fontWeight: 'bold',
                     textAlign: 'center',
                   }}>
                     {(item.tmdb?.mediaType || 'N/A').toUpperCase()}
                   </Text>
                 </View>
               </View>

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

                

                <View style={{ 
                  gap: 8
                }}>
                  <TouchableOpacity
                    onPress={() => handleOpenModal(item)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: item.alreadyRated ? '#7c3aed' : '#a855f7',
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 8 }}>
                      {item.alreadyRated ? '✏️ Editar evaluación' : '⭐ Evaluar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setConfirmDeleteItem(item)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: '#dc2626',
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 8 }}>
                      🗑️ Quitar de vistos
                    </Text>
                  </TouchableOpacity>
                </View>
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
              placeholderTextColor="#666"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={{ backgroundColor: '#f3f4f6' }}
              theme={{
                colors: {
                  onSurface: '#000',
                  onSurfaceVariant: '#666',
                  outline: '#ccc'
                }
              }}
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
