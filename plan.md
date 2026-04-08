# Estratègia d'Implementació: ScenesBeats

## 1. Arquitectura de Microserveis

- **Frontend (React)**: Responsable de la interfície d'usuari, la gestió de l'estat global de l'aplicació i la comunicació amb ambdós backends.
- **Backend d'Orquestració (Node.js/Express)**:
  - Actua com a proxy per a Spotify, TMDB i Google Gemini.
  - Gestiona els WebSockets per al monitoratge en temps real de Spotify.
  - Genera els prompts de l'IA i processa l'RSS de Letterboxd.
- **Backend de Persistència (Laravel API)**:
  - Gestió de la base de dades SQL (MySQL).
  - Gestió d'usuaris, perfils, favorits i llistes.
  - Proveeix els endpoints per a la vista de comunitat.

## 2. Estratègia de Dades

- **Sincronització d'Usuaris**: Node.js gestiona l'OAuth de Spotify, i un cop autenticat, fa un "call" intern al Laravel API per assegurar-se que l'usuari existeix a la BD i obtenir un token de sessió de Laravel (Sanctum/Personal Access Token).
- **Cerca de Cinema**: El frontend consumeix els títols de TMDB mitjançant el servidor Node.js per evitar exposar claus de l'API al client i permetre el filtratge i el processament previ si fos necessari.

## 3. Estratègia de Desenvolupament

- **Fase 1: Infraestructura Base**: Configuració dels servidors Node.js i Laravel i la seva comunicació inicial.
- **Fase 2: Autenticació**: Implementació de l'OAuth de Spotify i la sincronització de dades cap al Laravel API.
- **Fase 3: El "Mood" Engine**: Creació del 'SpotifyMonitor' i la lògica de recomanacions amb Google Gemini.
- **Fase 4: Funcionalitats Socials**: Desenvolupament del sistema de llistes i favorits al Laravel API.
- **Fase 5: UI i Multilenguatge**: Disseny final de la interfície amb Tailwind CSS i configuració de i18next per als idiomes.

## 4. Estratègia de Validació i Testing

- **Backend (Node.js)**: Tests de salut ('health tests') i verificació dels controladors de Spotify i recomanacions.
- **Backend (Laravel)**: Tests unitaris i de feature per als endpoints de llistes i favorits.
- **Frontend (React)**: Tests de renderització i funcionalitat bàsica de components (Vitest).

## 5. Deployment i Escabilitat

- **Dockerització**: Ús de `docker-compose.yml` per aixecar els contenidors de MySQL, PHP/Laravel, Node.js i el servidor web.
- **Entorn de Producció**: Configuració de variables d'entorn (.env) separades per al client, el servidor Node.js i la API de Laravel per a la seguretat de les API Keys.
