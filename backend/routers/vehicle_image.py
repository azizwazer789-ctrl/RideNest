"""Vehicle image (media gallery) routes."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.vehicle_image import VehicleImageCreate, VehicleImageResponse
from services.vehicle import VehicleService
from services.vehicle_image import VehicleImageService

router = APIRouter(tags=["Vehicle Images"])


@router.post(
    "/vehicles/{vehicle_id}/images",
    response_model=VehicleImageResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_vehicle_image(
    vehicle_id: int,
    payload: VehicleImageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Add an image to a vehicle (owner vendor only, max 10 per vehicle)."""
    image = VehicleImageService(db).add(vehicle_id, payload, current_user)
    return VehicleImageService.to_response(image)


@router.get("/vehicles/{vehicle_id}/images", response_model=list[VehicleImageResponse])
def list_vehicle_images(vehicle_id: int, db: Session = Depends(get_db)):
    """List a vehicle's images, primary first (public)."""
    VehicleService(db).get_by_id(vehicle_id)
    images = VehicleImageService(db).list_for_vehicle(vehicle_id)
    return VehicleImageService.to_response_list(images)


@router.patch("/vehicle-images/{image_id}/primary", response_model=VehicleImageResponse)
def set_primary_vehicle_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Mark an image as its vehicle's primary image (owner vendor only)."""
    image = VehicleImageService(db).set_primary(image_id, current_user)
    return VehicleImageService.to_response(image)


@router.delete("/vehicle-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Delete an image (owner vendor only); promotes another image if it was primary."""
    VehicleImageService(db).delete(image_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
