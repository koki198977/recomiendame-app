import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Button, 
  Portal, 
  Dialog,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';
import StarRating from 'react-native-star-rating-widget';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

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
  const [selectedItem, setSelectedItem] = useState<SeenItem | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingItem, setRatingItem] = useState<SeenItem | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState('');

  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmDeleteItem, setConfirmDeleteItem] = useState<SeenItem | null>(null);

  // Estados para agregar a vistos
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

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

      const ratingMap = (ratingsRes.data.ratings?.items || []).reduce((acc: any, r: RatingItem) => {
        acc[r.tmdbId] = r;
        return acc;
      }, {});

      setRatings(ratingsRes.data.ratings?.items || []);

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

  const handleAddSearch = useCallback(async () => {
    if (!addSearchQuery.trim() || addSearchQuery.length < 2) return;
    setSearching(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${ENV.API_URL}/search?q=${encodeURIComponent(addSearchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddSearchResults(res.data.results || []);
    } catch (e) {
      console.error('Error buscando', e);
      Toast.show({ type: 'error', text1: 'Error buscando' });
    } finally {
      setSearching(false);
    }
  }, [addSearchQuery]);

  useEffect(() => {
    fetchSeenAndRatings(true);
  }, []);

  // Búsqueda automática en vistos con debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchSeenAndRatings(true);
      }, 500);

      return () => clearTimeout(timer);
    } else if (searchQuery.length === 0) {
      fetchSeenAndRatings(true);
    }
  }, [searchQuery]);

  // Búsqueda automática con debounce para agregar vistos
  useEffect(() => {
    if (addSearchQuery.length >= 2) {
      const timer = setTimeout(() => {
        handleAddSearch();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setAddSearchResults([]);
    }
  }, [addSearchQuery, handleAddSearch]);

  const handleOpenModal = (item: SeenItem) => {
    setSelectedItem(item);
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
      await axios.post(
        `${ENV.API_URL}/ratings`,
        {
          tmdbId: ratingItem.tmdbId,
          title: ratingItem.tmdb?.title || '',
          mediaType: ratingItem.tmdb?.mediaType || 'movie',
          rating: ratingValue,
          comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: 'success',
        text1: '✅ Puntuado',
        text2: `Gracias por calificar "${ratingItem.tmdb?.title}"`,
      });

      setSeen(prev =>
        prev.map(item =>
          item.tmdbId === ratingItem.tmdbId
            ? { ...item, alreadyRated: true }
            : item
        )
      );

      setRatings(prev => [
        ...prev.filter(r => r.tmdbId !== ratingItem.tmdbId),
        { tmdbId: ratingItem.tmdbId, rating: ratingValue, comment },
      ]);

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
    if (!ratingItem) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${ENV.API_URL}/ratings/${ratingItem.tmdbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: 'success',
        text1: '🗑️ Evaluación eliminada',
        text2: `"${ratingItem.tmdb?.title}" fue eliminada de tus evaluaciones.`,
      });

      setRatings(prev => prev.filter(r => r.tmdbId !== ratingItem.tmdbId));
      setSeen(prev =>
        prev.map(item =>
          item.tmdbId === ratingItem.tmdbId
            ? { ...item, alreadyRated: false }
            : item
        )
      );
      setRatingModalVisible(false);
      setRatingItem(null);
    } catch (err) {
      console.warn('Error al eliminar evaluación:', err);
      Toast.show({
        type: 'error',
        text1: '❌ Error al eliminar',
        text2: 'Intenta nuevamente',
      });
    }
  };

  const handleAddToSeen = async (tmdbId: number, mediaType: string, title: string) => {
    setAddingId(tmdbId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${ENV.API_URL}/seen`,
        { tmdbId, mediaType },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      Toast.show({ type: 'success', text1: 'Marcado como visto', text2: title });
      setAddSearchQuery('');
      setAddSearchResults([]);
      setAddModalVisible(false);
      fetchSeenAndRatings(true);
    } catch (e: any) {
      console.error('Error agregando a vistos:', e.response?.data || e.message);
      Toast.show({ 
        type: 'error', 
        text1: 'No se pudo agregar',
        text2: e.response?.data?.message || 'Intenta nuevamente'
      });
    } finally {
      setAddingId(null);
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
    <View style={styles.container}>
      <Text style={styles.title}>👁️ Vistos recientemente</Text>

      <Searchbar
        placeholder="Buscar entre tus vistos"
        onChangeText={text => setSearchQuery(text)}
        value={searchQuery}
        style={styles.searchbar}
        iconColor={theme.colors.textSecondary}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.textTertiary}
      />

      {/* Botón agregar a vistos */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setAddModalVisible(true)}
      >
        <Ionicons name="add" size={20} color={theme.colors.text} />
        <Text style={styles.addButtonText}>Agregar a vistos</Text>
      </TouchableOpacity>

      {seen.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aún no has marcado ítems como vistos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={seen}
          keyExtractor={(item, idx) => `${item.tmdbId}-${item.userId}-${idx}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchSeenAndRatings(true);
              }}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasNextPage) {
              fetchSeenAndRatings(false);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenModal(item)}
              activeOpacity={0.9}
            >
              {item.tmdb?.mediaType && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.tmdb.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
                  </Text>
                </View>
              )}

              {item.tmdb?.posterUrl ? (
                <Image
                  source={{ uri: item.tmdb.posterUrl }}
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
                  {item.tmdb?.title || 'Sin título'}
                </Text>
                {item.watchedAt && (
                  <Text style={styles.cardDate}>
                    Visto: {new Date(item.watchedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

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
                {selectedItem?.tmdb?.posterUrl ? (
                  <Image
                    source={{ uri: selectedItem.tmdb.posterUrl }}
                    style={styles.modalPoster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalPoster, styles.posterPlaceholder]}>
                    <Ionicons name="film-outline" size={80} color={theme.colors.textTertiary} />
                  </View>
                )}

                <View style={styles.modalHeaderInfo}>
                  {selectedItem?.tmdb?.mediaType && (
                    <View style={styles.modalBadge}>
                      <Text style={styles.badgeText}>
                        {selectedItem.tmdb.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>
                    {selectedItem?.tmdb?.title || 'Sin título'}
                  </Text>
                  {selectedItem?.watchedAt && (
                    <Text style={styles.modalDate}>
                      Visto: {new Date(selectedItem.watchedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              {selectedItem?.tmdb?.overview && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalOverview}>
                    {selectedItem.tmdb.overview}
                  </Text>
                </View>
              )}

              {selectedItem?.tmdb?.platforms && selectedItem.tmdb.platforms.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.platformsTitle}>Disponible en:</Text>
                  <View style={styles.platformsContainer}>
                    {selectedItem.tmdb.platforms.map((platform: string, index: number) => (
                      <View key={index} style={styles.platformChip}>
                        <Text style={styles.platformText}>{platform}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
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
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => {
                    setConfirmDeleteItem(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  <Ionicons name="trash" size={20} color="#dc2626" />
                  <Text style={[styles.modalButtonText, { color: '#dc2626' }]}>
                    Eliminar de vistos
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
                {ratingItem?.tmdb?.title}
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

      {/* Modal de agregar a vistos */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addModalTitle}>Agregar nuevo visto</Text>
                <Text style={styles.addModalSubtitle}>
                  Busca una película o serie y regístrala como vista. Esto ayudará a mejorar tus recomendaciones.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => {
                  setAddModalVisible(false);
                  setAddSearchQuery('');
                  setAddSearchResults([]);
                }}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.searchLabel}>BUSCAR EN EL CATÁLOGO</Text>
            <View style={styles.catalogSearchContainer}>
              <TextInput
                value={addSearchQuery}
                onChangeText={setAddSearchQuery}
                placeholder="Busca películas o series..."
                placeholderTextColor={theme.colors.textTertiary}
                style={styles.catalogSearchInput}
                autoFocus={true}
              />
              {searching && (
                <View style={styles.searchingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              )}
            </View>

            {addSearchResults.length === 0 && !searching && addSearchQuery.length >= 2 && (
              <View style={styles.emptySearchState}>
                <Text style={styles.emptySearchText}>
                  No se encontraron resultados para "{addSearchQuery}".
                </Text>
              </View>
            )}

            {addSearchResults.length === 0 && !searching && addSearchQuery.length < 2 && (
              <View style={styles.emptySearchState}>
                <Text style={styles.emptySearchText}>
                  Escribe al menos 2 caracteres para buscar.
                </Text>
              </View>
            )}

            <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
              {addSearchResults.map((item) => {
                const tmdbId = item.id;
                const isAdding = addingId === tmdbId;
                
                return (
                  <View key={tmdbId} style={styles.searchResultItem}>
                    <View style={styles.searchResultInfo}>
                      {item.posterUrl && (
                        <Image
                          source={{ uri: item.posterUrl }}
                          style={styles.searchResultPoster}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.searchResultText}>
                        <View style={styles.searchResultBadge}>
                          <Text style={styles.searchResultBadgeText}>
                            {item.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
                          </Text>
                          {item.releaseDate && (
                            <Text style={styles.searchResultYear}>
                              {new Date(item.releaseDate).getFullYear()}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
                        {item.overview && (
                          <Text style={styles.searchResultOverview} numberOfLines={2}>
                            {item.overview}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addToSeenButton}
                      onPress={() => handleAddToSeen(tmdbId, item.mediaType, item.title)}
                      disabled={isAdding}
                    >
                      <Text style={styles.addToSeenButtonText}>
                        {isAdding ? 'Agregando...' : 'Marcar como visto'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  searchbar: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  addButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  loadingMore: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
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
  modalDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
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
  addModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxHeight: '85%',
    padding: theme.spacing.xl,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  addModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addModalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  closeIconButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  searchLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  catalogSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  catalogSearchInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  searchingIndicator: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  catalogSearchButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  catalogSearchButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  emptySearchState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  searchResultsContainer: {
    maxHeight: 400,
  },
  searchResultItem: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  searchResultInfo: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  searchResultPoster: {
    width: 60,
    height: 90,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  searchResultText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  searchResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  searchResultBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  searchResultYear: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  searchResultTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  searchResultOverview: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  addToSeenButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  addToSeenButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
});
