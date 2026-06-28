import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addFavorite, getErrorMessage, removeFavorite } from "../services/api";
import { getUserFromToken } from "../utils/jwt";

/**
 * Heart-shaped save/unsave toggle for a vehicle.
 *
 * Renders for any visitor: a logged-out click redirects to login, a
 * wrong-role click (vendor/admin) surfaces the backend's error inline.
 */
function FavoriteButton({ vehicleId, isFavorited, onChange, className = "" }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (pending) return;

    const user = getUserFromToken();
    if (!user) {
      navigate("/login");
      return;
    }

    setPending(true);
    setError("");

    try {
      if (isFavorited) {
        await removeFavorite(vehicleId);
        onChange?.(false);
      } else {
        await addFavorite(vehicleId);
        onChange?.(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? "Remove from saved vehicles" : "Save vehicle"}
        title={isFavorited ? "Remove from saved vehicles" : "Save vehicle"}
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-60",
          isFavorited
            ? "border-rose-500 bg-rose-500/10 text-rose-500"
            : "border-slate-300 bg-white/90 text-slate-500 hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-rose-400",
          className,
        ].join(" ")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFavorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.645 20.91a.75.75 0 0 0 .71 0c1.297-.703 8.145-4.66 8.145-10.41a4.5 4.5 0 0 0-8.5-2.06 4.5 4.5 0 0 0-8.5 2.06c0 5.75 6.848 9.707 8.145 10.41Z"
          />
        </svg>
      </button>

      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-600 dark:text-red-300"
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default FavoriteButton;
