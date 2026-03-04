'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ImageFile {
  id: number;
  file: File;
  preview: string;
  compressed?: string;
}

interface VideoPromptOptions {
  duration: number;
  aspectRatio: string;
  resolution: string;
  filterStyle: string;
  storyStyle: string;
  language: 'zh' | 'en';
}

const DURATION_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
  { value: 15, label: '15秒' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '横屏 16:9' },
  { value: '9:16', label: '竖屏 9:16' },
  { value: '1:1', label: '方形 1:1' },
  { value: '4:3', label: '经典 4:3' },
];

const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: '4K', label: '4K' },
];

const FILTER_STYLE_OPTIONS = [
  { value: 'cinematic', label: '🎬 电影感' },
  { value: 'anime', label: '🌸 动漫风' },
  { value: 'realistic', label: '📷 写实' },
  { value: 'vintage', label: '🎞️ 复古' },
  { value: 'dreamy', label: '✨ 梦幻' },
  { value: 'noir', label: '🖤 黑白' },
];

const STORY_STYLE_OPTIONS = [
  { value: 'humorous', label: '😂 幽默搞笑' },
  { value: 'heartwarming', label: '💖 温馨治愈' },
  { value: 'suspense', label: '😱 惊悚悬疑' },
  { value: 'romantic', label: '💕 浪漫爱情' },
  { value: 'adventure', label: '🗡️ 冒险刺激' },
  { value: 'documentary', label: '📹 纪录片' },
  { value: 'other', label: '📝 其他' },
];

