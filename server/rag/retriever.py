"""
检索器
实现语义检索策略，返回与查询最相关的文档片段
"""

from dataclasses import dataclass

from config import settings
from rag.vector_store import get_vector_store


@dataclass
class RetrievalResult:
    """检索结果"""
    content: str
    document_name: str
    relevance: float
    chunk_index: int


def semantic_search(query: str, top_k: int | None = None) -> list[RetrievalResult]:
    """
    语义检索：根据查询文本，返回最相关的文档片段

    参数:
        query: 用户查询文本
        top_k: 返回的最大结果数

    返回:
        RetrievalResult 列表，按相关性降序排列
    """
    k = top_k or settings.retrieval_top_k
    store = get_vector_store()

    # similarity_search_with_relevance_scores 返回 (Document, score) 元组
    # score 越高表示越相关
    try:
        results = store.similarity_search_with_relevance_scores(query, k=k)
    except Exception as e:
        print(f"[RAG] semantic_search failed: {e}")
        raise

    return [
        RetrievalResult(
            content=doc.page_content,
            document_name=doc.metadata.get("source", "未知文档"),
            relevance=round(score, 4),
            chunk_index=doc.metadata.get("chunk_index", 0),
        )
        for doc, score in results
        if score > 0.3  # 过滤掉相关性过低的结果
    ]


def build_rag_context(results: list[RetrievalResult]) -> str:
    """
    将检索结果格式化为可注入 prompt 的上下文文本

    返回:
        格式化的上下文字符串
    """
    if not results:
        return ""

    context_parts = []
    for i, r in enumerate(results, 1):
        context_parts.append(
            f"[参考{i}] 来源: {r.document_name} (相关度: {r.relevance})\n{r.content}"
        )
    return "\n\n---\n\n".join(context_parts)
