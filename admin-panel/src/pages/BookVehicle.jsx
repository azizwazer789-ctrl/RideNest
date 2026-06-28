import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createBooking, getErrorMessage, getVehicle } from "../services/api";
import { getUserFromToken } from "../utils/jwt";
import { calculateRentalDays } from "../utils/rentalDays";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

function BookVehicle() {
  const { id } = useParams();
  const user = getUserFromToken();

  const [vehicle, setVehicle] = useState(null);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    pickup_location: "",
    dropoff_location: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
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

  const totalDays = useMemo(
    () => calculateRentalDays(form.start_date, form.end_date),
    [form.start_date, form.end_date]
  );

  const estimatedTotal = vehicle ? totalDays * Number(vehicle.price_per_day) : 0;

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.start_date || !form.end_date || !form.pickup_location || !form.dropoff_location) {
      setError("Please fill all fields.");
      return;
    }

    if (totalDays <= 0) {
      setError("End date must be on or after start date.");
      return;
    }

    try {
      setSubmitting(true);

      await createBooking({
        vehicle_id: Number(id),
        start_date: form.start_date,
        end_date: form.end_date,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
      });

      setMessage("Booking created successfully.");
      setForm({
        start_date: "",
        end_date: "",
        pickup_location: "",
        dropoff_location: "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="mx-auto max-w-lg py-16 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-12 shadow-xl">
          <p className="text-lg text-slate-300">Please login as a customer to book.</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  if (user.role !== "customer") {
    return (
      <section className="mx-auto max-w-lg py-16 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-12 shadow-xl">
          <p className="text-lg text-slate-300">
            Only customer accounts can create bookings.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-24">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
            aria-hidden="true"
          />
          <p className="mt-4 text-slate-400">Loading booking page…</p>
        </div>
      </section>
    );
  }

  if (error && !vehicle) {
    return (
      <section className="mx-auto max-w-2xl">
        <div
          role="alert"
          className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-8 text-center text-red-300"
        >
          {String(error)}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Secure Booking
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Complete Your Reservation
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Review vehicle details and confirm your trip dates to reserve instantly.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {vehicle && (
          <aside className="lg:col-span-2">
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <div className="aspect-[16/10] overflow-hidden bg-slate-800">
                <img
                  src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                  onError={handleVehicleImageError}
                />
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{vehicle.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Per Day
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">
                      PKR {Number(vehicle.price_per_day ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Per Hour
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      PKR {Number(vehicle.price_per_hour ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
                    <span className="text-slate-500">Location</span>
                    <span className="text-right font-medium">
                      {vehicle.city}, {vehicle.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Driver</span>
                    <span
                      className={
                        vehicle.with_driver_available
                          ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300"
                          : "rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400"
                      }
                    >
                      {vehicle.with_driver_available ? "Available" : "Not Available"}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/vehicles/${id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-white"
                >
                  View Vehicle Details
                </Link>
              </div>
            </div>
          </aside>
        )}

        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8">
            {message && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <h2 className="text-xl font-semibold text-white">Booking Details</h2>
            <p className="mt-1 text-sm text-slate-400">
              Enter pickup and return information for your trip.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="pickup_location"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Pickup Location
                  </label>
                  <input
                    id="pickup_location"
                    type="text"
                    name="pickup_location"
                    value={form.pickup_location}
                    onChange={handleChange}
                    placeholder="Example: F-10 Islamabad"
                    className={inputClassName}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="dropoff_location"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Dropoff Location
                  </label>
                  <input
                    id="dropoff_location"
                    type="text"
                    name="dropoff_location"
                    value={form.dropoff_location}
                    onChange={handleChange}
                    placeholder="Example: F-10 Islamabad"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="start_date"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    min={today}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="end_date"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    min={form.start_date || today}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Booking Summary
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Rental duration</span>
                    <span className="font-medium">{totalDays} day(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Daily rate</span>
                    <span className="font-medium">
                      PKR {Number(vehicle?.price_per_day ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total amount preview</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        PKR {estimatedTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Booking…" : "Confirm Booking"}
                </button>

                <Link
                  to={`/vehicles/${id}`}
                  className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-white"
                >
                  Back to Details
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookVehicle;
