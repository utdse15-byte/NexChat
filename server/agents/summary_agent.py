"""
Summary Agent — 对话总结
提取当前会话的关键信息，生成结构化总结
"""

from collections.abc import AsyncGenerator
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from config import settings

SUMMARY_SYSTEM_PROMPT = """你是一个对话总结助手。请对以下对话内容进行总结。

要求：
1. 提取对话的核心主题和关键信息
2. 按时间或逻辑顺序组织
3. 使用简洁的要点格式
4. 如果有未解决的问题，在最后列出"""


async def stream_summary(
    messages: list[dict],
    model: str | None = None,
    max_tokens: int = 2048,
) -> AsyncGenerator[str, None]:
    """
    流式生成对话总结

    参数:
        messages: 完整的对话消息列表

    Yields:
        逐块总结文本
    """
    # 将对话历史格式化为文本
    conversation_text = _format_conversation(messages)

    if not conversation_text.strip():
        yield "当前没有可以总结的对话内容。"
        return

    llm = ChatOpenAI(
        model=model or settings.chat_model,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        temperature=0.3,
        max_tokens=max_tokens,
        streaming=True,
    )

    lc_messages = [
        SystemMessage(content=SUMMARY_SYSTEM_PROMPT),
        HumanMessage(content=f"请总结以下对话：\n\n{conversation_text}"),
    ]

    async for chunk in llm.astream(lc_messages):
        if chunk.content:
            text = chunk.content if isinstance(chunk.content, str) else ""
            if text:
                yield text


def _format_conversation(messages: list[dict]) -> str:
    """将消息列表格式化为可读文本"""
    parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            continue
        label = "用户" if role == "user" else "助手"
        parts.append(f"{label}: {content}")
    return "\n\n".join(parts)
