function ApprovalBadge({ isApproved }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        isApproved
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
          : "border-yellow-500/30 bg-yellow-500/15 text-yellow-400"
      }`}
    >
      {isApproved ? "Approved" : "Pending Approval"}
    </span>
  );
}

export default ApprovalBadge;
