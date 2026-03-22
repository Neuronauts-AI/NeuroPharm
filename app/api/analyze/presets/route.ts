import { NextResponse } from 'next/server';
import { PRECOMPUTED_SCENARIOS } from '@/lib/precomputedAnalysisScenarios';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    count: PRECOMPUTED_SCENARIOS.length,
    presets: PRECOMPUTED_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      label: scenario.label,
      age: scenario.signature.age,
      gender: scenario.signature.gender,
      conditions: scenario.signature.conditions,
      current: scenario.signature.current,
      incoming: scenario.signature.incoming,
      sourceFile: scenario.sourceFile,
    })),
  });
}
