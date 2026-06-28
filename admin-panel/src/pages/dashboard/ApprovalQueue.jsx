import { useEffect, useMemo, useState } from "react";
import AdminVehicleCard from "../../components/dashboard/AdminVehicleCard";
import {
  approveVehicle,
  getAllAdminVehicles,
  getErrorMessage,
  rejectVehicle,
} from "../../services/api";
import { getVehicleApprovalStatus } from "../../utils/vehicleApproval";

function ApprovalQueue() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // The backend has no status filter on /vehicles/admin/all, so every
  // page must be walked to find every pending vehicle, not just page 1.
  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setLoading(true);
      setError("");
      try {
        const data = await getAllAdminVehicles();
        if (!cancelled) setVehicles(data);
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
  }, []);

  async function refreshVehicles() {
    setLoading(true);
    setError("");
    try {
      const data = await getAllAdminVehicles();
      setVehicles(data);
    } catch (err) {
      setVehicles([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const pendingQueue = useMemo(
    () => vehicles.filter((v) => getVehicleApprovalStatus(v) === "pending"),
    [vehicles]
  );

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
          Approval Queue
        </h2>
        <p className="mt-1 text-sm text-slate-500">{pendingQueue.length} pending</p>
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

      {pendingQueue.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No vehicles pending approval
          </p>
        </div>
      )}

      {pendingQueue.length > 0 && (
        <div className="space-y-4">
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
    </div>
  );
}

export default ApprovalQueue;
