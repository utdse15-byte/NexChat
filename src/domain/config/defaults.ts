import type { ConfigStoreState } from './types';

/**
 * 构建时通过 Vite 注入的默认后端地址。
 *
 * 优先级（从高到低）：
 * 1. 用户在设置面板里手动填写的 backendUrl（持久化在 IndexedDB）
 * 2. 构建时环境变量 VITE_DEFAULT_BACKEND_URL（通常配置在 Vercel）
 * 3. fallback 到同源 "/api"（适合本地开发 / 自托管前后端同域）
 *
 * 用例：
 * - 本地开发：不设置该变量，前端走 Vite proxy → localhost:8000
 * - Vercel 部署：设置为 Render 后端域名，例如
 *   "https://nexchat-backend.onrender.com/api"
 */
const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_DEFAULT_BACKEND_URL?.trim() || '/api';

/**
 * 是否在构建时显式指定了后端地址。
 * 如果指定了，就把 backendEnabled 默认设为 true，让用户开箱即用。
 */
const HAS_BUILTIN_BACKEND = Boolean(import.meta.env.VITE_DEFAULT_BACKEND_URL);

export const defaultConfig: ConfigStoreState = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  systemPrompt: '',
  maxContextRounds: 10,
  temperature: 1,
  maxTokens: 4096,
  maxContextTokens: 4000,
  firstByteTimeout: 60000,
  streamIdleTimeout: 60000,
  backendEnabled: HAS_BUILTIN_BACKEND,
  backendUrl: DEFAULT_BACKEND_URL,
};
