# VG Realm Store Deployment Guide

This project currently has:

- a static front-end in the project root
- a backend scaffold in `backend/` for the real production path

## Files to upload

For the front-end demo, upload the public site files:

- `index.html`
- `store.html`
- `product.html`
- `buy-coins.html`
- `purchases.html`
- `payments.html`
- `settings.html`
- `style.css`
- `script.js`
- `vercel.json`
- `.nojekyll`

For the real production path, deploy the backend separately from `backend/`.

## Vercel

1. Create a GitHub repository and upload all files.
2. Go to Vercel and sign in.
3. Click `Add New Project`.
4. Import your GitHub repository.
5. Set:
   - Framework Preset: `Other`
   - Build Command: leave blank
   - Output Directory: leave blank
6. Click `Deploy`.

This only deploys the front-end unless you separately deploy the backend.

## GitHub Pages

1. Create a public GitHub repository and upload all files.
2. Open the repository settings.
3. Go to `Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main` and `/ (root)`
5. Save the settings.
6. Wait for GitHub Pages to publish the site.

`.nojekyll` is included so GitHub Pages serves the files directly as a static site.

GitHub Pages cannot run the backend. It is front-end only.

## Backend

The real store backend scaffold is in `backend/`.

You should deploy it on a Node-capable host such as:

- Render
- Railway
- Fly.io
- VPS

Read:

- `backend/README.md`
- `backend/.env.example`

## Custom domain

You can connect a custom domain later from:

- Vercel Project Settings -> Domains
- GitHub Repository Settings -> Pages -> Custom domain
