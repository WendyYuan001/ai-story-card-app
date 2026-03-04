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
