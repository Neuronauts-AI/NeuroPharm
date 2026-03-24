import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl() {
  return process.env.PYTHON_API_URL || 'http://localhost:8081';
}

export async function GET() {
  try {
    const backendUrl = `${getBackendBaseUrl()}/settings/model`;
    const response = await fetch(backendUrl, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Model preference GET failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Model preference GET error:', error);
    return NextResponse.json(
      {
        llm_provider: 'openrouter',
        llm_model: process.env.LLM_MODEL || 'anthropic/claude-sonnet-4.6',
      },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const llmModel = String(body?.llm_model || '').trim();

    if (!llmModel) {
      return NextResponse.json({ error: 'Model adı boş olamaz.' }, { status: 400 });
    }

    const backendUrl = `${getBackendBaseUrl()}/settings/model`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ llm_model: llmModel }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Model preference POST error:', error);
    return NextResponse.json({ error: 'Model tercihi kaydedilemedi.' }, { status: 500 });
  }
}
