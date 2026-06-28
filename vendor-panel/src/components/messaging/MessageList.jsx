import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-1 py-2">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={`flex ${index % 2 ? "justify-end" : "justify-start"}`}>
          <div className="h-12 w-2/5 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function MessageList({ messages, loading, error, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (loading) {
    return <MessageListSkeleton />;
  }

  if (error) {
    return (
      <p role="alert" className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No messages yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 px-1 py-2">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={String(message.sender_id) === String(currentUserId)}
        />
      ))}
      <div ref={bottomRef} />
    </ul>
  );
}

export default MessageList;
