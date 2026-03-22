import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { feedbackType, ...data } = body;

        const endpoint = feedbackType === 'session' ? '/feedback/session' : '/feedback/quick';

        const response = await fetch(`${PYTHON_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Feedback request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Feedback API error:', error);
        return NextResponse.json(
            { error: 'Geri bildirim gönderilemedi.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch(`${PYTHON_API_URL}/feedback/stats`);
        if (!response.ok) throw new Error('Stats request failed');
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Feedback stats error:', error);
        return NextResponse.json(
            { error: 'İstatistikler alınamadı.' },
            { status: 500 }
        );
    }
}
