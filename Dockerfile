FROM node:20

WORKDIR /app

COPY package.json .

RUN npm install

RUN npx playwright install chromium

COPY . .

CMD ["npm", "start"]
