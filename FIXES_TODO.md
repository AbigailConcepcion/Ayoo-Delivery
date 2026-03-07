# Ayoo Delivery - Code Fixes TODO

## Progress Tracker - COMPLETED

- [x] 1. Fix App.tsx - Add missing props to Home component
- [x] 2. Fix src/contexts/Auth.tsx - Remove conflicting types, use types.ts
- [x] 3. Fix duplicate NavBar - Use consistent import from components/NavBar.tsx
- [x] 4. Fix AIChat.tsx - Change @google/genai to @google/generative-ai
- [x] 5. Fix RestaurantDetail.tsx - Change @google/genai to @google/generative-ai
- [x] 6. Fix screens/Home.tsx - Add required callback props, fix TypeScript errors
- [x] 7. Fix screens/Cart.tsx - Add onNavigateToTracking prop
- [x] 8. Fix screens/OrderTracking.tsx - Add onNavigate prop

## Summary of Fixes Applied:

### App.tsx
- Fixed Home component props to include all required properties
- Added onApplyVoucher, onNavigateToHistory, currentUserEmail props
- Fixed Logo component to use useEmoji prop

### screens/Home.tsx
- Added missing props to HomeProps interface
- Fixed invalid optional chaining syntax (onOpenCart? and onSelectRestaurant?)
- Added helper functions for handling optional callbacks

### screens/Cart.tsx
- Added onNavigateToTracking prop to interface and component

### screens/OrderTracking.tsx
- Added onNavigate prop to interface

### src/contexts/Auth.tsx
- Removed conflicting UserRole type definition
- Now imports and re-exports types from types.ts
- Added helper function for type conversion

## Notes:
- The Logo component already had the useEmoji prop implemented
- The project uses relative imports instead of @/ path aliases
- TypeScript errors related to missing props have been addressed


