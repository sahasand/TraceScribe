# Shared Document Generation

Common patterns for Word document generation using docxtpl.

## Template Syntax

**Variables:**
```
{{variable_name}}
```

**Loops:**
```
{% for item in items %}
{{item.property}}
{% endfor %}
```

**Table rows:**
```
{% tr for visit in visits %}
{{visit.name}} | {{visit.timing}}
{% endfor %}
```

**Conditionals:**
```
{% if condition %}
Content
{% endif %}
```

## Python Usage

```python
from docxtpl import DocxTemplate

doc = DocxTemplate("template.docx")
context = {
    "study_title": "...",
    "visits": [...],
    "adverse_events": [...]
}
doc.render(context)
doc.save("output.docx")
```

## Complex Tables

Use python-docx for dynamic tables:

```python
from docx import Document
from docx.shared import Pt

doc = Document()
table = doc.add_table(rows=1, cols=len(visits) + 1)
table.style = 'Table Grid'

# Header row
header = table.rows[0].cells
header[0].text = "Procedure"
for i, visit in enumerate(visits):
    header[i + 1].text = visit["name"]

# Data rows
for proc in procedures:
    row = table.add_row().cells
    row[0].text = proc["name"]
    for i, visit in enumerate(visits):
        if proc["name"] in visit["procedures"]:
            row[i + 1].text = "X"
```

## Formatting Standards

| Element | Specification |
|---------|---------------|
| Body font | Arial 11pt |
| Heading 1 | Arial 14pt Bold |
| Heading 2 | Arial 12pt Bold |
| Margins | 1 inch all sides |
| Line spacing | 1.15 |
