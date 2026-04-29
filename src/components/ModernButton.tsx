import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'medium',
  fullWidth = false,
}) => {
  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 20;
  const isLight = variant === 'outline' || variant === 'ghost';

  const sizeStyle = styles[size];
  const baseWrapperStyle = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={isLight ? theme.colors.primaryGlow : '#fff'} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isLight ? theme.colors.primaryGlow : '#fff'}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, styles[`${size}Text` as keyof typeof styles] as any, isLight && styles.outlineText]}>
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[...baseWrapperStyle]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.82}
      >
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[...baseWrapperStyle]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.82}
      >
        <LinearGradient
          colors={['#EC4899', '#F43F5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        variant === 'outline' && styles.outline,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md + 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryGlow,
  },
  disabled: {
    opacity: 0.45,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: theme.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.fontSize.md,
  },
  largeText: {
    fontSize: theme.fontSize.lg,
    letterSpacing: 0.3,
  },
  outlineText: {
    color: theme.colors.primaryGlow,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
});
