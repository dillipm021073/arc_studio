# Checkout Lock Cleanup Fix

## Issue
Applications were showing expired checkout locks that were not being automatically cleaned up. When a checkout lock expired after 24 hours, it remained in the database, preventing proper checkout behavior.

## Root Cause
The system was not automatically cleaning up expired locks. While locks had expiry times, there was no mechanism to remove them once they expired.

## Solution Implemented

### 1. Lock Cleanup Service
Created a new service (`server/services/lock-cleanup.service.ts`) that:
- Runs automatically every hour
- Cleans up expired locks
- Removes locks from completed/cancelled initiatives
- Provides manual cleanup capability

### 2. Automatic Cleanup on Server Start
Modified `server/index.ts` to:
- Start the lock cleanup service when the server starts
- Gracefully stop the service on shutdown

### 3. Cleanup Before Checkout
Updated `server/services/version-control.service.ts` to:
- Clean expired locks for an artifact before attempting checkout
- Prevents conflicts with stale locks

### 4. Database Cleanup Script
Created `scripts/fix-checkout-persistence.ts` to:
- Clean all existing expired locks
- Remove locks from completed/cancelled initiatives
- Update remaining active locks with new expiry times

## How Checkout Works

1. **Checkout**: Creates a lock with 24-hour expiry and a version record
2. **Cancel Checkout**: Removes the lock and deletes uncommitted versions
3. **Initiative Completion**: Removes all locks for that initiative
4. **Initiative Cancellation**: Removes all locks and non-baseline versions

## Running the Fix

1. The cleanup service starts automatically with the server
2. To manually clean expired locks: Run `npx tsx scripts/fix-checkout-persistence.ts`
3. To check current lock state: Run `npx tsx scripts/check-checkout-state.ts`

## Prevention
The automatic cleanup service now prevents this issue from recurring by:
- Running hourly cleanup of expired locks
- Cleaning expired locks before new checkouts
- Removing locks when initiatives are completed/cancelled