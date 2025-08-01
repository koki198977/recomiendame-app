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
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesPage, setFavoritesPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Estado para modal de confirmación
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any | null>(null);

  const fetchFavorites = async (search = '', page = 0, append = false) => {
    const take = 10;
    const skip = page * take;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        take: take.toString(),
        skip: skip.toString(),
        ...(search ? { search } : {}),
      });

      const res = await axios.get(`${API_URL}/favorites?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newItems = res.data.favorites.items || [];
      const totalPages = res.data.favorites.totalPages || 1;

      setFavorites((prev) => (append ? [...prev, ...newItems] : newItems));
      setFavoritesPage(page);
      setHasNextPage(page + 1 < totalPages);
    } catch (e) {
      console.error('Error cargando favoritos', e);
      Toast.show({ type: 'error', text1: 'Error cargando favoritos' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.results || []);
    } catch (e) {
      console.error('Error buscando', e);
      Toast.show({ type: 'error', text1: 'Error buscando' });
    } finally {
      setSearching(false);
    }
  };

  const handleAddFavorite = async (tmdbId: number, mediaType: string, title: string) => {
    setAddingId(tmdbId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_URL}/favorites`,
        { tmdbId, mediaType, title },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({ type: 'success', text1: 'Agregado a favoritos', text2: title });
      setSearchQuery('');
      setSearchResults([]);
      fetchFavorites(localSearchQuery, 0);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'No se pudo agregar' });
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveFavorite = async (tmdbId: number) => {
    setRemovingId(tmdbId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_URL}/favorites/${tmdbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: 'success', text1: 'Eliminado de favoritos' });
      fetchFavorites(localSearchQuery, 0);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'No se pudo eliminar' });
    } finally {
      setRemovingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  if (loading && !favorites.length) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const isSearching = searchResults.length > 0;
  const data = isSearching ? searchResults : favorites;

  return (
    <View className="flex-1 bg-black px-4 pt-4">
      <Text className="text-white text-2xl font-bold mb-2">⭐ Tus Favoritos</Text>

      {/* Buscar nuevos */}
      <TextInput
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          if (text.trim() === '') setSearchResults([]);
        }}
        onSubmitEditing={handleSearch}
        placeholder="🔍 Buscar películas o series"
        placeholderTextColor="#aaa"
        className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-4"
      />

      {searching && (
        <View className="mb-4 items-center">
          <ActivityIndicator size="small" color="#a855f7" />
          <Text className="text-zinc-400 mt-1 text-sm">Buscando...</Text>
        </View>
      )}

      {/* Buscar dentro */}
      {!isSearching && (
        <TextInput
          value={localSearchQuery}
          onChangeText={(text) => {
            setLocalSearchQuery(text);
            setFavoritesPage(0);
            fetchFavorites(text, 0);
          }}
          placeholder="📁 Buscar en favoritos"
          placeholderTextColor="#aaa"
          className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-4"
        />
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => (item.tmdb?.id || item.id).toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setFavoritesPage(0);
              fetchFavorites(localSearchQuery, 0);
            }}
            tintColor="#a855f7"
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && hasNextPage && !isSearching) {
            fetchFavorites(localSearchQuery, favoritesPage + 1, true);
          }
        }}
        ListFooterComponent={
          !isSearching && loadingMore ? (
            <View className="py-4">
              <ActivityIndicator color="#a855f7" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const posterUrl = item.tmdb?.posterUrl || item.posterUrl;
          const title = item.tmdb?.title || item.title;
          const mediaType = item.tmdb?.mediaType || item.mediaType;
          const tmdbId = item.tmdb?.id || item.id;

          const isAdding = addingId === tmdbId;
          const isRemoving = removingId === tmdbId;

          return (
            <View className="mb-6 w-[48%]">
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

              {isSearching ? (
                <TouchableOpacity
                  disabled={isAdding}
                  onPress={() => handleAddFavorite(tmdbId, mediaType, title)}
                  className={`px-3 py-1 rounded-full self-center flex-row items-center space-x-2 ${
                    isAdding ? 'bg-zinc-700' : 'bg-purple-600'
                  }`}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <><Feather name="star" size={16} color="white" /><Text className="text-white text-sm">+ Favorito</Text></>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={isRemoving}
                  onPress={() => setConfirmDeleteItem(item)}
                  className={`px-3 py-1 rounded-full self-center flex-row items-center space-x-2 ${
                    isRemoving ? 'bg-zinc-700' : 'bg-red-600'
                  }`}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <><Feather name="trash-2" size={16} color="white" /><Text className="text-white text-sm">Quitar</Text></>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Modal de confirmación */}
      {confirmDeleteItem && (
        <Modal transparent animationType="fade" visible>
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-lg font-bold text-black mb-4 text-center">
                ¿Quitar "{confirmDeleteItem.tmdb?.title || confirmDeleteItem.title}" de tus favoritos?
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
                    handleRemoveFavorite(confirmDeleteItem.tmdb?.id || confirmDeleteItem.id);
                    setConfirmDeleteItem(null);
                  }}
                  className="bg-red-600 px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-semibold">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
