import express from 'express';
import { getLetterboxdRecent, searchMovies, getMovieDetails } from '../controllers/movieController.js';

const router = express.Router();

/**
 * @route   GET /api/movie/search
 * @desc    Search movies via TMDB
 * @access  Public
 */
router.get('/search', searchMovies);

/**
 * @route   GET /api/movie/letterboxd/:username
 * @desc    Fetch recent watches from Letterboxd RSS
 * @access  Public
 */
router.get('/letterboxd/:username', getLetterboxdRecent);

/**
 * @route   GET /api/movie/:id
 * @desc    Get movie details by ID
 * @access  Public
 */
router.get('/:id', getMovieDetails);

export default router;
