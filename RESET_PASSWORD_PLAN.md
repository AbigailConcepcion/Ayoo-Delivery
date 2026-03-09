# Reset Password Fix Plan

## Issues Identified

1. **Backend Bug**: The PUT `/users/:email` endpoint doesn't hash the password when updating. It stores the plain password directly in the database.

2. **Frontend Bug**: The forgot password flow in Auth.tsx doesn't validate password length (min 6 characters) before calling `db.updatePassword()`.

3. **UX Issue**: The forgot password flow doesn't have a confirm password field to ensure the user typed the new password correctly.

## Plan

### Step 1: Fix Backend Password Update (server/src/routes.ts)
- Add password hashing logic when password field is being updated
- Validate that password meets minimum length requirement (6 chars)
- Hash the new password before saving to database

### Step 2: Fix Frontend Auth Flow (screens/Auth.tsx)
- Add password validation in forgot password step 2 (min 6 chars)
- Add confirm password field in forgot password step 2
- Validate that password and confirm password match

## Files to Edit

1. `/home/abiconcepcion/Projects/Ayoo-Delivery/server/src/routes.ts` - Add password hashing for updates
2. `/home/abiconcepcion/Projects/Ayoo-Delivery/screens/Auth.tsx` - Add validation and confirm password field

## Dependent Files
- None (these are the only files that need changes)

## Followup Steps
- Test the forgot password flow in the app
- Verify password is properly hashed in the database when using real backend

