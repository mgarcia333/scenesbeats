import axios from 'axios';
import { parseStringPromise } from 'xml2js';

/**
 * Fetch and parse Letterboxd RSS feed for a given username
 */
export const getLetterboxdRecent = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const rssUrl = `https://letterboxd.com/${username}/rss`;
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const xml = response.data;

    const result = await parseStringPromise(xml, { explicitArray: false });
    const items = result.rss.channel.item;

    // Normalize items (handling single item vs array)
    const itemList = Array.isArray(items) ? items : [items];

    // Filter only film watches (exclude lists or other items if any)
    const movies = itemList
      .filter(item => item['letterboxd:filmTitle']) 
      .map(item => {
        // Extract poster URL from description CDATA
        // Format: <p><img src="...url..."/></p>
        const description = item.description || '';
        const imgMatch = description.match(/src="([^"]+)"/);
        const poster = imgMatch ? imgMatch[1] : null;

        return {
          id: item.guid?._ || item.guid,
          title: item['letterboxd:filmTitle'],
          year: item['letterboxd:filmYear'],
          rating: item['letterboxd:memberRating'],
          watchedDate: item['letterboxd:watchedDate'],
          link: item.link,
          poster: poster,
          tmdbId: item['tmdb:movieId']
        };
      });

    res.json(movies);
  } catch (error) {
    console.error('Error fetching Letterboxd RSS:', error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Letterboxd user not found' });
    }
    res.status(500).json({ error: 'Failed to fetch Letterboxd data' });
  }
};
/**
 * Search movies using TMDB API
 */
export const searchMovies = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: query,
        language: 'es-ES',
        page: 1
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date?.split('-')[0] || 'N/A',
      rating: movie.vote_average ? (movie.vote_average / 2).toFixed(1) : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      overview: movie.overview
    }));

    res.json(movies);
  } catch (error) {
    console.error('TMDB Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Movie search failed' });
  }
};

/**
 * Get movie details from TMDB by ID
 */
export const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'es-ES'
      }
    });
    
    const movie = response.data;
    res.json({
      id: movie.id,
      title: movie.title,
      year: movie.release_date?.split('-')[0] || 'N/A',
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      overview: movie.overview,
      genres: movie.genres?.map(g => g.name),
      runtime: movie.runtime,
      tagline: movie.tagline
    });
  } catch (error) {
    console.error('TMDB Detail Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
};
/**
 * Search people (directors, actors) using TMDB API
 */
export const searchPeople = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/person`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: query,
        language: 'es-ES',
        page: 1
      }
    });

    const people = response.data.results.map(person => ({
      id: person.id,
      name: person.name,
      role: person.known_for_department,
      image: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null,
      known_for: person.known_for?.map(m => m.title || m.name).join(', ')
    }));

    res.json(people);
  } catch (error) {
    console.error('TMDB Person Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Person search failed' });
  }
};
