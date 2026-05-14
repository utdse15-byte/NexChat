"""
NexChat 后端服务入口
FastAPI 应用：聊天代理 + RAG 知识库 + 多 Agent 编排
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.connection import init_db
from routers import chat, knowledge, sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理：启动时初始化数据库"""
    init_db()
    print("✅ 数据库已初始化")
    print(f"📂 ChromaDB 存储: {settings.chroma_persist_dir}")
    print(f"📂 文件上传目录: {settings.upload_dir}")
    yield


app = FastAPI(
    title="NexChat API",
    description="NexChat 后端服务 — 聊天代理 + RAG 知识库 + 多 Agent 编排",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat.router)
app.include_router(knowledge.router)
app.include_router(sessions.router)


@app.get("/api/health")
def health_check():
    """健康检查"""
    return {"status": "ok", "service": "NexChat API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
