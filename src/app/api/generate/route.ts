import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/providers';
import { initializeProviders } from '@/lib/providers';
import { AIStoryRequest } from '@/types';
import { generateVideoPrompt, generateChineseVideoPrompt } from '@/lib/video-prompt';

// 初始化 Providers
initializeProviders();

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      ...story,
      videoPrompt
    });
  } catch (error) {
    console.error('生成失败:', error);
    return NextResponse.json(
      { error: '故事生成失败' },
      { status: 500 }
    );
  }
}
