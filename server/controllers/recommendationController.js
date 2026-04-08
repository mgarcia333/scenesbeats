import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseStringPromise } from 'xml2js';

// Model fallback chain — tries in order until one succeeds
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

const geminiGenerate = async (prompt, generationConfig = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in environmental variables.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = 'gemini-2.5-flash';

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.75, 
        responseMimeType: 'application/json', 
        maxOutputTokens: 1000,
        ...generationConfig 
      }
    });

    const text = result.response.text().replace(/```json|```/gi, '').trim();
    console.log(`✅ Gemini responded with model: ${modelName}`);
    return text;
  } catch (err) {
    console.error(`❌ Gemini Error (${modelName}):`, err.message);
    
    // Check if it's a quota issue
    const errMsg = err.message?.toLowerCase() || '';
    if (err.status === 429 || errMsg.includes('quota') || errMsg.includes('too many requests')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    
    throw err;
  }
};

/**
 * Calls Groq (Llama 3.3) as a robust fallback.
 * Groq is OpenAI-compatible, so we use axios directly.
 */
const groqGenerate = async (prompt) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing.');
  }

  console.log("🚀 Attempting Groq (Llama 3.3) fallback...");
  
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.choices[0].message.content;
    console.log("✅ Groq responded successfully.");
    return text;
  } catch (err) {
    console.error("❌ Groq Error:", err.response?.data || err.message);
    throw err;
  }
};

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
 * Controller to generate highly personalized recommendations based on various contexts.
 * Supports 4 modes: movie_from_music, movie_from_movies, song_from_movies, and hybrid.
 */
