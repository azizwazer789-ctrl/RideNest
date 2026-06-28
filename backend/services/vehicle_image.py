"""Vehicle image (media gallery) upload, listing, primary, and deletion logic."""

from sqlalchemy.orm import Session

from core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from models.user import User
from models.vehicle import Vehicle
from models.vehicle_image import VehicleImage
from schemas.vehicle_image import VehicleImageCreate, VehicleImageResponse
from services.vehicle import VehicleService

MAX_IMAGES_PER_VEHICLE = 10


class VehicleImageService:
    """Encapsulates vehicle image/media operations."""

    def __init__(self, db: Session):
        self.db = db

    def list_for_vehicle(self, vehicle_id: int) -> list[VehicleImage]:
        """Return a vehicle's images, primary first, then newest first."""
        return (
            self.db.query(VehicleImage)
            .filter(VehicleImage.vehicle_id == vehicle_id)
            .order_by(VehicleImage.is_primary.desc(), VehicleImage.created_at.desc())
            .all()
        )

    def _count_for_vehicle(self, vehicle_id: int) -> int:
        return (
            self.db.query(VehicleImage)
            .filter(VehicleImage.vehicle_id == vehicle_id)
            .count()
        )

    def _clear_primary(self, vehicle_id: int) -> None:
        """Demote any currently-primary image for a vehicle."""
        self.db.query(VehicleImage).filter(
            VehicleImage.vehicle_id == vehicle_id,
            VehicleImage.is_primary.is_(True),
        ).update({"is_primary": False})

    def add(self, vehicle_id: int, payload: VehicleImageCreate, vendor: User) -> VehicleImage:
        """Add an image to a vehicle owned by the vendor (max 10 per vehicle)."""
        vehicle = VehicleService(self.db).get_vendor_vehicle(vehicle_id, vendor)

        existing_count = self._count_for_vehicle(vehicle_id)
        if existing_count >= MAX_IMAGES_PER_VEHICLE:
            raise BadRequestError(
                f"A vehicle can have at most {MAX_IMAGES_PER_VEHICLE} images"
            )

        make_primary = existing_count == 0 or payload.is_primary

        if make_primary:
            self._clear_primary(vehicle_id)

        image = VehicleImage(
            vehicle_id=vehicle_id,
            image_url=payload.image_url,
            is_primary=make_primary,
        )

        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)

        if make_primary:
            # Keep the legacy single image_url field in sync with the
            # current primary photo for backward compatibility.
            vehicle.image_url = image.image_url
            self.db.commit()

        return image

    def get_by_id(self, image_id: int) -> VehicleImage:
        """Return a vehicle image by id or raise not found."""
        image = self.db.query(VehicleImage).filter(VehicleImage.id == image_id).first()

        if not image:
            raise NotFoundError("Vehicle image not found")

        return image

    def _get_owned_image(self, image_id: int, vendor: User) -> tuple[VehicleImage, Vehicle]:
        """Return an image and its vehicle, scoped to the owning vendor."""
        image = self.get_by_id(image_id)
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == image.vehicle_id).first()

        if not vehicle or vehicle.vendor_id != vendor.id:
            raise ForbiddenError("Not allowed to manage this vehicle's images")

        return image, vehicle

    def set_primary(self, image_id: int, vendor: User) -> VehicleImage:
        """Mark an image as its vehicle's primary image (owner vendor only)."""
        image, vehicle = self._get_owned_image(image_id, vendor)

        if not image.is_primary:
            self._clear_primary(image.vehicle_id)
            image.is_primary = True
            self.db.commit()
            self.db.refresh(image)

        vehicle.image_url = image.image_url
        self.db.commit()

        return image

    def delete(self, image_id: int, vendor: User) -> None:
        """Delete an image (owner vendor only); auto-promotes another if it was primary."""
        image, vehicle = self._get_owned_image(image_id, vendor)
        was_primary = image.is_primary
        vehicle_id = image.vehicle_id

        self.db.delete(image)
        self.db.commit()

        if not was_primary:
            return

        replacement = (
            self.db.query(VehicleImage)
            .filter(VehicleImage.vehicle_id == vehicle_id)
            .order_by(VehicleImage.created_at.asc())
            .first()
        )
        if replacement:
            replacement.is_primary = True
            vehicle.image_url = replacement.image_url
        else:
            # No images left at all — clear the legacy field rather than
            # leaving it pointing at the now-deleted image.
            vehicle.image_url = None
        self.db.commit()

    @staticmethod
    def to_response(image: VehicleImage) -> VehicleImageResponse:
        """Map a VehicleImage ORM instance to an API response."""
        return VehicleImageResponse.model_validate(image)

    @staticmethod
    def to_response_list(images: list[VehicleImage]) -> list[VehicleImageResponse]:
        """Map a list of vehicle images to API responses."""
        return [VehicleImageResponse.model_validate(image) for image in images]
