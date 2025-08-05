import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Recommendation } from '../hooks/useRecommendations';

interface Props {
  item: Recommendation;
  onSelect: (item: Recommendation) => void;
  onSeen: (item: Recommendation) => void;
  onFavorite: (item: Recommendation) => void;
  onDismiss: (id: string) => void;
  onLike: (item: Recommendation) => void;
}

export function RecommendationItem({
  item,
  onSelect,
  onSeen,
  onFavorite,
  onDismiss,
  onLike,
}: Props) {
  return (
    <TouchableOpacity onPress={() => onSelect(item)} style={{ flexDirection: 'row', marginBottom: 24 }}>
      {item.posterUrl ? (
        <Image
          source={{ uri: item.posterUrl }}
          style={{ width: 96, height: 144, borderRadius: 8, marginRight: 16 }}
        />
      ) : (
        <View
          style={{
            width: 96, height: 144,
            backgroundColor: '#555',
            borderRadius: 8,
            marginRight: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12 }}>Póster no disponible</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{item.releaseDate.substring(0, 10)}</Text>
        <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
          <TouchableOpacity
            onPress={() => onSeen(item)}
            disabled={item.seen}
            style={{
              padding: 8, borderRadius: 16,
              backgroundColor: item.seen ? '#4c1d95' : '#7c3aed',
            }}
          >
            <Text style={{ color: '#fff' }}>{item.seen ? '✅ Visto' : '⭐ Visto'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFavorite(item)}
            disabled={item.favorite}
            style={{
              padding: 8, borderRadius: 16,
              backgroundColor: item.favorite ? '#881337' : '#ec4899',
            }}
          >
            <Text style={{ color: '#fff' }}>{item.favorite ? '❤️ Agregado' : '❤️ Favorito'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDismiss(item.id)} style={{ padding: 8, borderRadius: 16, backgroundColor: '#444' }}>
            <Text style={{ color: '#fff' }}>🙈 No me interesa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onLike(item)} style={{ padding: 8, borderRadius: 16, backgroundColor: '#059669' }}>
            <Text style={{ color: '#fff' }}>👍 Me gustó</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
