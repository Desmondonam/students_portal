from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import get_settings

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Validate the Supabase JWT and return the decoded payload."""
    settings = get_settings()
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def get_user_id(user: dict = Depends(get_current_user)) -> str:
    uid = user.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return uid
