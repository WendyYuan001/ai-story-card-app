'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// 视频生成模型配置 - 扩展版
const VIDEO_MODELS = [
  // 国内模型
  {
    id: 'keling',
    name: '可灵 (Keling)',
    company: '快手',
    description: '中文场景理解最强，性价比高',
    maxDuration: 10,
    emoji: '🎬',
    features: ['中文友好', '场景理解强', '速度快'],
    region: 'china',
    apiStatus: 'available',
    pricing: '¥0.2/秒',
  },
  {
    id: 'vidu',
    name: 'Vidu',
    company: '生数科技',
    description: '国产高质量，支持较长视频',
    maxDuration: 16,
    emoji: '🎥',
    features: ['性价比高', '风格多样', '支持长视频'],
    region: 'china',
    apiStatus: 'available',
    pricing: '¥0.3/秒',
  },
  {
    id: 'jimeng',
    name: '即梦 (Jimeng)',
    company: '字节跳动',
    description: '抖音生态，效果不错',
    maxDuration: 5,
    emoji: '🎵',
    features: ['抖音风格', '年轻化', '创意强'],
    region: 'china',
    apiStatus: 'beta',
    pricing: '¥0.25/秒',
  },
  {
    id: 'hunyuan',
    name: '混元视频',
    company: '腾讯',
    description: '腾讯云生态，企业级',
    maxDuration: 6,
    emoji: '🐧',
    features: ['企业级', '稳定可靠', '腾讯生态'],
    region: 'china',
    apiStatus: 'beta',
    pricing: '¥0.35/秒',
  },

  // 国际模型
  {
    id: 'runway',
    name: 'Runway Gen-3',
    company: 'Runway',
    description: '顶级画质，电影级效果',
    maxDuration: 10,
    emoji: '✈️',
    features: ['画质顶级', '电影级', '专业工具'],
    region: 'international',
    apiStatus: 'available',
    pricing: '$0.05/秒',
  },
  {
    id: 'pika',
    name: 'Pika Labs',
    company: 'Pika',
    description: '动画风格强，创意无限',
    maxDuration: 4,
    emoji: '⚡',
    features: ['动画风格', '速度快', '创意强'],
    region: 'international',
    apiStatus: 'available',
    pricing: '$0.03/秒',
  },
  {
    id: 'sora2',
    name: 'Sora 2',
    company: 'OpenAI',
    description: 'OpenAI 最新视频生成模型',
    maxDuration: 20,
    emoji: '🌟',
    features: ['画质顶级', '时长最长', '细节丰富'],
    region: 'international',
    apiStatus: 'waitlist',
    pricing: '$0.1/秒',
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    company: 'Luma AI',
    description: '物理真实，3D效果强',
    maxDuration: 5,
    emoji: '💫',
    features: ['物理真实', '3D效果', '高保真'],
    region: 'international',
    apiStatus: 'available',
    pricing: '$0.04/秒',
  },
  {
    id: 'svd',
    name: 'Stable Video',
    company: 'Stability AI',
    description: '开源方案，可自部署',
    maxDuration: 4,
    emoji: '🔷',
    features: ['开源免费', '可自部署', '社区支持'],
    region: 'international',
    apiStatus: 'available',
    pricing: '免费/自部署',
  },
  {
    id: 'haiper',
    name: 'Haiper',
    company: 'Haiper AI',
    description: '英国团队，效果稳定',
    maxDuration: 6,
    emoji: '🎬',
    features: ['效果稳定', '欧洲团队', '创意工具'],
    region: 'international',
    apiStatus: 'available',
    pricing: '$0.035/秒',
  },
];

interface GenerationTask {
  taskId: string;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  estimatedTime?: number;
  error?: string;
}

function VideoGeneratorContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('keling');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [filterRegion, setFilterRegion] = useState<'all' | 'china' | 'international'>('all');

  const [generating, setGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<GenerationTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从 URL 参数获取提示词
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setPrompt(decodeURIComponent(promptParam));
    }
  }, [searchParams]);

  // 检查登录状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/video-generate?taskId=${taskId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '查询任务状态失败');
      }

      setCurrentTask(prev => prev ? {
        ...prev,
        status: data.status,
        progress: data.progress,
        videoUrl: data.videoUrl,
      } : null);

      if (data.status === 'completed' || data.status === 'failed') {
        return data.status;
      }

      return data.status;
    } catch (err) {
      console.error('Poll error:', err);
      return 'failed';
    }
  }, []);

  // 开始轮询
  useEffect(() => {
    if (!currentTask || currentTask.status === 'completed' || currentTask.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      const status = await pollTaskStatus(currentTask.taskId);
      if (status === 'completed' || status === 'failed') {
        clearInterval(interval);
        setGenerating(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentTask, pollTaskStatus]);

  // 提交视频生成任务
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入视频提示词');
      return;
    }

    setGenerating(true);
    setError(null);
    setCurrentTask(null);

    try {
      const res = await fetch('/api/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          duration,
          aspectRatio,
          resolution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '提交任务失败');
      }

      setCurrentTask({
        taskId: data.taskId,
        model: data.model,
        status: data.status,
        estimatedTime: data.estimatedTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交任务失败');
      setGenerating(false);
    }
  };

  // 复制提示词
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      alert('已复制到剪贴板 ✨');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('已复制到剪贴板 ✨');
    }
  };

  const goBackToPrompt = () => {
    router.push('/video-prompt');
  };

  // 过滤模型列表
  const filteredModels = VIDEO_MODELS.filter(m => 
    filterRegion === 'all' || m.region === filterRegion
  );

  const selectedModelConfig = VIDEO_MODELS.find(m => m.id === selectedModel);

  if (loading) {
    return (
      <div className="bg-fun min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 animate-bounce-gentle">🎬</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fun min-h-screen relative">
      <div className="bg-decoration">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* 提示词输入 */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 card-hover animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📝</span>
              视频提示词
            </h2>
            <div className="flex gap-2">
              <button
                onClick={goBackToPrompt}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-1"
              >
                <span>✏️</span>
                <span>编辑</span>
              </button>
              <button
                onClick={copyPrompt}
                className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all flex items-center gap-1"
              >
                <span>📋</span>
                <span>复制</span>
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入视频描述或从提示词生成器导入..."
            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-0 transition-all resize-none text-gray-800"
          />
        </div>

        {/* 地区筛选 */}
        <div className="flex gap-2 mb-4 animate-fade-in-up">
          {[
            { value: 'all', label: '全部模型', emoji: '🌐' },
            { value: 'china', label: '国内模型', emoji: '🇨🇳' },
            { value: 'international', label: '国际模型', emoji: '🌍' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterRegion(opt.value as 'all' | 'china' | 'international')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterRegion === opt.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>

        {/* 模型选择 */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 card-hover animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            选择视频生成模型
            <span className="text-sm font-normal text-gray-500">({filteredModels.length} 个可用)</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id);
                  if (duration > model.maxDuration) {
                    setDuration(model.maxDuration);
                  }
                }}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedModel === model.id
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-[1.02]'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{model.emoji}</span>
                    <span className="font-bold text-sm">{model.name}</span>
                  </div>
                  {model.apiStatus === 'beta' && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full">内测</span>
                  )}
                  {model.apiStatus === 'waitlist' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-400 text-white rounded-full">候补</span>
                  )}
                </div>
                <p className={`text-xs mb-2 ${selectedModel === model.id ? 'text-white/90' : 'text-gray-500'}`}>
                  {model.company} · {model.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {model.features.slice(0, 2).map((feature, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedModel === model.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <div className={`flex justify-between text-xs ${selectedModel === model.id ? 'text-white/80' : 'text-gray-400'}`}>
                  <span>最长 {model.maxDuration}s</span>
                  <span>{model.pricing}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 视频参数 */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            视频参数
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">视频时长</label>
              <div className="flex gap-1">
                {[5, 10, 15, 20].map((d) => {
                  const isDisabled = selectedModelConfig && d > selectedModelConfig.maxDuration;
                  return (
                    <button
                      key={d}
                      onClick={() => !isDisabled && setDuration(d)}
                      disabled={isDisabled}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : isDisabled
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {d}s
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">宽高比</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-0 text-sm"
              >
                <option value="16:9">16:9 横屏</option>
                <option value="9:16">9:16 竖屏</option>
                <option value="1:1">1:1 方形</option>
                <option value="4:3">4:3 经典</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分辨率</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:ring-0 text-sm"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim() || selectedModelConfig?.apiStatus === 'waitlist'}
          className="w-full py-4 btn-gradient text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>生成中...</span>
            </>
          ) : selectedModelConfig?.apiStatus === 'waitlist' ? (
            <>
              <span>⏳</span>
              <span>{selectedModelConfig.name} 需要申请候补</span>
            </>
          ) : (
            <>
              <span>🎥</span>
              <span>生成视频（{selectedModelConfig?.name} · {selectedModelConfig?.pricing}）</span>
            </>
          )}
        </button>

        {/* 生成状态 */}
        {currentTask && (
          <div className="mt-5 bg-white rounded-2xl shadow-lg p-5 card-hover animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">🎬</span>
                生成任务
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentTask.status === 'completed' ? 'bg-green-100 text-green-600' :
                currentTask.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                currentTask.status === 'failed' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {currentTask.status === 'completed' ? '✅ 完成' :
                 currentTask.status === 'processing' ? '⏳ 生成中' :
                 currentTask.status === 'failed' ? '❌ 失败' :
                 '⏳ 排队中'}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-3">
              <p><strong>模型:</strong> {currentTask.model}</p>
              <p><strong>任务ID:</strong> {currentTask.taskId}</p>
              {currentTask.estimatedTime && (
                <p><strong>预计时间:</strong> {Math.ceil(currentTask.estimatedTime / 60)} 分钟</p>
              )}
            </div>

            {currentTask.status === 'processing' && currentTask.progress && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>
            )}

            {currentTask.status === 'completed' && currentTask.videoUrl && (
              <div className="mt-3">
                <video
                  src={currentTask.videoUrl}
                  controls
                  className="w-full rounded-xl"
                />
                <a
                  href={currentTask.videoUrl}
                  download
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  <span>⬇️</span>
                  <span>下载视频</span>
                </a>
              </div>
            )}

            {currentTask.status === 'failed' && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {currentTask.error || '视频生成失败，请重试'}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in-up">
            <span>😅</span>
            <span>{error}</span>
          </div>
        )}

        {/* 模型对比说明 */}
        <div className="mt-5 bg-white/50 rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>💡</span>
            模型对比说明
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🇨🇳 国内模型优势</h4>
              <ul className="space-y-1">
                <li>• <strong>可灵</strong> - 中文理解最好，性价比高</li>
                <li>• <strong>Vidu</strong> - 画质不错，支持较长视频</li>
                <li>• <strong>即梦</strong> - 抖音风格，年轻化</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🌍 国际模型优势</h4>
              <ul className="space-y-1">
                <li>• <strong>Runway</strong> - 电影级画质，专业首选</li>
                <li>• <strong>Pika</strong> - 动画风格，创意无限</li>
                <li>• <strong>Luma</strong> - 3D效果强，物理真实</li>
                <li>• <strong>Stable Video</strong> - 免费开源，可自部署</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="bg-fun min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 animate-bounce-gentle">🎬</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    }>
      <VideoGeneratorContent />
    </Suspense>
  );
}
