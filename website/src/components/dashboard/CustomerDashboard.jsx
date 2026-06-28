import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CustomerBookingCard from "./CustomerBookingCard";
import StatCard, { StatCardSkeleton } from "./StatCard";
import {
  cancelBooking,
  getErrorMessage,
  getMyBookings,
  getVehicle,
} from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";

function getBookingStatusKey(status) {
  return String(status ?? "").toLowerCase();
}

function CustomerDashboard() {
  const user = getUserFromToken();
  const [bookings, setBookings] = useState([]);
  const [vehiclesById, setVehiclesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const refreshBookings = useCallback(async () => {
    const data = await getMyBookings();
    const nextBookings = Array.isArray(data) ? data : data?.items || [];
    setBookings(nextBookings);
    return nextBookings;
  }, []);

  const loadVehicleDetails = useCallback(async (bookingList) => {
    const uniqueIds = [
      ...new Set(
        bookingList
          .map((booking) => booking.vehicle_id)
          .filter((id) => id != null)
      ),
    ];

    if (uniqueIds.length === 0) {
      setVehiclesById({});
      return;
    }

    const entries = await Promise.all(
      uniqueIds.map(async (vehicleId) => {
        try {
          const vehicle = await getVehicle(vehicleId);
          return [vehicleId, vehicle];
        } catch {
          return [vehicleId, null];
        }
      })
    );

    setVehiclesById(Object.fromEntries(entries));
  }, []);

  const handleRefresh = useCallback(async () => {
    setError("");
    try {
      const data = await getMyBookings();
      const nextBookings = Array.isArray(data) ? data : data?.items || [];
      setBookings(nextBookings);
      await loadVehicleDetails(nextBookings);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [loadVehicleDetails]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        handleRefresh().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [handleRefresh]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const data = await getMyBookings();
        const nextBookings = Array.isArray(data) ? data : data?.items || [];

        if (!cancelled) {
          setBookings(nextBookings);
          await loadVehicleDetails(nextBookings);
        }
      } catch (err) {
        if (!cancelled) {
          setBookings([]);
          setVehiclesById({});
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [loadVehicleDetails]);

  async function handleCancel(bookingId) {
    setCancellingId(bookingId);
    setError("");
    setSuccess("");

    try {
      await cancelBooking(bookingId);
      setSuccess("Booking cancelled successfully.");
      const nextBookings = await refreshBookings();
      await loadVehicleDetails(nextBookings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  const stats = useMemo(() => {
    const counts = {
      total: bookings.length,
      active: 0,
      cancelled: 0,
      completed: 0,
    };

    bookings.forEach((booking) => {
      const status = getBookingStatusKey(booking.booking_status);
      if (status === "confirmed") counts.active += 1;
      if (status === "cancelled") counts.cancelled += 1;
      if (status === "completed") counts.completed += 1;
    });

    return counts;
  }, [bookings]);

  const hasBookings = bookings.length > 0;

  if (loading) {
    return (
      <div className="space-y-10">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-32 rounded bg-slate-800" />
            <div className="h-8 w-64 rounded bg-slate-800" />
            <div className="h-4 w-80 max-w-full rounded bg-slate-800" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="flex flex-col items-center py-16">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
              aria-hidden="true"
            />
            <p className="mt-4 text-slate-400">Loading your bookings…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Customer Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Track reservations, review trip details, and manage your car
              rental bookings in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
            <Link
              to="/vehicles"
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Browse Vehicles
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Bookings" value={stats.total} />
          <StatCard
            label="Active Bookings"
            value={stats.active}
            accent="text-emerald-400"
          />
          <StatCard
            label="Cancelled Bookings"
            value={stats.cancelled}
            accent="text-red-400"
          />
          <StatCard
            label="Completed Bookings"
            value={stats.completed}
            accent="text-blue-400"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              My Bookings
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              View vehicle details, trip dates, and booking status.
            </p>
          </div>
          <p className="text-sm text-slate-500">{bookings.length} booking(s)</p>
        </div>

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {!error && !hasBookings && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">
              You have no bookings yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Browse available vehicles and complete your first reservation.
            </p>
            <Link
              to="/vehicles"
              className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Find a car to book
            </Link>
          </div>
        )}

        {hasBookings && (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <CustomerBookingCard
                key={booking.id}
                booking={booking}
                vehicle={vehiclesById[booking.vehicle_id]}
                onCancel={handleCancel}
                cancellingId={cancellingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerDashboard;
