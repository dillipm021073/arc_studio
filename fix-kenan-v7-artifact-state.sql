-- Fix Kenan_V7 application to show as pending since it was created in an initiative
-- First, let's check if the Kenan_V7 initiative exists and get its ID
SELECT initiative_id, name FROM initiatives WHERE name LIKE '%Kenan_V7%';

-- Update the artifact_state for Kenan_V7 application
-- You'll need to replace 'INIT-XXXXX' with the actual initiative_id from the query above
UPDATE applications 
SET 
    artifact_state = 'pending',
    initiative_origin = 'INIT-XXXXX'  -- Replace with actual initiative_id from above query
WHERE 
    name = 'Kenan_V7'
    AND artifact_state = 'active';  -- Only update if it's currently showing as active

-- Alternative: If you want to update based on the initiative name directly
UPDATE applications 
SET 
    artifact_state = 'pending',
    initiative_origin = (SELECT initiative_id FROM initiatives WHERE name = 'Kenan_V7' LIMIT 1)
WHERE 
    name = 'Kenan_V7'
    AND artifact_state = 'active'
    AND EXISTS (SELECT 1 FROM initiatives WHERE name = 'Kenan_V7');

-- Verify the update
SELECT 
    a.id, 
    a.name, 
    a.artifact_state, 
    a.initiative_origin,
    a.status,
    i.name as initiative_name
FROM applications a
LEFT JOIN initiatives i ON a.initiative_origin = i.initiative_id
WHERE a.name = 'Kenan_V7';