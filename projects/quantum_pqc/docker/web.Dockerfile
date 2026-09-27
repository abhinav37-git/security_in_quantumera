FROM node:20-alpine

WORKDIR /app

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./

RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
