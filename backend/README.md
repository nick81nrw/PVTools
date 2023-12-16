# backend for pvtools

## Requirements
- Node.js >= 20
- NPM

## Build Setup

```bash
# install dependencies
$ npm install

# launch backend server at localhost:8082
$ npm run start
```

## Enviroment variables
| Variable | Description | Default if not set |
| -------- | ----------- | ------------------ |
| APP_URL  | Domain name and Port that is used for the allowed CORS header (Access-Control-Allow-Origin) when NODE_ENV='production' | (not set) |
| NODE_ENV | Using the value 'production' changes the CORS header to https://APP_URL. Attention: in production mode 'https' is always set as protocol | development |
| REQUEST_PORT | HTTP Port the application is listening on | 8082 |

## Docker
```bash
# Build image
$ docker build -t pvtools-backend:latest .

# Run image with defaults
$ docker run -p 8082:8082 pvtools-backend:latest

# Run image in production and allow XHR requests only from https://frontend.example.com:8443. Run on Port 8083 instead of 8082
$ docker run -e APP_URL=frontend.example.com:8443 -e NODE_ENV=production -e REQUEST_PORT=8083 -p 8083:8083 pvtools-backend:latest
```
