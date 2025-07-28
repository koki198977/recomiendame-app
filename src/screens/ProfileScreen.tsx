import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    Alert.alert('Sesión cerrada');
    // @ts-ignore
    navigation.replace('Login');
  };

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <Text className="text-white text-2xl font-bold mb-4">👤 Perfil</Text>
      <Text className="text-white mb-8">Sesión iniciada</Text>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-600 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
