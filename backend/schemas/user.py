from pydantic import BaseModel, ConfigDict, EmailStr, Field  # type: ignore[import]

from core.constants import MIN_PASSWORD_LENGTH, PHONE_MAX_LENGTH, PHONE_MIN_LENGTH
from core.enums import UserRole
from schemas.common import TimestampSchema


class UserCreate(BaseModel):
    """Payload for user registration."""

    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=MIN_PASSWORD_LENGTH)
    role: UserRole = UserRole.customer


class UserUpdate(BaseModel):
    """Payload for updating the authenticated user's own profile.

    Only these profile fields are editable here; id, role, email, password,
    and created_at are intentionally out of scope for this endpoint. Fields
    left out of the request body are unchanged (partial update).
    """

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(
        default=None, min_length=PHONE_MIN_LENGTH, max_length=PHONE_MAX_LENGTH
    )
    profile_image: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    bio: str | None = Field(default=None, max_length=1000)


class UserResponse(TimestampSchema):
    """Public user profile returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    phone: str | None
    profile_image: str | None
    city: str | None
    address: str | None
    bio: str | None


class SignupResponse(BaseModel):
    """Signup success response."""

    message: str
    user: UserResponse


class Token(BaseModel):
    """OAuth2 access token response."""

    access_token: str
    token_type: str = "bearer"
