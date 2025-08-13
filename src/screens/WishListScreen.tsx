import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal as RNModal, // para el confirm simple
  Linking,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import { useFocusEffect } from '@react-navigation/native';

// --- react-native-paper (popup detalle)
import {
  Portal,
  Modal,
  Button,
  Chip,
} from 'react-native-paper';

// Íconos de plataformas (opcional)
const platformIcons: Record<string, any> = {
  Netflix: require('../../assets/platforms/netflix.png'),
  'Disney Plus': require('../../assets/platforms/disneyplus.png'),
  'Amazon Prime Video': require('../../assets/platforms/primevideo.png'),
  'HBO Max': require('../../assets/platforms/hbomax.png'),
  'Apple TV+': require('../../assets/platforms/appletv.png'),
  YouTube: require('../../assets/platforms/youtube.png'),
  Hulu: require('../../assets/platforms/hulu.png'),
};

type TmdbLite = {
  id: number;
  title: string;
  posterUrl?: string;
  mediaType?: 'movie' | 'tv';
  // Opcionales si el backend los trae
  overview?: string;
  releaseDate?: string;
  voteAverage?: number;
  popularity?: number;
  platforms?: string[];
  trailerUrl?: string | null;
};

type WishItem = {
  tmdbId?: number;
  tmdb?: TmdbLite;
};

