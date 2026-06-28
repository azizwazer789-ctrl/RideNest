import { useEffect, useState } from "react";
import {
  deleteReview,
  getAdminVehicles,
  getErrorMessage,
  getVehicleReviews,
} from "../../services/api";
import { formatBookingDate } from "../../utils/formatDate";

const PAGE_SIZE = 8;

function Stars({ rating }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-slate-300 dark:text-slate-700">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function ReviewsModeration() {
  const [vehicles, setVehicles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      setVehiclesLoading(true);
      setVehiclesError("");
      try {
        const data = await getAdminVehicles({ page, limit: PAGE_SIZE });
        const items = Array.isArray(data) ? data : data?.items || [];
        if (!cancelled) {
          setVehicles(items);
          setTotalPages(Array.isArray(data) ? 1 : data?.pages || 1);
        }
      } catch (err) {
        if (!cancelled) {
          setVehicles([]);
          setVehiclesError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setVehiclesLoading(false);
      }
    }

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [page]);

  async function loadReviews(vehicle) {
    setReviewsLoading(true);
    setReviewsError("");
    setMessage("");

    try {
      const data = await getVehicleReviews(vehicle.id);
      const items = Array.isArray(data) ? data : data?.items || [];
      setReviews(items);
      setAverageRating(typeof data?.average_rating === "number" ? data.average_rating : 0);
      setTotalReviews(typeof data?.total_reviews === "number" ? data.total_reviews : items.length);
    } catch (err) {
      setReviews([]);
      setReviewsError(getErrorMessage(err));
    } finally {
      setReviewsLoading(false);
    }
  }

  function handleSelectVehicle(vehicle) {
    setSelectedVehicle(vehicle);
    loadReviews(vehicle);
  }

  async function handleDelete(reviewId) {
    if (deletingId != null) return;

    setDeletingId(reviewId);
    setMessage("");
    setReviewsError("");

    try {
      await deleteReview(reviewId);
      setMessage("Review removed.");
      await loadReviews(selectedVehicle);
    } catch (err) {
      setReviewsError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Reviews Moderation
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a vehicle to view and moderate its customer reviews.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vehicles</h3>

          {vehiclesLoading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
            </div>
          )}

          {!vehiclesLoading && vehiclesError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">{vehiclesError}</p>
          )}

          {!vehiclesLoading && !vehiclesError && vehicles.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No vehicles found.</p>
          )}

          {!vehiclesLoading && vehicles.length > 0 && (
            <ul className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto">
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicle?.id === vehicle.id;
                return (
                  <li key={vehicle.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectVehicle(vehicle)}
                      className={[
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-orange-500/15 text-orange-700 dark:text-orange-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                      ].join(" ")}
                    >
                      <p className="truncate font-medium">{vehicle.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        #{vehicle.id} · {vehicle.city}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600"
              >
                Prev
              </button>
              <span className="text-slate-500">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {!selectedVehicle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a vehicle from the list to view its reviews.
            </p>
          )}

          {selectedVehicle && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {selectedVehicle.title}
                  </h3>
                  {!reviewsLoading && totalReviews > 0 && (
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Stars rating={averageRating} />
                      {averageRating.toFixed(1)} · {totalReviews}{" "}
                      {totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  )}
                </div>
              </div>

              {message && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                  {message}
                </div>
              )}

              {reviewsError && (
                <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-300">
                  {reviewsError}
                </div>
              )}

              {reviewsLoading && (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />
                </div>
              )}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                  No reviews for this vehicle yet.
                </p>
              )}

              {!reviewsLoading && reviews.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Customer #{review.customer_id}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <Stars rating={review.rating} />
                            {formatBookingDate(review.created_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={deletingId === review.id}
                          onClick={() => handleDelete(review.id)}
                          className="rounded-lg border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                        >
                          {deletingId === review.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {review.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewsModeration;
