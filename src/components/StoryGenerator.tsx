'use client';

import { useState, useEffect } from 'react';
import { AIImageAnalysis, AIStoryResponse, STORY_BACKGROUNDS } from '@/types';

interface StoryGeneratorProps {
  imageData: string;
  onAnalysisComplete: (analysis: AIImageAnalysis) => void;
  onStoryGenerated: (story: AIStoryResponse) => void;
  onCancel: () => void;
}

export default function StoryGenerator({
  imageData,
  onAnalysisComplete,
  onStoryGenerated,
  onCancel,
}: StoryGeneratorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AIImageAnalysis | null>(null);
  const [keywords, setKeywords] = useState<string>('');
  const [background, setBackground] = useState(STORY_BACKGROUNDS[0]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 分析图片
  useEffect(() => {
    const analyzeImage = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        });

        if (!response.ok) throw new Error('分析失败');

        const result: AIImageAnalysis = await response.json();
        setAnalysis(result);
        onAnalysisComplete(result);
      } catch (error) {
        console.error('分析失败:', error);
        alert('图片分析失败，请重试');
        onCancel();
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageAnalysis: analysis,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
          background,
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const result: AIStoryResponse = await response.json();
      onStoryGenerated(result);
    } catch (error) {
      console.error('生成失败:', error);
      alert('故事生成失败，请重试');
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    handleGenerate();
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="text-6xl">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800">
            正在分析图片...
          </h2>
          <p className="text-gray-600">
            AI 正在识别图片中的主体和内容
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分析结果 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex gap-4 mb-4">
          <img
            src={imageData}
            alt="上传的图片"
            className="w-24 h-24 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-2">分析结果</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>识别主体:</strong> {analysis?.subjects.join('、')}</p>
              <p><strong>类型:</strong> {analysis?.type}</p>
              <p><strong>描述:</strong> {analysis?.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 故事设置 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">故事设置</h3>
        
        <div className="space-y-4">
          {/* 关键词输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关键词（可选）
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="用逗号分隔，如: 冒险, 友谊, 勇气"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              不填则由 AI 随机生成
            </p>
          </div>

          {/* 风格选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              故事风格
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STORY_BACKGROUNDS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBackground(bg)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${background === bg
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isGenerating}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成故事'}
        </button>
      </div>

      {/* 重新生成按钮 */}
      {isRegenerating && (
        <div className="text-center text-sm text-gray-500">
          正在重新生成故事...
        </div>
      )}
    </div>
  );
}
