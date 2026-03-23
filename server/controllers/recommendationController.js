import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Controller to generate a movie recommendation based on user's Spotify history.
 */
export const generateRecommendation = async (req, res) => {
  try {
    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // 1. Fetch user's recently played tracks from Spotify
    const recentlyPlayedRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });

    
    const items = recentlyPlayedRes.data.items;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No tienes canciones recientes en Spotify para analizar.' });
    }

    // 2. Format the tracks to send to Gemini
    const trackContext = items.map((item, index) => {
      return `${index + 1}. "${item.track.name}" by ${item.track.artists.map(a => a.name).join(', ')}`;
    }).join('\n');

    // 3. Create the prompt for Gemini
    const prompt = `Eres un experto curador de cine y música. 
Basándote en las siguientes 10 canciones que el usuario ha escuchado recientemente en Spotify hoy:
${trackContext}

1. Analiza "la vibra" o el estado de ánimo (mood) de esta música.
2. Recomienda UNA sola película que encaje perfectamente con ese estado de ánimo.
3. Devuelve tu respuesta en el siguiente formato JSON estricto, sin markdown ni comillas invertidas:
{
  "vibra": "Breve descripción del estado de ánimo de la música",
  "pelicula": "Título de la Película recomendada",
  "motivo": "Por qué recomendaste esta película según las canciones"
}`;

    // 4. Call Gemini
    console.log("Calling Gemini 1.5-flash via @google/generative-ai...");
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    let recommendationText = response.text();


    // Clean markdown if present
    recommendationText = recommendationText.replace(/```json|```/gi, '').trim();
    
    let recommendationJSON;
    try {
      recommendationJSON = JSON.parse(recommendationText);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", parseError.message);
      // Fallback recommendation
      recommendationJSON = {
        vibra: "Relajada y ecléctica",
        pelicula: "La La Land",
        motivo: "Tu música tiene una mezcla interesante que pide algo visualmente espectacular y emocional."
      };
    }

    const movieTitle = recommendationJSON.pelicula;

    // 5. Fetch Movie Details from TMDB
    let posterUrl = null;
    let overview = "";

    try {
      if (movieTitle && process.env.TMDB_API_KEY) {
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: process.env.TMDB_API_KEY,
            query: movieTitle,
            language: 'es-ES',
            page: 1
          }
        });

        if (tmdbRes.data.results && tmdbRes.data.results.length > 0) {
          const movieData = tmdbRes.data.results[0];
          overview = movieData.overview;
          if (movieData.poster_path) {
            posterUrl = `https://image.tmdb.org/t/p/w780${movieData.poster_path}`;
          }
        }
      }
    } catch (tmdbError) {
      console.error("TMDB Error (non-fatal):", tmdbError.message);
    }

    // 6. Send back to the client
    res.json({
        ...recommendationJSON,
        poster_url: posterUrl,
        sinopsis: overview
    });

  } catch (error) {
    console.error('GENAI API Error:', error);
    if (error.status === 404) {
      console.error('Model not found. Ensure "gemini-2.5-flash" is the correct name.');
    }
    res.status(500).json({ error: 'Failed to generate recommendation', details: error.message });
  }
};

/**
 * Controller to fetch trending movies from TMDB.
 */
export const getTrendingMovies = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB API Key missing' });
    }

    const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'es-ES',
        page: 1
      }
    });

    const movies = response.data.results.slice(0, 10).map(movie => ({
      id: movie.id,
      name: movie.title || movie.original_title,
      year: movie.release_date?.split('-')[0] || 'N/A',
      rating: movie.vote_average ? (movie.vote_average / 2).toFixed(1) : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null

    }));

    res.json(movies);
  } catch (error) {
    console.error('Error fetching trending movies:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
};
