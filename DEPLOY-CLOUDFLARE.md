# FundWise Rural Cloudflare Deployment

This project is prepared for a free Cloudflare Pages + Workers AI deployment.

## What changes in phase two

- The React site is hosted on Cloudflare Pages.
- The AI request moves from local Ollama to a Cloudflare Pages Function at `/api/recommendations`.
- Workers AI provides the hosted model so the demo does not depend on one laptop staying online.

## Before you deploy

1. Push this repository to GitHub.
2. Create a free Cloudflare account.
3. In Cloudflare, go to `Workers & Pages` and create a new `Pages` project.
4. Connect the GitHub repository.

## Build settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

## Add the AI binding

In the Cloudflare Pages project:

1. Open `Settings`
2. Open `Bindings`
3. Add a new `AI` binding
4. Use the binding name: `AI`

This must match the `wrangler.toml` file and the function code.

## How the AI route works

- Frontend calls `/api/recommendations`
- Cloudflare Pages Function receives the request
- Function calls Workers AI
- Function returns structured JSON recommendations to the frontend

## Local development note

When you run the app locally with `npm run dev`, the site still falls back to local Ollama or the local non-AI recommendation logic if the Cloudflare function is not running.

## Recommended final test

After deployment:

1. Open the live Pages URL
2. Run `CAP Demo`
3. Run `ERDF Demo`
4. Confirm recommendation text appears without Ollama running locally
5. Confirm the official route links and metrics panel still work
