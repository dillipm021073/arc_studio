# Visual Indicators Final Fix - Complete Solution

## Problem Summary
1. Visual indicators (row colors) not showing after checkout
2. Context menu still showing "Checkout" option after item is checked out
3. Admin users should see appropriate options based on checkout state

## Root Causes Identified
1. **Server-side**: The locks query was incorrectly filtering results when initiativeId was provided
2. **Client-side**: Lock data not refreshing properly after checkout
3. **UI Logic**: Lock ownership comparison needed adjustment

## Fixes Applied

### 1. Server-side Fix (version-control.ts)
Fixed the locks query to properly combine WHERE conditions:
```typescript
// BEFORE (Incorrect - overwrites first WHERE clause):
let query = db.select({...})
  .where(gt(artifactLocks.lockExpiry, new Date()));
if (initiativeId) {
  query = query.where(eq(artifactLocks.initiativeId, initiativeId as string));
}

// AFTER (Correct - combines conditions):
let whereConditions = [gt(artifactLocks.lockExpiry, new Date())];
if (initiativeId) {
  whereConditions.push(eq(artifactLocks.initiativeId, initiativeId as string));
}
const query = db.select({...})
  .where(and(...whereConditions));
```

### 2. Client-side Fixes (applications.tsx)

#### A. Enhanced Lock Fetching
- Added timestamp to prevent caching
- Added refetchOnMount and refetchOnWindowFocus
- Added comprehensive logging
- Added delayed refetch after checkout

#### B. Fixed Context Menu Logic
```typescript
// Corrected lock ownership check
const isLockedByMe = lock && lock.lock.lockedBy === currentUser?.id;
const isLockedByOther = lock && !isLockedByMe;
```

#### C. Added Debug Logging
- Logs locks API response
- Logs each lock check for applications
- Logs context menu state for debugging

### 3. Complete Fix Flow
1. User clicks "Checkout" → API call to checkout endpoint
2. Server creates lock and returns success
3. Client invalidates query cache
4. Client refetches locks (with timestamp to prevent caching)
5. Client triggers delayed refetch after 500ms
6. UI re-renders with new lock data
7. Visual indicators appear (amber background, badges)
8. Context menu shows correct options

## Debug Steps
1. Open browser console (F12)
2. Look for these log messages:
   - "Checkout successful:" (server-side)
   - "Fetching locks for initiative" (server-side)
   - "Locks API response:" (client-side)
   - "isApplicationLocked(id):" (client-side)
   - "Context menu for [app name]:" (client-side)

## Expected Visual States

### Before Checkout
- Default row styling (dark background)
- Context menu shows: "Checkout"
- No badges or indicators

### After Successful Checkout
- **Row**: Amber/yellow background (`bg-amber-950/30`)
- **Border**: Left border in amber (`border-l-4 border-amber-500`)
- **Badge**: "DRAFT" badge next to app name
- **Status Column**: Shows "Checked Out" with amber styling
- **Context Menu**: Shows:
  - Edit
  - Checkin
  - Cancel Checkout (red text)
  - NO "Checkout" option

### For Admin Users
- Same visual indicators as regular users
- Can force cancel other users' checkouts if needed
- Visual state depends on who has the lock, not admin status

## Troubleshooting
If visual indicators still don't appear:

1. Check browser console for errors
2. Verify locks are being created:
   - Look for "Checkout successful" in server logs
   - Check "Locks API response" shows the lock
3. Ensure initiative is selected (not production view)
4. Try hard refresh (Ctrl+F5)
5. Check network tab for locks API call response

## Implementation Notes
- Locks are initiative-specific
- Each artifact can only be checked out once per initiative
- Visual states are determined by lock ownership
- Admin status doesn't affect visual states (only permissions)