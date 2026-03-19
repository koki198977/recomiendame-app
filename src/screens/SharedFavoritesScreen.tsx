// src/screens/SharedFavoritesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../config/env';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

type FavoriteItem = {
  id: number;
  tmdb?: {
    id: number;
    title: string;
    posterUrl: string | null;
    mediaType: string;
    releaseDate?: string;
    overview?: string;
    voteAverage?: number;
  };
  title?: string;
  posterUrl?: string | null;
  mediaType?: string;
  releaseDate?: string;
  overview?: string;
};

type Props = {
  userId: string;
  ownerName?: string;
  onLogin: () => void;
  onBack: () => void;
};

export default function SharedFavoritesScreen({ userId, ownerName, onLogin, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<FavoriteItem | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFavorites = useCallback(async (pageNum = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const url = `${ENV.API_URL}/favorites/shared/${userId}`;
      console.log('[SharedFavorites] GET', url, { take: 30, skip: pageNum * 30 });

      const res = await axios.get(url, {
        params: { take: 30, skip: pageNum * 30 },
      });

      console.log('[SharedFavorites] status:', res.status);
      console.log('[SharedFavorites] data:', JSON.stringify(res.data, null, 2));

      const items = res.data.favorites?.items || res.data.items || [];
      const total = res.data.favorites?.total || res.data.total || 0;
      const take = 30;
      const totalPages = Math.ceil(total / take) || 1;

      console.log('[SharedFavorites] items count:', items.length, '| total:', total, '| totalPages:', totalPages);

      if (append) {
        setFavorites(prev => [...prev, ...items]);
      } else {
        setFavorites(items);
      }
      setPage(pageNum);
      setHasMore(pageNum + 1 < totalPages);
    } catch (e: any) {
      console.log('[SharedFavorites] ERROR:', e?.response?.status, e?.response?.data ?? e?.message);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites(0);
  }, [fetchFavorites]);

  const getTitle = (item: FavoriteItem) => item.tmdb?.title || item.title || '';
  const getPoster = (item: FavoriteItem) => item.tmdb?.posterUrl || item.posterUrl;
  const getMediaType = (item: FavoriteItem) => item.tmdb?.mediaType || item.mediaType;
  const getOverview = (item: FavoriteItem) => item.tmdb?.overview || item.overview;
  const getYear = (item: FavoriteItem) => {
    const d = item.tmdb?.releaseDate || item.releaseDate;
    return d ? new Date(d).getFullYear() : null;
  };
  const getVote = (item: FavoriteItem) => item.tmdb?.voteAverage;

  const renderCard = ({ item }: { item: FavoriteItem }) => {
    const poster = getPoster(item);
    const mediaType = getMediaType(item);
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mediaType === 'movie' ? 'PEL' : 'SER'}</Text>
        </View>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="film-outline" size={32} color={theme.colors.textTertiary} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{getTitle(item)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {ownerName ? `Favoritos de ${ownerName}` : 'Favoritos compartidos'}
          </Text>
          <Text style={styles.subtitle}>{favorites.length} títulos</Text>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={14} color="#a855f7" />
        <Text style={styles.bannerText}>
          Regístrate para guardar tus propios favoritos y compartirlos
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.errorText}>No se pudo cargar esta lista</Text>
          <Text style={styles.errorSubtext}>El enlace puede ser inválido o haber expirado</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.errorText}>Esta lista está vacía</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, i) => `${item.tmdb?.id ?? item.id ?? i}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={renderCard}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!loadingMore && hasMore) fetchFavorites(page + 1, true);
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal detalle */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                {selected && getPoster(selected) ? (
                  <Image source={{ uri: getPoster(selected)! }} style={styles.modalPoster} resizeMode="cover" />
                ) : (
                  <View style={[styles.modalPoster, styles.posterPlaceholder]}>
                    <Ionicons name="film-outline" size={60} color={theme.colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {selected && getMediaType(selected) && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {getMediaType(selected) === 'movie' ? 'PELÍCULA' : 'SERIE'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>{selected ? getTitle(selected) : ''}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {selected && getVote(selected) ? (
                      <>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                          {getVote(selected)!.toFixed(1)}
                        </Text>
                      </>
                    ) : null}
                    {selected && getYear(selected) ? (
                      <Text style={{ color: theme.colors.textSecondary }}>{getYear(selected)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {selected && getOverview(selected) ? (
                <Text style={styles.overview}>{getOverview(selected)}</Text>
              ) : null}

              {/* CTA */}
              <View style={styles.ctaBox}>
                <Text style={styles.ctaTitle}>¿Te gusta esta lista?</Text>
                <Text style={styles.ctaSubtitle}>
                  Crea tu cuenta gratis y empieza a guardar tus propios favoritos para compartirlos.
                </Text>
                <TouchableOpacity style={styles.ctaBtn} onPress={onLogin}>
                  <Text style={styles.ctaBtnText}>Crear cuenta gratis</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: theme.colors.text },
  subtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  loginBtn: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  bannerText: { flex: 1, color: '#c084fc', fontSize: 12 },
  grid: { paddingHorizontal: 8, paddingBottom: 32 },
  card: {
    width: CARD_WIDTH,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  badge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  badgeText: { fontSize: 8, fontWeight: 'bold', color: '#fff', letterSpacing: 0.3 },
  poster: { width: '100%', height: CARD_WIDTH * 1.5 },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  cardInfo: { padding: 6 },
  cardTitle: { fontSize: 11, color: theme.colors.text, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  errorText: { color: theme.colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  errorSubtext: { color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '88%',
    padding: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: { flexDirection: 'row', marginBottom: 16, marginTop: 8 },
  modalPoster: { width: 110, height: 165, borderRadius: 10 },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 6,
    flexShrink: 1,
  },
  overview: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaBox: {
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    marginBottom: 8,
  },
  ctaTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  ctaSubtitle: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 14 },
  ctaBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
