"""
文本分块策略
使用 LangChain RecursiveCharacterTextSplitter 实现智能分块
"""

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings


def split_documents(
    documents: list[Document],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Document]:
    """
    将文档列表拆分为更小的文本块

    参数:
        documents: LangChain Document 列表
        chunk_size: 每个块的最大字符数（默认从配置读取）
        chunk_overlap: 块之间的重叠字符数（默认从配置读取）

    返回:
        拆分后的 Document 列表，每个 Document 的 metadata
        会继承原始文档的 metadata 并附加 chunk_index
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size or settings.chunk_size,
        chunk_overlap=chunk_overlap or settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""],
    )

    chunks = splitter.split_documents(documents)

    # 为每个块添加 chunk_index 元数据
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx

    return chunks
