import { NavLink, useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../services/auth";
import { getUserFromToken } from "../utils/jwt";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./notifications/NotificationBell";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/vehicles", label: "Vehicles" },
];

function Navbar({ notifications }) {
  const navigate = useNavigate();
  const token = getToken();
  const user = token ? getUserFromToken() : null;

  const linkClass = ({ isActive }) =>
    [
      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
    ].join(" ");

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="flex w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0">
          <Logo />
        </div>

        <ul className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
          {navLinks.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {token && notifications && <NotificationBell {...notifications} />}
          {token ? (
            <>
              {user?.role === "customer" && (
                <>
                  <NavLink
                    to="/conversations"
                    className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300 sm:inline-block"
                  >
                    Messages
                  </NavLink>
                  <NavLink
                    to="/saved-vehicles"
                    className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300 sm:inline-block"
                  >
                    Saved Vehicles
                  </NavLink>
                </>
              )}
              <NavLink
                to="/dashboard"
                className="hidden rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400 sm:inline-block"
              >
                My Bookings
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300 sm:px-4"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/register"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400 sm:px-5"
            >
              Join Us
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
