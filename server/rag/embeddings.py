"""
向量化（Embeddings）
封装 OpenAI Embedding API，用于将文本转为向量
"""

from langchain_openai import OpenAIEmbeddings

from config import settings

# 全局单例，避免重复创建客户端
_embeddings: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    """获取 OpenAI Embeddings 实例（单例）"""
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
    return _embeddings
