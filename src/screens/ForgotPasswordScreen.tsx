import React, { useState } from 'react';
import {
  View, Keyboard, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, TouchableOpacity, TextInput, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { ENV } from '../config/env';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { ModernButton } from '../components/ModernButton';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Campo requerido', text2: 'Ingresa tu correo electrónico' });
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      await axios.post(`${ENV.API_URL}/auth/request-password-reset`, { email });
      setSent(true);
      Toast.show({ type: 'success', text1: '✅ Enlace enviado', text2: 'Revisa tu correo' });
      setTimeout(() => navigation.goBack(), 2500);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'No se pudo enviar el correo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#0A0A14', '#16083A', '#0A0A14']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Hero */}
        <LinearGradient colors={['#1A0A40', '#0E0828', '#0A0A14']} style={styles.hero}>
          <View style={styles.iconCircle}>
            <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.iconCircleGradient}>
              <Ionicons name="lock-open-outline" size={36} color="#fff" />
            </LinearGradient>
            <View style={styles.iconRing} />
          </View>
          <Text style={styles.heroTitle}>Recupera tu acceso</Text>
          <Text style={styles.heroSub}>
            Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer la contraseña.
          </Text>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          {sent ? (
            <View style={styles.sentBox}>
              <View style={styles.sentIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.sentTitle}>¡Correo enviado!</Text>
              <Text style={styles.sentSub}>Revisa tu bandeja de entrada y sigue las instrucciones del enlace.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
              <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
                <Ionicons name="mail-outline" size={17} color={focused ? '#A855F7' : theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tucorreo@email.com"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <View style={{ marginTop: 20 }}>
                <ModernButton title="Enviar enlace" onPress={handleSendReset} loading={loading} disabled={loading} variant="primary" size="large" fullWidth />
              </View>

              <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} disabled={loading}>
                <Ionicons name="arrow-back" size={14} color={theme.colors.textTertiary} />
                <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, paddingBottom: 60 },
  backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 28 },
  iconCircle: { marginBottom: 20, position: 'relative' },
  iconCircleGradient: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 22, elevation: 16 },
  iconRing: { position: 'absolute', top: -5, left: -5, width: 98, height: 98, borderRadius: 49,
    borderWidth: 2, borderColor: 'rgba(168,85,247,0.3)' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  heroSub: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#14141F', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  fieldLabel: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, minHeight: 52 },
  inputWrapperFocused: { borderColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.06)',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, paddingVertical: 14 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 20 },
  backLinkText: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  sentBox: { alignItems: 'center', paddingVertical: 12 },
  sentIcon: { marginBottom: 16 },
  sentTitle: { fontSize: 22, fontWeight: '800', color: '#10B981', marginBottom: 10 },
  sentSub: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
