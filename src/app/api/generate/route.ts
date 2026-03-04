import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/providers';
import { initializeProviders } from '@/lib/providers';
import { AIStoryRequest } from '@/types';
import { generateVideoPrompt, generateChineseVideoPrompt } from '@/lib/video-prompt';
import { getAuthUser, deductPoints, POINTS_COST } from '@/lib/auth';
import pool from '@/lib/db';
import { acquireTaskLock, releaseTaskLock } from '@/lib/rate-limit';

// 初始化 Providers
initializeProviders();

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  let userId: number | null = null;
  
  try {
    // Check authentication (optional - if no token, still allow but no points deduction)
    const user = await getAuthUser(request);
    
    // 如果用户已登录，检查任务锁
    if (user) {
      userId = user.userId;
      taskId = acquireTaskLock(user.userId);
      if (!taskId) {
        return NextResponse.json(
          { error: '您有一个任务正在运行，请稍后再试' },
          { status: 429 }
        );
      }
    }
    
    const body = await request.json();
    const {
      imageAnalysis,
      keywords = [],
      background = '温馨治愈',
      maxLength = 300,
      includeVideoPrompt = true,
      videoStyle = 'cinematic'
    } = body;

    if (!imageAnalysis) {
      return NextResponse.json(
        { error: '缺少图片分析结果' },
        { status: 400 }
      );
    }

    const pointsCost = POINTS_COST.GENERATE_STORY;

    // 获取可用的 Provider
    const provider = AIProviderFactory.getProvider();

    // 构建请求
    const storyRequest: AIStoryRequest = {
      imageAnalysis,
      keywords,
      background,
      maxLength,
    };

    // 生成故事
    const story = await provider.generateStory(storyRequest);

    // 生成视频提示词（如果需要）
    let videoPrompt = undefined;
    if (includeVideoPrompt) {
      videoPrompt = generateVideoPrompt(
        story.story,
        imageAnalysis,
        videoStyle
      );
    }

    // 用户已登录，扣积分（成功后扣）
    if (user) {
      const success = await deductPoints(user.userId, pointsCost, '生成故事');
      
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
            'story',
            JSON.stringify({ imageAnalysis, keywords, background, maxLength, includeVideoPrompt, videoStyle }),
            JSON.stringify({ title: story.title, story: story.story, keywords: story.keywords, videoPrompt }),
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
      ...story,
      videoPrompt,
      pointsUsed: user ? pointsCost : 0,
      remainingPoints
    });
  } catch (error) {
    console.error('生成失败:', error);
    return NextResponse.json(
      { error: '故事生成失败' },
      { status: 500 }
    );
  } finally {
    // 释放任务锁
    if (userId && taskId) {
      releaseTaskLock(userId, taskId);
    }
  }
}
