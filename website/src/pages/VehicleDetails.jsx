import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import FavoriteButton from "../components/FavoriteButton";
import RatingStars from "../components/reviews/RatingStars";
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewList from "../components/reviews/ReviewList";
import {
  createConversation,
  createReview,
  deleteReview,
  getErrorMessage,
  getMyBookings,
  getMyConversations,
  getMyFavorites,
  getMyReviews,
  getVehicle,
  getVehicleReviews,
  updateReview,
} from "../services/api";
import { getUserFromToken } from "../utils/jwt";

const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  const currentUser = getUserFromToken();

  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [eligibleBookingId, setEligibleBookingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingReviewId, setDeletingReviewId] = useState(null);

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

  useEffect(() => {
    const user = getUserFromToken();
    if (!user || user.role !== "customer" || !id) return;

    let cancelled = false;

    getMyFavorites()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.items || [];
        setIsFavorited(list.some((favorite) => String(favorite.id) === String(id)));
      })
      .catch(() => {
        // Non-critical prefetch; the button simply starts as "not saved".
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function refreshReviews() {
    if (!id) return;

    setReviewsLoading(true);
    setReviewsError("");

    try {
      const data = await getVehicleReviews(id);
      const items = Array.isArray(data) ? data : data?.items || [];
      setReviews(items);
      setAverageRating(typeof data?.average_rating === "number" ? data.average_rating : 0);
      setTotalReviews(
        typeof data?.total_reviews === "number" ? data.total_reviews : items.length
      );
    } catch (err) {
      setReviewsError(getErrorMessage(err));
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!id) return;

      setReviewsLoading(true);
      setReviewsError("");

      try {
        const data = await getVehicleReviews(id);
        const items = Array.isArray(data) ? data : data?.items || [];

        if (!cancelled) {
          setReviews(items);
          setAverageRating(
            typeof data?.average_rating === "number" ? data.average_rating : 0
          );
          setTotalReviews(
            typeof data?.total_reviews === "number" ? data.total_reviews : items.length
          );
        }
      } catch (err) {
        if (!cancelled) {
          setReviewsError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // A customer is eligible to review this vehicle once they have a
  // completed booking for it that they haven't already reviewed (one
  // review per booking, enforced by the backend).
  async function refreshEligibility() {
    const user = getUserFromToken();
    if (!user || user.role !== "customer" || !id) {
      setEligibleBookingId(null);
      return;
    }

    try {
      const [bookingsData, myReviewsData] = await Promise.all([
        getMyBookings(),
        getMyReviews(),
      ]);

      const bookings = Array.isArray(bookingsData) ? bookingsData : bookingsData?.items || [];
      const myReviews = Array.isArray(myReviewsData)
        ? myReviewsData
        : myReviewsData?.items || [];
      const reviewedBookingIds = new Set(myReviews.map((review) => review.booking_id));

      const eligibleBooking = bookings.find(
        (booking) =>
          String(booking.vehicle_id) === String(id) &&
          booking.booking_status === "completed" &&
          !reviewedBookingIds.has(booking.id)
      );

      setEligibleBookingId(eligibleBooking ? eligibleBooking.id : null);
    } catch {
      setEligibleBookingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkEligibility() {
      const user = getUserFromToken();
      if (!user || user.role !== "customer" || !id) {
        if (!cancelled) setEligibleBookingId(null);
        return;
      }

      try {
        const [bookingsData, myReviewsData] = await Promise.all([
          getMyBookings(),
          getMyReviews(),
        ]);

        const bookings = Array.isArray(bookingsData)
          ? bookingsData
          : bookingsData?.items || [];
        const myReviews = Array.isArray(myReviewsData)
          ? myReviewsData
          : myReviewsData?.items || [];
        const reviewedBookingIds = new Set(myReviews.map((review) => review.booking_id));

        const eligibleBooking = bookings.find(
          (booking) =>
            String(booking.vehicle_id) === String(id) &&
            booking.booking_status === "completed" &&
            !reviewedBookingIds.has(booking.id)
        );

        if (!cancelled) {
          setEligibleBookingId(eligibleBooking ? eligibleBooking.id : null);
        }
      } catch {
        if (!cancelled) setEligibleBookingId(null);
      }
    }

    checkEligibility();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleMessageVendor() {
    if (!vehicle) return;

    setMessaging(true);
    setMessageError("");

    try {
      const existingData = await getMyConversations();
      const existingList = Array.isArray(existingData)
        ? existingData
        : existingData?.items || [];
      const existing = existingList.find(
        (conversation) =>
          String(conversation.vendor_id) === String(vehicle.vendor_id) &&
          !conversation.booking_id
      );

      const conversation = existing || (await createConversation({ vendor_id: vehicle.vendor_id }));
      navigate(`/conversations/${conversation.id}`);
    } catch (err) {
      setMessageError(getErrorMessage(err));
    } finally {
      setMessaging(false);
    }
  }

  async function handleCreateSubmit({ rating, comment }) {
    if (!eligibleBookingId) return;

    setCreating(true);
    setCreateError("");

    try {
      await createReview({ booking_id: eligibleBookingId, rating, comment });
      setShowCreateForm(false);
      await refreshReviews();
      await refreshEligibility();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function handleStartEdit(review) {
    setEditingReviewId(review.id);
    setEditError("");
  }

  function handleCancelEdit() {
    setEditingReviewId(null);
    setEditError("");
  }

  async function handleSubmitEdit(reviewId, { rating, comment }) {
    setEditSubmitting(true);
    setEditError("");

    try {
      await updateReview(reviewId, { rating, comment });
      setEditingReviewId(null);
      await refreshReviews();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    setDeletingReviewId(reviewId);

    try {
      await deleteReview(reviewId);
      await refreshReviews();
      await refreshEligibility();
    } catch (err) {
      setReviewsError(getErrorMessage(err));
    } finally {
      setDeletingReviewId(null);
    }
  }

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
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="h-72 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
            <img
              src={vehicle.image_url || FALLBACK_VEHICLE_IMAGE}
              alt={vehicle.title}
              className="h-full w-full object-cover"
              onError={handleVehicleImageError}
            />
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {vehicle.title}
              </h1>

              <FavoriteButton
                vehicleId={vehicle.id}
                isFavorited={isFavorited}
                onChange={setIsFavorited}
                className="mt-1 shrink-0"
              />
            </div>

            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {vehicle.brand} {vehicle.model} · {vehicle.year}
            </p>

            {!reviewsLoading && totalReviews > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <RatingStars rating={averageRating} size="sm" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {averageRating.toFixed(1)} · {totalReviews}{" "}
                  {totalReviews === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            <div className="mt-6 space-y-3 text-slate-600 dark:text-slate-400">
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

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-slate-600 dark:text-slate-400">Pricing</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                PKR {vehicle.price_per_day?.toLocaleString()} / day
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                PKR {vehicle.price_per_hour?.toLocaleString()} / hour
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/book/${vehicle.id}`}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Book Now
              </Link>

              {currentUser?.role === "customer" && (
                <button
                  type="button"
                  onClick={handleMessageVendor}
                  disabled={messaging}
                  className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
                >
                  {messaging ? "Opening…" : "Message Vendor"}
                </button>
              )}

              <Link
                to="/vehicles"
                className="rounded-lg border border-slate-300 px-6 py-3 text-slate-700 transition hover:border-emerald-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400"
              >
                Back
              </Link>
            </div>

            {messageError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-300">{messageError}</p>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Description</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {vehicle.description || "No description provided."}
          </p>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Reviews &amp; Ratings
              </h2>
              {!reviewsLoading && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {totalReviews > 0
                    ? `${averageRating.toFixed(1)} average · ${totalReviews} ${
                        totalReviews === 1 ? "review" : "reviews"
                      }`
                    : "No reviews yet"}
                </p>
              )}
            </div>

            {eligibleBookingId && !showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Write a Review
              </button>
            )}
          </div>

          {showCreateForm && (
            <div className="mt-5">
              <ReviewForm
                onSubmit={handleCreateSubmit}
                onCancel={() => {
                  setShowCreateForm(false);
                  setCreateError("");
                }}
                submitting={creating}
                error={createError}
                submitLabel="Submit Review"
              />
            </div>
          )}

          <div className="mt-6">
            <ReviewList
              reviews={reviews}
              loading={reviewsLoading}
              error={reviewsError}
              currentUserId={currentUser?.id}
              editingReviewId={editingReviewId}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={handleSubmitEdit}
              editSubmitting={editSubmitting}
              editError={editError}
              onDelete={handleDeleteReview}
              deletingReviewId={deletingReviewId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default VehicleDetails;