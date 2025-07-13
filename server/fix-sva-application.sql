-- Fix SVA Application to show as pending with correct initiative origin
-- This script fixes the SVA application that was incorrectly created as active instead of pending

-- First, find the Kenan_V7 initiative ID
-- Note: You may need to adjust this query if the initiative name is different
DO $$
DECLARE
    v_initiative_id TEXT;
    v_app_id INTEGER;
BEGIN
    -- Get the Kenan_V7 initiative ID
    SELECT initiative_id INTO v_initiative_id
    FROM initiatives 
    WHERE name LIKE '%Kenan%V7%' 
    LIMIT 1;
    
    IF v_initiative_id IS NULL THEN
        RAISE NOTICE 'Kenan_V7 initiative not found. Please check the initiative name.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found initiative: %', v_initiative_id;
    
    -- Get the SVA application ID
    SELECT id INTO v_app_id
    FROM applications
    WHERE name = 'SVA'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_app_id IS NULL THEN
        RAISE NOTICE 'SVA application not found.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found SVA application with ID: %', v_app_id;
    
    -- Update the SVA application
    UPDATE applications
    SET 
        artifact_state = 'pending',
        initiative_origin = v_initiative_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_app_id
    AND artifact_state = 'active'  -- Only update if it's currently active
    AND initiative_origin IS NULL;  -- Only update if initiative_origin is not set
    
    IF FOUND THEN
        RAISE NOTICE 'Successfully updated SVA application to pending state with initiative origin: %', v_initiative_id;
    ELSE
        RAISE NOTICE 'SVA application was already updated or has different state.';
    END IF;
    
    -- Also fix any other applications that might have been created today with the same issue
    UPDATE applications
    SET 
        artifact_state = 'pending',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        created_at > CURRENT_DATE
        AND initiative_origin IS NOT NULL
        AND artifact_state = 'active';
        
    GET DIAGNOSTICS v_app_id = ROW_COUNT;
    IF v_app_id > 0 THEN
        RAISE NOTICE 'Fixed % additional applications that had initiative_origin but were marked as active', v_app_id;
    END IF;
    
END $$;

-- Verify the fix
SELECT 
    id,
    name,
    artifact_state,
    initiative_origin,
    created_at,
    updated_at
FROM applications
WHERE name = 'SVA'
ORDER BY created_at DESC
LIMIT 1;