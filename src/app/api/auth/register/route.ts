import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: '用户名长度需在 3-20 个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少 6 个字符' },
        { status: 400 }
      );
    }

    const result = await registerUser(username, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: '注册成功，已赠送 1000 积分'
    });

    // Set session cookie
    response.cookies.set('session_token', result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
