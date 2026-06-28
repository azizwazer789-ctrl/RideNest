import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton";
import { getErrorMessage, getMyFavorites, getVehicles } from "../services/api";
import { getUserFromToken } from "../utils/jwt";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setLoading(true);
      setError("");

      try {
        const data = await getVehicles();

        if (!cancelled) {
          setVehicles(Array.isArray(data) ? data : data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== "customer") return;

    let cancelled = false;

    getMyFavorites()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.items || [];
        setFavoriteIds(new Set(list.map((vehicle) => vehicle.id)));
      })
      .catch(() => {
        // Favorites are a secondary affordance here; a failed prefetch
        // just leaves every heart showing as "not saved".
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleFavoriteChange(vehicleId, nextIsFavorited) {
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (nextIsFavorited) {
        next.add(vehicleId);
      } else {
        next.delete(vehicleId);
      }
      return next;
    });
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Vehicles</h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Explore approved cars available for booking across Pakistan.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
            aria-hidden="true"
          />

          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading vehicles…</p>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center text-red-600 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {!loading && !error && vehicles.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No vehicles available
          </p>

          <p className="mt-2 text-slate-500">
            Check back soon — new listings are added regularly.
          </p>
        </div>
      )}

      {!loading && !error && vehicles.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <article
              key={vehicle.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <img
                  src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                  onError={handleVehicleImageError}
                />

                <FavoriteButton
                  vehicleId={vehicle.id}
                  isFavorited={favoriteIds.has(vehicle.id)}
                  onChange={(next) => handleFavoriteChange(vehicle.id, next)}
                  className="absolute right-3 top-3 shadow-md"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {vehicle.title}
              </h2>

              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400/90">
                {vehicle.brand} {vehicle.model} · {vehicle.year}
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  <span className="text-slate-500">Location:</span>{" "}
                  {vehicle.city}, {vehicle.location}
                </p>

                <p>
                  <span className="text-slate-500">Type:</span>{" "}
                  {vehicle.car_type}
                </p>

                <p>
                  <span className="text-slate-500">Transmission:</span>{" "}
                  {vehicle.transmission}
                </p>

                <p>
                  <span className="text-slate-500">Fuel:</span>{" "}
                  {vehicle.fuel_type}
                </p>

                <p>
                  <span className="text-slate-500">Seats:</span>{" "}
                  {vehicle.seating_capacity}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  PKR {Number(vehicle.price_per_day ?? 0).toLocaleString()}/day
                </span>

                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  PKR {Number(vehicle.price_per_hour ?? 0).toLocaleString()}/hr
                </span>

                {vehicle.with_driver_available && (
                  <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    Driver available
                  </span>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
                >
                  View Details
                </Link>

                <Link
                  to={`/book/${vehicle.id}`}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-white"
                >
                  Book Now
                </Link>
              </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Vehicles;