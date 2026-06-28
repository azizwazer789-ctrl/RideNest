function formatMessageTime(value) {
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

function MessageBubble({ message, isOwn }) {
  return (
    <li className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isOwn
            ? "bg-emerald-500 text-slate-950"
            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <p
          className={[
            "mt-1 text-[11px]",
            isOwn ? "text-slate-900/70" : "text-slate-500 dark:text-slate-400",
          ].join(" ")}
        >
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </li>
  );
}

export default MessageBubble;
