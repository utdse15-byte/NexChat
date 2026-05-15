"""
NexChat 后端配置管理
使用 pydantic-settings 从环境变量 / .env 文件加载配置
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置，所有字段都可通过同名环境变量覆盖"""

    # ── LLM ──────────────────────────────────────────────
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    chat_model: str = "gpt-3.5-turbo"
    embedding_model: str = "text-embedding-ada-002"

    # ── 数据库 ───────────────────────────────────────────
    database_url: str = "sqlite:///./data/nexchat.db"

    # ── ChromaDB ─────────────────────────────────────────
    chroma_persist_dir: str = "./data/chroma"

    # ── 文件上传 ─────────────────────────────────────────
    upload_dir: str = "./data/uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10 MB

    # ── RAG ──────────────────────────────────────────────
    chunk_size: int = 500
    chunk_overlap: int = 50
    retrieval_top_k: int = 5

    # ── 服务 ─────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    demo_token: str | None = None
    enable_session_api: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

# 确保数据目录存在
_required_dirs = [settings.chroma_persist_dir, settings.upload_dir]

# 仅当使用 SQLite 时才把 database_url 当作本地路径处理；
# PostgreSQL/MySQL 等远程数据库无需也不应在此创建目录。
if settings.database_url.startswith("sqlite:///"):
    _sqlite_path = settings.database_url[len("sqlite:///"):]
    _sqlite_dir = str(Path(_sqlite_path).parent)
    if _sqlite_dir and _sqlite_dir not in (".", ""):
        _required_dirs.append(_sqlite_dir)

for _dir in _required_dirs:
    Path(_dir).mkdir(parents=True, exist_ok=True)
