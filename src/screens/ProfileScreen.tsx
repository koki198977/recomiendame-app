// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Modal,
  Button,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Text,
} from 'react-native';
import { 
  TextInput, 
  Button as PaperButton, 
  Card, 
  Chip, 
  Avatar,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import CustomPicker from '../components/CustomPicker';
import { ENV } from '../config/env';

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
        
        if (!token || !userId) {
          Toast.show({
            type: 'error',
            text1: 'Sesión no válida',
            text2: 'Por favor inicia sesión nuevamente',
          });
          navigation.replace('Login');
          return;
        }
        
        const res = await axios.get(`${ENV.API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setUser(res.data);
        setFullName(res.data.fullName || '');
        setBirthDate(res.data.birthDate?.slice(0, 10) || '');
        setCountry(res.data.country || '');
        setLanguage(res.data.language || '');
        setFavoriteGenres(res.data.favoriteGenres || []);
      } catch (err: any) {
        console.error('Error al cargar perfil:', err);
        
        if (err.response?.status === 404) {
          Toast.show({
            type: 'error',
            text1: 'Usuario no encontrado',
            text2: 'Por favor inicia sesión nuevamente',
          });
          navigation.replace('Login');
        } else if (err.response?.status === 401) {
          Toast.show({
            type: 'error',
            text1: 'Sesión expirada',
            text2: 'Por favor inicia sesión nuevamente',
          });
          navigation.replace('Login');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudo cargar el perfil',
          });
        }
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
        `${ENV.API_URL}/users/${userId}`,
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Serás redirigido a nuestra página web para completar el proceso de eliminación de cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => Linking.openURL('https://recomiendameapp.cl/request-delete-account/'),
        },
      ]
    );
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
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Botón de salir arriba a la derecha */}
      <TouchableOpacity 
        onPress={handleLogout}
        style={{ 
          position: 'absolute', 
          top: 50, 
          right: 24, 
          zIndex: 10,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
      </TouchableOpacity>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con avatar y email */}
        <View style={{ 
          alignItems: 'center', 
          paddingTop: 60,
          paddingBottom: 32,
          paddingHorizontal: 24,
        }}>
          <View style={{
            position: 'relative',
            marginBottom: 20,
          }}>
            {/* Glow effect */}
            <View style={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#a855f7',
              opacity: 0.2,
              top: -10,
              left: -10,
            }} />
            <Avatar.Text 
              size={120} 
              label={user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '👤'} 
              style={{ 
                backgroundColor: '#a855f7',
                elevation: 8,
                shadowColor: '#a855f7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
              labelStyle={{ fontSize: 48, fontWeight: 'bold' }}
            />
          </View>
          <Text style={{ 
            color: '#fff', 
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 4,
          }}>
            {user?.name || 'Usuario'}
          </Text>
          <Text style={{ 
            color: '#9ca3af', 
            fontSize: 14,
          }}>
            {user?.email || ''}
          </Text>
        </View>

        {/* Información Personal */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ 
            color: '#fff', 
            fontSize: 20, 
            fontWeight: 'bold',
            marginBottom: 16,
          }}>
            Información Personal
          </Text>

          {/* Nombre completo */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
              NOMBRE COMPLETO
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Tu nombre completo"
              placeholderTextColor="#4b5563"
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: '#fff',
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
            />
          </View>

          {/* Fecha de nacimiento */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
              FECHA DE NACIMIENTO
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: '#27272a',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: birthDate ? '#fff' : '#4b5563', fontSize: 16 }}>
                {birthDate || 'Selecciona tu fecha de nacimiento'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#a855f7" />
            </TouchableOpacity>
          </View>

          {/* País */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
              PAÍS
            </Text>
            <CustomPicker
              label=""
              value={country}
              onChange={setCountry}
              options={countryOptions}
            />
          </View>

          {/* Idioma */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8, fontWeight: '600' }}>
              IDIOMA
            </Text>
            <CustomPicker
              label=""
              value={language}
              onChange={setLanguage}
              options={languageOptions}
            />
          </View>
        </View>

        {/* Géneros favoritos */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text style={{ 
            color: '#fff', 
            fontSize: 20, 
            fontWeight: 'bold',
            marginBottom: 16,
          }}>
            Géneros Favoritos
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 10,
          }}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: favoriteGenres.includes(genre) ? '#a855f7' : '#1a1a1a',
                  borderWidth: 1,
                  borderColor: favoriteGenres.includes(genre) ? '#a855f7' : '#27272a',
                }}
              >
                <Text style={{ 
                  color: favoriteGenres.includes(genre) ? '#fff' : '#9ca3af',
                  fontSize: 14,
                  fontWeight: favoriteGenres.includes(genre) ? '600' : '400',
                }}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón guardar */}
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: '#a855f7',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#a855f7',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ 
              color: '#fff', 
              fontSize: 16, 
              fontWeight: 'bold',
            }}>
              Guardar Cambios
            </Text>
          </TouchableOpacity>

          {/* Eliminar cuenta */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{
              marginTop: 16,
              paddingVertical: 14,
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            }}
          >
            <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '500' }}>
              Eliminar cuenta
            </Text>
          </TouchableOpacity>
        </View>

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
    </View>
  );
}
