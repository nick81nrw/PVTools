FROM node:18-alpine3.16

RUN alias ll="ls -al"
RUN mkdir -p /pvtools
WORKDIR /pvtools

# USER node
COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
COPY . .

CMD ["npm", "start"]


# docker build ./backend -t pvtback:0.99 