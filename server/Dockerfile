# CIE Conecta — imagen del servidor API (Fase G)
# Contexto de build = raíz del repo (.dockerignore excluye .env, node_modules
# y los uploads de usuario; se conserva default-logo.png).
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
EXPOSE 3001
CMD ["node", "src/server.js"]
