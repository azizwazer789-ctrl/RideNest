import { NavLink, useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../services/auth";

function Navbar() {
  const navigate = useNavigate();
  const token = getToken();

  const linkClass = ({ isActive }) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-orange-500/20 text-orange-400"
        : "text-slate-300 hover:bg-slate-800 hover:text-white",
    ].join(" ");

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/dashboard" className="text-lg font-bold text-orange-400 sm:text-xl">
          Admin Panel
        </NavLink>

        {token && (
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
            <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
              <li>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-orange-400 hover:text-orange-300"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
