import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'story' | 'video-prompt' | 'card' | null
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = 'SELECT id, type, input_data, output_data, points_used, created_at FROM generation_records WHERE user_id = $1';
    const params: any[] = [user.userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM generation_records WHERE user_id = $1';
    const countParams: any[] = [user.userId];
    if (type) {
      countQuery += ' AND type = $2';
      countParams.push(type);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Transform records
    const records = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      inputData: row.input_data,
      outputData: row.output_data,
      pointsUsed: row.points_used,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return NextResponse.json(
      { error: '获取历史记录失败' },
      { status: 500 }
    );
  }
}
