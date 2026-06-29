"""Add-on catalog CRUD and admin enable/disable business logic."""

from sqlalchemy.orm import Session

from core.exceptions import ConflictError, NotFoundError
from models.addon import AddOn
from models.booking_addon import BookingAddOn
from schemas.addon import AddOnCreate, AddOnResponse, AddOnUpdate


class AddOnService:
    """Encapsulates add-on catalog operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: AddOnCreate) -> AddOn:
        """Create a new add-on catalog entry (admin only)."""
        addon = AddOn(
            name=payload.name,
            description=payload.description,
            price=payload.price,
            pricing_type=payload.pricing_type.value,
            is_active=payload.is_active,
        )
        self.db.add(addon)
        self.db.commit()
        self.db.refresh(addon)
        return addon

    def list_active(self) -> list[AddOn]:
        """Return active add-ons only (public, for the customer booking flow)."""
        return (
            self.db.query(AddOn)
            .filter(AddOn.is_active.is_(True))
            .order_by(AddOn.id.asc())
            .all()
        )

    def list_all(self) -> list[AddOn]:
        """Return every add-on, active or not (admin only)."""
        return self.db.query(AddOn).order_by(AddOn.id.asc()).all()

    def get_by_id(self, addon_id: int) -> AddOn:
        """Return an add-on by id or raise not found."""
        addon = self.db.query(AddOn).filter(AddOn.id == addon_id).first()
        if not addon:
            raise NotFoundError("Add-on not found")
        return addon

    def update(self, addon_id: int, payload: AddOnUpdate) -> AddOn:
        """Update an add-on's fields (admin only)."""
        addon = self.get_by_id(addon_id)
        update_data = payload.model_dump(exclude_unset=True)

        if "pricing_type" in update_data and update_data["pricing_type"] is not None:
            update_data["pricing_type"] = update_data["pricing_type"].value

        for field, value in update_data.items():
            setattr(addon, field, value)

        self.db.commit()
        self.db.refresh(addon)
        return addon

    def toggle_active(self, addon_id: int) -> AddOn:
        """Flip an add-on's enabled/disabled state (admin only)."""
        addon = self.get_by_id(addon_id)
        addon.is_active = not addon.is_active
        self.db.commit()
        self.db.refresh(addon)
        return addon

    def delete(self, addon_id: int) -> None:
        """Delete an add-on, unless it has already been used in a booking.

        Disabling (toggle_active) is the supported way to retire an add-on
        that's already attached to historical bookings, so those bookings'
        snapshotted add-on costs are never affected by a hard delete.
        """
        addon = self.get_by_id(addon_id)

        in_use = (
            self.db.query(BookingAddOn).filter(BookingAddOn.addon_id == addon_id).first()
        )
        if in_use:
            raise ConflictError(
                "Cannot delete an add-on already used in bookings; disable it instead"
            )

        self.db.delete(addon)
        self.db.commit()

    @staticmethod
    def to_response(addon: AddOn) -> AddOnResponse:
        """Map an AddOn ORM instance to an API response."""
        return AddOnResponse.model_validate(addon)

    @staticmethod
    def to_response_list(addons: list[AddOn]) -> list[AddOnResponse]:
        """Map a list of add-ons to API responses."""
        return [AddOnResponse.model_validate(addon) for addon in addons]
