/**
 * ISO/IEC 27001:2022 question bank service — self-contained, no third-party dependencies.
 * Loads bundled JSON from ./data. Optional flat text is read from ./output when present.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const OUTPUT_DIR = path.join(__dirname, "output");
const CLAUSES_FILE = path.join(DATA_DIR, "clauses.json");
const ANNEX_FILE = path.join(DATA_DIR, "annex_a.json");
const FLAT_TEXT_FILE = path.join(OUTPUT_DIR, "iso27001_full_question_list.txt");

let _clauses;
let _annex;

function loadClauses() {
  if (_clauses) return _clauses;
  const raw = fs.readFileSync(CLAUSES_FILE, "utf8");
  _clauses = JSON.parse(raw);
  return _clauses;
}

function loadAnnex() {
  if (_annex) return _annex;
  const raw = fs.readFileSync(ANNEX_FILE, "utf8");
  _annex = JSON.parse(raw);
  return _annex;
}

function normControlRef(s) {
  if (s == null || typeof s !== "string") return "";
  return s.trim();
}

/**
 * @returns {object} Full clauses payload: standard, meta, clauses[] with subclauses and questions
 */
function getClauses() {
  return loadClauses();
}

/**
 * @returns {object} Annex A: standard, themes[] each with id, title, controls[{ ref, title, questions }]
 */
function getAnnexA() {
  return loadAnnex();
}

/**
 * @param {string} clauseId e.g. "clause_4", "clause_5"
 * @returns {Array<object>} Flat list of questions with metadata
 */
function getQuestionsByClause(clauseId) {
  const data = loadClauses();
  const c = data.clauses.find((x) => x.id === clauseId);
  if (!c) return [];
  const out = [];
  for (const sc of c.subclauses) {
    for (const qu of sc.questions) {
      out.push({
        ...qu,
        source: "clause",
        clause_id: c.id,
        clause_number: c.number,
        clause_title: c.title,
        subclause_ref: sc.ref,
        subclause_title: sc.title
      });
    }
  }
  return out;
}

/**
 * @param {string} controlRef e.g. "A.5.1"
 * @returns {Array<object>} Questions for that Annex A control
 */
function getQuestionsByControl(controlRef) {
  const ref = normControlRef(controlRef);
  if (!ref) return [];
  const data = loadAnnex();
  for (const th of data.themes) {
    for (const ctrl of th.controls) {
      if (ctrl.ref === ref) {
        return ctrl.questions.map((q) => ({
          ...q,
          source: "annex_a",
          theme: th.id,
          theme_title: th.title,
          control_ref: ctrl.ref,
          control_title: ctrl.title
        }));
      }
    }
  }
  return [];
}

/**
 * @returns {Array<object>} Every clause + Annex A question with unified metadata
 */
function getAllQuestions() {
  const clauseQs = [];
  for (const c of loadClauses().clauses) {
    for (const sc of c.subclauses) {
      for (const qu of sc.questions) {
        clauseQs.push({
          ...qu,
          source: "clause",
          clause_id: c.id,
          clause_number: c.number,
          clause_title: c.title,
          subclause_ref: sc.ref,
          subclause_title: sc.title
        });
      }
    }
  }
  const annexQs = [];
  for (const th of loadAnnex().themes) {
    for (const ctrl of th.controls) {
      for (const qu of ctrl.questions) {
        annexQs.push({
          ...qu,
          source: "annex_a",
          theme: th.id,
          theme_title: th.title,
          control_ref: ctrl.ref,
          control_title: ctrl.title
        });
      }
    }
  }
  return clauseQs.concat(annexQs);
}

/**
 * @returns {string} Full human-readable question list (same content as output/iso27001_full_question_list.txt)
 */
function exportToText() {
  if (fs.existsSync(FLAT_TEXT_FILE)) {
    return fs.readFileSync(FLAT_TEXT_FILE, "utf8");
  }
  const lines = [];
  const header = (t) => {
    lines.push("============================================================");
    lines.push(t);
    lines.push("============================================================");
  };
  const dataC = loadClauses();
  for (const cl of dataC.clauses) {
    header(`CLAUSE ${cl.number} — ${cl.title}`);
    for (const sc of cl.subclauses) {
      let n = 1;
      for (const qq of sc.questions) {
        lines.push(`${sc.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
    lines.push("");
  }
  const dataA = loadAnnex();
  for (const block of [
    { id: "A.5", label: "ANNEX A — A.5 Organisational controls" },
    { id: "A.6", label: "ANNEX A — A.6 People controls" },
    { id: "A.7", label: "ANNEX A — A.7 Physical controls" },
    { id: "A.8", label: "ANNEX A — A.8 Technological controls" }
  ]) {
    header(block.label);
    const th = dataA.themes.find((t) => t.id === block.id);
    if (th) {
      for (const ctrl of th.controls) {
        let n = 1;
        for (const qq of ctrl.questions) {
          lines.push(`${ctrl.ref}  Q${n}: ${qq.question}`);
          n += 1;
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

module.exports = {
  getClauses,
  getAnnexA,
  getQuestionsByClause,
  getQuestionsByControl,
  getAllQuestions,
  exportToText
};
