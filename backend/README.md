# VG Realm Backend

This is the first production-oriented backend scaffold for the store.

## What it adds

- Real user registration and login
- Persistent storage in `backend/data/store.json`
- JWT auth
- Server-side VG Coins balance handling
- Cart APIs
- Coin top-up APIs
- Coin-only product checkout APIs
- Admin payment settings and coin package APIs

## Install

```bash
cd backend
npm install
```

## Run

```bash
cp .env.example .env
npm run dev
```

## Important

This is a starter backend, not a finished production system yet.

Still pending for full production:

- Move storage from JSON file to PostgreSQL/MySQL
- Refresh token flow / password reset / email verification
- Rate limiting and audit logging
- Real PayPal / Card / UPI integrations
- Front-end API integration to replace localStorage logic
