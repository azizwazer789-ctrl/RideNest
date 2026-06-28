import {
  formatStatusLabel,
  getBookingStatusStyles,
} from "../utils/bookingStatus";

function BookingStatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getBookingStatusStyles(status)} ${className}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export default BookingStatusBadge;
