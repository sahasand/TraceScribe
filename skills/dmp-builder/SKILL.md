# DMP Builder

Generate Data Management Plans from extracted protocol data.

## Standard Sections

1. Purpose and Scope
2. Study Information
3. Roles and Responsibilities
4. Database Design
5. Data Entry
6. Data Validation (Edit Checks)
7. Medical Coding
8. Data Review and Query Management
9. SAE Reconciliation
10. External Data Management
11. Database Lock Procedures
12. Data Transfer
13. Archiving
14. Appendices

## Template Variables

```
{{protocol_number}}, {{study_title}}, {{sponsor}}
{{edc_system}} — e.g., Medidata Rave, Veeva
{{meddra_version}}, {{whodrug_version}}
{{planned_enrollment}}, {{planned_sites}}
{{visits}} (loop for CRF design)
{{procedures}} (loop for data collection)
```

## Key Tables

**Roles and Responsibilities:**
| Role | Responsibility |
|------|----------------|
| Data Manager | Database design, edit checks, query management |
| Medical Coder | AE/MedHx coding, dictionary management |
| Biostatistician | SAP oversight, TLF review |

**Dictionary Versions:**
| Dictionary | Version |
|------------|---------|
| MedDRA | {{meddra_version}} |
| WHODrug | {{whodrug_version}} |

## Formatting

- 4-level numbering: 1, 1.1, 1.1.1, 1.1.1.1
- Arial 11pt body, headings bold
- 1 inch margins
- Header: Protocol number, DMP version
- Footer: Page X of Y
