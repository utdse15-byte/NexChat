"""
Pydantic 数据模型（请求 / 响应）
"""

from pydantic import BaseModel, Field


# ── 会话 ─────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title: str = "新会话"


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: float
    updated_at: float
    message_count: int = 0


class SessionUpdate(BaseModel):
    title: str


# ── 消息 ─────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    status: str
    agent_type: str | None = None
    sources: str | None = None
    error: str | None = None
    created_at: float


from typing import Literal

# ── 聊天 ─────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=20000)

class ChatRequest(BaseModel):
    """前端发起聊天请求"""
    session_id: str | None = None
    messages: list[ChatMessage] = Field(default_factory=list, max_length=100)
    # model 可省略：留空时后端使用 .env 中 CHAT_MODEL 配置
    model: str | None = None
    temperature: float = Field(1.0, ge=0, le=2)
    max_tokens: int = Field(4096, ge=1, le=32768)
    stream: bool = True


# ── 知识库 ───────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    created_at: float


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(5, ge=1, le=20)


class KnowledgeSearchResult(BaseModel):
    content: str
    document_name: str
    relevance: float
    chunk_index: int = 0
