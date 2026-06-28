const TYPE_ICON = {
  booking_created: "🗓️",
  booking_confirmed: "✅",
  booking_rejected: "❌",
  booking_cancelled: "🚫",
  booking_completed: "🏁",
  vehicle_approved: "🚗",
  vehicle_rejected: "⚠️",
  review_received: "⭐",
  system: "🔔",
};

function formatNotificationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationItem({ notification, onMarkRead, onDelete, busy = false }) {
  const icon = TYPE_ICON[notification.type] || "🔔";

  return (
    <li
      className={[
        "flex gap-3 px-4 py-3 transition",
        notification.is_read
          ? "bg-white dark:bg-slate-900"
          : "bg-emerald-50/60 dark:bg-emerald-500/10",
      ].join(" ")}
    >
      <span className="mt-0.5 text-lg" aria-hidden="true">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              "text-sm font-medium",
              notification.is_read
                ? "text-slate-700 dark:text-slate-300"
                : "text-slate-900 dark:text-white",
            ].join(" ")}
          >
            {notification.title}
          </p>

          {!notification.is_read && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              aria-hidden="true"
              title="Unread"
            />
          )}
        </div>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {notification.message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">
            {formatNotificationDate(notification.created_at)}
          </span>

          {!notification.is_read && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              disabled={busy}
              className="text-xs font-medium text-emerald-600 transition hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400"
            >
              Mark read
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            disabled={busy}
            className="text-xs font-medium text-red-600 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
          >
            {busy ? "Working…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default NotificationItem;
