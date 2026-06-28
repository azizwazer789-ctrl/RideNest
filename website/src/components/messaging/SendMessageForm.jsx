import { useState } from "react";

function SendMessageForm({ onSend, sending = false, error = "" }) {
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError("Message cannot be empty.");
      return;
    }

    setValidationError("");
    const sent = await onSend(trimmed);
    if (sent) setText("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200 p-4 dark:border-slate-800"
    >
      {(validationError || error) && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-300">
          {validationError || error}
        </p>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={1}
          maxLength={5000}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}

export default SendMessageForm;
