"""
Chat Agent — 普通对话
直接将消息转发给 LLM，支持流式输出
"""

from collections.abc import AsyncGenerator
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import settings


async def stream_chat(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 1.0,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """
    普通聊天流式生成

    参数:
        messages: OpenAI 格式的消息列表 [{"role": "user", "content": "..."}]
        model: 模型名称（默认使用配置中的模型）
        temperature: 温度参数
        max_tokens: 最大 token 数

    Yields:
        逐块文本内容（delta）
    """
    llm = ChatOpenAI(
        model=model or settings.chat_model,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=True,
    )

    lc_messages = _convert_messages(messages)

    async for chunk in llm.astream(lc_messages):
        if chunk.content:
            text = chunk.content if isinstance(chunk.content, str) else ""
            if text:
                yield text


def _convert_messages(messages: list[dict]):
    """将 OpenAI 格式消息转为 LangChain 消息对象"""
    lc_messages = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))
    return lc_messages
