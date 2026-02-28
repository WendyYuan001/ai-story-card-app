'use client';

import { useState } from 'react';

interface TextFileViewerProps {
  content: string;
  filename: string;
  onReset: () => void;
}

export default function TextFileViewer({
  content,
  filename,
  onReset,
}: TextFileViewerProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = content;
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    const charsNoSpaces = content.replace(/\s/g, '').length;

    return { lines, words, chars, charsNoSpaces };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* 文件信息 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{filename}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.lines} 行 · {stats.words} 词 · {stats.chars} 字符
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all font-medium text-sm flex items-center gap-2"
            >
              {isCopied ? '✓ 已复制' : '📋 复制'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all font-medium text-sm flex items-center gap-2"
            >
              📥 下载
            </button>
          </div>
        </div>
      </div>

      {/* 内容显示 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">文件内容</h3>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">文件统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.lines}</div>
            <div className="text-sm text-gray-600 mt-1">行数</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.words}</div>
            <div className="text-sm text-gray-600 mt-1">词数</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.chars}</div>
            <div className="text-sm text-gray-600 mt-1">字符数</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.charsNoSpaces}</div>
            <div className="text-sm text-gray-600 mt-1">不含空格</div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
        >
          重新上传
        </button>
      </div>
    </div>
  );
}
