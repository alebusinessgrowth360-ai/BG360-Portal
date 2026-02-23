# 1. Construcción
FROM node:20 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Ejecución
FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libsqlite3-dev python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
RUN npm install -g tsx
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["tsx", "server.ts"]
