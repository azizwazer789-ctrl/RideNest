import { useEffect, useState } from "react";
import MonthlyTrendBars from "../../components/dashboard/MonthlyTrendBars";
import {
  getAdminAnalyticsOverview,
  getAdminAnalyticsRevenue,
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

function PaymentsOverview() {
  const [revenue, setRevenue] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const [revenueResult, overviewResult] = await Promise.allSettled([
        getAdminAnalyticsRevenue(),
        getAdminAnalyticsOverview(),
      ]);

      if (cancelled) return;

      const errors = [];

      if (revenueResult.status === "fulfilled") {
        setRevenue(revenueResult.value);
      } else {
        errors.push(getErrorMessage(revenueResult.reason));
      }

      if (overviewResult.status === "fulfilled") {
        setEarnings(overviewResult.value.earnings_summary || null);
      } else {
        errors.push(getErrorMessage(overviewResult.reason));
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
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
        <p className="mt-4 text-slate-500">Loading payments overview…</p>
      </div>
    );
  }

  const hasData = Boolean(revenue || earnings);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Payments Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide revenue and earnings, derived from booking payments.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {!hasData && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          No payment data available yet.
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(revenue?.total_revenue)}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Platform Commission"
              value={formatCurrency(earnings?.total_platform_commission)}
              accent="text-orange-600 dark:text-orange-400"
            />
            <StatCard
              label="Vendor Earnings"
              value={formatCurrency(earnings?.total_vendor_earnings)}
            />
            <StatCard
              label="Paid Out"
              value={formatCurrency(earnings?.total_paid_out)}
              accent="text-sky-600 dark:text-sky-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Pending Payout Amount"
              value={formatCurrency(earnings?.pending_payout_amount)}
              accent="text-amber-600 dark:text-amber-400"
            />
          </div>

          {revenue?.monthly_revenue && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Revenue
              </h3>
              <div className="mt-4">
                <MonthlyTrendBars
                  data={revenue.monthly_revenue}
                  labelKey="month"
                  valueKey="revenue"
                  formatValue={formatCurrency}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PaymentsOverview;
