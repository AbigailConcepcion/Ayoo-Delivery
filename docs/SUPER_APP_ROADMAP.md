# Ayoo Super-App Roadmap

## Positioning
Ayoo should compete as a **localized super-app for the Philippines**:
- food delivery
- groceries and essentials
- courier/parcel express
- ride booking
- pabili errands

## Unique Features (Differentiators)
1. **Verified Slip Recovery**: reconnect order tracking even after payment-page redirects/failures.
2. **Barkada Shared Bills**: group checkout with split collection before final payment.
3. **One Wallet, Multi-Service**: same account, points, payment methods, and history across all services.
4. **Barangay Smart Dispatch**: auto-prioritize nearby riders by zone and congestion.
5. **Trust Score + Proof Stack**: rider trust score with photo/timestamp proof for high-value deliveries.

## Current Build Status
- Super-app dashboard with service modules: `Services`, `Food`, `Groceries`, `Courier`, `Ride`, `Pabili`.
- Simulated end-to-end flows for grocery checkout, courier booking, and ride booking.
- AI assistant can now navigate to new service modules by intent.

## High-Priority Fixes (Before Production)
1. **Auth hardening**: add OTP login (SMS/email), rate limiting, and refresh token flow.
2. **Payment reliability**: webhook idempotency keys and retry-safe reconciliation jobs.
3. **Maps + realtime**: replace simulated tracking with real GPS streams (WebSocket/pubsub).
4. **Test setup**: add missing test deps (`ts-node` in app, `supertest` in server) and CI pipeline.
5. **Performance**: chunk splitting/lazy-loading to reduce bundle size.
6. **Observability**: structured logs, error tracking, and payment/order audit trails.

## Next Technical Milestones
### Milestone 1 (Core)
- Unified service selector + shared checkout primitives
- shared cart and payment wallet
- real notifications + status timeline

### Milestone 2 (Realtime)
- map provider integration (Google Maps / Mapbox)
- live rider location + ETA refresh engine
- in-app chat/call handoff safety controls

### Milestone 3 (Scale)
- service-oriented backend modules
- dispatch optimizer + surge/routing logic
- analytics dashboards for admin and merchants

## iOS + Android Delivery
- Keep Capacitor shell for both platforms.
- Maintain one React app codebase and platform-specific plugins for:
  - push notifications
  - location permissions and tracking
  - secure storage/keychain
  - deep links and payment callbacks
