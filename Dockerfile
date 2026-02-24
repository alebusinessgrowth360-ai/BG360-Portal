# 1. Etapa de construcción (Build)
FROM node:20 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++
COPY package*.json ./
RUN npm install
COPY . .
# Construimos el frontend (esto crea la carpeta 'dist')
RUN npm run build

# 2. Etapa de ejecución (Runtime)
FROM node:20-slim
WORKDIR /app

# Instalamos librerías mínimas para SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copiamos dependencias de producción
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copiamos SOLO lo necesario para que la web funcione
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./

# Instalamos tsx para ejecutar el servidor
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["tsx", "server.ts"]
