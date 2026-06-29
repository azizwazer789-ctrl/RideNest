function AddOnSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60"
        />
      ))}
    </div>
  );
}

function AddOnSelector({ addons, loading, error, selectedIds, onToggle, totalDays }) {
  if (loading) {
    return <AddOnSkeleton />;
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (addons.length === 0) {
    return <p className="text-sm text-slate-500">No add-ons are available right now.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {addons.map((addon) => {
        const isSelected = selectedIds.has(addon.id);
        const isPerDay = addon.pricing_type === "per_day";
        const subtotal = isPerDay ? addon.price * Math.max(totalDays, 0) : addon.price;

        return (
          <label
            key={addon.id}
            className={[
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
              isSelected
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(addon.id)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-white">{addon.name}</p>
                <p className="text-sm font-semibold text-emerald-400">
                  PKR {Number(addon.price).toLocaleString()}
                  {isPerDay ? " / day" : ""}
                </p>
              </div>

              <p className="mt-1 text-xs text-slate-400">{addon.description}</p>

              {isSelected && totalDays > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Subtotal: PKR {subtotal.toLocaleString()}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default AddOnSelector;
