"""RideNest API application entry point."""

from fastapi import FastAPI  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]

from core.config import CORS_ORIGINS
from core.exception_handlers import register_exception_handlers
from database.connection import Base, engine
from models.addon import AddOn
from models.booking import Booking
from models.booking_addon import BookingAddOn
from models.conversation import Conversation
from models.earnings_ledger import EarningsLedger
from models.favorite import Favorite
from models.invoice import Invoice
from models.message import Message
from models.notification import Notification
from models.payment import Payment
from models.refund import Refund
from models.review import Review
from models.user import User
from models.vehicle import Vehicle
from models.vehicle_availability import VehicleAvailability
from models.vehicle_image import VehicleImage
from models.vendor_payout import VendorPayout
from models.vendor_wallet import VendorWallet
from routers import (
    addon,
    analytics,
    booking,
    conversation,
    dashboard,
    favorite,
    message,
    notification,
    payment,
    review,
    user,
    vehicle,
    vehicle_availability,
    vehicle_image,
    vendor_payout,
    vendor_wallet,
)
from schemas.common import MessageResponse

app = FastAPI(
    title="RideNest API",
    description="Multi-vendor car rental marketplace backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(user.router)
app.include_router(vehicle.router)
app.include_router(addon.router)
app.include_router(booking.router)
app.include_router(dashboard.router)
app.include_router(review.router)
app.include_router(favorite.router)
app.include_router(notification.router)
app.include_router(vehicle_image.router)
app.include_router(vehicle_availability.router)
app.include_router(payment.router)
app.include_router(vendor_wallet.router)
app.include_router(vendor_payout.router)
app.include_router(analytics.router)
app.include_router(conversation.router)
app.include_router(message.router)

Base.metadata.create_all(bind=engine)


@app.get("/", response_model=MessageResponse)
def home():
    """Health check / welcome endpoint."""
    return MessageResponse(message="RideNest Backend Running Successfully")
