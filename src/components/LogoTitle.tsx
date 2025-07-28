import React from 'react';
import { Image } from 'react-native';

export default function LogoTitle() {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: 36, height: 36 }}
      resizeMode="contain"
    />
  );
}
