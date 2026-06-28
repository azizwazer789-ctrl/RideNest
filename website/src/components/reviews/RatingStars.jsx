const SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const STAR_PATH =
  "M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.8L10 14.9l-5.21 2.62 1-5.8-4.21-4.1 5.82-.85L10 1.5z";

/**
 * Read-only star display, or an interactive 1-5 star picker when
 * `interactive` is set (used by ReviewForm).
 */
function RatingStars({ rating = 0, size = "md", interactive = false, onChange }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Select a rating" : `Rated ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        const icon = (
          <svg
            viewBox="0 0 20 20"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            className={[
              sizeClass,
              filled ? "text-amber-400" : "text-slate-300 dark:text-slate-600",
            ].join(" ")}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
          </svg>
        );

        if (!interactive) {
          return <span key={star}>{icon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={star <= rating}
            className="rounded p-0.5 transition hover:scale-110"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

export default RatingStars;
