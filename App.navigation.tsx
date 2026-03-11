// App.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SeenScreen from './src/screens/SeenScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';

import { API_URL } from '@env';
import WishListScreen from './src/screens/WishListScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Tema personalizado para React Native Paper
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

function LogoTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image source={require('./assets/logo.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Recomiéndame</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Sin header en ninguna pantalla
        tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#222' },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          switch (route.name) {
            case 'Home':            iconName = 'home-outline'; break;
            case 'Seen':            iconName = 'eye-outline'; break;
            case 'Favorites':       iconName = 'star-outline'; break;
            case 'Recommendations': iconName = 'sparkles-outline'; break;
            case 'Wishlist':        iconName = 'heart-outline'; break;
            case 'Profile':         iconName = 'person-outline'; break;
            default:                iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="Recommendations" 
        component={RecommendationsScreen}
        options={{ tabBarLabel: 'Recomienda' }}
      />
      <Tab.Screen 
        name="Seen" 
        component={SeenScreen}
        options={{ tabBarLabel: 'Vistos' }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favoritos' }}
      />
      <Tab.Screen 
        name="Wishlist" 
        component={WishListScreen}
        options={{ tabBarLabel: 'Deseados' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const meRes = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await AsyncStorage.setItem('userId', meRes.data.id);
        setIsAuthenticated(true);
      } catch {
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    })();
  }, []);

  if (isAuthenticated === null) {
    return (
      <PaperProvider theme={customTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator color="#a855f7" size="large" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}
        >
          <Stack.Screen name="Login" component={LoginScreen} />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerShown: true,
              headerTitle: () => <LogoTitle />,
              headerStyle: { backgroundColor: '#0f0f0f' },
              headerTintColor: '#fff',
            }}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{
              headerShown: true,
              headerTitle: () => <LogoTitle />,
              headerStyle: { backgroundColor: '#0f0f0f' },
              headerTintColor: '#fff',
            }}
          />

          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>

        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}
