# TODO: Move Live Tracking to Orders Bottom Nav Bar

## Task
Move the live tracking inside the orders bottom nav bar. Remove the live tracking nav bar and move, transfer or relocate the live tracking function and features and mock order status inside the order bottom nav bar screen.

## Plan

### 1. Modify BottomNav.tsx
- [x] Remove TRACKING from customerItems array
- [x] Add live order indicator to HISTORY tab
- [x] Rename HISTORY label to "Orders"

### 2. Modify History.tsx
- [x] Import live tracking features from OrderTracking.tsx
- [x] Add state for active orders and live tracking
- [x] Add MapItinerary component for active order tracking
- [x] Add tabs: LIVE TRACKING | HISTORY
- [x] Add status timeline for active orders
- [x] Add ETA display
- [x] Add rider info card
- [x] Add mock order status updates

### 3. Modify App.tsx
- [x] Redirect TRACKING navigation to HISTORY for backward compatibility
- [x] Update screen transitions

## Status: COMPLETED ✅

