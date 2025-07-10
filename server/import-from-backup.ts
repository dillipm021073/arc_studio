import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function importFromBackup() {
  try {
    console.log("🔄 Starting import from backup...");
    
    // Read the all-data.json file
    const backupFilePath = path.join(process.cwd(), 'temp_import', 'data', 'all-data.json');
    
    if (!fs.existsSync(backupFilePath)) {
      console.error("❌ Backup file not found at:", backupFilePath);
      process.exit(1);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    console.log("✅ Backup file loaded successfully");
    
    // Make API call to import endpoint
    const apiUrl = `http://localhost:${process.env.PORT || 5000}/api/import`;
    
    console.log("📤 Sending data to import API...");
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: backupData,
        mode: 'incremental' // Use incremental to preserve users
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("✅ Import successful!");
      console.log("📊 Import summary:", result.summary || result.message);
      
      if (result.details) {
        console.log("\n📋 Import details:");
        Object.entries(result.details).forEach(([entity, count]) => {
          console.log(`  - ${entity}: ${count} records`);
        });
      }
    } else {
      console.error("❌ Import failed:", result.message || "Unknown error");
      if (result.details) {
        console.error("Details:", result.details);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during import:", error);
  } finally {
    // Clean up temporary directory
    const tempDir = path.join(process.cwd(), 'temp_import');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log("🧹 Temporary import directory cleaned up");
    }
    process.exit(0);
  }
}

// Check if server is running
fetch(`http://localhost:${process.env.PORT || 5000}/api/test-db`)
  .then(() => {
    console.log("✅ Server is running, proceeding with import...");
    importFromBackup();
  })
  .catch(() => {
    console.error("❌ Server is not running. Please start the server first with 'npm run dev'");
    process.exit(1);
  });