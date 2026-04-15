import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseStringPromise } from 'xml2js';
import { withRetry } from '../utils/aiUtils.js';
import { saveRecommendationHistory } from '../utils/laravel.js';

// Default model for Google Generative AI
const PRIMARY_MODEL = 'gemini-2.0-flash';

const geminiGenerate = async (prompt, generationConfig = {}) => {
  return await withRetry(async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = generationConfig.model || PRIMARY_MODEL;

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

      const responseText = result.response.text();
      
      // Robust JSON extraction
      let text = responseText;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0].trim();
      } else {
        text = responseText.replace(/```json|```/gi, '').trim();
      }
      
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
    const { mode = 'movie_from_music', lb_username, all_favorites, lang = 'es' } = req.body;

    let trackContext = "";
    let movieContext = "";
    let favoritesContext = "";

    const favs = all_favorites || { movies: [], songs: [], albums: [], artists: [], actors: [], directors: [] };

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

    // Localized labels
    const labels = {
      es: { 
        favs: "MIS FAVORITOS (Información clave del perfil del usuario):", 
        movies: "Películas favoritas", 
        songs: "Canciones favoritas", 
        albums: "Álbumes favoritos",
        artists: "Artistas favoritos",
        actors: "Actores favoritos",
        directors: "Directores favoritos",
        system: `Eres "The Alchemist of Art", un curador cultural de élite y experto en sinestesia audiovisual con profundo conocimiento de cine mundial, música clásica, rock alternativo, jazz, y audiencias diversas. Tu misión es crear conexiones profundas y significativas entre todos los elementos del perfil del usuario (películas, música, actores, directores).
        
        DIRECTRICES DE CURACIÓN EXHAUSTIVA:
        1. ANÁLISIS MULTIDIMENSIONAL: Analiza TODOS los favoritos del usuario (no solo películas o canciones). Considera:
           - Los directores que admira (estilo visual, temáticas recurrentes)
           - Los actores que elige (tipo de personajes, rango dramático)
           - Los géneros musicales y artistas (sonido, lyrics, era)
        2. PATRONES CRUZADOS: Busca conexiones意想不到 entre cine y música. ¿Sus directores favoritos tienen bandas sonoras icónicas? ¿Sus actores actúan en películas con bandas sonoras memorables?
        3. PROFUNDIDAD: No recomiendes algo genérico. La recomendación debe sentir que fue hecha por alguien que ENTIENDE sus gustos profundamente.
        4. DIVERSIDAD EXTRAPLATAFORMA: Busca en todo el espectro - películas indie, clásicos, international, documentales, series, libros adaptada, etc.
        5. CALIDAD SOBE CANTIDAD: Una recomendación perfecta vale más que 10 genéricas.`,
        rule: "Respuesta en JSON estricto, sin texto adicional fuera del JSON. Los campos 'vibra' y 'motivo' deben estar en ESPAÑOL profesional." 
      },
      en: { 
        favs: "MY FAVORITES (Key profile information):", 
        movies: "Favorite movies", 
        songs: "Favorite songs", 
        albums: "Favorite albums",
        artists: "Favorite artists",
        actors: "Favorite actors",
        directors: "Favorite directors",
        system: `You are "The Alchemist of Art", an elite cultural curator and audiovisual synesthesia expert with deep knowledge of world cinema, classical music, alternative rock, jazz, and diverse audiences. Your mission is to create deep and meaningful connections between ALL elements in the user's profile (movies, music, actors, directors).
        
        EXHAUSTIVE CURATION GUIDELINES:
        1. MULTIDIMENSIONAL ANALYSIS: Analyze ALL user favorites (not just movies or songs). Consider:
           - Directors they admire (visual style, recurring themes)
           - Actors they choose (character types, dramatic range)
           - Music genres and artists (sound, lyrics, era)
        2. CROSS-PATTERNS: Look for unexpected connections between cinema and music. Do their favorite directors have iconic soundtracks? Do their actors star in movies with memorable scores?
        3. DEPTH: Don't recommend something generic. The recommendation should feel like it was made by someone who DEEPLY UNDERSTANDS their tastes.
        4. EXTRA-PLATFORM DIVERSITY: Look across the entire spectrum - indie films, classics, international, documentary, TV adaptations, etc.
        5. QUALITY OVER QUANTITY: One perfect recommendation is worth more than 10 generic ones.`,
        rule: "Strict JSON response, no additional text outside the JSON. The 'vibra' and 'motivo' fields must be in professional ENGLISH." 
      },
      ca: { 
        favs: "ELS MEUS PREFERITS (Informació clau del perfil de l'usuari):", 
        movies: "Pel·lícules preferides", 
        songs: "Cançons preferides", 
        albums: "Àlbums preferits",
        artists: "Artistes preferits",
        actors: "Actors preferits",
        directors: "Directors preferits",
        system: `Ets "The Alchemist of Art", un curador cultural d'elit i expert en sinestèsia audiovisual amb profund coneixement de cinema mundial, música clàssica, rock alternatiu, jazz, i audiències diverses. La teva missió és crear connexions profundes i significatives entre TOTS els elements del perfil de l'usuari (pel·lícules, música, actors, directors).
        
        DIRECTRIUS DE CURACIÓ EXHAUSTIVA:
        1. ANÀLISI MULTIDIMENSIONAL: Analitza TOTS els preferits de l'usuari (no només pel·lícules o cançons). Considera:
           - Directors que admira (estil visual, temàtiques recurrents)
           - Actors que tria (tipus de personatges, rang dramàtic)
           - Gèneres musicals i artistes (so, lletres, era)
        2. PATRONS CREUATS: Busca connexions inesperades entre cinema i música. Els seus directors preferits tenen bandes sonores icòniques? Els seus actors actuen en pel·lícules amb bandes sonores memorables?
        3. PROFUNDITAT: No recomanis res genèric. La recomanació hauria de semblar feta per algú que ENTÈN profundament els seus gustos.
        4. DIVERSITAT EXTRA-PLATAFORMA: Busca a tot l'espectre - cinema independent, clàssics, internacionals, documentals, adaptacions, etc.
        5. QUALITAT SOBRE QUANTITAT: Una recomanació perfecta val més que 10 genèriques.`,
        rule: "Resposta en JSON estricte, sense text addicional fora del JSON. Els camps 'vibra' i 'motivo' han d'estar en CATALÀ professional." 
      }
    };

    const l = labels[lang] || labels.es;

    // Build comprehensive favorites context
    const hasFavorites = favs.movies?.length > 0 || favs.songs?.length > 0 || favs.albums?.length > 0 || 
                         favs.artists?.length > 0 || favs.actors?.length > 0 || favs.directors?.length > 0;
    
    if (hasFavorites) {
      favoritesContext = `${l.favs}\n`;
      if (favs.movies?.length > 0) favoritesContext += `- ${l.movies}: ${favs.movies.map(m => m.title).join(', ')}\n`;
      if (favs.songs?.length > 0) favoritesContext += `- ${l.songs}: ${favs.songs.map(s => s.title).join(', ')}\n`;
      if (favs.albums?.length > 0) favoritesContext += `- ${l.albums}: ${favs.albums.map(a => a.title).join(', ')}\n`;
      if (favs.artists?.length > 0) favoritesContext += `- ${l.artists}: ${favs.artists.map(a => a.title).join(', ')}\n`;
      if (favs.actors?.length > 0) favoritesContext += `- ${l.actors}: ${favs.actors.map(a => a.title).join(', ')}\n`;
      if (favs.directors?.length > 0) favoritesContext += `- ${l.directors}: ${favs.directors.map(d => d.title).join(', ')}\n`;
    }

    // 2. Construct Dynamic Prompt
    const blacklist = [
      ...(favs.movies?.map(m => m.title) || []),
      ...(favs.songs?.map(s => s.title) || []),
      ...(favs.albums?.map(a => a.title) || []),
      ...(favs.artists?.map(a => a.title) || []),
      ...(favs.actors?.map(a => a.title) || []),
      ...(favs.directors?.map(d => d.title) || [])
    ].filter(Boolean);

    const blacklistText = blacklist.length > 0 
      ? `🚫 LISTA NEGRA (ESTRICTAMENTE PROHIBIDO RECOMENDAR ESTOS TÍTULOS O NOMBRES):\n- ${blacklist.slice(0, 50).join('\n- ')}`
      : "";

    const baseSystem = `${l.system}
    
    REGLA DE ORO DE DESCUBRIMIENTO:
    1. ${l.rule}
    2. NUNCA, bajo ninguna circunstancia, recomiendes algo que ya esté en "MIS FAVORITOS" o en la "LISTA NEGRA". 
    3. Si recomiendas algo que el usuario ya tiene marcado, habrás fallado en tu misión. Buscamos descubrimiento, no repetición.
    4. ASEGÚRATE de que el título recomendado sea una obra (película o canción) y NO una persona (como un director o actor). Es un error crítico recomendar a "Stanley Kubrick" en lugar de una de sus películas.`;
    
    let prompt = "";
    let outputFormat = "";

    const tasks = {
      es: {
        movie_from_music: "Analiza la 'vibra' de la música que el usuario escucha (ritmo, tempo, sentimientos). Recomienda UNA película NUEVA que capture esa misma energía de forma magistral.",
        movie_from_movies: "Analiza patrones de directores, estéticas y temas. Recomienda una PELÍCULA SORPRENDENTE que el usuario no conozca.",
        song_from_movies: "Imagina la banda sonora ideal para las películas favoritas del usuario. Recomienda UNA canción exacta que sea un descubrimiento para el usuario.",
        hybrid: "Crea una 'Experiencia Completa'. Recomienda una PELÍCULA y una CANCIÓN nuevas que compartan un ADN emocional idéntico. Explica su conexión espiritual."
      },
      en: {
        movie_from_music: "Analyze the 'vibe' of the music the user listens to (rhythm, tempo, feelings). Recommend ONE NEW movie that masterfully captures that same energy.",
        movie_from_movies: "Analyze patterns of directors, aesthetics, and themes. Recommend a SURPRISING MOVIE that the user doesn't know.",
        song_from_movies: "Imagine the ideal soundtrack for the user's favorite movies. Recommend ONE exact song that is a discovery for the user.",
        hybrid: "Create a 'Full Experience'. Recommend a NEW MOVIE and a NEW SONG that share an identical emotional DNA. Explain their spiritual connection."
      },
      ca: {
        movie_from_music: "Analitza la 'vibra' de la música que l'usuari escolta (ritme, tempo, sentiments). Recomana UNA pel·lícula NOVA que capti aquesta mateixa energia de forma magistral.",
        movie_from_movies: "Analitza patrons de directors, estètiques i temes. Recomana una PEL·LÍCULA SORPRENENT que l'usuari no conegui.",
        song_from_movies: "Imagina la banda sonora ideal per a les pel·lícules preferides de l'usuari. Recomana UNA cançó exacta que sigui un descobriment per a l'usuari.",
        hybrid: "Crea una 'Experiència Completa'. Recomana una PEL·LÍCULA NOVA i una CANÇÓ NOVA que comparteixin un ADN emocional idèntic. Explica la seva connexió espiritual."
      }
    };

    const t = tasks[lang] || tasks.es;

    if (mode === 'movie_from_music') {
      outputFormat = `{"vibra": "Breve descripción poética de la conexión", "pelicula": "Título exacto", "motivo": "Explicación magistral y detallada de por qué encajan"}`;
      prompt = `${baseSystem}
        HISTORIAL MUSICAL RECIENTE DEL USUARIO:
        ${trackContext || "Básate en la esencia de sus favoritos detallados abajo."}
        ${favoritesContext}
        ${blacklistText}
        
        TAREA: ${t.movie_from_music}
        FORMATO: ${outputFormat}`;
    } 
    else if (mode === 'movie_from_movies') {
      outputFormat = `{"vibra": "...", "pelicula": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        HISTORIAL CINEMATOGRÁFICO:
        ${movieContext || "No disponible."}
        ${favoritesContext}
        ${blacklistText}
        
        TAREA: ${t.movie_from_movies}
        FORMATO: ${outputFormat}`;
    }
    else if (mode === 'song_from_movies') {
      outputFormat = `{"vibra": "...", "cancion": "...", "artista": "...", "motivo": "..."}`;
      prompt = `${baseSystem}
        CONTEXTO CINEMATOGRÁFICO:
        ${movieContext || "No disponible."}
        ${favoritesContext}
        ${blacklistText}
        
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
        ${blacklistText}
        
        TAREA: ${t.hybrid}
        FORMATO: ${outputFormat}`;
    }

    // 3. Call AI (Gemini 2.0 Flash -> Groq Fallback)
    console.log(`Generating AI recommendation for mode: ${mode}...`);
    let recommendationText;

    try {
      recommendationText = await geminiGenerate(prompt, { temperature: 0.8 });
    } catch (err) {
      console.warn("Gemini failed, trying Groq fallback...");
      try {
        recommendationText = await groqGenerate(prompt);
      } catch (groqErr) {
        return res.status(503).json({ error: 'Servicios de IA temporalmente saturados.' });
      }
    }

    let recJSON;
    const maxRetries = 2;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        recJSON = JSON.parse(recommendationText);
        break; // Success
      } catch (e) {
        attempts++;
        console.warn(`Attempt ${attempts} - AI JSON parse failed. Raw Text Sample:`, recommendationText?.slice(0, 100));
        
        if (attempts < maxRetries) {
          console.log("Retrying with stricter JSON instruction...");
          const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Please provide ONLY the JSON object, NO markdown, NO text.`;
          try {
            recommendationText = await geminiGenerate(retryPrompt, { temperature: 0.5 });
          } catch (err) {
            recommendationText = await groqGenerate(retryPrompt);
          }
        } else {
          console.error("Final parse attempt failed. Using fallback.");
          recJSON = {
            vibra: "Escena de alta intensidad emocional y estética.",
            pelicula: "Eternal Sunshine of the Spotless Mind",
            cancion: "Everything in Its Right Place - Radiohead",
            motivo: "La IA tuvo un pequeño lapsus agotando los reintentos, pero esta conexión es infalible."
          };
        }
      }
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

    const movies = items.filter(i => i.type === 'movie').map(m => `${m.title}`);
    const songs = items.filter(i => i.type === 'song' || i.type === 'album').map(s => `${s.title} por ${s.subtitle}`);

    let context = `CONTENIDO ACTUAL DE LA LISTA: "${listName}"\n`;
    if (movies.length > 0) context += `Películas ya presentes: ${movies.join(', ')}\n`;
    if (songs.length > 0) context += `Canciones ya presentes: ${songs.join(', ')}\n`;

    const instructions = {
      es: `Eres un experto internacional en cine y música. El usuario ha creado una lista interdisciplinaria llamada "${listName}". 
      TAREA: Analiza profundamente la VIBRA, estética y tono emocional de ESTA LISTA y recomienda UNA PELÍCULA EXACTA y UNA CANCIÓN EXACTA que expandan este universo.
      REGLA DE ORO: No puedes recomendar NINGÚN título que ya esté en el CONTENIDO ACTUAL DE LA LISTA. Buscamos descubrimiento.
      Responde en JSON estricto. TODO el contenido de 'vibra' y 'motivo' debe estar en ESPAÑOL.`,
      
      en: `You are an international expert in cinema and music. The user has created an interdisciplinary list called "${listName}". 
      TASK: Deeply analyze the VIBE, aesthetics, and emotional tone of THIS LIST and recommend ONE EXACT MOVIE and ONE EXACT SONG that expand this universe.
      GOLDEN RULE: You cannot recommend ANY title already in the CURRENT CONTENT OF THE LIST. We seek discovery.
      Respond in strict JSON. ALL content in 'vibra' and 'motivo' must be in ENGLISH.`,
      
      ca: `Ets un expert internacional en cinema i música. L'usuari ha creat una llista interdisciplinària anomenada "${listName}". 
      TASCA: Analitza profundament la VIBRA, l'estètica i el to emocional d'AQUESTA LLISTA i recomana UNA PEL·LÍCULA EXACTA i UNA CANÇÓ EXACTA que ampliïn aquest univers.
      REGLA D'OR: No pots recomanar CAP títol que ja estigui al CONTINGUT ACTUAL DE LA LLISTA. Busquem descobriment.
      Respon en JSON estricte. TOT el contingut de 'vibra' i 'motivo' ha d'estar en CATALÀ.`
    };

    const systemInstruction = instructions[lang] || instructions.es;

    const outputFormat = `
{
  "vibra": "Análisis poético de la estética y sentimientos de esta lista.",
  "pelicula": "Título exacto de película NUEVA",
  "cancion": "Título exacto de canción NUEVA - Artista",
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

    // Enrichment: Song
    if (jsonResponse.cancion && req.spotifyToken) {
      try {
        const query = jsonResponse.cancion;
        const spotRes = await axios.get(`https://api.spotify.com/v1/search`, {
          params: { q: query, type: 'track', limit: 1 },
          headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
        });
        const track = spotRes.data.tracks?.items?.[0];
        if (track) {
          jsonResponse.song_metadata = {
            name: track.name,
            artist: track.artists[0].name,
            artwork: track.album.images[0]?.url,
            url: track.external_urls.spotify,
            preview: track.preview_url
          };
        }
      } catch (e) { 
        console.warn("Spotify Enrichment (list) failed:", e.message); 
      }
    }

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
          titulo: jsonResponse.song_metadata?.name || titleParts[0]?.trim() || jsonResponse.cancion,
          subtitulo: jsonResponse.song_metadata?.artist || titleParts[1]?.trim() || null,
          image_url: jsonResponse.song_metadata?.artwork,
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
    const { items = [], listName = "Mi Lista", lang = 'es', excludeTitles = [] } = req.body;

    if (items.length === 0) {
      return res.status(400).json({ error: 'La lista está vacía.' });
    }

    const movies = items.filter(i => i.type === 'movie').map(m => `${m.title}`);
    const songs = items.filter(i => i.type === 'song').map(s => `${s.title} - ${s.subtitle}`);

    let context = `CONTENIDO ACTUAL DE LA LISTA "${listName}":\n`;
    if (movies.length > 0) context += `- Películas: ${movies.join(', ')}\n`;
    if (songs.length > 0) context += `- Canciones: ${songs.join(', ')}\n`;
    
    // Add previously shown recommendations to exclude
    if (excludeTitles.length > 0) {
      context += `\nTÍTULOS YA RECOMENDADOS ANTERIORMENTE (NO recomendar de nuevo): ${excludeTitles.join(', ')}\n`;
    }

