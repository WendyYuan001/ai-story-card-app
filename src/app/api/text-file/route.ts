import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, filename } = body;

    if (!content) {
      return NextResponse.json(
        { error: '缺少文件内容' },
        { status: 400 }
      );
    }

    // 验证内容大小（限制 10MB）
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (content.length > MAX_SIZE) {
      return NextResponse.json(
        { error: '文件过大，最大支持 10MB' },
        { status: 400 }
      );
    }

    // 简单的文本验证
    const isValidText = /^[\x20-\x7E\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF\s]*$/.test(content);
    if (!isValidText) {
      return NextResponse.json(
        { error: '文件包含不支持的字符' },
        { status: 400 }
      );
    }

    // 计算统计信息
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    const chars = content.length;
    const charsNoSpaces = content.replace(/\s/g, '').length;

    return NextResponse.json({
      success: true,
      data: {
        content,
        filename: filename || 'untitled.txt',
        stats: {
          lines,
          words,
          chars,
          charsNoSpaces
        }
      }
    });
  } catch (error) {
    console.error('文本文件处理失败:', error);
    return NextResponse.json(
      { error: '文本文件处理失败' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求获取示例
export async function GET() {
  return NextResponse.json({
    message: '文本文件上传 API',
    usage: {
      method: 'POST',
      body: {
        content: '文件内容（字符串）',
        filename: '文件名（可选）'
      },
      response: {
        success: true,
        data: {
          content: '文件内容',
          filename: '文件名',
          stats: {
            lines: '行数',
            words: '词数',
            chars: '字符数',
            charsNoSpaces: '不含空格字符数'
          }
        }
      }
    }
  });
}
