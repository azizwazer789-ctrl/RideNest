import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../services/api";
import { loginUser, saveToken, clearToken } from "../services/auth";
import { getUserFromToken } from "../utils/jwt";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { HERO_CAR_IMAGE } from "../config/images";

const websiteUrl = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const unauthorized = location.state?.unauthorized;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await loginUser(form.email, form.password);
      saveToken(data.access_token);

      const user = getUserFromToken();
      if (!user || user.role !== "vendor") {
        clearToken();
        setError("This account is not authorized for the vendor panel.");
        return;
      }

      setSuccess("Login successful! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
        <Logo to="/login" />
        <ThemeToggle />
      </header>

      <section className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:flex">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_CAR_IMAGE}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-slate-50/75 to-emerald-50/80 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-emerald-950/80" />
          <div className="relative flex flex-col justify-center px-10 py-16 xl:px-14">
            <p className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
              Vendor Portal
            </p>
            <h2 className="mt-6 max-w-lg text-4xl font-bold leading-tight text-slate-900 dark:text-white">
              Manage your fleet and bookings
            </h2>
            <p className="mt-5 max-w-md text-base text-slate-600 dark:text-slate-200">
              List vehicles, track approvals, and respond to customer booking
              requests.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-8 lg:px-12 lg:py-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                Vendor Access
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                Sign in
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Vendor panel login
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              {unauthorized && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
                >
                  Please sign in with a vendor account to continue.
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="email" className={labelClassName}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="vendor@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClassName}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    className={`${inputClassName} pr-12`}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                {loading ? "Signing in…" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              New vendor?{" "}
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Register
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-slate-500">
              Looking to book a car?{" "}
              <a
                href={websiteUrl}
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Customer Website
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
