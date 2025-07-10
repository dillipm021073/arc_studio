// Recovery utility for Interface Builder projects

export async function recoverInterfaceBuilderProjects() {
  console.log('🔍 Starting Interface Builder project recovery...\n');
  
  const recoveredProjects = [];
  
  // 1. Check localStorage for any saved projects
  console.log('1. Checking localStorage...');
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('interface-builder') || 
    key.includes('project') ||
    key.includes('canvas')
  );
  
  console.log(`Found ${localStorageKeys.length} relevant localStorage keys:`);
  localStorageKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`- ${key}: ${value ? value.substring(0, 100) + '...' : 'empty'}`);
    
    if (value && key.includes('project')) {
      try {
        const data = JSON.parse(value);
        if (Array.isArray(data)) {
          recoveredProjects.push(...data);
        } else if (data.nodes || data.edges) {
          recoveredProjects.push(data);
        }
      } catch (e) {
        console.log(`  ⚠️ Could not parse ${key}`);
      }
    }
  });
  
  // 2. Check for canvas data
  const canvasData = localStorage.getItem('interface-builder-current-canvas');
  if (canvasData) {
    try {
      const data = JSON.parse(canvasData);
      console.log(`\n2. Found canvas data with ${data.nodes?.length || 0} nodes and ${data.edges?.length || 0} edges`);
      
      if (data.nodes?.length > 0) {
        recoveredProjects.push({
          id: `recovered-canvas-${Date.now()}`,
          name: 'Recovered Canvas Data',
          description: 'Recovered from localStorage canvas data',
          category: 'Recovered',
          nodes: data.nodes,
          edges: data.edges,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            source: 'localStorage-canvas',
            recoveredAt: new Date().toISOString()
          }
        });
      }
    } catch (e) {
      console.log('⚠️ Could not parse canvas data');
    }
  }
  
  // 3. Check IndexedDB (if used)
  console.log('\n3. Checking IndexedDB...');
  try {
    const databases = await indexedDB.databases();
    const relevantDbs = databases.filter(db => 
      db.name?.includes('interface') || 
      db.name?.includes('builder') ||
      db.name?.includes('project')
    );
    
    console.log(`Found ${relevantDbs.length} relevant databases:`, relevantDbs.map(db => db.name));
    
    for (const dbInfo of relevantDbs) {
      if (dbInfo.name) {
        try {
          const db = await openDatabase(dbInfo.name);
          const stores = Array.from(db.objectStoreNames);
          console.log(`  Database ${dbInfo.name} has stores:`, stores);
          
          for (const storeName of stores) {
            const data = await getAllFromStore(db, storeName);
            if (data.length > 0) {
              console.log(`    Found ${data.length} items in ${storeName}`);
              recoveredProjects.push(...data.filter(item => item.nodes || item.edges));
            }
          }
          db.close();
        } catch (e) {
          console.log(`  ⚠️ Could not open database ${dbInfo.name}`);
        }
      }
    }
  } catch (e) {
    console.log('⚠️ IndexedDB not available or error accessing it');
  }
  
  // 4. Try to fetch from API
  console.log('\n4. Checking API/Database...');
  try {
    const response = await fetch('/api/interface-builder/projects', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const apiProjects = await response.json();
      console.log(`Found ${apiProjects.length} projects in database`);
      
      apiProjects.forEach((project: any) => {
        if (project.projectData) {
          try {
            const data = typeof project.projectData === 'string' 
              ? JSON.parse(project.projectData) 
              : project.projectData;
              
            recoveredProjects.push({
              id: project.id,
              name: project.name,
              description: project.description,
              category: 'Database',
              nodes: data.nodes || [],
              edges: data.edges || [],
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              metadata: {
                source: 'database',
                userId: project.userId
              }
            });
          } catch (e) {
            console.log(`⚠️ Could not parse project ${project.id} data`);
          }
        }
      });
    } else {
      console.log('⚠️ Could not fetch from API:', response.status);
    }
  } catch (e) {
    console.log('⚠️ API request failed:', e);
  }
  
  // 5. Remove duplicates
  const uniqueProjects = removeDuplicates(recoveredProjects);
  
  console.log(`\n✅ Recovery complete! Found ${uniqueProjects.length} unique projects`);
  
  return uniqueProjects;
}

// Helper functions
function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      resolve([]);
    }
  });
}

function removeDuplicates(projects: any[]): any[] {
  const seen = new Map();
  
  projects.forEach(project => {
    const key = `${project.nodes?.length || 0}-${project.edges?.length || 0}-${project.name}`;
    if (!seen.has(key) || new Date(project.updatedAt) > new Date(seen.get(key).updatedAt)) {
      seen.set(key, project);
    }
  });
  
  return Array.from(seen.values());
}

// Function to restore projects
export async function restoreProjects(projects: any[]) {
  console.log(`\n🔧 Restoring ${projects.length} projects...`);
  
  let restored = 0;
  let failed = 0;
  
  for (const project of projects) {
    try {
      // Skip if it's already in the database
      if (project.metadata?.source === 'database') {
        console.log(`✓ Project "${project.name}" already in database`);
        restored++;
        continue;
      }
      
      // Create a new project in the database
      const response = await fetch('/api/interface-builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: project.name || `Recovered Project ${restored + 1}`,
          description: project.description || 'Recovered project',
          category: project.category || 'custom',
          nodes: project.nodes || [],
          edges: project.edges || [],
          metadata: project.metadata || {}
        })
      });
      
      if (response.ok) {
        console.log(`✓ Restored project: ${project.name}`);
        restored++;
      } else {
        console.log(`✗ Failed to restore project: ${project.name}`, await response.text());
        failed++;
      }
    } catch (e) {
      console.log(`✗ Error restoring project: ${project.name}`, e);
      failed++;
    }
  }
  
  console.log(`\n📊 Restoration complete: ${restored} restored, ${failed} failed`);
  
  return { restored, failed };
}

// Function to export projects as backup
export function exportProjectsAsBackup(projects: any[]) {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects: projects
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interface-builder-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log(`💾 Exported ${projects.length} projects as backup`);
}