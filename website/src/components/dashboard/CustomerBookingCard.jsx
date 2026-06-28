import { Link } from "react-router-dom";
import BookingStatusBadge from "../BookingStatusBadge";
import VehicleThumbnail from "./VehicleThumbnail";
import { canCancelBooking } from "../../utils/bookingStatus";
import { formatDateRange } from "../../utils/formatDate";

function CustomerBookingCard({
  booking,
  vehicle,
  onCancel,
  cancellingId = null,
}) {
  if (!booking) return null;

  const showCancel =
    typeof onCancel === "function" && canCancelBooking(booking.booking_status);
  const isCancelling = cancellingId === booking.id;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 transition hover:border-emerald-500/20">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="aspect-[16/10] bg-slate-800 md:aspect-auto md:min-h-[180px]">
          <VehicleThumbnail
            src={vehicle?.image_url}
            alt={vehicle?.title ?? `Vehicle #${booking.vehicle_id}`}
          />
        </div>

        <div className="flex flex-col justify-between gap-4 p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                Booking #{booking.id}
              </h3>
              <BookingStatusBadge status={booking.booking_status} />
            </div>

            {vehicle ? (
              <div>
                <p className="font-medium text-white">{vehicle.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                <span className="text-slate-500">Vehicle:</span>{" "}
                <Link
                  to={`/vehicles/${booking.vehicle_id}`}
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  #{booking.vehicle_id}
                </Link>
              </p>
            )}

            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Dates:</span>{" "}
              {formatDateRange(booking.start_date, booking.end_date)}
            </p>

            <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Pickup:</span>{" "}
                {booking.pickup_location ?? "—"}
              </p>
              <p>
                <span className="text-slate-500">Dropoff:</span>{" "}
                {booking.dropoff_location ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Total
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                PKR {Number(booking.total_price ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/vehicles/${booking.vehicle_id}`}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-white"
              >
                View Vehicle
              </Link>

              {showCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(booking.id)}
                  disabled={isCancelling}
                  className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCancelling ? "Cancelling…" : "Cancel Booking"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CustomerBookingCard;
