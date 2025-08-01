// src/screens/HomeScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import { FontAwesome, MaterialIcons, Entypo, Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useFocusEffect } from '@react-navigation/native';

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

const platformIcons: Record<string, any> = {
  Netflix: require('../../assets/platforms/netflix.png'),
  'Disney Plus': require('../../assets/platforms/disneyplus.png'),
  'Amazon Prime Video': require('../../assets/platforms/primevideo.png'),
  'Amazon Channel': require('../../assets/platforms/primevideo.png'),
  'HBO Max': require('../../assets/platforms/hbomax.png'),
  'Apple TV+': require('../../assets/platforms/appletv.png'),
  'Apple TV Channel': require('../../assets/platforms/appletv.png'),
  YouTube: require('../../assets/platforms/youtube.png'),
  MovistarTV: require('../../assets/platforms/movistarplay.png'),
  'Paramount Plus': require('../../assets/platforms/paramountplus.png'),
  'Paramount +': require('../../assets/platforms/paramountplus.png'),
  'Pluto TV': require('../../assets/platforms/plutotv.png'),
  'Universal+ Amazon Channel': require('../../assets/platforms/universalplus.png'),
  Hulu: require('../../assets/platforms/hulu.png'),
};

export default function HomeScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Para el popup de detalle:
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const fetchStats = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data.stats);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: '❌ Error al cargar estadísticas',
        text2:
          err?.response?.status === 401
            ? 'Sesión expirada. Inicia sesión nuevamente.'
            : 'Intenta nuevamente más tarde.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="px-4 pt-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
      >
        <Text className="text-white text-2xl font-bold mb-4">Resumen</Text>

        {stats ? (
          <>
            {/* --- Estadísticas --- */}
            <View className="bg-zinc-900 p-5 rounded-2xl mb-6 flex-row justify-between items-center">
              <View>
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="insights" size={20} color="#9f43e3" />
                  <Text className="text-white ml-2">Vistos: {stats.seenTotal}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <FontAwesome name="star" size={20} color="gold" />
                  <Text className="text-white ml-2">Favoritos: {stats.favoriteTotal}</Text>
                </View>
                <View className="flex-row items-center">
                  <Entypo name="video" size={20} color="#61dafb" />
                  <Text className="text-white ml-2">Puntuaciones: {stats.ratingsTotal}</Text>
                </View>
              </View>
              <View className="items-center">
                {stats.averageRating != null ? (
                  <Progress.Circle
                    size={80}
                    progress={stats.averageRating / 5}
                    showsText
                    formatText={() => stats.averageRating.toFixed(2)}
                    thickness={8}
                    color="#4f46e5"
                    unfilledColor="#333"
                    borderWidth={0}
                  />
                ) : (
                  <Text className="text-white text-2xl font-bold">-</Text>
                )}
                <Text className="text-zinc-400 text-sm mt-1">Promedio</Text>
              </View>
            </View>

            {/* --- Géneros favoritos --- */}
            {stats.favoriteGenres?.length > 0 && (
              <>
                <Text className="text-white text-xl font-semibold mb-2">
                  🎭 Géneros favoritos
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {stats.favoriteGenres.map((g: string) => (
                    <Text
                      key={g}
                      className="text-white bg-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      {g}
                    </Text>
                  ))}
                </View>
              </>
            )}

            {/* --- Recomendaciones recientes --- */}
            {stats.recentRecommendations?.length > 0 && (
              <>
                <Text className="text-white text-xl font-semibold mb-2">
                  🤖 Recomendaciones recientes
                </Text>
                <FlatList
                  horizontal
                  data={stats.recentRecommendations}
                  keyExtractor={(item: Recommendation) => item.tmdbId.toString()}
                  showsHorizontalScrollIndicator={false}
                  className="mb-10 px-1"
                  renderItem={({ item }: { item: Recommendation }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedItem(item)}
                      className="mr-4 w-40"
                    >
                      <Image
                        source={{ uri: item.posterUrl }}
                        className="w-full h-60 rounded-xl mb-2"
                        resizeMode="cover"
                      />
                      <Text className="text-white font-bold text-sm mb-1">
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </>
        ) : (
          <Text className="text-zinc-400 text-center">
            No se pudieron cargar estadísticas. Intenta nuevamente.
          </Text>
        )}
      </ScrollView>

      {/* --- Popup de detalle --- */}
      {selectedItem && (
        <View className="absolute inset-0 bg-black bg-opacity-80 justify-center items-center px-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{ maxHeight: '85%' }}
            >
              <ScrollView
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text className="text-xl font-bold mb-2 text-black">
                  {selectedItem.title}
                </Text>
                <Text className="text-gray-800 mb-4 text-sm">
                  {selectedItem.overview}
                </Text>

                <View className="flex-row justify-around items-center mb-4">
                  <View className="items-center">
                    <Text className="text-gray-600 text-xs">⭐ Votos</Text>
                    <Text className="text-yellow-600 font-bold text-base">
                      {selectedItem.voteAverage}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-600 text-xs">🔥 Popularidad</Text>
                    <Text className="text-pink-500 font-bold text-base">
                      {selectedItem.popularity ?? '-'}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-600 text-xs">🎬 Tipo</Text>
                    <Text className="text-green-600 font-bold text-base">
                      {selectedItem.mediaType.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {(selectedItem.platforms ?? []).length > 0 && (
                  <View className="mb-4">
                    <Text className="text-black font-semibold mb-1">
                      Disponible en:
                    </Text>
                    <View className="flex-row flex-wrap">
                      {(selectedItem.platforms ?? []).map((p) => {
                        const icon = platformIcons[p];
                        return icon ? (
                          <View
                            key={p}
                            className="bg-zinc-200 rounded-md mr-2 mb-2 p-1"
                          >
                            <Image
                              source={icon}
                              style={{ width: 28, height: 28 }}
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <Text key={p} className="text-zinc-700 text-sm mr-2 mb-2">
                            {p}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                )}

                {selectedItem.trailerUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                    className="bg-purple-600 py-2 rounded-full mb-4"
                  >
                    <Text className="text-white text-center font-semibold">
                      ▶️ Ver tráiler
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setSelectedItem(null)}
                  className="bg-gray-300 py-2 rounded-full"
                >
                  <Text className="text-center font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}
