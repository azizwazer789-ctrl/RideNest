function MonthlyTrendBars({ data, labelKey, valueKey, formatValue = (value) => value }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No trend data available for this period.
      </p>
    );
  }

  const max = Math.max(...data.map((point) => Number(point[valueKey]) || 0), 1);

  return (
    <div className="space-y-2.5">
      {data.map((point) => {
        const value = Number(point[valueKey]) || 0;
        const widthPct = Math.max(2, (value / max) * 100);

        return (
          <div key={point[labelKey]} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {point[labelKey]}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs font-medium text-slate-700 dark:text-slate-300">
              {formatValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default MonthlyTrendBars;
