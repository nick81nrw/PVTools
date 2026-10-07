# pvtools

Frontend des PV-Auslegungsrechners, gebaut mit [Vue 3](https://vuejs.org), [Vite](https://vite.dev), [Tailwind CSS](https://tailwindcss.com) und [Chart.js](https://www.chartjs.org). Die Simulation läuft in einem Web Worker, damit die Oberfläche bedienbar bleibt.

## Requirements

- Node.js >= 22
- NPM

## Build Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000 (expects the backend at localhost:8082)
$ npm run dev

# build the static site into dist/
$ npm run build

# preview the build
$ npm run preview

# run the unit tests
$ npm run test-all
```

## Environment variables (build time)

| Variable            | Description                                                                                         | Default if not set                                          |
| ------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| APP_URL             | Base URL of the backend, e.g. `https://pvtools.example.com`. The frontend posts to `$APP_URL/relay` | build: same origin (`/relay`), dev: `http://localhost:8082` |
| GOOGLE_ANALYTICS_ID | Google Analytics 4 measurement ID (`G-...`), Google Analytics is disabled if empty                  | (not set)                                                   |

## Docker

```bash
# Build image with defaults (backend reachable under /relay of the same origin)
$ docker build --tag pvtools-frontend:latest .

# Build image with custom settings
$ docker build --build-arg APP_URL=https://backend.example.com:8443 --build-arg GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX --tag pvtools-frontend:latest .

# Run image
$ docker run --publish 8080:8080 pvtools-frontend:latest
```

## Structure

| Path                    | Content                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `main.js`, `style.css`  | App entry, Tailwind theme (light/dark colors, fonts)                      |
| `router.js`             | Routes `/`, `/impress`, `/consumptionProfiles`                            |
| `pages/`                | Pages                                                                     |
| `components/inputs/`    | Input steps (location, roofs, consumption, costs, expert settings)        |
| `components/results/`   | Recommendation, KPIs, charts, table and details                           |
| `components/ui/`        | Small building blocks (cards, number fields, compass)                     |
| `composables/`          | Shared state (`useCalculator`) and dark mode (`useTheme`)                 |
| `lib/`                  | Backend/PVGIS requests, number formatting, chart theme, downloads         |
| `data/faq.js`           | FAQ and news                                                              |
| `functions/`            | Calculation logic (energy flow, simulation, load profiles, CSV) and tests |
| `functions/*.worker.js` | Web Worker running the simulation                                         |
| `public/`               | Static files, served as is                                                |
