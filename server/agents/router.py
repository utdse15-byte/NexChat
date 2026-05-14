"""
Router Agent — 意图识别
通过一次轻量级 LLM 调用，判断用户消息应由哪个专业 Agent 处理
"""

import json
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from config import settings
from rag.vector_store import get_doc_count

ROUTER_SYSTEM_PROMPT = """你是一个意图分类器。根据用户的消息，判断应该由哪个 Agent 处理。

可选类别：
- "chat"：普通闲聊、问候、不需要特定知识的通用问题
- "rag"：需要查询知识库或特定文档内容的问题（仅当知识库非空时可用）
- "summary"：用户明确要求总结当前对话内容

规则：
1. 如果知识库为空（文档数为 0），永远不要选 "rag"
2. 如果用户明确提到"总结""归纳""小结"等关键词，选 "summary"
3. 其余情况选 "chat"
4. 当用户询问的内容可能与上传的文档相关时，选 "rag"

当前知识库文档块数量：{doc_count}

请仅返回一个 JSON 对象：{{"agent": "chat"}} 或 {{"agent": "rag"}} 或 {{"agent": "summary"}}
不要返回任何其他内容。"""

_VALID_AGENTS = ("chat", "rag", "summary")
_SUMMARY_KEYWORDS = ("总结", "归纳", "小结", "summarize", "summary")
# RAG 关键词：用户提到这些词时通常意味着想查询知识库
_RAG_KEYWORDS = (
    "文档", "资料", "知识库", "上传", "这篇", "本文", "全文",
    "pdf", "PDF", "根据文件", "根据文档", "根据资料",
)


def _content_to_text(content: object) -> str:
    """
    LangChain v0.3+ 的 ChatMessage.content 可能是 str 或 list[dict|str]。
    统一抽取为纯文本，避免 .strip() 在 list 上崩溃。
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                text = block.get("text") or block.get("content")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return str(content)


def _keyword_fallback(message: str, doc_count: int = 0) -> str:
    """
    无 LLM 时的关键词兜底分类。

    - summary 关键词命中 → "summary"
    - 知识库非空且 RAG 关键词命中 → "rag"
    - 其他情况 → "chat"
    """
    lower = message.lower()
    if any(kw in lower for kw in _SUMMARY_KEYWORDS):
        return "summary"
    if doc_count > 0 and any(kw.lower() in lower for kw in _RAG_KEYWORDS):
        return "rag"
    return "chat"


async def classify_intent(user_message: str) -> str:
    """
    分类用户意图，返回 agent 类型字符串。
    返回值: "chat" | "rag" | "summary"
    """
    doc_count = 0
    try:
        doc_count = get_doc_count()
    except Exception:
        pass

    # 知识库为空时跳过 LLM 调用
    if doc_count == 0:
        return _keyword_fallback(user_message, doc_count)

    # 没有 API Key 也无法调用 LLM
    if not settings.openai_api_key:
        return _keyword_fallback(user_message, doc_count)

    try:
        llm = ChatOpenAI(
            model=settings.chat_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            temperature=0,
            max_tokens=50,
        )

        messages = [
            SystemMessage(content=ROUTER_SYSTEM_PROMPT.format(doc_count=doc_count)),
            HumanMessage(content=user_message),
        ]

        response = await llm.ainvoke(messages)
        text = _content_to_text(response.content).strip()

        # 模型可能返回带前后缀的内容；用正则提取首个 JSON 对象
        match = re.search(r"\{[^{}]*\}", text)
        if match:
            text = match.group(0)

        result = json.loads(text)
        agent_type = result.get("agent", "chat")

        if agent_type in _VALID_AGENTS:
            return agent_type
    except Exception:
        pass

    return _keyword_fallback(user_message, doc_count)
