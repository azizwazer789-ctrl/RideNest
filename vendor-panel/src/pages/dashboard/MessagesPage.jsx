import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, getMyConversations } from "../../services/api";

function formatUpdatedAt(value) {
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

function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyConversations();
        if (!cancelled) {
          setConversations(Array.isArray(data) ? data : data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setConversations([]);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400" />
        <p className="mt-4 text-slate-500">Loading conversations…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Messages</h2>
        <p className="mt-1 text-sm text-slate-500">
          {conversations.length} conversation(s) with customers
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && conversations.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            No conversations yet
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Customers who message you about a vehicle or booking will appear here.
          </p>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  to={`/dashboard/messages/${conversation.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p
                      className={[
                        "truncate text-sm font-medium",
                        conversation.unread_count > 0
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300",
                      ].join(" ")}
                    >
                      Customer #{conversation.customer_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {conversation.booking_id
                        ? `Booking #${conversation.booking_id} · `
                        : ""}
                      {formatUpdatedAt(conversation.updated_at)}
                    </p>
                  </div>

                  {conversation.unread_count > 0 && (
                    <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-slate-950">
                      {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
