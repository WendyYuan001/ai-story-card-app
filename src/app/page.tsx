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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📸</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }

  // Not logged in - show prompt
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="text-6xl mb-6">📸</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              AI 故事卡片
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              让每张照片都有一个精彩的故事
            </p>
            <p className="text-gray-500 mb-8">
              登录后即可开始创作你的 AI 故事卡片
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                登录 / 注册
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-semibold text-gray-800 mb-2">AI 智能识别</h3>
              <p className="text-gray-600 text-sm">上传照片，AI 自动识别图中主体和场景</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="font-semibold text-gray-800 mb-2">生成精彩故事</h3>
              <p className="text-gray-600 text-sm">基于图片内容生成独特的短篇故事</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">🃏</div>
              <h3 className="font-semibold text-gray-800 mb-2">制作分享卡片</h3>
              <p className="text-gray-600 text-sm">一键生成精美卡片，支持下载和分享</p>
            </div>
          </div>
        </div>

        <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>Powered by AI · 让创意无限流动</p>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {step === 'upload' && (
          <ImageUploader
            onImageSelect={handleImageSelect}
          />
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

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>Powered by AI · 让创意无限流动</p>
      </footer>
    </main>
  );
}
