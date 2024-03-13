FROM node:21.4.0-alpine3.19 AS builder
ARG APP_URL="localhost:8082"
ARG GOOGLE_ANALYTICS_ID
ARG NODE_ENV="development"
ENV APP_URL=${APP_URL}
ENV GOOGLE_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app
COPY . .
RUN npm install && \
    npm run generate

FROM nginxinc/nginx-unprivileged:stable-alpine3.18
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
