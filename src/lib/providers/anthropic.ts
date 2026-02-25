import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import { AIImageAnalysis, AIStoryRequest } from '@/types';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(apiKey: string, model?: string) {
    super(apiKey, model);
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  getName(): string {
    return 'Anthropic Claude';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'sk-ant-xxx';
  }

  getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  async analyzeImage(imageBase64: string): Promise<AIImageAnalysis> {
    try {
      // 提取 base64 数据
      const base64Data = this.extractBase64(imageBase64);
      const mimeType = this.getImageMimeType(imageBase64);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这张图片，并以 JSON 格式返回结果。需要包含：
1. subjects: 识别到的主要主体（人物/景物/宠物等），用数组列出
2. type: 主体类型（person/landscape/pet/other）
3. confidence: 识别置信度（0-1的数字）
4. description: 对图片的简短描述（50字以内）

只返回 JSON，不要其他内容。`,
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '{}';
      const result = JSON.parse(text);

      return {
        subjects: result.subjects || [],
        type: result.type || 'other',
        confidence: result.confidence || 0.8,
        description: result.description || '',
      };
    } catch (error) {
      console.error('Anthropic 图像分析失败:', error);
      throw error;
    }
  }

  async generateStory(request: AIStoryRequest): Promise<{ story: string; title?: string; keywords: string[] }> {
    const { imageAnalysis, keywords = [], background = '温馨治愈', maxLength = 300 } = request;

    try {
      const prompt = `请根据以下信息创作一个${background}风格的小故事：

**图片内容**：${imageAnalysis.description}
**识别到的主体**：${imageAnalysis.subjects.join('、')}
${keywords.length ? `**关键词**：${keywords.join('、')}` : ''}

要求：
1. 故事长度控制在${maxLength}字以内
2. 风格：${background}
3. 根据图片内容和关键词展开想象
4. 给故事起一个简短的标题（10字以内）

请以 JSON 格式返回：
{
  "title": "故事标题",
  "story": "故事内容",
  "keywords": ["实际使用的关键词1", "关键词2"]
}`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '{}';
      const result = JSON.parse(text);

      return {
        title: result.title || '未命名故事',
        story: result.story || '',
        keywords: result.keywords || keywords,
      };
    } catch (error) {
      console.error('Anthropic 故事生成失败:', error);
      throw error;
    }
  }
}
