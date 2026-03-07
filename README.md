<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

This repository is split into two parts:

* **client** – the React/Vite front-end in the root folder.
* **server** – a simple Express/SQLite API in the `server` directory.

### Prerequisites

* Node.js (16+)
* npm (or yarn)

### Front-end

1. Install dependencies in the root:
   ```bash
   npm install
   # or yarn
   ```
2. Create a `.env.local` file and set any Vite env vars you need, e.g.
   ```env
   VITE_USE_REAL_BACKEND=true
   VITE_API_BASE=http://localhost:4000
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Or run both client and API together from root:
   ```bash
   npm run dev:full
   ```

### Back-end

1. Change into the server directory and install deps:
   ```bash
   cd server
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in values:
   ```env
   PORT=4000
   JWT_SECRET=supersecretvalue
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The API will run on http://localhost:4000.

### Notes

* When `VITE_USE_REAL_BACKEND` is `true` the client will talk to the Express API and all data will be stored in SQLite instead of localStorage.
* The database file is `server/ayoo.sqlite`. It is created automatically on startup.
* For production, you should replace SQLite with a managed database, secure your JWT secret, add logging, and build both client and server.

### Docker (API container)
You can package the back-end in a Docker container for easier deployment:

```bash
cd server
# build image
docker build -t ayoo-api .
# run container, exposing port 4000 and optionally mounting database
docker run -p 4000:4000 -v $PWD/ayoo.sqlite:/app/ayoo.sqlite --env-file .env ayoo-api
```

The `Dockerfile` compiles the TypeScript source and runs `dist/index.js`.

### Stripe integration
1. Add your Stripe secret key to the server `.env`:
   ```
   STRIPE_SECRET=sk_test_...
   ```
2. Card payment methods (`VISA`/`MASTERCARD`) are processed via the `/payments/stripe` route.
3. The client automatically routes card transactions to this endpoint when `USE_REAL_BACKEND` is enabled.
4. For production use, integrate Stripe Elements or Checkout on the front-end to collect tokens securely.

---

Add additional information as project matures.
