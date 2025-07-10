// Utility to clean up SVO Activation Flow project from localStorage and database

export async function cleanupSVOActivationFlow() {
  console.log('🧹 Starting cleanup of SVO Activation Flow project...\n');
  
  let cleanedItems = 0;
  
  // 1. Check and clean localStorage
  console.log('1. Cleaning localStorage...');
  
  // Get current project ID from localStorage
  const currentProjectId = localStorage.getItem('interface-builder-current-project-id');
  console.log(`Current project ID in localStorage: ${currentProjectId}`);
  
  // Check all localStorage keys for SVO references
  const keysToCheck = Object.keys(localStorage);
  for (const key of keysToCheck) {
    const value = localStorage.getItem(key);
    if (value && (value.includes('SVO Activation Flow') || value.includes('SVO'))) {
      console.log(`Found SVO reference in key: ${key}`);
      console.log(`Value preview: ${value.substring(0, 200)}...`);
      
      // Remove the item
      localStorage.removeItem(key);
      cleanedItems++;
      console.log(`✓ Removed ${key}`);
    }
  }
  
  // 2. Check if current project needs to be cleared
  if (currentProjectId) {
    try {
      // Fetch the current project to check if it's SVO
      const response = await fetch(`/api/interface-builder/projects/${currentProjectId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const project = await response.json();
        if (project.name === 'SVO Activation Flow' || project.name.includes('SVO')) {
          console.log(`\n2. Current project is SVO Activation Flow, clearing selection...`);
          localStorage.removeItem('interface-builder-current-project-id');
          cleanedItems++;
          console.log('✓ Cleared current project selection');
        }
      }
    } catch (e) {
      console.log('Could not check current project:', e);
    }
  }
  
  // 3. Clean up any canvas data
  const canvasData = localStorage.getItem('interface-builder-current-canvas');
  if (canvasData) {
    try {
      const data = JSON.parse(canvasData);
      // Check if canvas data contains SVO references
      const jsonString = JSON.stringify(data);
      if (jsonString.includes('SVO')) {
        console.log('\n3. Found SVO references in canvas data, clearing...');
        localStorage.removeItem('interface-builder-current-canvas');
        cleanedItems++;
        console.log('✓ Cleared canvas data');
      }
    } catch (e) {
      console.log('Could not parse canvas data');
    }
  }
  
  // 4. Check IndexedDB
  console.log('\n4. Checking IndexedDB...');
  try {
    const databases = await indexedDB.databases();
    for (const dbInfo of databases) {
      if (dbInfo.name && (dbInfo.name.includes('interface') || dbInfo.name.includes('builder'))) {
        console.log(`Checking database: ${dbInfo.name}`);
        // Note: Actually cleaning IndexedDB would require more complex operations
        // For now, we'll just report if found
      }
    }
  } catch (e) {
    console.log('IndexedDB not available or error accessing it');
  }
  
  console.log(`\n✅ Cleanup complete! Removed ${cleanedItems} items from localStorage`);
  
  // Return summary
  return {
    cleanedItems,
    currentProjectCleared: currentProjectId && cleanedItems > 0
  };
}

// Function to run cleanup from console
export function runCleanup() {
  cleanupSVOActivationFlow().then(result => {
    console.log('\nCleanup Summary:', result);
    if (result.currentProjectCleared) {
      console.log('ℹ️ Please refresh the page to see the changes');
    }
  });
}