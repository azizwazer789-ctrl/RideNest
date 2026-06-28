import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MessageList from "../../components/messaging/MessageList";
import SendMessageForm from "../../components/messaging/SendMessageForm";
import {
  getConversation,
  getConversationMessages,
  getErrorMessage,
  sendMessage,
} from "../../services/api";
import { getUserFromToken } from "../../utils/jwt";

function ConversationDetailsPage() {
  const { id } = useParams();
  const user = getUserFromToken();

  const [conversation, setConversation] = useState(null);
  const [conversationError, setConversationError] = useState("");

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!id) return;

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
  }, [id]);

  // Fetching messages also marks the viewer's unread incoming messages as
  // read server-side, so simply opening this page satisfies "mark as read".
  useEffect(() => {
    if (!id) return;

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
  }, [id]);

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

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/dashboard/messages"
          className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
        >
          ← Back to Messages
        </Link>
        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
          {conversation
            ? `Customer #${conversation.customer_id}`
            : conversationError
              ? "Conversation"
              : "Loading…"}
        </h2>
        {conversation?.booking_id && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Booking #{conversation.booking_id}
          </p>
        )}
      </div>

      {conversationError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
        >
          {conversationError}
        </div>
      )}

      <div className="flex h-[60vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex-1 overflow-y-auto px-4">
          <MessageList
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            currentUserId={user?.id}
          />
        </div>

        <SendMessageForm onSend={handleSend} sending={sending} error={sendError} />
      </div>
    </div>
  );
}

export default ConversationDetailsPage;
