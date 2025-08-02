import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  StyleSheet,
  Modal,
  Button,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate]             = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [tempDate, setTempDate]               = useState<Date>(birthDate);

  const [gender, setGender]     = useState<'M'|'F'|'O'|null>(null);
  const [country, setCountry]   = useState<string|null>(null);
  const [language, setLanguage] = useState<string|null>(null);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

  const genderRef   = useRef<RNPickerSelect>(null);
  const countryRef  = useRef<RNPickerSelect>(null);
  const languageRef = useRef<RNPickerSelect>(null);

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Fantasy', 'History', 'Horror',
    'Romance', 'Sci-Fi', 'Thriller',
  ];

  const handleRegister = async () => {
    if (password !== confirmPassword) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Las contraseñas no coinciden' });
        return;
    }
    if (!gender || !country || !language) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Completa todos los campos' });
        return;
    }
    try {
        await axios.post(`${API_URL}/users`, {
        fullName,
        email,
        password,
        birthDate: birthDate.toISOString().slice(0, 10),
        gender,
        country,
        language,
        favoriteGenres,
        });

        Toast.show({
        type: 'success',
        text1: '¡Registro exitoso!',
        text2: 'Revisa tu correo para activar tu cuenta',
        });
        setTimeout(() => navigation.replace('Login'), 1500);
    } catch (error: any) {
        // Si la API devolvió { message: 'Email already in use' }
        const msg =
        error.response?.data?.message ??
        // o si por alguna razón sigues usando detail
        error.response?.data?.detail ??
        'No se pudo completar el registro';

        Toast.show({
        type: 'error',
        text1: 'Error al registrar',
        text2: msg,
        });
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear cuenta</Text>

        {/* Nombre completo */}
        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor="#666"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />

        {/* Correo electrónico */}
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        {/* Contraseña */}
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {/* Confirmar contraseña */}
        <TextInput
          placeholder="Confirmar contraseña"
          placeholderTextColor="#666"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        {/* Fecha de nacimiento */}
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

        {/* Modal con spinner y botones */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                locale="es-Es"         // fuerza Y-M-D
                themeVariant="light"
                textColor="#000"
                onChange={(event: DateTimePickerEvent, selected?: Date) => {
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
                    setBirthDate(tempDate);
                    setShowDatePicker(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Género */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Género</Text>
          <TouchableOpacity
            style={styles.pickerTouchable}
            onPress={() => genderRef.current?.togglePicker()}
          >
            <Text style={gender ? styles.pickerValue : styles.pickerPlaceholder}>
              {gender
                ? { M: 'Masculino', F: 'Femenino', O: 'Otro' }[gender]
                : 'Selecciona género'}
            </Text>
          </TouchableOpacity>
          <RNPickerSelect
            pickerProps={{
                itemStyle: {
                color: '#000',
                }
            }}
            ref={genderRef}
            onValueChange={setGender}
            value={gender}
            items={[
              { label: 'Selecciona género', value: null },
              { label: 'Masculino', value: 'M' },
              { label: 'Femenino',  value: 'F' },
              { label: 'Otro',      value: 'O' },
            ]}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
            style={pickerHiddenStyles}
          />
        </View>

        {/* País */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>País</Text>
          <TouchableOpacity
            style={styles.pickerTouchable}
            onPress={() => countryRef.current?.togglePicker()}
          >
            <Text style={country ? styles.pickerValue : styles.pickerPlaceholder}>
              {country || 'Selecciona país'}
            </Text>
          </TouchableOpacity>
          <RNPickerSelect
            pickerProps={{
                itemStyle: {
                color: '#000',
                }
            }}
            ref={countryRef}
            onValueChange={setCountry}
            value={country}
            items={[
              { label: 'Selecciona país', value: null},  
              { label: 'Chile',     value: 'CL' },
              { label: 'México',    value: 'MX' },
              { label: 'Argentina', value: 'AR' },
              { label: 'España',    value: 'ES' },
            ]}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
            style={pickerHiddenStyles}
          />
        </View>

        {/* Idioma */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Idioma</Text>
          <TouchableOpacity
            style={styles.pickerTouchable}
            onPress={() => languageRef.current?.togglePicker()}
          >
            <Text style={language ? styles.pickerValue : styles.pickerPlaceholder}>
              {language || 'Selecciona idioma'}
            </Text>
          </TouchableOpacity>
          <RNPickerSelect
            pickerProps={{
                itemStyle: {
                color: '#000',
                }
            }}
            ref={languageRef}
            onValueChange={setLanguage}
            value={language}
            items={[
              { label: 'Selecciona idioma', value: null},
              { label: 'Español', value: 'es' },
              { label: 'Inglés',  value: 'en' },
            ]}
            placeholder={{}}
            useNativeAndroidPickerStyle={false}
            style={pickerHiddenStyles}
          />
        </View>

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

        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  scroll:           { padding: 24, paddingBottom: 80 },
  title:            { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input:            { backgroundColor: '#222', color: '#fff', borderRadius: 8, padding: 14, marginBottom: 16 },
  inputText:        { color: '#fff' },
  pickerWrapper:    { marginBottom: 16, zIndex: 1000 },
  pickerLabel:      { color: '#ccc', marginBottom: 4 },
  pickerTouchable:  { backgroundColor: '#222', borderRadius: 8, padding: 14 },
  pickerPlaceholder:{ color: '#888' },
  pickerValue:      { color: '#000' },
  button:           { backgroundColor: '#a855f7', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link:             { color: '#a855f7', textAlign: 'center' },

  modalBackdrop:   { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:    { margin: 24, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  modalButtons:    { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
});

const pickerHiddenStyles = {
  inputIOS:     { height: 0, opacity: 0 },
  inputAndroid: { height: 0, opacity: 0 },
};
