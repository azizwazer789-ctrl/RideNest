export const FALLBACK_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80";

export function handleVehicleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_VEHICLE_IMAGE;
}

function VehicleThumbnail({ src, alt, className = "h-full w-full object-cover" }) {
  return (
    <img
      src={src || FALLBACK_VEHICLE_IMAGE}
      alt={alt}
      className={className}
      onError={handleVehicleImageError}
    />
  );
}

export default VehicleThumbnail;
