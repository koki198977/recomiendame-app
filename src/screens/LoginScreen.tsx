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
import { LinearGradient } from 'expo-linear-gradient';
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
      <LinearGradient
        colors={['#0A0A14', '#16083A', '#0A0A14']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo y título */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>
            Accede y sincroniza tus recomendaciones en todos tus dispositivos.
          </Text>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? '#A855F7' : theme.colors.textTertiary} style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tucorreo@email.com"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
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
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? '#A855F7' : theme.colors.textTertiary} style={styles.inputIcon} />
              <RNTextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
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
            <Text style={styles.registerText}>¿Aún no tienes cuenta? <Text style={{ color: '#C084FC', fontWeight: '700' }}>Regístrate</Text></Text>
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
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    backgroundColor: 'rgba(20,20,35,0.85)',
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: theme.spacing.md,
  },
  inputWrapperFocused: {
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168,85,247,0.06)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  showPassword: {
    fontSize: theme.fontSize.sm,
    color: '#A855F7',
    fontWeight: '600',
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
    color: theme.colors.textSecondary,
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
    color: theme.colors.textTertiary,
    fontWeight: '400',
  },
});
