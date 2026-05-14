"""
知识库路由
文档上传、列表、删除、搜索
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.schemas import DocumentOut, KnowledgeSearchRequest, KnowledgeSearchResult
from services.knowledge_service import upload_document, list_documents, delete_document
from rag.retriever import semantic_search
from config import settings

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.post("/upload", response_model=DocumentOut)
async def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """上传文档到知识库"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"文件大小超过限制 ({settings.max_upload_size // 1024 // 1024}MB)",
        )

    try:
        doc = upload_document(db, file.filename, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档处理失败: {str(e)}")

    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        chunk_count=doc.chunk_count,
        status=doc.status,
        created_at=doc.created_at,
    )


@router.get("/documents", response_model=list[DocumentOut])
def get_documents(db: Session = Depends(get_db)):
    """获取已上传的文档列表"""
    docs = list_documents(db)
    return [
        DocumentOut(
            id=d.id,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            chunk_count=d.chunk_count,
            status=d.status,
            created_at=d.created_at,
        )
        for d in docs
    ]


@router.delete("/documents/{doc_id}")
def remove_document(doc_id: str, db: Session = Depends(get_db)):
    """删除指定文档（同时清理向量和文件）"""
    success = delete_document(db, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档不存在")
    return {"message": "删除成功"}


@router.post("/search", response_model=list[KnowledgeSearchResult])
def search_knowledge(request: KnowledgeSearchRequest):
    """语义搜索知识库"""
    results = semantic_search(request.query, top_k=request.top_k)
    return [
        KnowledgeSearchResult(
            content=r.content,
            document_name=r.document_name,
            relevance=r.relevance,
            chunk_index=r.chunk_index,
        )
        for r in results
    ]
