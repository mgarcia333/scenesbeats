# Foundations: Scenes & Beats

## Context
**Scenes & Beats** és una plataforma web que fusiona el món de la música i el cinema per oferir recomanacions de pel·lícules personalitzades i en temps real. El projecte es basa en la premissa que la música que escoltem és un reflex fidel del nostre estat d'ànim, el qual pot ser utilitzat per predir quin tipus de contingut cinematogràfic ens agradaria consumir.

Tècnicament, el projecte utilitza una arquitectura de microserveis híbrida:
- **Frontend**: Desenvolupat amb React (Vite) per a una experiència d'usuari fluida i reactiva.
- **Orquestrador (Node.js)**: Gestiona la lògica en temps real, la monitorització de Spotify via WebSockets, la integració amb l'IA de Google Gemini i el consum d'APIs externes (TMDB, Spotify, RSS de Letterboxd).
- **Capa de Dades (Laravel)**: Administra la persistència, la gestió d'usuaris, les llistes personalitzades i els favorits.

## Objectius
1.  **Sincronització de "Mood"**: Analitzar les mètriques de la música reproduïda a Spotify (com l'energia o la valència) per generar recomanacions de pel·lícules que s'ajustin al "vibe" actual.
2.  **Contextualització via Letterboxd**: Integrar l'historial de visionat de l'usuari mitjançant RSS per refinar les recomanacions i evitar suggerir títols ja vistos.
3.  **IA Generativa**: Utilitzar Google Gemini per crear una narrativa al voltant de la recomanació, explicant la connexió emocional entre la cançó actual i la pel·lícula suggerida.
4.  **Gestió Social i Personal**: Permetre als usuaris crear llistes, guardar favorits i explorar activitat de la comunitat.
5.  **Interfície Multi-idioma**: Oferir suport tant en català/castellà com en anglès per arribar a una audiència més àmplia.

## Restriccions
- **Dependència d'APIs de Tercers**: El sistema depèn críticament de Spotify (per al monitoratge), TMDB (per a les metadades de cinema) i Google Gemini (per a la generació d'IA). Qualsevol canvi en aquestes APIs afecta directament el servei.
- **Limitacions de Letterboxd**: En no existir una API oficial oberta, la integració es limita a la informació pública accessible via RSS.
- **Sincronització de Backends**: El manteniment de dos servidors (Node.js i Laravel) implica una gestió complexa de l'autenticació i el flux de dades.
- **Quotes de Consum**: L'ús d'IA i APIs externes està subjecte a quotes gratuïtes o de pagament que poden limitar l'escalabilitat immediata del projecte.
- **Connectivitat en Temps Real**: La funcionalitat estrella requereix una connexió estable a Internet i sessions actives en les plataformes vinculades.
