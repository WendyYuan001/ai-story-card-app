import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { AIImageAnalysis, AIStoryRequest } from '@/types';

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, model?: string) {
    super(apiKey, model);
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  getName(): string {
    return 'Google Gemini';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-gemini-api-key';
  }

  getDefaultModel(): string {
    return 'gemini-1.5-flash'; // 默认使用 flash 模型，速度快
  }

  async analyzeImage(imageBase64: string): Promise<AIImageAnalysis> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: 'gemini-1.5-pro' // 使用 pro 模型进行图像分析
      });

      const base64Data = this.extractBase64(imageBase64);
      
      const prompt = `请分析这张图片，并以 JSON 格式返回结果。需要包含：
1. subjects: 识别到的主要主体（人物/景物/宠物等），用数组列出
2. type: 主体类型（person/landscape/pet/other）
3. confidence: 识别置信度（0-1的数字）
4. description: 对图片的简短描述（50字以内）

只返回 JSON，不要其他内容。`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: this.getImageMimeType(imageBase64),
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // 清理可能的 markdown 代码块标记
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonResult = JSON.parse(cleanText);

      return {
        subjects: jsonResult.subjects || [],
        type: jsonResult.type || 'other',
        confidence: jsonResult.confidence || 0.8,
        description: jsonResult.description || '',
      };
    } catch (error) {
      console.error('Gemini 图像分析失败:', error);
      throw error;
    }
  }

  async generateStory(request: AIStoryRequest): Promise<{ story: string; title?: string; keywords: string[] }> {
    const { imageAnalysis, keywords = [], background = '温馨治愈', maxLength = 300 } = request;

    try {
      const model = this.client.getGenerativeModel({ 
        model: this.model 
      });

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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 清理可能的 markdown 代码块标记
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonResult = JSON.parse(cleanText);

      return {
        title: jsonResult.title || '未命名故事',
        story: jsonResult.story || '',
        keywords: jsonResult.keywords || keywords,
      };
    } catch (error) {
      console.error('Gemini 故事生成失败:', error);
      throw error;
    }
  }
}
