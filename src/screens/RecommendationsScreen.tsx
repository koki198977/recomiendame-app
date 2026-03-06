import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { 
  Text, 
  Button, 
  Portal, 
  Dialog,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import StarRating from 'react-native-star-rating-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';
import { theme } from '../styles/theme';

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

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingItem, setRatingItem] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchRatings();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsRefreshing(true);
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
    } catch (err) {
      console.warn('Error al cargar recomendaciones:', err);
      Toast.show({ type: 'error', text1: 'Error cargando recomendaciones' });
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
    
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/seen`,
        { tmdbId: selectedItem.tmdbId, mediaType: selectedItem.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: 'success', text1: '✅ Marcado como visto', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error) {
      console.warn('Error al marcar como visto:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo marcar como visto' });
    }
  };

  const handleMarkFavorite = async () => {
    if (!selectedItem) return;

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/favorites`,
        { tmdbId: selectedItem.tmdbId, mediaType: selectedItem.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: 'success', text1: '❤️ Agregado a favoritos', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error) {
      console.warn('Error al marcar favorito:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a favoritos' });
    }
  };

  const handleMarkWishlist = async () => {
    if (!selectedItem) return;

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/wishlist`,
        { tmdbId: selectedItem.tmdbId, mediaType: selectedItem.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: 'success', text1: '💖 Agregado a wishlist', text2: selectedItem.title });
      setSelectedItem(null);
    } catch (error) {
      console.warn('Error al marcar wishlist:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a wishlist' });
    }
  };

  const handleGenerateRecommendations = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Recomendaciones</Text>

      {/* Componente de generación de recomendaciones */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptLabel}>DESCRIBE LO QUE QUIERES VER</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={promptText}
            onChangeText={setPromptText}
            placeholder="Ej: Thrillers con giros impactantes..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline={true}
            style={styles.promptInput}
            editable={!isGenerating && !isRefreshing}
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateRecommendations}
            disabled={isGenerating || isRefreshing}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Text style={styles.generateButtonText}>Generar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={fetchRecommendations}
            disabled={isGenerating || isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Text style={styles.updateButtonText}>Actualizar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationsHeader}>
          <Text style={styles.recommendationsCount}>
            {recommendations.length} recomendaciones generadas
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

              {item.voteAverage && (
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
                  {selectedItem?.voteAverage && (
                    <View style={styles.modalRating}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.modalRatingText}>{selectedItem.voteAverage.toFixed(1)}</Text>
                      <Text style={styles.modalRatingLabel}>Estreno {new Date(selectedItem.releaseDate).getFullYear()}</Text>
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
                      if (selectedItem.trailerUrl) Linking.openURL(selectedItem.trailerUrl);
                    }}
                  >
                    <Ionicons name="play-circle" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalButtonText}>Ver trailer</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleMarkSeen}
                >
                  <Ionicons name="eye" size={20} color="#22c55e" />
                  <Text style={styles.modalButtonText}>Marcar visto</Text>
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
                                enableHalfStar={false}
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
                  style={styles.modalButton}
                  onPress={handleMarkFavorite}
                >
                  <Ionicons name="heart" size={20} color="#ec4899" />
                  <Text style={styles.modalButtonText}>En favoritos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleMarkWishlist}
                >
                  <Ionicons name="bookmark" size={20} color={theme.colors.primary} />
                  <Text style={styles.modalButtonText}>Añadir a wishlist</Text>
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
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  promptLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    marginBottom: theme.spacing.sm,
  },
  promptInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 40,
    maxHeight: 60,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  generateButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
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
