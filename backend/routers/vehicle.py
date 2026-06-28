"""Vehicle listing, vendor management, and admin approval routes."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import require_admin, require_vendor
from dependencies.database import get_db
from models.user import User
from schemas.common import PaginatedResponse
from schemas.vehicle import VehicleCreate, VehicleResponse, VehicleUpdate
from services.vehicle import VehicleService

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    created = VehicleService(db).create(vehicle, current_user)
    return VehicleService.to_response(created)


@router.get("/", response_model=PaginatedResponse[VehicleResponse])
def list_vehicles(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    car_type: str | None = Query(default=None),
    transmission: str | None = Query(default=None),
    fuel_type: str | None = Query(default=None),
    with_driver: bool | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    vehicles, total, pages = VehicleService(db).list_public(
        search=search,
        city=city,
        brand=brand,
        car_type=car_type,
        transmission=transmission,
        fuel_type=fuel_type,
        with_driver=with_driver,
        min_price=min_price,
        max_price=max_price,
        page=page,
        limit=limit,
    )
    return PaginatedResponse[VehicleResponse](
        items=VehicleService.to_response_list(vehicles),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/admin/all", response_model=PaginatedResponse[VehicleResponse])
def list_all_vehicles_admin(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    vehicles, total, pages = VehicleService(db).list_all(page=page, limit=limit)
    return PaginatedResponse[VehicleResponse](
        items=VehicleService.to_response_list(vehicles),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/vendor/my", response_model=PaginatedResponse[VehicleResponse])
def list_my_vendor_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    vehicles, total, pages = VehicleService(db).list_by_vendor(
        current_user.id, page=page, limit=limit
    )
    return PaginatedResponse[VehicleResponse](
        items=VehicleService.to_response_list(vehicles),
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    return VehicleService.to_response(VehicleService(db).get_public(vehicle_id))


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    updated = VehicleService(db).update(vehicle_id, vehicle, current_user)
    return VehicleService.to_response(updated)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    VehicleService(db).delete(vehicle_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{vehicle_id}/toggle-availability", response_model=VehicleResponse)
def toggle_vehicle_availability(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    vehicle = VehicleService(db).toggle_availability(vehicle_id, current_user)
    return VehicleService.to_response(vehicle)


@router.patch("/{vehicle_id}/approve", response_model=VehicleResponse)
def approve_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return VehicleService.to_response(
        VehicleService(db).set_approval(vehicle_id, approved=True)
    )


@router.patch("/{vehicle_id}/reject", response_model=VehicleResponse)
def reject_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return VehicleService.to_response(
        VehicleService(db).set_approval(vehicle_id, approved=False)
    )