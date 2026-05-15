# NexChat 部署指南

NexChat 推荐采用「**前端 Vercel + 后端 Render**」双平台部署。这种组合：

- **前端走 Vercel CDN**，全球加速、零配置
- **后端走 Render Docker**，长驻进程、文件系统可写、SSE 长连接稳定
- **完整功能保留**：聊天、RAG 知识库、多 Agent、SSE 流式都能跑

---

## 架构总览

```
┌────────────────┐   /api/*    ┌──────────────────┐
│  Vercel        │ ──────────► │  Render          │
│  React + Vite  │   CORS      │  FastAPI Docker  │
│  (静态托管)     │             │  + Chroma + SQLite│
└────────────────┘             └──────────────────┘
```

前端通过构建时环境变量 `VITE_DEFAULT_BACKEND_URL` 知道后端地址，CORS 在
后端 `.env` 的 `CORS_ORIGINS` 里把 Vercel 域名加白名单。

---

## 第 1 步：部署后端到 Render

### 1.1 准备

- 注册 [Render](https://render.com) 账号（免费）
- 把这个仓库 push 到 GitHub（已完成）

### 1.2 用 Blueprint 一键部署

1. 在 Render 控制台点击 **New** → **Blueprint**
2. 选择本仓库（`NexChat`）
3. Render 会自动读取根目录的 `render.yaml` 并创建一个名为
   `nexchat-backend` 的 Web Service

### 1.3 填环境变量

`render.yaml` 里两个变量需要在 Render UI 手动填（标记为 `sync: false`）：

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | 你的 Gemini / OpenAI Key |
| `CORS_ORIGINS` | `["https://你的-vercel-域名.vercel.app","http://localhost:5173"]` |

> 注意 `CORS_ORIGINS` 必须是合法 JSON 数组格式（用双引号）。本地开发地址
> 也建议保留，方便你前端在本地连远程后端做联调。

其他变量（`OPENAI_BASE_URL`、`CHAT_MODEL` 等）已在 `render.yaml` 写死默认
值，需要时再去 Render UI 改。

### 1.4 等待部署完成

Render 会拉取仓库、构建 Docker 镜像、启动容器。约 5 分钟后看到
`Live` 状态，URL 形如：

```
https://nexchat-backend.onrender.com
```

健康检查：

```bash
curl https://nexchat-backend.onrender.com/api/health
# {"status":"ok","service":"NexChat API"}
```

### 关于 Render 免费档限制

| 限制 | 影响 |
|------|------|
| 15 分钟无活动 spin down | 唤醒约需 1 分钟，简历演示可接受 |
| 无持久化磁盘 | SQLite / ChromaDB 数据写在 `/tmp`，redeploy 会丢 |
| 750h / 月 | 一个 free service 不睡满全月够用 |

如果你要让数据持久化，把 Render Web Service 升级到 Starter（$7/月），加
一块 Persistent Disk 挂到 `/app/data`，并把上面三个路径改回 `./data/...`。

---

## 第 2 步：部署前端到 Vercel

### 2.1 导入项目

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择本仓库（`NexChat`）
3. **Framework Preset** 应自动识别为 **Vite**
4. **Root Directory** 保持默认（仓库根）
5. 暂时不要点 Deploy，先去填环境变量

### 2.2 填环境变量

在 **Environment Variables** 区域添加：

| Key | Value | 说明 |
|-----|-------|------|
| `VITE_DEFAULT_BACKEND_URL` | `https://nexchat-backend.onrender.com/api` | 第 1 步得到的 Render URL，**末尾加 `/api`** |

> 这个变量是**构建时注入**的，意味着改它必须 redeploy 才生效。

### 2.3 部署

点击 **Deploy**。Vercel 会跑 `npm run build`，把 `dist/` 部署到 CDN。

约 1-2 分钟后获得前端 URL：

```
https://your-app.vercel.app
```

### 2.4 回到 Render 完善 CORS

把 Vercel 域名加到 Render 的 `CORS_ORIGINS` 环境变量里：

```json
["https://your-app.vercel.app","http://localhost:5173"]
```

保存后 Render 会自动重启服务（约 1 分钟）。

---

## 第 3 步：验证

1. 打开 `https://your-app.vercel.app`
2. **不需要进设置面板**——前端默认已经开启后端模式且指向 Render
3. 直接发"你好"，看流式输出
4. 上传一份小 TXT，问"根据文档..."，验证 RAG 链路

如果出错：
- 浏览器 DevTools Network 看 `/api/chat/stream` 状态
- Render 控制台 → Logs 看后端输出
- 90% 的问题是 **CORS 没配 / Vercel URL 拼错 / 后端冷启动还没起来**

---

## 本地开发

### 后端

```bash
cd server
cp .env.example .env       # 编辑 .env 填入 OPENAI_API_KEY
pip install -r requirements.txt
python main.py             # 默认 http://localhost:8000
```

### 前端

```bash
npm install
npm run dev                # 默认 http://localhost:5173
```

本地不需要设置 `VITE_DEFAULT_BACKEND_URL`——前端默认走 `/api`，Vite 把
请求代理到 `localhost:8000`（在 `vite.config.ts` 里）。

### 用本地前端连远程后端做联调

把本地 `.env.local`（项目根目录，新建）写成：

```env
VITE_DEFAULT_BACKEND_URL=https://nexchat-backend.onrender.com/api
```

然后 `npm run dev`，浏览器打开 `http://localhost:5173` 就能直连远程
Render 后端。注意远程后端的 `CORS_ORIGINS` 要包含 `http://localhost:5173`。

---

## Docker 一键部署（自托管 / 服务器）

如果你有自己的 VPS：

```bash
cp server/.env.example server/.env  # 填 API Key
docker-compose up --build -d
# 前端：http://your-server:3000
# 后端：http://your-server:8000
```

这种部署下数据是持久化的（容器卷 `nexchat_data`）。

---

## 简历项目演示建议

1. **首次访问**：Render 后端在睡眠中，第一次请求会卡 30-60 秒。建议演示
   前先点一次 health check 把后端唤醒：
   ```
   https://nexchat-backend.onrender.com/api/health
   ```
2. **Demo 文案**：跟面试官说明 RAG 数据是 ephemeral 的（免费档限制），
   重启后会丢——这本身可以引出"如果上生产怎么改"的话题：
   - SQLite → Neon/Supabase Postgres
   - ChromaDB → Pinecone / Qdrant Cloud / pgvector
   - Upload → S3 / Vercel Blob / R2

3. **简历描述参考**：
   > NexChat：全栈 AI 聊天应用，前端 React 19 + Vite 部署在 Vercel CDN，
   > 后端 FastAPI + LangChain 部署在 Render Docker。实现 SSE 流式输出、
   > 多 Agent 路由（chat / RAG / summary）、ChromaDB 向量检索，前后端
   > 通过 CORS 跨域协作，覆盖 10 项流式协议链路问题修复与 PBT 测试。

---

## 常见问题

**Q: Vercel 部署后页面打开是空白？**
A: 前端 SPA 路由需要 fallback 到 `index.html`。检查 `vercel.json` 里
有 `rewrites` 配置（已包含）。

**Q: 后端响应慢？**
A: Render 免费档冷启动确实慢。生产环境用 Starter plan 不会 spin down。

**Q: CORS 错误？**
A: Render 后端 `CORS_ORIGINS` 必须包含**完整的 Vercel 域名**（包括
`https://` 前缀），且是合法 JSON 数组。改完要等 Render 重启完成。

**Q: 上传文件 4.5MB 限制？**
A: 那是 Vercel 函数限制，不影响这套架构（前端在 Vercel 但上传请求是
直发到 Render 后端的，Render 没这个限制，受 `MAX_UPLOAD_SIZE` 控制，
默认 10MB）。
