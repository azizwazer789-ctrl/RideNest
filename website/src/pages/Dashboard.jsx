import { Link } from "react-router-dom";
import CustomerDashboard from "../components/dashboard/CustomerDashboard";
import { getUserFromToken } from "../utils/jwt";

const cardClassName =
  "rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900";

function Dashboard() {
  const user = getUserFromToken();

  if (!user) {
    return (
      <section className="w-full px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-lg ${cardClassName}`}>
          <p className="text-lg text-slate-700 dark:text-slate-300">Please login first.</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  if (user.role !== "customer") {
    const vendorPanelUrl =
      import.meta.env.VITE_VENDOR_PANEL_URL || "http://localhost:5174";
    const adminPanelUrl =
      import.meta.env.VITE_ADMIN_PANEL_URL || "http://localhost:5175";

    return (
      <section className="w-full px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-lg ${cardClassName}`}>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            This dashboard is for customers only.
          </p>
          {user.role === "vendor" && (
            <a
              href={vendorPanelUrl}
              className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              Go to Vendor Panel
            </a>
          )}
          {user.role === "admin" && (
            <a
              href={adminPanelUrl}
              className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-400"
            >
              Go to Admin Panel
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          My Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Signed in as{" "}
          <span className="text-slate-900 dark:text-slate-200">
            {user.email || "user"}
          </span>
        </p>
      </div>
      <CustomerDashboard />
    </section>
  );
}

export default Dashboard;
