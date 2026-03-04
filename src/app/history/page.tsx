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

const TYPE_LABELS: Record<string, string> = {
  'video-prompt-v2': '🎬 视频提示词',
  'video-prompt': '🎬 视频提示词',
  'story': '📖 故事生成',
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📜</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📜 历史记录
          </h1>
          <p className="text-gray-600">
            查看你的生成记录
          </p>
        </div>

        {loadingRecords ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-4xl mb-4">⏳</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无记录</h3>
            <p className="text-gray-500 mb-6">你还没有生成过任何内容</p>
            <a
              href="/video-prompt"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              开始创作
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* 头部 */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {TYPE_LABELS[record.type] || '📝'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {record.input.description?.substring(0, 50)}
                        {record.input.description && record.input.description.length > 50 ? '...' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(record.createdAt)} · 消耗 {record.pointsUsed} 积分
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 缩略图 */}
                    {record.input.images && record.input.images.length > 0 && (
                      <div className="flex -space-x-2">
                        {record.input.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {record.input.images.length > 3 && (
                          <span className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                            +{record.input.images.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-gray-400">
                      {expandedId === record.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* 展开内容 */}
                {expandedId === record.id && (
                  <div className="border-t border-gray-100 px-6 py-4 space-y-4">
                    {/* 图片 */}
                    {record.input.images && record.input.images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">📷 参考图片</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.input.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`图片${i + 1}`}
                              className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(img)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 描述 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">✏️ 描述</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm">
                        {record.input.description || '无描述'}
                      </div>
                    </div>

                    {/* 参数 */}
                    {record.input.options && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">⚙️ 参数</h4>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {record.input.options.duration}秒
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {record.input.options.aspectRatio}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {record.input.options.resolution}
                          </span>
                          {record.input.options.filterStyle && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                              {FILTER_STYLE_LABELS[record.input.options.filterStyle] || record.input.options.filterStyle}
                            </span>
                          )}
                          {record.input.options.storyStyle && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {STORY_STYLE_LABELS[record.input.options.storyStyle] || record.input.options.storyStyle}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 生成结果 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">📝 生成结果</h4>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                        {record.output.prompt || '无结果'}
                      </div>
                    </div>

                    {/* 复制按钮 */}
                    {record.output.prompt && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(record.output.prompt!);
                          alert('已复制到剪贴板');
                        }}
                        className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200 transition-colors"
                      >
                        📋 复制结果
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchRecords(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchRecords(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="预览"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
