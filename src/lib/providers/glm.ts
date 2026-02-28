import { BaseAIProvider } from './base';
import { AIImageAnalysis, AIStoryRequest } from '@/types';

export class GLMProvider extends BaseAIProvider {
  private baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  constructor(apiKey: string, model?: string) {
    super(apiKey, model);
  }

  getName(): string {
    return '智谱 GLM';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-glm-api-key';
  }

  getDefaultModel(): string {
    return 'glm-4-flash';
  }

  private async callAPI(payload: any) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GLM API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async analyzeImage(imageBase64: string): Promise<AIImageAnalysis> {
    try {
      const base64Data = this.extractBase64(imageBase64);

      const response = await this.callAPI({
        model: 'glm-4v-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
              {
                type: 'text',
                text: `请分析这张图片，并以 JSON 格式返回结果。需要包含：
1. subjects: 识别到的主要主体（人物/景物/宠物等），用数组列出
2. type: 主体类型（person/landscape/pet/other）
3. confidence: 识别置信度（0-1的数字）
4. description: 对图片的简短描述（50字以内）

只返回 JSON，不要其他内容。`,
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);

      return {
        subjects: result.subjects || [],
        type: result.type || 'other',
        confidence: result.confidence || 0.8,
        description: result.description || '',
      };
    } catch (error) {
      console.error('GLM 图像分析失败:', error);
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

      const response = await this.callAPI({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个擅长创作温馨有趣小故事的作家。请根据图片和关键词生成富有想象力的故事。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);

      return {
        title: result.title || '未命名故事',
        story: result.story || '',
        keywords: result.keywords || keywords,
      };
    } catch (error) {
      console.error('GLM 故事生成失败:', error);
      throw error;
    }
  }
}
