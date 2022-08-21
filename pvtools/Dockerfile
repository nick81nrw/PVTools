# LTS
FROM node:16-alpine as build
ENV NODE_ENV=production

WORKDIR /pvtools

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
COPY . .
# RUN export NODE_OPTIONS=--openssl-legacy-provider
RUN npm run generate

CMD ["npm", "start"]

FROM nginx:1.22-alpine

COPY --from=build /pvtools/dist /usr/share/nginx/html
