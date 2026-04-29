import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

interface ChapiTipProps {
  message: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
}

export default function ChapiTip({ message, image, onPress }: ChapiTipProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Fade + scale in spring
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const src = image ?? require('../../assets/chapipelicula1.png');

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={['#1E1040', '#130C30', '#0E0A20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Borde glow sutil */}
        <View style={styles.glowBorder} />

        <View style={styles.avatarContainer}>
          <Animated.Image
            source={src}
            style={[styles.avatar, { transform: [{ translateY: floatAnim }] }]}
            resizeMode="cover"
          />
        </View>
        <View style={styles.bubble}>
          <View style={styles.chapiNameRow}>
            <View style={styles.dot} />
            <Text style={styles.chapiName}>CHAPI DICE</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    // Sombra glow exterior
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    overflow: 'hidden',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.5)',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    flexShrink: 0,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 22,
  },
  bubble: {
    flex: 1,
  },
  chapiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
  },
  chapiName: {
    fontSize: 10,
    color: '#C084FC',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