export const generateRecommendation = async (req, res) => {
  try {
    const { mode = 'movie_from_music', lb_username, fav_movies = [], fav_songs = [] } = req.body;

    let trackContext = "";
    let movieContext = "";
    let favoritesContext = "";

    // 1. Fetch Contexts
    if (req.spotifyToken) {
      try {
        const recentlyPlayedRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=15', {
          headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
        });
        const items = recentlyPlayedRes.data.items;
        if (items?.length > 0) {
          trackContext = items.map((item, i) => `${i + 1}. "${item.track.name}" by ${item.track.artists.map(a => a.name).join(', ')}`).join('\n');
        }
      } catch (err) { console.warn("Spotify context fetch failed:", err.message); }
    }

    if (lb_username) {
      movieContext = await fetchLetterboxdContext(lb_username);
    }

    if (fav_movies.length > 0 || fav_songs.length > 0) {
      favoritesContext = "FAVORITOS DEL USUARIO:\n";
      if (fav_movies.length > 0) favoritesContext += `- Películas: ${fav_movies.map(m => m.title).join(', ')}\n`;
      if (fav_songs.length > 0) favoritesContext += `- Canciones: ${fav_songs.map(s => s.title).join(', ')}\n`;
    }

    // 2. Construct Dynamic Prompt
    const baseSystem = `Eres un curator cultural de élite y experto en sinestesia audiovisual. Tu especialidad es encontrar el "hilo invisible" que conecta una canción con una película.
    No te limites a géneros obvios; busca conexiones en la textura sonora, el ritmo narrativo, el tono emocional y la paleta de colores sugerida.
    REGLA DE ORO: Respuesta en JSON estricto, sin texto adicional.`;
    
    let prompt = "";
    let outputFormat = "";

    if (mode === 'movie_from_music') {
      outputFormat = `{"vibra": "Breve descripción poética de la conexión", "pelicula": "Título exacto", "motivo": "Explicación magistral de por qué encajan"}`;
      prompt = `${baseSystem}
        HISTORIAL MUSICAL RECIENTE DEL USUARIO:
        ${trackContext || "No hay datos recientes, básate en sus favoritos."}
        ${favoritesContext}
        
        TAREA: Analiza la "vibra" de la música que el usuario escucha (ritmo, tempo, sentimientos). Recomienda UNA película que capture esa misma energía.
        FORMATO: ${outputFormat}`;
    } 
    else if (mode === 'movie_from_movies') {
      outputFormat = `{"vibra": "...", "pelicula": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        HISTORIAL CINEMATOGRÁFICO (Letterboxd):
        ${movieContext || "No disponible."}
        ${favoritesContext}
        
        TAREA: Analiza patrones de directores, estéticas (ej: Wes Anderson, Noir, Sci-fi años 80) y temas. Recomienda una PELÍCULA que profundice en sus gustos sin ser repetitiva.
        FORMATO: ${outputFormat}`;
    }
    else if (mode === 'song_from_movies') {
      outputFormat = `{"vibra": "...", "cancion": "...", "artista": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        CONTEXTO CINEMATOGRÁFICO:
        ${movieContext || "No disponible."}
        ${favoritesContext}
        
        TAREA: Imagina la banda sonora ideal para las películas favoritas del usuario. Recomienda UNA canción exacta que podría sonar en los créditos de su vida.
        FORMATO: ${outputFormat}`;
    }
    else if (mode === 'hybrid') {
      outputFormat = `{"vibra": "...", "pelicula": "...", "cancion": "...", "artista": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        CONTEXTO INTEGRADO:
        Música reciente: ${trackContext || "N/A"}
        Cine reciente: ${movieContext || "N/A"}
        ${favoritesContext}
        
        TAREA: Crea una "Experiencia Completa". Recomienda una PELÍCULA y una CANCIÓN que compartan un ADN emocional idéntico. Explica su conexión espiritual.
        FORMATO: ${outputFormat}`;
    }

    // 3. Call Gemini
    console.log(`Generating AI recommendation for mode: ${mode}...`);
    let recommendationText;

    try {
      recommendationText = await geminiGenerate(prompt, { temperature: 0.8 });
    } catch (err) {
      console.warn("Gemini failed, trying Groq fallback...");
      try {
        recommendationText = await groqGenerate(prompt);
      } catch (groqErr) {
        if (err.message === 'QUOTA_EXCEEDED') {
          return res.status(429).json({ error: 'Límite de cuota alcanzado en todos los proveedores. Inténtalo en unos minutos.' });
        }
        return res.status(503).json({ error: 'Servicios de IA temporalmente saturados.' });
      }
    }

    let recJSON;
    try {
      recJSON = JSON.parse(recommendationText);
    } catch (e) {
      return res.status(500).json({ error: 'Error parseando respuesta de IA' });
    }

    // 4. Enrich Results (Metadata fetch)
    const finalResult = { ...recJSON, poster_url: null, song_metadata: null };

    // Enrichment: Movie
    if (recJSON.pelicula) {
      try {
        const movieClean = recJSON.pelicula.replace(/\(\d{4}\)/g, '').trim();
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: { api_key: process.env.TMDB_API_KEY, query: movieClean, language: 'es-ES', page: 1 }
        });
        const mData = tmdbRes.data.results?.[0];
        if (mData) {
          finalResult.poster_url = `https://image.tmdb.org/t/p/w780${mData.poster_path}`;
          finalResult.sinopsis = mData.overview;
        }
      } catch (e) { console.warn("TMDB Enrichment failed"); }
    }

    // Enrichment: Song
    if (recJSON.cancion && (mode === 'song_from_movies' || mode === 'hybrid')) {
      try {
        if (req.spotifyToken) {
          const query = `${recJSON.cancion} ${recJSON.artista || ''}`.trim();
          const spotRes = await axios.get(`https://api.spotify.com/v1/search`, {
            params: { q: query, type: 'track', limit: 1 },
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
          });
          const track = spotRes.data.tracks?.items?.[0];
          if (track) {
            finalResult.song_metadata = {
              name: track.name,
              artist: track.artists[0].name,
              artwork: track.album.images[0]?.url,
              url: track.external_urls.spotify,
              preview: track.preview_url
            };
          }
        }
      } catch (e) { console.warn("Spotify Enrichment failed"); }
    }

    res.json(finalResult);

  } catch (error) {
    console.error('Recommendation Controller Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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

/**
 * Controller to generate recommendation based on a specific list of items.
 */
export const generateFromList = async (req, res) => {
  try {
    const { items = [], listName = "Mi Lista" } = req.body;

    if (items.length === 0) {
      return res.status(400).json({ error: 'La lista no tiene elementos para analizar.' });
    }

    const movies = items.filter(i => i.type === 'movie').map(m => `${m.title} ${m.subtitle ? '('+m.subtitle+')' : ''}`);
    const songs = items.filter(i => i.type === 'song' || i.type === 'album').map(s => `${s.title} por ${s.subtitle}`);

    let context = `LISTA: "${listName}"\n`;
    if (movies.length > 0) context += `Películas en la lista:\n- ${movies.join('\n- ')}\n\n`;
    if (songs.length > 0) context += `Canciones en la lista:\n- ${songs.join('\n- ')}\n\n`;

    const systemInstruction = `Eres un experto internacional en cine y música. 
El usuario ha creado una lista interdisciplinaria llamada "${listName}" que contiene películas y/o canciones.
Analiza profundamente la VIBRA, la estética, la narrativa, y el tono emocional de ESTA LISTA y recomienda UNA PELÍCULA EXACTA (que no esté ya en la lista) y UNA CANCIÓN EXACTA (que no esté en la lista) que encajen de forma magistral con la colección.
REGLA CRÍTICA: Debes devolver un JSON válido estrictamente en este formato:
{
  "vibra": "Análisis poético de la estética y sentimientos de esta lista.",
  "pelicula": "Título exacto de película",
  "cancion": "Título exacto de canción - Artista",
  "motivo": "Explicación de por qué son las adiciones perfectas para esta lista específica."
}`;

    let text;
    try {
      text = await geminiGenerate(`${systemInstruction}\n\n${context}`, { temperature: 0.8 });
    } catch (err) {
      console.warn("Gemini (list) failed, trying Groq fallback...");
      try {
        text = await groqGenerate(`${systemInstruction}\n\n${context}`);
      } catch (groqErr) {
        if (err.message === 'QUOTA_EXCEEDED') {
          return res.status(429).json({ error: 'Límite de cuota alcanzado. Espera unos minutos.' });
        }
        return res.status(503).json({ error: 'El servicio de IA está temporalmente saturado.' });
      }
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch(e) {
      jsonResponse = {
        vibra: "Error analizando la vibra",
        pelicula: "Interstellar",
        cancion: "Space Oddity - David Bowie",
        motivo: "Fallback"
      };
    }

    // Attempt to lookup the movie from TMDB for a poster if possible
    let movieTitle = jsonResponse.pelicula;
    const cleanTitle = movieTitle.replace(/\(\d{4}\)/g, '').trim();
    let posterUrl = null;

    try {
      if (movieTitle && process.env.TMDB_API_KEY) {
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: { api_key: process.env.TMDB_API_KEY, query: cleanTitle, language: 'es-ES', page: 1 }
        });
        if (tmdbRes.data.results && tmdbRes.data.results.length > 0) {
          const movieData = tmdbRes.data.results[0];
          if (movieData.poster_path) {
            posterUrl = `https://image.tmdb.org/t/p/w780${movieData.poster_path}`;
          }
        }
      }
    } catch (tmdbError) {
      console.error("TMDB Error inside generateFromList (non-fatal):", tmdbError.message);
    }

    if (posterUrl) jsonResponse.poster_url = posterUrl;

    res.json(jsonResponse);

  } catch (error) {
    console.error('List Recommendation API Error:', error);
    res.status(500).json({ error: 'Failed to generate list recommendation' });
  }
};
