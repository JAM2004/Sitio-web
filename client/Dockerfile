# CIE Conecta — imagen del cliente (Fase G)
# Contexto de build = raíz del repo (necesita server/nginx.conf).
# Etapa 1: npm ci + vite build. Etapa 2: nginx sirve client/dist.
FROM node:22-alpine AS build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY server/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
