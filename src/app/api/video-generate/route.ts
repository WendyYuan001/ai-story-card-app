import { NextRequest, NextResponse } from 'next/server';

// 视频生成模型配置 - 完整版
const VIDEO_MODELS = {
  // 国内模型
  keling: {
    name: '可灵 (Keling)',
    company: '快手',
    endpoint: 'https://api.kelingai.com/v1/video/generate',
    maxDuration: 10,
    region: 'china',
    pricing: 0.2, // 元/秒
  },
  vidu: {
    name: 'Vidu',
    company: '生数科技',
    endpoint: 'https://api.vidu.ai/v1/video/generate',
    maxDuration: 16,
    region: 'china',
    pricing: 0.3,
  },
  jimeng: {
    name: '即梦 (Jimeng)',
    company: '字节跳动',
    endpoint: 'https://api.jimeng.ai/v1/video/generate',
    maxDuration: 5,
    region: 'china',
    pricing: 0.25,
  },
  hunyuan: {
    name: '混元视频',
    company: '腾讯',
    endpoint: 'https://cloud.tencent.com/api/hunyuan/video',
    maxDuration: 6,
    region: 'china',
    pricing: 0.35,
  },

  // 国际模型
  runway: {
    name: 'Runway Gen-3',
    company: 'Runway',
    endpoint: 'https://api.runwayml.com/v1/generate',
    maxDuration: 10,
    region: 'international',
    pricing: 0.05, // USD/秒
  },
  pika: {
    name: 'Pika Labs',
    company: 'Pika',
    endpoint: 'https://api.pika.art/v1/generate',
    maxDuration: 4,
    region: 'international',
    pricing: 0.03,
  },
  sora2: {
    name: 'Sora 2',
    company: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/videos/generations',
    maxDuration: 20,
    region: 'international',
    pricing: 0.1,
  },
  luma: {
    name: 'Luma Dream Machine',
    company: 'Luma AI',
    endpoint: 'https://api.lumalabs.ai/v1/dream-machine/generations',
    maxDuration: 5,
    region: 'international',
    pricing: 0.04,
  },
  svd: {
    name: 'Stable Video',
    company: 'Stability AI',
    endpoint: 'https://api.stability.ai/v2beta/video/generate',
    maxDuration: 4,
    region: 'international',
    pricing: 0,
  },
  haiper: {
    name: 'Haiper',
    company: 'Haiper AI',
    endpoint: 'https://api.haiper.ai/v1/generate',
    maxDuration: 6,
    region: 'international',
    pricing: 0.035,
  },
};

interface VideoGenerateRequest {
  prompt: string;
  model: keyof typeof VIDEO_MODELS;
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerateRequest = await request.json();
    const { prompt, model, duration = 5, aspectRatio = '16:9', resolution = '1080p' } = body;

    if (!prompt) {
      return NextResponse.json({ error: '请提供视频提示词' }, { status: 400 });
    }

    if (!model || !VIDEO_MODELS[model]) {
      return NextResponse.json({ 
        error: '请选择有效的视频生成模型',
        availableModels: Object.keys(VIDEO_MODELS),
      }, { status: 400 });
    }

    const modelConfig = VIDEO_MODELS[model];
    const validDuration = Math.min(duration, modelConfig.maxDuration);

    // 计算预估费用
    const estimatedCost = modelConfig.pricing * validDuration;
    const costDisplay = modelConfig.region === 'china' 
      ? `¥${estimatedCost.toFixed(2)}`
      : `$${estimatedCost.toFixed(2)}`;

    // 根据不同模型调用不同的 API
    // 注意：这里需要配置各模型的 API Key，目前返回模拟响应
    let taskId: string;
    let estimatedTime: number;
    let apiEndpoint: string | undefined;

    switch (model) {
      // 国内模型
      case 'keling':
        taskId = `keling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 15;
        apiEndpoint = process.env.KELING_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'vidu':
        taskId = `vidu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 12;
        apiEndpoint = process.env.VIDU_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'jimeng':
        taskId = `jimeng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 10;
        apiEndpoint = process.env.JIMENG_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'hunyuan':
        taskId = `hunyuan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 18;
        apiEndpoint = process.env.TENCENT_SECRET_KEY ? modelConfig.endpoint : undefined;
        break;

      // 国际模型
      case 'runway':
        taskId = `runway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 20;
        apiEndpoint = process.env.RUNWAY_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'pika':
        taskId = `pika_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 8;
        apiEndpoint = process.env.PIKA_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'sora2':
        taskId = `sora2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 25;
        apiEndpoint = process.env.OPENAI_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'luma':
        taskId = `luma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 12;
        apiEndpoint = process.env.LUMA_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'svd':
        taskId = `svd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 15;
        apiEndpoint = process.env.STABILITY_API_KEY ? modelConfig.endpoint : undefined;
        break;

      case 'haiper':
        taskId = `haiper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        estimatedTime = validDuration * 10;
        apiEndpoint = process.env.HAIPER_API_KEY ? modelConfig.endpoint : undefined;
        break;

      default:
        return NextResponse.json({ error: '不支持的模型' }, { status: 400 });
    }

    // 返回任务信息
    return NextResponse.json({
      success: true,
      taskId,
      model: modelConfig.name,
      company: modelConfig.company,
      status: 'pending',
      estimatedTime,
      estimatedCost: costDisplay,
      message: `视频生成任务已提交，预计需要 ${Math.ceil(estimatedTime / 60)} 分钟，费用约 ${costDisplay}`,
      // 如果没有配置 API Key，返回提示
      apiKeyConfigured: !!apiEndpoint,
      // 模拟返回（实际部署时移除）
      _mock: {
        prompt,
        duration: validDuration,
        aspectRatio,
        resolution,
      },
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '视频生成失败' },
      { status: 500 }
    );
  }
}

// 查询视频生成状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: '请提供任务ID' }, { status: 400 });
  }

  // 解析模型类型
  const modelType = taskId.split('_')[0] as keyof typeof VIDEO_MODELS;

  if (!VIDEO_MODELS[modelType]) {
    return NextResponse.json({ error: '无效的任务ID' }, { status: 400 });
  }

  // 模拟状态查询（实际部署时调用真实 API）
  const statuses = ['pending', 'processing', 'completed'] as const;
  const randomIndex = Math.min(Math.floor(Math.random() * 3), 2);
  const mockStatus = statuses[randomIndex];

  return NextResponse.json({
    taskId,
    status: mockStatus,
    model: VIDEO_MODELS[modelType].name,
    // 完成时返回视频 URL
    videoUrl: mockStatus === 'completed' 
      ? `https://example.com/videos/${taskId}.mp4` 
      : null,
    progress: mockStatus === 'processing' ? Math.floor(Math.random() * 100) : null,
  });
}
