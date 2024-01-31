FROM node:18.3.0-alpine3.14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./ ./

RUN npm run build

EXPOSE 9285

# CMD ["node", "dist/server.js"]
CMD ["npx", "ts-node", "src/server.ts"]

