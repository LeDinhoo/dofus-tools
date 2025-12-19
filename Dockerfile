FROM node:25-alpine3.22

WORKDIR /app

COPY package.json .
COPY prisma ./prisma/

RUN npm install && npx prisma generate

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["node", "build/index.js"]