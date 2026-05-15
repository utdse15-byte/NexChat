"""
知识库服务层
处理文档上传、解析、向量化的完整流程
"""

import os
import time
import uuid

from sqlalchemy.orm import Session

from config import settings
from database.models import DocumentModel
from rag.document_loader import load_document, SUPPORTED_EXTENSIONS
from rag.text_splitter import split_documents
from rag.vector_store import add_documents, delete_by_doc_id


from pathlib import Path

def upload_document(db: Session, filename: str, file_content: bytes) -> DocumentModel:
    """
    处理文档上传的完整流程：
    1. 保存文件到磁盘
    2. 解析文档内容
    3. 文本分块
    4. 向量化并存入 ChromaDB
    5. 记录到 SQLite

    参数:
        db: 数据库会话
        filename: 原始文件名
        file_content: 文件二进制内容

    返回:
        DocumentModel 记录
    """
    safe_name = Path(filename).name
    if not safe_name:
        raise ValueError("文件名非法")

    # 检查文件类型
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"不支持的文件类型: {ext}，支持: {', '.join(SUPPORTED_EXTENSIONS)}")

    doc_id = str(uuid.uuid4())
    file_type = ext.lstrip(".")

    # 保存文件到磁盘
    save_path = os.path.join(settings.upload_dir, f"{doc_id}_{safe_name}")
    with open(save_path, "wb") as f:
        f.write(file_content)

    # 创建数据库记录（初始状态: processing）
    doc_record = DocumentModel(
        id=doc_id,
        filename=safe_name,
        file_type=file_type,
        file_size=len(file_content),
        chunk_count=0,
        status="processing",
        created_at=time.time(),
    )
    db.add(doc_record)
    db.commit()

    try:
        # 解析文档
        documents = load_document(save_path)
        if not documents:
            raise ValueError("未从文档中提取到文本，可能为扫描版或空文件")

        # 文本分块
        chunks = split_documents(documents)
        if not chunks:
            raise ValueError("文档内容为空，无法建立索引")

        # 向量化并存入 ChromaDB
        chunk_count = add_documents(chunks, doc_id)

        # 更新数据库记录
        doc_record.chunk_count = chunk_count
        doc_record.status = "ready"
        db.commit()

    except Exception as e:
        doc_record.status = "error"
        db.commit()
        # 失败时尝试清理磁盘文件
        try:
            if os.path.exists(save_path):
                os.remove(save_path)
        except Exception:
            pass
        raise e

    return doc_record


def list_documents(db: Session) -> list[DocumentModel]:
    """获取所有文档列表"""
    return db.query(DocumentModel).order_by(DocumentModel.created_at.desc()).all()


def delete_document(db: Session, doc_id: str) -> bool:
    """
    删除文档：同时删除 SQLite 记录、ChromaDB 向量、磁盘文件
    """
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        return False

    # 删除向量
    try:
        delete_by_doc_id(doc_id)
    except Exception as e:
        raise RuntimeError(f"删除向量失败，已取消删除数据库记录: {e}")

    # 删除磁盘文件
    try:
        file_pattern = f"{doc_id}_"
        for f in os.listdir(settings.upload_dir):
            if f.startswith(file_pattern):
                os.remove(os.path.join(settings.upload_dir, f))
    except Exception as e:
        print(f"Warning: Failed to delete file for doc_id {doc_id}: {e}")

    # 删除数据库记录
    db.delete(doc)
    db.commit()
    return True
