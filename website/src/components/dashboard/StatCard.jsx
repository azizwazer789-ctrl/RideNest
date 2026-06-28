function StatCard({ label, value, accent = "text-white" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="h-3 w-28 rounded bg-slate-800" />
      <div className="mt-3 h-8 w-14 rounded bg-slate-800" />
    </div>
  );
}

export default StatCard;
