import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Linking, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './src/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SeenScreen from './src/screens/SeenScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import WishListScreen from './src/screens/WishListScreen';
import GuestScreen from './src/screens/GuestScreen';
import SharedFavoritesScreen from './src/screens/SharedFavoritesScreen';
import SharedWishListScreen from './src/screens/SharedWishListScreen';

import { API_URL } from '@env';

const customTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#a855f7',
    secondary: '#9333ea',
    surface: '#1e1e1e',
    background: '#000000',
    surfaceVariant: '#27272a',
    onSurface: '#ffffff',
    onSurfaceVariant: '#cccccc',
  },
};

type Screen = 'loading' | 'login' | 'register' | 'forgotPassword' | 'home' | 'guest';

type SharedFavoritesParams = {
  userId: string;
  ownerName?: string;
};

type SharedWishListParams = {
  userId: string;
  ownerName?: string;
};
type Tab = 'home' | 'recommendations' | 'seen' | 'favorites' | 'wishlist' | 'profile';

type TabConfig = {
  key: Tab;
  label: string;
  icon: string;
  iconActive: string;
  activeColor: string;
  glowColor: string;
};

const TAB_CONFIG: TabConfig[] = [
  { key: 'home', label: 'Inicio', icon: 'home-outline', iconActive: 'home', activeColor: '#7C3AED', glowColor: '#A855F7' },
  { key: 'recommendations', label: 'Descubrir', icon: 'sparkles-outline', iconActive: 'sparkles', activeColor: '#6366F1', glowColor: '#818CF8' },
  { key: 'seen', label: 'Vistos', icon: 'eye-outline', iconActive: 'eye', activeColor: '#7C3AED', glowColor: '#A855F7' },
  { key: 'favorites', label: 'Favoritos', icon: 'star-outline', iconActive: 'star', activeColor: '#F59E0B', glowColor: '#FCD34D' },
  { key: 'wishlist', label: 'Deseados', icon: 'heart-outline', iconActive: 'heart', activeColor: '#EC4899', glowColor: '#F472B6' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', iconActive: 'person', activeColor: '#7C3AED', glowColor: '#A855F7' },
];

function TabItem({ config, active, onPress }: { config: TabConfig; active: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity style={tabItemStyles.tab} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        {active ? (
          <LinearGradient
            colors={[config.activeColor, config.glowColor]}
            style={tabItemStyles.activeIconContainer}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name={config.iconActive as any} size={20} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={tabItemStyles.iconContainer}>
            <Ionicons name={config.icon as any} size={20} color="#4A4A6A" />
          </View>
        )}
        <Text style={[tabItemStyles.label, active && { color: config.glowColor }]}>
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const tabItemStyles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4A4A6A',
    letterSpacing: 0.2,
  },
});

