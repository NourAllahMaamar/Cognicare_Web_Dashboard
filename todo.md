Scan the entire project for i18n translation key usage (e.g., adminOverview.roleLabels.family) in the source code (JS/TS/TSX/JSX).

Then compare all used keys against the existing translation files:

en.json
fr.json
ar.json

Tasks:

Identify all missing keys in each language file.
For every missing key:
Add it to all three files (en, fr, ar) using the correct nested structure.
Generate appropriate translations:
English (en): clear default label
French (fr): accurate translation
Arabic (ar): accurate translation (RTL-aware, natural phrasing)

Rules:

Preserve existing JSON structure and hierarchy
Do not duplicate existing keys
Keep formatting consistent (indentation, nesting)
If a parent object doesn’t exist, create it

