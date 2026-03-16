# Scenes & Beats

Scenes & Beats is a web application that recommends movies based on your current musical mood on Spotify, powered by Google Gemini AI.

## Key Features

- **Spotify Integration**: Connect your Spotify account to analyze your recently played tracks.
- **AI Recommendations**: Uses Google Gemini (gemini-2.5-flash) to find the perfect movie vibe.
- **Movie Details**: Integration with TMDB to show synopses and posters.
- **Real-time Updates**: Socket.IO integration for live interactions.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express, Socket.IO.
- **AI**: Google Generative AI (Gemini).
- **APIs**: Spotify API, TMDB API.

## Project Structure

```text
├── client/          # React frontend
├── server/          # Node.js backend
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (optional)
- Spotify Developer Account (for Client ID/Secret)
- Google AI Studio Key (for Gemini)
- TMDB API Key

### Manual Setup

1. **Clone the repository**
2. **Server Configuration**:
   ```bash
   cd server
   cp .env.example .env
   # Update .env with your credentials
   npm install
   npm start
   ```
3. **Client Configuration**:
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

### Setup with Docker

```bash
docker-compose up --build
```

## Testing

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

## License

MIT
