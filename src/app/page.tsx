'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import StoryGenerator from '@/components/StoryGenerator';
import CardPreview from '@/components/CardPreview';
import { useAuth } from '@/context/AuthContext';
import { AIImageAnalysis, AIStoryResponse } from '@/types';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'generate' | 'preview'>('upload');
  const [imageData, setImageData] = useState<string>('');
  const [imageAnalysis, setImageAnalysis] = useState<AIImageAnalysis | null>(null);
  const [storyData, setStoryData] = useState<AIStoryResponse | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleImageSelect = (dataUrl: string) => {
    if (!user) return;
    setImageData(dataUrl);
    setStep('generate');
  };

  const handleAnalysisComplete = (analysis: AIImageAnalysis) => {
    setImageAnalysis(analysis);
  };

  const handleStoryGenerated = (story: AIStoryResponse) => {
    setStoryData(story);
    setStep('preview');
  };

  const handleReset = () => {
    setStep('upload');
    setImageData('');
    setImageAnalysis(null);
    setStoryData(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-fun min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 animate-bounce-gentle">📸</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">魔法加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show landing page
  if (!user) {
    return (
      <div className="bg-fun min-h-screen relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="bg-decoration">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-blob bg-blob-3" />
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto px-4 pt-20 pb-12">
            <div className="text-center animate-fade-in-up">
              {/* 大标题 */}
              <div className="mb-6">
                <span className="text-7xl animate-float inline-block">📸</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="text-gradient">AI 故事卡片</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-2">
                让每张照片都有一个精彩的故事
              </p>
              
              <p className="text-gray-500 mb-8">
                ✨ 上传照片 → AI 识别 → 生成故事 → 制作卡片
              </p>

              {/* CTA 按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/login"
                  className="btn-gradient px-8 py-4 text-white font-bold rounded-2xl text-lg inline-flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>立即开始创作</span>
                </Link>
                <Link
                  href="/video-prompt"
                  className="px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl text-lg border-2 border-purple-200 hover:border-purple-400 transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>🎬</span>
                  <span>试试视频提示词</span>
                </Link>
              </div>

              {/* 特性卡片 */}
              <div className="grid md:grid-cols-3 gap-6 mt-16">
                <div className="bg-white rounded-3xl p-6 shadow-lg card-hover animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <div className="text-5xl mb-4 animate-bounce-gentle inline-block">🤖</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">AI 智能识别</h3>
                  <p className="text-gray-600 text-sm">
                    上传照片，AI 自动识别图中主体、场景和氛围
                  </p>
                </div>
                
                <div className="bg-white rounded-3xl p-6 shadow-lg card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-5xl mb-4 animate-bounce-gentle inline-block" style={{ animationDelay: '0.2s' }}>📖</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">生成精彩故事</h3>
                  <p className="text-gray-600 text-sm">
                    基于图片内容，AI 生成独特的温馨治愈故事
                  </p>
                </div>
                
                <div className="bg-white rounded-3xl p-6 shadow-lg card-hover animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <div className="text-5xl mb-4 animate-bounce-gentle inline-block" style={{ animationDelay: '0.4s' }}>🃏</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">精美分享卡片</h3>
                  <p className="text-gray-600 text-sm">
                    一键生成精美卡片，支持多种风格和下载分享
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 功能展示 */}
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎨 多种卡片风格</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {['渐变风格', '简约风格', '复古风格', '赛博朋克'].map((style, i) => (
                  <span 
                    key={style}
                    className="tag-fun px-4 py-2 rounded-full text-sm font-medium text-purple-700"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="max-w-4xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">
              Powered by AI · 让创意无限流动 💫
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // Logged in - show main content
  return (
    <div className="bg-fun min-h-screen relative">
      {/* 装饰性背景 */}
      <div className="bg-decoration">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { key: 'upload', label: '上传', emoji: '📤' },
            { key: 'generate', label: '生成', emoji: '✨' },
            { key: 'preview', label: '预览', emoji: '🎨' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div 
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                  ${step === s.key 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110' 
                    : step === 'upload' && i > 0 || step === 'generate' && i > 1
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-white text-gray-600 shadow'
                  }
                `}
              >
                <span>{s.emoji}</span>
                <span className="font-medium">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={`w-8 h-0.5 mx-1 ${i < ['upload', 'generate', 'preview'].indexOf(step) ? 'bg-purple-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="animate-fade-in-up">
          {step === 'upload' && (
            <ImageUploader onImageSelect={handleImageSelect} />
          )}

          {step === 'generate' && (
            <StoryGenerator
              imageData={imageData}
              onAnalysisComplete={handleAnalysisComplete}
              onStoryGenerated={handleStoryGenerated}
              onCancel={handleReset}
            />
          )}

          {step === 'preview' && storyData && (
            <CardPreview
              imageData={imageData}
              storyData={storyData}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-sm">
          Powered by AI · 让创意无限流动 💫
        </p>
      </footer>
    </div>
  );
}
