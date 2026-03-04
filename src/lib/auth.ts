import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const POINTS_COST = {
  GENERATE_STORY: 10,
  GENERATE_VIDEO_PROMPT: 5,
  GENERATE_VIDEO_PROMPT_V2: 10,
  GENERATE_CARD: 5,
};

export interface AuthUser {
  userId: number;
  username: string;
  points: number;
}

/**
 * Extract session token from request
 * Supports:
 * - Authorization: Bearer <token> header
 * - Cookie: session_token=<token>
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  let token: string | null = null;

  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Try cookie
  if (!token) {
    token = request.cookies.get('session_token')?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    const result = await pool.query(
      'SELECT id, username, points FROM users WHERE session_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      userId: user.id,
      username: user.username,
      points: user.points
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Deduct points from user account
 */
export async function deductPoints(userId: number, amount: number, reason: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT points FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || result.rows[0].points < amount) {
      return false;
    }

    await pool.query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [amount, userId]
    );

    await pool.query(
      'INSERT INTO point_logs (user_id, points_change, reason) VALUES ($1, $2, $3)',
      [userId, -amount, reason]
    );

    return true;
  } catch (error) {
    console.error('Deduct points error:', error);
    return false;
  }
}

/**
 * Register a new user
 */
export async function registerUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser; sessionToken?: string }> {
  try {
    // Check if username exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return { success: false, error: '用户名已存在' };
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const passwordWithSalt = `${salt}:${passwordHash}`;

    // Generate session token
    const sessionToken = generateSessionToken();

    // Create user with 1000 points
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, points, session_token) VALUES ($1, $2, $3, $4) RETURNING id, username, points',
      [username, passwordWithSalt, 1000, sessionToken]
    );

    const user = result.rows[0];

    // Log login
    await pool.query(
      'INSERT INTO login_logs (user_id, login_date) VALUES ($1, CURRENT_DATE)',
      [user.id]
    );

    return {
      success: true,
      user: {
        userId: user.id,
        username: user.username,
        points: user.points
      },
      sessionToken
    };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: '注册失败' };
  }
}

/**
 * Login user
 */
export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser; sessionToken?: string }> {
  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, points FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return { success: false, error: '用户名或密码错误' };
    }

    const user = result.rows[0];
    const [salt, passwordHash] = user.password_hash.split(':');

    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (hash !== passwordHash) {
      return { success: false, error: '用户名或密码错误' };
    }

    // Generate new session token
    const sessionToken = generateSessionToken();

    await pool.query(
      'UPDATE users SET session_token = $1, last_login_date = CURRENT_DATE WHERE id = $2',
      [sessionToken, user.id]
    );

    // Log login
    await pool.query(
      'INSERT INTO login_logs (user_id, login_date) VALUES ($1, CURRENT_DATE)',
      [user.id]
    );

    return {
      success: true,
      user: {
        userId: user.id,
        username: user.username,
        points: user.points
      },
      sessionToken
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '登录失败' };
  }
}

/**
 * Logout user
 */
export async function logoutUser(token: string): Promise<boolean> {
  try {
    await pool.query(
      'UPDATE users SET session_token = NULL WHERE session_token = $1',
      [token]
    );
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
