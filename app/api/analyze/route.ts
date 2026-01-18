import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse } from '@/types';

// Backend URL'leri
const BACKEND_URLS = {
  n8n: process.env.N8N_WEBHOOK_URL || 'https://n8n.egeaydin1.com.tr/webhook/drug-analysis',
  python: process.env.PYTHON_API_URL || 'http://localhost:8080/analyze',
};

// Eski formattan yeni formata dönüştür ve eksik alanları doldur
function normalizeResponse(data: Record<string, unknown>): AnalysisResponse {
  const riskScore = typeof data.risk_score === 'number' ? data.risk_score : 1;

  return {
    risk_score: riskScore,
    description: (data.description as string) || 'Analiz tamamlandı.',
    results_found: (data.results_found as boolean) ?? false,

    // Risk kırılımı - yoksa varsayılan değerler
    risk_breakdown: data.risk_breakdown ? (data.risk_breakdown as AnalysisResponse['risk_breakdown']) : {
      drug_interaction: Math.min(riskScore, 10),
      organ_function: Math.floor(riskScore * 0.5),
      patient_factors: Math.floor(riskScore * 0.6),
      dosage_risk: Math.floor(riskScore * 0.4),
      duplicative_therapy: Math.floor(riskScore * 0.3),
      triggered_rules: riskScore >= 5 ? ['Risk değerlendirmesi yapıldı'] : []
    },

    // Alternatifler - yoksa boş dizi
    alternatives: (data.alternatives as AnalysisResponse['alternatives']) || [],

    // İzlem önerileri - yoksa boş dizi
    monitoring: (data.monitoring as AnalysisResponse['monitoring']) || [],

    // Doz ayarlamaları - yoksa boş dizi
    dosage_adjustments: (data.dosage_adjustments as AnalysisResponse['dosage_adjustments']) || [],

    // Gebelik uyarıları - yoksa boş dizi
    pregnancy_warnings: (data.pregnancy_warnings as AnalysisResponse['pregnancy_warnings']) || [],

    // Eski alanlar (geriye uyumluluk)
    alternative_suggestion: (data.alternative_suggestion as string) || 'Gerek yok',
    has_alternative: (data.has_alternative as boolean) ?? false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backend = 'python', ...data } = body as { backend?: 'n8n' | 'python' } & AnalysisRequest;

    // Seçilen backend URL'ini al
    const webhookUrl = BACKEND_URLS[backend];

    if (!webhookUrl) {
      // Backend URL yoksa demo response döndür
      console.warn('Backend URL not configured, using demo response');

      // Demo response - gerçek webhook yanıtını simüle eder (risk_score: 1-10)
      const hasInteraction = data.newMedications.length > 0 && data.currentMedications.length > 0;
      const riskScore = hasInteraction ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 3) + 1;

      const demoResponse: AnalysisResponse = {
        risk_score: riskScore,
        description: hasInteraction
          ? `${data.newMedications.length} yeni ilaç, ${data.currentMedications.length} mevcut ilaç ile analiz edildi. Hasta ${data.conditions.length} hastalığa sahip. Risk değerlendirmesi tamamlandı.`
          : 'openFDA veritabanında belirtilen ilaç etkileşimi veya kontraendikasyonuna dair spesifik bir kayıt bulunamadı.',
        results_found: hasInteraction,
        risk_breakdown: {
          drug_interaction: hasInteraction ? 6 : 1,
          organ_function: 2,
          patient_factors: 3,
          dosage_risk: 2,
          duplicative_therapy: hasInteraction ? 5 : 1,
          triggered_rules: hasInteraction ? ['İlaç etkileşimi kontrolü yapıldı'] : []
        },
        alternatives: [],
        monitoring: [],
        dosage_adjustments: [],
        pregnancy_warnings: [],
        alternative_suggestion: hasInteraction && riskScore >= 5
          ? `${data.newMedications[0].name} yerine daha düşük etkileşim riski olan alternatif ilaçlar değerlendirilebilir.`
          : 'Alternatif gerekmemektedir.',
        has_alternative: hasInteraction && riskScore >= 5,
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
