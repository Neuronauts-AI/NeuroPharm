import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse } from '@/types';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Backend URL'leri - Runtime'da okunur (Docker için önemli)
function getBackendUrls() {
  const pythonBaseUrl = process.env.PYTHON_API_URL || '';
  // PYTHON_API_URL is just the base (e.g., http://backend:8081), append /analyze
  const pythonAnalyzeUrl = pythonBaseUrl ? `${pythonBaseUrl}/analyze` : '';

  return {
    n8n: process.env.N8N_WEBHOOK_URL || '',
    python: pythonAnalyzeUrl,
  };
}

// Backend yanıtını yeni formata dönüştür
function normalizeResponse(data: Record<string, unknown>): AnalysisResponse {
  // Eğer zaten yeni format geliyorsa direkt döndür
  if (data.clinical_summary) {
    return data as unknown as AnalysisResponse;
  }

  // Eski formatı yeni formata dönüştür
  return {
    results_found: (data.results_found as boolean) ?? false,
    clinical_summary: (data.description as string) || (data.clinical_summary as string) || 'Analiz tamamlandı.',

    // Eğer eski format varsa yeni formata çevir
    interaction_details: data.interaction_details as any,
    alternatives: data.alternatives as any,
    monitoring_plan: data.monitoring_plan || data.monitoring as any,
    dosage_warnings: data.dosage_warnings || data.dosage_adjustments as any,
    special_population_alerts: data.special_population_alerts as any,
    patient_safety_notes: data.patient_safety_notes as any,
  };
}

type AnalysisSignature = {
  age: number;
  gender: string;
  conditions: string[];
  current: string[];
  incoming: string[];
};

type RealPrecomputedEntry = {
  id: string;
  label: string;
  generatedAt: string;
  durationMs: number;
  signature: AnalysisSignature;
  request: AnalysisRequest;
  response: AnalysisResponse;
};

const REAL_ANALYSES_FILE = path.join(process.cwd(), 'data', 'precomputed-real-analyses.json');

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeList(values: unknown[]): string[] {
  return values.map(normalizeText).filter(Boolean).sort();
}

function toSignature(data: AnalysisRequest): AnalysisSignature {
  return {
    age: Number(data.age || 0),
    gender: normalizeText(data.gender),
    conditions: normalizeList((data.conditions || []) as unknown[]),
    current: normalizeList((data.currentMedications || []).map((m) => m.name)),
    incoming: normalizeList((data.newMedications || []).map((m) => m.name)),
  };
}

function sameSignature(a: AnalysisSignature, b: AnalysisSignature): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function sleepReplayDelay() {
  const delayMs = 3000 + Math.floor(Math.random() * 2001); // 3000-5000
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function maybeServePrecomputed(data: AnalysisRequest): Promise<AnalysisResponse | null> {
  if (!fs.existsSync(REAL_ANALYSES_FILE)) {
    return null;
  }

  let entries: RealPrecomputedEntry[] = [];
  try {
    const raw = fs.readFileSync(REAL_ANALYSES_FILE, 'utf-8');
    entries = JSON.parse(raw) as RealPrecomputedEntry[];
  } catch (error) {
    console.error('Failed to read real precomputed analyses file:', error);
    return null;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const requestSignature = toSignature(data);
  const matched = entries.find((entry) => sameSignature(requestSignature, entry.signature));
  if (!matched || !matched.response) {
    return null;
  }

  await sleepReplayDelay();
  return normalizeResponse(matched.response as unknown as Record<string, unknown>);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backend = 'python', ...data } = body as { backend?: 'n8n' | 'python' } & AnalysisRequest;

    const precomputed = await maybeServePrecomputed(data);
    if (precomputed) {
      return NextResponse.json(precomputed, {
        headers: {
          'x-analysis-source': 'precomputed-replay',
        },
      });
    }

    // Seçilen backend URL'ini al
    const BACKEND_URLS = getBackendUrls();
    const webhookUrl = BACKEND_URLS[backend];

    if (!webhookUrl) {
      // Backend URL yoksa demo response döndür
      console.warn('Backend URL not configured, using demo response');

      const hasInteraction = data.newMedications.length > 0 && data.currentMedications.length > 0;

      // Alternatif ilaç önerileri oluştur
      const alternativeSuggestions = hasInteraction && data.newMedications.length > 0 ?
        data.newMedications.slice(0, 2).map((med) => ({
          original_drug: med.name,
          suggested_alternative: 'Doktor önerisi ile değerlendirilmelidir',
          reason: 'Daha güvenli alternatif için doktorunuza danışın'
        }))
        : [];

      const demoResponse: AnalysisResponse = {
        results_found: hasInteraction,
        clinical_summary: hasInteraction
          ? `${data.newMedications.length} yeni ilaç ve ${data.currentMedications.length} mevcut ilaç analiz edildi. Risk değerlendirmesi tamamlandı.`
          : 'Belirtilen ilaçlar arasında önemli bir etkileşim tespit edilmedi.',

        interaction_details: hasInteraction ? [{
          drugs: [data.newMedications[0]?.name || '', data.currentMedications[0]?.name || ''],
          severity: 'Medium',
          mechanism: 'Demo analiz - gerçek etkileşim mekanizması için backend gerekli'
        }] : undefined,

        alternatives: alternativeSuggestions.length > 0 ? alternativeSuggestions : undefined,

        monitoring_plan: hasInteraction ? [{
          test: 'Karaciğer Fonksiyon Testleri',
          frequency: 'Ayda 1 kez',
          reason: 'İlaç metabolizması takibi'
        }] : undefined,
      };

      return NextResponse.json(demoResponse);
    }

    console.log(`Using backend: ${backend} -> ${webhookUrl}`);

    // Seçilen backend'e istek gönder
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Webhook response:', JSON.stringify(result, null, 2));

    // Webhook yanıtı "output" içinde geliyorsa onu çıkar
    const rawResult = result.output || result;

    // Yanıtı normalize et ve eksik alanları doldur
    const normalizedResult = normalizeResponse(rawResult);

    return NextResponse.json(normalizedResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'İlaç analizi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
