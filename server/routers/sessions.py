"""
会话管理路由
会话和消息的 CRUD
"""

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import SessionModel, MessageModel
from models.schemas import SessionCreate, SessionOut, SessionUpdate, MessageOut

from dependencies import verify_demo_token

router = APIRouter(
    prefix="/api/sessions",
    tags=["sessions"],
    dependencies=[Depends(verify_demo_token)]
)


@router.get("/", response_model=list[SessionOut])
def get_sessions(db: Session = Depends(get_db)):
    """获取所有会话列表（按更新时间降序）"""
    sessions = db.query(SessionModel).order_by(SessionModel.updated_at.desc()).all()
    return [
        SessionOut(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=len(s.messages),
        )
        for s in sessions
    ]


@router.post("/", response_model=SessionOut)
def create_session(req: SessionCreate, db: Session = Depends(get_db)):
    """创建新会话"""
    now = time.time()
    session = SessionModel(
        id=str(uuid.uuid4()),
        title=req.title,
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.commit()
    return SessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
    )


@router.patch("/{session_id}", response_model=SessionOut)
def update_session(session_id: str, req: SessionUpdate, db: Session = Depends(get_db)):
    """更新会话标题"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    session.title = req.title
    session.updated_at = time.time()
    db.commit()
    return SessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages),
    )


@router.delete("/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """删除会话及其所有消息"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    db.delete(session)
    db.commit()
    return {"message": "删除成功"}


@router.get("/{session_id}/messages", response_model=list[MessageOut])
def get_messages(session_id: str, db: Session = Depends(get_db)):
    """获取会话的所有消息"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    messages = (
        db.query(MessageModel)
        .filter(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at)
        .all()
    )
    return [
        MessageOut(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            content=m.content,
            status=m.status,
            agent_type=m.agent_type,
            sources=m.sources,
            error=m.error,
            created_at=m.created_at,
        )
        for m in messages
    ]
