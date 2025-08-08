import React, { useEffect, useState, useCallback } from 'react';
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
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';


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

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [wishListIds, setWishListIds] = useState<Set<number>>(new Set());

  const [recommendationGenerations, setRecommendationGenerations] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [likedItem, setLikedItem] = useState<Recommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

        const [recsRes, favsRes, seenRes, wlsRes] = await Promise.all([
          axios.post(`${API_URL}/recommendations`, {}, { headers }),
          axios.get(`${API_URL}/favorites?take=1000`, { headers }),
          axios.get(`${API_URL}/seen?take=1000`, { headers }),
          axios.get(`${API_URL}/wishlist?take=1000`, { headers }),
        ]);

        const recArray: Recommendation[] =
          Array.isArray(recsRes.data) ? recsRes.data : recsRes.data.recommendations || [];

        const favIds = new Set<number>(
          (favsRes.data.favorites.items || []).map((i: any) => i.tmdbId)
        );
        const seenIdsSet = new Set<number>(
          (seenRes.data.items || []).map((i: any) => i.tmdbId)
        );
        const wlIds = new Set<number>(
          (wlsRes.data.wishlist.items || []).map((i: any) => i.tmdbId)
        );

        setFavoriteIds(favIds);
        setSeenIds(seenIdsSet);
        setWishListIds(wlIds);

        const enriched = enrichRecommendations(recArray, favIds, seenIdsSet, wlIds);
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
      setSeenIds(prev => new Set(prev).add(item.tmdbId));
      setRecommendations(prev =>
        prev.map(r => (r.id === item.id ? { ...r, seen: true } : r))
      );
      Toast.show({ type: 'success', text1: '✅ Marcado como visto', text2: item.title });
    } catch {
      Toast.show({ type: 'error', text1: 'Error marcando como visto' });
    }
  };

  const markAsFavorite = async (item: Recommendation) => {
    if (favoriteIds.has(item.tmdbId)) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/favorites`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavoriteIds(prev => new Set(prev).add(item.tmdbId));
      setRecommendations(prev =>
        prev.map(r => (r.id === item.id ? { ...r, favorite: true } : r))
      );
      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: item.title });
    } catch {
      Toast.show({ type: 'error', text1: 'Error agregando a favoritos' });
    }
  };

  const markAsWish = async (item: Recommendation) => {
    if (wishListIds.has(item.tmdbId)) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/wishlist`,
        { tmdbId: item.tmdbId , mediaType: item.mediaType},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishListIds(prev => new Set(prev).add(item.tmdbId));
      setRecommendations(prev =>
        prev.map(r => (r.id === item.id ? { ...r, wishlisted: true } : r))
      );
      Toast.show({ type: 'success', text1: '💖 Agregado a Deseados', text2: item.title });
    } catch {
      Toast.show({ type: 'error', text1: 'Error agregando a Deseados' });
    }
  };

  const generateNewRecommendations = async () => {
    if (recommendationGenerations >= 2) return;
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
      const newItems: Recommendation[] =
        Array.isArray(res.data) ? res.data : res.data.recommendations || [];
      const existingIds = new Set(recommendations.map(r => r.tmdbId));
      const uniqueNew = newItems.filter(r => !existingIds.has(r.tmdbId));
      const enriched = enrichRecommendations(uniqueNew, favoriteIds, seenIds, wishListIds);

      setRecommendations(prev => [...enriched, ...prev]);
      setRecommendationGenerations(prev => prev + 1);
      setInitialPrompt('');
      setLikedItem(null);
      Toast.show({ type: 'success', text1: '🎯 Nuevas recomendaciones generadas' });
    } catch {
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
      <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 16, fontWeight: 'bold' }}>🧠 Recomendaciones</Text>

      {/* Feedback y regenerar */}
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
          const isFav = item.favorite;
          const isSeen = item.seen;
          const isWish = item.wishlisted;

          return (
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setSelectedItem(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.posterUrl ? (
                  <Image source={{ uri: item.posterUrl }} style={{ width: 96, height: 144, borderRadius: 8, marginRight: 16 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 96, height: 144, backgroundColor: '#555', borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>Póster no disponible</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>{item.title}</Text>
                  <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>{item.releaseDate.substring(0, 10)}</Text>
                  <Text style={{ color: '#eee', fontSize: 14 }} numberOfLines={3}>{item.overview}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 4 }}>
                    <TouchableOpacity
                      onPress={() => markAsSeen(item)}
                      disabled={isSeen}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: isSeen ? '#4c1d95' : '#7c3aed', marginRight: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>{isSeen ? '✅ Visto' : '⭐ Visto'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => markAsFavorite(item)}
                      disabled={isFav}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: isFav ? '#881337' : '#ec4899', marginRight: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>{isFav ? '❤️ Agregado' : '❤️ Favorito'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <TouchableOpacity
                      onPress={() => markAsWish(item)}
                      disabled={isWish}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: isWish ? '#6b7280' : '#f472b6', marginRight: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>{isWish ? '💖 En Deseados' : '💖 Deseados'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDismissedIds(prev => new Set(prev).add(item.id))}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#444', marginRight: 8 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>🙈 No me interesa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      {selectedItem && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxHeight: '80%' }}>
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#000' }}>{selectedItem.title}</Text>
              <Text style={{ color: '#333', fontSize: 14, marginBottom: 20 }}>{selectedItem.overview}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>⭐ Votos</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fbbf24' }}>{selectedItem.voteAverage}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>🔥 Popularidad</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#db2777' }}>{selectedItem.popularity ?? '-'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>🎬 Tipo</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#059669' }}>{selectedItem.mediaType.toUpperCase()}</Text>
                </View>
              </View>
              {Array.isArray(selectedItem.platforms) && selectedItem.platforms.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#000' }}>Disponible en:</Text>
                  {selectedItem.platforms.map(platform => (
                    <Text key={platform} style={{ fontSize: 14, color: '#444' }}>• {platform}</Text>
                  ))}
                </View>
              )}
              {selectedItem.trailerUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(selectedItem.trailerUrl!)} style={{ backgroundColor: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>▶️ Ver tráiler</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={{ backgroundColor: '#8b5cf6', padding: 12, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
