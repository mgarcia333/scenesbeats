import express from 'express';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

const requireSpotifyToken = (req, res, next) => {
  const accessToken = req.cookies.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'No Spotify access token found' });
  }
  req.spotifyToken = accessToken;
  next();
};

router.post('/generate', requireSpotifyToken, async (req, res) => {
  try {
    // Initialize Gemini Client here so dotenv has time to load the API key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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
    const completion = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json"
        }
    });

    const recommendationText = completion.text;
    const recommendationJSON = JSON.parse(recommendationText);
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
            posterUrl = `https://image.tmdb.org/t/p/w500${movieData.poster_path}`;
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
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

export default router;
