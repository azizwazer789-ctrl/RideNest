"""Favorite (wishlist) creation, listing, and removal business logic."""

from sqlalchemy.orm import Session

from core.exceptions import ConflictError, NotFoundError
from models.favorite import Favorite
from models.user import User
from models.vehicle import Vehicle
from schemas.favorite import FavoriteResponse


class FavoriteService:
    """Encapsulates favorite/wishlist operations."""

    def __init__(self, db: Session):
        self.db = db

    def add(self, vehicle_id: int, customer: User) -> Favorite:
        """Favorite an existing, approved vehicle for a customer."""
        vehicle = (
            self.db.query(Vehicle)
            .filter(Vehicle.id == vehicle_id, Vehicle.is_approved.is_(True))
            .first()
        )
        if not vehicle:
            raise NotFoundError("Vehicle not found or not approved")

        existing = (
            self.db.query(Favorite)
            .filter(
                Favorite.customer_id == customer.id,
                Favorite.vehicle_id == vehicle_id,
            )
            .first()
        )
        if existing:
            raise ConflictError("Vehicle is already in your favorites")

        favorite = Favorite(customer_id=customer.id, vehicle_id=vehicle_id)

        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)

        return favorite

    def remove(self, vehicle_id: int, customer: User) -> None:
        """Remove a vehicle from the customer's own favorites."""
        favorite = (
            self.db.query(Favorite)
            .filter(
                Favorite.customer_id == customer.id,
                Favorite.vehicle_id == vehicle_id,
            )
            .first()
        )
        if not favorite:
            raise NotFoundError("Favorite not found")

        self.db.delete(favorite)
        self.db.commit()

    def list_vehicles_for_customer(self, customer_id: int) -> list[Vehicle]:
        """Return a customer's favorited vehicles, most recently saved first."""
        return (
            self.db.query(Vehicle)
            .join(Favorite, Favorite.vehicle_id == Vehicle.id)
            .filter(Favorite.customer_id == customer_id)
            .order_by(Favorite.created_at.desc())
            .all()
        )

    @staticmethod
    def to_response(favorite: Favorite) -> FavoriteResponse:
        """Map a Favorite ORM instance to an API response."""
        return FavoriteResponse.model_validate(favorite)
