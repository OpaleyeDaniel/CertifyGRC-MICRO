# ISO 27001:2022 compliance module (CertifyGRC)

Self-contained plug-in for **ISO/IEC 27001:2022** assessment content: management system **clauses 4–10** and **Annex A** controls **A.5 through A.8** (all 93 sub-controls in the 2022 structure), with audit-style questions, optional flat export text, and a small Node service API. No runtime dependencies.

## What is included

- `data/clauses.json` — Clauses 4–10 (subclauses 4.1–4.4, 5.1–5.3, 6.1–6.3, 7.1–7.5, 8.1–8.3, 9.1–9.3, 10.1–10.2) and questions; each item has `ref`, `question`, and `answer_type` (`yes_no` | `evidence` | `descriptive`).
- `data/annex_a.json` — Annex A organised by theme (A.5, A.6, A.7, A.8) with every control and its questions.
- `output/iso27001_full_question_list.txt` — Human-readable list of all questions in clause and Annex order (regenerate with the build script if you change source data).
- `iso27001.service.js` — Programmatic access (CommonJS). This folder’s `package.json` sets `"type": "commonjs"` so the module is drop-in friendly.
- `scripts/build-data.mjs` — Regenerates the JSON and `.txt` files from the definitions in the script (Node 18+).

## Regenerating data and the text file

From this directory:

```bash
node scripts/build-data.mjs
```

## Plugging into CertifyGRC (Node / backend)

1. Copy the whole `iso27001` directory into your project (e.g. `modules/iso27001` or `services/iso27001`).

2. **CommonJS** — require the entry or service file:

```js
const iso27001 = require("./iso27001"); // or: require("./iso27001/iso27001.service")
```

3. **ESM** in a project that uses `"type": "module"` — use `createRequire`:

```js
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const iso27001 = require("./path/to/iso27001");
```

## API

| Method | Returns |
|--------|--------|
| `getClauses()` | Object with `standard`, `meta`, and `clauses[]` (each clause has `id` like `clause_4`, `subclauses[]` with `ref`, `title`, `questions[]`). |
| `getAnnexA()` | Object with `standard` and `themes[]` (each theme has `id` `A.5`–`A.8`, `title`, and `controls[]` with `ref`, `title`, `questions[]`). |
| `getQuestionsByClause(clauseId)` | Flat array of questions for one clause, e.g. `"clause_4"`; includes `clause_id`, `subclause_ref`, `answer_type`, etc. |
| `getQuestionsByControl(controlRef)` | Questions for one Annex A control, e.g. `"A.5.1"`. |
| `getAllQuestions()` | Single array: every clause + Annex A question with metadata (`source`: `clause` or `annex_a`). |
| `exportToText()` | String matching `output/iso27001_full_question_list.txt` (reads the file if present, otherwise composes the same content from JSON). |

### Example

```js
const {
  getClauses,
  getAnnexA,
  getQuestionsByClause,
  getQuestionsByControl,
  getAllQuestions,
  exportToText
} = require("./iso27001/iso27001.service");

const clause4 = getQuestionsByClause("clause_4");
const a51 = getQuestionsByControl("A.5.1");
const all = getAllQuestions();
const txt = exportToText();
```

## Conformance notes

- Control titles follow **ISO/IEC 27001:2022** / **ISO/IEC 27002:2022** naming; this module is a **GRC/audit aid**, not a substitute for licensed standards text.
- Questions are **assessment prompts**; adapt wording and evidence types to your organisation and tooling.

## Licence

Unmodified: inherit your CertifyGRC project licence. Content is for implementation assistance only.
