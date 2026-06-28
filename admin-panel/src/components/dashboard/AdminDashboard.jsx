import { useCallback, useEffect, useMemo, useState } from "react";
import AdminVehicleCard from "./AdminVehicleCard";
import StatCard, { StatCardSkeleton } from "./StatCard";
import {
  approveVehicle,
  getAdminVehicles,
  getErrorMessage,
  rejectVehicle,
} from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";
import { getVehicleApprovalStatus } from "../../utils/vehicleApproval";

function AdminDashboard() {
  const user = getUserFromToken();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setVehicles([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminVehicles();
        if (!cancelled) {
          setVehicles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setVehicles([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(id) {
    try {
      setMessage("");
      setError("");
      await approveVehicle(id);
      setMessage("Vehicle approved successfully.");
      await loadVehicles();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleReject(id) {
    try {
      setMessage("");
      setError("");
      await rejectVehicle(id);
      setMessage("Vehicle rejected successfully.");
      await loadVehicles();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const stats = useMemo(() => {
    const counts = {
      total: vehicles.length,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    vehicles.forEach((vehicle) => {
      const status = getVehicleApprovalStatus(vehicle);
      if (status === "approved") counts.approved += 1;
      if (status === "pending") counts.pending += 1;
      if (status === "rejected") counts.rejected += 1;
    });

    return counts;
  }, [vehicles]);

  const pendingQueue = useMemo(
    () => vehicles.filter((vehicle) => getVehicleApprovalStatus(vehicle) === "pending"),
    [vehicles]
  );

  if (loading) {
    return (
      <div className="space-y-10">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-32 rounded bg-slate-800" />
            <div className="h-8 w-72 rounded bg-slate-800" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-800" />
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
            <p className="mt-4 text-slate-400">Loading admin dashboard…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/30 p-6 shadow-xl sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            Admin Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Welcome, Admin{user?.email ? ` (${user.email.split("@")[0]})` : ""}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review marketplace listings, manage approval decisions, and monitor
            vehicle inventory across the platform.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Vehicles" value={stats.total} />
          <StatCard
            label="Approved Vehicles"
            value={stats.approved}
            accent="text-emerald-400"
          />
          <StatCard
            label="Pending Vehicles"
            value={stats.pending}
            accent="text-amber-400"
          />
          <StatCard
            label="Rejected Vehicles"
            value={stats.rejected}
            accent="text-red-400"
          />
        </div>
      </section>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              Approval Queue
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Review new vendor listings waiting for approval.
            </p>
          </div>
          <p className="text-sm text-slate-500">{pendingQueue.length} pending</p>
        </div>

        {pendingQueue.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-300">
              No vehicles pending approval.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              New vendor submissions will appear here for review.
            </p>
          </div>
        )}

        {pendingQueue.length > 0 && (
          <div className="mt-8 space-y-4">
            {pendingQueue.map((vehicle) => (
              <AdminVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              All Vehicle Listings
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Complete marketplace inventory with approval status.
            </p>
          </div>
          <p className="text-sm text-slate-500">{vehicles.length} listing(s)</p>
        </div>

        {vehicles.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-16 text-center text-slate-400">
            No vehicles found.
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {vehicles.map((vehicle) => (
              <AdminVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
