import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { theme } from '../styles/theme';

interface ChapiTipProps {
  message: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
}

export default function ChapiTip({ message, image, onPress }: ChapiTipProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const src = image ?? require('../../assets/chapipelicula1.png');

  const content = (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Animated.Image
        source={src}
        style={[styles.avatar, { transform: [{ translateY: bounceAnim }] }]}
        resizeMode="contain"
      />
      <View style={styles.bubble}>
        <Text style={styles.chapiName}>Chapi dice</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
  },
  bubble: {
    flex: 1,
  },
  chapiName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
