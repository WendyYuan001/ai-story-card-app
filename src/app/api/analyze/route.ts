import { NextRequest, NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/providers';
import { initializeProviders } from '@/lib/providers';

// 初始化 Providers
initializeProviders();

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 获取可用的 Provider
    const provider = AIProviderFactory.getProvider();

    // 分析图片
    const analysis = await provider.analyzeImage(imageData);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('分析失败:', error);
    return NextResponse.json(
      { error: '图片分析失败' },
      { status: 500 }
    );
  }
}
