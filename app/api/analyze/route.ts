import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse } from '@/types';

// Backend URL'leri - Runtime'da okunur (Docker için önemli)
function getBackendUrls() {
  return {
    n8n: process.env.N8N_WEBHOOK_URL || '',
    python: process.env.PYTHON_API_URL || '',
  };
}

// Eski formattan yeni formata dönüştür ve eksik alanları doldur
function normalizeResponse(data: Record<string, unknown>, requestData?: { newMedications?: Array<{ name: string }> }): AnalysisResponse {
  const riskScore = typeof data.risk_score === 'number' ? data.risk_score : 1;

  // Eski format -> Yeni format: alternative_suggestion string'ini alternatives array'e çevir
  let alternatives: AnalysisResponse['alternatives'] = [];

  // Önce yeni formatı kontrol et
  if (data.alternatives && Array.isArray(data.alternatives)) {
    alternatives = data.alternatives as AnalysisResponse['alternatives'];
  }
  // Eski format varsa ve alternative varsa, onu parse et
  else if (data.has_alternative && data.alternative_suggestion) {
    const altSuggestion = data.alternative_suggestion as string;
    const newMedName = requestData?.newMedications?.[0]?.name || 'İlaç';

    // alternative_suggestion formatı: "İlaç Adı (açıklama)" şeklinde
    // Örnek: "Clopidogrel (tek başına antiplatelet)"
    const match = altSuggestion.match(/^([^(]+)(?:\(([^)]+)\))?/);

    if (match) {
      const alternativeDrugName = match[1].trim();
      const reasonText = match[2]?.trim() || 'Daha güvenli alternatif';

      alternatives = [{
        drug_name: newMedName,
        risk_level: riskScore >= 7 ? 'high' : riskScore >= 4 ? 'medium' : 'low',
        action: `${newMedName} yerine ${alternativeDrugName} tercih edilebilir. ${reasonText}`,
        alternative_drug: alternativeDrugName,
        dosage_adjustment: 'Doktor önerisine göre doz ayarlaması yapılmalıdır'
      }];
    }
  }

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

    // Alternatifler - yukarıda hesaplandı
    alternatives,

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
        data.newMedications.map((med, index) => {
          const alternatives = [
            {
              original: 'Aspirin',
              alternative: 'Clopidogrel',
              dosage: '75mg günde 1 kez',
              action: 'Mide rahatsızlığı riski yüksek hastalarda tercih edilebilir',
              risk: 'low' as const
            },
            {
              original: 'Ibuprofen',
              alternative: 'Celecoxib',
              dosage: '200mg günde 2 kez',
              action: 'GI yan etkileri azaltmak için COX-2 selektif inhibitör önerilebilir',
              risk: 'medium' as const
            },
            {
              original: 'Warfarin',
              alternative: 'Apiksaban',
              dosage: '5mg günde 2 kez',
              action: 'INR takibi gerektirmez, daha güvenli antikoagülan seçeneği',
              risk: 'low' as const
            },
            {
              original: 'Metformin',
              alternative: 'Sitagliptin',
              dosage: '100mg günde 1 kez',
              action: 'Böbrek fonksiyon bozukluğu varsa alternatif DPP-4 inhibitörü',
              risk: 'medium' as const
            },
            {
              original: 'Simvastatin',
              alternative: 'Atorvastatin',
              dosage: '20mg günde 1 kez',
              action: 'Daha az ilaç etkileşimi vardır, yüksek riskli hastalarda önerilebilir',
              risk: 'low' as const
            }
          ];

          // İlacın adına göre uygun alternatif bul (veya default kullan)
          const matchedAlt = alternatives.find(alt =>
            med.name.toLowerCase().includes(alt.original.toLowerCase())
          ) || alternatives[index % alternatives.length];

          return {
            drug_name: med.name,
            risk_level: matchedAlt.risk,
            action: matchedAlt.action,
            alternative_drug: matchedAlt.alternative,
            dosage_adjustment: matchedAlt.dosage
          };
        }).slice(0, 3) // Max 3 alternatif göster
        : [];

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
          triggered_rules: hasInteraction ? ['İlaç etkileşimi kontrolü yapıldı', 'Alternatif ilaç önerileri mevcut'] : []
        },
        alternatives: alternativeSuggestions,
        monitoring: hasInteraction ? [
          {
            test_name: 'Karaciğer Fonksiyon Testleri',
            frequency: 'Ayda 1 kez',
            reason: 'İlaç metabolizması takibi için gerekli',
            related_drugs: data.newMedications.map(m => m.name)
          }
        ] : [],
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
    const normalizedResult = normalizeResponse(rawResult, data);

    return NextResponse.json(normalizedResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'İlaç analizi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
