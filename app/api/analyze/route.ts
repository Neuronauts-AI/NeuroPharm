import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse } from '@/types';

// Backend URL'leri - Runtime'da okunur (Docker için önemli)
function getBackendUrls() {
  return {
    n8n: process.env.N8N_WEBHOOK_URL || '',
    python: process.env.PYTHON_API_URL || '',
  };
}

// Backend yanıtını yeni formata dönüştür
function normalizeResponse(data: Record<string, unknown>): AnalysisResponse {
  // Eğer zaten yeni format geliyorsa direkt döndür
  if (data.clinical_summary) {
    return data as unknown as AnalysisResponse;
  }

  // Eski formatı yeni formata dönüştür
  const riskScore = typeof data.risk_score === 'number' ? data.risk_score : 1;

  return {
    risk_score: riskScore,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backend = 'python', ...data } = body as { backend?: 'n8n' | 'python' } & AnalysisRequest;

    // Seçilen backend URL'ini al
    const BACKEND_URLS = getBackendUrls();
    const webhookUrl = BACKEND_URLS[backend];

    if (!webhookUrl) {
      // Backend URL yoksa demo response döndür
      console.warn('Backend URL not configured, using demo response');

      // Demo response - gerçek webhook yanıtını simüle eder (risk_score: 1-10)
      const hasInteraction = data.newMedications.length > 0 && data.currentMedications.length > 0;
      const riskScore = hasInteraction ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 3) + 1;

      // Alternatif ilaç önerileri oluştur
      const alternativeSuggestions = hasInteraction && data.newMedications.length > 0 ?
        data.newMedications.slice(0, 2).map((med) => ({
          original_drug: med.name,
          suggested_alternative: 'Doktor önerisi ile değerlendirilmelidir',
          reason: 'Daha güvenli alternatif için doktorunuza danışın'
        }))
        : [];

      const demoResponse: AnalysisResponse = {
        risk_score: riskScore,
        results_found: hasInteraction,
        clinical_summary: hasInteraction
          ? `${data.newMedications.length} yeni ilaç ve ${data.currentMedications.length} mevcut ilaç analiz edildi. Risk değerlendirmesi tamamlandı.`
          : 'Belirtilen ilaçlar arasında önemli bir etkileşim tespit edilmedi.',

        interaction_details: hasInteraction ? [{
          drugs: [data.newMedications[0]?.name || '', data.currentMedications[0]?.name || ''],
          severity: riskScore >= 7 ? 'High' : riskScore >= 4 ? 'Medium' : 'Low',
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
