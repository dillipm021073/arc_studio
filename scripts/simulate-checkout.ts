import { config } from 'dotenv';

// Load environment variables
config();

async function simulateCheckout() {
  try {
    console.log("\n=== Simulating Checkout via API ===\n");

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    
    // First, we need to login to get a session
    console.log("1. Logging in...");
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log("✓ Login successful:", loginData.user.username);

    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers.get('set-cookie');
    
    // 2. Get active initiatives
    console.log("\n2. Getting active initiatives...");
    const initiativesResponse = await fetch(`${baseUrl}/api/initiatives?status=active`, {
      headers: { 
        'Cookie': cookies || ''
      }
    });

    const initiatives = await initiativesResponse.json();
    console.log(`✓ Found ${initiatives.length} active initiatives`);
    
    if (initiatives.length === 0) {
      console.log("No active initiatives found!");
      return;
    }

    const initiative = initiatives[0];
    console.log(`Using initiative: ${initiative.name} (${initiative.initiativeId})`);

    // 3. Perform checkout
    console.log("\n3. Performing checkout...");
    const checkoutData = {
      artifactType: 'application',
      artifactId: 189, // Using the application from logs
      initiativeId: initiative.initiativeId
    };
    
    console.log("Checkout request:", checkoutData);
    
    const checkoutResponse = await fetch(`${baseUrl}/api/version-control/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify(checkoutData)
    });

    const checkoutResult = await checkoutResponse.json();
    
    if (!checkoutResponse.ok) {
      console.log("✗ Checkout failed:", checkoutResult);
    } else {
      console.log("✓ Checkout response:", checkoutResult);
    }

    // 4. Check locks
    console.log("\n4. Checking locks...");
    const locksResponse = await fetch(`${baseUrl}/api/version-control/locks`, {
      headers: { 
        'Cookie': cookies || ''
      }
    });

    const locks = await locksResponse.json();
    console.log(`✓ Active locks: ${locks.length}`);
    
    if (locks.length > 0) {
      console.log("Locks:", locks);
    }

    console.log("\n=== Simulation Complete ===\n");

  } catch (error) {
    console.error("Error in simulation:", error);
  } finally {
    process.exit(0);
  }
}

// Wait a bit for server to be ready
setTimeout(simulateCheckout, 2000);