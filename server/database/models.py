"""
SQLAlchemy ORM 模型
定义 Session、Message、Document 三张核心表
"""

from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from database.connection import Base


class SessionModel(Base):
    """会话表"""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False, default="新会话")
    created_at = Column(Float, nullable=False)
    updated_at = Column(Float, nullable=False)

    messages = relationship(
        "MessageModel",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="MessageModel.created_at",
    )


class MessageModel(Base):
    """消息表"""
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    session_id = Column(
        String,
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(String, nullable=False)           # user | assistant | system
    content = Column(Text, nullable=False, default="")
    status = Column(String, nullable=False, default="done")
    agent_type = Column(String, nullable=True)       # chat | rag | summary
    sources = Column(Text, nullable=True)            # JSON 字符串
    error = Column(Text, nullable=True)              # JSON 字符串
    created_at = Column(Float, nullable=False)

    session = relationship("SessionModel", back_populates="messages")


class DocumentModel(Base):
    """知识库文档表"""
    __tablename__ = "documents"

    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)       # txt | md | pdf
    file_size = Column(Integer, nullable=False, default=0)
    chunk_count = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="processing")  # processing | ready | error
    created_at = Column(Float, nullable=False)
