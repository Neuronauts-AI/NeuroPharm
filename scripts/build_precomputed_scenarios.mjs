import fs from 'fs';
import path from 'path';

const root = process.cwd();
const logsDir = path.join(root, 'backend_logs');
const outFile = path.join(root, 'lib', 'precomputedAnalysisScenarios.ts');

function normalizeList(values) {
  return (values || [])
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function medNames(meds) {
  return (meds || [])
    .map((m) => String(m?.name || '').trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

const files = fs
  .readdirSync(logsDir)
  .filter((f) => f.endsWith('.json') && f.includes('analyze'))
  .sort()
  .reverse();

const picked = [];
const seen = new Set();

for (const file of files) {
  const fullPath = path.join(logsDir, file);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const req = json.request || {};

  const current = medNames(req.currentMedications);
  const incoming = medNames(req.newMedications);

  if (current.length === 0 || incoming.length === 0) continue;

  const sig = {
    age: Number(req.age || 0),
    gender: String(req.gender || '').trim().toLowerCase(),
    conditions: normalizeList(req.conditions),
    current,
    incoming,
  };

  const key = JSON.stringify(sig);
  if (seen.has(key)) continue;
  seen.add(key);

  picked.push({
    id: `preset-${picked.length + 1}`,
    label: `${current.join(' + ')} -> ${incoming.join(' + ')}`,
    sourceFile: file,
    signature: sig,
  });

  if (picked.length === 10) break;
}

const content = `export interface PrecomputedScenarioSignature {\n  age: number;\n  gender: string;\n  conditions: string[];\n  current: string[];\n  incoming: string[];\n}\n\nexport interface PrecomputedScenario {\n  id: string;\n  label: string;\n  sourceFile: string;\n  signature: PrecomputedScenarioSignature;\n}\n\nexport const PRECOMPUTED_SCENARIOS: PrecomputedScenario[] = ${JSON.stringify(picked, null, 2)};\n`;

fs.writeFileSync(outFile, content, 'utf-8');
console.log(`Generated ${picked.length} scenarios -> ${outFile}`);
for (const scenario of picked) {
  console.log(`- ${scenario.id}: ${scenario.sourceFile}`);
}
