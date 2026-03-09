# Leaderboard Feature Implementation Plan

## 1. Information Gathered

### Current State:
- **User Roles**: System supports 4 roles: `CUSTOMER`, `MERCHANT`, `RIDER`, `ADMIN`
- **Community Section**: Already has static leaderboard data in `Home.tsx` with `TOP_RIDERS` and `FEATURED_MERCHANTS`
- **Data Available**: Orders have customerEmail, riderEmail, restaurantName, rating, tipAmount, total, date
- **Admin Panel**: Shows user list but no leaderboard functionality

### User Request:
- Role-specific leaderboards:
  - **Customers**: Top month/week customer ranking (by orders/spent)
  - **Merchants**: Merchant leaderboard ranking (by orders/ratings)
  - **Riders**: Top month/week rider ratings (by deliveries/ratings)
- All leaderboards viewable in Admin Panel
- Question: Should we display all user roles ranking in one screen OR role-specific leaderboards?

### Recommendation:
**Role-specific leaderboards** - This is better because:
- Different metrics for each role (orders count, earnings, ratings)
- More relevant/engaging for each user type
- Cleaner UI experience

---

## 2. Implementation Plan

### Step 1: Add Leaderboard Types to types.ts
- Create `LeaderboardEntry` interface
- Create `LeaderboardType` ('customers' | 'merchants' | 'riders')
- Add `LeaderboardPeriod` ('week' | 'month' | 'all')

### Step 2: Create Leaderboard Utility Functions in db.ts
- `getCustomerLeaderboard(period)`: Rank by orders count and total spent
- `getMerchantLeaderboard(period)`: Rank by orders completed and average rating
- `getRiderLeaderboard(period)`: Rank by deliveries and average rating

### Step 3: Update Home.tsx Community Tab
- Dynamic leaderboard based on current user's role:
  - If CUSTOMER: Show customer leaderboard
  - If MERCHANT: Show merchant leaderboard
  - If RIDER: Show rider leaderboard
- Add period toggle (Week/Month)
- Use real data from database

### Step 4: Update AdminPanel.tsx
- Add "Leaderboard" tab
- Show all three leaderboards (customers, merchants, riders)
- Add period filter

### Step 5: Add Leaderboard API Methods in api.ts
- Backend-compatible methods for fetching leaderboard data

---

## 3. Dependent Files to Edit

1. **types.ts** - Add leaderboard interfaces
2. **db.ts** - Add leaderboard calculation methods
3. **api.ts** - Add leaderboard API methods
4. **screens/Home.tsx** - Update Community tab with dynamic leaderboards
5. **screens/AdminPanel.tsx** - Add Leaderboard tab

---

## 4. Metrics for Each Role

### Customer Leaderboard:
- Orders count (primary)
- Total amount spent (secondary)
- Account age / join date

### Merchant Leaderboard:
- Orders completed
- Average rating
- Total earnings

### Rider Leaderboard:
- Deliveries completed
- Average rating
- Total earnings

---

## 5. Follow-up Steps

1. Implement the types and interfaces
2. Create leaderboard calculation logic
3. Update Home.tsx to show role-appropriate leaderboard
4. Update AdminPanel.tsx to include leaderboard view
5. Test the implementation

