import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseStringPromise } from 'xml2js';
import { withRetry } from '../utils/aiUtils.js';
import { saveRecommendationHistory } from '../utils/laravel.js';

// Model fallback chain — tries in order until one succeeds
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

const geminiGenerate = async (prompt, generationConfig = {}) => {
  return await withRetry(async () => {
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
      
      // Categorize as quota if it fits
      const errMsg = err.message?.toLowerCase() || '';
      if (err.status === 429 || errMsg.includes('quota') || errMsg.includes('too many requests')) {
        const error = new Error('QUOTA_EXCEEDED');
        error.status = 429;
        throw error;
      }
      
      throw err;
    }
  }, { retries: 2, delay: 1500, context: "Gemini" });
};

/**
 * Calls Groq (Llama 3.3) as a robust fallback.
 */
const groqGenerate = async (prompt) => {
  return await withRetry(async () => {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing.');
    }

    console.log("🚀 Attempting Groq (Llama 3.3)...");
    
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
        },
        timeout: 25000 // 25s timeout for Groq
      });

      const text = response.data.choices[0].message.content;
      console.log("✅ Groq responded successfully.");
      return text;
    } catch (err) {
      console.error("❌ Groq Error:", err.response?.data || err.message);
      throw err;
    }
  }, { retries: 2, delay: 2000, context: "Groq" });
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
    const { mode = 'movie_from_music', lb_username, fav_movies = [], fav_songs = [], lang = 'es' } = req.body;

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

    // Localized labels and instructions
    const labels = {
      es: { favs: "FAVORITOS DEL USUARIO:", movies: "Películas", songs: "Canciones", system: "Eres un curator cultural de élite y experto en sinestesia audiovisual. Tu especialidad es encontrar el 'hilo invisible' que conecta una canción con una película. No te limites a géneros obvios; busca conexiones en la textura sonora, el ritmo narrativo, el tono emocional y la paleta de colores sugerida. Sé evocador, poético y muy preciso en tus referencias culturales.", rule: "Respuesta en JSON estricto, sin texto adicional. TODO el contenido de los campos 'vibra' y 'motivo' debe estar en ESPAÑOL." },
      en: { favs: "USER FAVORITES:", movies: "Movies", songs: "Songs", system: "You are an elite cultural curator and expert in audiovisual synesthesia. Your specialty is finding the 'invisible thread' that connects a song to a film. Don't limit yourself to obvious genres; look for connections in sonic texture, narrative rhythm, emotional tone, and suggested color palettes. Be evocative, poetic, and highly precise in your cultural references.", rule: "Strict JSON response, no additional text. ALL content in the 'vibra' and 'motivo' fields must be in ENGLISH." },
      ca: { favs: "PREFERITS DE L'USUARI:", movies: "Pel·lícules", songs: "Cançons", system: "Ets un curador cultural d'elit i expert en sinestèsia audiovisual. La teva especialitat és trobar el 'fil invisible' que connecta una cançó amb una pel·lícula. No et limitis a gèneres obvis; busca connexions en la textura sonora, el ritme narratiu, el to emocional i la paleta de colors suggerida. Sigues evocador, poètic i molt precís en les teves referències culturals.", rule: "Resposta en JSON estricte, sense text addicional. TOT el contingut dels camps 'vibra' i 'motivo' ha d'estar en CATALÀ." }
    };

    const l = labels[lang] || labels.es;

    if (fav_movies.length > 0 || fav_songs.length > 0) {
      favoritesContext = `${l.favs}\n`;
      if (fav_movies.length > 0) favoritesContext += `- ${l.movies}: ${fav_movies.map(m => m.title).join(', ')}\n`;
      if (fav_songs.length > 0) favoritesContext += `- ${l.songs}: ${fav_songs.map(s => s.title).join(', ')}\n`;
    }

    // 2. Construct Dynamic Prompt
    const baseSystem = `${l.system}\nREGLA DE ORO: ${l.rule}`;
    
    let prompt = "";
    let outputFormat = "";

    const tasks = {
      es: {
        movie_from_music: "Analiza la 'vibra' de la música que el usuario escucha (ritmo, tempo, sentimientos). Recomienda UNA película que capture esa misma energía de forma magistral.",
        movie_from_movies: "Analiza patrones de directores, estéticas y temas. Recomienda una PELÍCULA que profundice en sus gustos de forma sorprendente.",
        song_from_movies: "Imagina la banda sonora ideal para las películas favoritas del usuario. Recomienda UNA canción exacta que podría sonar en los créditos de su vida.",
        hybrid: "Crea una 'Experiencia Completa'. Recomienda una PELÍCULA y una CANCIÓN que compartan un ADN emocional idéntico. Explica su conexión espiritual."
      },
      en: {
        movie_from_music: "Analyze the 'vibe' of the music the user listens to (rhythm, tempo, feelings). Recommend ONE movie that masterfully captures that same energy.",
        movie_from_movies: "Analyze patterns of directors, aesthetics, and themes. Recommend a MOVIE that delves into their tastes in a surprising way.",
        song_from_movies: "Imagine the ideal soundtrack for the user's favorite movies. Recommend ONE exact song that could play in the credits of their life.",
        hybrid: "Create a 'Full Experience'. Recommend a MOVIE and a SONG that share an identical emotional DNA. Explain their spiritual connection."
      },
      ca: {
        movie_from_music: "Analitza la 'vibra' de la música que l'usuari escolta (ritme, tempo, sentiments). Recomana UNA pel·lícula que capti aquesta mateixa energia de forma magistral.",
        movie_from_movies: "Analitza patrons de directors, estètiques i temes. Recomana una PEL·LÍCULA que aprofundeixi en els seus gustos de forma sorprenent.",
        song_from_movies: "Imagina la banda sonora ideal per a les pel·lícules preferides de l'usuari. Recomana UNA cançó exacta que podria sonar als crèdits de la seva vida.",
        hybrid: "Crea una 'Experiència Completa'. Recomana una PEL·LÍCULA i una CANÇÓ que comparteixin un ADN emocional idèntic. Explica la seva connexió espiritual."
      }
    };

    const t = tasks[lang] || tasks.es;

    if (mode === 'movie_from_music') {
      outputFormat = `{"vibra": "Breve descripción poética de la conexión", "pelicula": "Título exacto", "motivo": "Explicación magistral y detallada de por qué encajan"}`;
      prompt = `${baseSystem}
        HISTORIAL MUSICAL RECIENTE DEL USUARIO:
        ${trackContext || "Básate en la esencia de sus favoritos detallados abajo."}
        ${favoritesContext}
        
        TAREA: ${t.movie_from_music}
        FORMATO: ${outputFormat}`;
    } 
    else if (mode === 'movie_from_movies') {
      outputFormat = `{"vibra": "...", "pelicula": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        HISTORIAL CINEMATOGRÁFICO:
        ${movieContext || "No disponible."}
        ${favoritesContext}
        
        TAREA: ${t.movie_from_movies}
        FORMATO: ${outputFormat}`;
    }
    else if (mode === 'song_from_movies') {
      outputFormat = `{"vibra": "...", "cancion": "...", "artista": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        CONTEXTO CINEMATOGRÁFICO:
        ${movieContext || "No disponible."}
        ${favoritesContext}
        
        TAREA: ${t.song_from_movies}
        FORMATO: ${outputFormat}`;
    }
    else if (mode === 'hybrid') {
      outputFormat = `{"vibra": "...", "pelicula": "...", "cancion": "...", "artista": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        CONTEXTO INTEGRADO:
        Música reciente: ${trackContext || "N/A"}
        Cine reciente: ${movieContext || "N/A"}
        ${favoritesContext}
        
        TAREA: ${t.hybrid}
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
      console.warn("AI JSON parse failed, using fallback...");
      recJSON = {
        vibra: "Escena de alta intensidad emocional y estética.",
        pelicula: "Eternal Sunshine of the Spotless Mind",
        cancion: "Everything in Its Right Place - Radiohead",
        motivo: "La IA tuvo un pequeño lapsus, pero esta conexión es infalible para cualquier amante de la buena música y cine."
      };
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

    if (req.body.userId) {
      const recsToSave = [];
      if (finalResult.pelicula) {
        recsToSave.push({
          type: 'movie',
          titulo: finalResult.pelicula,
          image_url: finalResult.poster_url,
          motivo: finalResult.motivo
        });
      }
      if (finalResult.cancion) {
        recsToSave.push({
          type: 'song',
          titulo: finalResult.song_metadata?.name || finalResult.cancion,
          subtitulo: finalResult.song_metadata?.artist || finalResult.artista,
          image_url: finalResult.song_metadata?.artwork,
          motivo: finalResult.motivo
        });
      }
      saveRecommendationHistory(req.body.userId, recsToSave).catch(console.error);
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
    const { items = [], listName = "Mi Lista", lang = 'es' } = req.body;

    if (items.length === 0) {
      return res.status(400).json({ error: 'La lista no tiene elementos para analizar.' });
    }

    const movies = items.filter(i => i.type === 'movie').map(m => `${m.title} ${m.subtitle ? '('+m.subtitle+')' : ''}`);
    const songs = items.filter(i => i.type === 'song' || i.type === 'album').map(s => `${s.title} por ${s.subtitle}`);

    let context = `LISTA: "${listName}"\n`;
    if (movies.length > 0) context += `Películas en la lista:\n- ${movies.join('\n- ')}\n\n`;
    if (songs.length > 0) context += `Canciones en la lista:\n- ${songs.join('\n- ')}\n\n`;

    const instructions = {
      es: `Eres un experto internacional en cine y música. El usuario ha creado una lista interdisciplinaria llamada "${listName}". Analiza profundamente la VIBRA, estética y tono emocional de ESTA LISTA y recomienda UNA PELÍCULA EXACTA y UNA CANCIÓN EXACTA que encajen magistralmente. Responde en JSON estricto. TODO el contenido de 'vibra' y 'motivo' debe estar en ESPAÑOL.`,
      en: `You are an international expert in cinema and music. The user has created an interdisciplinary list called "${listName}". Deeply analyze the VIBE, aesthetics, and emotional tone of THIS LIST and recommend ONE EXACT MOVIE and ONE EXACT SONG that fit masterfully. Respond in strict JSON. ALL content in 'vibra' and 'motivo' must be in ENGLISH.`,
      ca: `Ets un expert internacional en cinema i música. L'usuari ha creat una llista interdisciplinària anomenada "${listName}". Analitza profundament la VIBRA, l'estètica i el to emocional d'AQUESTA LLISTA i recomana UNA PEL·LÍCULA EXACTA i UNA CANÇÓ EXACTA que hi encaixin magistralment. Respon en JSON estricte. TOT el contingut de 'vibra' i 'motivo' ha d'estar en CATALÀ.`
    };

    const systemInstruction = instructions[lang] || instructions.es;

    const outputFormat = `
{
  "vibra": "Análisis poético de la estética y sentimientos de esta lista.",
  "pelicula": "Título exacto de película",
  "cancion": "Título exacto de canción - Artista",
  "motivo": "Explicación de por qué son las adiciones perfectas para esta lista específica."
}`;

    let text;
    try {
      text = await geminiGenerate(`${systemInstruction}\n\n${context}\nFORMATO JSON:\n${outputFormat}`, { temperature: 0.8 });
    } catch (err) {
      console.warn("Gemini (list) failed, trying Groq fallback...");
      try {
        text = await groqGenerate(`${systemInstruction}\n\n${context}\nFORMATO JSON:\n${outputFormat}`);
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

    if (req.body.userId) {
      const recsToSave = [];
      if (jsonResponse.pelicula) {
        recsToSave.push({
          type: 'movie',
          titulo: jsonResponse.pelicula,
          image_url: jsonResponse.poster_url,
          motivo: jsonResponse.motivo
        });
      }
      if (jsonResponse.cancion) {
        let titleParts = jsonResponse.cancion.split('-');
        recsToSave.push({
          type: 'song',
          titulo: titleParts[0]?.trim() || jsonResponse.cancion,
          subtitulo: titleParts[1]?.trim() || null,
          motivo: jsonResponse.motivo
        });
      }
      saveRecommendationHistory(req.body.userId, recsToSave).catch(console.error);
    }

    res.json(jsonResponse);

  } catch (error) {
    console.error('List Recommendation API Error:', error);
    res.status(500).json({ error: 'Failed to generate list recommendation' });
  }
};

/**
 * Controller to "Complete" a playlist with multiple related items.
 */
export const completePlaylist = async (req, res) => {
  try {
    const { items = [], listName = "Mi Lista", lang = 'es' } = req.body;

    if (items.length === 0) {
      return res.status(400).json({ error: 'La lista está vacía.' });
    }

    const movies = items.filter(i => i.type === 'movie').map(m => `${m.title}`);
    const songs = items.filter(i => i.type === 'song').map(s => `${s.title} - ${s.subtitle}`);

    let context = `CONTENIDO ACTUAL DE LA LISTA "${listName}":\n`;
    if (movies.length > 0) context += `- Películas: ${movies.join(', ')}\n`;
    if (songs.length > 0) context += `- Canciones: ${songs.join(', ')}\n`;

    const instructions = {
      es: `Eres un curador cultural experto. El usuario tiene esta lista y quiere COMPLETARLA con más contenido. Tu misión es encontrar 5 películas y 5 canciones adicionales (10 en total) que expandan este universo estético de forma coherente, diversa y sorprendente. Evita repetir títulos ya presentes en la lista. Responde en JSON estricto.`,
      en: `You are an expert cultural curator. The user has this list and wants to COMPLETE it with more content. Your mission is to find 5 additional movies and 5 additional songs (10 total) that expand this aesthetic universe coherently, diversely, and surprisingly. Avoid repeating titles already in the list. Respond in strict JSON.`,
      ca: `Ets un curador cultural expert. L'usuari té aquesta llista i vol COMPLETAR-LA amb més contingut. La teva missió és trobar 5 pel·lícules i 5 cançons addicionals (10 en total) que cultivin aquest univers estètic de forma coherent, diversa i sorprenent. Evita repetir títols ja presents a la llista. Respon en JSON estricte.`
    };

    const sys = instructions[lang] || instructions.es;

    const outputFormat = `
{
  "vibra": "Breve análisis de la esencia de la lista",
  "recomendaciones": [
    {"titulo": "Título exacto", "subtitulo": "Año o Artista", "tipo": "movie", "motivo": "Por qué encaja"},
    {"titulo": "Título exacto", "subtitulo": "Artista", "tipo": "song", "motivo": "Por qué encaja"},
    ... (exactamente 10 elementos: 5 movies + 5 songs, alternados)
  ]
}`;

    let text;
    try {
      text = await geminiGenerate(`${sys}\n\n${context}\nFORMATO JSON:\n${outputFormat}`, { temperature: 0.85 });
    } catch (err) {
      text = await groqGenerate(`${sys}\n\n${context}\nFORMATO JSON:\n${outputFormat}`);
    }

    const result = JSON.parse(text);

    // Enrich recommendations with posters/metadata
    const enrichedRecs = await Promise.all(result.recomendaciones.map(async (rec) => {
      if (rec.tipo === 'movie') {
        try {
          const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: process.env.TMDB_API_KEY, query: rec.titulo, language: 'es-ES', page: 1 }
          });
          const m = tmdbRes.data.results?.[0];
          if (m) {
            rec.image_url = `https://image.tmdb.org/t/p/w780${m.poster_path}`;
            rec.external_id = String(m.id);
            if (!rec.subtitulo) rec.subtitulo = m.release_date?.split('-')[0];
          }
        } catch (e) {}
      } else if (rec.tipo === 'song' && req.spotifyToken) {
        try {
          const spotRes = await axios.get(`https://api.spotify.com/v1/search`, {
            params: { q: `${rec.titulo} ${rec.subtitulo}`, type: 'track', limit: 1 },
            headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
          });
          const t = spotRes.data.tracks?.items?.[0];
          if (t) {
            rec.image_url = t.album.images[0]?.url;
            rec.external_id = t.id;
          }
        } catch (e) {}
      }
      return rec;
    }));

    if (req.body.userId) {
      saveRecommendationHistory(req.body.userId, enrichedRecs).catch(console.error);
    }

    res.json({ vibra: result.vibra, recomendaciones: enrichedRecs });

  } catch (error) {
    console.error('Complete Playlist Error:', error);
    res.status(500).json({ error: 'Error al completar la lista' });
  }
};
