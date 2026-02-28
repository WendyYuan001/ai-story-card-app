'use client';

import { useState } from 'react';
import { AIStoryResponse, AIImageAnalysis } from '@/types';

interface VideoPromptGeneratorProps {
  story: string;
  imageAnalysis: AIImageAnalysis;
}

type VideoStyle = 'cinematic' | 'anime' | 'realistic' | 'artistic';
type Language = 'zh' | 'en';
type Duration = 5 | 10 | 15 | 20 | 25 | 30;

export default function VideoPromptGenerator({
  story,
  imageAnalysis,
}: VideoPromptGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>('cinematic');
  const [language, setLanguage] = useState<Language>('zh');  // 默认中文
  const [duration, setDuration] = useState<Duration>(10);    // 默认10秒
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const styleLabels: { [key in VideoStyle]: string } = {
    cinematic: '电影感',
    anime: '动漫',
    realistic: '写实',
    artistic: '艺术'
  };

  const generatePrompt = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          imageAnalysis,
          style: selectedStyle,
          language: language,
          duration: duration,
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const result = await response.json();
      setPrompt(result.prompt);
    } catch (error) {
      console.error('生成失败:', error);
      alert('视频提示词生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 语言选择 */}
      <div>
        <div className="text-sm text-gray-600 mb-2">语言 / Language</div>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('zh')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              language === 'zh'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🇨🇳 中文
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              language === 'en'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🇺🇸 English
          </button>
        </div>
      </div>

      {/* 视频时长选择 */}
      <div>
        <div className="text-sm text-gray-600 mb-2">视频时长</div>
        <div className="flex gap-2 flex-wrap">
          {[5, 10, 15, 20, 25, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d as Duration)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                duration === d
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* 风格选择 */}
      <div>
        <div className="text-sm text-gray-600 mb-2">风格</div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(styleLabels) as VideoStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedStyle === style
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {styleLabels[style]}
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generatePrompt}
        disabled={isGenerating}
        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? '生成中...' : '🎬 生成视频提示词'}
      </button>

      {/* 提示词显示 */}
      {prompt && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800">
              视频提示词 ({language === 'zh' ? '中文' : 'English'})
            </h4>
            <button
              onClick={() => {
                const copyText = async () => {
                  try {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(prompt);
                    } else {
                      // 降级方案：使用传统方法
                      const textArea = document.createElement('textarea');
                      textArea.value = prompt;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-999999px';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        document.execCommand('copy');
                      } finally {
                        document.body.removeChild(textArea);
                      }
                    }
                    alert('已复制到剪贴板');
                  } catch (err) {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                  }
                };
                copyText();
              }}
              className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              复制
            </button>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {prompt}
          </p>
          <div className="text-xs text-gray-500">
            💡 适用于 SeeDance 2.0、Runway、Pika 等视频生成平台
          </div>
        </div>
      )}
    </div>
  );
}
