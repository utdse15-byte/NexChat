"""
聊天路由
提供 SSE 流式聊天 API，输出格式兼容 OpenAI Chat Completions Streaming
"""

import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import ChatRequest
from services.chat_service import handle_chat_stream

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _format_sse(event: dict) -> str:
    """将事件字典格式化为合法的 SSE 帧（含 event/data 字段，结尾双换行）"""
    if "event" in event:
        return f"event: {event['event']}\ndata: {event['data']}\n\n"
    return f"data: {event['data']}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    """
    SSE 流式聊天接口

    请求体与 OpenAI Chat Completions API 兼容，额外支持 session_id 字段。
    响应为 SSE 流，包含以下事件类型：
    - event:metadata  → Agent 路由信息
    - event:sources   → RAG 引用来源（仅 RAG Agent）
    - data:           → OpenAI 格式的文本增量
    - data:[DONE]     → 流结束
    """

    async def event_generator():
        try:
            # 前端可能传 None / "" / 纯空白；任意一种都视为不指定，
            # 让后端 agent 走 settings.chat_model（即 .env 配置）
            requested_model = (request.model or "").strip() or None

            async for event in handle_chat_stream(
                db=db,
                session_id=request.session_id,
                messages=request.messages,
                model=requested_model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            ):
                yield _format_sse(event)
        except Exception as e:
            error_payload = {
                "error": {"message": str(e), "type": "server_error"}
            }
            yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
