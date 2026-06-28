"""Authentication and role-based access dependencies."""

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from core.enums import UserRole
from core.exceptions import ForbiddenError, UnauthorizedError
from core.security import decode_access_token
from dependencies.database import get_db
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated user."""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError()
        user_id = int(user_id)
    except UnauthorizedError:
        raise
    except (JWTError, ValueError, TypeError):
        raise UnauthorizedError()

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise UnauthorizedError()

    return user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Allow access only for customer accounts."""
    if current_user.role != UserRole.customer.value:
        raise ForbiddenError("Customer access required")
    return current_user


def require_vendor(current_user: User = Depends(get_current_user)) -> User:
    """Allow access only for vendor accounts."""
    if current_user.role != UserRole.vendor.value:
        raise ForbiddenError("Vendor access required")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow access only for admin accounts."""
    if current_user.role != UserRole.admin.value:
        raise ForbiddenError("Admin access required")
    return current_user
