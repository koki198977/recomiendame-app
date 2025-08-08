import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SeenScreen from '../screens/SeenScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import WishListScreen from '../screens/WishListScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#222' },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName: string = '';

          switch (route.name) {
            case 'Home':
              iconName = 'home-outline';
              break;
            case 'Recommendations':
              iconName = 'sparkles-outline';
              break;
            case 'Seen':
              iconName = 'eye-outline';
              break;
            case 'Favorites':
              iconName = 'star-outline';
              break;
            case 'Wishlist':
              iconName = 'heart-outline';
              break;
            case 'Profile':
              iconName = 'person-outline';
              break;
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
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
        options={{ tabBarLabel: 'Recomendaciones' }}
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
