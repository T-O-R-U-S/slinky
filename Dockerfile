FROM node:latest

WORKDIR /server

EXPOSE 3000

COPY package*.json .

RUN npm install

COPY * .

COPY ./public /server/public

CMD ["node", "--experimental-json-modules", "index.mjs"]