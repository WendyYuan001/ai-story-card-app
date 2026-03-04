'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TextFileUploader from '@/components/TextFileUploader';
import TextFileViewer from '@/components/TextFileViewer';

export default function TextViewerContent() {
  const searchParams = useSearchParams();
  const [fileContent, setFileContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 从 URL 参数加载文件
  useEffect(() => {
    const fileUrl = searchParams.get('file');
    const fname = searchParams.get('filename');

    if (fileUrl) {
      loadFileFromUrl(fileUrl, fname || 'uploaded-file.txt');
    }
  }, [searchParams]);

  const loadFileFromUrl = async (url: string, fname: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('文件加载失败');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setFileContent(result.data.content);
        setFilename(result.data.filename || fname);
      } else {
        throw new Error(result.error || '文件加载失败');
      }
    } catch (err) {
      console.error('加载文件失败:', err);
      setError(err instanceof Error ? err.message : '文件加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextLoad = (content: string, fname: string) => {
    setFileContent(content);
    setFilename(fname);
    setError('');
  };

  const handleReset = () => {
    setFileContent('');
    setFilename('');
    setError('');
    // 清除 URL 参数
    window.history.replaceState({}, '', '/text-viewer');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📄 文本查看器
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              上传并查看文本文件内容
            </p>
          </div>
          <nav className="flex gap-2">
            <a
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              📸 AI 故事卡片
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-pulse text-4xl mb-4">📄</div>
            <p className="text-gray-600">正在加载文件...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
            >
              返回上传页面
            </button>
          </div>
        ) : !fileContent ? (
          <TextFileUploader onTextLoad={handleTextLoad} />
        ) : (
          <TextFileViewer
            content={fileContent}
            filename={filename}
            onReset={handleReset}
          />
        )}
      </div>

      {/* API Usage Hint */}
      {!fileContent && !isLoading && !error && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-gray-800 mb-3">💡 命令行上传方式</h3>
            <p className="text-sm text-gray-700 mb-3">
              你也可以使用 curl 命令上传文件：
            </p>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm font-mono overflow-x-auto">
              <div className="text-gray-500"># 上传文件（会返回查看链接）</div>
              <div>curl -X POST --data-binary @example.txt \</div>
              <div className="pl-4">http://118.25.85.253/api/text-file/example.txt</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>支持 .txt, .md, .js, .html, .css, .json 等多种文本格式</p>
      </footer>
    </main>
  );
}
