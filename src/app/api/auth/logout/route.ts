import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (token) {
      await logoutUser(token);
    }

    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    });

    // Clear cookie
    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
