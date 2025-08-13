import axios from 'axios';
import { ENV } from '../config/env';


export const getPoster = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${ENV.TMDB_API_KEY}`;
  const res = await axios.get(url);
  return `https://image.tmdb.org/t/p/w500${res.data.poster_path}`;
};
