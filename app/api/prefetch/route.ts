import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { medications } = body;

        if (!medications || !Array.isArray(medications)) {
            return NextResponse.json(
                { error: 'medications array is required' },
                { status: 400 }
            );
        }

        // Backend prefetch endpoint'ini çağır
        const response = await fetch(`${PYTHON_API_URL}/prefetch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ medications }),
        });

        if (!response.ok) {
            throw new Error(`Prefetch request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Prefetch error:', error);
        return NextResponse.json(
            { error: 'Failed to prefetch FDA data', success: false },
            { status: 500 }
        );
    }
}
