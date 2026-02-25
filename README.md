# AI 故事卡片

让每张照片都有一个精彩的故事。

## 功能特性

- 📷 **图片上传**：支持拖拽上传或点击选择图片
- 🔍 **AI 识别**：智能识别图片中的主体（人物/景物/宠物）
- ✨ **故事生成**：基于识别结果和关键词生成创意故事
- 🎴 **卡片制作**：多种精美模板，一键生成分享卡片
- 📱 **PWA 支持**：可安装到桌面/主屏幕，支持离线使用

## 技术栈

- **前端框架**：Next.js 15 + React 19
- **样式**：TailwindCSS
- **AI Providers**：
  - OpenAI (GPT-4V + GPT-4o)
  - Anthropic Claude 3.5 Sonnet
- **卡片生成**：Puppeteer
- **类型安全**：TypeScript

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入你的 API Keys：

```env
# OpenAI (必需，至少需要一个)
OPENAI_API_KEY=sk-your-openai-api-key

# Anthropic Claude (可选)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
ai-story-card-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── analyze/       # 图片分析 API
│   │   │   ├── generate/      # 故事生成 API
│   │   │   └── card/          # 卡片生成 API
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # 主页面
│   ├── components/            # React 组件
│   │   ├── ImageUploader.tsx  # 图片上传组件
│   │   ├── StoryGenerator.tsx # 故事生成组件
│   │   └── CardPreview.tsx    # 卡片预览组件
│   ├── lib/
│   │   ├── providers/         # AI Provider 抽象层
│   │   │   ├── base.ts        # 基类
│   │   │   ├── openai.ts      # OpenAI 实现
│   │   │   ├── anthropic.ts   # Anthropic 实现
│   │   │   └── index.ts       # Provider 工厂
│   │   └── card-generator.ts  # 卡片生成器
│   ├── templates/             # 卡片 HTML 模板
│   │   └── card-templates.html
│   └── types/
│       └── index.ts           # 类型定义
├── public/
│   └── manifest.json          # PWA 配置
└── package.json
```

## 添加新的 AI Provider

1. 在 `src/lib/providers/` 下创建新文件，如 `provider-name.ts`
2. 继承 `BaseAIProvider` 抽象类
3. 实现 `analyzeImage` 和 `generateStory` 方法
4. 在 `src/lib/providers/index.ts` 中注册

示例：

```typescript
// src/lib/providers/myprovider.ts
import { BaseAIProvider } from './base';
import { AIImageAnalysis, AIStoryRequest } from '@/types';

export class MyProvider extends BaseAIProvider {
  getName(): string {
    return 'My Provider';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getDefaultModel(): string {
    return 'my-model';
  }

  async analyzeImage(imageBase64: string): Promise<AIImageAnalysis> {
    // 实现图片分析逻辑
  }

  async generateStory(request: AIStoryRequest): Promise<AIStoryResponse> {
    // 实现故事生成逻辑
  }
}
```

## 添加新的卡片模板

在 `src/templates/card-templates.html` 中添加新的 `<template>` 标签：

```html
<template id="template-newtemplate">
<div class="story-card" style="width: 375px; ...">
  <!-- 模板内容 -->
</div>
</template>
```

然后在 `src/types/index.ts` 中的 `CardTemplate` 类型中添加：

```typescript
export type CardTemplate = 'gradient' | 'minimal' | 'vintage' | 'cyberpunk' | 'newtemplate';
```

## 移动端部署

### 使用 Capacitor 打包

1. 安装 Capacitor：

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

2. 构建项目：

```bash
npm run build
npx cap sync
```

3. 打开 iOS/Android 项目：

```bash
npx cap open ios    # iOS
npx cap open android # Android
```

### PWA 安装

1. 在浏览器中打开应用
2. 点击地址栏的「安装」按钮
3. 应用将添加到主屏幕

## 许可证

MIT