export default function WishListScreen() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [localSearch, setLocalSearch] = useState('');

  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<WishItem | null>(null);

  // --- vistos y marcado
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [markingId, setMarkingId] = useState<number | null>(null);

  // --- popup detalle
  const [selectedItem, setSelectedItem] = useState<TmdbLite | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSeen = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!('Authorization' in headers)) return;

      const res = await axios.get(`${ENV.API_URL}/seen?take=1000`, { headers });
      const ids: number[] = (res.data?.items || res.data?.seen?.items || res.data || [])
        .map((i: any) => i.tmdbId)
        .filter((x: any) => typeof x === 'number');

      setSeenIds(new Set(ids));
    } catch (e) {
      console.warn('No se pudo cargar lista de vistos', e);
    }
  };

  const fetchWishList = async (pageIndex = 0, append = false) => {
    const take = 10;
    const skip = pageIndex * take;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const headers = await getAuthHeaders();
      if (!('Authorization' in headers)) return;

      const params = new URLSearchParams({
        take: `${take}`,
        skip: `${skip}`,
        ...(localSearch ? { search: localSearch } : {}),
      });

      const res = await axios.get(`${ENV.API_URL}/wishlist?${params}`, { headers });

      const newItems: WishItem[] = res.data?.wishlist?.items || [];
      const totalPages = res.data?.wishlist?.totalPages ?? 1;

      if (!append) {
        setItems(newItems);
      } else {
        setItems((prev) => {
          const combined = [...prev, ...newItems];
          const map = new Map<number, WishItem>();
          combined.forEach((i) => {
            const key = i.tmdb?.id ?? i.tmdbId!;
            if (typeof key === 'number') map.set(key, i);
          });
          return Array.from(map.values());
        });
      }

      setPage(pageIndex);
      setHasNextPage(pageIndex + 1 < totalPages);
    } catch (e) {
      console.error('Error cargando wishlist', e);
      Toast.show({ type: 'error', text1: 'Error cargando Deseados' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRemove = async (tmdbId: number) => {
    setRemovingId(tmdbId);
    try {
      const headers = await getAuthHeaders();
      if (!('Authorization' in headers)) return;

      await axios.delete(`${ENV.API_URL}/wishlist/${tmdbId}`, { headers });
      setItems((prev) => prev.filter((x) => (x.tmdb?.id ?? x.tmdbId) !== tmdbId));
      Toast.show({ type: 'success', text1: 'Eliminado de Deseados' });
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'No se pudo eliminar' });
    } finally {
      setRemovingId(null);
    }
  };

  // --- marcar como visto
  const handleMarkSeen = async (itemOrTmdb: WishItem | TmdbLite) => {
    const tmdbId = 'id' in itemOrTmdb
      ? itemOrTmdb.id
      : (itemOrTmdb.tmdb?.id ?? itemOrTmdb.tmdbId!);

    const mediaType = 'id' in itemOrTmdb
      ? (itemOrTmdb.mediaType ?? 'movie')
      : (itemOrTmdb.tmdb?.mediaType ?? 'movie');

    if (!tmdbId) return;
    if (seenIds.has(tmdbId)) return;

    setMarkingId(tmdbId);
    try {
      const headers = await getAuthHeaders();
      if (!('Authorization' in headers)) return;

      await axios.post(
        `${ENV.API_URL}/seen`,
        { tmdbId, mediaType },
        { headers: { ...headers, 'Content-Type': 'application/json' } },
      );

      setSeenIds((prev) => new Set(prev).add(tmdbId));

      await axios.delete(`${ENV.API_URL}/wishlist/${tmdbId}`, { headers });
      setItems((prev) => prev.filter((x) => (x.tmdb?.id ?? x.tmdbId) !== tmdbId));

      // Si el modal está abierto de ese ítem, lo cierro
      setSelectedItem((curr) => (curr && curr.id === tmdbId ? null : curr));

      Toast.show({ type: 'success', text1: 'Marcado como visto 👀' });
    } catch (e) {
      console.error('No se pudo marcar como visto', e);
      Toast.show({ type: 'error', text1: 'No se pudo marcar como visto' });
    } finally {
      setMarkingId(null);
    }
  };

  // --- abrir detalle: si faltan datos, intenta enriquecer
  const openDetail = async (wish: WishItem) => {
    const base: TmdbLite = {
      id: wish.tmdb?.id ?? wish.tmdbId!,
      title: wish.tmdb?.title ?? 'Sin título',
      posterUrl: wish.tmdb?.posterUrl,
      mediaType: wish.tmdb?.mediaType,
      overview: wish.tmdb?.overview,
      releaseDate: wish.tmdb?.releaseDate,
      voteAverage: wish.tmdb?.voteAverage,
      popularity: wish.tmdb?.popularity,
      platforms: wish.tmdb?.platforms,
      trailerUrl: wish.tmdb?.trailerUrl,
    };

    // Si ya hay overview o voteAverage, abre directo
    if (base.overview || base.voteAverage != null) {
      setSelectedItem(base);
      return;
    }

    setLoadingDetail(true);
    try {
      const headers = await getAuthHeaders();
      if (!('Authorization' in headers)) {
        setSelectedItem(base);
        return;
      }

      // Endpoint opcional para enriquecer datos del TMDB
      const { data } = await axios.get(`${ENV.API_URL}/tmdb/${base.id}`, { headers });
      const enriched = {
        ...base,
        title: data?.title ?? base.title,
        posterUrl: data?.posterUrl ?? base.posterUrl,
        mediaType: data?.mediaType ?? base.mediaType,
        overview: data?.overview ?? base.overview,
        releaseDate: data?.releaseDate ?? base.releaseDate,
        voteAverage: data?.voteAverage ?? base.voteAverage,
        popularity: data?.popularity ?? base.popularity,
        platforms: data?.platforms ?? base.platforms,
        trailerUrl: data?.trailerUrl ?? base.trailerUrl,
      } as TmdbLite;

      setSelectedItem(enriched);
    } catch (e) {
      console.warn('No se pudo enriquecer detalle TMDB, mostrando básico', e);
      setSelectedItem(base);
    } finally {
      setLoadingDetail(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await fetchSeen();
        await fetchWishList(0, false);
      })();
    }, [])
  );

  if (loading && !items.length) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 pt-4">
      <Text className="text-white text-2xl font-bold mb-2">💖 Deseados</Text>

      <TextInput
        value={localSearch}
        onChangeText={async (text) => {
          setLocalSearch(text);
          setPage(0);
          await fetchWishList(0, false);
        }}
        placeholder="📁 Buscar en tus Deseados"
        placeholderTextColor="#aaa"
        className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-4"
      />

      <FlatList
        data={items}
        keyExtractor={(item) => ((item.tmdb?.id ?? item.tmdbId)!.toString())}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchSeen();
              await fetchWishList(0, false);
            }}
            tintColor="#a855f7"
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && hasNextPage) {
            fetchWishList(page + 1, true);
          }
        }}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator color="#a855f7" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const posterUrl = item.tmdb?.posterUrl;
          const title = item.tmdb?.title ?? 'Sin título';
          const tmdbId = item.tmdb?.id ?? item.tmdbId!;
          const isRemoving = removingId === tmdbId;
          const isMarking = markingId === tmdbId;
          const isSeen = seenIds.has(tmdbId);

          return (
            <View className="mb-6 w-[48%]">
              <TouchableOpacity activeOpacity={0.8} onPress={() => openDetail(item)}>
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    className="w-full h-56 rounded-xl mb-2"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-56 rounded-xl mb-2 bg-zinc-700 justify-center items-center">
                    <Text className="text-white text-sm text-center px-2">Sin póster</Text>
                  </View>
                )}
                <Text className="text-white font-semibold text-sm mb-2 text-center">{title}</Text>
              </TouchableOpacity>

              {!isSeen && (
                <TouchableOpacity
                  onPress={() => handleMarkSeen(item)}
                  disabled={isMarking}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#22c55e',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center' }}>
                    {isMarking ? '🔄 Marcando...' : '👀 Marcar visto'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setConfirmDeleteItem(item)}
                disabled={isRemoving}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center' }}>
                  {isRemoving ? '🔄 Quitando...' : '🗑️ Quitar Deseado'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de confirmación simple (RN) */}
      {confirmDeleteItem && (
        <RNModal transparent animationType="fade" visible>
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-lg font-bold text-black mb-4 text-center">
                ¿Quitar “{confirmDeleteItem.tmdb?.title ?? 'este ítem'}” de tus Deseados?
              </Text>
              <View className="flex-row justify-end gap-4">
                <TouchableOpacity
                  onPress={() => setConfirmDeleteItem(null)}
                  className="bg-zinc-300 px-4 py-2 rounded-full"
                >
                  <Text className="text-black font-semibold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const id = confirmDeleteItem.tmdb?.id ?? confirmDeleteItem.tmdbId!;
                    handleRemove(id);
                    setConfirmDeleteItem(null);
                  }}
                  className="bg-red-600 px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-semibold">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </RNModal>
      )}

      {/* --- Popup de detalle (react-native-paper) --- */}
      <Portal>
        <Modal
          visible={!!selectedItem}
          onDismiss={() => setSelectedItem(null)}
          contentContainerStyle={{
            backgroundColor: '#fff',
            margin: 20,
            borderRadius: 16,
            maxHeight: '85%',
          }}
        >
          {selectedItem && (
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                {selectedItem.posterUrl ? (
                  <Image
                    source={{ uri: selectedItem.posterUrl }}
                    style={{ width: 200, height: 300, borderRadius: 12, marginBottom: 12 }}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111', textAlign: 'center' }}>
                  {selectedItem.title}
                </Text>
              </View>

              {/* Métricas */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 12 }}>⭐ Votos</Text>
                  <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 16 }}>
                    {selectedItem.voteAverage ?? '-'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 12 }}>🔥 Popularidad</Text>
                  <Text style={{ color: '#ec4899', fontWeight: 'bold', fontSize: 16 }}>
                    {selectedItem.popularity ?? '-'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 12 }}>🎬 Tipo</Text>
                  <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16 }}>
                    {(selectedItem.mediaType ?? 'movie').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Descripción */}
              {loadingDetail ? (
                <ActivityIndicator style={{ marginBottom: 16 }} />
              ) : (
                !!selectedItem.overview && (
                  <Text style={{ color: '#444', marginBottom: 16, lineHeight: 20 }}>
                    {selectedItem.overview}
                  </Text>
                )
              )}

              {/* Plataformas */}
              {(selectedItem.platforms ?? []).length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 6, color: '#111' }}>
                    Disponible en:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(selectedItem.platforms ?? []).map((p) => {
                      const icon = platformIcons[p];
                      if (icon) {
                        return (
                          <View
                            key={p}
                            style={{ backgroundColor: '#eee', padding: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 }}
                          >
                            <Image source={icon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                          </View>
                        );
                      }
                      return (
                        <Chip key={p} mode="outlined" style={{ marginRight: 8, marginBottom: 8 }}>
                          {p}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Acciones */}
              <View style={{ gap: 10 }}>
                {selectedItem.trailerUrl && (
                  <Button
                    mode="contained"
                    icon="play"
                    onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                  >
                    Ver tráiler
                  </Button>
                )}

                {!seenIds.has(selectedItem.id) && (
                  <Button
                    mode="contained"
                    onPress={() => handleMarkSeen(selectedItem)}
                    loading={markingId === selectedItem.id}
                  >
                    👀 Marcar visto y quitar de Deseados
                  </Button>
                )}

                <Button
                  mode="outlined"
                  onPress={() => {
                    handleRemove(selectedItem.id);
                    setSelectedItem(null);
                  }}
                >
                  🗑️ Quitar de Deseados
                </Button>

                <Button mode="text" onPress={() => setSelectedItem(null)}>
                  Cerrar
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}
