"""Vehicle listing and admin approval business logic."""

from sqlalchemy.orm import Session

from core.enums import NotificationType, VehicleApprovalStatus
from core.exceptions import ForbiddenError, NotFoundError
from models.user import User
from models.vehicle import Vehicle
from schemas.vehicle import VehicleCreate, VehicleResponse, VehicleUpdate
from services.notification import NotificationService
from utils.pagination import paginate


class VehicleService:
    """Encapsulates vehicle-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payload: VehicleCreate, vendor: User) -> Vehicle:
        vehicle = Vehicle(
            vendor_id=vendor.id,
            title=payload.title,
            brand=payload.brand,
            model=payload.model,
            year=payload.year,
            car_type=payload.car_type,
            transmission=payload.transmission,
            fuel_type=payload.fuel_type,
            seating_capacity=payload.seating_capacity,
            city=payload.city,
            location=payload.location,
            price_per_day=payload.price_per_day,
            price_per_hour=payload.price_per_hour,
            with_driver_available=payload.with_driver_available,
            description=payload.description,
            image_url=payload.image_url,
            is_available=payload.is_available,
        )
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def list_public(
        self,
        search: str | None = None,
        city: str | None = None,
        brand: str | None = None,
        car_type: str | None = None,
        transmission: str | None = None,
        fuel_type: str | None = None,
        with_driver: bool | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[Vehicle], int, int]:
        """Return approved and available vehicles with optional filters.

        Returns (items, total, pages).
        """
        query = self.db.query(Vehicle).filter(
            Vehicle.is_approved.is_(True),
            Vehicle.is_available.is_(True),
        )

        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                Vehicle.title.ilike(pattern)
                | Vehicle.brand.ilike(pattern)
                | Vehicle.model.ilike(pattern)
                | Vehicle.city.ilike(pattern)
                | Vehicle.location.ilike(pattern)
            )

        if city:
            query = query.filter(Vehicle.city.ilike(f"%{city.strip()}%"))

        if brand:
            query = query.filter(Vehicle.brand.ilike(f"%{brand.strip()}%"))

        if car_type:
            query = query.filter(Vehicle.car_type.ilike(f"%{car_type.strip()}%"))

        if transmission:
            query = query.filter(Vehicle.transmission.ilike(f"%{transmission.strip()}%"))

        if fuel_type:
            query = query.filter(Vehicle.fuel_type.ilike(f"%{fuel_type.strip()}%"))

        if with_driver is not None:
            query = query.filter(Vehicle.with_driver_available.is_(with_driver))

        if min_price is not None:
            query = query.filter(Vehicle.price_per_day >= min_price)

        if max_price is not None:
            query = query.filter(Vehicle.price_per_day <= max_price)

        return paginate(query.order_by(Vehicle.id.desc()), page, limit)

    def list_all(self, page: int = 1, limit: int = 10) -> tuple[list[Vehicle], int, int]:
        query = self.db.query(Vehicle).order_by(Vehicle.id.desc())
        return paginate(query, page, limit)

    def list_by_vendor(
        self, vendor_id: int, page: int = 1, limit: int = 10
    ) -> tuple[list[Vehicle], int, int]:
        query = (
            self.db.query(Vehicle)
            .filter(Vehicle.vendor_id == vendor_id)
            .order_by(Vehicle.id.desc())
        )
        return paginate(query, page, limit)

    def get_public(self, vehicle_id: int) -> Vehicle:
        vehicle = (
            self.db.query(Vehicle)
            .filter(
                Vehicle.id == vehicle_id,
                Vehicle.is_approved.is_(True),
                Vehicle.is_available.is_(True),
            )
            .first()
        )
        if not vehicle:
            raise NotFoundError("Vehicle not found")
        return vehicle

    def get_by_id(self, vehicle_id: int) -> Vehicle:
        vehicle = self.db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise NotFoundError("Vehicle not found")
        return vehicle

    def get_vendor_vehicle(self, vehicle_id: int, vendor: User) -> Vehicle:
        vehicle = self.get_by_id(vehicle_id)

        if vehicle.vendor_id != vendor.id:
            raise ForbiddenError("Not allowed to manage this vehicle")

        return vehicle

    def update(self, vehicle_id: int, payload: VehicleUpdate, vendor: User) -> Vehicle:
        vehicle = self.get_vendor_vehicle(vehicle_id, vendor)
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(vehicle, field, value)

        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle_id: int, vendor: User) -> None:
        vehicle = self.get_vendor_vehicle(vehicle_id, vendor)
        self.db.delete(vehicle)
        self.db.commit()

    def toggle_availability(self, vehicle_id: int, vendor: User) -> Vehicle:
        vehicle = self.get_vendor_vehicle(vehicle_id, vendor)
        vehicle.is_available = not vehicle.is_available
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def set_approval(self, vehicle_id: int, approved: bool) -> Vehicle:
        vehicle = self.get_by_id(vehicle_id)
        vehicle.is_approved = approved
        vehicle.approval_status = (
            VehicleApprovalStatus.approved.value
            if approved
            else VehicleApprovalStatus.rejected.value
        )
        self.db.commit()
        self.db.refresh(vehicle)

        if approved:
            title, message, notif_type = (
                "Vehicle Approved",
                f"Your vehicle '{vehicle.title}' has been approved and is now live.",
                NotificationType.vehicle_approved.value,
            )
        else:
            title, message, notif_type = (
                "Vehicle Rejected",
                f"Your vehicle '{vehicle.title}' has been rejected.",
                NotificationType.vehicle_rejected.value,
            )

        NotificationService(self.db).create(
            user_id=vehicle.vendor_id,
            title=title,
            message=message,
            notif_type=notif_type,
        )

        return vehicle

    @staticmethod
    def to_response(vehicle: Vehicle) -> VehicleResponse:
        return VehicleResponse.model_validate(vehicle)

    @staticmethod
    def to_response_list(vehicles: list[Vehicle]) -> list[VehicleResponse]:
        return [VehicleResponse.model_validate(vehicle) for vehicle in vehicles]