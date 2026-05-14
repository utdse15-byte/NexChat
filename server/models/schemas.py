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


# ── 聊天 ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """前端发起聊天请求"""
    session_id: str | None = None
    messages: list[dict] = Field(default_factory=list)
    model: str = ""
    temperature: float = 1.0
    max_tokens: int = 4096
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
    query: str
    top_k: int = 5


class KnowledgeSearchResult(BaseModel):
    content: str
    document_name: str
    relevance: float
    chunk_index: int = 0
