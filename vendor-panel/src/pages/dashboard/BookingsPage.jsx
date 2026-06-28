import { useCallback, useEffect, useState } from "react";
import BookingCard from "../../components/BookingCard";
import {
  confirmBooking,
  getErrorMessage,
  getVendorBookings,
  rejectBooking,
} from "../../services/api";

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const refreshBookings = useCallback(async () => {
    const data = await getVendorBookings();
    setBookings(Array.isArray(data) ? data : data?.items || []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getVendorBookings();
        if (!cancelled) {
          setBookings(Array.isArray(data) ? data : data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setBookings([]);
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

  async function handleBookingAction(bookingId, action) {
    if (updatingId != null) return;

    setUpdatingId(bookingId);
    setError("");
    setSuccess("");

    try {
      if (action === "confirm") {
        await confirmBooking(bookingId);
        setSuccess("Booking accepted successfully.");
      } else {
        await rejectBooking(bookingId);
        setSuccess("Booking rejected successfully.");
      }
      await refreshBookings();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Booking Requests
        </h2>
        <p className="mt-1 text-sm text-slate-500">{bookings.length} total booking(s)</p>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && bookings.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No bookings received yet
          </p>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              showCustomerId
              onConfirm={(id) => handleBookingAction(id, "confirm")}
              onReject={(id) => handleBookingAction(id, "reject")}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingsPage;
