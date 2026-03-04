import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, deductPoints, POINTS_COST } from '@/lib/auth';
import pool from '@/lib/db';
import { AIProviderFactory } from '@/lib/providers';
import { initializeProviders } from '@/lib/providers';
import { uploadImages } from '@/lib/cos';
import { acquireTaskLock, releaseTaskLock } from '@/lib/rate-limit';

initializeProviders();

interface VideoPromptRequest {
  description: string;
  images?: string[]; // base64 images
  options: {
    duration: number;
    aspectRatio: string;
    resolution: string;
    filterStyle: string;
    storyStyle: string;
    language: 'zh' | 'en';
  };
}

const FILTER_STYLE_MAP: Record<string, string> = {
  cinematic: '电影感',
  anime: '动漫风格',
  realistic: '写实风格',
  vintage: '复古风格',
  dreamy: '梦幻风格',
  noir: '黑白风格',
};

const STORY_STYLE_MAP: Record<string, string> = {
  humorous: '幽默搞笑',
  heartwarming: '温馨治愈',
  suspense: '惊悚悬疑',
  romantic: '浪漫爱情',
  adventure: '冒险刺激',
  documentary: '纪录片风格',
  other: '自由风格',
};

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  let userId: number | null = null;
  
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    userId = user.userId;

    // 检查任务锁 - 同时只能有一个生成任务
    taskId = acquireTaskLock(user.userId);
    if (!taskId) {
      return NextResponse.json(
        { error: '您有一个任务正在运行，请稍后再试' },
        { status: 429 }
      );
    }

    const body: VideoPromptRequest = await request.json();
    const { description, images = [], options } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: '请输入描述' },
        { status: 400 }
      );
    }

    const pointsCost = 10;

    // 解析图片引用 - 支持 [图片N] 和 @N 两种格式
    let processedDescription = description;
    const imageRefs: { ref: string; index: number }[] = [];
    const refRegex = /\[图片(\d+)\]|@(\d+)/g;
    let match;
    
    while ((match = refRegex.exec(description)) !== null) {
      const index = parseInt(match[1] || match[2]) - 1;
      if (index >= 0 && index < images.length) {
        imageRefs.push({ ref: match[0], index });
      }
    }

    // 构建 AI 提示词
    const filterStyleName = FILTER_STYLE_MAP[options.filterStyle] || options.filterStyle;
    const storyStyleName = STORY_STYLE_MAP[options.storyStyle] || options.storyStyle;

    const systemPrompt = options.language === 'zh' 
      ? `你是一个专业的视频提示词生成专家。根据用户的描述和参考图片，生成一段用于AI视频生成工具（如Runway、Pika、Sora等）的高质量提示词。

要求：
1. 提示词应该详细描述场景、动作、光影、氛围等元素
2. 使用专业的影视术语
3. 考虑视频时长（${options.duration}秒）和节奏
4. 符合${filterStyleName}的视觉风格
5. 体现${storyStyleName}的情感基调
6. 输出格式：直接输出提示词文本，不需要其他说明`
      : `You are a professional video prompt generator. Based on the user's description and reference images, generate a high-quality prompt for AI video generation tools (like Runway, Pika, Sora, etc.).

Requirements:
1. The prompt should describe scene, action, lighting, atmosphere in detail
2. Use professional cinematography terminology
3. Consider video duration (${options.duration}s) and pacing
4. Match the ${filterStyleName} visual style
5. Reflect the ${storyStyleName} emotional tone
6. Output format: Just output the prompt text, no other explanations`;

    let userPrompt = description;
    
    // 如果有图片，分析图片内容
    const imageDescriptions: string[] = [];
    if (images.length > 0) {
      const provider = AIProviderFactory.getProvider();
      
      for (let i = 0; i < images.length; i++) {
        try {
          const analysis = await provider.analyzeImage(images[i]);
          imageDescriptions.push(`图片${i + 1}（[图片${i + 1}]）的内容：${analysis.description}`);
        } catch (e) {
          console.error(`分析图片${i + 1}失败:`, e);
          imageDescriptions.push(`图片${i + 1}（[图片${i + 1}]）：[无法分析]`);
        }
      }
      
      if (imageDescriptions.length > 0) {
        userPrompt = `参考图片信息：
${imageDescriptions.join('\n')}

用户描述：
${description}

视频参数：
- 时长：${options.duration}秒
- 宽高比：${options.aspectRatio}
- 分辨率：${options.resolution}
- 滤镜风格：${filterStyleName}
- 剧情风格：${storyStyleName}

请生成视频提示词：`;
      }
    }

    // 调用 AI 生成提示词
    const provider = AIProviderFactory.getProvider();
    
    let prompt: string;
    
    try {
      // 尝试使用支持对话的 API
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        prompt = data.choices[0].message.content;
      } else {
        throw new Error('AI 响应格式错误');
      }
    } catch (e) {
      console.error('AI 生成失败:', e);
      return NextResponse.json(
        { error: 'AI 生成失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 扣积分
    const success = await deductPoints(user.userId, pointsCost, '生成视频提示词');
    if (!success) {
      return NextResponse.json(
        { error: `积分不足，需要${pointsCost}积分` },
        { status: 402 }
      );
    }

    // 上传图片到 COS
    let imageUrls: string[] = [];
    if (images.length > 0) {
      try {
        imageUrls = await uploadImages(images, `user_${user.userId}`);
      } catch (e) {
        console.error('上传图片到 COS 失败:', e);
        // 继续执行，只是图片URL为空
      }
    }

    // 保存记录（使用 COS URL 而不是 base64）
    try {
      await pool.query(
        'INSERT INTO generation_records (user_id, type, input_data, output_data, points_used) VALUES ($1, $2, $3, $4, $5)',
        [
          user.userId,
          'video-prompt-v2',
          JSON.stringify({ description, imageUrls, options }),
          JSON.stringify({ prompt }),
          pointsCost,
        ]
      );
    } catch (e) {
      console.error('保存记录失败:', e);
    }

    // 获取更新后的积分
    const updatedUser = await getAuthUser(request);

    return NextResponse.json({
      success: true,
      prompt,
      pointsUsed: pointsCost,
      remainingPoints: updatedUser?.points || 0,
    });

  } catch (error) {
    console.error('生成视频提示词失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  } finally {
    // 释放任务锁
    if (userId && taskId) {
      releaseTaskLock(userId, taskId);
    }
  }
}
