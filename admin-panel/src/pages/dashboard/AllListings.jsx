import { useEffect, useState } from "react";
import AdminVehicleCard from "../../components/dashboard/AdminVehicleCard";
import {
  approveVehicle,
  getAdminVehicles,
  getErrorMessage,
  rejectVehicle,
} from "../../services/api";

const PAGE_SIZE = 10;

function AllListings() {
  const [vehicles, setVehicles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminVehicles({ page, limit: PAGE_SIZE });
        const items = Array.isArray(data) ? data : data?.items || [];
        if (!cancelled) {
          setVehicles(items);
          setTotalPages(Array.isArray(data) ? 1 : data?.pages || 1);
          setTotal(Array.isArray(data) ? items.length : data?.total ?? items.length);
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

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [page]);

  async function refreshVehicles() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminVehicles({ page, limit: PAGE_SIZE });
      const items = Array.isArray(data) ? data : data?.items || [];
      setVehicles(items);
      setTotalPages(Array.isArray(data) ? 1 : data?.pages || 1);
      setTotal(Array.isArray(data) ? items.length : data?.total ?? items.length);
    } catch (err) {
      setVehicles([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      setMessage("");
      setError("");
      await approveVehicle(id);
      setMessage("Vehicle approved successfully.");
      await refreshVehicles();
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
      await refreshVehicles();
    } catch (err) {
      setError(getErrorMessage(err));
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
          All Vehicle Listings
        </h2>
        <p className="mt-1 text-sm text-slate-500">{total} listing(s) total</p>
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

      {vehicles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          No vehicles found.
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
          >
            Previous
          </button>
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-500 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AllListings;
