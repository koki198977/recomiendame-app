import React, { useState } from 'react';
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { ModernButton } from '../components/ModernButton';

export default function LoginScreen({ navigation, onContinueAsGuest }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const response = await axios.post(`${ENV.API_URL}/auth/login`, { email, password });
      const token = response.data.access_token;

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo y título */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Accede a Recomiéndame y sincroniza tus recomendaciones en todos tus dispositivos.
          </Text>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <RNTextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@email.com"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showPassword}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <RNTextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Botón de login */}
          <ModernButton
            title="Ingresar"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="large"
            fullWidth={true}
          />

          {/* Links */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.register}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>¿Aún no tienes cuenta? Regístrate</Text>
          </TouchableOpacity>

          {onContinueAsGuest && (
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={onContinueAsGuest}
            >
              <Text style={styles.guestText}>Continuar sin cuenta</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    ...theme.shadows.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  showPassword: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: theme.spacing.xxl,
  },
  forgotPassword: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  register: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  registerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  guestButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  guestText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
});
