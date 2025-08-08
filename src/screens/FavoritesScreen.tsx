import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Card, 
  Button, 
  Portal, 
  Dialog,
  Chip
} from 'react-native-paper';
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

      if (!append) {
        setFavorites(newItems);
      } else {
        // concatenar y deduplicar por tmdbId o id
        setFavorites(prev => {
          const combined = [...prev, ...newItems];
          const map = new Map<number, any>();
          for (const it of combined) {
            const key = it.tmdb?.id ?? it.id;
            map.set(key, it);
          }
          return Array.from(map.values());
        });
      }

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
      const res = await axios.get(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`, {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const isSearching = searchResults.length > 0;
  const data = isSearching ? searchResults : favorites;

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 16 }}>
      <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 16, fontWeight: 'bold' }}>
        ⭐ Tus Favoritos
      </Text>

      {/* Buscar en API */}
      <Searchbar
        placeholder="🔍 Buscar películas o series"
        onChangeText={text => {
          setSearchQuery(text);
          if (text.trim() === '') setSearchResults([]);
        }}
        onSubmitEditing={handleSearch}
        value={searchQuery}
        style={{ marginBottom: 16, backgroundColor: '#1f1f1f' }}
        iconColor="#aaa"
        inputStyle={{ color: '#fff' }}
      />

      {searching && (
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#a855f7" />
          <Text style={{ color: '#666', marginTop: 4, fontSize: 12 }}>Buscando...</Text>
        </View>
      )}

      {/* Buscar localmente */}
      {!isSearching && (
        <Searchbar
          placeholder="📁 Buscar en favoritos"
          onChangeText={text => {
            setLocalSearchQuery(text);
            setFavoritesPage(0);
            fetchFavorites(text, 0);
          }}
          value={localSearchQuery}
          style={{ marginBottom: 16, backgroundColor: '#1f1f1f' }}
          iconColor="#aaa"
          inputStyle={{ color: '#fff' }}
        />
      )}

      <FlatList
        data={data}
        keyExtractor={item => ((item.tmdb?.id ?? item.id).toString())}
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
            <View style={{ paddingVertical: 16 }}>
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
            <Card style={{ 
              width: '48%', 
              marginBottom: 24, 
              backgroundColor: '#1f1f1f',
              borderRadius: 12
            }}>
              <Card.Cover
                source={posterUrl ? { uri: posterUrl } : undefined}
                style={{ height: 224, borderRadius: 12 }}
                resizeMode="cover"
              />
              {!posterUrl && (
                <View style={{ 
                  height: 224, 
                  borderRadius: 12, 
                  backgroundColor: '#333', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', paddingHorizontal: 8 }}>
                    Sin póster
                  </Text>
                </View>
              )}

              <Card.Content style={{ padding: 12 }}>
                <Text 
                  variant="titleSmall" 
                  style={{ 
                    color: '#fff', 
                    fontWeight: '600', 
                    marginBottom: 8, 
                    textAlign: 'center' 
                  }}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                {isSearching ? (
                  <TouchableOpacity
                    onPress={() => handleAddFavorite(tmdbId, mediaType, title)}
                    disabled={isAdding}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: '#7c3aed',
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#fff', textAlign: 'center' }}>
                      {isAdding ? '🔄 Agregando...' : '⭐ Agregar a Favoritos'}
                    </Text>
                  </TouchableOpacity>
                ) : (
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
                      {isRemoving ? '🔄 Quitando...' : '🗑️ Quitar Favorito'}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />

      {/* Dialog de confirmación */}
      <Portal>
        <Dialog
          visible={confirmDeleteItem !== null}
          onDismiss={() => setConfirmDeleteItem(null)}
        >
          <Dialog.Title>Confirmar eliminación</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              ¿Quitar "{confirmDeleteItem?.tmdb?.title || confirmDeleteItem?.title}" de tus favoritos?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteItem(null)}>
              Cancelar
            </Button>
            <Button 
              onPress={() => {
                handleRemoveFavorite(confirmDeleteItem?.tmdb?.id || confirmDeleteItem?.id);
                setConfirmDeleteItem(null);
              }}
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
