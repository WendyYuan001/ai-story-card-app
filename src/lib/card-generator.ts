import puppeteer from 'puppeteer';
import { CardTemplate } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

export interface CardInput {
  title: string;
  story: string;
  imageUrl: string;
  keywords: string[];
}

export class CardGenerator {
  private templateDir: string;

  constructor() {
    this.templateDir = path.join(process.cwd(), 'src', 'templates');
  }

  // 生成卡片图片
  async generateCard(input: CardInput, template: CardTemplate = 'gradient'): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // 设置页面视口
      await page.setViewport({
        width: 375,
        height: 800,
        deviceScaleFactor: 2, // Retina 屏幕支持
      });

      // 加载模板
      const html = this.getTemplateHtml(template, input);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // 等待图片加载
      await page.evaluateHandle('document.querySelector("img")');

      // 截图
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
      });

      return screenshot as Buffer;
    } finally {
      await browser.close();
    }
  }

  // 获取模板 HTML
  private getTemplateHtml(template: CardTemplate, input: CardInput): string {
    const templateId = `template-${template}`;
    
    // 读取模板文件
    const templatePath = path.join(this.templateDir, 'card-templates.html');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');

    // 提取对应模板
    const regex = new RegExp(
      `<template id="${templateId}">([\\s\\S]*?)</template>`,
      'i'
    );
    const match = templateContent.match(regex);

    if (!match) {
      throw new Error(`模板 ${template} 未找到`);
    }

    let html = match[1];

    // 替换占位符
    html = html.replace(/\{\{title\}\}/g, this.escapeHtml(input.title));
    html = html.replace(/\{\{story\}\}/g, this.escapeHtml(input.story));
    html = html.replace(/\{\{imageUrl\}\}/g, input.imageUrl);
    html = html.replace(/\{\{keywords\}\}/g, input.keywords.join(', '));

    // 包裹在完整的 HTML 文档中
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  // HTML 转义
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // 保存卡片到文件
  async saveCard(input: CardInput, outputPath: string, template: CardTemplate = 'gradient'): Promise<void> {
    const buffer = await this.generateCard(input, template);
    const dir = path.dirname(outputPath);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
  }
}

// 单例
let cardGeneratorInstance: CardGenerator | null = null;

export function getCardGenerator(): CardGenerator {
  if (!cardGeneratorInstance) {
    cardGeneratorInstance = new CardGenerator();
  }
  return cardGeneratorInstance;
}
