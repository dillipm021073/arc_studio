-- Add TM Forum domain classification fields to applications table
ALTER TABLE applications 
ADD COLUMN tmf_domain text,
ADD COLUMN tmf_sub_domain text,
ADD COLUMN tmf_process_area text,
ADD COLUMN tmf_capability text;

-- Add TM Forum domain fields to interfaces table
ALTER TABLE interfaces 
ADD COLUMN tmf_integration_pattern text,
ADD COLUMN tmf_domain_interaction text;

-- Add TM Forum eTOM fields to business_processes table
ALTER TABLE business_processes 
ADD COLUMN tmf_etom_l1 text,
ADD COLUMN tmf_etom_l2 text,
ADD COLUMN tmf_etom_l3 text,
ADD COLUMN tmf_etom_l4 text;

-- Add comments for documentation
COMMENT ON COLUMN applications.tmf_domain IS 'TM Forum domain classification: product, customer, service, resource, partner, enterprise';
COMMENT ON COLUMN applications.tmf_sub_domain IS 'More specific sub-domain classification within the TM Forum domain';
COMMENT ON COLUMN applications.tmf_process_area IS 'eTOM process area mapping for this application';
COMMENT ON COLUMN applications.tmf_capability IS 'Specific capability within the TM Forum domain';

COMMENT ON COLUMN interfaces.tmf_integration_pattern IS 'Standard TM Forum integration pattern used by this interface';
COMMENT ON COLUMN interfaces.tmf_domain_interaction IS 'TM Forum domain interaction type (e.g., service-to-resource, product-to-service)';

COMMENT ON COLUMN business_processes.tmf_etom_l1 IS 'Level 1 eTOM process (e.g., Operations)';
COMMENT ON COLUMN business_processes.tmf_etom_l2 IS 'Level 2 eTOM process (e.g., Service Management & Operations)';
COMMENT ON COLUMN business_processes.tmf_etom_l3 IS 'Level 3 eTOM process (e.g., Service Configuration & Activation)';
COMMENT ON COLUMN business_processes.tmf_etom_l4 IS 'Level 4 eTOM process (specific activity)';