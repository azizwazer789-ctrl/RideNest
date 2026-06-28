import { useEffect, useState } from "react";
import {
  approvePayout,
  completePayout,
  getAdminPayouts,
  getErrorMessage,
  rejectPayout,
} from "../../services/api";
import { formatBookingDate } from "../../utils/formatDate";

const STATUS_STYLES = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300",
  approved: "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-300",
  completed: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-300",
};

function PayoutStatusBadge({ status }) {
  const key = String(status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] || "border-slate-500/30 bg-slate-500/15 text-slate-500";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style}`}>
      {key || "unknown"}
    </span>
  );
}

function VendorPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPayouts() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminPayouts();
        if (!cancelled) setPayouts(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!cancelled) {
          setPayouts([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPayouts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshPayouts() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminPayouts();
      setPayouts(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setPayouts([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(payoutId, action, actionFn, successText) {
    if (updatingId != null) return;

    setUpdatingId(payoutId);
    setMessage("");
    setError("");

    try {
      await actionFn(payoutId);
      setMessage(successText);
      await refreshPayouts();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Vendor Payouts
        </h2>
        <p className="mt-1 text-sm text-slate-500">{payouts.length} payout request(s)</p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {payouts.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No payout requests yet
          </p>
        </div>
      )}

      {payouts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {payouts.map((payout) => {
              const status = String(payout.payout_status ?? "").toLowerCase();
              const isUpdating = updatingId === payout.id;

              return (
                <li key={payout.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Payout #{payout.id}
                      </p>
                      <PayoutStatusBadge status={payout.payout_status} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-slate-400 dark:text-slate-500">Vendor:</span>{" "}
                      #{payout.vendor_id} ·{" "}
                      <span className="text-slate-400 dark:text-slate-500">Method:</span>{" "}
                      {payout.payout_method}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-slate-400 dark:text-slate-500">Requested:</span>{" "}
                      {formatBookingDate(payout.requested_at)}
                      {payout.processed_at && (
                        <>
                          {" "}
                          · <span className="text-slate-400 dark:text-slate-500">Processed:</span>{" "}
                          {formatBookingDate(payout.processed_at)}
                        </>
                      )}
                    </p>
                    {payout.reference && (
                      <p className="text-xs text-slate-400">Ref: {payout.reference}</p>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      PKR {Number(payout.amount ?? 0).toLocaleString()}
                    </p>

                    {status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleAction(payout.id, "approve", approvePayout, "Payout approved.")
                          }
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Working…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleAction(payout.id, "reject", rejectPayout, "Payout rejected.")
                          }
                          className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                        >
                          {isUpdating ? "Working…" : "Reject"}
                        </button>
                      </div>
                    )}

                    {status === "approved" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleAction(payout.id, "complete", completePayout, "Payout completed.")
                        }
                        className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating ? "Working…" : "Mark Completed"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VendorPayouts;
