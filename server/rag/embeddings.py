"""
向量化（Embeddings）
封装 OpenAI Embedding API，用于将文本转为向量
"""

from langchain_openai import OpenAIEmbeddings

from config import settings

# 全局单例，避免重复创建客户端
_embeddings: OpenAIEmbeddings | None = None


def get_embeddings() -> OpenAIEmbeddings:
    """获取 OpenAI Embeddings 实例（单例）

    注意: ``check_embedding_ctx_length=False`` 关键。
    LangChain 的 OpenAIEmbeddings 默认会在客户端做 token 化，
    把字符串预切成 ``list[int]`` 作为 input 传给 API。这条路径只
    有 OpenAI 官方 endpoint 才支持；包括 Gemini OpenAI 兼容层在内
    的多数第三方网关只接受 ``str`` / ``list[str]``，会返回 501
    "Operation is not implemented, or supported, or enabled."
    关掉这个预处理后，LangChain 会直接用原始字符串调用 API。
    """
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            check_embedding_ctx_length=False,
        )
    return _embeddings
