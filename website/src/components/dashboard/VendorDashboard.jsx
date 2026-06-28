import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import BookingCard from "../BookingCard";
import {
  confirmBooking,
  getErrorMessage,
  getMyVendorVehicles,
  getVendorBookings,
  rejectBooking,
} from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

function getApprovalStatus(vehicle) {
  if (vehicle.is_approved) return "approved";

  const created = new Date(vehicle.created_at).getTime();
  const updated = new Date(vehicle.updated_at).getTime();
  if (!Number.isNaN(created) && !Number.isNaN(updated) && updated - created > 60000) {
    return "rejected";
  }

  return "pending";
}

const approvalBadgeStyles = {
  approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  rejected: "border-red-500/30 bg-red-500/15 text-red-300",
};

const approvalBadgeLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

function VehicleApprovalBadge({ vehicle }) {
  const status = getApprovalStatus(vehicle);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${approvalBadgeStyles[status]}`}
    >
      {approvalBadgeLabels[status]}
    </span>
  );
}

function StatCard({ label, value, accent = "text-white" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function VendorDashboard() {
  const user = getUserFromToken();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [bookingsError, setBookingsError] = useState("");
  const [bookingsSuccess, setBookingsSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const refreshBookings = useCallback(async () => {
    const data = await getVendorBookings();
    setBookings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVendorData() {
      setLoading(true);
      setVehiclesError("");
      setBookingsError("");
      setBookingsSuccess("");

      const [vehiclesResult, bookingsResult] = await Promise.allSettled([
        getMyVendorVehicles(),
        getVendorBookings(),
      ]);

      if (cancelled) return;

      if (vehiclesResult.status === "fulfilled") {
        setVehicles(
          Array.isArray(vehiclesResult.value) ? vehiclesResult.value : []
        );
      } else {
        setVehicles([]);
        setVehiclesError(getErrorMessage(vehiclesResult.reason));
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(
          Array.isArray(bookingsResult.value) ? bookingsResult.value : []
        );
      } else {
        setBookings([]);
        setBookingsError(getErrorMessage(bookingsResult.reason));
      }

      setLoading(false);
    }

    loadVendorData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleBookingAction(bookingId, action) {
    if (updatingId != null) return;

    setUpdatingId(bookingId);
    setBookingsError("");
    setBookingsSuccess("");

    try {
      if (action === "confirm") {
        await confirmBooking(bookingId);
        setBookingsSuccess("Booking accepted successfully.");
      } else {
        await rejectBooking(bookingId);
        setBookingsSuccess("Booking rejected successfully.");
      }
      await refreshBookings();
    } catch (err) {
      setBookingsError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  const approvedCount = useMemo(
    () => vehicles.filter((v) => v.is_approved).length,
    [vehicles]
  );

  const pendingCount = useMemo(
    () => vehicles.filter((v) => getApprovalStatus(v) === "pending").length,
    [vehicles]
  );

  const hasBookings = Array.isArray(bookings) && bookings.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-24">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
          aria-hidden="true"
        />
        <p className="mt-4 text-slate-400">Loading vendor dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Vendor Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Manage your fleet, track listing approvals, and respond to booking
              requests from one place.
            </p>
          </div>

          <Link
            to="/add-vehicle"
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Add Vehicle
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Vehicles" value={vehicles.length} />
          <StatCard
            label="Approved Vehicles"
            value={approvedCount}
            accent="text-emerald-400"
          />
          <StatCard
            label="Pending Vehicles"
            value={pendingCount}
            accent="text-amber-400"
          />
          <StatCard
            label="Total Bookings Received"
            value={bookings.length}
            accent="text-orange-400"
          />
        </div>

        {vehiclesError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            Listings: {vehiclesError}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              My Vehicle Listings
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Monitor approval status and performance for each vehicle.
            </p>
          </div>
          <p className="text-sm text-slate-500">{vehicles.length} listing(s)</p>
        </div>

        {!vehiclesError && vehicles.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">
              You have not added any vehicles yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              List your first car to start receiving booking requests.
            </p>
            <Link
              to="/add-vehicle"
              className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Add your first vehicle
            </Link>
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 transition hover:border-emerald-500/30"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-800">
                  <img
                    src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
                    alt={vehicle.title}
                    className="h-full w-full object-cover"
                    onError={handleVehicleImageError}
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-semibold text-white">
                      {vehicle.title}
                    </h4>
                    <VehicleApprovalBadge vehicle={vehicle} />
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="font-semibold text-emerald-400">
                      PKR {Number(vehicle.price_per_day ?? 0).toLocaleString()} / day
                    </p>
                    <p className="text-slate-400">
                      <span className="text-slate-500">City:</span> {vehicle.city}
                    </p>
                  </div>

                  {!vehicle.is_available && (
                    <p className="mt-3 text-xs font-medium text-red-400">
                      Currently unavailable
                    </p>
                  )}

                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              Booking Requests
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Review customer requests, dates, and totals for your vehicles.
            </p>
          </div>
          <p className="text-sm text-slate-500">{bookings.length} booking(s)</p>
        </div>

        {bookingsSuccess && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {bookingsSuccess}
          </div>
        )}

        {bookingsError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {bookingsError}
          </div>
        )}

        {!bookingsError && !hasBookings && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">
              No bookings received yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              New booking requests will appear here once customers reserve your
              vehicles.
            </p>
          </div>
        )}

        {hasBookings && (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showCustomerId
                onConfirm={(id) => handleBookingAction(id, "confirm")}
                onReject={(id) => handleBookingAction(id, "reject")}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default VendorDashboard;
