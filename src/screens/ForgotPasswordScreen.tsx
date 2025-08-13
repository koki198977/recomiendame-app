import React, { useState } from 'react';
import {
  View,
  Keyboard,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card 
} from 'react-native-paper';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      await axios.post(`${ENV.API_URL}/auth/request-password-reset`, { email });
      Toast.show({
        type: 'success',
        text1: 'Enviado',
        text2: 'Revisa tu correo para reiniciar la contraseña',
      });
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.detail || 'No se pudo enviar el correo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#000', 
      paddingHorizontal: 24, 
      justifyContent: 'center' 
    }}>
      <Text 
        variant="headlineMedium" 
        style={{ 
          color: '#fff', 
          marginBottom: 32, 
          textAlign: 'center',
          fontWeight: '600'
        }}
      >
        Olvidé mi contraseña
      </Text>
      
      <Card style={{ backgroundColor: '#1f1f1f', borderRadius: 16 }}>
        <Card.Content style={{ padding: 24 }}>
          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
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
            onPress={handleSendReset}
            loading={loading}
            disabled={loading}
            style={{ borderRadius: 12, marginBottom: 16 }}
            contentStyle={{ paddingVertical: 8 }}
          >
            Enviar enlace
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={loading}
            textColor="#a855f7"
            compact
          >
            Volver al inicio de sesión
          </Button>
        </Card.Content>
      </Card>
      
      <Toast />
    </View>
  );
}
