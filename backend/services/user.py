"""User registration and authentication business logic."""

from sqlalchemy.orm import Session

from core.enums import UserRole
from core.exceptions import BadRequestError, NotFoundError, UnauthorizedError
from core.security import create_access_token, hash_password, verify_password
from models.user import User
from schemas.user import Token, UserCreate, UserResponse, UserUpdate


class UserService:
    """Encapsulates user-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def register(self, payload: UserCreate) -> User:
        """Create a new user account."""
        existing_user = self.db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise BadRequestError("Email already registered")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=payload.role.value,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> Token:
        """Validate credentials and return a JWT access token."""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
            }
        )
        return Token(access_token=access_token)

    def update_profile(self, user: User, payload: UserUpdate) -> User:
        """Update the authenticated user's own editable profile fields.

        Only fields explicitly provided in the payload are changed; fields
        left out of the request body are untouched.
        """
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def get_vendor(self, vendor_id: int) -> User:
        """Return a vendor user by id, or raise not found."""
        user = (
            self.db.query(User)
            .filter(User.id == vendor_id, User.role == UserRole.vendor.value)
            .first()
        )
        if not user:
            raise NotFoundError("Vendor not found")
        return user

    @staticmethod
    def to_response(user: User) -> UserResponse:
        """Map a User ORM instance to an API response."""
        return UserResponse.model_validate(user)
