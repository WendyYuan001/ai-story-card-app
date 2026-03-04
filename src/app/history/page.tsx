'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface HistoryRecord {
  id: number;
  type: string;
  input: {
    description?: string;
    images?: string[];
    imageUrls?: string[];
    options?: {
      duration?: number;
      aspectRatio?: string;
      resolution?: string;
      filterStyle?: string;
      storyStyle?: string;
      language?: string;
    };
  };
  output: {
    prompt?: string;
  };
  pointsUsed: number;
  createdAt: string;
}

interface HistoryResponse {
  records: HistoryRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: string;
    totalPages: number;
  };
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  'video-prompt-v2': { label: '视频提示词', emoji: '🎬' },
  'video-prompt': { label: '视频提示词', emoji: '🎬' },
  'story': { label: '故事生成', emoji: '📖' },
};

const FILTER_STYLE_LABELS: Record<string, string> = {
  cinematic: '电影感',
  anime: '动漫风',
  realistic: '写实',
  vintage: '复古',
  dreamy: '梦幻',
  noir: '黑白',
};

const STORY_STYLE_LABELS: Record<string, string> = {
  humorous: '幽默搞笑',
  heartwarming: '温馨治愈',
  suspense: '惊悚悬疑',
  romantic: '浪漫爱情',
  adventure: '冒险刺激',
  documentary: '纪录片',
  other: '其他',
};

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchRecords(1);
    }
  }, [user]);

  const fetchRecords = async (page: number) => {
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/history?page=${page}&pageSize=10`);
      const data: HistoryResponse = await res.json();
      setRecords(data.records);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
      });
    } catch (e) {
      console.error('获取历史记录失败:', e);
    } finally {
      setLoadingRecords(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取图片列表（支持新旧两种格式）
  const getImages = (record: HistoryRecord): string[] => {
    return record.input.imageUrls || record.input.images || [];
  };

  if (loading) {
    return (
      <div className="bg-fun min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="text-6xl mb-4 animate-bounce-gentle">📜</div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">魔法加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fun min-h-screen relative">
      {/* 装饰性背景 */}
      <div className="bg-decoration">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8 animate-fade-in-up">
          <span className="text-5xl animate-bounce-gentle inline-block">📜</span>
          <h1 className="text-3xl font-bold text-gradient mt-4">
            历史记录
          </h1>
          <p className="text-gray-600 mt-2">
            查看你的创作记录
          </p>
        </div>

        {loadingRecords ? (
          <div className="text-center py-12 animate-fade-in-up">
            <div className="text-4xl mb-4 animate-float">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center card-hover animate-fade-in-up">
            <div className="text-6xl mb-4 animate-bounce-gentle inline-block">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">暂无记录</h3>
            <p className="text-gray-500 mb-6">你还没有生成过任何内容</p>
            <a
              href="/video-prompt"
              className="inline-block btn-gradient px-6 py-3 text-white rounded-xl font-medium"
            >
              ✨ 开始创作
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => {
              const typeInfo = TYPE_LABELS[record.type] || { label: '创作', emoji: '📝' };
              const images = getImages(record);
              
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* 头部 */}
                  <div
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {typeInfo.emoji}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800 line-clamp-1">
                          {record.input.description?.substring(0, 40)}
                          {record.input.description && record.input.description.length > 40 ? '...' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatDate(record.createdAt)}</span>
                          <span>·</span>
                          <span className="text-purple-500 font-medium">消耗 {record.pointsUsed} 积分</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 缩略图 */}
                      {images.length > 0 && (
                        <div className="flex -space-x-2">
                          {images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow"
                            />
                          ))}
                          {images.length > 3 && (
                            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                              +{images.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <span className={`text-gray-400 transition-transform ${expandedId === record.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* 展开内容 */}
                  {expandedId === record.id && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30">
                      {/* 图片 */}
                      {images.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <span>📷</span> 参考图片
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`图片${i + 1}`}
                                className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:scale-105 transition-transform shadow"
                                onClick={() => setSelectedImage(img)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 描述 */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          <span>✏️</span> 描述
                        </h4>
                        <div className="bg-white rounded-xl p-3 text-gray-700 text-sm border border-gray-100">
                          {record.input.description || '无描述'}
                        </div>
                      </div>

                      {/* 参数 */}
                      {record.input.options && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <span>⚙️</span> 参数
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                              {record.input.options.duration}秒
                            </span>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                              {record.input.options.aspectRatio}
                            </span>
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                              {record.input.options.resolution}
                            </span>
                            {record.input.options.filterStyle && (
                              <span className="px-2.5 py-1 bg-pink-100 text-pink-600 rounded-full font-medium">
                                {FILTER_STYLE_LABELS[record.input.options.filterStyle] || record.input.options.filterStyle}
                              </span>
                            )}
                            {record.input.options.storyStyle && (
                              <span className="px-2.5 py-1 bg-cyan-100 text-cyan-600 rounded-full font-medium">
                                {STORY_STYLE_LABELS[record.input.options.storyStyle] || record.input.options.storyStyle}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 生成结果 */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          <span>📝</span> 生成结果
                        </h4>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed max-h-60 overflow-y-auto">
                          {record.output.prompt || '无结果'}
                        </div>
                      </div>

                      {/* 复制按钮 */}
                      {record.output.prompt && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(record.output.prompt!);
                            alert('已复制到剪贴板 ✨');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-xl text-sm font-medium hover:from-purple-200 hover:to-pink-200 transition-all flex items-center gap-1"
                        >
                          <span>📋</span> 复制结果
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 animate-fade-in-up">
                <button
                  onClick={() => fetchRecords(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-white rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all font-medium text-sm"
                >
                  ← 上一页
                </button>
                <span className="px-4 py-2 text-gray-600 font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchRecords(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 bg-white rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all font-medium text-sm"
                >
                  下一页 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-fade-in-up"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:scale-110 transition-transform"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
