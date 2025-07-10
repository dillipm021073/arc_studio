ALTER TABLE "applications" ADD COLUMN "tmf_domain" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tmf_sub_domain" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tmf_process_area" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "tmf_capability" text;--> statement-breakpoint
ALTER TABLE "business_processes" ADD COLUMN "tmf_etom_l1" text;--> statement-breakpoint
ALTER TABLE "business_processes" ADD COLUMN "tmf_etom_l2" text;--> statement-breakpoint
ALTER TABLE "business_processes" ADD COLUMN "tmf_etom_l3" text;--> statement-breakpoint
ALTER TABLE "business_processes" ADD COLUMN "tmf_etom_l4" text;--> statement-breakpoint
ALTER TABLE "interfaces" ADD COLUMN "tmf_integration_pattern" text;--> statement-breakpoint
ALTER TABLE "interfaces" ADD COLUMN "tmf_domain_interaction" text;--> statement-breakpoint
ALTER TABLE "technical_process_interfaces" ADD COLUMN "sequence_number" integer DEFAULT 0 NOT NULL;