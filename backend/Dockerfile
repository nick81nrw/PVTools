ARG NODE_BASEIMAGE=node:21.4.0-alpine3.19

FROM ${NODE_BASEIMAGE} AS builder
WORKDIR /app
COPY . .
RUN npm ci && \
    npm run compile-ts && \
    npm prune --omit=dev

FROM ${NODE_BASEIMAGE}
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
USER node
CMD [ "tini", "node", "--", "dist/index.js" ]
