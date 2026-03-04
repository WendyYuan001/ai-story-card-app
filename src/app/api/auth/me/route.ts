import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        userId: user.userId,
        username: user.username,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
