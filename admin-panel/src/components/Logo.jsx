import { Link } from "react-router-dom";
import { APP_NAME } from "../config/brand";

function Logo({ to = "/dashboard", subtitle = "Admin Panel" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="h-9 w-9 shrink-0" />
      <div className="leading-tight">
        <span className="block text-base font-bold text-orange-600 dark:text-orange-400 sm:text-lg">
          {APP_NAME}
        </span>
        {subtitle && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}

export default Logo;
