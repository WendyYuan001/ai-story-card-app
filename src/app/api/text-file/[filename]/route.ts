import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    let filename = decodeURIComponent(params.filename);

    // 获取请求体作为原始文本
    const content = await request.text();

    if (!content) {
      return NextResponse.json(
        { error: '文件内容为空' },
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

    // 计算统计信息
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    const charsNoSpaces = content.replace(/\s/g, '').length;

    // 生成查看链接
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://118.25.85.253';
    const viewUrl = `${baseUrl}/text-viewer?file=${encodeURIComponent(`/api/text-file/${filename}`)}&filename=${encodeURIComponent(filename)}`;

    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      viewUrl,
      data: {
        content,
        filename,
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

// 支持 GET 请求获取 API 说明
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  const filename = decodeURIComponent(params.filename);

  return NextResponse.json({
    message: '文本文件上传 API（支持 curl --data-binary）',
    usage: {
      method: 'POST',
      contentType: 'text/plain 或 application/octet-stream',
      curl_example: `curl -X POST --data-binary @${filename} http://118.25.85.253/api/text-file/${encodeURIComponent(filename)}`,
      response: {
        success: true,
        message: '文件上传成功',
        viewUrl: '查看文件的完整 URL',
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
