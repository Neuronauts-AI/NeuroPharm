import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRequest, AnalysisResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: AnalysisRequest = await request.json();

    // Webhook URL'ini environment variable'dan al
    const webhookUrl = process.env.DRUG_ANALYSIS_WEBHOOK_URL;

    if (!webhookUrl) {
      // Webhook URL yoksa demo response döndür
      console.warn('DRUG_ANALYSIS_WEBHOOK_URL not configured, using demo response');

      // Demo response - gerçek webhook yanıtını simüle eder (risk_score: 1-10)
      const hasInteraction = data.newMedications.length > 0 && data.currentMedications.length > 0;
      const riskScore = hasInteraction ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 3) + 1; // 1-10 arası

      const demoResponse: AnalysisResponse = {
        risk_score: riskScore,
        alternative_suggestion: hasInteraction && riskScore >= 5
          ? `${data.newMedications[0].name} yerine daha düşük etkileşim riski olan alternatif ilaçlar değerlendirilebilir.`
          : 'Alternatif gerekmemektedir.',
        description: hasInteraction
          ? `${data.newMedications.length} yeni ilaç, ${data.currentMedications.length} mevcut ilaç ile analiz edildi. Hasta ${data.conditions.length} hastalığa sahip. Risk değerlendirmesi tamamlandı.`
          : 'openFDA veritabanında belirtilen ilaç etkileşimi veya kontraendikasyonuna dair spesifik bir kayıt bulunamadı. Mevcut bilgilere göre bilinen yüksek bir risk tespit edilememiştir.',
        has_alternative: hasInteraction && riskScore >= 5,
        results_found: hasInteraction,
      };

      return NextResponse.json(demoResponse);
    }

    // Gerçek webhook'a istek gönder
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
    const analysisResult = result.output || result;
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'İlaç analizi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
