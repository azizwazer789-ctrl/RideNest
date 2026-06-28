"""Vehicle availability calendar routes."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.vehicle_availability import (
    VehicleAvailabilityCalendarResponse,
    VehicleAvailabilityCreate,
    VehicleAvailabilityResponse,
    VehicleAvailabilityUpdate,
)
from services.vehicle import VehicleService
from services.vehicle_availability import VehicleAvailabilityService

router = APIRouter(tags=["Vehicle Availability"])


@router.get(
    "/vehicles/{vehicle_id}/availability",
    response_model=VehicleAvailabilityCalendarResponse,
)
def get_vehicle_availability(vehicle_id: int, db: Session = Depends(get_db)):
    """Return a vehicle's calendar: vendor-managed ranges plus booked dates (public)."""
    VehicleService(db).get_by_id(vehicle_id)
    return VehicleAvailabilityService(db).get_calendar(vehicle_id)


@router.post(
    "/vehicles/{vehicle_id}/availability",
    response_model=VehicleAvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle_availability(
    vehicle_id: int,
    payload: VehicleAvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Create an availability range for a vehicle (owner vendor only)."""
    availability = VehicleAvailabilityService(db).create(vehicle_id, payload, current_user)
    return VehicleAvailabilityService.to_response(availability)


@router.put("/availability/{availability_id}", response_model=VehicleAvailabilityResponse)
def update_vehicle_availability(
    availability_id: int,
    payload: VehicleAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Update an availability range (owner vendor only)."""
    availability = VehicleAvailabilityService(db).update(
        availability_id, payload, current_user
    )
    return VehicleAvailabilityService.to_response(availability)


@router.delete("/availability/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_availability(
    availability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Delete an availability range (owner vendor only)."""
    VehicleAvailabilityService(db).delete(availability_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
