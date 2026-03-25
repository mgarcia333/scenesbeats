import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseStringPromise } from 'xml2js';

/**
 * Helper to fetch Letterboxd context for the AI
 */
const fetchLetterboxdContext = async (username) => {
  if (!username) return "";
  try {
    const rssUrl = `https://letterboxd.com/${username}/rss/`;
    const response = await axios.get(rssUrl);
    const result = await parseStringPromise(response.data, { explicitArray: false });
    const items = result.rss.channel.item;
    const itemList = Array.isArray(items) ? items : [items];
    
    return itemList
      .filter(item => item['letterboxd:filmTitle'])
      .slice(0, 10)
      .map((item, i) => `${i + 1}. ${item['letterboxd:filmTitle']} (${item['letterboxd:filmYear']}) - Nota: ${item['letterboxd:memberRating'] || 'Sin nota'}`)
      .join('\n');
  } catch (error) {
    console.error('Error fetching Letterboxd context:', error.message);
    return "";
  }
};

/**
 * Controller to generate a movie recommendation based on user contextual data.
 */
export const generateRecommendation = async (req, res) => {
  try {
    const { mode = 'spotify', lb_username, fav_movies = [], fav_songs = [] } = req.body;

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let trackContext = "";
    let movieContext = "";
    let favoritesContext = "";

    // 1. Fetch Spotify Data (always useful for "vibe")
    try {
      const recentlyPlayedRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
        headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
      });
      const items = recentlyPlayedRes.data.items;
      if (items && items.length > 0) {
        trackContext = items.map((item, index) => {
          return `${index + 1}. "${item.track.name}" by ${item.track.artists.map(a => a.name).join(', ')}`;
        }).join('\n');
      }
    } catch (err) {
      console.warn("Spotify fetch failed (non-fatal):", err.message);
    }

    // 2. Fetch Letterboxd Data if needed
    if (lb_username && (mode === 'letterboxd' || mode === 'hybrid')) {
      movieContext = await fetchLetterboxdContext(lb_username);
    }

    // 3. Format favorites
    if (fav_movies.length > 0 || fav_songs.length > 0) {
      favoritesContext = "Favoritos del usuario:\n";
      if (fav_movies.length > 0) {
        favoritesContext += `- Películas: ${fav_movies.map(m => m.title || m.name).join(', ')}\n`;
      }
      if (fav_songs.length > 0) {
        favoritesContext += `- Canciones: ${fav_songs.map(s => s.name || s.title).join(', ')}\n`;
      }
    }

    // 4. Construct Prompt based on mode
    let prompt = "";
    const systemInstruction = `Eres un experto curador de cine de élite. Tu misión es analizar el perfil del usuario (música, cine y favoritos) para recomendar la película perfecta.
REGLA CRÍTICA 1: La recomendación DEBE ser SOLO UNA PELÍCULA. No recomiendes canciones, álbumes, series ni listas.
REGLA CRÍTICA 2: El título de la película debe ser el nombre oficial para facilitar su búsqueda en bases de datos (puedes incluir el año si la película es poco común).
REGLA CRÍTICA 3: No recomiendes ninguna película que el usuario YA HAYA VISTO (estarán listadas en su historial de Letterboxd).
Debes devolver un JSON estricto con:
{
  "vibra": "Un análisis profundo y detallado del 'mood' o estado de ánimo detectado del usuario.",
  "pelicula": "Título exacto de la película recomendada",
  "motivo": "Una explicación magistral y super detallada de por qué esta película es la elección perfecta hoy, conectando puntos específicos entre su música reciente, sus películas favoritas y su actividad en Letterboxd."
}`;

    if (mode === 'letterboxd') {
      prompt = `${systemInstruction}
CONTEXTO DE CINE (Letterboxd):
${movieContext || "No hay datos recientes."}

Basándote en este historial, identifica patrones de directores, géneros o estéticas que le gusten y sorpréndelo con una joya cinematográfica que NO esté en esa lista pero que le vaya a encantar.`;
    } else if (mode === 'hybrid') {
      prompt = `${systemInstruction}
CONTEXTO TOTAL:
MÚSICA RECIENTE (Spotify):
${trackContext || "No hay canciones recientes."}

CINE RECIENTE (Letterboxd):
${movieContext || "No hay películas recientes."}

${favoritesContext}

Analiza la sinergia entre su música y su cine. Busca el 'hilo conductor' emocional. Dale muchísima importancia a lo que haya puntuado con 4 o 5 estrellas. Crea una recomendación que sea una experiencia completa.`;
    } else {
      // Default: Spotify mode
      prompt = `${systemInstruction}
MÚSICA RECIENTE (Spotify):
${trackContext || "No hay canciones recientes."}

Analiza la vibra, el ritmo y el sentimiento de estas canciones. Traduce ese lenguaje musical a una experiencia cinematográfica. Recomienda la película ideal para este momento exacto.`;
    }

    // 5. Call Gemini
    console.log(`Generating high-precision recommendation for mode: ${mode}...`);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.75,
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    let recommendationText = response.text();
    recommendationText = recommendationText.replace(/```json|```/gi, '').trim();
    
    let recommendationJSON;
    try {
      recommendationJSON = JSON.parse(recommendationText);
    } catch (parseError) {
      recommendationJSON = {
        vibra: "Ecléctica y Misteriosa",
        pelicula: "Inception",
        motivo: "Hubo un pequeño error en mi análisis, pero esta película es perfecta para cualquier mente curiosa."
      };
    }

    // 6. Fetch Movie Details from TMDB (Post-processing recommended title)
    let movieTitle = recommendationJSON.pelicula;
    // Remove year in parenthesis if present for better search results, but keep it as a backup
    const cleanTitle = movieTitle.replace(/\(\d{4}\)/g, '').trim();
    
    let posterUrl = null;
    let overview = "";

    try {
      if (movieTitle && process.env.TMDB_API_KEY) {
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: process.env.TMDB_API_KEY,
            query: cleanTitle,
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

    res.json({
        ...recommendationJSON,
        poster_url: posterUrl,
        sinopsis: overview
    });

  } catch (error) {
    console.error('Recommendation API Error:', error);
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

/**
 * Controller to fetch initial data for the Community view (Trending movies + Recommended songs).
 */
export const getInitialCommunityData = async (req, res) => {
  try {
    const data = {
      trendingMovies: [],
      recommendedSongs: []
    };

    // 1. Fetch Trending Movies
    try {
      const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'es-ES',
          page: 1
        }
      });
      data.trendingMovies = tmdbRes.data.results.slice(0, 10).map(movie => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.split('-')[0] || 'N/A',
        rating: movie.vote_average ? (movie.vote_average / 2).toFixed(1) : null,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
      }));
    } catch (err) {
      console.error("Initial Movies Error:", err.message);
    }

    // 2. Fetch Recommended Songs (using popular genres as seed if no user data)
    try {
      // Try to get user's top genres/artists for better seeds if possible
      let seedGenres = 'pop,rock,dance';
      let seedArtists = '';

      if (req.spotifyToken) {
        try {
          const topArtistsRes = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=1', {
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
          });
          if (topArtistsRes.data.items?.length > 0) {
            seedArtists = topArtistsRes.data.items[0].id;
          }
        } catch (e) { /* ignore */ }
      }

      const spotifyRes = await axios.get(`https://api.spotify.com/v1/recommendations`, {
        params: {
          limit: 10,
          seed_genres: seedArtists ? undefined : seedGenres,
          seed_artists: seedArtists || undefined
        },
        headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
      });

      data.recommendedSongs = spotifyRes.data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        artwork: track.album.images[0]?.url
      }));
    } catch (err) {
      console.error("Initial Songs Error:", err.message);
    }

    res.json(data);
  } catch (error) {
    console.error('Initial Data Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch initial community data' });
  }
};

