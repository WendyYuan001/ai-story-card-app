'use client';

import { useRef, useState } from 'react';

interface TextFileUploaderProps {
  onTextLoad: (content: string, filename: string) => void;
}

export default function TextFileUploader({ onTextLoad }: TextFileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<{ content: string; filename: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    // 检查文件类型（支持纯文本、markdown、代码文件等）
    const validTypes = [
      'text/plain',
      'text/markdown',
      'text/javascript',
      'text/html',
      'text/css',
      'application/json',
      'text/xml'
    ];

    // 也可以通过文件扩展名判断
    const validExtensions = ['.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.xml', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      alert('请选择文本文件（支持 .txt, .md, .js, .html, .css, .json 等格式）');
      return;
    }

    setIsLoading(true);

    try {
      // 读取文件内容
      const text = await file.text();
      setPreview({ content: text, filename: file.name });
    } catch (error) {
      console.error('文件读取失败:', error);
      alert('文件读取失败，请重试');
    } finally {
      setIsLoading(false);
    }
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
      onTextLoad(preview.content, preview.filename);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          上传文本文件
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
              <div className="text-5xl">📄</div>
              <div>
                <p className="text-gray-700 font-medium">
                  拖拽文件到这里，或者
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50"
                >
                  {isLoading ? '读取中...' : '点击选择'}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                支持 .txt, .md, .js, .html, .css, .json 等文本格式
                <br />
                <span className="text-xs">最大支持 10MB</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">{preview.filename}</h3>
                <span className="text-xs text-gray-500">
                  {preview.content.length} 字符 · {formatFileSize(preview.content.length)}
                </span>
              </div>
              <div className="bg-white rounded border border-gray-200 p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono">
                  {preview.content.length > 5000
                    ? preview.content.slice(0, 5000) + '\n\n... (内容过长，仅显示前 5000 字符)'
                    : preview.content
                  }
                </pre>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPreview(null)}
                disabled={isLoading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium disabled:opacity-50"
              >
                重新选择
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50"
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
          <div className="text-2xl mb-2">📝</div>
          <p className="text-sm text-gray-700 font-medium">多种格式</p>
          <p className="text-xs text-gray-500 mt-1">支持各种文本文件</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-2">👁️</div>
          <p className="text-sm text-gray-700 font-medium">即时预览</p>
          <p className="text-xs text-gray-500 mt-1">快速预览内容</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl mb-2">🚀</div>
          <p className="text-sm text-gray-700 font-medium">简单快捷</p>
          <p className="text-xs text-gray-500 mt-1">拖拽或点击上传</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.js,.ts,.html,.css,.json,.xml,.csv,.markdown"
        className="hidden"
        disabled={isLoading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
    </div>
  );
}
