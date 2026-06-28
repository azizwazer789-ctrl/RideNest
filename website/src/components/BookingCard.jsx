import { Link } from "react-router-dom";
import BookingStatusBadge from "./BookingStatusBadge";
import {
  canCancelBooking,
  canVendorManageBooking,
} from "../utils/bookingStatus";
import { formatDateRange } from "../utils/formatDate";

function BookingCard({
  booking,
  showVehicleLink = false,
  showCustomerId = false,
  onCancel,
  cancellingId = null,
  onConfirm,
  onReject,
  updatingId = null,
}) {
  if (!booking) return null;

  const showCancel =
    typeof onCancel === "function" && canCancelBooking(booking.booking_status);
  const showVendorActions =
    (typeof onConfirm === "function" || typeof onReject === "function") &&
    canVendorManageBooking(booking.booking_status);
  const isCancelling = cancellingId === booking.id;
  const isUpdating = updatingId === booking.id;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-emerald-500/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-semibold text-white">Booking #{booking.id}</h3>
            <BookingStatusBadge status={booking.booking_status} />
          </div>

          {showCustomerId && booking.customer_id != null && (
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Customer ID:</span>{" "}
              <span className="text-slate-300">#{booking.customer_id}</span>
            </p>
          )}

          <p className="text-sm text-slate-400">
            <span className="text-slate-500">Vehicle:</span>{" "}
            {showVehicleLink ? (
              <Link
                to={`/vehicles/${booking.vehicle_id}`}
                className="font-medium text-emerald-400 hover:text-emerald-300"
              >
                #{booking.vehicle_id}
              </Link>
            ) : (
              <span className="text-slate-300">#{booking.vehicle_id}</span>
            )}
          </p>

          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Dates:</span>{" "}
            {formatDateRange(booking.start_date, booking.end_date)}
          </p>

          <p className="text-sm text-slate-400">
            <span className="text-slate-500">Pickup:</span>{" "}
            {booking.pickup_location ?? "—"}
          </p>
          <p className="text-sm text-slate-400">
            <span className="text-slate-500">Dropoff:</span>{" "}
            {booking.dropoff_location ?? "—"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-2xl font-bold text-emerald-400">
              PKR {Number(booking.total_price ?? 0).toLocaleString()}
            </p>
          </div>

          {showVendorActions && (
            <div className="flex flex-wrap justify-end gap-2">
              {typeof onConfirm === "function" && (
                <button
                  type="button"
                  onClick={() => onConfirm(booking.id)}
                  disabled={isUpdating}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? "Updating…" : "Accept"}
                </button>
              )}
              {typeof onReject === "function" && (
                <button
                  type="button"
                  onClick={() => onReject(booking.id)}
                  disabled={isUpdating}
                  className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdating ? "Updating…" : "Reject"}
                </button>
              )}
            </div>
          )}

          {showCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling || isUpdating}
              className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCancelling ? "Cancelling…" : "Cancel Booking"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default BookingCard;
