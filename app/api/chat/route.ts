
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Python backend URL
        const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8080/analyze';
        // Base URL'den /analyze 'ı çıkarıp /chat/stream ekle
        const BASE_URL = PYTHON_API_URL.replace('/analyze', '');
        const CHAT_STREAM_URL = `${BASE_URL}/chat/stream`;

        console.log(`Sending streaming chat request to: ${CHAT_STREAM_URL}`);

        const response = await fetch(CHAT_STREAM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Chat request failed: ${response.statusText}`);
        }

        // Forward the streaming response
        const stream = response.body;
        if (!stream) {
            throw new Error('No response body');
        }

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { reply: 'Üzgünüm, bir bağlantı hatası oluştu.' },
            { status: 500 }
        );
    }
}
