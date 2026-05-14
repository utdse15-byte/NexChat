"""
RAG Agent — 知识库问答
检索向量库 → 构造增强 prompt → 流式生成回答
"""

from collections.abc import AsyncGenerator
from dataclasses import asdict

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import settings
from rag.retriever import semantic_search, build_rag_context, RetrievalResult

RAG_SYSTEM_PROMPT = """你是一个基于知识库的问答助手。请根据以下参考资料回答用户的问题。

规则：
1. 优先使用参考资料中的内容来回答
2. 如果参考资料中没有相关信息，可以使用你的通用知识，但需要说明
3. 回答时引用参考资料的来源编号，如 [参考1]
4. 保持回答准确、简洁

参考资料：
{context}"""


async def stream_rag(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    top_k: int | None = None,
) -> AsyncGenerator[str | list[dict], None]:
    """
    RAG 流式生成

    首先 yield 一个 sources 列表（list[dict]），然后 yield 文本块（str）

    参数:
        messages: OpenAI 格式消息列表
        model: 模型名称
        temperature: 温度
        max_tokens: 最大 token 数
        top_k: 检索结果数量
    """
    # 1. 提取用户最新问题
    user_query = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_query = msg.get("content", "")
            break

    if not user_query:
        yield "请提供一个问题。"
        return

    # 2. 语义检索
    results: list[RetrievalResult] = semantic_search(user_query, top_k=top_k)

    # 先 yield sources 元数据（list[dict] 类型，前端用于展示引用来源）
    sources_data = [asdict(r) for r in results]
    yield sources_data  # type: ignore

    # 3. 构造 RAG prompt
    context_text = build_rag_context(results)

    if not context_text:
        # 没有检索到相关内容，降级为普通聊天
        context_text = "（知识库中未找到与问题直接相关的内容）"

    # 4. 构造消息列表：RAG system prompt + 历史对话 + 当前问题
    rag_system = RAG_SYSTEM_PROMPT.format(context=context_text)

    lc_messages = [SystemMessage(content=rag_system)]
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "assistant":
            lc_messages.append(AIMessage(content=content))
        elif role == "user":
            lc_messages.append(HumanMessage(content=content))
        # 跳过前端传来的 system prompt，使用 RAG 自己的

    # 5. 流式生成
    llm = ChatOpenAI(
        model=model or settings.chat_model,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=True,
    )

    async for chunk in llm.astream(lc_messages):
        if chunk.content:
            text = chunk.content if isinstance(chunk.content, str) else ""
            if text:
                yield text
