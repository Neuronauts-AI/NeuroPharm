
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Python backend URL
        const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8080/analyze';
        // Base URL'den /analyze 'ı çıkarıp /chat ekle
        const BASE_URL = PYTHON_API_URL.replace('/analyze', '');
        const CHAT_URL = `${BASE_URL}/chat`;

        console.log(`Sending chat request to: ${CHAT_URL}`);

        const response = await fetch(CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Chat request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { reply: 'Üzgünüm, bir bağlantı hatası oluştu.' },
            { status: 500 }
        );
    }
}
