import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_APP_PASSWORD = 'neuropharm2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { password?: string };
    const password = String(body?.password || '');
    const expectedPassword = process.env.APP_LOGIN_PASSWORD || DEFAULT_APP_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json(
        { success: false, message: 'Parola hatalı.' },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'np_auth',
      value: 'ok',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Geçersiz istek.' },
      { status: 400 },
    );
  }
}
