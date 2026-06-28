"""User authentication routes."""

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from dependencies.auth import get_current_user
from dependencies.database import get_db
from models.user import User
from schemas.user import SignupResponse, Token, UserCreate, UserResponse, UserUpdate
from services.user import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    service = UserService(db)
    new_user = service.register(user)
    return SignupResponse(
        message="User created successfully",
        user=service.to_response(new_user),
    )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with email (username) and password; returns JWT."""
    return UserService(db).authenticate(form_data.username, form_data.password)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's own profile."""
    return UserService.to_response(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the authenticated user's own editable profile fields."""
    updated = UserService(db).update_profile(current_user, payload)
    return UserService.to_response(updated)
