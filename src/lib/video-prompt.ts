import { AIStoryResponse, AIImageAnalysis } from '@/types';

/**
 * 将故事和图片分析转换为适合视频生成的提示词
 * 支持 SeeDance 2.0、Runway、Pika 等视频生成平台
 */
export function generateVideoPrompt(
  story: string,
  imageAnalysis: AIImageAnalysis,
  style: 'cinematic' | 'anime' | 'realistic' | 'artistic' = 'cinematic',
  duration: number = 10
): string {
  // 提取关键元素
  const subjects = imageAnalysis.subjects.join(', ');
  const description = imageAnalysis.description;

  // 风格关键词映射
  const styleKeywords = {
    cinematic: [
      'cinematic lighting',
      'professional camera work',
      'depth of field',
      'film grain',
      'dramatic composition',
      'smooth camera movement'
    ],
    anime: [
      'anime style',
      'vibrant colors',
      'expressive characters',
      'dynamic angles',
      'sakuga animation',
      'Japanese animation style'
    ],
    realistic: [
      'photorealistic',
      'natural lighting',
      'authentic details',
      'lifelike movement',
      'documentary style',
      'realistic textures'
    ],
    artistic: [
      'artistic interpretation',
      'painterly style',
      'creative visual metaphor',
      'surreal elements',
      'dreamlike atmosphere',
      'artistic filters'
    ]
  };

  const selectedStyles = styleKeywords[style];

  // 根据图片类型添加场景描述
  let sceneDescription = '';
  switch (imageAnalysis.type) {
    case 'person':
      sceneDescription = 'Portrait video with expressive facial movements and subtle body language';
      break;
    case 'landscape':
      sceneDescription = 'Sweeping landscape shots with environmental movement and atmospheric effects';
      break;
    case 'pet':
      sceneDescription = 'Close-up shots capturing natural animal behavior and cute movements';
      break;
    default:
      sceneDescription = 'Dynamic composition capturing the essence of the scene';
  }

  // 构建完整提示词
  const promptParts = [
    // 核心场景
    `${sceneDescription},`,

    // 主体描述
    `featuring ${subjects},`,

    // 视觉风格
    ...selectedStyles.map(s => s + ','),

    // 运镜和氛围
    'smooth camera movement,',
    'atmospheric lighting,',
    'high quality,',

    // 故事氛围（从故事中提取关键词）
    extractMoodFromStory(story),

    // 技术规格
    '4K resolution,',
    '24fps,',
    `duration: ${duration}s`
  ];

  return promptParts.join(' ').replace(/,\s*,/g, ',').trim();
}

/**
 * 从故事中提取情绪关键词
 */
function extractMoodFromStory(story: string): string {
  const moodMap: { [key: string]: string } = {
    '温暖': 'warm and cozy atmosphere',
    '温馨': 'heartwarming mood',
    '治愈': 'healing and peaceful ambiance',
    '宁静': 'serene and tranquil atmosphere',
    '快乐': 'joyful and cheerful mood',
    '冒险': 'adventurous and exciting atmosphere',
    '神秘': 'mysterious and intriguing mood',
    '浪漫': 'romantic and dreamy atmosphere',
    '忧郁': 'melancholic and reflective mood',
    '激动': 'energetic and dynamic atmosphere'
  };

  for (const [chinese, english] of Object.entries(moodMap)) {
    if (story.includes(chinese)) {
      return english + ',';
    }
  }

  return 'emotional and engaging atmosphere,';
}

/**
 * 生成中文版视频提示词（针对国内视频生成平台）
 */
export function generateChineseVideoPrompt(
  story: string,
  imageAnalysis: AIImageAnalysis,
  style: '电影感' | '动漫' | '写实' | '艺术' = '电影感',
  duration: number = 10
): string {
  const subjects = imageAnalysis.subjects.join('、');

  const styleKeywords: { [key: string]: string[] } = {
    '电影感': [
      '电影级灯光',
      '专业运镜',
      '景深效果',
      '胶片质感',
      '戏剧性构图',
      '流畅的镜头运动'
    ],
    '动漫': [
      '动漫风格',
      '鲜艳色彩',
      '生动的表情',
      '动态角度',
      '高质量作画',
      '日式动画风格'
    ],
    '写实': [
      '写实风格',
      '自然光线',
      '真实细节',
      '自然动作',
      '纪录片风格',
      '真实纹理'
    ],
    '艺术': [
      '艺术化处理',
      '绘画风格',
      '创意视觉隐喻',
      '超现实元素',
      '梦幻氛围',
      '艺术滤镜'
    ]
  };

  const selectedStyles = styleKeywords[style] || styleKeywords['电影感'];

  const promptParts = [
    // 基础描述
    `视频画面：${subjects}，`,
    `场景：${imageAnalysis.description}`,

    // 风格关键词
    ...selectedStyles,

    // 技术规格
    '流畅运镜',
    '高质量',
    '4K分辨率',
    `时长：${duration}秒`
  ];

  return promptParts.join('，').replace(/，，/g, '，');
}

/**
 * 为视频生成添加时间线提示
 */
export function generateVideoTimelinePrompt(
  story: string,
  duration: number = 5
): string {
  // 将故事分段，为不同时间点生成提示
  const sentences = story.split(/[。！？]/).filter(s => s.trim().length > 0);

  const timelinePrompts: { [key: string]: string } = {};

  sentences.forEach((sentence, index) => {
    const startTime = Math.floor((index / sentences.length) * duration);
    const endTime = Math.floor(((index + 1) / sentences.length) * duration);

    timelinePrompts[`${startTime}s-${endTime}s`] = sentence.trim();
  });

  return JSON.stringify(timelinePrompts, null, 2);
}
