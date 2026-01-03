# ==========================================
# STAGE 1 : BUILD
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copie optimisée des dépendances pour le cache layer
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copie du code source
COPY . .

# Injection de la variable d'API au moment du build
# C'est la seule variable nécessaire pour connecter le front au back
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de l'application
RUN npm run build

# ==========================================
# STAGE 2 : PRODUCTION (NGINX)
# ==========================================
FROM nginx:alpine

# Copie des fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx optimisée pour React SPA
# Cette configuration gère le routage et la sécurité
RUN echo 'server { \
    listen 4173; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gestion de la compression Gzip pour la performance \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    location / { \
    # Redirection vers index.html pour le routage SPA (React Router) \
    try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache pour les assets statiques (images, css, js) \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
    expires 1y; \
    add_header Cache-Control "public, no-transform"; \
    } \
    \
    # Headers de sécurité de base \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]
