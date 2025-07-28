import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/favorites?take=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites.items || []);
    } catch (e) {
      console.error('Error cargando favoritos', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.results);
    } catch (e) {
      console.error('Error buscando', e);
    }
  };

  const handleAddFavorite = async (tmdbId: number, mediaType: string, title: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/favorites`,
        { tmdbId, mediaType, title },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Toast.show({
        type: 'success',
        text1: `Agregado a favoritos`,
        text2: `"${title}" fue agregado correctamente 👌`,
        visibilityTime: 2000,
      });

      setSearchQuery('');
      setSearchResults([]);
      await fetchFavorites();
    } catch (e) {
      console.error('Error al agregar a favoritos', e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo agregar a favoritos 😢',
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  if (loading) {
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

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="mb-6 w-[48%]">
            {item.posterUrl ? (
              <Image
                source={{ uri: item.posterUrl }}
                className="w-full h-56 rounded-xl mb-2"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-56 rounded-xl mb-2 bg-zinc-700 justify-center items-center">
                <Text className="text-white text-sm text-center px-2">Póster no disponible</Text>
              </View>
            )}
            <Text className="text-white font-semibold text-sm mb-2 text-center">{item.title}</Text>

            {isSearching && (
              <TouchableOpacity
                onPress={() => handleAddFavorite(item.id, item.mediaType, item.title)}
                className="bg-purple-600 px-3 py-1 rounded-full self-center"
              >
                <Text className="text-white text-sm">+ Favorito</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
