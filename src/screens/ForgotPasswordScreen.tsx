import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_URL } from '@env';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');

  const handleSendReset = async () => {
    try {
      await axios.post(`${API_URL}/auth/request-password-reset`, { email });
      Toast.show({
        type: 'success',
        text1: 'Enviado',
        text2: 'Revisa tu correo para reiniciar la contraseña'
      });
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'No se pudo enviar el correo'
      });
      
    }
  };

  return (
    <View className="flex-1 bg-zinc-950 px-6 justify-center">
      <Text className="text-white text-3xl font-semibold mb-8 text-center">
        Olvidé mi contraseña
      </Text>
      <View className="w-full bg-zinc-900 rounded-2xl p-6 space-y-4 shadow-lg">
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="bg-zinc-800 text-white rounded-xl px-4 py-3"
        />
        <TouchableOpacity
          onPress={handleSendReset}
          className="bg-purple-600 rounded-xl py-3 items-center"
        >
          <Text className="text-white font-bold text-base">
            Enviar enlace
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-2 items-center"
        >
          <Text className="text-purple-600">
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
}
