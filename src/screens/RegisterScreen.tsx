// src/screens/RegisterScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Button,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
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
  const defaultDate = new Date(2000, 0, 1);
  const [birthDate, setBirthDate]             = useState<Date>(defaultDate);
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [tempDate, setTempDate]               = useState<Date>(defaultDate);

  const [country, setCountry]   = useState<string|null>(null);
  const [language, setLanguage] = useState<string|null>(null);

  const handleCountryChange = (value: string) => {
    console.log('RegisterScreen: Country changed to:', value);
    setCountry(value);
  };

  const handleLanguageChange = (value: string) => {
    console.log('RegisterScreen: Language changed to:', value);
    setLanguage(value);
  };
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteMedia, setFavoriteMedia]   = useState('');

  const [loading, setLoading] = useState(false);

  const countryOptions = [
    { label: 'Chile', value: 'CL' },
    { label: 'México', value: 'MX' },
    { label: 'Argentina', value: 'AR' },
    { label: 'España', value: 'ES' },
    { label: 'Colombia', value: 'CO' },
    { label: 'Perú', value: 'PE' },
    { label: 'Venezuela', value: 'VE' },
    { label: 'Ecuador', value: 'EC' },
    { label: 'Bolivia', value: 'BO' },
    { label: 'Uruguay', value: 'UY' },
    { label: 'Paraguay', value: 'PY' },
    { label: 'Estados Unidos', value: 'US' },
    { label: 'Canadá', value: 'CA' },
  ];

  const languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'Inglés', value: 'en' },
    { label: 'Portugués', value: 'pt' },
    { label: 'Francés', value: 'fr' },
  ];

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

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Las contraseñas no coinciden' });
      return;
    }
    if (!country || !language) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Completa todos los campos' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/users`, {
        fullName,
        email,
        password,
        birthDate: birthDate.toISOString().slice(0, 10),
        country,
        language,
        favoriteGenres,
        favoriteMedia,
      });

      Toast.show({
        type: 'success',
        text1: '¡Registro exitoso!',
        text2: 'Revisa tu correo para activar tu cuenta',
      });
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ??
        error.response?.data?.detail ??
        'No se pudo completar el registro';
      Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter((g) => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Crear cuenta</Text>

          <TextInput
            placeholder="Nombre completo"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />

          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#666"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TextInput
            placeholder="Confirmar contraseña"
            placeholderTextColor="#666"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() => {
              setTempDate(birthDate);
              setShowDatePicker(true);
            }}
            style={styles.input}
            activeOpacity={0.8}
          >
            <Text style={styles.inputText}>
              Fecha de nacimiento: {birthDate.toISOString().slice(0, 10)}
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
                  onChange={(_: DateTimePickerEvent, selected?: Date) => {
                    if (selected) setTempDate(selected);
                  }}
                  style={{ backgroundColor: '#fff' }}
                />
                <View style={styles.modalButtons}>
                  <Button title="Cancelar" onPress={() => setShowDatePicker(false)} />
                  <Button
                    title="Aceptar"
                    onPress={() => {
                      setBirthDate(tempDate);
                      setShowDatePicker(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>

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

          <Text style={styles.sectionLabel}>Géneros favoritos</Text>
          <View style={styles.genresContainer}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={[
                  styles.genreButton,
                  favoriteGenres.includes(genre)
                    ? styles.genreSelected
                    : styles.genreUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.genreText,
                    favoriteGenres.includes(genre)
                      ? styles.genreTextSelected
                      : styles.genreTextUnselected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Tus películas o series favoritas</Text>
          <TextInput
            placeholder="Escribe algo sobre tus gustos..."
            placeholderTextColor="#888"
            value={favoriteMedia}
            onChangeText={setFavoriteMedia}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registrando...' : 'Registrarme'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </ScrollView>
        <Toast />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  scroll:           { padding: 24, paddingBottom: 80 },
  title:            { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input:            { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 14, marginBottom: 16 },
  textarea:         { height: 100, textAlignVertical: 'top' },
  inputText:        { color: '#fff' },

  sectionLabel:     { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  genresContainer:  { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  genreButton:      { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, margin: 4 },
  genreSelected:    { backgroundColor: '#a855f7', borderColor: '#9333ea' },
  genreUnselected:  { backgroundColor: '#333', borderColor: '#555' },
  genreText:        { fontSize: 14 },
  genreTextSelected:{ color: '#000' },
  genreTextUnselected:{ color: '#fff' },
  button:           { backgroundColor: '#a855f7', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:             { color: '#a855f7', textAlign: 'center', marginTop: 12 },

  modalBackdrop:   { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:    { margin: 24, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  modalButtons:    { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
});
