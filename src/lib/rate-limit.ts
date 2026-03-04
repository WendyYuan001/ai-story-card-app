/**
 * API 限流工具
 */

// 用户任务锁 - 用于生成类接口（同时只能有一个任务）
const userTaskLocks = new Map<number, string>(); // userId -> taskId

// 用户请求计数 - 用于普通限流
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * 生成唯一任务 ID
 */
function generateTaskId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 尝试获取任务锁
 * @param userId 用户 ID
 * @returns 任务 ID（成功）或 null（已有任务运行）
 */
export function acquireTaskLock(userId: number): string | null {
  const existingTask = userTaskLocks.get(userId);
  
  if (existingTask) {
    // 检查是否超时（5分钟）
    const timestamp = parseInt(existingTask.split('_')[0]);
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      // 超时，释放锁
      userTaskLocks.delete(userId);
    } else {
      return null; // 已有任务运行
    }
  }
  
  const taskId = generateTaskId();
  userTaskLocks.set(userId, taskId);
  return taskId;
}

/**
 * 释放任务锁
 * @param userId 用户 ID
 * @param taskId 任务 ID（验证是否是同一个任务）
 */
export function releaseTaskLock(userId: number, taskId: string): void {
  const currentTask = userTaskLocks.get(userId);
  if (currentTask === taskId) {
    userTaskLocks.delete(userId);
  }
}

/**
 * 检查用户是否有任务在运行
 */
export function hasRunningTask(userId: number): boolean {
  const task = userTaskLocks.get(userId);
  if (!task) return false;
  
  // 检查是否超时
  const timestamp = parseInt(task.split('_')[0]);
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    userTaskLocks.delete(userId);
    return false;
  }
  
  return true;
}

/**
 * 滑动窗口限流
 * @param key 限流 key（如 "userId:apiName"）
 * @param maxCount 最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @returns true = 允许请求，false = 被限流
 */
export function checkRateLimit(
  key: string,
  maxCount: number = 1,
  windowMs: number = 1000
): { allowed: boolean; remainingMs: number } {
  const now = Date.now();
  const record = userRequestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    // 没有记录或已过窗口，重置计数
    userRequestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remainingMs: 0 };
  }
  
  if (record.count < maxCount) {
    // 未达到限制
    record.count++;
    return { allowed: true, remainingMs: 0 };
  }
  
  // 被限流
  return { allowed: false, remainingMs: record.resetTime - now };
}

/**
 * 清理过期记录（定期调用）
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  
  for (const [key, record] of userRequestCounts.entries()) {
    if (now > record.resetTime) {
      userRequestCounts.delete(key);
    }
  }
}

// 每 5 分钟清理一次过期记录
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
