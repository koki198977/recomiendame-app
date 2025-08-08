// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Modal,
  Button,
  StyleSheet,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button as PaperButton, 
  Card, 
  Chip, 
  Avatar,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 24, paddingTop: 40 }}>
      {/* Avatar y email */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Avatar.Text 
          size={112} 
          label="👤" 
          style={{ backgroundColor: '#a855f7' }}
        />
        <Text variant="titleMedium" style={{ color: '#fff', marginTop: 16 }}>
          {user.email}
        </Text>
      </View>

      <Card style={{ backgroundColor: '#1f1f1f', marginBottom: 16 }}>
        <Card.Content style={{ padding: 20 }}>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 16 }}>
            Información Personal
          </Text>

          {/* Nombre */}
          <TextInput
            label="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={{ marginBottom: 16 }}
            theme={{ 
              colors: { 
                onSurfaceVariant: '#aaa',
                outline: '#444'
              } 
            }}
          />

          {/* Fecha de nacimiento */}
          <PaperButton
            mode="outlined"
            onPress={() => {
              setTempDate(birthDate ? parseLocalDate(birthDate) : new Date());
              setShowDatePicker(true);
            }}
            style={{ marginBottom: 16 }}
            theme={{ 
              colors: { 
                outline: '#444'
              } 
            }}
          >
            {birthDate || 'Selecciona fecha de nacimiento'}
          </PaperButton>

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
        </Card.Content>
      </Card>

      <Card style={{ backgroundColor: '#1f1f1f', marginBottom: 24 }}>
        <Card.Content style={{ padding: 20 }}>
          <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 16 }}>
            Géneros favoritos
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {genres.map((genre) => (
              <Chip
                key={genre}
                selected={favoriteGenres.includes(genre)}
                onPress={() => toggleGenre(genre)}
                mode="outlined"
                style={{ 
                  backgroundColor: favoriteGenres.includes(genre) ? '#a855f7' : 'transparent',
                  borderColor: favoriteGenres.includes(genre) ? '#a855f7' : '#444'
                }}
                textStyle={{ 
                  color: favoriteGenres.includes(genre) ? '#fff' : '#fff' 
                }}
              >
                {genre}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Guardar y Cerrar sesión */}
      <PaperButton
        mode="contained"
        onPress={handleSave}
        style={{ marginBottom: 16 }}
        contentStyle={{ paddingVertical: 8 }}
        icon="content-save"
      >
        Guardar cambios
      </PaperButton>

      <PaperButton
        mode="contained"
        onPress={handleLogout}
        style={{ backgroundColor: '#dc2626' }}
        contentStyle={{ paddingVertical: 8 }}
        icon="logout"
      >
        Cerrar sesión
      </PaperButton>

      {/* Modal para fecha de nacimiento */}
      <Portal>
        <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
          <Dialog.Title>Fecha de nacimiento</Dialog.Title>
          <Dialog.Content>
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
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setShowDatePicker(false)}>
              Cancelar
            </PaperButton>
            <PaperButton onPress={() => {
              // formateo YYYY-MM-DD en hora local
              const y = tempDate.getFullYear();
              const m = String(tempDate.getMonth() + 1).padStart(2, '0');
              const D = String(tempDate.getDate()).padStart(2, '0');
              setBirthDate(`${y}-${m}-${D}`);
              setShowDatePicker(false);
            }}>
              Aceptar
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
