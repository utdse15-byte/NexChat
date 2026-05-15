from fastapi import Header, HTTPException
from config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

async def verify_demo_token(authorization: str | None = Header(None)):
    """验证 DEMO_TOKEN（如果配置了的话）"""
    if not settings.demo_token:
        return None
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    if token != settings.demo_token:
        raise HTTPException(status_code=403, detail="Invalid DEMO_TOKEN")
    
    return token
