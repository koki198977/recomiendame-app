// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TextInput, 
  Button as PaperButton,
  Portal,
  Dialog
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import CustomPicker from '../components/CustomPicker';
import { ENV } from '../config/env';
import { theme } from '../styles/theme';

// parsea un "YYYY-MM-DD" a Date en zona local
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon as any} size={18} color={theme.colors.primaryGlow} />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    birthDate ? parseLocalDate(birthDate) : new Date()
  );

  const countryOptions = [
    { label: 'Chile', value: 'CL' },
    { label: 'Argentina', value: 'AR' },
    { label: 'Perú', value: 'PE' },
    { label: 'México', value: 'MX' },
    { label: 'Colombia', value: 'CO' },
    { label: 'España', value: 'ES' },
    { label: 'Estados Unidos', value: 'US' },
    { label: 'Brasil', value: 'BR' },
    { label: 'Uruguay', value: 'UY' },
    { label: 'Paraguay', value: 'PY' },
  ];

  const languageOptions = [
    { label: 'Español', value: 'es' },
    { label: 'Inglés', value: 'en' },
    { label: 'Portugués', value: 'pt' },
    { label: 'Francés', value: 'fr' },
    { label: 'Alemán', value: 'de' },
  ];

  const countryLabel = countryOptions.find(c => c.value === country)?.label || country;
  const languageLabel = languageOptions.find(l => l.value === language)?.label || language;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        
        if (!token || !userId) {
          navigation.replace('Login');
          return;
        }
        
        const res = await axios.get(`${ENV.API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setUser(res.data);
        setFullName(res.data.fullName || '');
        setBirthDate(res.data.birthDate?.slice(0, 10) || '');
        setCountry(res.data.country || '');
        setLanguage(res.data.language || '');
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 404) {
          navigation.replace('Login');
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cargar el perfil' });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      await axios.put(
        `${ENV.API_URL}/users/${userId}`,
        {
          fullName,
          birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
          country,
          language,
          favoriteGenres: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: '✅ Perfil actualizado' });
      setEditing(false);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo guardar' });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Serás redirigido a nuestra página web para completar el proceso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => Linking.openURL('https://recomiendameapp.cl/request-delete-account/'),
        },
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const initials = (user?.name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();

  if (loading) {
    return (
      <LinearGradient colors={['#0A0A14', '#16083A', '#0A0A14']} style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primaryGlow} size="large" />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Header ─── */}
        <LinearGradient
          colors={['#1A0A40', '#0E0828', '#0A0A14']}
          style={styles.heroSection}
        >
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#7C3AED', '#A855F7']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarInitial}>{initials}</Text>
            </LinearGradient>
            {/* Anillo exterior */}
            <View style={styles.avatarRing} />
          </View>

          <Text style={styles.heroName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>

          {/* Botón editar / logout */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnEdit]}
              onPress={() => setEditing(!editing)}
            >
              <Ionicons name={editing ? 'close' : 'pencil'} size={15} color="#fff" />
              <Text style={styles.heroBtnText}>{editing ? 'Cancelar' : 'Editar perfil'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.heroBtn, styles.heroBtnLogout]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={15} color="#EF4444" />
              <Text style={[styles.heroBtnText, { color: '#EF4444' }]}>Salir</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ─── Info Card (modo lectura) ─── */}
        {!editing && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información Personal</Text>
            <InfoRow icon="person-outline" label="Nombre" value={fullName} />
            <View style={styles.divider} />
            <InfoRow icon="calendar-outline" label="Fecha de nacimiento" value={birthDate} />
            <View style={styles.divider} />
            <InfoRow icon="location-outline" label="País" value={countryLabel} />
            <View style={styles.divider} />
            <InfoRow icon="language-outline" label="Idioma" value={languageLabel} />
          </View>
        )}

        {/* ─── Formulario (modo edición) ─── */}
        {editing && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Editar Perfil</Text>

            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.textInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={theme.colors.text}
                  theme={{ colors: { background: 'transparent' } }}
                />
              </View>
            </View>

            {/* Fecha de nacimiento */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FECHA DE NACIMIENTO</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.inputWrapper}
              >
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textTertiary} style={styles.inputIcon} />
                <Text style={[styles.inputText, !birthDate && { color: theme.colors.textTertiary }]}>
                  {birthDate || 'Selecciona una fecha'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.primaryGlow} />
              </TouchableOpacity>
            </View>

            {/* País */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PAÍS</Text>
              <View style={styles.pickerWrapper}>
                <CustomPicker label="" value={country} onChange={setCountry} options={countryOptions} />
              </View>
            </View>

            {/* Idioma */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>IDIOMA</Text>
              <View style={styles.pickerWrapper}>
                <CustomPicker label="" value={language} onChange={setLanguage} options={languageOptions} />
              </View>
            </View>

            {/* Guardar */}
            <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7C3AED', '#A855F7']}
                style={styles.saveBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Zona de peligro ─── */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Zona de peligro</Text>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.dangerBtn}>
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
            <Text style={styles.dangerBtnText}>Eliminar mi cuenta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal fecha */}
      <Portal>
        <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
          <Dialog.Title>Fecha de nacimiento</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              locale="es-ES"
              themeVariant="light"
              textColor="#000"
              onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                if (selected) setTempDate(selected);
              }}
              style={{ backgroundColor: '#fff' }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setShowDatePicker(false)}>Cancelar</PaperButton>
            <PaperButton onPress={() => {
              const y = tempDate.getFullYear();
              const m = String(tempDate.getMonth() + 1).padStart(2, '0');
              const D = String(tempDate.getDate()).padStart(2, '0');
              setBirthDate(`${y}-${m}-${D}`);
              setShowDatePicker(false);
            }}>Aceptar</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    marginBottom: 18,
    position: 'relative',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
    elevation: 16,
  },
  avatarRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(168,85,247,0.35)',
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroBtnEdit: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderColor: 'rgba(168,85,247,0.5)',
  },
  heroBtnLogout: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // ── Cards ──
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#14141F',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 18,
    letterSpacing: -0.2,
  },

  // ── Info rows ──
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 50,
  },

  // ── Form fields ──
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    height: 48,
  },
  inputText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  saveBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Danger zone ──
  dangerCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  dangerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  dangerBtnText: {
    fontSize: theme.fontSize.sm,
    color: '#EF4444',
    fontWeight: '600',
  },
});
