import { useCallback, useEffect, useState } from "react";
import AdminVehicleCard from "../../components/dashboard/AdminVehicleCard";
import {
  approveVehicle,
  getAdminVehicles,
  getErrorMessage,
  rejectVehicle,
} from "../../services/api";

function AllListings() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminVehicles();
      setVehicles(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setVehicles([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

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
        <p className="mt-1 text-sm text-slate-500">{vehicles.length} listing(s)</p>
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
    </div>
  );
}

export default AllListings;
