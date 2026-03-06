import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface MovieCardProps {
  title: string;
  posterUrl?: string;
  rating?: number;
  overview?: string;
  mediaType?: 'movie' | 'tv';
  platforms?: string[];
  onPress?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  title,
  posterUrl,
  rating,
  overview,
  mediaType,
  platforms,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Poster */}
      <View style={styles.posterContainer}>
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="film-outline" size={40} color={theme.colors.textTertiary} />
          </View>
        )}
        {mediaType && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {mediaType === 'movie' ? 'PELÍCULA' : 'SERIE'}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {overview && (
          <Text style={styles.overview} numberOfLines={3}>
            {overview}
          </Text>
        )}

        {platforms && platforms.length > 0 && (
          <View style={styles.platforms}>
            {platforms.slice(0, 3).map((platform, index) => (
              <View key={index} style={styles.platformChip}>
                <Text style={styles.platformText} numberOfLines={1}>
                  {platform}
                </Text>
              </View>
            ))}
            {platforms.length > 3 && (
              <Text style={styles.morePlatforms}>+{platforms.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    ...theme.shadows.md,
  },
  posterContainer: {
    width: 120,
    height: 180,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  overview: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  platforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  platformChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  platformText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  morePlatforms: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
