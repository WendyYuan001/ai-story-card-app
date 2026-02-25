'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import StoryGenerator from '@/components/StoryGenerator';
import CardPreview from '@/components/CardPreview';
import { AIImageAnalysis, AIStoryResponse } from '@/types';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'generate' | 'preview'>('upload');
  const [imageData, setImageData] = useState<string>('');
  const [imageAnalysis, setImageAnalysis] = useState<AIImageAnalysis | null>(null);
  const [storyData, setStoryData] = useState<AIStoryResponse | null>(null);

  const handleImageSelect = (dataUrl: string) => {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            📸 AI 故事卡片
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            让每张照片都有一个精彩的故事
          </p>
        </div>
      </header>

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
