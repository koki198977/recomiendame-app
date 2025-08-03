import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_URL } from '@env';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    Keyboard.dismiss(); // Oculta el teclado
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const token    = response.data.access_token;

      await AsyncStorage.setItem('token', token);
      const meRes = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await AsyncStorage.setItem('userId', meRes.data.id);

      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error(error);
      const serverMessage = error.response?.data?.message;
      Toast.show({
        type: 'error',
        text1: 'Error de Autenticación',
        text2: serverMessage || 'Ocurrió un problema, intenta de nuevo',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#000' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 112, height: 112 }}
            resizeMode="contain"
          />
        </View>

        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '600', marginBottom: 32, textAlign: 'center' }}>
          Iniciar sesión
        </Text>

        <View style={{ backgroundColor: '#1f1f1f', borderRadius: 16, padding: 24 }}>
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: '#2a2a2a',
              color: '#fff',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          />

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: '#2a2a2a',
              color: '#fff',
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
            }}
          />

          <TouchableOpacity
            onPress={handleLogin}
            style={{
              backgroundColor: '#a855f7',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Entrar
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: '#a855f7', fontSize: 14 }}>Registrarme</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={{ color: '#a855f7', fontSize: 14 }}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
