# Stage 1: Build React App
FROM node:20-slim AS builder

# Set build arguments for API URLs
ARG VITE_NODE_API_URL
ARG VITE_LARAVEL_API_URL
ENV VITE_NODE_API_URL=$VITE_NODE_API_URL
ENV VITE_LARAVEL_API_URL=$VITE_LARAVEL_API_URL

WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Serve with Nginx and Proxy
FROM nginx:alpine

# Generar un certificado SSL Autofirmado (obligatorio para Spotify)
RUN apk add --no-cache openssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=ES/ST=Madrid/L=Madrid/O=ScenesBeats/CN=204.168.248.102"

# Copy built React files
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
