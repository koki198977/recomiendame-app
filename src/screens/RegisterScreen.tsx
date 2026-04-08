// src/screens/RegisterScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Button as PaperButton, Card, Divider, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ENV } from '../config/env';
import CustomPicker from '../components/CustomPicker';

interface SearchResult {
  id: number;
  title: string;
  posterUrl: string;
  releaseDate: string;
  mediaType: 'movie' | 'tv';
}

interface FavoritePick {
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  posterUrl: string;
}

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry]                 = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [picksModalVisible, setPicksModalVisible] = useState(false);
  const [searchQuery, setSearchQuery]             = useState('');
  const [searchResults, setSearchResults]         = useState<SearchResult[]>([]);
  const [searching, setSearching]                 = useState(false);
  const [searchError, setSearchError]             = useState(false);
  const [picks, setPicks]                         = useState<FavoritePick[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countryOptions = [
    { label: 'Chile', value: 'CL' }, { label: 'Argentina', value: 'AR' },
    { label: 'Perú', value: 'PE' }, { label: 'México', value: 'MX' },
    { label: 'Colombia', value: 'CO' }, { label: 'España', value: 'ES' },
    { label: 'Estados Unidos', value: 'US' }, { label: 'Brasil', value: 'BR' },
    { label: 'Uruguay', value: 'UY' }, { label: 'Paraguay', value: 'PY' },
  ];

  const performSearch = async (query: string) => {
    setSearching(true);
    setSearchError(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(
        `${ENV.API_URL}/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data.results || []);
    } catch {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(() => performSearch(text), 500);
  };

  const togglePick = (item: SearchResult) => {
    const alreadySelected = picks.some(p => p.tmdbId === item.id);
    if (alreadySelected) {
      setPicks(prev => prev.filter(p => p.tmdbId !== item.id));
    } else {
      if (picks.length >= 7) return;
      setPicks(prev => [...prev, {
        tmdbId: item.id, title: item.title,
        mediaType: item.mediaType, posterUrl: item.posterUrl,
      }]);
    }
  };

  const atLimit = picks.length === 7;

  const closePicksModal = () => {
    setPicksModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(false);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Campos incompletos', text2: 'Completa todos los campos obligatorios' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Contraseñas distintas', text2: 'Las contraseñas no coinciden' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Contraseña muy corta', text2: 'Mínimo 6 caracteres' });
      return;
    }
    if (picks.length < 3) {
      Toast.show({ type: 'error', text1: 'Faltan favoritos', text2: 'Selecciona al menos 3 películas o series' });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${ENV.API_URL}/users`, {
        fullName, email, password, country,
        picks: picks.map(({ tmdbId, title, mediaType }) => ({ tmdbId, title, mediaType })),
      });
      const token = response.data?.token || response.data?.access_token;
      if (token) await AsyncStorage.setItem('token', token);

      Toast.show({
        type: 'info',
        text1: '¡Cuenta creada!',
        text2: 'Revisa tu correo y confirma tu cuenta para iniciar sesión.',
        visibilityTime: 5000,
      });
      navigation.replace('Login');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      Toast.show({ type: 'error', text1: 'Error al registrar', text2: msg || 'Ocurrió un problema, intenta de nuevo' });
    } finally {
      setLoading(false);
    }
  };

  const canRegister = picks.length >= 3 && !loading;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.headerBlock}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.chapiImg}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Crear cuenta</Text>
          <Text style={styles.headerSub}>Únete y descubre tu próxima película favorita</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
          <TextInput label="Nombre completo" value={fullName} onChangeText={setFullName}
            mode="outlined" style={styles.input}
            theme={{ colors: { onSurfaceVariant: '#888', outline: '#2a2a2a', primary: '#a855f7', onSurface: '#fff' } }} />
          <TextInput label="Correo electrónico" value={email} onChangeText={setEmail}
            mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input}
            theme={{ colors: { onSurfaceVariant: '#888', outline: '#2a2a2a', primary: '#a855f7', onSurface: '#fff' } }} />
          <View style={styles.passwordRow}>
            <TextInput label="Contraseña" value={password} onChangeText={setPassword}
              mode="outlined" secureTextEntry={!showPassword}
              right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} color="#666" />}
              style={[styles.input, styles.passwordInput]}
              theme={{ colors: { onSurfaceVariant: '#888', outline: '#2a2a2a', primary: '#a855f7', onSurface: '#fff' } }} />
            <TextInput label="Confirmar" value={confirmPassword} onChangeText={setConfirmPassword}
              mode="outlined" secureTextEntry={!showConfirmPassword}
              right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(v => !v)} color="#666" />}
              style={[styles.input, styles.passwordInput]}
              theme={{ colors: { onSurfaceVariant: '#888', outline: '#2a2a2a', primary: '#a855f7', onSurface: '#fff' } }} />
          </View>        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCIAS (OPCIONAL)</Text>
          <CustomPicker label="País" value={country} options={countryOptions} onChange={setCountry} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TUS FAVORITOS</Text>
          <TouchableOpacity style={styles.favCard} onPress={() => setPicksModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.favCardLeft}>
              <View style={styles.favIconWrap}>
                <Ionicons name="film" size={22} color="#a855f7" />
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
              ? <Ionicons name="checkmark-circle" size={22} color="#10b981" />
              : <Ionicons name="chevron-forward" size={20} color="#555" />}
          </TouchableOpacity>

          {picks.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posterStrip}>
              {picks.map(pick => (
                <TouchableOpacity key={pick.tmdbId}
                  onPress={() => setPicks(prev => prev.filter(p => p.tmdbId !== pick.tmdbId))}
                  style={styles.posterThumb}>
                  {pick.posterUrl
                    ? <Image source={{ uri: pick.posterUrl }} style={styles.posterThumbImg} resizeMode="cover" />
                    : <View style={[styles.posterThumbImg, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="film-outline" size={16} color="#555" />
                      </View>}
                  <View style={styles.posterThumbRemove}>
                    <Ionicons name="close" size={10} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.registerBtn, !canRegister && styles.registerBtnDisabled]}
            onPress={handleRegister} disabled={!canRegister} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.registerBtnText}>Registrarme</Text>
                </>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? </Text>
            <Text style={[styles.loginLinkText, { color: '#a855f7', fontWeight: '600' }]}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </ScrollView>

      <Modal visible={picksModalVisible} animationType="fade" transparent onRequestClose={closePicksModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tus favoritos</Text>
                <Text style={styles.modalSub}>{picks.length}/7 · mínimo 3</Text>
              </View>
              <TouchableOpacity onPress={closePicksModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#aaa" />
              </TouchableOpacity>
            </View>

            <Searchbar
              placeholder="Busca películas o series..."
              onChangeText={handleSearchChange}
              value={searchQuery}
              style={styles.searchbar}
              iconColor="#555"
              inputStyle={{ color: '#fff', fontSize: 14 }}
              placeholderTextColor="#555"
            />

            {searching && <ActivityIndicator size="small" color="#a855f7" style={{ marginVertical: 10 }} />}

            {atLimit && (
              <View style={styles.limitBanner}>
                <Ionicons name="information-circle-outline" size={14} color="#f59e0b" />
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
              <Text style={styles.emptyText}>Escribe al menos 2 caracteres</Text>
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
                    onPress={() => togglePick(item)} disabled={isDisabled} activeOpacity={0.75}>
                    <View style={styles.resultPosterWrap}>
                      {item.posterUrl
                        ? <Image source={{ uri: item.posterUrl }} style={styles.resultPoster} resizeMode="cover" />
                        : <View style={[styles.resultPoster, { backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="film-outline" size={20} color="#555" />
                          </View>}
                      {isSelected && (
                        <View style={styles.resultOverlay}>
                          <Ionicons name="checkmark-circle" size={26} color="#a855f7" />
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
                    {isSelected && <Ionicons name="checkmark" size={18} color="#a855f7" style={{ marginRight: 12 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.doneBtn, picks.length < 3 && styles.doneBtnDisabled]}
              onPress={closePicksModal} disabled={picks.length < 3} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>
                {picks.length < 3 ? `Selecciona ${3 - picks.length} más` : `Listo · ${picks.length} elegidos`}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  headerBlock: { marginBottom: 32, alignItems: 'center' },
  chapiImg: { width: 100, height: 100, marginBottom: 12 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#666', marginTop: 6 },

  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#555', letterSpacing: 1.2, marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#161616' },
  passwordRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  passwordInput: { flex: 1, marginBottom: 12 },

  favCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#161616', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  favCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  favCardTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  favCardSub: { color: '#666', fontSize: 12, marginTop: 2 },

  posterStrip: { marginTop: 12 },
  posterThumb: { marginRight: 8, position: 'relative' },
  posterThumbImg: { width: 48, height: 72, borderRadius: 6 },
  posterThumbRemove: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center',
  },

  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#a855f7', borderRadius: 14, paddingVertical: 16,
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  registerBtnDisabled: { backgroundColor: '#2a1a3e', shadowOpacity: 0 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginLinkText: { color: '#555', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSub: { color: '#666', fontSize: 13, marginTop: 2 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#222', justifyContent: 'center', alignItems: 'center',
  },
  searchbar: { backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 10, elevation: 0 },

  limitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  limitBannerText: { color: '#f59e0b', fontSize: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginVertical: 8 },
  errorText: { color: '#f87171', fontSize: 13 },
  retryText: { color: '#a855f7', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#555', fontSize: 13, textAlign: 'center', marginVertical: 16 },

  resultsList: { maxHeight: 400 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8,
    overflow: 'hidden', borderWidth: 1, borderColor: 'transparent',
  },
  resultRowSelected: { borderColor: 'rgba(168,85,247,0.4)', backgroundColor: '#1e1428' },
  resultPosterWrap: { position: 'relative' },
  resultPoster: { width: 56, height: 84 },
  resultOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  resultMeta: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  resultTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  resultTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultYear: { color: '#666', fontSize: 12 },
  typeBadge: {
    backgroundColor: 'rgba(168,85,247,0.15)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
  },
  typeBadgeTv: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' },
  typeBadgeText: { color: '#a855f7', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  doneBtn: {
    backgroundColor: '#a855f7', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 12,
  },
  doneBtnDisabled: { backgroundColor: '#2a1a3e' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