// 压缩图片 - 等宽高比压缩，宽高都不超过 1024
async function compressImage(file: File, maxSize = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 等宽高比缩放，确保宽高都不超过 maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VideoPromptPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<VideoPromptOptions>({
    duration: 10,
    aspectRatio: '16:9',
    resolution: '1080p',
    filterStyle: 'cinematic',
    storyStyle: 'heartwarming',
    language: 'zh',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 检查登录状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 处理单个图片上传（通过 @ 触发）
  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (images.length >= 5) {
      setError('最多上传5张图片');
      setShowImagePicker(false);
      return;
    }

    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
    
    if (!isValidType) {
      setError('只支持 JPG、PNG、WebP 格式');
      setShowImagePicker(false);
      return;
    }
    if (!isValidSize) {
      setError('图片大小不能超过 10MB');
      setShowImagePicker(false);
      return;
    }

    setError(null);
    setShowImagePicker(false);

    const preview = URL.createObjectURL(file);
    const compressed = await compressImage(file);
    const newIndex = images.length + 1;
    
    setImages(prev => [...prev, {
      id: Date.now() + Math.random(),
      file,
      preview,
      compressed,
    }]);

    // 在光标位置插入 [图片N]
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = description.substring(0, start);
      const textAfter = description.substring(end);
      
      // 移除刚刚输入的 @
      const newTextBefore = textBefore.endsWith('@') ? textBefore.slice(0, -1) : textBefore;
      const newDescription = newTextBefore + `[图片${newIndex}]` + textAfter;
      setDescription(newDescription);
      
      // 设置光标位置
      setTimeout(() => {
        const newPos = newTextBefore.length + `[图片${newIndex}]`.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理批量图片上传
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError('最多上传5张图片');
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) {
        setError('只支持 JPG、PNG、WebP 格式');
        return false;
      }
      if (!isValidSize) {
        setError('图片大小不能超过 10MB');
        return false;
      }
      return true;
    });

    setError(null);

    for (const file of validFiles) {
      if (images.length >= 5) break;
      
      const preview = URL.createObjectURL(file);
      const compressed = await compressImage(file);
      
      setImages(prev => [...prev, {
        id: Date.now() + Math.random(),
        file,
        preview,
        compressed,
      }]);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 监听文本输入，检测 @ 符号
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    // 检测是否刚输入了 @
    const cursorPos = e.target.selectionStart;
    if (cursorPos > 0 && value[cursorPos - 1] === '@') {
      // 获取 @ 符号的位置，显示选择器
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      
      // 简单估算位置（实际可能需要更精确的计算）
      const lineHeight = 24; // 估算行高
      const charWidth = 10; // 估算字符宽度
      const lines = value.substring(0, cursorPos).split('\n');
      const currentLine = lines.length;
      const currentCol = lines[lines.length - 1].length;
      
      setPickerPosition({
        top: rect.top + (currentLine * lineHeight) - textarea.scrollTop,
        left: rect.left + (currentCol * charWidth),
      });
      setShowImagePicker(true);
    } else {
      setShowImagePicker(false);
    }
  };

  // 删除图片
  const removeImage = (index: number) => {
    setImages(prev => {
      const img = prev[index];
      if (img) URL.revokeObjectURL(img.preview);
      
      // 更新描述中的引用
      const oldRef = `[图片${index + 1}]`;
      let newDescription = description.split(oldRef).join('【待删除】');
      
      // 更新后续图片的引用编号
      for (let i = index + 1; i < prev.length; i++) {
        const oldRefNext = `[图片${i + 1}]`;
        const newRefNext = `[图片${i}]`;
        newDescription = newDescription.split(oldRefNext).join(newRefNext);
      }
      
      // 移除标记为待删除的引用
      newDescription = newDescription.split('【待删除】').join('');
      setDescription(newDescription);
      
      return prev.filter((_, i) => i !== index);
    });
  };

  // 插入图片引用
  const insertImageRef = (index: number) => {
    const ref = `[图片${index + 1}]`;
    setDescription(prev => prev + ref);
    setShowImagePicker(false);
    textareaRef.current?.focus();
  };

  // 生成提示词
  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('请输入描述');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/video-prompt-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          images: images.map(img => img.compressed),
          options,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '生成失败');
      }

      setResult(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 复制结果
  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      alert('已复制到剪贴板');
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">🎬</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSingleImageUpload}
        className="hidden"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🎬 视频提示词生成器
          </h1>
          <p className="text-gray-600">
            上传图片，描述场景，生成专业的视频生成提示词
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左侧：输入区 */}
          <div className="space-y-6">
            {/* 图片上传 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📷 上传参考图片（可选，最多5张）
              </h2>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {images.map((img, index) => (
                  <div key={img.id} className="relative group aspect-square">
                    <img
                      src={img.preview}
                      alt={`图片${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => removeImage(index)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                      >
                        删除
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                      图片{index + 1}
                    </span>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleBatchImageUpload}
                      className="hidden"
                    />
                    <span className="text-gray-400 text-2xl">+</span>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                支持 JPG/PNG/WebP，单张≤10MB，上传时自动压缩
              </p>
            </div>

            {/* 描述输入 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 relative">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ✏️ 描述你想要的视频场景
              </h2>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="描述你想要的视频场景...&#10;&#10;例如：[图片1]是一只可爱的小猫，它正在追逐一个红色的毛线球，场景是温馨的客厅...&#10;&#10;输入 @ 可以快速插入图片引用"
                  className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                
                {/* 图片选择弹窗 */}
                {showImagePicker && (
                  <div 
                    className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]"
                    style={{ top: '100%', left: 0 }}
                  >
                    {images.length === 0 ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <span>📷</span>
                        <span>上传新图片</span>
                      </button>
                    ) : (
                      <>
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => insertImageRef(index)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                          >
                            <span>📷</span>
                            <span>[图片{index + 1}]</span>
                          </button>
                        ))}
                        {images.length < 5 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded flex items-center gap-2 border-t border-gray-100 mt-1 pt-2"
                          >
                            <span>➕</span>
                            <span>上传新图片</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                输入 @ 可快速引用图片，例如 "[图片1]中的猫咪跳到了[图片2]的沙发上"
              </p>
            </div>

            {/* 选项 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ⚙️ 视频参数
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* 时长 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    视频时长
                  </label>
                  <select
                    value={options.duration}
                    onChange={(e) => setOptions({ ...options, duration: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 宽高比 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    宽高比
                  </label>
                  <select
                    value={options.aspectRatio}
                    onChange={(e) => setOptions({ ...options, aspectRatio: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    {ASPECT_RATIO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 分辨率 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分辨率
                  </label>
                  <select
                    value={options.resolution}
                    onChange={(e) => setOptions({ ...options, resolution: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    {RESOLUTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 输出语言 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输出语言
                  </label>
                  <select
                    value={options.language}
                    onChange={(e) => setOptions({ ...options, language: e.target.value as 'zh' | 'en' })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* 滤镜风格 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  滤镜风格
                </label>
                <div className="flex flex-wrap gap-2">
                  {FILTER_STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOptions({ ...options, filterStyle: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        options.filterStyle === opt.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 剧情风格 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  剧情风格
                </label>
                <div className="flex flex-wrap gap-2">
                  {STORY_STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOptions({ ...options, storyStyle: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        options.storyStyle === opt.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={generating || !description.trim()}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '生成中...' : '🎬 生成提示词（消耗10积分）'}
            </button>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>

          {/* 右侧：结果区 */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  📝 生成的提示词
                </h2>
                {result && (
                  <button
                    onClick={copyResult}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200 transition-colors"
                  >
                    📋 复制
                  </button>
                )}
              </div>
              
              {result ? (
                <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-700 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                  {result}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">🎬</div>
                  <p>填写描述并点击生成按钮</p>
                  <p className="text-xs mt-1">生成的提示词将显示在这里</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
