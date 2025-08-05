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
  Keyboard,
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
  const [recommendationGenerations, setRecommendationGenerations] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());

  const enrichRecommendations = (
    items: Recommendation[],
    favTmdbIds: Set<number>,
    seenTmdbIds: Set<number>
  ): Recommendation[] =>
    items.map(item => ({
      ...item,
      favorite: favTmdbIds.has(item.tmdbId),
      seen: seenTmdbIds.has(item.tmdbId),
    }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [recsRes, favsRes, seenRes] = await Promise.all([
          axios.post(`${API_URL}/recommendations`, {}, { headers }),
          axios.get(`${API_URL}/favorites`,        { headers }),
          axios.get(`${API_URL}/seen`,             { headers }),
        ]);

        const recArray: Recommendation[] = Array.isArray(recsRes.data)
          ? recsRes.data
          : recsRes.data.recommendations || [];

        // 2) Extraer favoritos y vistos
        const favTmdbIds = new Set<number>(
          (favsRes.data?.items || []).map((i: any) => i.tmdbId)
        );
        const seenTmdbIds = new Set<number>(
          (seenRes.data?.items || []).map((i: any) => i.tmdbId)
        );

        setFavoriteIds(favTmdbIds);
        setSeenIds(seenTmdbIds);

        // 3) Enriquecer y guardar
        const enriched = enrichRecommendations(recArray, favTmdbIds, seenTmdbIds);
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
    } catch (error) {
      console.warn('Error al marcar como visto:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo marcar como visto' });
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

    // 1) Actualizar el set de favoritos
    setFavoriteIds(prev => {
      const updated = new Set(prev);
      updated.add(item.tmdbId);
      return updated;
    });

    // 2) Enriquecer de nuevo la lista de recomendaciones
    setRecommendations(prevRecs =>
      enrichRecommendations(prevRecs, new Set(favoriteIds).add(item.tmdbId), seenIds)
    );

    Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: item.title });
  } catch (error) {
    console.warn('Error al marcar favorito:', error);
    Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a favoritos' });
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

      const res = await axios.post(
        `${API_URL}/recommendations`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;
      const newItems: Recommendation[] = Array.isArray(data)
        ? data
        : data.recommendations || [];
      const existingIds = new Set(recommendations.map(r => r.tmdbId));
      const uniqueNew = newItems.filter(r => !existingIds.has(r.tmdbId));
      const enriched = enrichRecommendations(uniqueNew, favoriteIds, seenIds);

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
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        🧠 Recomendaciones
      </Text>

      {recommendationGenerations < 2 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ marginBottom: 16 }}
        >
          <View style={{ backgroundColor: '#333', padding: 16, borderRadius: 12, marginBottom: 8 }}>
            <Text style={{ color: '#fff', marginBottom: 8, fontSize: 14 }}>
              Cuéntanos qué tipo de películas o series te gustan:
            </Text>
            <TextInput
              placeholder="Ej: Me gustan comedias románticas y dramas con finales inesperados"
              placeholderTextColor="#ccc"
              style={{
                backgroundColor: '#fff',
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
                color: '#000',
                minHeight: 60,
              }}
              multiline
              value={initialPrompt}
              onChangeText={setInitialPrompt}
            />

            <TouchableOpacity
              onPress={generateNewRecommendations}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: isGenerating ? '#555' : '#8b5cf6',
                alignItems: 'center',
              }}
              disabled={isGenerating}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>
                {isGenerating ? '🔄 Generando...' : '🎯 Obtener recomendaciones'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      <FlatList
        data={recommendations.filter(r => !dismissedIds.has(r.id))}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setSelectedItem(item)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
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
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>
                  {item.releaseDate?.substring(0, 10)}
                </Text>
                <Text style={{ color: '#eee', fontSize: 14 }} numberOfLines={3}>
                  {item.overview}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => markAsSeen(item)}
                    disabled={item.seen}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: item.seen ? '#4c1d95' : '#7c3aed',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>
                      {item.seen ? '✅ Visto' : '⭐ Visto'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => markAsFavorite(item)}
                    disabled={item.favorite}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: item.favorite ? '#881337' : '#ec4899',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>
                      {item.favorite ? '❤️ Agregado' : '❤️ Favorito'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setDismissedIds(prev => new Set(prev).add(item.id))
                    }
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: '#444',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>🙈 No me interesa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLikedItem(item)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: '#059669',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>👍 Me gustó</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      {selectedItem && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              width: '100%',
              maxHeight: '80%',
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={{ fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#000' }}
              >
                {selectedItem.title}
              </Text>
              <Text style={{ color: '#333', fontSize: 14, marginBottom: 20 }}>
                {selectedItem.overview}
              </Text>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>⭐ Votos</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fbbf24' }}>
                    {selectedItem.voteAverage}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>🔥 Popularidad</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#db2777' }}>
                    {selectedItem.popularity ?? '-'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>🎬 Tipo</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#059669' }}>
                    {selectedItem.mediaType.toUpperCase()}
                  </Text>
                </View>
              </View>

              {Array.isArray(selectedItem.platforms) && selectedItem.platforms.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#000' }}>
                    Disponible en:
                  </Text>
                  {selectedItem.platforms.map(platform => (
                    <Text key={platform} style={{ fontSize: 14, color: '#444' }}>
                      • {platform}
                    </Text>
                  ))}
                </View>
              )}            

              {selectedItem.trailerUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                  style={{ backgroundColor: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
                    ▶️ Ver tráiler
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedItem(null)}
                style={{ backgroundColor: '#8b5cf6', padding: 12, borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
