import { NextRequest, NextResponse } from 'next/server';
import { generateVideoPrompt, generateChineseVideoPrompt } from '@/lib/video-prompt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story, imageAnalysis, style = 'cinematic', language = 'en', duration = 10 } = body;

    if (!story || !imageAnalysis) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      prompt,
      style: selectedStyle,
      language
    });
  } catch (error) {
    console.error('生成视频提示词失败:', error);
    return NextResponse.json(
      { error: '生成视频提示词失败' },
      { status: 500 }
    );
  }
}
