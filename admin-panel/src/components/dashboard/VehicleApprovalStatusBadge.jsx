import {
  getVehicleApprovalStatus,
  vehicleApprovalLabels,
  vehicleApprovalStyles,
} from "../../utils/vehicleApproval";

function VehicleApprovalStatusBadge({ vehicle, className = "" }) {
  const status = getVehicleApprovalStatus(vehicle);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${vehicleApprovalStyles[status]} ${className}`}
    >
      {vehicleApprovalLabels[status]}
    </span>
  );
}

export default VehicleApprovalStatusBadge;
