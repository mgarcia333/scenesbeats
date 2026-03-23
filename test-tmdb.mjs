import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const testTMDB = async () => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    console.log('Using API Key:', apiKey);
    const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week`, {
      params: {
        api_key: apiKey,
        language: 'es-ES'
      }
    });
    console.log('Results count:', response.data.results?.length);
    if (response.data.results && response.data.results.length > 0) {
        const first = response.data.results[0];
        console.log('First result:', first.title);
        console.log('Poster Path:', first.poster_path);
        console.log('Full URL:', `https://image.tmdb.org/t/p/w500${first.poster_path}`);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testTMDB();
