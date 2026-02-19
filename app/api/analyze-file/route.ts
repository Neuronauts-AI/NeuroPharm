import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResponse } from '@/types';

// Backend URL'leri
function getBackendUrls() {
    return {
        python: process.env.PYTHON_API_URL || 'http://localhost:8080/analyze/file', // Default to local
    };
}

// Backend yanıtını normalize et (analyze/route.ts ile aynı mantık)
function normalizeResponse(data: Record<string, unknown>): AnalysisResponse {
    if (data.clinical_summary) {
        return data as unknown as AnalysisResponse;
    }

    return {
        results_found: (data.results_found as boolean) ?? false,
        clinical_summary: (data.description as string) || (data.clinical_summary as string) || 'Analiz tamamlandı.',
        interaction_details: data.interaction_details as any,
        alternatives: data.alternatives as any,
        monitoring_plan: data.monitoring_plan || data.monitoring as any,
        dosage_warnings: data.dosage_warnings || data.dosage_adjustments as any,
        special_population_alerts: data.special_population_alerts as any,
        patient_safety_notes: data.patient_safety_notes as any,
        // Ekstra bilgi
        extracted_patient_info: data.extracted_patient_info as any,
    } as AnalysisResponse;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const newMedicationsJson = formData.get('new_medications_json');

        if (!file) {
            return NextResponse.json({ error: 'Dosya yüklenmedi' }, { status: 400 });
        }

        // Python backend URL
        const pythonBaseUrl = process.env.PYTHON_API_URL || 'http://localhost:8081';
        // PYTHON_API_URL is the base (e.g., http://backend:8081), append /analyze/file
        const backendUrl = `${pythonBaseUrl}/analyze/file`;

        console.log(`Forwarding file to backend: ${backendUrl}`);

        // Backend'e ilet
        const upstreamFormData = new FormData();
        upstreamFormData.append('file', file);
        if (newMedicationsJson) {
            upstreamFormData.append('new_medications_json', newMedicationsJson);
        }

        const response = await fetch(backendUrl, {
            method: 'POST',
            body: upstreamFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error:', errorText);
            throw new Error(`Backend request failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const normalizedResult = normalizeResponse(result);

        return NextResponse.json(normalizedResult);

    } catch (error) {
        console.error('File analysis error:', error);
        return NextResponse.json(
            { error: 'Dosya analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.' },
            { status: 500 }
        );
    }
}
