import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const token = response.data.access_token;
      await AsyncStorage.setItem('token', token);
      const meRes = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await AsyncStorage.setItem('userId', meRes.data.id);
      navigation.replace('MainTabs');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <View className="flex-1 bg-zinc-950 px-6 justify-center items-center">
      <Image
        source={require('../../assets/logo.png')} // ajusta la ruta si es necesario
        className="w-28 h-28 mb-8"
        resizeMode="contain"
      />

      <Text className="text-white text-3xl font-semibold mb-8">
        Iniciar sesión
      </Text>

      <View className="w-full bg-zinc-900 rounded-2xl p-6 space-y-4 shadow-lg">
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          className="bg-zinc-800 text-white rounded-xl px-4 py-3"
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="bg-zinc-800 text-white rounded-xl px-4 py-3"
        />

        <TouchableOpacity
          onPress={handleLogin}
          className="bg-purple-600 rounded-xl py-3 items-center"
        >
          <Text className="text-white font-bold text-base">Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
