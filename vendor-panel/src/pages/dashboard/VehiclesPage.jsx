import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getErrorMessage, getMyVendorVehicles } from "../../services/api";
import {
  getVendorApprovalStatus,
  vendorApprovalBadgeLabels,
  vendorApprovalBadgeStyles,
} from "../../utils/vendorVehicle";

const websiteUrl = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyVendorVehicles();
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

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            My Vehicle Listings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {vehicles.length} listing(s) in your fleet
          </p>
        </div>
        <Link
          to="/add-vehicle"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          Add Vehicle
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && vehicles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No vehicles yet
          </p>
          <Link
            to="/add-vehicle"
            className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950"
          >
            Add your first vehicle
          </Link>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const status = getVendorApprovalStatus(vehicle);
            return (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800">
                  <img
                    src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
                    alt={vehicle.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {vehicle.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${vendorApprovalBadgeStyles[status]}`}
                    >
                      {vendorApprovalBadgeLabels[status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                  <p className="mt-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    PKR {Number(vehicle.price_per_day ?? 0).toLocaleString()} / day
                  </p>
                  <a
                    href={`${websiteUrl}/vehicles/${vehicle.id}`}
                    className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white dark:text-slate-950"
                  >
                    View on Website
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VehiclesPage;
