// src/screens/RegisterScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, Modal, KeyboardAvoidingView,
  Platform, Image, TouchableOpacity, ActivityIndicator, Text, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import CustomPicker from '../components/CustomPicker';
import { theme } from '../styles/theme';

interface SearchResult {
  id: number; title: string; posterUrl: string;
  releaseDate: string; mediaType: 'movie' | 'tv';
}
interface FavoritePick {
  tmdbId: number; title: string; mediaType: 'movie' | 'tv'; posterUrl: string;
}

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightIcon, onRightIconPress }: any) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={17} color={theme.colors.textTertiary} style={styles.inputIcon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={rightIcon} size={17} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [picksModalVisible, setPicksModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [picks, setPicks] = useState<FavoritePick[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countryOptions = [
    { label: 'Chile', value: 'CL' }, { label: 'Argentina', value: 'AR' },
    { label: 'Perú', value: 'PE' }, { label: 'México', value: 'MX' },
    { label: 'Colombia', value: 'CO' }, { label: 'España', value: 'ES' },
    { label: 'Estados Unidos', value: 'US' }, { label: 'Brasil', value: 'BR' },
    { label: 'Uruguay', value: 'UY' }, { label: 'Paraguay', value: 'PY' },
  ];

  const performSearch = async (query: string) => {
    setSearching(true); setSearchError(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${ENV.API_URL}/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSearchResults(res.data.results || []);
    } catch { setSearchError(true); }
    finally { setSearching(false); }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => performSearch(text), 500);
  };

  const togglePick = (item: SearchResult) => {
    const already = picks.some(p => p.tmdbId === item.id);
    if (already) { setPicks(p => p.filter(x => x.tmdbId !== item.id)); return; }
    if (picks.length >= 7) return;
    setPicks(p => [...p, { tmdbId: item.id, title: item.title, mediaType: item.mediaType, posterUrl: item.posterUrl }]);
  };

  const closeModal = () => {
    setPicksModalVisible(false); setSearchQuery(''); setSearchResults([]); setSearchError(false);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Completa todos los campos obligatorios' }); return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Contraseñas distintas', text2: 'Las contraseñas no coinciden' }); return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Contraseña muy corta', text2: 'Mínimo 6 caracteres' }); return;
    }
    if (picks.length < 3) {
      Toast.show({ type: 'error', text1: 'Faltan favoritos', text2: 'Selecciona al menos 3 películas o series' }); return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${ENV.API_URL}/users`, {
        fullName, email, password, country,
        picks: picks.map(({ tmdbId, title, mediaType }) => ({ tmdbId, title, mediaType })),
      });
      const token = response.data?.token || response.data?.access_token;
      if (token) await AsyncStorage.setItem('token', token);
      Toast.show({ type: 'info', text1: '¡Cuenta creada!', text2: 'Revisa tu correo y confirma tu cuenta.', visibilityTime: 5000 });
      navigation.replace('Login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error al registrar', text2: error.response?.data?.message || 'Ocurrió un problema' });
    } finally { setLoading(false); }
  };

  const canRegister = picks.length >= 3 && !loading;
  const atLimit = picks.length === 7;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#0A0A14', '#16083A', '#0A0A14']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={['#1A0A40', '#0E0828', '#0A0A14']} style={styles.hero}>
          <View style={styles.logoWrapper}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
          </View>
          <Text style={styles.heroTitle}>Crear cuenta</Text>
          <Text style={styles.heroSub}>Únete y descubre tu próxima película favorita</Text>
        </LinearGradient>

        {/* Card datos personales */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos Personales</Text>

          <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
          <InputField icon="person-outline" placeholder="Tu nombre completo" value={fullName} onChangeText={setFullName} />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CORREO ELECTRÓNICO</Text>
          <InputField icon="mail-outline" placeholder="tucorreo@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CONTRASEÑA</Text>
          <InputField icon="lock-closed-outline" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword}
            secureTextEntry={!showPassword} autoCapitalize="none"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'} onRightIconPress={() => setShowPassword(v => !v)} />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CONFIRMAR CONTRASEÑA</Text>
          <InputField icon="lock-closed-outline" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPass} autoCapitalize="none"
            rightIcon={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} onRightIconPress={() => setShowConfirmPass(v => !v)} />
        </View>

        {/* Card preferencias */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias <Text style={styles.optionalTag}>(opcional)</Text></Text>
          <Text style={styles.fieldLabel}>PAÍS</Text>
          <View style={styles.pickerWrapper}>
            <CustomPicker label="" value={country} options={countryOptions} onChange={setCountry} />
          </View>
        </View>

        {/* Card favoritos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Tus Favoritos{' '}
            <Text style={picks.length >= 3 ? styles.countGreen : styles.countMuted}>
              {picks.length}/7
            </Text>
          </Text>
          <Text style={styles.fieldLabel}>SELECCIONA AL MENOS 3 PELÍCULAS O SERIES</Text>

          <TouchableOpacity style={styles.favCard} onPress={() => setPicksModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.favCardLeft}>
              <View style={styles.favIconWrap}>
                <Ionicons name="film" size={20} color={theme.colors.primaryGlow} />
              </View>
              <View>
                <Text style={styles.favCardTitle}>
                  {picks.length === 0 ? 'Elige tus favoritos' : `${picks.length} seleccionado${picks.length > 1 ? 's' : ''}`}
                </Text>
                <Text style={styles.favCardSub}>
                  {picks.length < 3 ? `Faltan ${3 - picks.length} para continuar` : picks.length < 7 ? 'Puedes agregar más' : 'Límite alcanzado'}
                </Text>
              </View>
            </View>
            {picks.length >= 3
              ? <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              : <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />}
          </TouchableOpacity>

          {picks.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posterStrip}>
              {picks.map(pick => (
                <TouchableOpacity key={pick.tmdbId} onPress={() => setPicks(p => p.filter(x => x.tmdbId !== pick.tmdbId))} style={styles.posterThumb}>
                  {pick.posterUrl
                    ? <Image source={{ uri: pick.posterUrl }} style={styles.posterThumbImg} resizeMode="cover" />
                    : <View style={[styles.posterThumbImg, styles.posterPlaceholder]}><Ionicons name="film-outline" size={16} color={theme.colors.textTertiary} /></View>}
                  <View style={styles.posterRemoveBadge}>
                    <Ionicons name="close" size={10} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Botón registrar */}
        <View style={{ marginHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity onPress={handleRegister} disabled={!canRegister} activeOpacity={0.85}>
            <LinearGradient
              colors={canRegister ? ['#7C3AED', '#A855F7'] : ['#2A1A3E', '#2A1A3E']}
              style={styles.registerBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.registerBtnText}>Registrarme</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? </Text>
            <Text style={[styles.loginLinkText, { color: '#C084FC', fontWeight: '700' }]}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </ScrollView>

      {/* Modal favoritos */}
      <Modal visible={picksModalVisible} animationType="fade" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Tus favoritos</Text>
                  <Text style={styles.modalSub}>{picks.length}/7 · mínimo 3</Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Searchbar
                placeholder="Busca películas o series..."
                onChangeText={handleSearchChange}
                value={searchQuery}
                style={styles.searchbar}
                iconColor={theme.colors.textTertiary}
                inputStyle={{ color: theme.colors.text, fontSize: 14 }}
                placeholderTextColor={theme.colors.textTertiary}
              />

              {searching && <ActivityIndicator size="small" color={theme.colors.primaryGlow} style={{ marginVertical: 10 }} />}

              {atLimit && (
                <View style={styles.limitBanner}>
                  <Ionicons name="information-circle-outline" size={14} color="#F59E0B" />
                  <Text style={styles.limitBannerText}>Máximo 7 selecciones alcanzado</Text>
                </View>
              )}
              {searchError && (
                <View style={styles.errorRow}>
                  <Text style={styles.errorText}>Error al buscar.</Text>
                  <TouchableOpacity onPress={() => performSearch(searchQuery)}>
                    <Text style={styles.retryText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!searching && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
                <Text style={styles.emptyText}>Sin resultados para "{searchQuery}"</Text>
              )}
              {!searching && searchQuery.length < 2 && (
                <Text style={styles.emptyText}>Escribe al menos 2 caracteres para buscar</Text>
              )}

              <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {searchResults.map(item => {
                  const isSelected = picks.some(p => p.tmdbId === item.id);
                  const isDisabled = atLimit && !isSelected;
                  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.resultRow, isSelected && styles.resultRowSelected, isDisabled && { opacity: 0.35 }]}
                      onPress={() => togglePick(item)} disabled={isDisabled} activeOpacity={0.75}
                    >
                      <View style={styles.resultPosterWrap}>
                        {item.posterUrl
                          ? <Image source={{ uri: item.posterUrl }} style={styles.resultPoster} resizeMode="cover" />
                          : <View style={[styles.resultPoster, styles.posterPlaceholder]}><Ionicons name="film-outline" size={20} color={theme.colors.textTertiary} /></View>}
                        {isSelected && (
                          <View style={styles.resultOverlay}>
                            <Ionicons name="checkmark-circle" size={26} color={theme.colors.primaryGlow} />
                          </View>
                        )}
                      </View>
                      <View style={styles.resultMeta}>
                        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.resultTags}>
                          {year ? <Text style={styles.resultYear}>{year}</Text> : null}
                          <View style={[styles.typeBadge, item.mediaType === 'tv' && styles.typeBadgeTv]}>
                            <Text style={styles.typeBadgeText}>{item.mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}</Text>
                          </View>
                        </View>
                      </View>
                      {isSelected && <Ionicons name="checkmark" size={18} color={theme.colors.primaryGlow} style={{ marginRight: 12 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.doneBtn, picks.length < 3 && styles.doneBtnDisabled]}
                onPress={closeModal} disabled={picks.length < 3} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={picks.length >= 3 ? ['#7C3AED', '#A855F7'] : ['#2A1A3E', '#2A1A3E']}
                  style={styles.doneBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.doneBtnText}>
                    {picks.length < 3 ? `Selecciona ${3 - picks.length} más` : `Listo · ${picks.length} elegidos`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, paddingBottom: 60 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 36, paddingHorizontal: 24 },
  logoWrapper: { width: 88, height: 88, borderRadius: 22, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 20, elevation: 14 },
  logo: { width: 88, height: 88, borderRadius: 22 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'center' },

  // Card
  card: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#14141F', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  cardTitle: { fontSize: theme.fontSize.md, fontWeight: '800', color: theme.colors.text, marginBottom: 16, letterSpacing: -0.2 },
  optionalTag: { fontSize: 12, fontWeight: '400', color: theme.colors.textTertiary },
  countGreen: { color: '#10B981', fontSize: 14 },
  countMuted: { color: theme.colors.textTertiary, fontSize: 14 },

  // Fields
  fieldLabel: { fontSize: 10, color: theme.colors.textTertiary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, minHeight: 50, marginBottom: 0 },
  inputIcon: { marginRight: 10, flexShrink: 0 },
  textInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.text, paddingVertical: 14 },
  pickerWrapper: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  // Favorites card
  favCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', marginBottom: 0 },
  favCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(168,85,247,0.15)', justifyContent: 'center', alignItems: 'center' },
  favCardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  favCardSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  posterStrip: { marginTop: 14 },
  posterThumb: { marginRight: 8, position: 'relative' },
  posterThumbImg: { width: 52, height: 78, borderRadius: 8, overflow: 'hidden' },
  posterPlaceholder: { backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  posterRemoveBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },

  // Register button
  registerBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginLinkText: { color: theme.colors.textSecondary, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#14141F', borderRadius: 24, width: '100%', maxHeight: '85%',
    padding: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.15)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  modalSub: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center' },
  searchbar: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 10, elevation: 0,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  limitBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  limitBannerText: { color: '#F59E0B', fontSize: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginVertical: 8 },
  errorText: { color: '#F87171', fontSize: 13 },
  retryText: { color: theme.colors.primaryGlow, fontSize: 13, fontWeight: '600' },
  emptyText: { color: theme.colors.textTertiary, fontSize: 13, textAlign: 'center', marginVertical: 16 },
  resultsList: { maxHeight: 380 },
  resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  resultRowSelected: { borderColor: 'rgba(168,85,247,0.4)', backgroundColor: 'rgba(124,58,237,0.12)' },
  resultPosterWrap: { position: 'relative' },
  resultPoster: { width: 56, height: 84 },
  resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  resultMeta: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  resultTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  resultTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultYear: { color: theme.colors.textSecondary, fontSize: 12 },
  typeBadge: { backgroundColor: 'rgba(168,85,247,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  typeBadgeTv: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' },
  typeBadgeText: { color: theme.colors.primaryGlow, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  doneBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  doneBtnDisabled: { opacity: 0.6 },
  doneBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
