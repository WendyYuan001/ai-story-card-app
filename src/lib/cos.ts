import COS from 'cos-nodejs-sdk-v5';

// COS 配置
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || '',
  SecretKey: process.env.COS_SECRET_KEY || '',
});

const BUCKET = process.env.COS_BUCKET || 'ai-story-1390808555';
const REGION = process.env.COS_REGION || 'ap-shanghai';

/**
 * 上传图片到 COS
 * @param base64Data base64 编码的图片数据
 * @param filename 文件名（不含路径）
 * @returns COS 文件 URL
 */
export async function uploadImage(base64Data: string, filename: string): Promise<string> {
  // 移除 base64 前缀
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64String, 'base64');

  // 生成文件路径: images/用户ID/日期/文件名
  const date = new Date();
  const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  const key = `images/${datePath}/${filename}`;

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
      },
      (err, data) => {
        if (err) {
          console.error('COS upload error:', err);
          reject(err);
        } else {
          // 返回访问 URL
          const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;
          resolve(url);
        }
      }
    );
  });
}

/**
 * 批量上传图片
 * @param images base64 图片数组
 * @param prefix 文件名前缀（如用户ID）
 * @returns URL 数组
 */
export async function uploadImages(images: string[], prefix: string): Promise<string[]> {
  const urls: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < images.length; i++) {
    const filename = `${prefix}_${timestamp}_${i}.jpg`;
    try {
      const url = await uploadImage(images[i], filename);
      urls.push(url);
    } catch (e) {
      console.error(`上传图片 ${i} 失败:`, e);
      urls.push(''); // 失败时返回空字符串
    }
  }

  return urls;
}

/**
 * 删除 COS 上的图片
 * @param key 文件路径
 */
export async function deleteImage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cos.deleteObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export default cos;
