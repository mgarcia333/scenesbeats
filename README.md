# ScenesBeats - Platform Documentation

ScenesBeats is a high-performance, social media platform designed for media enthusiasts. It integrates real-time interactions, collaborative media management, and advanced AI-driven recommendation engines to provide a unique social experience around cinema and music.

## Production Environment

The platform is deployed and accessible via the following entry points:

- **Frontend Application**: [https://scenesbeats.com](https://scenesbeats.com)

## Technical Architecture

The system follows a modern microservices-inspired architecture designed for scalability and real-time responsiveness:

### 1. REST API Layer (Laravel 11)

- **Role**: Core business logic, data persistence, and user authentication.
- **Technology**: PHP 8.2+, Laravel 11.
- **Responsibilities**:
  - Manage User Profiles and Social Graphs (Friendships).
  - CRUD operations for Media Lists and Favorites.
  - Transactional data management.
  - Triggering real-time broadcasts via the Node.js bridge.

### 2. Real-Time & Integration Layer (Node.js)

- **Role**: State management for active users, Spotify synchronization, and WebSocket broadcasting.
- **Technology**: Node.js 20+, Express, Socket.io.
- **Responsibilities**:
  - Managing persistent WebSocket connections.
  - Real-time internal broadcasting engine (Internal API Bridge).
  - Spotify playback monitoring and status updates.
  - AI Recommendation processing offloading.

### 3. Intelligence Engine (Google Gemini AI)

- **Role**: Advanced data analysis for personalized recommendations.
- **Technology**: Google Generative AI (Gemini 2.5 Flash).
- **Functionality**: Analyzes user musical taste and movie history to generate hybrid recommendations with natural language rationales.

### 4. Client Interface (React)

- **Role**: Interactive user experience with high-fidelity design.
- **Technology**: React 19, Vite, Tailwind CSS.
- **Key Components**:
  - Real-time Chat and Community Feed.
  - Dynamic Media Explorers (TMDB & Spotify integration).
  - Collaborative List Management.
  - Real-time Global Notification System (Toasts).

---

## Core Features

### Real-Time Social Ecosystem

- **Instant Messaging**: Peer-to-peer chat with media sharing capabilities.
- **Activity Feed**: Live updates of friend activities (favorites added, lists created, recommendations generated).
- **Presence Tracking**: Global online/offline status indicators for all social interactions.
- **Smart Notifications**: Non-blocking toast system for friend requests and social triggers.

### Collaborative Media Management

- **Shared Lists**: Users can invite friends to collaborate on movie or music collections in real-time.
- **AI-Powered "Magic Complete"**: Automatically suggests media to complete a list based on its current theme and items.
- **Spotify Export**: Conversion of curated music lists into native Spotify playlists.

### Deep Third-Party Integrations

- **Spotify**: Real-time playback status and interaction with user libraries.
- **TMDB**: Comprehensive metadata retrieval for movies and TV shows.
- **Letterboxd**: Integration of movie watching history and user statistics.

---

## Deployment and Infrastructure

The project is containerized using Docker and orchestrated to ensure high availability:

### Local Development

1. **Repository Initialization**:

   ```bash
   git clone https://github.com/mgarcia333/scenesbeats.git
   ```

2. **Environment Configuration**:
   Configure `.env` files in `client/`, `server/`, and `laravel-api/` based on the provided `.env.example` templates.

3. **System Startup**:
   ```bash
   docker-compose up -d --build
   ```

### Production Stack

- **Web Server**: Nginx (Reverse Proxy and SSL termination).
- **Database**: Dedicated high-performance instance.
- **Process Management**: PM2 (for Node.js) and PHP-FPM.
- **CI/CD**: Automated deployment pipeline for production stages.

---

## Maintenance and Testing

The platform includes a suite of tests to ensure stability across layers:

- **Frontend Testing**: `vitest` for React component validation.
- **Backend Testing**: `jest` for Node.js logic.
- **API Testing**: `PHPUnit` for Laravel business logic.

Execute all tests from the root directory:

```bash
npm test
```

## Licensing

Copyright © 2026 ScenesBeats. All rights reserved.
Detailed licensing terms are available upon request.
