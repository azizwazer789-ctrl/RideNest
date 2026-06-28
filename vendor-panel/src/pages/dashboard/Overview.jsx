import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getErrorMessage,
  getMyVendorVehicles,
  getVendorBookings,
} from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";
import { getVendorApprovalStatus } from "../../utils/vendorVehicle";

function StatCard({ label, value, accent = "text-slate-900 dark:text-white" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function Overview() {
  const user = getUserFromToken();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const [vehiclesResult, bookingsResult] = await Promise.allSettled([
        getMyVendorVehicles(),
        getVendorBookings(),
      ]);

      if (cancelled) return;

      if (vehiclesResult.status === "fulfilled") {
        const data = vehiclesResult.value;
        setVehicles(Array.isArray(data) ? data : data?.items || []);
      } else {
        setError(getErrorMessage(vehiclesResult.reason));
      }

      if (bookingsResult.status === "fulfilled") {
        const data = bookingsResult.value;
        setBookings(Array.isArray(data) ? data : data?.items || []);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const approved = vehicles.filter((v) => v.is_approved).length;
    const pending = vehicles.filter(
      (v) => getVendorApprovalStatus(v) === "pending"
    ).length;
    const pendingBookings = bookings.filter(
      (b) => String(b.booking_status).toLowerCase() === "pending"
    ).length;

    return {
      totalVehicles: vehicles.length,
      approved,
      pending,
      totalBookings: bookings.length,
      pendingBookings,
    };
  }, [vehicles, bookings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400" />
        <p className="mt-4 text-slate-500">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-emerald-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          Manage your fleet, track listing approvals, and respond to booking
          requests from one place.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Vehicles" value={stats.totalVehicles} />
          <StatCard label="Approved" value={stats.approved} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Pending Approval" value={stats.pending} accent="text-amber-600 dark:text-amber-400" />
          <StatCard label="Booking Requests" value={stats.totalBookings} accent="text-orange-600 dark:text-orange-400" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/dashboard/bookings"
          className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Pending Bookings
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {stats.pendingBookings}
          </p>
          <p className="mt-1 text-sm text-slate-500">Awaiting your response</p>
        </Link>
        <Link
          to="/add-vehicle"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-6 transition hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-900 dark:text-white">Add a new vehicle</p>
          <p className="mt-1 text-sm text-slate-500">List another car on the marketplace</p>
        </Link>
      </section>
    </div>
  );
}

export default Overview;
