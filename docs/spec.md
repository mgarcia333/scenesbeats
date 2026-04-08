# Especificacions Funcionals: ScenesBeats

## 1. Flux d'Autenticació

- **Accés**: L'usuari inicia sessió exclusivament mitjançant el seu compte de Spotify (OAuth2).
- **Sincronització**: En el primer accés, les dades de l'usuari (nom, correu, ID de Spotify) se sincronitzen automàticament amb la base de dades de Laravel.
- **Perfil**: L'usuari pot configurar el seu nom d'usuari de Letterboxd a la secció de configuració per permetre el context de visionat de cinema.

## 2. Monitoratge en Temps Real

- **Spotify Monitor**: El servidor Node.js monitoritza constantment (mitjançant WebSockets) la cançó que l'usuari està escoltant actualment.
- **Detecció de Canvis**: Quan es detecta una nova cançó, el frontend s'actualitza automàticament per mostrar la caràtula de la cançó i el botó de recomanació.

## 3. Generació de Recomanacions

- **Input de l'IA**: Es recullen les metadades de la cançó (títol, artista, gènere) i els seus atributs d'àudio (valence, energy).
- **Context de Letterboxd**: Si l'usuari té vinculat Letterboxd, s'extreuen les darreres pel·lícules vistes mitjançant l'RSS públic.
- **Prompt de Google Gemini**: Es genera una recomanació de pel·lícula única que encaixi amb el "vibe" musical, evitant repeticions d'historial.
- **Resultat**: Es mostra el títol, la sinopsi, la puntuació i una explicació generada per l'IA sobre per què la pel·lícula s'ha triat segons la música actual.

## 4. Gestió de Cinema i Llistes

- **Cerca**: L'usuari pot cercar qualsevol pel·lícula manualment mitjançant la integració amb TMDB.
- **Favorits**: Possibilitat de marcar pel·lícules com a favorites (emmagatzemat a la BD Laravel).
- **Llistes Personalitzades**: Creació, edició i eliminació de llistes de reproducció de cinema (MediaLists).

## 5. Comunitat i Activitat

- **Feed d'Activitat**: Vista on es poden veure les darreres recomanacions generades per altres usuaris de la plataforma.
- **Interacció**: Visualització de perfils públics d'altres usuaris.

## 6. Interfície d'Usuari (UI/UX)

- **Mode Clar/Fosc**: Suport per a temes personalitzables.
- **Internacionalització**: La interfície està disponible en Català, Castellà i Anglès.
- **Responsive Design**: Adaptació completa a dispositius mòbils i escriptori.
