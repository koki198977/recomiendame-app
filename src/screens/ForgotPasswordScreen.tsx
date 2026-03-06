import React, { useState } from 'react';
import {
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { ModernButton } from '../components/ModernButton';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Campo requerido',
        text2: 'Por favor ingresa tu correo electrónico',
      });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      await axios.post(`${ENV.API_URL}/auth/request-password-reset`, { email });
      Toast.show({
        type: 'success',
        text1: '✅ Enlace enviado',
        text2: 'Revisa tu correo para restablecer la contraseña',
      });
      setTimeout(() => navigation.goBack(), 2000);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'No se pudo enviar el correo',
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
          <Text style={styles.title}>Recupera tu acceso</Text>
          <Text style={styles.subtitle}>
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer la contraseña.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
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

          <ModernButton
            title="Enviar enlace"
            onPress={handleSendReset}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="large"
            fullWidth={true}
          />

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>
              ¿Recordaste tu contraseña? Volver al login
            </Text>
          </TouchableOpacity>
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
    width: 120,
    height: 120,
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
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  backButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
