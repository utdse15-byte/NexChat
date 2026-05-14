"""
ChromaDB 向量存储
管理文档向量的增删查
"""

from langchain_chroma import Chroma
from langchain_core.documents import Document

from config import settings
from rag.embeddings import get_embeddings

# 集合名称
COLLECTION_NAME = "nexchat_knowledge"

# 全局单例
_vector_store: Chroma | None = None


def get_vector_store() -> Chroma:
    """获取 ChromaDB 向量存储实例（单例）"""
    global _vector_store
    if _vector_store is None:
        _vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=get_embeddings(),
            persist_directory=settings.chroma_persist_dir,
        )
    return _vector_store


def add_documents(documents: list[Document], doc_id: str) -> int:
    """
    将文档块添加到向量存储

    参数:
        documents: 分块后的 Document 列表
        doc_id: 文档 ID，用于后续按文档删除

    返回:
        成功添加的块数
    """
    store = get_vector_store()

    # 为每个块添加 doc_id 元数据，便于按文档删除
    for doc in documents:
        doc.metadata["doc_id"] = doc_id

    # 生成唯一 ID：doc_id + chunk_index
    ids = [f"{doc_id}_chunk_{doc.metadata.get('chunk_index', i)}" for i, doc in enumerate(documents)]

    store.add_documents(documents=documents, ids=ids)
    return len(documents)


def delete_by_doc_id(doc_id: str) -> None:
    """删除指定文档的所有向量"""
    store = get_vector_store()
    store.delete(where={"doc_id": doc_id})


def get_doc_count() -> int:
    """获取向量库中的文档块总数"""
    store = get_vector_store()
    return store._collection.count()
