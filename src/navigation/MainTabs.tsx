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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Seen" component={SeenScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Wishlist" component={WishListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