const instructions = {
      es: `Eres un curador cultural experto. El usuario tiene esta lista y quiere COMPLETARLA con más contenido. 
      TAREAS: 
      1. Encuentra 5 películas y 5 canciones adicionales (10 en total) que expandan este universo estético.
      2. REGLA DE ORO: Tienes PROHIBIDO recomendar títulos que ya aparezcan en el CONTENIDO ACTUAL DE LA LISTA O EN LOS YA RECOMENDADOS ANTERIORMENTE. 
      3. Asegura diversidad y sorpresa. Responde en JSON estricto.`,

      en: `You are an expert cultural curator. The user has this list and wants to COMPLETE it with more content. 
      TASKS: 
      1. Find 5 additional movies and 5 additional songs (10 total) that expand this aesthetic universe.
      2. GOLDEN RULE: You are FORBIDDEN from recommending titles that already appear in the CURRENT CONTENT OF THE LIST OR IN PREVIOUSLY SHOWN RECOMMENDATIONS. 
      3. Ensure diversity and surprise. Respond in strict JSON.`,

      ca: `Ets un curador cultural expert. L'usuari té aquesta llista i vol COMPLETAR-LA amb més contingut. 
      TASQUES: 
      1. Troba 5 pel·lícules i 5 cançons addicionals (10 en total) que cultivin aquest univers estètic.
      2. REGLA D'OR: Tens PROHIBIT recomanar títols que ja apareguin al CONTINGUT ACTUAL DE LA LLISTA O EN RECOMANACIONS MOSTRADES ANTERIORMENT. 
      3. Assegura diversitat i sorpresa. Respon en JSON estricte.`
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
