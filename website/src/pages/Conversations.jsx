import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, getMyConversations } from "../services/api";
import { getUserFromToken } from "../utils/jwt";

const cardClassName =
  "rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900";

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

function Conversations() {
  const user = getUserFromToken();
  const isCustomer = Boolean(user && user.role === "customer");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(isCustomer);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCustomer) return;

    let cancelled = false;

    async function loadConversations() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyConversations();

        if (!cancelled) {
          setConversations(Array.isArray(data) ? data : data?.items || []);
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

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

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

  if (user.role !== "customer") {
    return (
      <section className="w-full px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-lg ${cardClassName}`}>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            Messages are available for customer accounts only.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Messages</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Your conversations with vendors.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
              aria-hidden="true"
            />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading conversations…</p>
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

        {!loading && !error && conversations.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No conversations yet
            </p>
            <p className="mt-2 text-slate-500">
              Browse vehicles and message a vendor to start a conversation.
            </p>
            <Link
              to="/vehicles"
              className="mt-6 inline-flex rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Browse Vehicles
            </Link>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
              >
                <Link
                  to={`/conversations/${conversation.id}`}
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
                      Vendor #{conversation.vendor_id}
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
        )}
      </div>
    </section>
  );
}

export default Conversations;
