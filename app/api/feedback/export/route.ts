import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8081';

export async function GET() {
    try {
        const response = await fetch(`${PYTHON_API_URL}/feedback/export`);
        if (!response.ok) throw new Error('Export request failed');
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Feedback export error:', error);
        return NextResponse.json(
            { error: 'Veri dışa aktarılamadı.', quick_feedbacks: [], session_feedbacks: [], total: 0 },
            { status: 500 }
        );
    }
}
