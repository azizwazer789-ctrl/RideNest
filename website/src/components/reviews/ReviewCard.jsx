import { formatBookingDate } from "../../utils/formatDate";
import RatingStars from "./RatingStars";
import ReviewForm from "./ReviewForm";

/**
 * A single review. The backend doesn't return a reviewer name (only
 * customer_id), so the current user's own review is labeled "You" and
 * every other reviewer is shown generically as "Customer #<id>".
 */
function ReviewCard({
  review,
  isOwn = false,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  editSubmitting = false,
  editError = "",
  onDelete,
  deleting = false,
}) {
  if (isEditing) {
    return (
      <ReviewForm
        initialRating={review.rating}
        initialComment={review.comment || ""}
        onSubmit={onSubmitEdit}
        onCancel={onCancelEdit}
        submitting={editSubmitting}
        error={editError}
        submitLabel="Save Changes"
      />
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {isOwn ? "You" : `Customer #${review.customer_id}`}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatBookingDate(review.created_at)}
          </p>
        </div>

        <RatingStars rating={review.rating} size="sm" />
      </div>

      {review.comment && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
      )}

      {isOwn && (
        <div className="mt-4 flex gap-4 border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onStartEdit}
            className="text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-sm font-medium text-red-600 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </article>
  );
}

export default ReviewCard;
