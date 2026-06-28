import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboardStats, getErrorMessage } from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminDashboardStats();
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setStats(null);
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

        {stats && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Users" value={stats.total_users} />
              <StatCard
                label="Customers"
                value={stats.total_customers}
                accent="text-sky-600 dark:text-sky-400"
              />
              <StatCard
                label="Vendors"
                value={stats.total_vendors}
                accent="text-purple-600 dark:text-purple-400"
              />
              <StatCard
                label="Total Bookings"
                value={stats.total_bookings}
                accent="text-orange-600 dark:text-orange-400"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Vehicles" value={stats.total_vehicles} />
              <StatCard
                label="Approved"
                value={stats.approved_vehicles}
                accent="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Pending"
                value={stats.pending_vehicles}
                accent="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Total Revenue"
                value={`PKR ${Number(stats.total_revenue ?? 0).toLocaleString()}`}
                accent="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/dashboard/queue"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-500/50 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-900 dark:text-white">Approval Queue</p>
          <p className="mt-1 text-sm text-slate-500">Review pending vehicles</p>
        </Link>
        <Link
          to="/dashboard/payouts"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-500/50 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-900 dark:text-white">Vendor Payouts</p>
          <p className="mt-1 text-sm text-slate-500">Approve withdrawal requests</p>
        </Link>
        <Link
          to="/dashboard/analytics"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-500/50 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-900 dark:text-white">Analytics</p>
          <p className="mt-1 text-sm text-slate-500">Platform-wide trends</p>
        </Link>
        <Link
          to="/dashboard/reviews"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-500/50 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-900 dark:text-white">Reviews</p>
          <p className="mt-1 text-sm text-slate-500">Moderate vehicle reviews</p>
        </Link>
      </section>
    </div>
  );
}

export default Overview;
