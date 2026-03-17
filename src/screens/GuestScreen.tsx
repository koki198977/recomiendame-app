// src/screens/GuestScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
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
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

type Movie = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  media_type?: string;
};

export default function GuestScreen({ onLogin }: { onLogin: () => void }) {
  const insets = useSafeAreaInsets();
  const [popular, setPopular] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);

  useEffect(() => {
    fetchPopular();
  }, []);

  const fetchPopular = async () => {
    try {
      const [movies, shows] = await Promise.all([
        axios.get(`${TMDB_BASE}/movie/popular`, {
          params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', page: 1 },
        }),
        axios.get(`${TMDB_BASE}/tv/popular`, {
          params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', page: 1 },
        }),
      ]);
      const combined = [
        ...movies.data.results.slice(0, 10).map((m: Movie) => ({ ...m, media_type: 'movie' })),
        ...shows.data.results.slice(0, 10).map((s: Movie) => ({ ...s, media_type: 'tv' })),
      ].sort(() => Math.random() - 0.5);
      setPopular(combined);
    } catch (e) {
      console.error('Error fetching popular:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`${TMDB_BASE}/search/multi`, {
        params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', query: text, page: 1 },
      });
      setSearchResults(
        res.data.results.filter((r: any) => r.media_type !== 'person' && r.poster_path)
      );
    } catch (e) {
      console.error('Error searching:', e);
    } finally {
      setSearching(false);
    }
  }, []);

  const displayTitle = (item: Movie) => item.title || item.name || '';
  const displayYear = (item: Movie) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const renderCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.media_type === 'movie' ? 'PELÍCULA' : 'SERIE'}</Text>
      </View>
      {item.vote_average > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#F59E0B" />
          <Text style={styles.ratingBadgeText}>{item.vote_average.toFixed(1)}</Text>
        </View>
      )}
      {item.poster_path ? (
        <Image source={{ uri: `${POSTER_BASE}${item.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Ionicons name="film-outline" size={40} color={theme.colors.textTertiary} />
        </View>
      )}
    </TouchableOpacity>
  );

  const isSearching = query.trim().length >= 2;
  const data = isSearching ? searchResults : popular;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Explorar</Text>
          <Text style={styles.subtitle}>Películas y series populares</Text>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar películas o series..."
          placeholderTextColor={theme.colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Banner invitación */}
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={16} color="#a855f7" />
        <Text style={styles.bannerText}>
          Regístrate gratis para obtener recomendaciones personalizadas
        </Text>
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            isSearching && !searching ? (
              <View style={styles.center}>
                <Text style={{ color: theme.colors.textSecondary }}>Sin resultados para "{query}"</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            searching ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            ) : null
          }
          renderItem={renderCard}
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
                {selected?.poster_path ? (
                  <Image source={{ uri: `${POSTER_BASE}${selected.poster_path}` }} style={styles.modalPoster} />
                ) : (
                  <View style={[styles.modalPoster, styles.posterPlaceholder]}>
                    <Ionicons name="film-outline" size={60} color={theme.colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selected?.media_type === 'movie' ? 'PELÍCULA' : 'SERIE'}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selected ? displayTitle(selected) : ''}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {selected && selected.vote_average > 0 && (
                      <>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={{ color: '#fff', fontWeight: '600' }}>{selected.vote_average.toFixed(1)}</Text>
                      </>
                    )}
                    {selected && displayYear(selected) ? (
                      <Text style={{ color: theme.colors.textSecondary, marginLeft: 4 }}>{displayYear(selected)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {selected?.overview ? (
                <Text style={styles.overview}>{selected.overview}</Text>
              ) : null}

              {/* CTA para registrarse */}
              <View style={styles.ctaBox}>
                <Text style={styles.ctaTitle}>¿Te interesa esta película?</Text>
                <Text style={styles.ctaSubtitle}>
                  Crea una cuenta gratis y obtén recomendaciones personalizadas basadas en tus gustos.
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
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  logo: { width: 40, height: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  subtitle: { fontSize: 12, color: theme.colors.textSecondary },
  loginBtn: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 14 },
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
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    width: (width - 24 - 16) / 3,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  poster: { width: '100%', height: 160 },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
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
  ratingBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
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
