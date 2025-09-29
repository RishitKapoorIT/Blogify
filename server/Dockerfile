# Server Dockerfile
FROM node:20.11.1-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production --omit=dev
COPY server/. .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.js"]
