import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  TextInput,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from 'react-native-star-rating-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';
import { theme } from '../styles/theme';
import { useTrailerOpen } from '../hooks/useTrailerOpen';
import ChapiLoader from '../components/ChapiLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

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
  platforms?: string[];
  trailerUrl?: string;
}

// Cache a nivel de módulo: persiste mientras la app esté abierta
// Se resetea solo si el usuario recarga la app completamente
let _moduleCache: Recommendation[] = [];
let _moduleCacheLoaded = false;

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerData, setTrailerData] = useState<{ url: string; tmdbId: number } | null>(null);
  const { openTrailer } = useTrailerOpen();

  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingItem, setRatingItem] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);

  const [seenItems, setSeenItems] = useState<Set<number>>(new Set());
  const [favoriteItems, setFavoriteItems] = useState<Set<number>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());
  const [dislikedItems, setDislikedItems] = useState<Set<number>>(new Set());
  const [isHistory, setIsHistory] = useState(true); // true = mostrando historial, false = generadas

  useEffect(() => {
    // Si ya tenemos datos en el cache de módulo, usarlos directamente sin llamar a la API
    if (_moduleCacheLoaded && _moduleCache.length > 0) {
      setRecommendations(_moduleCache);
      setLoading(false);
      setIsHistory(true);
    } else {
      // Primera vez que se entra: pedir historial
      fetchRecommendationHistory();
    }
    fetchRatings();
    fetchUserLists();
  }, []);

  // Carga el historial de las últimas 15 recomendaciones (rápido, sin IA)
  const fetchRecommendationHistory = async () => {
    setLoading(true);
    setIsHistory(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(
        `${ENV.API_URL}/recommendations/history?skip=0&take=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // El endpoint devuelve { total, items: [...] }
      const items: Recommendation[] = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.recommendations || res.data.data || [];
      setRecommendations(items);
      // Guardar en cache de módulo para que al volver no se repita el request
      _moduleCache = items;
      _moduleCacheLoaded = true;
    } catch (err) {
      console.warn('Error cargando historial:', err);
      Toast.show({ type: 'error', text1: 'Error cargando historial' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (silent = false) => {
    try {
      if (!silent) {
        setIsRefreshing(true);
      }
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        `${ENV.API_URL}/recommendations`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recArray: Recommendation[] = Array.isArray(res.data)
        ? res.data
        : res.data.recommendations || [];

      setRecommendations(recArray);
      
      // Guardar en caché
      await AsyncStorage.setItem('cached_recommendations', JSON.stringify(recArray));
      await AsyncStorage.setItem('recommendations_cache_timestamp', Date.now().toString());
      setHasCachedData(true);
    } catch (err) {
      console.warn('Error al cargar recomendaciones:', err);
      if (!hasCachedData) {
        Toast.show({ type: 'error', text1: 'Error cargando recomendaciones' });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${ENV.API_URL}/ratings?take=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ratingsData = res.data.ratings || res.data.items || res.data || [];
      setRatings(ratingsData);
    } catch (e) {
      console.error('Error cargando ratings', e);
    }
  };

  const fetchUserLists = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Cargar items vistos
      const seenRes = await axios.get(`${ENV.API_URL}/seen?take=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let seenData = [];
      if (Array.isArray(seenRes.data)) {
        seenData = seenRes.data;
      } else if (seenRes.data.items && Array.isArray(seenRes.data.items)) {
        seenData = seenRes.data.items;
      } else if (seenRes.data.data && Array.isArray(seenRes.data.data)) {
        seenData = seenRes.data.data;
      }
      
      setSeenItems(new Set(seenData.map((item: any) => item.tmdbId)));

      // Cargar favoritos
      const favRes = await axios.get(`${ENV.API_URL}/favorites?take=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let favData = [];
      if (Array.isArray(favRes.data)) {
        favData = favRes.data;
      } else if (favRes.data.favorites?.items && Array.isArray(favRes.data.favorites.items)) {
        favData = favRes.data.favorites.items;
      } else if (favRes.data.favorites && Array.isArray(favRes.data.favorites)) {
        favData = favRes.data.favorites;
      } else if (favRes.data.items && Array.isArray(favRes.data.items)) {
        favData = favRes.data.items;
      } else if (favRes.data.data && Array.isArray(favRes.data.data)) {
        favData = favRes.data.data;
      }
      
      setFavoriteItems(new Set(favData.map((item: any) => item.tmdbId)));

      // Cargar wishlist
      const wishRes = await axios.get(`${ENV.API_URL}/wishlist?take=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let wishData = [];
      if (Array.isArray(wishRes.data)) {
        wishData = wishRes.data;
      } else if (wishRes.data.wishlist?.items && Array.isArray(wishRes.data.wishlist.items)) {
        wishData = wishRes.data.wishlist.items;
      } else if (wishRes.data.wishlist && Array.isArray(wishRes.data.wishlist)) {
        wishData = wishRes.data.wishlist;
      } else if (wishRes.data.items && Array.isArray(wishRes.data.items)) {
        wishData = wishRes.data.items;
      } else if (wishRes.data.data && Array.isArray(wishRes.data.data)) {
        wishData = wishRes.data.data;
      }
      
      setWishlistItems(new Set(wishData.map((item: any) => item.tmdbId)));

      // Cargar items descartados/no me gusta (endpoint puede no existir aún)
      try {
        const dislikedRes = await axios.get(`${ENV.API_URL}/disliked?take=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let dislikedData = [];
        if (Array.isArray(dislikedRes.data)) {
          dislikedData = dislikedRes.data;
        } else if (dislikedRes.data.disliked?.items && Array.isArray(dislikedRes.data.disliked.items)) {
          dislikedData = dislikedRes.data.disliked.items;
        } else if (dislikedRes.data.disliked && Array.isArray(dislikedRes.data.disliked)) {
          dislikedData = dislikedRes.data.disliked;
        } else if (dislikedRes.data.items && Array.isArray(dislikedRes.data.items)) {
          dislikedData = dislikedRes.data.items;
        } else if (dislikedRes.data.data && Array.isArray(dislikedRes.data.data)) {
          dislikedData = dislikedRes.data.data;
        }
        
        setDislikedItems(new Set(dislikedData.map((item: any) => item.tmdbId)));
      } catch (dislikedError: any) {
        // Si el endpoint no existe (404), simplemente ignorar
        if (dislikedError.response?.status !== 404) {
          console.error('Error cargando items descartados:', dislikedError);
        }
      }
    } catch (e) {
      console.error('Error cargando listas de usuario', e);
    }
  };

  const handleOpenRatingModal = () => {
    setRatingItem(selectedItem);
    
    const tmdbId = selectedItem?.tmdbId;
    const existing = Array.isArray(ratings) ? ratings.find(r => r.tmdbId === tmdbId) : null;
    
    if (existing) {
      setRatingValue(existing.rating);
      setComment(existing.comment || '');
    } else {
      setRatingValue(0);
      setComment('');
    }
    
    setSelectedItem(null);
    setTimeout(() => {
      setRatingModalVisible(true);
    }, 100);
  };

  const handleSendRating = async () => {
    if (!ratingItem) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const tmdbId = ratingItem.tmdbId;
      const title = ratingItem.title;
      const mediaType = ratingItem.mediaType || 'movie';

      await axios.post(
        `${ENV.API_URL}/ratings`,
        {
          tmdbId,
          title,
          mediaType,
          rating: ratingValue,
          comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: 'success',
        text1: '✅ Puntuado',
        text2: `Gracias por calificar "${title}"`,
      });

      await fetchRatings();

      setRatingModalVisible(false);
      setRatingValue(0);
      setComment('');
      setRatingItem(null);
    } catch (err) {
      console.warn('Error al puntuar:', err);
      Toast.show({
        type: 'error',
        text1: '❌ Error al puntuar',
        text2: 'Intenta nuevamente',
      });
    }
  };

  const handleMarkSeen = async () => {
    if (!selectedItem) return;
    
    // Verificar si ya está marcado
    if (seenItems.has(selectedItem.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está marcado como visto' });
      setSelectedItem(null);
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { 
        tmdbId: selectedItem.tmdbId, 
        mediaType: selectedItem.mediaType,
      };
      
      await axios.post(
        `${ENV.API_URL}/seen`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el estado local
      setSeenItems(prev => new Set(prev).add(selectedItem.tmdbId));

      Toast.show({ type: 'success', text1: '✅ Marcado como visto', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error: any) {
      if (error.response?.status === 500 || error.response?.status === 409) {
        setSeenItems(prev => new Set(prev).add(selectedItem.tmdbId));
        Toast.show({ type: 'info', text1: 'Ya estaba marcado como visto' });
        fetchUserLists();
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Error', 
          text2: error.response?.data?.message || 'No se pudo marcar como visto' 
        });
      }
    }
  };

  const handleMarkFavorite = async () => {
    if (!selectedItem) return;

    // Verificar si ya está marcado
    if (favoriteItems.has(selectedItem.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está en favoritos' });
      setSelectedItem(null);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { 
        tmdbId: selectedItem.tmdbId, 
        mediaType: selectedItem.mediaType,
        title: selectedItem.title,
      };
      
      await axios.post(
        `${ENV.API_URL}/favorites`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el estado local
      setFavoriteItems(prev => new Set(prev).add(selectedItem.tmdbId));

      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error: any) {
      if (error.response?.status === 500 || error.response?.status === 409) {
        setFavoriteItems(prev => new Set(prev).add(selectedItem.tmdbId));
        Toast.show({ type: 'info', text1: 'Ya estaba en favoritos' });
        fetchUserLists();
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Error', 
          text2: error.response?.data?.message || 'No se pudo agregar a favoritos' 
        });
      }
    }
  };

  const handleMarkWishlist = async () => {
    if (!selectedItem) return;

    // Verificar si ya está marcado
    if (wishlistItems.has(selectedItem.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está en wishlist' });
      setSelectedItem(null);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { 
        tmdbId: selectedItem.tmdbId, 
        mediaType: selectedItem.mediaType,
      };
      
      await axios.post(
        `${ENV.API_URL}/wishlist`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el estado local
      setWishlistItems(prev => new Set(prev).add(selectedItem.tmdbId));

      Toast.show({ type: 'success', text1: '💖 Agregado a wishlist', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error: any) {
      if (error.response?.status === 500 || error.response?.status === 409) {
        setWishlistItems(prev => new Set(prev).add(selectedItem.tmdbId));
        Toast.show({ type: 'info', text1: 'Ya estaba en wishlist' });
        fetchUserLists();
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Error', 
          text2: error.response?.data?.message || 'No se pudo agregar a wishlist' 
        });
      }
    }
  };

  const handleMarkDisliked = async () => {
    if (!selectedItem) return;

    if (dislikedItems.has(selectedItem.tmdbId)) {
      Toast.show({ type: 'info', text1: 'Ya está descartado' });
      setSelectedItem(null);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = { 
        tmdbId: selectedItem.tmdbId, 
        mediaType: selectedItem.mediaType,
      };
      
      await axios.post(
        `${ENV.API_URL}/disliked`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDislikedItems(prev => new Set(prev).add(selectedItem.tmdbId));
      setRecommendations(prev => prev.filter(item => item.tmdbId !== selectedItem.tmdbId));
      
      Toast.show({ type: 'success', text1: '🚫 No se volverá a recomendar', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error: any) {
      if (error.response?.status === 500 || error.response?.status === 409) {
        setDislikedItems(prev => new Set(prev).add(selectedItem.tmdbId));
        setRecommendations(prev => prev.filter(item => item.tmdbId !== selectedItem.tmdbId));
        Toast.show({ type: 'info', text1: 'Ya estaba descartado' });
        fetchUserLists();
        setSelectedItem(null);
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Error', 
          text2: error.response?.data?.message || 'No se pudo descartar' 
        });
      }
    }
  };

  const handleGenerateRecommendations = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setIsHistory(false);
    setLoading(false);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const body: any = {};
      if (promptText.trim()) body.feedback = promptText.trim();

      const res = await axios.post(`${ENV.API_URL}/recommendations`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newItems: Recommendation[] = Array.isArray(res.data)
        ? res.data
        : res.data.recommendations || [];

      setRecommendations(newItems);
      setPromptText('');

      // Guardar en cache de módulo (persiste al cambiar de tab)
      _moduleCache = newItems;
      _moduleCacheLoaded = true;

      Toast.show({ type: 'success', text1: '🎯 Nuevas recomendaciones generadas' });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error generando recomendaciones' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || isGenerating) {
    return <ChapiLoader />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Recomendaciones</Text>

      {/* Componente de generación de recomendaciones */}
      <View style={styles.promptContainer}>
        <TextInput
          value={promptText}
          onChangeText={setPromptText}
          placeholder="¿Qué tipo de película quieres ver hoy?"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          multiline={true}
          style={styles.promptInput}
          editable={!isGenerating && !isRefreshing}
        />

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerateRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generar nuevas recomendaciones</Text>
          )}
        </TouchableOpacity>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationsHeader}>
          <Text style={styles.recommendationsCount}>
            {isHistory
              ? `Últimas ${recommendations.length} recomendaciones`
              : `${recommendations.length} recomendaciones generadas`}
          </Text>
        </View>
      )}

      <FlatList
        data={recommendations}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.9}
            >
              {item.mediaType && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
                  </Text>
                </View>
              )}

              {item.voteAverage != null && item.voteAverage > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingBadgeText}>{item.voteAverage.toFixed(1)}</Text>
                </View>
              )}

              {item.posterUrl ? (
                <Image
                  source={{ uri: item.posterUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.poster, styles.posterPlaceholder]}>
                  <Ionicons name="film-outline" size={60} color={theme.colors.textTertiary} />
                </View>
              )}

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.releaseDate && (
                  <Text style={styles.cardDate}>
                    {new Date(item.releaseDate).getFullYear()}
                  </Text>
                )}
                {item.reason && (
                  <Text style={styles.cardReason} numberOfLines={2}>
                    {item.reason}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal de detalles */}
      <Modal
        visible={selectedItem !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                {selectedItem?.posterUrl ? (
                  <Image
                    source={{ uri: selectedItem.posterUrl }}
                    style={styles.modalPoster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalPoster, styles.posterPlaceholder]}>
                    <Ionicons name="film-outline" size={80} color={theme.colors.textTertiary} />
                  </View>
                )}

                <View style={styles.modalHeaderInfo}>
                  {selectedItem?.mediaType && (
                    <View style={styles.modalBadge}>
                      <Text style={styles.badgeText}>
                        {selectedItem.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>
                    {selectedItem?.title}
                  </Text>
                  {selectedItem?.voteAverage != null && selectedItem.voteAverage > 0 && (
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.modalRatingText}>{selectedItem.voteAverage.toFixed(1)}</Text>
                      {selectedItem.releaseDate ? (
                        <Text style={styles.modalRatingLabel}>Estreno {new Date(selectedItem.releaseDate).getFullYear()}</Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {selectedItem?.reason && (
                <View style={styles.reasonSection}>
                  <Text style={styles.reasonLabel}>ALTA CALIDAD • TIPO DE CONTENIDO PREFERIDO • SIMILAR A TUS FAVORITOS</Text>
                  <Text style={styles.reasonText}>{selectedItem.reason}</Text>
                </View>
              )}

              {selectedItem?.overview && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalOverview}>
                    {selectedItem.overview}
                  </Text>
                </View>
              )}

              {selectedItem?.platforms && selectedItem.platforms.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.platformsTitle}>Disponible en:</Text>
                  <View style={styles.platformsContainer}>
                    {selectedItem.platforms.map((platform: string, index: number) => (
                      <View key={index} style={styles.platformChip}>
                        <Text style={styles.platformText}>{platform}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedItem?.trailerUrl && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      if (selectedItem?.trailerUrl) {
                        openTrailer(selectedItem.trailerUrl, selectedItem.tmdbId);
                        setSelectedItem(null);
                      }
                    }}
                  >
                    <Ionicons name="play-circle" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalButtonText}>Ver trailer</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    selectedItem && seenItems.has(selectedItem.tmdbId) && styles.modalButtonMarked
                  ]}
                  onPress={handleMarkSeen}
                  disabled={selectedItem ? seenItems.has(selectedItem.tmdbId) : false}
                >
                  <Ionicons 
                    name={selectedItem && seenItems.has(selectedItem.tmdbId) ? "eye" : "eye-outline"} 
                    size={20} 
                    color="#22c55e" 
                  />
                  <Text style={styles.modalButtonText}>
                    {selectedItem && seenItems.has(selectedItem.tmdbId) ? "✓ Visto" : "Marcar visto"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleOpenRatingModal}
                >
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    {(() => {
                      const tmdbId = selectedItem?.tmdbId;
                      const rating = Array.isArray(ratings) ? ratings.find(r => r.tmdbId === tmdbId) : null;
                      if (rating) {
                        return (
                          <>
                            <Text style={styles.modalButtonText}>Tu calificación</Text>
                            <View style={styles.ratingPreview}>
                              <StarRating
                                rating={rating.rating}
                                onChange={() => {}}
                                starSize={16}
                                color="#F59E0B"
                                starStyle={{ marginHorizontal: 1 }}
                              />
                            </View>
                          </>
                        );
                      }
                      return <Text style={styles.modalButtonText}>Calificar</Text>;
                    })()}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    selectedItem && favoriteItems.has(selectedItem.tmdbId) && styles.modalButtonMarked
                  ]}
                  onPress={handleMarkFavorite}
                  disabled={selectedItem ? favoriteItems.has(selectedItem.tmdbId) : false}
                >
                  <Ionicons 
                    name={selectedItem && favoriteItems.has(selectedItem.tmdbId) ? "heart" : "heart-outline"} 
                    size={20} 
                    color="#ec4899" 
                  />
                  <Text style={styles.modalButtonText}>
                    {selectedItem && favoriteItems.has(selectedItem.tmdbId) ? "✓ En favoritos" : "Agregar a favoritos"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    selectedItem && wishlistItems.has(selectedItem.tmdbId) && styles.modalButtonMarked
                  ]}
                  onPress={handleMarkWishlist}
                  disabled={selectedItem ? wishlistItems.has(selectedItem.tmdbId) : false}
                >
                  <Ionicons 
                    name={selectedItem && wishlistItems.has(selectedItem.tmdbId) ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.modalButtonText}>
                    {selectedItem && wishlistItems.has(selectedItem.tmdbId) ? "✓ En wishlist" : "Añadir a wishlist"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonDislike,
                    selectedItem && dislikedItems.has(selectedItem.tmdbId) && styles.modalButtonMarked
                  ]}
                  onPress={handleMarkDisliked}
                  disabled={selectedItem ? dislikedItems.has(selectedItem.tmdbId) : false}
                >
                  <Ionicons 
                    name={selectedItem && dislikedItems.has(selectedItem.tmdbId) ? "close-circle" : "close-circle-outline"} 
                    size={20} 
                    color="#ef4444" 
                  />
                  <Text style={styles.modalButtonText}>
                    {selectedItem && dislikedItems.has(selectedItem.tmdbId) ? "✓ Descartado" : "No me interesa"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.closeModalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de calificación */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={[styles.modalOverlay, { zIndex: 1000 }]}>
          <ScrollView 
            contentContainerStyle={styles.ratingModalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.ratingModalContent}>
              <Text style={styles.ratingModalTitle}>Calificar</Text>
              <Text style={styles.ratingModalSubtitle}>
                {ratingItem?.title}
              </Text>

              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Tu calificación</Text>
                <View style={styles.starsContainer}>
                  <StarRating
                    rating={ratingValue}
                    onChange={setRatingValue}
                    starSize={40}
                    color={theme.colors.primary}
                    starStyle={{ marginHorizontal: 2 }}
                  />
                </View>
                {ratingValue === 0 && (
                  <Text style={styles.ratingHint}>Sin calificar</Text>
                )}
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Comentario (opcional)</Text>
                <TextInput
                  placeholder="¿Qué te pareció?"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={comment}
                  onChangeText={setComment}
                  multiline={true}
                  numberOfLines={4}
                  mode="outlined"
                  style={styles.commentInput}
                  theme={{
                    colors: {
                      onSurface: theme.colors.text,
                      onSurfaceVariant: theme.colors.textSecondary,
                      outline: 'rgba(139, 92, 246, 0.3)',
                      primary: theme.colors.primary,
                    }
                  }}
                />
              </View>

              <View style={styles.ratingModalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRatingModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSendRating}
                >
                  <Text style={styles.submitButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  promptContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  promptInput: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    maxHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  generateButton: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  updateButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  updateButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  suggestionChip: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  suggestionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
  },
  readyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  recommendationsHeader: {
    marginBottom: theme.spacing.md,
  },
  recommendationsCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  poster: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: theme.colors.surfaceLight,
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cardReason: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxHeight: '90%',
    padding: theme.spacing.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  modalPoster: {
    width: 120,
    height: 180,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  modalBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalRatingLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  reasonSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  reasonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalOverview: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  platformsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  platformChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  platformText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  modalActions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  modalButtonMarked: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    opacity: 0.7,
  },
  modalButtonDislike: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  ratingPreview: {
    marginTop: 4,
    transform: [{ scale: 0.8 }],
    marginLeft: -8,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  closeModalButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  ratingModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  ratingModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing.xl,
  },
  ratingModalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ratingModalSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  ratingSection: {
    marginBottom: theme.spacing.xl,
  },
  ratingLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ratingHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  commentSection: {
    marginBottom: theme.spacing.xl,
  },
  commentLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  commentInput: {
    backgroundColor: theme.colors.surfaceLight,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
});
