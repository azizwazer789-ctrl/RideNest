"""Add-on catalog routes (public read + admin CRUD)."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from dependencies.auth import require_admin
from dependencies.database import get_db
from models.user import User
from schemas.addon import AddOnCreate, AddOnResponse, AddOnUpdate
from services.addon import AddOnService

router = APIRouter(prefix="/addons", tags=["Add-ons"])


@router.post("", response_model=AddOnResponse, status_code=status.HTTP_201_CREATED)
def create_addon(
    payload: AddOnCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Create a new add-on catalog entry (admin only)."""
    created = AddOnService(db).create(payload)
    return AddOnService.to_response(created)


@router.get("", response_model=list[AddOnResponse])
def list_active_addons(db: Session = Depends(get_db)):
    """List active add-ons (public, for the customer booking flow)."""
    addons = AddOnService(db).list_active()
    return AddOnService.to_response_list(addons)


@router.get("/admin/all", response_model=list[AddOnResponse])
def list_all_addons(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List every add-on, active or not (admin only)."""
    addons = AddOnService(db).list_all()
    return AddOnService.to_response_list(addons)


@router.get("/{addon_id}", response_model=AddOnResponse)
def get_addon(addon_id: int, db: Session = Depends(get_db)):
    """Get a single add-on by id (public)."""
    addon = AddOnService(db).get_by_id(addon_id)
    return AddOnService.to_response(addon)


@router.put("/{addon_id}", response_model=AddOnResponse)
def update_addon(
    addon_id: int,
    payload: AddOnUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Update an add-on's fields (admin only)."""
    updated = AddOnService(db).update(addon_id, payload)
    return AddOnService.to_response(updated)


@router.patch("/{addon_id}/toggle", response_model=AddOnResponse)
def toggle_addon(
    addon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Enable/disable an add-on (admin only)."""
    toggled = AddOnService(db).toggle_active(addon_id)
    return AddOnService.to_response(toggled)


@router.delete("/{addon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_addon(
    addon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete an add-on that has never been used in a booking (admin only)."""
    AddOnService(db).delete(addon_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
