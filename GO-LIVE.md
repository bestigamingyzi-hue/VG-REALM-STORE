# VG Realm Go Live

## Fastest path

1. Put the front-end on Vercel or GitHub Pages.
2. Put the backend on Render.
3. Replace localStorage front-end logic with backend API calls.
4. Add real PayPal/Card/UPI integrations.
5. Move backend JSON storage to a real database.

## Front-end live

- Deploy root files as static hosting.

## Backend live

1. Push repo to GitHub.
2. Create a Render account.
3. Create a new Web Service from the repo.
4. Render will detect `backend/render.yaml`.
5. Set env vars:
   - `PORT=4000`
   - `JWT_SECRET=your-secret`
   - `ADMIN_EMAIL=admin@vgrealm.gg`
   - `ADMIN_PASSWORD=your-password`
   - `CORS_ORIGIN=https://your-frontend-domain`

## Before real customers

- Connect front-end to backend APIs
- Add real payment gateway integration
- Add database
- Add HTTPS custom domain
- Test register, login, top-up, coin checkout, admin updates
