"""
文档加载器
支持 TXT、Markdown、PDF 三种格式的非结构化数据解析
"""

import os
from pathlib import Path

from langchain_core.documents import Document


def load_txt(file_path: str) -> list[Document]:
    """加载纯文本文件"""
    text = Path(file_path).read_text(encoding="utf-8")
    return [Document(page_content=text, metadata={"source": os.path.basename(file_path)})]


def load_markdown(file_path: str) -> list[Document]:
    """加载 Markdown 文件（按原文处理，保留格式）"""
    text = Path(file_path).read_text(encoding="utf-8")
    return [Document(page_content=text, metadata={"source": os.path.basename(file_path)})]


def load_pdf(file_path: str) -> list[Document]:
    """使用 PyMuPDF 加载 PDF 文件，按页拆分"""
    try:
        import pymupdf  # noqa: F401
    except ImportError:
        raise ImportError("请安装 pymupdf: pip install pymupdf")

    doc = pymupdf.open(file_path)
    documents = []
    for page_num, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            documents.append(Document(
                page_content=text,
                metadata={
                    "source": os.path.basename(file_path),
                    "page": page_num + 1,
                },
            ))
    doc.close()
    return documents


# 文件类型 → 加载函数 映射
_LOADERS = {
    ".txt": load_txt,
    ".md": load_markdown,
    ".markdown": load_markdown,
    ".pdf": load_pdf,
}

SUPPORTED_EXTENSIONS = set(_LOADERS.keys())


def load_document(file_path: str) -> list[Document]:
    """
    根据文件扩展名自动选择加载器
    返回 LangChain Document 列表
    """
    ext = Path(file_path).suffix.lower()
    loader = _LOADERS.get(ext)
    if loader is None:
        raise ValueError(f"不支持的文件类型: {ext}，支持: {', '.join(SUPPORTED_EXTENSIONS)}")
    return loader(file_path)
