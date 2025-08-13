import React, { useState } from 'react';
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Divider 
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const response = await axios.post(`${ENV.API_URL}/auth/login`, { email, password });
      const token    = response.data.access_token;

      await AsyncStorage.setItem('token', token);
      const meRes = await axios.get(`${ENV.API_URL}/users/me`, {
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
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'center', 
          paddingHorizontal: 24, 
          backgroundColor: '#000' 
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 112, height: 112 }}
            resizeMode="contain"
          />
        </View>

        <Text 
          variant="headlineMedium" 
          style={{ 
            color: '#fff', 
            marginBottom: 32, 
            textAlign: 'center',
            fontWeight: '600'
          }}
        >
          Iniciar sesión
        </Text>

        <Card style={{ backgroundColor: '#1f1f1f', borderRadius: 16 }}>
          <Card.Content style={{ padding: 24 }}>
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
              style={{ marginBottom: 24 }}
              theme={{ 
                colors: { 
                  onSurfaceVariant: '#aaa',
                  outline: '#444'
                } 
              }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              Entrar
            </Button>

            <Divider style={{ marginVertical: 16, backgroundColor: '#333' }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                textColor="#a855f7"
                compact
              >
                Registrarme
              </Button>
              <Button
                mode="text"
                onPress={() => navigation.navigate('ForgotPassword')}
                textColor="#a855f7"
                compact
              >
                Olvidé mi contraseña
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
