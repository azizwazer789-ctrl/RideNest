export function getVendorApprovalStatus(vehicle) {
  if (vehicle.is_approved) return "approved";

  const created = new Date(vehicle.created_at).getTime();
  const updated = new Date(vehicle.updated_at).getTime();
  if (!Number.isNaN(created) && !Number.isNaN(updated) && updated - created > 60000) {
    return "rejected";
  }

  return "pending";
}

export const vendorApprovalBadgeStyles = {
  approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-300",
  rejected: "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-300",
};

export const vendorApprovalBadgeLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};
