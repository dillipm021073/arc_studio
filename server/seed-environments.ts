import { db } from "./db";
import { apiTestEnvironments, apiTestEnvironmentVariables } from "@shared/schema";
import { nanoid } from "nanoid";

export async function seedEnvironments() {
  console.log("🌍 Seeding default API test environments...");

  try {
    // Check if environments already exist
    const existingEnvs = await db.select().from(apiTestEnvironments);
    if (existingEnvs.length > 0) {
      console.log("✅ Environments already exist, skipping...");
      return;
    }

    // Create default environments
    const environments = [
      {
        id: nanoid(),
        name: "development",
        displayName: "Development",
        description: "Development environment for testing",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        name: "staging",
        displayName: "Staging",
        description: "Staging environment for pre-production testing",
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        name: "production",
        displayName: "Production",
        description: "Production environment",
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert environments
    await db.insert(apiTestEnvironments).values(environments);
    console.log(`✅ Created ${environments.length} default environments`);

    // Create default environment variables
    const environmentVariables = [
      // Development environment variables
      {
        id: nanoid(),
        environmentId: environments[0].id,
        key: "API_BASE_URL",
        value: "http://localhost:3000/api",
        description: "Base URL for API endpoints",
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        environmentId: environments[0].id,
        key: "AUTH_TOKEN",
        value: "dev-token-12345",
        description: "Authentication token for development",
        isSecret: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Staging environment variables
      {
        id: nanoid(),
        environmentId: environments[1].id,
        key: "API_BASE_URL",
        value: "https://staging-api.example.com",
        description: "Base URL for API endpoints",
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        environmentId: environments[1].id,
        key: "AUTH_TOKEN",
        value: "staging-token-67890",
        description: "Authentication token for staging",
        isSecret: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Production environment variables
      {
        id: nanoid(),
        environmentId: environments[2].id,
        key: "API_BASE_URL",
        value: "https://api.example.com",
        description: "Base URL for API endpoints",
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nanoid(),
        environmentId: environments[2].id,
        key: "AUTH_TOKEN",
        value: "prod-token-secure",
        description: "Authentication token for production",
        isSecret: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert environment variables
    await db.insert(apiTestEnvironmentVariables).values(environmentVariables);
    console.log(`✅ Created ${environmentVariables.length} default environment variables`);

    console.log("\n📋 Default environments created:");
    console.log("  - Development (localhost)");
    console.log("  - Staging");
    console.log("  - Production");

  } catch (error) {
    console.error("❌ Error seeding environments:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEnvironments()
    .then(() => {
      console.log("✅ Environment seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Environment seeding failed:", error);
      process.exit(1);
    });
}