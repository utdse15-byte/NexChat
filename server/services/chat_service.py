"""
聊天服务层
编排 Router Agent → 专业 Agent 的完整聊天流程
"""

import json
import time
import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.orm import Session

from database.models import SessionModel, MessageModel
from agents.router import classify_intent
from agents.chat_agent import stream_chat
from agents.rag_agent import stream_rag
from agents.summary_agent import stream_summary


def _wrap_delta(content: str) -> dict:
    """构造一个 OpenAI 兼容的流式增量事件字典"""
    return {
        "data": json.dumps({
            "choices": [{"delta": {"content": content}, "finish_reason": None}],
        }),
    }


async def handle_chat_stream(
    db: Session,
    session_id: str | None,
    messages: list[dict],
    model: str | None = None,
    temperature: float = 1.0,
    max_tokens: int = 4096,
) -> AsyncGenerator[dict, None]:
    """
    处理聊天请求的完整流程：
    1. 创建 / 获取会话
    2. Router Agent 意图分类
    3. 分发到对应 Agent
    4. 流式返回结果
    5. 保存消息到数据库

    Yields:
        SSE 事件字典，与 OpenAI streaming API 兼容：
        - {"event": "metadata", "data": {...}}  → Agent 元信息
        - {"event": "sources",  "data": [...]}  → RAG 引用来源
        - {"data": {"choices": [...]}}          → 文本增量
        - {"data": "[DONE]"}                    → 结束标记
    """
    # ── 1. 确保会话存在 ─────────────────────────────────
    session: SessionModel | None = None
    if session_id:
        session = (
            db.query(SessionModel).filter(SessionModel.id == session_id).first()
        )

    if session is None:
        # 如果前端传了 session_id 就沿用（保持前后端会话主键一致），
        # 否则在服务端生成一个新的。
        if not session_id:
            session_id = str(uuid.uuid4())
        now = time.time()
        session = SessionModel(
            id=session_id, title="新会话", created_at=now, updated_at=now
        )
        db.add(session)
        db.commit()

    # 提取用户最新消息
    user_content = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_content = msg.get("content", "")
            break

    # 保存用户消息
    user_msg = MessageModel(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=user_content,
        status="done",
        created_at=time.time(),
    )
    db.add(user_msg)

    # 自动更新会话标题（首条消息）
    msg_count = (
        db.query(MessageModel).filter(MessageModel.session_id == session_id).count()
    )
    if msg_count <= 1 and user_content:
        session.title = user_content[:30] + ("..." if len(user_content) > 30 else "")
    session.updated_at = time.time()
    db.commit()

    # 路由分类前先发一个早期 metadata，仅携带 session_id。
    # 目的：避免在 Router LLM 慢/卡时，前端 firstByteTimeout 被错误触发。
    # 前端 onMetadata 会清掉 firstByteTimer 并切换到 idleTimer。
    yield {
        "event": "metadata",
        "data": json.dumps({"session_id": session_id}),
    }

    # ── 2. Router Agent 分类意图 ───────────────────────
    agent_type = await classify_intent(user_content)

    yield {
        "event": "metadata",
        "data": json.dumps({
            "agent_type": agent_type,
            "session_id": session_id,
        }),
    }

    # ── 3. 分发并流式生成 ──────────────────────────────
    full_content = ""
    sources_data: list[dict] | None = None
    persisted = False  # 标记 assistant 消息是否已落库（避免在 finally 中重复保存）

    def _persist_assistant(status: str, error_payload: dict | None = None) -> None:
        """将 assistant 消息落库；status="done" / "error" / "aborted"。
        通过外层 nonlocal 标志保证幂等。"""
        nonlocal persisted
        if persisted:
            return
        ai_msg = MessageModel(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=full_content,
            status=status,
            agent_type=agent_type,
            sources=(
                json.dumps(sources_data, ensure_ascii=False)
                if sources_data
                else None
            ),
            error=(
                json.dumps(error_payload, ensure_ascii=False)
                if error_payload
                else None
            ),
            created_at=time.time(),
        )
        db.add(ai_msg)
        session.updated_at = time.time()
        try:
            db.commit()
            persisted = True
        except Exception:
            # 回滚后保持 persisted=False，让上层能感知失败
            db.rollback()
            raise

    try:
        if agent_type == "rag":
            gen = stream_rag(
                messages, model=model, temperature=temperature, max_tokens=max_tokens
            )
            sources_yielded = False
            async for chunk in gen:
                # RAG agent 第一个 yield 一定是 list（sources），后续是 str（文本块）
                if not sources_yielded and isinstance(chunk, list):
                    sources_data = chunk
                    sources_yielded = True
                    yield {
                        "event": "sources",
                        "data": json.dumps(chunk, ensure_ascii=False),
                    }
                    continue
                if not isinstance(chunk, str):
                    continue
                full_content += chunk
                yield _wrap_delta(chunk)

        elif agent_type == "summary":
            async for chunk in stream_summary(messages, model=model, max_tokens=max_tokens):
                full_content += chunk
                yield _wrap_delta(chunk)

        else:  # chat
            async for chunk in stream_chat(
                messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            ):
                full_content += chunk
                yield _wrap_delta(chunk)

        # 终止标记
        yield {
            "data": json.dumps({
                "choices": [{"delta": {}, "finish_reason": "stop"}],
            }),
        }

        # ── 4. 先保存 assistant 消息再发 [DONE] ─────────
        # 若放在 [DONE] 之后，客户端断连可能导致生成器后续代码不执行，
        # 进而丢失持久化（即便 finally 兜底也会让前后端状态短暂不一致）。
        _persist_assistant(status="done")

        yield {"data": "[DONE]"}

    except Exception as e:
        # 发生错误时持久化部分内容（若仍有未提交内容）
        try:
            _persist_assistant(
                status="error",
                error_payload={"type": "server_error", "message": str(e)},
            )
        except Exception:
            # 兜底持久化失败不影响异常向上抛出
            pass
        raise

    finally:
        # 客户端提前断开时 ASGI 会向生成器抛 GeneratorExit/CancelledError，
        # 此时正常 except 不会进入；用 finally 保证已生成内容仍被保存。
        if not persisted and full_content:
            try:
                _persist_assistant(status="aborted")
            except Exception:
                pass
