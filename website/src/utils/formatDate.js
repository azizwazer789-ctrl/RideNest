export function formatBookingDate(value) {
  if (!value) return "—";
  const dateOnly = String(value).split("T")[0];
  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateRange(start, end) {
  return `${formatBookingDate(start)} → ${formatBookingDate(end)}`;
}
