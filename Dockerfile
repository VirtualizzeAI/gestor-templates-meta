# =============================================================
# Luna Templates — Multi-stage Dockerfile
# Stage 1: Build the React app
# Stage 2: Serve static files with nginx + runtime env injection
# =============================================================

# ---------- Stage 1: builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .

# Build args (can be left empty; runtime env injection takes precedence)
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine

# Nginx config (SPA fallback + gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Entrypoint script generates /env.js at container start from env vars
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
