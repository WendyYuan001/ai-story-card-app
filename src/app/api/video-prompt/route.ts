import { NextRequest, NextResponse } from 'next/server';
import { generateVideoPrompt, generateChineseVideoPrompt } from '@/lib/video-prompt';
import { getAuthUser, deductPoints, POINTS_COST } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUser(request);
    
    const body = await request.json();
    const { story, imageAnalysis, style = 'cinematic', language = 'en', duration = 10 } = body;

    if (!story || !imageAnalysis) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const pointsCost = POINTS_COST.GENERATE_VIDEO_PROMPT;

    // 生成提示词
    let prompt;
    let selectedStyle = style;

    if (language === 'zh') {
      // 中文风格映射
      const styleMap: { [key: string]: '电影感' | '动漫' | '写实' | '艺术' } = {
        'cinematic': '电影感',
        'anime': '动漫',
        'realistic': '写实',
        'artistic': '艺术'
      };
      const chineseStyle = styleMap[style] || '电影感';
      prompt = generateChineseVideoPrompt(story, imageAnalysis, chineseStyle, duration);
    } else {
      prompt = generateVideoPrompt(story, imageAnalysis, style as any, duration);
    }

    // 用户已登录，扣积分（成功后扣）
    if (user) {
      const success = await deductPoints(user.userId, pointsCost, '生成视频提示词');
      
      if (!success) {
        return NextResponse.json(
          { error: `积分不足，需要${pointsCost}积分` },
          { status: 402 }
        );
      }
    }

    // 保存生成记录
    if (user) {
      try {
        await pool.query(
          'INSERT INTO generation_records (user_id, type, input_data, output_data, points_used) VALUES ($1, $2, $3, $4, $5)',
          [
            user.userId,
            'video-prompt',
            JSON.stringify({ story, imageAnalysis, style, language, duration }),
            JSON.stringify({ prompt, style: selectedStyle, language }),
            pointsCost
          ]
        );
      } catch (logError) {
        console.error('保存生成记录失败:', logError);
      }
    }

    // 获取用户剩余积分
    let remainingPoints = 0;
    if (user) {
      const userInfo = await getAuthUser(request);
      remainingPoints = userInfo?.points || 0;
    }

    return NextResponse.json({
      prompt,
      style: selectedStyle,
      language,
      pointsUsed: user ? pointsCost : 0,
      remainingPoints
    });
  } catch (error) {
    console.error('生成视频提示词失败:', error);
    return NextResponse.json(
      { error: '生成视频提示词失败' },
      { status: 500 }
    );
  }
}
