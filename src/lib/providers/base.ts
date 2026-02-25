import { AIProvider, AIImageAnalysis, AIStoryRequest } from '@/types';

// 抽象基类，方便后续扩展
export abstract class BaseAIProvider implements AIProvider {
  protected apiKey: string;
  protected model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || this.getDefaultModel();
  }

  abstract getName(): string;
  abstract isAvailable(): boolean;
  abstract getDefaultModel(): string;
  
  abstract analyzeImage(imageBase64: string): Promise<AIImageAnalysis>;
  abstract generateStory(request: AIStoryRequest): Promise<AIStoryResponse>;

  // 工具方法：提取图片的 base64 数据（去除 data:image/xxx;base64, 前缀）
  protected extractBase64(dataUrl: string): string {
    return dataUrl.split(',')[1] || dataUrl;
  }

  // 工具方法：判断图片类型
  protected getImageMimeType(dataUrl: string): string {
    const match = dataUrl.match(/^data:image\/(\w+);base64,/);
    return match ? `image/${match[1]}` : 'image/jpeg';
  }
}
