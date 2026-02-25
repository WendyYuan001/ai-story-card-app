import { AIProvider, ProviderConfig } from '@/types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { GLMProvider } from './glm';

// Provider 工厂
export class AIProviderFactory {
  private static providers: Map<string, AIProvider> = new Map();

  static initialize(config: ProviderConfig): void {
    // OpenAI
    if (config.openai?.apiKey) {
      const provider = new OpenAIProvider(
        config.openai.apiKey,
        config.openai.model
      );
      if (provider.isAvailable()) {
        this.providers.set('openai', provider);
        console.log('✅ OpenAI Provider 已启用');
      }
    }

    // Anthropic Claude
    if (config.anthropic?.apiKey) {
      const provider = new AnthropicProvider(
        config.anthropic.apiKey,
        config.anthropic.model
      );
      if (provider.isAvailable()) {
        this.providers.set('anthropic', provider);
        console.log('✅ Anthropic Provider 已启用');
      }
    }

    // Google Gemini
    if (config.gemini?.apiKey) {
      const provider = new GeminiProvider(
        config.gemini.apiKey,
        config.gemini.model
      );
      if (provider.isAvailable()) {
        this.providers.set('gemini', provider);
        console.log('✅ Gemini Provider 已启用');
      }
    }

    // 智谱 GLM
    if (config.glm?.apiKey) {
      const provider = new GLMProvider(
        config.glm.apiKey,
        config.glm.model
      );
      if (provider.isAvailable()) {
        this.providers.set('glm', provider);
        console.log('✅ GLM Provider 已启用');
      }
    }

    if (this.providers.size === 0) {
      console.warn('⚠️  没有可用的 AI Provider，请配置 API Key');
    }
  }

  static getProvider(name?: string): AIProvider {
    // 如果指定了 provider，返回对应的
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    // 否则返回第一个可用的
    const firstAvailable = Array.from(this.providers.values())[0];
    if (!firstAvailable) {
      throw new Error('没有可用的 AI Provider，请配置 API Key');
    }

    return firstAvailable;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static hasProviders(): boolean {
    return this.providers.size > 0;
  }

  static getProviderInfo(): Array<{ name: string; displayName: string }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.getName().toLowerCase().replace(/\s+/g, '-'),
      displayName: provider.getName(),
    }));
  }
}

// 初始化 Provider
export function initializeProviders() {
  const config: ProviderConfig = {
    openai: process.env.OPENAI_API_KEY ? {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    } : undefined,
    anthropic: process.env.ANTHROPIC_API_KEY ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    } : undefined,
    gemini: process.env.GEMINI_API_KEY ? {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    } : undefined,
    glm: process.env.GLM_API_KEY ? {
      apiKey: process.env.GLM_API_KEY,
      model: process.env.GLM_MODEL || 'glm-4-flash',
    } : undefined,
  };

  AIProviderFactory.initialize(config);
}
