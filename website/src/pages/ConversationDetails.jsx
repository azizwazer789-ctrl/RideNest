import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MessageList from "../components/messaging/MessageList";
import SendMessageForm from "../components/messaging/SendMessageForm";
import {
  getConversation,
  getConversationMessages,
  getErrorMessage,
  sendMessage,
} from "../services/api";
import { getUserFromToken } from "../utils/jwt";

const cardClassName =
  "rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900";

function ConversationDetails() {
  const { id } = useParams();
  const user = getUserFromToken();
  const isCustomer = Boolean(user && user.role === "customer");

  const [conversation, setConversation] = useState(null);
  const [conversationError, setConversationError] = useState("");

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(isCustomer);
  const [messagesError, setMessagesError] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!isCustomer || !id) return;

    let cancelled = false;

    async function loadConversation() {
      setConversationError("");
      try {
        const data = await getConversation(id);
        if (!cancelled) setConversation(data);
      } catch (err) {
        if (!cancelled) setConversationError(getErrorMessage(err));
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [id, isCustomer]);

  // Fetching messages also marks the viewer's unread incoming messages as
  // read server-side, so simply opening this page satisfies "mark as read".
  useEffect(() => {
    if (!isCustomer || !id) return;

    let cancelled = false;

    async function loadMessages() {
      setMessagesLoading(true);
      setMessagesError("");

      try {
        const data = await getConversationMessages(id);
        const items = Array.isArray(data) ? data : data?.items || [];

        if (!cancelled) {
          setMessages(items);
        }
      } catch (err) {
        if (!cancelled) {
          setMessagesError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [id, isCustomer]);

  async function handleSend(text) {
    setSending(true);
    setSendError("");

    try {
      const created = await sendMessage(id, { message: text });
      setMessages((previous) => [...previous, created]);
      return true;
    } catch (err) {
      setSendError(getErrorMessage(err));
      return false;
    } finally {
      setSending(false);
    }
  }

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

  if (!isCustomer) {
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
      <div className="mx-auto flex max-w-3xl flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Link
              to="/conversations"
              className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              ← Back to Messages
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {conversation
                ? `Vendor #${conversation.vendor_id}`
                : conversationError
                  ? "Conversation"
                  : "Loading…"}
            </h1>
            {conversation?.booking_id && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Booking #{conversation.booking_id}
              </p>
            )}
          </div>
        </div>

        {conversationError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-center text-red-600 dark:text-red-300"
          >
            {conversationError}
          </div>
        )}

        <div className="flex h-[60vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto px-4">
            <MessageList
              messages={messages}
              loading={messagesLoading}
              error={messagesError}
              currentUserId={user.id}
            />
          </div>

          <SendMessageForm onSend={handleSend} sending={sending} error={sendError} />
        </div>
      </div>
    </section>
  );
}

export default ConversationDetails;
