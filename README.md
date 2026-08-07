# TechGadgets — Production-Ready E-Commerce Store

TechGadgets is a polished full-stack electronics storefront built with React, Node.js, Express, and MongoDB. The app is designed to be deployment-ready for a real business, with secure auth, responsive product browsing, cart checkout, and an admin experience for managing products and orders.

## Highlights

- Premium storefront experience with a modern electronics aesthetic
- Secure backend with JWT auth, validation, rate limiting, and sanitization
- Admin dashboard for product, order, and user management
- Environment-based configuration for local development and deployment
- Cloudinary-ready image uploads for product media

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Framer Motion |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| Deployment | Vercel, Render, MongoDB Atlas, Cloudinary |

## Project Structure

```text
techgadgets-store/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   └── server/
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── layouts/
        ├── pages/
        ├── services/
        └── utils/
```

## Quick Start

### Requirements

- Node.js 18+
- MongoDB Atlas account (recommended) or local MongoDB

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/techgadgets?retryWrites=true&w=majority
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRE=7d
# Single origin or a comma-separated allow-list of frontend origins
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Optional (only for `npm run create-admin` when not passing CLI args):
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

### Frontend

```env
VITE_API_URL=/api
# Dev-only proxy target (not used in the production build)
VITE_API_TARGET=http://127.0.0.1:5000
VITE_STORE_NAME=TechGadgets
VITE_STORE_TAGLINE=Build In Services
VITE_STORE_EMAIL=techgadgets903@gmail.com
VITE_STORE_PHONE=01300733439
VITE_STORE_ADDRESS=Shonir Akhra, Dhaka
VITE_STORE_WHATSAPP=8801300733439
```

## Deployment Notes

- Frontend: deploy the Vite app on Vercel
- Backend: deploy the Express app on Render
- Database: use MongoDB Atlas
- Media: configure Cloudinary for image uploads

### Critical: point the frontend at the real backend URL

The frontend and backend are two separate deployments (Vercel + Render) with no
shared domain, so `/api` calls from the browser can't resolve on their own —
there is no server on Vercel to proxy them to Render. `vercel.json` only
excludes `/api/*` from the SPA fallback so a misconfiguration 404s instead of
silently returning `index.html`; it does not (and can't, from a static
`vercel.json` alone) forward `/api/*` to your Render service.

**You must set `VITE_API_URL` as a build-time environment variable in the
Vercel project settings** to your full backend URL, e.g.:

```
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

Also add the resulting Vercel domain(s) to the backend's `CLIENT_URL` env var
on Render (comma-separated if you have both a custom domain and the
`*.vercel.app` URL) so CORS allows the browser to call it. Leaving
`VITE_API_URL` at its local-dev default of `/api` in production will make
every API call fail.

## Scripts

```bash
npm run install:all
npm run dev
npm run build
```

## License

MIT
