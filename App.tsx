import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
type Tab = 'home' | 'recommendations' | 'seen' | 'favorites' | 'wishlist' | 'profile';

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
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('home')}>
            <View style={[styles.tabIconContainer, activeTab === 'home' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>🏠</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('recommendations')}>
            <View style={[styles.tabIconContainer, activeTab === 'recommendations' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'recommendations' && styles.activeTabIcon]}>✨</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>Recomienda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('seen')}>
            <View style={[styles.tabIconContainer, activeTab === 'seen' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'seen' && styles.activeTabIcon]}>👁️</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'seen' && styles.activeTabText]}>Vistos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('favorites')}>
            <View style={[styles.tabIconContainer, activeTab === 'favorites' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'favorites' && styles.activeTabIcon]}>⭐</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('wishlist')}>
            <View style={[styles.tabIconContainer, activeTab === 'wishlist' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'wishlist' && styles.activeTabIcon]}>💖</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Deseados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('profile')}>
            <View style={[styles.tabIconContainer, activeTab === 'profile' && styles.activeTabIconContainer]}>
              <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>👤</Text>
            </View>
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Perfil</Text>
          </TouchableOpacity>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator color="#a855f7" size="large" />
        </View>
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
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  activeTabIconContainer: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  tabIcon: {
    fontSize: 20,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabText: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
});
