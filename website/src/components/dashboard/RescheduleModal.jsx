import { useMemo, useState } from "react";
import Modal from "../Modal";
import { getErrorMessage, rescheduleBooking } from "../../services/api";
import { calculateRentalDays } from "../../utils/rentalDays";

const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

function RescheduleModal({ booking, vehicle, onClose, onRescheduled }) {
  const [startDate, setStartDate] = useState(booking?.start_date ?? "");
  const [endDate, setEndDate] = useState(booking?.end_date ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const totalDays = useMemo(
    () => calculateRentalDays(startDate, endDate),
    [startDate, endDate]
  );
  const estimatedTotal =
    vehicle && totalDays > 0 ? totalDays * Number(vehicle.price_per_day ?? 0) : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both a new start and end date.");
      return;
    }

    if (totalDays <= 0) {
      setError("End date must be on or after start date.");
      return;
    }

    setSubmitting(true);

    try {
      await rescheduleBooking(booking.id, { start_date: startDate, end_date: endDate });
      onRescheduled();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(booking)} onClose={onClose} title={`Reschedule Booking #${booking?.id ?? ""}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="reschedule_start_date"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New Start Date
            </label>
            <input
              id="reschedule_start_date"
              type="date"
              value={startDate}
              min={today}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="reschedule_end_date"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New End Date
            </label>
            <input
              id="reschedule_end_date"
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(event) => setEndDate(event.target.value)}
              required
              className={inputClassName}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Updated Price
          </h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Rental duration</span>
              <span className="font-medium">
                {totalDays > 0 ? `${totalDays} day(s)` : "—"}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New total</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {estimatedTotal != null
                    ? `PKR ${estimatedTotal.toLocaleString()}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RescheduleModal;
