import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import { Text, Portal, Dialog, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

type Recommendation = {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  releaseDate: string;
  voteAverage: number;
  popularity?: number;
  mediaType: 'movie' | 'tv';
  reason: string;
  posterUrl: string;
  trailerUrl?: string | null;
  platforms?: string[];
  seen?: boolean;
  favorite?: boolean;
};

export default function HomeScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const fetchStats = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Sesión no válida',
          text2: 'Por favor inicia sesión nuevamente',
        });
        return;
      }
      
      // Obtener nombre de usuario
      try {
        const userRes = await axios.get(`${ENV.API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(userRes.data.name || userRes.data.email?.split('@')[0] || 'Usuario');
      } catch (err) {
        setUserName('Usuario');
      }
      
      // Obtener estadísticas
      const { data } = await axios.get(`${ENV.API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Obtener conteo de wishlist ya que el backend no lo incluye en stats
      let wishlistCount = 0;
      try {
        const wishlistRes = await axios.get(`${ENV.API_URL}/wishlist?take=1&skip=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        wishlistCount = wishlistRes.data.wishlist?.total || 0;
      } catch (err) {
        console.log('Error obteniendo wishlist count:', err);
      }
      
      // Agregar wishlistTotal a las stats
      setStats({
        ...data.stats,
        wishlistTotal: wishlistCount,
      });
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
      
      // Si es un usuario nuevo sin datos, mostrar stats vacías en lugar de error
      if (err.response?.status === 404 || err.response?.data?.message?.includes('No se encontraron')) {
        setStats({
          seenTotal: 0,
          favoriteTotal: 0,
          wishlistTotal: 0,
          ratingsTotal: 0,
          averageRating: null,
          favoriteGenres: [],
          recentRecommendations: [],
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error al cargar estadísticas',
          text2: 'Intenta nuevamente más tarde.',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleMarkSeen = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/seen`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Marcado como visto', text2: item.title });
      setSelectedItem(null);
      fetchStats();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo marcar como visto' });
    }
  };

  const handleMarkFavorite = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/favorites`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Agregado a favoritos', text2: item.title });
      setSelectedItem(null);
      fetchStats();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a favoritos' });
    }
  };

  const handleMarkWishlist = async (item: Recommendation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${ENV.API_URL}/wishlist`,
        { tmdbId: item.tmdbId, mediaType: item.mediaType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Agregado a wishlist', text2: item.title });
      setSelectedItem(null);
      fetchStats();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo agregar a wishlist' });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header con logo y nombre de usuario */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hola, {userName}</Text>
            <Text style={styles.subtitle}>Tu resumen de entretenimiento</Text>
          </View>
        </View>

        {stats ? (
          <>
            {/* Stats Cards Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="eye" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.seenTotal || 0}</Text>
                <Text style={styles.statLabel}>Vistos</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.favoriteTotal || 0}</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#EC489920' }]}>
                  <Ionicons name="heart" size={24} color={theme.colors.secondary} />
                </View>
                <Text style={styles.statValue}>{stats.wishlistTotal || 0}</Text>
                <Text style={styles.statLabel}>Deseados</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="film" size={24} color={theme.colors.info} />
                </View>
                <Text style={styles.statValue}>{stats.ratingsTotal || 0}</Text>
                <Text style={styles.statLabel}>Puntuaciones</Text>
              </View>
            </View>

            {/* Rating Card */}
            {stats.averageRating != null && (
              <View style={styles.ratingCard}>
                <View style={styles.ratingContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ratingLabel}>Tu Promedio</Text>
                    <Text style={styles.ratingDescription}>
                      Basado en {stats.ratingsTotal} puntuaciones
                    </Text>
                  </View>
                  <View style={styles.ratingCircle}>
                    <Progress.Circle
                      size={70}
                      progress={stats.averageRating / 5}
                      showsText={true}
                      formatText={() => stats.averageRating.toFixed(1)}
                      thickness={5}
                      color={theme.colors.primary}
                      unfilledColor={theme.colors.border}
                      borderWidth={0}
                      textStyle={styles.ratingText}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Géneros favoritos */}
            {stats.favoriteGenres?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎭 Tus Géneros</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.genresContainer}
                >
                  {stats.favoriteGenres.map((genre: string) => (
                    <View key={genre} style={styles.genreChip}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recomendaciones recientes */}
            {stats.recentRecommendations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Recomendaciones Recientes</Text>
                <FlatList
                  horizontal={true}
                  data={stats.recentRecommendations}
                  keyExtractor={(item: Recommendation) => item.tmdbId.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendationsContainer}
                  renderItem={({ item }: { item: Recommendation }) => (
                    <TouchableOpacity 
                      style={styles.movieCard} 
                      activeOpacity={0.8}
                      onPress={() => setSelectedItem(item)}
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
                      <Image
                        source={{ uri: item.posterUrl }}
                        style={styles.moviePoster}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No hay datos disponibles</Text>
          </View>
        )}
      </ScrollView>

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
                      {selectedItem.releaseDate && (
                        <Text style={styles.modalRatingLabel}>
                          Estreno {selectedItem.releaseDate ? 'pendiente' : new Date(selectedItem.releaseDate).getFullYear()}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {selectedItem?.reason && (
                <View style={styles.reasonSection}>
                  <Text style={styles.reasonLabel}>ALTA CALIDAD • TIPO DE CONTENIDO PREFERIDO</Text>
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
                    style={[styles.modalButton, styles.trailerButton]}
                    onPress={() => {
                      if (selectedItem?.trailerUrl) {
                        Linking.openURL(selectedItem.trailerUrl).catch(() => {
                          Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: 'No se pudo abrir el trailer',
                          });
                        });
                      }
                    }}
                  >
                    <Ionicons name="play-circle" size={20} color="#3b82f6" />
                    <Text style={styles.modalButtonText}>Ver Trailer</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => selectedItem && handleMarkSeen(selectedItem)}
                >
                  <Ionicons name="eye" size={20} color="#22c55e" />
                  <Text style={styles.modalButtonText}>Marcar visto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => selectedItem && handleMarkFavorite(selectedItem)}
                >
                  <Ionicons name="heart" size={20} color="#ec4899" />
                  <Text style={styles.modalButtonText}>En favoritos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => selectedItem && handleMarkWishlist(selectedItem)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  statCard: {
    width: (width - theme.spacing.md * 2 - theme.spacing.sm) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    ...theme.shadows.sm,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingCard: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...theme.shadows.md,
  },
  ratingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ratingDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  ratingCircle: {
    marginLeft: theme.spacing.md,
  },
  ratingText: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  genresContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  genreChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  genreText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  recommendationsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  movieCard: {
    width: 140,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    ...theme.shadows.md,
    position: 'relative',
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
  moviePoster: {
    width: '100%',
    height: 210,
    backgroundColor: theme.colors.surfaceLight,
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
    marginTop: theme.spacing.md,
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
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
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
  modalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  trailerButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
});
