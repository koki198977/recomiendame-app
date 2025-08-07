// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Button,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import CustomPicker from '../components/CustomPicker';
import { API_URL } from '@env';

// parsea un "YYYY-MM-DD" a Date en zona local
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');       // "YYYY-MM-DD"
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

  // Estado del date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    birthDate ? parseLocalDate(birthDate) : new Date()
  );

  const genres = [
  'Acción',
  'Aventura',
  'Animación',
  'Comedia',
  'Crimen',
  'Documental',
  'Drama',
  'Fantasía',
  'Historia',
  'Terror',
  'Romance',
  'Ciencia ficción',
  'Suspenso',
];

  const countryOptions = [
    { label: 'Chile', value: 'CL' },
    { label: 'Argentina', value: 'AR' },
    { label: 'Perú', value: 'PE' },
    { label: 'México', value: 'MX' },
    { label: 'Colombia', value: 'CO' },
    { label: 'España', value: 'ES' },
    { label: 'Estados Unidos', value: 'US' },
    { label: 'Brasil', value: 'BR' },
    { label: 'Uruguay', value: 'UY' },
    { label: 'Paraguay', value: 'PY' },
  ];

  const languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'Inglés', value: 'en' },
    { label: 'Portugués', value: 'pt' },
    { label: 'Francés', value: 'fr' },
    { label: 'Alemán', value: 'de' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        const res = await axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setFullName(res.data.fullName || '');
        setBirthDate(res.data.birthDate?.slice(0, 10) || '');
        setCountry(res.data.country || '');
        setLanguage(res.data.language || '');
        setFavoriteGenres(res.data.favoriteGenres || []);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudo cargar el perfil',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleGenre = (genre: string) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter((g) => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(
        `${API_URL}/users/${userId}`,
        {
          fullName,
          birthDate: birthDate
            ? new Date(birthDate).toISOString()
            : undefined,
          country,
          language,
          favoriteGenres,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Toast.show({
        type: 'success',
        text1: '✅ Perfil actualizado',
      });
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar',
      });
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black px-6 pt-10">
      {/* Avatar y email */}
      <View className="items-center mb-6">
        <View className="w-28 h-28 rounded-full bg-purple-600 justify-center items-center">
          <Text className="text-white text-5xl">👤</Text>
        </View>
        <Text className="text-white text-lg mt-4">{user.email}</Text>
      </View>

      {/* Nombre */}
      <Text className="text-white mb-1">Nombre completo</Text>
      <TextInput
        className="bg-zinc-800 text-white rounded-xl px-4 py-3 mb-4"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Fecha de nacimiento */}
      <Text className="text-white mb-1">Fecha de nacimiento</Text>
      <TouchableOpacity
        onPress={() => {
          setTempDate(birthDate ? parseLocalDate(birthDate) : new Date());
          setShowDatePicker(true);
        }}
        className="bg-zinc-800 rounded-xl px-4 py-3 mb-4"
      >
        <Text className="text-white">
          {birthDate || 'Selecciona fecha de nacimiento'}
        </Text>
      </TouchableOpacity>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              locale="es-ES"
              themeVariant="light"
              textColor="#000"
              onChange={(
                _event: DateTimePickerEvent,
                selected?: Date
              ) => {
                if (selected) setTempDate(selected);
              }}
              style={{ backgroundColor: '#fff' }}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setShowDatePicker(false)}
              />
              <Button
                title="Aceptar"
                onPress={() => {
                  // formateo YYYY-MM-DD en hora local
                  const y = tempDate.getFullYear();
                  const m = String(tempDate.getMonth() + 1).padStart(2, '0');
                  const D = String(tempDate.getDate()).padStart(2, '0');
                  setBirthDate(`${y}-${m}-${D}`);
                  setShowDatePicker(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* País */}
      <CustomPicker
        label="País"
        value={country}
        onChange={setCountry}
        options={countryOptions}
      />

      {/* Idioma */}
      <CustomPicker
        label="Idioma"
        value={language}
        onChange={setLanguage}
        options={languageOptions}
      />

      {/* Géneros favoritos */}
      <Text className="text-white mb-2">Géneros favoritos</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            onPress={() => toggleGenre(genre)}
            className={`px-3 py-1 rounded-full border ${
              favoriteGenres.includes(genre)
                ? 'bg-purple-600 border-purple-500'
                : 'bg-zinc-800 border-zinc-600'
            }`}
          >
            <Text className="text-white text-sm">{genre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Guardar y Cerrar sesión */}
      <TouchableOpacity
        onPress={handleSave}
        className="bg-purple-600 py-3 rounded-xl items-center mb-4"
      >
        <Text className="text-white font-bold text-base">
          💾 Guardar cambios
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-600 py-3 rounded-xl items-center"
      >
        <Text className="text-white font-bold text-base">
          🚪 Cerrar sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
});
