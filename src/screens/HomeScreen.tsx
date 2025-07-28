import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, TMDB_API_KEY } from '@env';

type Recommendation = {
  title: string;
  tmdbId: number;
  reason: string;
  createdAt: string;
  mediaType: 'movie' | 'tv';
};

export default function HomeScreen() {
  const [stats, setStats] = useState<any>(null);
  const [posters, setPosters] = useState<{ [tmdbId: number]: string }>({});
  const [loading, setLoading] = useState(true);

  const getPoster = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
    try {
      const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const res = await axios.get(url);
      return `https://image.tmdb.org/t/p/w500${res.data.poster_path}`;
    } catch (e) {
      console.warn(`Error al obtener poster para ${tmdbId}`, e);
      return '';
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.stats;
        setStats(data);

        // cargar posters
        const postersMap: any = {};
        await Promise.all(
          data.recentRecommendations.map(async (rec: Recommendation) => {
            const mediaType = rec.tmdbId.toString().length > 6 ? 'tv' : 'movie'; // Heurística
            const posterUrl = await getPoster(rec.tmdbId, mediaType as 'movie' | 'tv');
            postersMap[rec.tmdbId] = posterUrl;
          })
        );
        setPosters(postersMap);
      } catch (error) {
        console.error('Error al cargar stats:', error);
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

      <View className="bg-zinc-900 p-4 rounded-xl mb-4">
        <Text className="text-white">🎬 Vistos: {stats.seenTotal}</Text>
        <Text className="text-white">⭐ Favoritos: {stats.favoriteTotal}</Text>
        <Text className="text-white">📝 Puntuaciones: {stats.ratingsTotal}</Text>
        <Text className="text-white">📈 Promedio: {stats.averageRating}</Text>
      </View>

      <Text className="text-white text-xl font-semibold mb-2">Por tipo</Text>
      {Object.entries(stats.breakdownByType).map(([type, breakdown]: any) => (
        <View key={type} className="bg-zinc-800 p-3 rounded-lg mb-2">
          <Text className="text-white capitalize font-bold">{type}</Text>
          <Text className="text-white">Vistos: {breakdown.seen}</Text>
          <Text className="text-white">Favoritos: {breakdown.favorites}</Text>
          <Text className="text-white">Puntuaciones: {breakdown.ratings}</Text>
        </View>
      ))}

      <Text className="text-white text-xl font-semibold mt-4 mb-2">🎭 Géneros favoritos</Text>
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
              source={{ uri: posters[item.tmdbId] }}
              className="w-full h-60 rounded-xl mb-2"
              resizeMode="cover"
            />
            <Text className="text-white font-bold text-sm">{item.title}</Text>
            <Text className="text-zinc-400 text-xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}
