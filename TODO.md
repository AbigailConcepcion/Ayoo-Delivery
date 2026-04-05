# Ayoo-Delivery Production Readiness TODO
**Status: In Progress** | Approved by user | Test Mode (no real payment keys needed)

## 1. ✅ Create TODO.md [DONE]

## 2. Security Hardening (High Priority)
- [✅] Create .env.example (STRIPE_PUBLISHABLE_KEY, JWT_SECRET, etc.)
- [✅] Update server/src/index.ts: helmet, rate-limit, secure CORS, /health
- [✅] Update server/src/db.ts: remove hardcoded master pin

## 3. Config & Environment
- [✅] Update capacitor.config.ts (appId, name)
- [✅] Update package.json (prod scripts)
- [✅] Update server/package.json (prod scripts: PM2)
- [✅] Create vite-env.d.ts, service worker basics

## 4. Frontend Polish
- [✅] screens/Payments.tsx: remove manual card input (dev only)
- [ ] App.tsx: enhance global error handling

## 5. Deployment & Docs
- [✅] Update README.md: Production Setup guide
- [✅] Create PM2 ecosystem file
- [ ] Test full flow: npm run dev:full

## 6. Testing & Final
- [ ] Run jest tests
- [ ] Capacitor sync/build Android
- [ ] attempt_completion

**Next: Security files first**
