# RadiantXAI frontend

This is the web app for RadiantXAI. You sign up, upload a chest X-ray, and it shows the model's predictions for 14 pathologies along with a Grad-CAM heatmap of where the model looked. Technicians get the full technical view, and general users get a plain-language summary.

It's built with React (JavaScript) and Vite, styled with Tailwind CSS. React Router handles navigation, TanStack Query handles the API calls, and Motion handles the animations.

## Running it

```
npm install
npm run dev
```

The FastAPI backend (port 8000) needs to be running too, otherwise uploads will fail.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` makes a production build in `dist`
- `npm run lint` runs oxlint
- `npm run preview` serves the production build locally

## Structure

Everything lives in `src`: `api` (backend calls), `components`, `config`, `context` (auth), `data` (class metrics and thresholds), `hooks`, and `pages`.