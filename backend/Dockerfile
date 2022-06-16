FROM node:14.1.0

#RUN apk add --no-cache  chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.10/main

#RUN apt-get update && apt-get install libnss3 -y

#RUN apt-get update && apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget

WORKDIR /app

#RUN apk add python3

COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "run",  "start-server"]

#FROM node:12-slim
#
## Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
## Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
## installs, work.
#RUN apt-get update \
#    && apt-get install -y wget gnupg \
#    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#    && apt-get update \
#    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
#      --no-install-recommends \
#    && rm -rf /var/lib/apt/lists/*
#
## If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
## uncomment the following lines to have `dumb-init` as PID 1
## ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
## RUN chmod +x /usr/local/bin/dumb-init
## ENTRYPOINT ["dumb-init", "--"]
#
## Uncomment to skip the chromium download when installing puppeteer. If you do,
## you'll need to launch puppeteer with:
##     browser.launch({executablePath: 'google-chrome-stable'})
## ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
#
## Install puppeteer so it's available in the container.
#RUN npm i -g puppeteer
#
#COPY package*.json ./
#RUN npm install
#COPY . .
#
#CMD ["npm", "run",  "start-server"]
