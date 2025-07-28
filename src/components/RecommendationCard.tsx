import React from 'react';
import { View, Text, Image } from 'react-native';

type RecommendationCardProps = {
  title: string;
  genres: string;
  reason: string;
  image: any;
};

export default function RecommendationCard({
  title,
  genres,
  reason,
  image,
}: RecommendationCardProps) {
  return (
    <View className="bg-zinc-900 rounded-2xl p-4 mb-4 flex-row">
      <Image
        source={image}
        className="w-16 h-24 rounded-md"
        resizeMode="cover"
      />
      <View className="ml-4 flex-1">
        <Text className="text-white text-lg font-bold mb-1">{title}</Text>
        <Text className="text-zinc-400 text-sm mb-1">{genres}</Text>
        <Text className="text-zinc-300 text-xs italic">{reason}</Text>
      </View>
    </View>
  );
}
