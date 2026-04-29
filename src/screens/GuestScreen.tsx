// src/screens/GuestScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, Image, TouchableOpacity, ActivityIndicator,
  TextInput, Modal, Dimensions, StyleSheet, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../config/env';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

type Movie = {
  id: number; title?: string; name?: string;
  poster_path: string | null; vote_average: number;
  release_date?: string; first_air_date?: string;
  overview: string; media_type?: string;
};

const CARD_W = (width - 24 - 16) / 3;

export default function GuestScreen({ onLogin }: { onLogin: () => void }) {
  const insets = useSafeAreaInsets();
  const [popular, setPopular] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { fetchPopular(); }, []);

  const fetchPopular = async () => {
    try {
      const [movies, shows] = await Promise.all([
        axios.get(`${TMDB_BASE}/movie/popular`, { params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', page: 1 } }),
        axios.get(`${TMDB_BASE}/tv/popular`, { params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', page: 1 } }),
      ]);
      const combined = [
        ...movies.data.results.slice(0, 10).map((m: Movie) => ({ ...m, media_type: 'movie' })),
        ...shows.data.results.slice(0, 10).map((s: Movie) => ({ ...s, media_type: 'tv' })),
      ].sort(() => Math.random() - 0.5);
      setPopular(combined);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await axios.get(`${TMDB_BASE}/search/multi`, {
        params: { api_key: ENV.TMDB_API_KEY, language: 'es-ES', query: text, page: 1 },
      });
      setSearchResults(res.data.results.filter((r: any) => r.media_type !== 'person' && r.poster_path));
    } catch { }
    finally { setSearching(false); }
  }, []);

  const displayTitle = (item: Movie) => item.title || item.name || '';
  const displayYear = (item: Movie) => {
    const d = item.release_date || item.first_air_date;
    return d ? new Date(d).getFullYear() : '';
  };

  const data = query.trim().length >= 2 ? searchResults : popular;
  const isSearchMode = query.trim().length >= 2;

  const renderCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.78}>
      {item.poster_path
        ? <Image source={{ uri: `${POSTER_BASE}${item.poster_path}` }} style={styles.poster} resizeMode="cover" />
        : <View style={[styles.poster, styles.posterPlaceholder]}><Ionicons name="film-outline" size={32} color={theme.colors.textTertiary} /></View>}
      <LinearGradient colors={['transparent', 'rgba(10,10,20,0.92)']} style={styles.cardGradient} />
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{item.media_type === 'movie' ? 'PELI' : 'SERIE'}</Text>
      </View>
      {item.vote_average > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={9} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.vote_average.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <LinearGradient colors={['#16103A', '#0A0A14']} style={styles.header}>
        <View style={styles.headerLogoWrap}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Explorar</Text>
          <Text style={styles.headerSub}>Peliculas y series populares</Text>
        </View>
        <TouchableOpacity onPress={onLogin} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.loginBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.loginBtnText}>Ingresar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Ionicons name="search" size={17} color={searchFocused ? '#A855F7' : theme.colors.textTertiary} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar películas o series..."
          placeholderTextColor={theme.colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* CTA Banner */}
      {!isSearchMode && (
        <TouchableOpacity onPress={onLogin} activeOpacity={0.85} style={styles.ctaBanner}>
          <LinearGradient colors={['#1A0A40', '#2A1060']} style={styles.ctaBannerInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.ctaBannerIcon}>
              <Ionicons name="sparkles" size={18} color="#C084FC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaBannerTitle}>¿Quieres recomendaciones personalizadas?</Text>
              <Text style={styles.ctaBannerSub}>Regístrate gratis →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primaryGlow} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={searching ? <ActivityIndicator color={theme.colors.primaryGlow} size="small" style={{ marginVertical: 10 }} /> : null}
          ListEmptyComponent={isSearchMode && !searching
            ? <View style={styles.center}><Text style={styles.emptyText}>Sin resultados para "{query}"</Text></View>
            : null}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                {selected?.poster_path
                  ? <Image source={{ uri: `${POSTER_BASE}${selected.poster_path}` }} style={styles.modalPoster} resizeMode="cover" />
                  : <View style={[styles.modalPoster, styles.posterPlaceholder]}><Ionicons name="film-outline" size={48} color={theme.colors.textTertiary} /></View>}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={styles.modalTypeBadge}>
                    <Text style={styles.modalTypeBadgeText}>{selected?.media_type === 'movie' ? 'PELÍCULA' : 'SERIE'}</Text>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={3}>{selected ? displayTitle(selected) : ''}</Text>
                  <View style={styles.modalMeta}>
                    {selected && selected.vote_average > 0 && (
                      <>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.modalRating}>{selected.vote_average.toFixed(1)}</Text>
                      </>
                    )}
                    {selected && displayYear(selected) ? (
                      <Text style={styles.modalYear}>{displayYear(selected)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {selected?.overview ? (
                <Text style={styles.overview}>{selected.overview}</Text>
              ) : null}

              {/* CTA */}
              <View style={styles.ctaBox}>
                <Text style={styles.ctaTitle}>¿Te gusta esta {selected?.media_type === 'movie' ? 'película' : 'serie'}?</Text>
                <Text style={styles.ctaDesc}>
                  Crea una cuenta gratis y obtén recomendaciones personalizadas basadas en tus gustos.
                </Text>
                <TouchableOpacity onPress={onLogin} activeOpacity={0.85}>
                  <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="person-add" size={16} color="#fff" />
                    <Text style={styles.ctaBtnText}>Crear cuenta gratis</Text>
                  </LinearGradient>
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

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  headerLogoWrap: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  loginBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16, marginBottom: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchBarFocused: { borderColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.07)' },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 14 },

  // Banner
  ctaBanner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  ctaBannerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  ctaBannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(192,132,252,0.15)',
    alignItems: 'center', justifyContent: 'center' },
  ctaBannerTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  ctaBannerSub: { fontSize: 12, color: '#C084FC', fontWeight: '600' },

  // Grid
  grid: { paddingHorizontal: 10, paddingBottom: 30 },
  card: { width: CARD_W, margin: 3, borderRadius: 12, overflow: 'hidden',
    backgroundColor: theme.colors.surface, position: 'relative',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  poster: { width: '100%', height: 155 },
  posterPlaceholder: { backgroundColor: theme.colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 55 },
  cardBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(124,58,237,0.82)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  cardBadgeText: { fontSize: 7, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  ratingBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 9, fontWeight: '800', color: '#FCD34D' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#14141F', borderRadius: 24, width: '100%', maxHeight: '88%',
    padding: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.15)',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 14 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center' },
  modalHeader: { flexDirection: 'row', marginBottom: 16, marginTop: 6 },
  modalPoster: { width: 115, height: 170, borderRadius: 14, overflow: 'hidden' },
  modalTypeBadge: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  modalTypeBadgeText: { fontSize: 9, fontWeight: '800', color: '#C084FC', letterSpacing: 0.8 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, marginBottom: 10, letterSpacing: -0.3, flexShrink: 1 },
  modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalRating: { color: '#FCD34D', fontWeight: '700', fontSize: 13 },
  modalYear: { color: theme.colors.textSecondary, fontSize: 13, marginLeft: 4 },
  overview: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  ctaBox: { backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)', marginBottom: 8 },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  ctaDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 16 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 13,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
