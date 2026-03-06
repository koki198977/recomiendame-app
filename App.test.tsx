import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator color="#a855f7" size="large" />
      <Text style={{ color: '#fff', marginTop: 20 }}>Test App</Text>
    </View>
  );
}
