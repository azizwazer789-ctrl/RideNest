import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getErrorMessage, getVehicle } from "../services/api";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVehicle() {
      setLoading(true);
      setError("");
      setVehicle(null);

      try {
        const data = await getVehicle(id);
        if (!cancelled) {
          setVehicle(data);
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

    if (!id) return;

    loadVehicle();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-center text-slate-400">Loading vehicle...</p>;
  }

  if (error) {
    return <p className="text-center text-red-400">{error}</p>;
  }

  if (!vehicle) {
    return <p className="text-center text-slate-400">Vehicle not found.</p>;
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="h-72 overflow-hidden rounded-xl bg-slate-800">
            <img
              src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
              alt={vehicle.title}
              className="h-full w-full object-cover"
              onError={handleVehicleImageError}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-emerald-400">
              {vehicle.title}
            </h1>

            <p className="mt-2 text-slate-300">
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </p>

            <div className="mt-6 space-y-3 text-slate-400">
              <p>📍 {vehicle.city}, {vehicle.location}</p>
              <p>🚗 Type: {vehicle.car_type}</p>
              <p>⚙️ Transmission: {vehicle.transmission}</p>
              <p>⛽ Fuel: {vehicle.fuel_type}</p>
              <p>👥 Seats: {vehicle.seating_capacity}</p>
              <p>
                Driver:{" "}
                {vehicle.with_driver_available ? "Available" : "Not Available"}
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-slate-400">Pricing</p>
              <p className="mt-2 text-2xl font-bold text-white">
                PKR {vehicle.price_per_day?.toLocaleString()} / day
              </p>
              <p className="text-slate-400">
                PKR {vehicle.price_per_hour?.toLocaleString()} / hour
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to={`/book/${vehicle.id}`}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Book Now
              </Link>

              <Link
                to="/vehicles"
                className="rounded-lg border border-slate-700 px-6 py-3 text-slate-300 hover:border-emerald-400"
              >
                Back
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-xl font-semibold text-white">Description</h2>
          <p className="mt-3 text-slate-400">
            {vehicle.description || "No description provided."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default VehicleDetails;