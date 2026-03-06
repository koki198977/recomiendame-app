import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
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
import { 
  Text, 
  Card, 
  Chip, 
  Button, 
  Portal, 
  Modal, 
  Divider,
  ProgressBar
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import { FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

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
  'HBO Max': require('../../assets/platforms/hbomax.png'),
  'Apple TV+': require('../../assets/platforms/appletv.png'),
  YouTube: require('../../assets/platforms/youtube.png'),
  Hulu: require('../../assets/platforms/hulu.png'),
  // ...otros
};

export default function HomeScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  const fetchStats = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${ENV.API_URL}/dashboard/stats`, {
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

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        style={{ paddingHorizontal: 16, paddingTop: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 16, fontWeight: 'bold' }}>
          Resumen
        </Text>

        {stats ? (
          <>
            {/* --- Estadísticas --- */}
            <View style={{ backgroundColor: '#27272a', padding: 20, borderRadius: 16, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="insights" size={20} color="#9f43e3" />
                  <Text style={{ color: '#fff', marginLeft: 8 }}>Vistos: {stats.seenTotal}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <FontAwesome name="star" size={20} color="gold" />
                  <Text style={{ color: '#fff', marginLeft: 8 }}>Favoritos: {stats.favoriteTotal}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Entypo name="heart" size={20} color="#ec4899" />
                  <Text style={{ color: '#fff', marginLeft: 8 }}>Deseados: {stats.wishlistTotal}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Entypo name="video" size={20} color="#61dafb" />
                  <Text style={{ color: '#fff', marginLeft: 8 }}>Puntuaciones: {stats.ratingsTotal}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                {stats.averageRating != null ? (
                  <Progress.Circle
                    size={80}
                    progress={stats.averageRating / 5}
                    showsText={true}
                    formatText={() => stats.averageRating.toFixed(2)}
                    thickness={8}
                    color="#4f46e5"
                    unfilledColor="#333"
                    borderWidth={0}
                  />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>-</Text>
                )}
                <Text style={{ color: '#a1a1aa', fontSize: 14, marginTop: 4 }}>Promedio</Text>
              </View>
            </View>

            {/* --- Géneros favoritos --- */}
            {stats.favoriteGenres?.length > 0 && (
              <>
                <Text variant="titleLarge" style={{ color: '#fff', marginBottom: 8, fontWeight: '600' }}>
                  🎭 Géneros favoritos
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {stats.favoriteGenres.map((g: string) => (
                    <Chip
                      key={g}
                      mode="outlined"
                      style={{ backgroundColor: '#a855f7' }}
                      textStyle={{ color: '#fff' }}
                    >
                      {g}
                    </Chip>
                  ))}
                </View>
              </>
            )}

            {/* --- Recomendaciones recientes --- */}
            {stats.recentRecommendations?.length > 0 && (
              <>
                <Text variant="titleLarge" style={{ color: '#fff', marginBottom: 8, fontWeight: '600' }}>
                  🤖 Recomendaciones recientes
                </Text>
                <FlatList
                  horizontal={true}
                  data={stats.recentRecommendations}
                  keyExtractor={(item: Recommendation) => item.tmdbId.toString()}
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 40, paddingLeft: 4 }}
                  renderItem={({ item }: { item: Recommendation }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedItem(item)}
                      style={{ marginRight: 16, width: 160 }}
                    >
                      <Image
                        source={{ uri: item.posterUrl }}
                        style={{ width: '100%', height: 240, borderRadius: 12, marginBottom: 8 }}
                        resizeMode="cover"
                      />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </>
        ) : (
          <Text style={{ color: '#666', textAlign: 'center' }}>
            No se pudieron cargar estadísticas. Intenta nuevamente.
          </Text>
        )}
      </ScrollView>

      {/* --- Modal de detalle --- */}
      <Portal>
        <Modal
          visible={selectedItem !== null}
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
              <Text variant="headlineSmall" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                {selectedItem.title}
              </Text>
              <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
                {selectedItem.overview}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="labelSmall" style={{ color: '#666' }}>⭐ Votos</Text>
                  <Text variant="titleMedium" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {selectedItem.voteAverage}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="labelSmall" style={{ color: '#666' }}>🔥 Popularidad</Text>
                  <Text variant="titleMedium" style={{ color: '#ec4899', fontWeight: 'bold' }}>
                    {selectedItem.popularity ?? '-'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="labelSmall" style={{ color: '#666' }}>🎬 Tipo</Text>
                  <Text variant="titleMedium" style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {selectedItem.mediaType.toUpperCase()}
                  </Text>
                </View>
              </View>

                {(selectedItem.platforms ?? []).length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: '#000', fontWeight: '600', marginBottom: 4 }}>
                      Disponible en:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {(selectedItem.platforms ?? []).map((p) => {
                        const icon = platformIcons[p];
                        if (icon) {
                          return (
                            <View
                              key={p}
                              style={{ backgroundColor: '#e4e4e7', borderRadius: 6, marginRight: 8, marginBottom: 8, padding: 4 }}
                            >
                              <Image
                                source={icon}
                                style={{ width: 28, height: 28 }}
                                resizeMode="contain"
                              />
                            </View>
                          );
                        }
                        return (
                          <Text key={p} style={{ color: '#3f3f46', fontSize: 14, marginRight: 8, marginBottom: 8 }}>
                            {p}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                )}

              {selectedItem.trailerUrl && (
                <Button
                  mode="contained"
                  onPress={() => Linking.openURL(selectedItem.trailerUrl!)}
                  style={{ marginBottom: 16 }}
                  icon="play"
                >
                  Ver tráiler
                </Button>
              )}

              <Button
                mode="outlined"
                onPress={() => setSelectedItem(null)}
              >
                Cerrar
              </Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}
