"""Favorite (wishlist) routes."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import require_customer
from dependencies.database import get_db
from models.user import User
from schemas.favorite import FavoriteResponse
from schemas.vehicle import VehicleResponse
from services.favorite import FavoriteService
from services.vehicle import VehicleService

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post(
    "/{vehicle_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED
)
def add_favorite(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Favorite an approved vehicle (customer only)."""
    favorite = FavoriteService(db).add(vehicle_id, current_user)
    return FavoriteService.to_response(favorite)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Remove a vehicle from the authenticated customer's own favorites."""
    FavoriteService(db).remove(vehicle_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/my", response_model=list[VehicleResponse])
def list_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """List the authenticated customer's favorited (saved) vehicles."""
    vehicles = FavoriteService(db).list_vehicles_for_customer(current_user.id)
    return VehicleService.to_response_list(vehicles)
