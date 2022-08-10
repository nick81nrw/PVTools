# LTS
FROM node:16-alpine3.15  

RUN mkdir -p /pvtools
WORKDIR /pvtools

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
COPY . .
# RUN export NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build
RUN npm run generate

# docker build ./pvtools -t pvtfront:0.99 