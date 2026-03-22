import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8081';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const feedbackType = searchParams.get('type') || '';
        const limit = searchParams.get('limit') || '50';

        const params = new URLSearchParams();
        if (feedbackType) params.set('feedback_type', feedbackType);
        params.set('limit', limit);

        const response = await fetch(`${PYTHON_API_URL}/feedback/list?${params}`);
        if (!response.ok) throw new Error('List request failed');
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Feedback list error:', error);
        return NextResponse.json(
            { error: 'Geri bildirim listesi alınamadı.', count: 0, feedbacks: [] },
            { status: 500 }
        );
    }
}
