import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/providers';
import { AIStoryRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageAnalysis, keywords = [], background = '温馨治愈', maxLength = 300 } = body;

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

    return NextResponse.json(story);
  } catch (error) {
    console.error('生成失败:', error);
    return NextResponse.json(
      { error: '故事生成失败' },
      { status: 500 }
    );
  }
}
