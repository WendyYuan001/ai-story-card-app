'use client';

import { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageSelect: (dataUrl: string) => void;
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>('');

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (preview) {
      onImageSelect(preview);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          上传你的照片
        </h2>

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400'
              }
            `}
          >
            <div className="space-y-4">
              <div className="text-5xl">📷</div>
              <div>
                <p className="text-gray-700 font-medium">
                  拖拽照片到这里，或者
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
                >
                  点击选择
                </button>
              </div>
              <p className="text-sm text-gray-500">
                支持 JPG、PNG、WebP 格式
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="预览"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPreview('')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                重新选择
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
              >
                确认使用
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-sm text-gray-700 font-medium">智能识别</p>
          <p className="text-xs text-gray-500 mt-1">AI 识别图片主体</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-2">✨</div>
          <p className="text-sm text-gray-700 font-medium">创意故事</p>
          <p className="text-xs text-gray-500 mt-1">生成精彩故事</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-2">🎴</div>
          <p className="text-sm text-gray-700 font-medium">精美卡片</p>
          <p className="text-xs text-gray-500 mt-1">一键生成分享</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
    </div>
  );
}
