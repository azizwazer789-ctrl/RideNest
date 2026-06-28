import { useEffect, useMemo, useState } from "react";
import { getAdminVehicles, getErrorMessage } from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";
import { getVehicleApprovalStatus } from "../../utils/vehicleApproval";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminVehicles();
        if (!cancelled) {
          setVehicles(Array.isArray(data) ? data : data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setVehicles([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const counts = { total: vehicles.length, approved: 0, pending: 0, rejected: 0 };
    vehicles.forEach((vehicle) => {
      const status = getVehicleApprovalStatus(vehicle);
      if (status === "approved") counts.approved += 1;
      if (status === "pending") counts.pending += 1;
      if (status === "rejected") counts.rejected += 1;
    });
    return counts;
  }, [vehicles]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-orange-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/30 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Welcome, Admin{user?.email ? ` (${user.email.split("@")[0]})` : ""}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          Review marketplace listings, manage approval decisions, and monitor
          vehicle inventory across the platform.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Vehicles" value={stats.total} />
          <StatCard label="Approved" value={stats.approved} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Pending" value={stats.pending} accent="text-amber-600 dark:text-amber-400" />
          <StatCard label="Rejected" value={stats.rejected} accent="text-red-600 dark:text-red-400" />
        </div>
      </section>
    </div>
  );
}

export default Overview;
