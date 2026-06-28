import { useEffect, useState } from "react";
import MonthlyTrendBars from "../../components/dashboard/MonthlyTrendBars";
import {
  getAdminAnalyticsBookings,
  getAdminAnalyticsOverview,
  getAdminTopVehicles,
  getAdminTopVendors,
  getErrorMessage,
} from "../../services/api";

function StatCard({ label, value, accent = "text-slate-900 dark:text-white" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function formatCurrency(value) {
  return `PKR ${Number(value ?? 0).toLocaleString()}`;
}

const STATUS_KEYS = ["pending", "confirmed", "completed", "cancelled"];
const STATUS_ACCENTS = {
  pending: "text-amber-600 dark:text-amber-400",
  confirmed: "text-sky-600 dark:text-sky-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  cancelled: "text-red-600 dark:text-red-400",
};

function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({});

  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [topVehicles, setTopVehicles] = useState([]);
  const [topVendors, setTopVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const params = {
        start_date: appliedRange.start_date || undefined,
        end_date: appliedRange.end_date || undefined,
      };

      const results = await Promise.allSettled([
        getAdminAnalyticsOverview(params),
        getAdminAnalyticsBookings(params),
        getAdminTopVehicles(params),
        getAdminTopVendors(params),
      ]);

      if (cancelled) return;

      const [overviewResult, bookingsResult, topVehiclesResult, topVendorsResult] = results;
      const errors = [];

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      } else {
        setOverview(null);
        errors.push(getErrorMessage(overviewResult.reason));
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value);
      } else {
        setBookings(null);
        errors.push(getErrorMessage(bookingsResult.reason));
      }

      if (topVehiclesResult.status === "fulfilled") {
        setTopVehicles(
          Array.isArray(topVehiclesResult.value)
            ? topVehiclesResult.value
            : topVehiclesResult.value?.items || []
        );
      } else {
        setTopVehicles([]);
      }

      if (topVendorsResult.status === "fulfilled") {
        setTopVendors(
          Array.isArray(topVendorsResult.value)
            ? topVendorsResult.value
            : topVendorsResult.value?.items || []
        );
      } else {
        setTopVendors([]);
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [appliedRange]);

  function handleApplyRange(event) {
    event.preventDefault();
    setAppliedRange({ start_date: startDate, end_date: endDate });
  }

  function handleClearRange() {
    setStartDate("");
    setEndDate("");
    setAppliedRange({});
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
        <p className="mt-4 text-slate-500">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Analytics Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide booking, revenue, and ranking trends.
        </p>
      </div>

      <form
        onSubmit={handleApplyRange}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={handleClearRange}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 dark:border-slate-600 dark:text-slate-200"
        >
          Clear
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={overview.total_users} />
          <StatCard label="Total Bookings" value={overview.total_bookings} accent="text-orange-600 dark:text-orange-400" />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(overview.total_revenue)}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Average Rating"
            value={overview.average_rating != null ? overview.average_rating.toFixed(1) : "—"}
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {bookings && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Bookings by Status
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {STATUS_KEYS.map((key) => (
                <div key={key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs capitalize text-slate-500">{key}</p>
                  <p className={`mt-1 text-xl font-bold ${STATUS_ACCENTS[key]}`}>
                    {bookings.bookings_by_status?.[key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Monthly Bookings
            </h3>
            <div className="mt-4">
              <MonthlyTrendBars
                data={bookings.monthly_bookings}
                labelKey="month"
                valueKey="bookings"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Vehicles</h3>
          {topVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No vehicle revenue data for this period.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {topVehicles.map((vehicle) => (
                <li key={vehicle.vehicle_id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {vehicle.title}
                    </p>
                    <p className="text-xs text-slate-500">{vehicle.total_bookings} booking(s)</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(vehicle.total_revenue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Vendors</h3>
          {topVendors.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No vendor revenue data for this period.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {topVendors.map((vendor) => (
                <li key={vendor.vendor_id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {vendor.vendor_name}
                    </p>
                    <p className="text-xs text-slate-500">{vendor.total_bookings} booking(s)</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(vendor.total_revenue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
