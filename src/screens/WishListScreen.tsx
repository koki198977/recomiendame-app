// src/screens/WishListScreen.tsx

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

export default function WishListScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any | null>(null);

  const fetchWishList = async (search = '', pageIndex = 0, append = false) => {
    const take = 10;
    const skip = pageIndex * take;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        take: `${take}`,
        skip: `${skip}`,
        ...(localSearch ? { search: localSearch } : {}),
      });

      const res = await axios.get(`${API_URL}/wishlist?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newItems = res.data.wishlist.items || [];
      const totalPages = res.data.wishlist.totalPages || 1;

      if (!append) setItems(newItems);
      else {
        // concatenar y deduplicar
        setItems(prev => {
          const combined = [...prev, ...newItems];
          const map = new Map<number, any>();
          combined.forEach(i => {
            const key = i.tmdb?.id ?? i.tmdbId;
            map.set(key, i);
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
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_URL}/wishlist/${tmdbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: 'success', text1: 'Eliminado de Deseados' });
      fetchWishList('', 0);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'No se pudo eliminar' });
    } finally {
      setRemovingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishList();
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

      {/* Búsqueda local */}
      <TextInput
        value={localSearch}
        onChangeText={text => {
          setLocalSearch(text);
          setPage(0);
          fetchWishList('', 0);
        }}
        placeholder="📁 Buscar en tus Deseados"
        placeholderTextColor="#aaa"
        className="bg-zinc-800 text-white px-4 py-2 rounded-lg mb-4"
      />

      <FlatList
        data={items}
        keyExtractor={item => ((item.tmdb?.id ?? item.tmdbId).toString())}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setPage(0);
              fetchWishList('', 0);
            }}
            tintColor="#a855f7"
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && hasNextPage) {
            fetchWishList('', page + 1, true);
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
          const title = item.tmdb?.title;
          const tmdbId = item.tmdb?.id ?? item.tmdbId;
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

      {/* Modal de confirmación */}
      {confirmDeleteItem && (
        <Modal transparent animationType="fade" visible>
          <View className="flex-1 justify-center items-center bg-black bg-opacity-70 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-lg font-bold text-black mb-4 text-center">
                ¿Quitar “{confirmDeleteItem.tmdb?.title}” de tus Deseados?
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
                    handleRemove(confirmDeleteItem.tmdb?.id ?? confirmDeleteItem.tmdbId);
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
