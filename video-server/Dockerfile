FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8081

CMD ["node", "src/server.js"]
