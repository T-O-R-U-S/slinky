FROM node:latest

WORKDIR /server

EXPOSE 3000

COPY package*.json ./

RUN npm install

COPY * ./

COPY ./public /server/public

COPY ./error /server/error

CMD ["node", "--experimental-json-modules", "index.mjs"]