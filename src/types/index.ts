// AI Provider 统一类型定义

export interface AIImageAnalysis {
  subjects: string[];        // 识别到的主体
  type: 'person' | 'landscape' | 'pet' | 'other';
  confidence: number;
  description: string;
}

export interface AIStoryRequest {
  imageAnalysis: AIImageAnalysis;
  keywords?: string[];
  background?: string;
  maxLength?: number;
}

export interface AIStoryResponse {
  story: string;
  title?: string;
  keywords: string[];
  videoPrompt?: string;  // 视频生成提示词
}

// Provider 统一接口
export interface AIProvider {
  // 图像识别
  analyzeImage(imageBase64: string): Promise<AIImageAnalysis>;
  
  // 故事生成
  generateStory(request: AIStoryRequest): Promise<AIStoryResponse>;
  
  // Provider 信息
  getName(): string;
  isAvailable(): boolean;
}

// Provider 配置
export interface ProviderConfig {
  openai?: {
    apiKey: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  gemini?: {
    apiKey: string;
    model?: string;
  };
  glm?: {
    apiKey: string;
    model?: string;
  };
}

// 故事生成预设背景
export const STORY_BACKGROUNDS = [
  '温馨治愈',
  '冒险奇幻',
  '科幻未来',
  '古典神话',
  '现代都市',
  '童话寓言',
];

// 卡片模板类型
export type CardTemplate = 'gradient' | 'minimal' | 'vintage' | 'cyberpunk';
