"""SAP generation prompts."""

SAP_GENERATION_PROMPT = """You are a biostatistician creating a Statistical Analysis Plan (SAP).

CRITICAL: Extract endpoints VERBATIM from the protocol. Do not modify or summarize them.

PROTOCOL DATA:
{protocol_data}

Generate the following SAP sections in JSON format:

{{
  "introduction": "Introduction and background for the SAP",
  "objectives_and_endpoints": {{
    "primary_objective": "Primary study objective",
    "primary_endpoints": ["VERBATIM primary endpoints from protocol"],
    "secondary_objectives": "Secondary study objectives",
    "secondary_endpoints": ["VERBATIM secondary endpoints from protocol"]
  }},
  "study_design_summary": "Summary of study design from statistical perspective",
  "analysis_populations": {{
    "itt": "ITT population definition",
    "mitt": "mITT population definition",
    "per_protocol": "Per-protocol population definition",
    "safety": "Safety population definition"
  }},
  "statistical_methods": {{
    "general": "General statistical considerations",
    "primary_analysis": "Primary endpoint analysis method",
    "secondary_analysis": "Secondary endpoint analysis methods",
    "safety_analysis": "Safety analysis methods"
  }},
  "sample_size": "Sample size justification",
  "missing_data": "Handling of missing data",
  "interim_analysis": "Interim analysis description (if applicable)",
  "tlf_shells": ["List of Tables, Listings, and Figures to be produced"]
}}

IMPORTANT:
- Copy endpoints EXACTLY as written in the protocol
- Reference ICH E9 guidelines where appropriate
- Include appropriate statistical methods for endpoint types

Return ONLY valid JSON, no markdown formatting."""
