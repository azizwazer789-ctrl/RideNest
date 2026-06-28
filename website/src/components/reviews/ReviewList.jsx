import ReviewCard from "./ReviewCard";

function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function ReviewList({
  reviews,
  loading,
  error,
  currentUserId,
  editingReviewId,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  editSubmitting,
  editError,
  onDelete,
  deletingReviewId,
}) {
  if (loading) {
    return <ReviewListSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center text-red-600 dark:text-red-300"
      >
        {error}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-700 dark:text-slate-300">No reviews yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Be the first to share your experience with this vehicle.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isOwn={String(review.customer_id) === String(currentUserId)}
          isEditing={editingReviewId === review.id}
          onStartEdit={() => onStartEdit(review)}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={(data) => onSubmitEdit(review.id, data)}
          editSubmitting={editSubmitting}
          editError={editError}
          onDelete={() => onDelete(review.id)}
          deleting={deletingReviewId === review.id}
        />
      ))}
    </div>
  );
}

export default ReviewList;
