import { Link, useOutletContext } from "react-router-dom";
import NotificationItem from "../components/notifications/NotificationItem";
import { getUserFromToken } from "../utils/jwt";

const cardClassName =
  "rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900";

function Notifications() {
  const user = getUserFromToken();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    mutatingId,
    markRead,
    markAllRead,
    remove,
  } = useOutletContext();

  if (!user) {
    return (
      <section className="w-full px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-lg ${cardClassName}`}>
          <p className="text-lg text-slate-700 dark:text-slate-300">Please login first.</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              Notifications
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "You're all caught up."}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
              aria-hidden="true"
            />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading notifications…</p>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center text-red-600 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No notifications yet
            </p>
            <p className="mt-2 text-slate-500">
              We'll let you know here when something happens with your bookings.
            </p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markRead}
                onDelete={remove}
                busy={mutatingId === notification.id}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Notifications;
