import { db } from "./db";
import { 
  applications, 
  interfaces, 
  changeRequests, 
  businessProcesses,
  interfaceComments,
  changeRequestApplications,
  changeRequestInterfaces,
  businessProcessInterfaces,
  interfaceVersions,
  interfaceConsumerDescriptions,
  imlDiagrams,
  users
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function fixNullValues() {
  console.log("Starting to fix null values in database...");

  try {
    // Fix applications table
    console.log("Fixing applications table...");
    await db.execute(sql`
      UPDATE applications 
      SET 
        description = COALESCE(description, 'No description provided'),
        os = COALESCE(os, 'Unknown'),
        deployment = COALESCE(deployment, 'on-premise'),
        uptime = COALESCE(uptime, 99.9),
        purpose = COALESCE(purpose, 'Business application'),
        prov_interface_type = CASE 
          WHEN provides_ext_interface = true AND prov_interface_type IS NULL 
          THEN 'REST' 
          ELSE COALESCE(prov_interface_type, 'None')
        END,
        cons_interface_type = CASE 
          WHEN consumes_ext_interfaces = true AND cons_interface_type IS NULL 
          THEN 'REST' 
          ELSE COALESCE(cons_interface_type, 'None')
        END,
        first_active_date = COALESCE(first_active_date, CURRENT_TIMESTAMP)
      WHERE 
        description IS NULL OR
        os IS NULL OR
        deployment IS NULL OR
        uptime IS NULL OR
        purpose IS NULL OR
        prov_interface_type IS NULL OR
        cons_interface_type IS NULL OR
        first_active_date IS NULL
    `);

    // Fix interfaces table
    console.log("Fixing interfaces table...");
    await db.execute(sql`
      UPDATE interfaces 
      SET 
        business_process_name = COALESCE(business_process_name, 'General Business Process'),
        customer_focal = COALESCE(customer_focal, 'TBD'),
        provider_owner = COALESCE(provider_owner, 'Provider Team'),
        consumer_owner = COALESCE(consumer_owner, 'Consumer Team'),
        sample_code = COALESCE(sample_code, '// Sample code to be provided'),
        connectivity_steps = COALESCE(connectivity_steps, '1. Verify network connectivity\n2. Check endpoint availability\n3. Test authentication'),
        interface_test_steps = COALESCE(interface_test_steps, '1. Send test request\n2. Verify response format\n3. Check response data')
      WHERE 
        business_process_name IS NULL OR
        customer_focal IS NULL OR
        provider_owner IS NULL OR
        consumer_owner IS NULL OR
        sample_code IS NULL OR
        connectivity_steps IS NULL OR
        interface_test_steps IS NULL
    `);

    // Fix change requests table
    console.log("Fixing change requests table...");
    await db.execute(sql`
      UPDATE change_requests 
      SET 
        description = COALESCE(description, title),
        reason = COALESCE(reason, 'Business requirement'),
        benefit = COALESCE(benefit, 'Improved system functionality'),
        priority = COALESCE(priority, 'medium'),
        owner = COALESCE(owner, 'Change Management Team'),
        requested_by = COALESCE(requested_by, 'Business Team'),
        target_date = CASE 
          WHEN target_date IS NULL AND status IN ('draft', 'submitted', 'under_review', 'approved', 'in_progress')
          THEN CURRENT_TIMESTAMP + INTERVAL '30 days'
          ELSE target_date
        END,
        completed_date = CASE 
          WHEN completed_date IS NULL AND status = 'completed'
          THEN updated_at
          ELSE completed_date
        END,
        approved_by = CASE 
          WHEN approved_by IS NULL AND status IN ('approved', 'in_progress', 'completed')
          THEN 'Approval Board'
          ELSE approved_by
        END
      WHERE 
        description IS NULL OR
        reason IS NULL OR
        benefit IS NULL OR
        priority IS NULL OR
        owner IS NULL OR
        requested_by IS NULL OR
        (target_date IS NULL AND status IN ('draft', 'submitted', 'under_review', 'approved', 'in_progress')) OR
        (completed_date IS NULL AND status = 'completed') OR
        (approved_by IS NULL AND status IN ('approved', 'in_progress', 'completed'))
    `);

    // Fix business processes table
    console.log("Fixing business processes table...");
    await db.execute(sql`
      UPDATE business_processes 
      SET 
        domain_owner = COALESCE(domain_owner, 'Domain Team'),
        it_owner = COALESCE(it_owner, 'IT Team'),
        vendor_focal = COALESCE(vendor_focal, 'Vendor Support')
      WHERE 
        domain_owner IS NULL OR
        it_owner IS NULL OR
        vendor_focal IS NULL
    `);

    // Remove interface comments fix as comment_type doesn't exist in schema

    // Fix change request applications table
    console.log("Fixing change request applications table...");
    await db.execute(sql`
      UPDATE change_request_applications 
      SET 
        impact_type = COALESCE(impact_type, 'modification'),
        impact_description = COALESCE(impact_description, 'Impact to be assessed')
      WHERE 
        impact_type IS NULL OR
        impact_description IS NULL
    `);

    // Fix change request interfaces table
    console.log("Fixing change request interfaces table...");
    await db.execute(sql`
      UPDATE change_request_interfaces 
      SET 
        impact_type = COALESCE(impact_type, 'modification'),
        impact_description = COALESCE(impact_description, 'Impact to be assessed')
      WHERE 
        impact_type IS NULL OR
        impact_description IS NULL
    `);

    // Fix business process interfaces table
    console.log("Fixing business process interfaces table...");
    await db.execute(sql`
      UPDATE business_process_interfaces 
      SET 
        sequence_number = COALESCE(sequence_number, 1),
        description = COALESCE(description, 'Interface usage in business process'),
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
      WHERE 
        sequence_number IS NULL OR
        description IS NULL OR
        created_at IS NULL
    `);

    // Fix interface versions table
    console.log("Fixing interface versions table...");
    await db.execute(sql`
      UPDATE interface_versions 
      SET 
        change_description = COALESCE(change_description, 'Version update'),
        sample_code = COALESCE(sample_code, '// Sample code to be provided'),
        connectivity_steps = COALESCE(connectivity_steps, '1. Verify network connectivity\n2. Check endpoint availability\n3. Test authentication'),
        interface_test_steps = COALESCE(interface_test_steps, '1. Send test request\n2. Verify response format\n3. Check response data'),
        created_by = COALESCE(created_by, 'System')
      WHERE 
        change_description IS NULL OR
        sample_code IS NULL OR
        connectivity_steps IS NULL OR
        interface_test_steps IS NULL OR
        created_by IS NULL
    `);

    // Fix interface consumer descriptions table
    console.log("Fixing interface consumer descriptions table...");
    await db.execute(sql`
      UPDATE interface_consumer_descriptions 
      SET 
        description = COALESCE(description, 'Consumer-specific description to be provided'),
        response_format = COALESCE(response_format, 'JSON'),
        notes = COALESCE(notes, '')
      WHERE 
        description IS NULL OR
        response_format IS NULL OR
        notes IS NULL
    `);

    // Fix IML diagrams table
    console.log("Fixing IML diagrams table...");
    await db.execute(sql`
      UPDATE iml_diagrams 
      SET 
        notes = COALESCE(notes, ''),
        created_by = COALESCE(created_by, 'System'),
        last_modified_by = COALESCE(last_modified_by, 'System')
      WHERE 
        notes IS NULL OR
        created_by IS NULL OR
        last_modified_by IS NULL
    `);

    // Show summary of changes
    console.log("\n5. Generating summary report...");
    
    const appCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM applications 
      WHERE description = 'No description provided' 
        OR os = 'Unknown' 
        OR purpose = 'Business application'
    `);
    
    const intCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM interfaces 
      WHERE business_process_name = 'General Business Process' 
        OR customer_focal = 'TBD'
    `);
    
    const crCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM change_requests 
      WHERE reason = 'Business requirement' 
        OR benefit = 'Improved system functionality'
    `);
    
    const bpCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM business_processes 
      WHERE domain_owner = 'Domain Team' 
        OR it_owner = 'IT Team' 
        OR vendor_focal = 'Vendor Support'
    `);

    console.log("\n=== Summary Report ===");
    console.log(`Applications with default values: ${appCount.rows[0]?.count || 0}`);
    console.log(`Interfaces with default values: ${intCount.rows[0]?.count || 0}`);
    console.log(`Change Requests with default values: ${crCount.rows[0]?.count || 0}`);
    console.log(`Business Processes with default values: ${bpCount.rows[0]?.count || 0}`);
    
    console.log("\n✓ All null values have been fixed successfully!");

  } catch (error) {
    console.error("Error fixing null values:", error);
    process.exit(1);
  }
}

// Run the fix
fixNullValues().then(() => {
  console.log("\nScript completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});