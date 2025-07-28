import axios from 'axios';
import { TMDB_API_KEY } from '@env';

export const getPoster = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
  const res = await axios.get(url);
  return `https://image.tmdb.org/t/p/w500${res.data.poster_path}`;
};
