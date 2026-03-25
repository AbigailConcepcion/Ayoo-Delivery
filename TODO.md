# Ayoo Light Purple Theme Transformation TODO

## Plan Approved: Light purple (#C084FC/#A78BFA gradient), update logo to /home/abiconcepcion/Downloads/f9297272-f65a-448c-be2d-2d11e7b7a845 (1).png

### Step 1: Core Colors [ ]
- Update constants.tsx COLORS to light purple palette

### Step 2: Logo Update [x]
- Copied new purple logo to public/logo.png
- Updated App.tsx img src to /logo.png

### Step 3: App-wide Theme [x]
- App.tsx: Loading screens/gradients to purple
- Home.tsx: Header/services/cart icon to purple
- MerchantDashboard.tsx, OrderTracking.tsx, RiderDashboard.tsx: Purple theming

### Step 4: Components & Screens [x]
- MerchantDashboard.tsx, OrderTracking.tsx, RiderDashboard.tsx: All gradients/text to purple
- Button.tsx: ghost uses COLORS.primary

### Step 5: Test & Build [x]
- npm run build (running)
- npx cap sync android
- Visual verification
