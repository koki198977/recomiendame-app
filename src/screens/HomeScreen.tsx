import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import { FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';

// Tipado de recomendaciones
type Recommendation = {
  title: string;
  tmdbId: number;
  reason: string;
  createdAt: string;
  mediaType: 'movie' | 'tv';
  posterUrl: string;
  trailerUrl?: string | null;
  platforms?: string[];
};

// Íconos locales de plataformas
const platformIcons: Record<string, any> = {
  'Netflix': require('../../assets/platforms/netflix.png'),
  'Disney Plus': require('../../assets/platforms/disneyplus.png'),
  'Amazon Prime Video': require('../../assets/platforms/primevideo.png'),
  'Amazon Channel': require('../../assets/platforms/primevideo.png'),
  'HBO Max': require('../../assets/platforms/hbomax.png'),
  'Apple TV+': require('../../assets/platforms/appletv.png'),
  'Apple TV Channel': require('../../assets/platforms/appletv.png'),
  'YouTube': require('../../assets/platforms/youtube.png'),
  'MovistarTV': require('../../assets/platforms/movistarplay.png'),
  'Paramount Plus': require('../../assets/platforms/paramountplus.png'),
  'Paramount +': require('../../assets/platforms/paramountplus.png'),
  'Pluto TV': require('../../assets/platforms/plutotv.png'),
  'Universal+ Amazon Channel': require('../../assets/platforms/universalplus.png'),
  'Hulu': require('../../assets/platforms/hulu.png'),
};

export default function HomeScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data.stats);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: '❌ Error al cargar estadísticas',
          text2:
            error?.response?.status === 401
              ? 'Sesión expirada. Inicia sesión nuevamente.'
              : 'Intenta nuevamente más tarde.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black px-4 pt-10">
      <Text className="text-white text-2xl font-bold mb-4">Resumen</Text>

      {stats ? (
        <>
          {/* Estadísticas */}
          <View className="bg-zinc-900 p-4 rounded-xl mb-4 flex-row justify-between items-center">
            <View>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="insights" size={20} color="#9f43e3" />
                <Text className="text-white ml-2">Vistos: {stats.seenTotal}</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="star" size={20} color="gold" />
                <Text className="text-white ml-2">Favoritos: {stats.favoriteTotal}</Text>
              </View>
              <View className="flex-row items-center">
                <Entypo name="video" size={20} color="#61dafb" />
                <Text className="text-white ml-2">Puntuaciones: {stats.ratingsTotal}</Text>
              </View>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{stats.averageRating ?? '-'}</Text>
              <Text className="text-zinc-400 text-sm">Promedio</Text>
            </View>
          </View>

          {/* Géneros favoritos */}
          {stats?.favoriteGenres?.length > 0 && (
            <>
              <Text className="text-white text-xl font-semibold mb-2">🎭 Géneros favoritos</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {stats.favoriteGenres.map((genre: string) => (
                  <Text
                    key={genre}
                    className="text-white bg-purple-700 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </Text>
                ))}
              </View>
            </>
          )}

          {/* Recomendaciones */}
          {stats?.recentRecommendations?.length > 0 && (
            <>
              <Text className="text-white text-xl font-semibold mb-2">🤖 Recomendaciones recientes</Text>
              <FlatList
                horizontal
                data={stats.recentRecommendations}
                keyExtractor={(item) => item.tmdbId.toString()}
                showsHorizontalScrollIndicator={false}
                className="mb-10"
                renderItem={({ item }: { item: Recommendation }) => (
                  <View className="mr-4 w-40">
                    <Image
                      source={{ uri: item.posterUrl }}
                      className="w-full h-60 rounded-xl mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-white font-bold text-sm mb-1">{item.title}</Text>

                    {/* Trailer */}
                    {item.trailerUrl && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.trailerUrl!)}
                        className="mb-1"
                      >
                        <Text className="text-blue-400 text-xs">▶ Ver trailer</Text>
                      </TouchableOpacity>
                    )}

                    {/* Plataformas */}
                    <View className="flex-row flex-wrap gap-2 items-center">
                      {item.platforms?.map((platform) => {
                        const icon = platformIcons[platform];
                        return icon ? (
                          <View
                            key={platform}
                            className="bg-white rounded-md border border-zinc-600 mr-1 mb-1 p-1"
                            style={{ width: 37, height: 37, justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Image
                              source={icon}
                              style={{ width: 28, height: 28 }}
                              resizeMode="contain"
                            />
                          </View>
                        ) : (
                          <Text
                            key={platform}
                            className="text-zinc-400 text-xs border border-zinc-500 rounded px-1"
                          >
                            {platform}
                          </Text>
                        );
                      })}
                    </View>

                  </View>
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
  );
}
