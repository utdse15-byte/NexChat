"""
数据库连接管理

兼容 SQLite（本地开发 / 简历演示）与 PostgreSQL（云上生产）。
- SQLite 多线程需要 ``check_same_thread=False``；切换到 PostgreSQL/MySQL
  时不能传这个参数，否则驱动会报错，所以条件化处理。
- 默认开启 ``pool_pre_ping``，避免免费数据库（如 Neon free tier）连接
  闲置后被远端关闭导致的 ``OperationalError``。
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings

_db_url = settings.database_url
_is_sqlite = _db_url.startswith("sqlite")

_engine_kwargs: dict = {
    "echo": False,
    # 远程数据库连接闲置后可能被关闭；预 ping 在 checkout 时探测连通性
    "pool_pre_ping": True,
}

if _is_sqlite:
    # SQLite 在多线程环境（FastAPI 依赖注入会跨线程）下必需此选项
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(_db_url, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类"""
    pass


def get_db():
    """FastAPI 依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """创建所有数据表（如果尚不存在）"""
    # 引入 models 触发表元数据注册
    from database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
