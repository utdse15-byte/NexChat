/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 构建时注入的默认后端 API 地址（含 /api 前缀）。
   * 通常在 Vercel 项目环境变量中配置为 Render 后端 URL，
   * 例如 "https://nexchat-backend.onrender.com/api"。
   * 留空则前端默认走同源 "/api"（本地开发用）。
   */
  readonly VITE_DEFAULT_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
