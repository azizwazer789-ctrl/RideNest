import VehicleApprovalStatusBadge from "./VehicleApprovalStatusBadge";
import VehicleThumbnail from "./VehicleThumbnail";

function AdminVehicleCard({
  vehicle,
  onApprove,
  onReject,
  showActions = true,
}) {
  if (!vehicle) return null;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-500/20 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
        <div className="aspect-[16/10] bg-slate-800 lg:aspect-auto lg:min-h-[200px]">
          <VehicleThumbnail src={vehicle.image_url} alt={vehicle.title} />
        </div>

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-white">{vehicle.title}</h4>
                <p className="mt-1 text-sm text-emerald-400/90">
                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                </p>
              </div>
              <VehicleApprovalStatusBadge vehicle={vehicle} />
            </div>

            <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Vendor ID:</span>{" "}
                <span className="text-slate-300">#{vehicle.vendor_id}</span>
              </p>
              <p>
                <span className="text-slate-500">City:</span>{" "}
                <span className="text-slate-300">{vehicle.city}</span>
              </p>
              <p>
                <span className="text-slate-500">Location:</span>{" "}
                <span className="text-slate-300">{vehicle.location}</span>
              </p>
              <p>
                <span className="text-slate-500">Type:</span>{" "}
                <span className="text-slate-300">
                  {vehicle.car_type} · {vehicle.transmission}
                </span>
              </p>
            </div>

            <p className="text-base font-semibold text-emerald-400">
              PKR {Number(vehicle.price_per_day ?? 0).toLocaleString()} / day
            </p>
          </div>

          {showActions && (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
              {!vehicle.is_approved && (
                <button
                  type="button"
                  onClick={() => onApprove(vehicle.id)}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Approve
                </button>
              )}
              <button
                type="button"
                onClick={() => onReject(vehicle.id)}
                className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default AdminVehicleCard;
