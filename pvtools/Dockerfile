FROM node:22-alpine AS builder
ARG APP_URL=""
ARG GOOGLE_ANALYTICS_ID
ENV APP_URL=${APP_URL}
ENV GOOGLE_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
