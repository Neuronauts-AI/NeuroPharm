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

      // Demo response - gerçek webhook yanıtını simüle eder
      const demoResponse: AnalysisResponse = {
        riskScore: Math.floor(Math.random() * 100),
        alternativeMedicines: data.newMedications.length > 0
          ? `Alternatif olarak ${data.newMedications[0].name} yerine başka bir ilaç düşünülebilir.`
          : 'Alternatif ilaç önerisi bulunmamaktadır.',
        explanation: `${data.newMedications.length} ilaç analiz edildi. Hasta ${data.conditions.length} hastalığa sahip ve ${data.currentMedications.length} ilaç kullanmaktadır. Risk analizi tamamlandı.`,
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

    const result: AnalysisResponse = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'İlaç analizi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
