#!/bin/bash

echo "Running database migration..."
echo "This will copy data from source to target database"
echo "Only empty tables in the target will receive data"
echo ""

# Compile and run the TypeScript migration script
npx tsx server/migrate-database.ts