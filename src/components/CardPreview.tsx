'use client';

import { useState, useEffect } from 'react';
import { AIStoryResponse, CardTemplate } from '@/types';
import VideoPromptGenerator from './VideoPromptGenerator';

interface CardPreviewProps {
  imageData: string;
  storyData: AIStoryResponse;
  onReset: () => void;
}

export default function CardPreview({
  imageData,
  storyData,
  onReset,
}: CardPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('gradient');
  const [cardImageUrl, setCardImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);

  const templates: { id: CardTemplate; name: string; emoji: string }[] = [
    { id: 'gradient', name: '渐变', emoji: '🌈' },
    { id: 'minimal', name: '极简', emoji: '⚪' },
    { id: 'vintage', name: '复古', emoji: '📜' },
    { id: 'cyberpunk', name: '赛博', emoji: '🤖' },
  ];

  useEffect(() => {
    generateCard();
  }, [selectedTemplate]);

  const generateCard = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyData.title,
          story: storyData.story,
          imageUrl: imageData,
          keywords: storyData.keywords,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) throw new Error('生成卡片失败');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setCardImageUrl(url);
    } catch (error) {
      console.error('生成卡片失败:', error);
      alert('生成卡片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!cardImageUrl) return;

    const link = document.createElement('a');
    link.href = cardImageUrl;
    link.download = `ai-story-card-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 模板选择 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">选择卡片模板</h3>
        <div className="grid grid-cols-4 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`
                p-3 rounded-xl text-center transition-all
                ${selectedTemplate === template.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <div className="text-2xl mb-1">{template.emoji}</div>
              <div className="text-xs font-medium">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 卡片预览 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">卡片预览</h3>
        
        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-4">🎨</div>
              <p className="text-gray-600">正在生成卡片...</p>
            </div>
          </div>
        ) : cardImageUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={cardImageUrl}
                alt="故事卡片"
                className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">卡片生成中...</p>
          </div>
        )}
      </div>

      {/* 故事内容展示 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">{storyData.title}</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {storyData.story}
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {storyData.keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 视频提示词生成 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">🎬 视频提示词</h3>
          <button
            onClick={() => setShowVideoPrompt(!showVideoPrompt)}
            className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
          >
            {showVideoPrompt ? '收起' : '展开'}
          </button>
        </div>
        {showVideoPrompt && (
          <VideoPromptGenerator
            story={storyData.story}
            imageAnalysis={{
              subjects: storyData.keywords,
              type: 'other',
              confidence: 0.8,
              description: storyData.story
            }}
          />
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
        >
          重新上传
        </button>
        <button
          onClick={handleDownload}
          disabled={!cardImageUrl || isGenerating}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 下载卡片
        </button>
      </div>
    </div>
  );
}
