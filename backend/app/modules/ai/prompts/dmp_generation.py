"""DMP generation prompts."""

DMP_GENERATION_PROMPT = """You are a clinical data manager creating a Data Management Plan (DMP).

Generate comprehensive DMP content based on:

PROTOCOL DATA:
{protocol_data}

Generate the following DMP sections in JSON format:

{{
  "purpose_and_scope": "Overview of DMP purpose and scope",
  "study_information": "Summary of study design and objectives",
  "roles_and_responsibilities": "Detailed roles table content",
  "database_design": "Database structure and CRF design description",
  "data_entry": "Data entry procedures and guidelines",
  "data_validation": "Edit check specifications and validation rules",
  "medical_coding": "MedDRA and WHODrug coding procedures",
  "query_management": "Data review and query management procedures",
  "sae_reconciliation": "SAE reconciliation process",
  "external_data": "External data management procedures",
  "database_lock": "Database lock procedures",
  "data_transfer": "Data transfer specifications",
  "archiving": "Document archiving procedures"
}}

Include specific details based on the protocol:
- Visit schedule for CRF design
- Procedures for data collection forms
- Endpoints for edit check logic

Return ONLY valid JSON, no markdown formatting."""
