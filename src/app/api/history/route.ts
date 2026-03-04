import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { type, page = '1', pageSize = '20' } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;

    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 查询总数
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM generation_records WHERE user_id = $1',
      [user.userId]
    );
    const total = countResult.rows[0].total;

    // 查询记录
    const result = await pool.query(
      `SELECT id, type, input_data, output_data, points_used, created_at 
       FROM generation_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [user.userId, limit, offset]
    );

    const records = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      input: row.input_data,
      output: row.output_data,
      pointsUsed: row.points_used,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      records,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return NextResponse.json(
      { error: '获取历史记录失败' },
      { status: 500 }
    );
  }
}