const MainApp: React.FC<{ onLogout: () => void; onNavigate: (screen: Screen) => void }> = ({ onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'recommendations':
        return <RecommendationsScreen />;
      case 'seen':
        return <SeenScreen />;
      case 'favorites':
        return <FavoritesScreen />;
      case 'wishlist':
        return <WishListScreen />;
      case 'profile':
        return <ProfileScreen navigation={{ replace: () => onLogout() }} />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {renderScreen()}
      </View>

      <SafeAreaView style={styles.tabBarContainer} edges={['bottom']}>
        <LinearGradient
          colors={['rgba(10,10,20,0)', 'rgba(10,10,20,0.98)']}
          style={styles.tabBarBlur}
          pointerEvents="none"
        />
        <View style={styles.tabBar}>
          {TAB_CONFIG.map((cfg) => (
            <TabItem
              key={cfg.key}
              config={cfg}
              active={activeTab === cfg.key}
              onPress={() => setActiveTab(cfg.key)}
            />
          ))}
        </View>
      </SafeAreaView>

      <Toast 
        config={{
          success: ({ text1, text2 }) => (
            <View style={toastStyles.container}>
              <View style={[toastStyles.toast, toastStyles.successToast]}>
                <View style={toastStyles.iconContainer}>
                  <Text style={toastStyles.icon}>✓</Text>
                </View>
                <View style={toastStyles.textContainer}>
                  <Text style={toastStyles.text1}>{text1}</Text>
                  {text2 && <Text style={toastStyles.text2}>{text2}</Text>}
                </View>
              </View>
            </View>
          ),
          error: ({ text1, text2 }) => (
            <View style={toastStyles.container}>
              <View style={[toastStyles.toast, toastStyles.errorToast]}>
                <View style={[toastStyles.iconContainer, toastStyles.errorIcon]}>
                  <Text style={toastStyles.icon}>✕</Text>
                </View>
                <View style={toastStyles.textContainer}>
                  <Text style={toastStyles.text1}>{text1}</Text>
                  {text2 && <Text style={toastStyles.text2}>{text2}</Text>}
                </View>
              </View>
            </View>
          ),
          info: ({ text1, text2 }) => (
            <View style={toastStyles.container}>
              <View style={[toastStyles.toast, toastStyles.infoToast]}>
                <View style={[toastStyles.iconContainer, toastStyles.infoIcon]}>
                  <Text style={toastStyles.icon}>i</Text>
                </View>
                <View style={toastStyles.textContainer}>
                  <Text style={toastStyles.text1}>{text1}</Text>
                  {text2 && <Text style={toastStyles.text2}>{text2}</Text>}
                </View>
              </View>
            </View>
          ),
        }}
      />
    </SafeAreaView>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D29',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
  },
  successToast: {
    borderLeftColor: '#10b981',
  },
  errorToast: {
    borderLeftColor: '#ef4444',
  },
  infoToast: {
    borderLeftColor: '#3b82f6',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  errorIcon: {
    backgroundColor: '#ef4444',
  },
  infoIcon: {
    backgroundColor: '#3b82f6',
  },
  icon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  text2: {
    color: '#9ca3af',
    fontSize: 13,
  },
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [sharedParams, setSharedParams] = useState<SharedFavoritesParams | null>(null);
  const [sharedWishParams, setSharedWishParams] = useState<SharedWishListParams | null>(null);

  const handleDeepLink = (url: string) => {
    // Ignorar URLs internas de Expo Go
    if (url.startsWith('exp://')) return;

    console.log('[DeepLink] URL recibida:', url);
    const match =
      url.match(/recomiendameapp\.cl\/shared-favorites\/([^/?]+)/) ||
      url.match(/shared-favorites\/([^/?]+)/);
    if (match) {
      console.log('[DeepLink] userId extraído:', match[1]);
      setSharedParams({ userId: match[1] });
    } else {
      const wishMatch =
        url.match(/recomiendameapp\.cl\/shared-wishlist\/([^/?]+)/) ||
        url.match(/shared-wishlist\/([^/?]+)/);
      if (wishMatch) {
        setSharedWishParams({ userId: wishMatch[1] });
      } else {
        console.log('[DeepLink] no se pudo extraer userId del URL');
      }
    }
  };

  useEffect(() => {
    // Escuchar deep links mientras la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    // Verificar si la app fue abierta desde un deep link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setCurrentScreen('login');
          return;
        }
        
        const meRes = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await AsyncStorage.setItem('userId', meRes.data.id);
        setCurrentScreen('home');
      } catch {
        await AsyncStorage.removeItem('token');
        setCurrentScreen('login');
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'userId']);
    setCurrentScreen('login');
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('home');
  };

  if (currentScreen === 'loading') {
    return (
      <PaperProvider theme={customTheme}>
        <LinearGradient
          colors={['#0A0A14', '#14102A', '#0A0A14']}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator color="#A855F7" size="large" />
        </LinearGradient>
      </PaperProvider>
    );
  }

  if (currentScreen === 'login') {
    return (
      <PaperProvider theme={customTheme}>
        <LoginScreen 
          navigation={{ 
            navigate: (screen: string) => {
              const screenMap: { [key: string]: Screen } = {
                'Register': 'register',
                'ForgotPassword': 'forgotPassword',
                'register': 'register',
                'forgotPassword': 'forgotPassword',
              };
              setCurrentScreen(screenMap[screen] || screen as Screen);
            },
            replace: (screen: string) => setCurrentScreen(screen === 'MainTabs' ? 'home' : screen as Screen)
          }}
          onContinueAsGuest={() => setCurrentScreen('guest')}
        />
      </PaperProvider>
    );
  }

  if (currentScreen === 'register') {
    return (
      <PaperProvider theme={customTheme}>
        <RegisterScreen 
          navigation={{ 
            navigate: (screen: string) => {
              const screenMap: { [key: string]: Screen } = {
                'Login': 'login',
                'login': 'login',
              };
              setCurrentScreen(screenMap[screen] || screen as Screen);
            },
            replace: (screen: string) => {
              const screenMap: { [key: string]: Screen } = {
                'Login': 'login',
                'login': 'login',
              };
              setCurrentScreen(screenMap[screen] || screen as Screen);
            },
            goBack: () => setCurrentScreen('login')
          }} 
        />
      </PaperProvider>
    );
  }

  if (currentScreen === 'forgotPassword') {
    return (
      <PaperProvider theme={customTheme}>
        <ForgotPasswordScreen 
          navigation={{ 
            goBack: () => setCurrentScreen('login')
          }} 
        />
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        {currentScreen === 'guest' ? (
          <GuestScreen onLogin={() => setCurrentScreen('login')} />
        ) : (
          <MainApp onLogout={handleLogout} onNavigate={setCurrentScreen} />
        )}

        {/* Overlay de favoritos compartidos — funciona encima de cualquier pantalla */}
        {sharedParams && (
          <View style={StyleSheet.absoluteFill}>
            <SharedFavoritesScreen
              userId={sharedParams.userId}
              ownerName={sharedParams.ownerName}
              onLogin={() => {
                setSharedParams(null);
                setCurrentScreen('login');
              }}
              onBack={() => setSharedParams(null)}
            />
          </View>
        )}

        {/* Overlay de wishlist compartida */}
        {sharedWishParams && (
          <View style={StyleSheet.absoluteFill}>
            <SharedWishListScreen
              userId={sharedWishParams.userId}
              ownerName={sharedWishParams.ownerName}
              onLogin={() => {
                setSharedWishParams(null);
                setCurrentScreen('login');
              }}
              onBack={() => setSharedWishParams(null)}
            />
          </View>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  tabBarBlur: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    height: 28,
    pointerEvents: 'none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#12121E',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.18)',
  },
});
