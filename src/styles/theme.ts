// Tema centralizado premium — Recomiéndame App
export const theme = {
  colors: {
    // Fondos
    background: '#0A0A14',
    backgroundDeep: '#06060F',
    surface: '#14141F',
    surfaceAlt: '#1C1C2E',
    surfaceLight: '#22223A',
    card: '#181828',

    // Brand
    primary: '#7C3AED',
    primaryDark: '#5B21B6',
    primaryGlow: '#A855F7',
    primaryMuted: 'rgba(124, 58, 237, 0.15)',

    // Accent
    accent: '#EC4899',
    accentMuted: 'rgba(236, 72, 153, 0.15)',
    accentGold: '#F59E0B',
    accentGoldMuted: 'rgba(245, 158, 11, 0.15)',
    accentBlue: '#6366F1',
    accentBlueMuted: 'rgba(99, 102, 241, 0.15)',
    accentGreen: '#10B981',
    accentGreenMuted: 'rgba(16, 185, 129, 0.15)',

    // Texto
    text: '#F1F0FF',
    textSecondary: '#8B8AAE',
    textTertiary: '#4A4A6A',

    // Glass & borders
    glass: 'rgba(255, 255, 255, 0.04)',
    glassLight: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(124, 58, 237, 0.2)',
    borderLight: 'rgba(168, 85, 247, 0.12)',

    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#6366F1',
  },

  // Gradients (para usar con LinearGradient)
  gradients: {
    primary: ['#7C3AED', '#A855F7'] as [string, string],
    accent: ['#EC4899', '#F43F5E'] as [string, string],
    gold: ['#F59E0B', '#EF4444'] as [string, string],
    blue: ['#6366F1', '#3B82F6'] as [string, string],
    green: ['#10B981', '#059669'] as [string, string],
    dark: ['#14141F', '#0A0A14'] as [string, string],
    card: ['#1C1C2E', '#14141F'] as [string, string],
    statSeen: ['#1C1030', '#14141F'] as [string, string],
    statFav: ['#1E1608', '#14141F'] as [string, string],
    statWish: ['#1E0D1A', '#14141F'] as [string, string],
    statRating: ['#0E1030', '#14141F'] as [string, string],
    chapiCard: ['#18183A', '#0E0E24'] as [string, string],
    tabActive: ['#7C3AED', '#A855F7'] as [string, string],
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    full: 9999,
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
  },

  // Sombras por tipo de elemento
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    lg: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
    glowAccent: {
      shadowColor: '#EC4899',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 10,
    },
    glowGold: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 10,
    },
  },
};
