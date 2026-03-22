import fs from 'fs';
import path from 'path';

const root = process.cwd();
const scenariosFile = path.join(root, 'lib', 'precomputedAnalysisScenarios.ts');
const outputFile = path.join(root, 'data', 'precomputed-real-analyses.json');
const backendBase = process.env.PRECOMPUTE_BACKEND_URL || 'http://localhost:8081';
const analyzeUrl = `${backendBase}/analyze`;

function extractScenariosFromTs(tsContent) {
  const marker = 'export const PRECOMPUTED_SCENARIOS: PrecomputedScenario[] = ';
  const start = tsContent.indexOf(marker);
  if (start === -1) {
    throw new Error('PRECOMPUTED_SCENARIOS marker not found');
  }

  const searchFrom = start + marker.length;
  const jsonStart = tsContent.indexOf('[', searchFrom);
  const jsonEnd = tsContent.lastIndexOf('];');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not locate scenario JSON array in TypeScript file');
  }

  const jsonText = tsContent.slice(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonText);
}

function buildMedList(names, scenarioId, prefix) {
  return (names || []).map((name, idx) => ({
    id: `${scenarioId}-${prefix}-${idx + 1}`,
    name,
    dosage: null,
    frequency: null,
  }));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const tsContent = fs.readFileSync(scenariosFile, 'utf-8');
  const scenarios = extractScenariosFromTs(tsContent);

  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error('No scenarios found to run');
  }

  const results = [];

  for (const scenario of scenarios) {
    const payload = {
      age: scenario.signature.age,
      gender: scenario.signature.gender,
      conditions: scenario.signature.conditions,
      currentMedications: buildMedList(scenario.signature.current, scenario.id, 'cur'),
      newMedications: buildMedList(scenario.signature.incoming, scenario.id, 'new'),
      llm_provider: 'auto',
      llm_model: 'deepseek/deepseek-r1-distill-qwen-32b',
    };

    const t0 = Date.now();
    let response;
    let body;

    try {
      response = await fetchWithTimeout(
        analyzeUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        240000,
      );

      body = await response.json();
    } catch (error) {
      console.error(`Failed scenario ${scenario.id}:`, error?.message || error);
      continue;
    }

    const durationMs = Date.now() - t0;

    if (!response.ok) {
      console.error(`Scenario ${scenario.id} returned ${response.status}`);
      continue;
    }

    results.push({
      id: scenario.id,
      label: scenario.label,
      generatedAt: new Date().toISOString(),
      durationMs,
      source: 'live-backend',
      backendUrl: analyzeUrl,
      signature: scenario.signature,
      request: payload,
      response: body,
    });

    console.log(`OK ${scenario.id} (${durationMs} ms)`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Saved ${results.length} real analyses -> ${outputFile}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
