-- Complete fix for Kenan_V7 application to properly show as pending in initiative

-- Step 1: Check if the Kenan_V7 initiative exists and get its ID
SELECT initiative_id, name, status FROM initiatives WHERE name LIKE '%Kenan_V7%';

-- Step 2: Get the Kenan_V7 application details
SELECT id, name, artifact_state, initiative_origin FROM applications WHERE name = 'Kenan_V7';

-- Step 3: Update the application to pending state (use the alternative that auto-finds initiative)
UPDATE applications 
SET 
    artifact_state = 'pending',
    initiative_origin = (SELECT initiative_id FROM initiatives WHERE name = 'Kenan_V7' LIMIT 1)
WHERE 
    name = 'Kenan_V7'
    AND artifact_state = 'active'
    AND EXISTS (SELECT 1 FROM initiatives WHERE name = 'Kenan_V7');

-- Step 4: Check if an artifact version exists for this application
SELECT 
    av.id,
    av.artifact_type,
    av.artifact_id,
    av.version_number,
    av.initiative_id,
    av.change_type,
    i.name as initiative_name
FROM artifact_versions av
JOIN initiatives i ON av.initiative_id = i.initiative_id
WHERE av.artifact_type = 'application'
AND av.artifact_id = (SELECT id FROM applications WHERE name = 'Kenan_V7' LIMIT 1);

-- Step 5: If no artifact version exists, create one (uncomment and modify as needed)
/*
INSERT INTO artifact_versions (
    artifact_type,
    artifact_id,
    version_number,
    initiative_id,
    is_baseline,
    artifact_data,
    change_type,
    change_reason,
    created_by,
    created_at
)
SELECT 
    'application' as artifact_type,
    a.id as artifact_id,
    1 as version_number,
    i.initiative_id,
    false as is_baseline,
    row_to_json(a) as artifact_data,
    'create' as change_type,
    'New application created in initiative' as change_reason,
    i.created_by,
    CURRENT_TIMESTAMP
FROM applications a
CROSS JOIN initiatives i
WHERE a.name = 'Kenan_V7'
AND i.name = 'Kenan_V7'
AND NOT EXISTS (
    SELECT 1 FROM artifact_versions 
    WHERE artifact_type = 'application' 
    AND artifact_id = a.id
);
*/

-- Step 6: Final verification
SELECT 
    a.id, 
    a.name, 
    a.artifact_state, 
    a.initiative_origin,
    a.status,
    i.name as initiative_name,
    av.version_number,
    av.change_type
FROM applications a
LEFT JOIN initiatives i ON a.initiative_origin = i.initiative_id
LEFT JOIN artifact_versions av ON (av.artifact_type = 'application' AND av.artifact_id = a.id)
WHERE a.name = 'Kenan_V7';