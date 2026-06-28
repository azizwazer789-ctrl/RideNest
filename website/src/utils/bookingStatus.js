const STATUS_STYLES = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function getBookingStatusStyles(status) {
  const key = String(status ?? "").toLowerCase();
  return STATUS_STYLES[key] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

export function formatStatusLabel(status) {
  if (!status) return "Unknown";
  const value = String(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function canCancelBooking(status) {
  const key = String(status ?? "").toLowerCase();
  return key === "pending" || key === "confirmed";
}

export function isPendingBooking(status) {
  return String(status ?? "").toLowerCase() === "pending";
}

export function canVendorManageBooking(status) {
  return isPendingBooking(status);
}
