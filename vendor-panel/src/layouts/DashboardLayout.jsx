import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearToken } from "../services/auth";
import { getUserFromToken } from "../utils/jwt";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

const navItems = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/vehicles", label: "My Vehicles" },
  { to: "/dashboard/bookings", label: "Bookings" },
  { to: "/dashboard/messages", label: "Messages" },
  { to: "/add-vehicle", label: "Add Vehicle" },
];

const pageTitles = {
  "/dashboard": "Overview",
  "/dashboard/vehicles": "My Vehicles",
  "/dashboard/bookings": "Booking Requests",
  "/dashboard/messages": "Messages",
  "/add-vehicle": "Add Vehicle",
};

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUserFromToken();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  const sidebarClass = ({ isActive }) =>
    [
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
    ].join(" ");

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={sidebarClass}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Vendor Dashboard
            </p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
                {user.email}
              </span>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-400"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
