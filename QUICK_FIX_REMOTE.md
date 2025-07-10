# Quick Fix for Remote Machine

## Fastest Method - Direct File Transfer

Run this single command from the ApplicationInterfaceTracker directory:

```bash
scp server/storage.ts abpwrk1@inlnqw1502:/home/abpwrk1/ApplicationInterfaceTracker/server/storage.ts
```

When prompted for password, enter: `Unix11!`

## Then on Remote Machine

1. SSH into remote:
```bash
ssh abpwrk1@inlnqw1502
```
Password: `Unix11!`

2. Navigate and rebuild:
```bash
cd /home/abpwrk1/ApplicationInterfaceTracker
npm run build
```

3. Restart the application:
- If using PM2: `pm2 restart all`
- Otherwise: Stop current process (Ctrl+C) and run `npm run dev`

## Alternative - Using the Fix Package

If you created the fix package:

```bash
# Transfer the package
scp remote-fix-package.tar.gz abpwrk1@inlnqw1502:/home/abpwrk1/

# On remote machine
ssh abpwrk1@inlnqw1502
cd /home/abpwrk1
tar -xzf remote-fix-package.tar.gz
cd ApplicationInterfaceTracker
cp -r ~/remote-fix-package/* .
./apply-fix.sh
```

## Verification

After applying the fix:
1. Access the application in browser
2. Login as admin
3. Go to Settings → User Management
4. Click on any user
5. Try changing their role
6. Click Save - it should work without errors

## What Was Fixed

The storage.ts file had PostgreSQL-specific syntax that doesn't work on all configurations:
- Removed `sql<string | null>'NULL'` syntax
- Simplified all user queries to use standard Drizzle ORM methods
- Now uses `.returning()` and `.select()` without custom column specifications