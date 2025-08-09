// src/screens/RegisterScreen.tsx

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  Button,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button as PaperButton, 
  Card, 
  Chip,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';
import CustomPicker from '../components/CustomPicker';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate]             = useState('');
  const [country, setCountry]                 = useState<string|null>(null);
  const [language, setLanguage]               = useState<string|null>(null);
  const [favoriteGenres, setFavoriteGenres]   = useState<string[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado del date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const genres = [
    'Acción', 'Aventura', 'Animación', 'Comedia', 'Crimen',
    'Documental', 'Drama', 'Fantasía', 'Historia', 'Terror',
    'Romance', 'Ciencia ficción', 'Suspenso'
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

  const handleCountryChange = (value: string) => {
    console.log('RegisterScreen: Country changed to:', value);
    setCountry(value);
  };

  const handleLanguageChange = (value: string) => {
    console.log('RegisterScreen: Language changed to:', value);
    setLanguage(value);
  };

  const toggleGenre = (genre: string) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter((g) => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: 'Por favor completa todos los campos obligatorios',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users`, {
        fullName,
        email,
        password,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        country,
        language,
        favoriteGenres,
      });

      Toast.show({
        type: 'success',
        text1: '✅ Registro exitoso',
        text2: 'Tu cuenta ha sido creada correctamente',
      });

      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const serverMessage = error.response?.data?.message;
      Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: serverMessage || 'Ocurrió un problema, intenta de nuevo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineMedium" style={{ color: '#fff', marginBottom: 32, textAlign: 'center', fontWeight: '600' }}>
          Crear cuenta
        </Text>

        <Card style={{ backgroundColor: '#1f1f1f', borderRadius: 16 }}>
          <Card.Content style={{ padding: 24 }}>
            <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 16 }}>
              Información Personal
            </Text>

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

            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 16 }}
              theme={{ 
                colors: { 
                  onSurfaceVariant: '#aaa',
                  outline: '#444'
                } 
              }}
            />

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={{ marginBottom: 16 }}
              theme={{ 
                colors: { 
                  onSurfaceVariant: '#aaa',
                  outline: '#444'
                } 
              }}
            />

            <TextInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={{ marginBottom: 16 }}
              theme={{ 
                colors: { 
                  onSurfaceVariant: '#aaa',
                  outline: '#444'
                } 
              }}
            />

            <PaperButton
              mode="outlined"
              onPress={() => {
                setTempDate(birthDate ? new Date(birthDate) : new Date());
                setShowDatePicker(true);
              }}
              style={{ marginBottom: 16 }}
              theme={{ 
                colors: { 
                  outline: '#444'
                } 
              }}
            >
              {birthDate || 'Fecha de nacimiento (opcional)'}
            </PaperButton>

            <CustomPicker
              label="País"
              value={country}
              options={countryOptions}
              onChange={handleCountryChange}
            />

            <CustomPicker
              label="Idioma"
              value={language}
              options={languageOptions}
              onChange={handleLanguageChange}
            />

            <Divider style={{ marginVertical: 16, backgroundColor: '#333' }} />

            <Text variant="titleMedium" style={{ color: '#fff', marginBottom: 16 }}>
              Géneros favoritos
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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

            <PaperButton
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
              icon="account-plus"
            >
              Registrarme
            </PaperButton>

            <Divider style={{ marginVertical: 16, backgroundColor: '#333' }} />

            <PaperButton
              mode="text"
              onPress={() => navigation.navigate('Login')}
              textColor="#a855f7"
              compact
            >
              ¿Ya tienes cuenta? Inicia sesión
            </PaperButton>
          </Card.Content>
        </Card>

        {/* Dialog para fecha de nacimiento */}
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

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
});
