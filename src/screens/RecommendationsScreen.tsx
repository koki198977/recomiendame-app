import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Portal, 
  Dialog,
  TextInput,
  Chip,
  Divider
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';

interface Recommendation {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl?: string;
  overview: string;
  releaseDate: string;
  voteAverage: number;
  mediaType: 'movie' | 'tv';
  reason: string;
  popularity?: number;
  seen?: boolean;
  favorite?: boolean;
  wishlisted?: boolean;
  platforms?: string[];
  trailerUrl?: string;
}

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [likedItem, setLikedItem] = useState<Recommendation | null>(null);
  const [recommendationGenerations, setRecommendationGenerations] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  const enrichRecommendations = (
    items: Recommendation[],
    favs: Set<number>,
    seen: Set<number>,
    wls: Set<number>
  ): Recommendation[] =>
    items.map(item => ({
      ...item,
      favorite: favs.has(item.tmdbId),
      seen: seen.has(item.tmdbId),
      wishlisted: wls.has(item.tmdbId),
    }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [recsRes, favsRes, seenRes, wishRes] = await Promise.all([
          axios.post(`${API_URL}/recommendations`, {}, { headers }),
          axios.get(`${API_URL}/favorites?take=1000`, { headers }),
          axios.get(`${API_URL}/seen?take=1000`, { headers }),
          axios.get(`${API_URL}/wishlist?take=1000`, { headers }),
        ]);

        const recArray: Recommendation[] = Array.isArray(recsRes.data)
          ? recsRes.data
          : recsRes.data.recommendations || [];

        const favItems = favsRes.data?.favorites?.items || [];
        const favTmdbIds = new Set<number>(
          favItems.map((i: any) => i.tmdbId)
        );
        const seenTmdbIds = new Set<number>(
          (seenRes.data?.items || []).map((i: any) => i.tmdbId)
        );
        const wishTmdbIds = new Set<number>(
          (wishRes.data?.items || []).map((i: any) => i.tmdbId)
        );
        setFavoriteIds(favTmdbIds);
        setSeenIds(seenTmdbIds);
        setWishlistIds(wishTmdbIds);

        const enriched = enrichRecommendations(recArray, favTmdbIds, seenTmdbIds, wishTmdbIds);
        setRecommendations(enriched);
      } catch (err) {
        console.warn('Error al cargar datos:', err);
        Toast.show({ type: 'error', text1: 'Error cargando datos' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAsSeen = async (item: Recommendation) => {
    if (seenIds.has(item.tmdbId)) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/seen`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSeenIds(prev => {
        const updated = new Set(prev);
        updated.add(item.tmdbId);
        return updated;
      });
      setRecommendations(prev =>
        prev.map(r => (r.id === item.id ? { ...r, seen: true } : r))
      );
      Toast.show({ type: 'success', text1: '✅ Marcado como visto', text2: item.title });
    } catch (error) {
      console.warn('Error al marcar como visto:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo marcar como visto' });
    }
  };

  const markAsFavorite = async (item: Recommendation) => {
    if (favoriteIds.has(item.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está en favoritos', text2: item.title });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/favorites`,
        { tmdbId: item.tmdbId, title: item.title, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFavoriteIds(prev => {
        const updated = new Set(prev);
        updated.add(item.tmdbId);
        setRecommendations(prevRecs =>
          enrichRecommendations(prevRecs, updated, seenIds, wishlistIds)
        );
        return updated;
      });

      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: item.title });
    } catch (error) {
      console.warn('Error al marcar favorito:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a favoritos' });
    }
  };

  const markAsWish = async (item: Recommendation) => {
    if (wishlistIds.has(item.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está en deseados', text2: item.title });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/wishlist`,
        { tmdbId: item.tmdbId, title: item.title, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWishlistIds(prev => {
        const updated = new Set(prev);
        updated.add(item.tmdbId);
        setRecommendations(prevRecs =>
          enrichRecommendations(prevRecs, favoriteIds, seenIds, updated)
        );
        return updated;
      });

      Toast.show({ type: 'success', text1: '💖 Agregado a deseados', text2: item.title });
    } catch (error) {
      console.warn('Error al marcar deseados:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a deseados' });
    }
  };

  const generateNewRecommendations = async () => {
    if (recommendationGenerations >= 2 || isGenerating) return;

    Keyboard.dismiss();
    setIsGenerating(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const body: any = {};
      if (initialPrompt.trim()) body.feedback = initialPrompt.trim();
      if (likedItem) body.tmdbId = likedItem.tmdbId;

      const res = await axios.post(`${API_URL}/recommendations`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      const newItems: Recommendation[] = Array.isArray(data)
        ? data
        : data.recommendations || [];
      const existingIds = new Set(recommendations.map(r => r.tmdbId));
      const uniqueNew = newItems.filter(r => !existingIds.has(r.tmdbId));
      const enriched = enrichRecommendations(uniqueNew, favoriteIds, seenIds, wishlistIds);

      setRecommendations(prev => [...enriched, ...prev]);
      setRecommendationGenerations(prev => prev + 1);
      setInitialPrompt('');
      setLikedItem(null);

      Toast.show({ type: 'success', text1: '🎯 Nuevas recomendaciones generadas' });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error generando recomendaciones' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 40 }}>
      <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 16, fontWeight: 'bold' }}>
        🧠 Recomendaciones
      </Text>

      {recommendationGenerations < 2 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ marginBottom: 16 }}
        >
          <Card style={{ backgroundColor: '#1f1f1f', marginBottom: 8 }}>
            <Card.Content style={{ padding: 16 }}>
              <Text variant="bodyMedium" style={{ color: '#fff', marginBottom: 8 }}>
                Cuéntanos qué tipo de películas o series te gustan:
              </Text>
              <TextInput
                placeholder="Ej: Me gustan comedias románticas y dramas con finales inesperados"
                placeholderTextColor="#666"
                style={{
                  backgroundColor: '#fff',
                  marginBottom: 12,
                  color: '#000',
                  minHeight: 60,
                }}
                multiline
                value={initialPrompt}
                onChangeText={setInitialPrompt}
                mode="outlined"
                theme={{
                  colors: {
                    onSurface: '#000',
                    onSurfaceVariant: '#666',
                    outline: '#ccc'
                  }
                }}
              />

              <Button
                mode="contained"
                onPress={generateNewRecommendations}
                disabled={isGenerating}
                loading={isGenerating}
                style={{ backgroundColor: isGenerating ? '#555' : '#8b5cf6' }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {isGenerating ? '🔄 Generando...' : '🎯 Obtener recomendaciones'}
              </Button>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      )}

      <FlatList
        data={recommendations.filter(r => !dismissedIds.has(r.id))}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => {
          const isFav = favoriteIds.has(item.tmdbId);
          const isSeen = seenIds.has(item.tmdbId);
          const isWish = wishlistIds.has(item.tmdbId);

          return (
            <Card style={{ 
              marginBottom: 24, 
              backgroundColor: '#1f1f1f',
              borderRadius: 12
            }}>
              <Card.Content style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {item.posterUrl ? (
                    <Image
                      source={{ uri: item.posterUrl }}
                      style={{ width: 96, height: 144, borderRadius: 8, marginRight: 16 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 96,
                        height: 144,
                        backgroundColor: '#555',
                        borderRadius: 8,
                        marginRight: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                        Póster no disponible
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 4, fontWeight: '600' }}>
                      {item.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#aaa', marginBottom: 6 }}>
                      {item.releaseDate?.substring(0, 10)}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: '#eee', marginBottom: 12 }} numberOfLines={3}>
                      {item.overview}
                    </Text>
                    
                    <View style={{ 
                      marginTop: 8,
                    }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        marginBottom: 8,
                        gap: 8
                      }}>
                        <TouchableOpacity
                          onPress={() => markAsSeen(item)}
                          disabled={isSeen}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: isSeen ? '#4c1d95' : '#7c3aed',
                            borderRadius: 8,
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 6 }}>
                            {isSeen ? '✅ Visto' : '⭐ Visto'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => markAsFavorite(item)}
                          disabled={isFav}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: isFav ? '#881337' : '#ec4899',
                            borderRadius: 8,
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 6 }}>
                            {isFav ? '❤️ Agregado' : '❤️ Favorito'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        gap: 8
                      }}>
                        <TouchableOpacity
                          onPress={() => markAsWish(item)}
                          disabled={isWish}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: isWish ? '#6b7280' : '#f472b6',
                            borderRadius: 8,
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 6 }}>
                            {isWish ? '💖 En Deseados' : '💖 Deseados'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDismissedIds(prev => new Set(prev).add(item.id))}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: '#444',
                            borderRadius: 8,
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center', paddingVertical: 6 }}>
                            🙈 No me interesa
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      {/* Dialog de detalle */}
      <Portal>
        <Dialog
          visible={selectedItem !== null}
          onDismiss={() => setSelectedItem(null)}
          style={{ backgroundColor: '#fff' }}
        >
          {selectedItem && (
            <>
              <Dialog.Title>{selectedItem.title}</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ color: '#333', marginBottom: 20 }}>
                  {selectedItem.overview}
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: '#666' }}>⭐ Votos</Text>
                    <Text variant="titleMedium" style={{ color: '#fbbf24', fontWeight: '600' }}>
                      {selectedItem.voteAverage}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: '#666' }}>🔥 Popularidad</Text>
                    <Text variant="titleMedium" style={{ color: '#db2777', fontWeight: '600' }}>
                      {selectedItem.popularity ?? '-'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: '#666' }}>🎬 Tipo</Text>
                    <Text variant="titleMedium" style={{ color: '#059669', fontWeight: '600' }}>
                      {selectedItem.mediaType.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {Array.isArray(selectedItem.platforms) && selectedItem.platforms.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: '600' }}>
                      Disponible en:
                    </Text>
                    {selectedItem.platforms.map(platform => (
                      <Text key={platform} variant="bodyMedium" style={{ color: '#444' }}>
                        • {platform}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedItem.trailerUrl && (
                  <Button
                    mode="contained"
                    onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                    style={{ backgroundColor: '#dc2626', marginBottom: 20 }}
                  >
                    ▶️ Ver tráiler
                  </Button>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setSelectedItem(null)} mode="contained">
                  Cerrar
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </View>
  );
}
