import { useState } from "react";
import RatingStars from "./RatingStars";

/**
 * Shared create/edit form. The caller decides what `onSubmit` does
 * (POST /reviews vs PUT /reviews/{id}) and supplies initial values.
 */
function ReviewForm({
  initialRating = 0,
  initialComment = "",
  onSubmit,
  onCancel,
  submitting = false,
  error = "",
  submitLabel = "Submit Review",
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setValidationError("Please select a star rating.");
      return;
    }

    setValidationError("");
    await onSubmit({ rating, comment: comment.trim() || null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
    >
      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Your rating
        </span>
        <div className="mt-2">
          <RatingStars rating={rating} interactive size="lg" onChange={setRating} />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Comment (optional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this vehicle..."
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      {(validationError || error) && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
          {validationError || error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReviewForm;
