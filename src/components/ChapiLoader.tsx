import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const IMAGES = [
  require('../../assets/chapipelicula1.png'),
  require('../../assets/chapipelicula2.png'),
  require('../../assets/chapipelicula3.png'),
  require('../../assets/chapipelicula2.png'),
];

const MESSAGES = [
  '🔍 Chapi está buscando lo mejor para ti...',
  '🎬 Revisando miles de películas...',
  '⭐ Analizando tus gustos...',
  '🍿 Casi listo, preparando tu lista...',
  '🧠 Chapi piensa muy fuerte...',
  '🎭 Encontrando joyas ocultas...',
];

export default function ChapiLoader() {
  const [imgIndex, setImgIndex] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Bounce loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -12, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cycle images with fade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setImgIndex(i => (i + 1) % IMAGES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Animated.Image
          source={IMAGES[imgIndex]}
          style={[styles.image, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.name}>Chapi</Text>
      <Text style={styles.message}>{MESSAGES[msgIndex]}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <DotPulse key={i} delay={i * 200} />
        ))}
      </View>
    </View>
  );
}

function DotPulse({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    paddingBottom: 60,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
    minHeight: 44,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
