/**
 * Writes question text exactly as defined for the CertifyGRC ISO 27001 UI
 * (client/frameworks/iso27001/data/clauses.ts + annexA.ts).
 *
 * Run from repo root: npx tsx iso27001/scripts/export-ui-questions.mts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ISO_CLAUSES } from "../../client/frameworks/iso27001/data/clauses.ts";
import { ANNEX_A } from "../../client/frameworks/iso27001/data/annexA.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "output");

function sep(title: string): string {
  return `${"=".repeat(60)}\n${title}\n${"=".repeat(60)}\n`;
}

const header =
  "ISO 27001 assessment questions as shown in the CertifyGRC UI.\n" +
  "Source: client/frameworks/iso27001/data/clauses.ts + annexA.ts (field: text).\n" +
  "This is not the same dataset as iso27001/data/clauses.json or annex_a.json.\n\n";

const clauseParts: string[] = [];
let cq = 0;
for (const c of ISO_CLAUSES) {
  clauseParts.push(sep(`CLAUSE ${c.number} — ${c.name}`));
  let n = 1;
  for (const q of c.questions) {
    clauseParts.push(`${q.reference}  Q${n} [${q.id}]: ${q.text}`);
    n += 1;
    cq += 1;
  }
  clauseParts.push("");
}

const annexParts: string[] = [];
let aq = 0;
for (const g of ANNEX_A) {
  annexParts.push(sep(`ANNEX A — ${g.domain} ${g.name}`));
  for (const ctrl of g.controls) {
    let n = 1;
    for (const q of ctrl.questions) {
      annexParts.push(`${ctrl.reference}  Q${n} [${q.id}]: ${q.text}`);
      n += 1;
      aq += 1;
    }
  }
  annexParts.push("");
}

mkdirSync(outDir, { recursive: true });
const clauseText = header + clauseParts.join("\n");
const annexText = header + annexParts.join("\n");
writeFileSync(join(outDir, "iso27001_ui_clause_questions.txt"), clauseText, "utf8");
writeFileSync(join(outDir, "iso27001_ui_annex_questions.txt"), annexText, "utf8");
writeFileSync(join(outDir, "iso27001_ui_all_questions.txt"), `${header}${clauseText.slice(header.length)}\n${annexText.slice(header.length)}`, "utf8");

console.log("Wrote UI-aligned exports to iso27001/output/");
console.log("  Clause questions:", cq, "Annex questions:", aq, "Total:", cq + aq);
