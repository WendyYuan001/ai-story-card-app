import { NextRequest, NextResponse } from 'next/server';
import { getCardGenerator, CardInput } from '@/lib/card-generator';
import { CardTemplate } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, story, imageUrl, keywords, template = 'gradient' } = body;

    if (!title || !story || !imageUrl) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成卡片
    const generator = getCardGenerator();
    const cardInput: CardInput = {
      title,
      story,
      imageUrl,
      keywords: keywords || [],
    };

    const buffer = await generator.generateCard(cardInput, template as CardTemplate);

    // 返回图片 - 将 Buffer 转换为 Uint8Array
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="ai-story-card-${Date.now()}.png"`,
      },
    });
  } catch (error) {
    console.error('生成卡片失败:', error);
    return NextResponse.json(
      { error: '生成卡片失败' },
      { status: 500 }
    );
  }
}
