from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from jose import jwt
from passlib.context import CryptContext

from core.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY

# passlib 1.7.x expects bcrypt.__about__.__version__ (removed in bcrypt 5.x)
if not hasattr(_bcrypt, "__about__"):
    _bcrypt.__about__ = type(
        "about",
        (),
        {"__version__": getattr(_bcrypt, "__version__", "0.0.0")},
    )()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
