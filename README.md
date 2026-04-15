# 🎬 ScenesBeats

<div align="center">

[![Platform](https://img.shields.io/badge/Platform-ScenesBeats-FF6B6B?style=for-the-badge)](https://scenesbeats.com)
[![Live](https://img.shields.io/badge/Live-scenesbeats.com-4ECDC4?style=for-the-badge)](https://scenesbeats.com)
[![License](https://img.shields.io/badge/License-Proprietary-2C3E50?style=for-the-badge)](#licencia)

**La plataforma social definitiva para entusiastas del cine y la música**

[Español](#español) · [English](#english)

---

<a name="español"></a>

# 📋 Descripción General

ScenesBeats es una plataforma social de alto rendimiento diseñada para aficionados del cine y la música. Combina interacciones en tiempo real, gestión colaborativa de medios y motores de recomendación impulsados por IA para crear una experiencia social única alrededor del entretenimiento.

**🌐 Producción:** [https://scenesbeats.com](https://scenesbeats.com)

---

## 🏗️ Arquitectura Técnica

El sistema sigue una arquitectura moderna inspirada en microservicios, diseñada para escalabilidad y respuesta en tiempo real:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (React 19)                         │
│   Chat en tiempo real · Explorador de medios · Listas colaborativas│
└─────────────────────────────────────┬───────────────────────────────┘
                                      │ HTTPS / WebSocket
┌─────────────────────────────────────┴───────────────────────────────┐
│                        NGINX (Reverse Proxy)                        │
│                    SSL Termination · Load Balancing                │
└──────┬────────────────────────┬────────────────────────┬───────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐      ┌─────────────────┐      ┌───────────────────┐
│  Laravel 11  │      │   Node.js 20+   │      │  Google Gemini AI │
│   (REST API) │◄────►│ (WebSocket/IO)  │◄────►│  (Recomendaciones)│
└──────────────┘      └─────────────────┘      └───────────────────┘
       │                        │
       ▼                        ▼
┌──────────────┐      ┌─────────────────┐
│   MySQL 8.0  │      │   Redis / Cache │
└──────────────┘      └─────────────────┘
```

### 1. API REST (Laravel 11)

| Aspecto | Detalle |
|---------|---------|
| **Rol** | Lógica de negocio central, persistencia de datos, autenticación |
| **Tecnología** | PHP 8.2+, Laravel 11, MySQL 8.0 |
| **Responsabilidades** | Perfiles de usuario, grafos sociales (amistades), CRUD de listas, gestión transaccional, broadcasting en tiempo real |

### 2. Capa de Tiempo Real (Node.js)

| Aspecto | Detalle |
|---------|---------|
| **Rol** | Gestión de estado, sincronización Spotify, broadcasting WebSocket |
| **Tecnología** | Node.js 20+, Express, Socket.io, Redis |
| **Responsabilidades** | Conexiones WebSocket persistentes, motor de broadcast interno, monitoreo de reproducción Spotify, procesamiento de recomendaciones IA |

### 3. Motor de Inteligencia (Google Gemini AI)

| Aspecto | Detalle |
|---------|---------|
| **Rol** | Análisis de datos avanzado para recomendaciones personalizadas |
| **Tecnología** | Google Generative AI (Gemini 2.5 Flash) |
| **Funcionalidad** | Análisis de gustos musicales e historial cinematográfico, generación de recomendaciones híbridas con rationales en lenguaje natural |

### 4. Interfaz de Cliente (React)

| Aspecto | Detalle |
|---------|---------|
| **Rol** | Experiencia interactiva con diseño de alta fidelidad |
| **Tecnología** | React 19, Vite, Tailwind CSS, TypeScript |
| **Componentes clave** | Chat y feed comunitario, exploradores dinámicos (TMDB/Spotify), gestión colaborativa de listas, sistema de notificaciones toast |

---

## ✨ Características Principales

### 🌟 Ecosistema Social en Tiempo Real

- **Mensajería instantánea** - Chat peer-to-peer con capacidades de compartir medios
- **Feed de actividad** - Actualizaciones en vivo de actividades de amigos (favoritos añadidos, listas creadas, recomendaciones generadas)
- **Seguimiento de presencia** - Indicadores globales de estado online/offline
- **Notificaciones inteligentes** - Sistema toast no bloqueante para solicitudes de amistad y triggers sociales

### 📚 Gestión Colaborativa de Medios

- **Listas compartidas** - Invita amigos para colaborar en colecciones de películas o música en tiempo real
- **"Magic Complete" con IA** - Sugiere automáticamente medios para completar una lista basándose en su tema actual
- **Exportación a Spotify** - Convierte listas de música curadas en playlists nativas de Spotify

### 🔗 Integraciones con Terceros

| Servicio | Integración |
|----------|-------------|
| **Spotify** | Estado de reproducción en tiempo real e interacción con bibliotecas de usuario |
| **TMDB** | Obtención de metadatos completos para películas y series |
| **Letterboxd** | Integración de historial de visualización y estadísticas de usuario |

---

## 🛠️ Stack Tecnológico

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Tailwind](https://.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript)

### Backend
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square&logo=laravel)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io)

### Infraestructura
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker)

### IA
![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google)

---

## 🚀 Despliegue

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/mgarcia333/scenesbeats.git
cd scenesbeats

# Instalar dependencias
npm run install:all

# Configurar variables de entorno
# Editar .env en client/, server/, y laravel-api/

# Iniciar servicios
docker-compose up -d --build

# Acceder a la aplicación
# Frontend: http://localhost:5173
# API Laravel: http://localhost:8000
# Servidor Node: http://localhost:3001
```

### Producción

#### Requisitos del Servidor
- Ubuntu 20.04+ / Debian 11+
- Docker Engine 24.0+
- Docker Compose 2.20+
- 4GB RAM mínimo (8GB recomendado)
- 2 vCPU mínimo

#### Configuración de Producción

1. **Certificado SSL** (Let's Encrypt):
```bash
sudo certbot --nginx -d scenesbeats.com -d www.scenesbeats.com
```

2. **Variables de entorno de producción**:
```bash
# laravel-api/.env
APP_ENV=production
APP_DEBUG=false
DB_HOST=production_mysql
REDIS_HOST=production_redis

# server/.env
NODE_ENV=production
WS_PORT=3001

# client/.env
VITE_API_URL=https://api.scenesbeats.com
VITE_WS_URL=wss://scenesbeats.com
```

3. **Despliegue con Docker**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Stack de Producción
- **Servidor Web**: Nginx (Reverse Proxy y SSL Termination)
- **Base de datos**: MySQL 8.0 dedicado de alto rendimiento
- **Gestión de Procesos**: PM2 (Node.js) + PHP-FPM
- **CI/CD**: Pipeline automatizado para etapas de producción
- **Monitoreo**: Logs centralizados con rotation

---

## 🔧 Mantenimiento y Testing

La plataforma incluye un conjunto de tests para garantizar estabilidad:

```bash
# Ejecutar todos los tests desde raíz
npm test

# Tests específicos
npm run test --prefix client      # Vitest (React)
npm run test --prefix server      # Jest (Node.js)
php artisan test                 # PHPUnit (Laravel)
```

---

## 📊 API Reference

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Autenticación de usuario |
| `POST` | `/api/auth/register` | Registro de nuevo usuario |
| `GET` | `/api/user/profile` | Obtener perfil de usuario |
| `GET` | `/api/media/movies` | Buscar películas (TMDB) |
| `GET` | `/api/media/tracks` | Buscar tracks (Spotify) |
| `POST` | `/api/lists` | Crear lista colaborativa |
| `GET` | `/api/recommendations` | Obtener recomendaciones IA |
| `GET` | `/api/feed` | Feed de actividad social |

### WebSocket Events

| Evento | Descripción |
|--------|-------------|
| `connection` | Nueva conexión de cliente |
| `message` | Mensaje de chat |
| `presence` | Cambio de estado online/offline |
| `activity` | Actualización de actividad social |
| `recommendation` | Nueva recomendación generada |

---

## 🔐 Seguridad

- **Autenticación**: JWT tokens con refresh tokens
- **Cifrado**: TLS 1.3 para todas las conexiones
- **CSRF Protection**: Tokens válidos en todos los formularios
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Input Validation**: Sanitización de todos los inputs de usuario
- **SQL Injection Prevention**: Eloquent ORM con prepared statements

---

## 📈 Rendimiento

- **Tiempo de respuesta API**: < 100ms (p95)
- **Latencia WebSocket**: < 50ms
- **Caché**: Redis para sesiones y datos frecuentes
- **CDN**: Assets estáticos servidos desde CDN
- **Optimización de imágenes**: WebP con fallbacks

---

## 🆘 Troubleshooting

### Problemas Comunes

#### Error de conexión WebSocket
```bash
# Verificar que el servicio Node está corriendo
pm2 status
# Reiniciar si es necesario
pm2 restart server
```

#### Problemas de base de datos
```bash
# Verificar conectividad
php artisan migrate:status
# Reconstruir si es necesario
php artisan migrate:fresh --seed
```

#### Memoria insuficiente
```bash
# Aumentar límite de memoria PHP
php -d memory_limit=512M artisan optimize
```

---

## 📄 Licencia

Copyright © 2026 ScenesBeats. Todos los derechos reservados.

Esta es una aplicación propietaria. El código fuente y los activos son propiedad de ScenesBeats. Para términos de licencia detallados, contacta con el equipo de desarrollo.

---

## 👥 Equipo de Desarrollo

- **Desarrollo Principal**: [Moisés Garcia](https://github.com/mgarcia333)
- **Infraestructura**: Docker, Nginx, Cloudflare
- **IA**: Google Gemini API Integration

---

## 📞 Contacto

- **Sitio Web**: [https://scenesbeats.com](https://scenesbeats.com)
- **GitHub**: [https://github.com/mgarcia333/scenesbeats](https://github.com/mgarcia333/scenesbeats)
- **Email**: dev@scenesbeats.com

---

<div align="center">

*Construido con ❤️ para la comunidad de cine y música*

</div>

---

<a name="english"></a>

# English Version

## Overview

ScenesBeats is a high-performance social media platform designed for cinema and music enthusiasts. It combines real-time interactions, collaborative media management, and AI-driven recommendation engines to create a unique social entertainment experience.

**🌐 Production:** [https://scenesbeats.com](https://scenesbeats.com)

## Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, TypeScript
- **Backend API**: Laravel 11 (PHP 8.2+)
- **Real-time**: Node.js 20+, Socket.io
- **Database**: MySQL 8.0, Redis
- **AI Engine**: Google Gemini 2.5 Flash
- **Infrastructure**: Docker, Nginx, PM2

## Quick Start

```bash
git clone https://github.com/mgarcia333/scenesbeats.git
cd scenesbeats
npm run install:all
docker-compose up -d --build
```

## Features

- Real-time chat and activity feed
- Collaborative media lists (movies & music)
- AI-powered recommendations
- Spotify & TMDB integration
- Letterboxd synchronization
- "Magic Complete" AI assistant

## License

Copyright © 2026 ScenesBeats. All rights reserved.

---

*Last updated: April 2026*
