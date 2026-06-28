import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../services/api";
import { loginUser, saveToken, clearToken } from "../services/auth";
import { getUserFromToken } from "../utils/jwt";
import { APP_NAME } from "../config/brand";
import { HERO_CAR_IMAGE } from "../config/images";

const vendorPanelUrl =
  import.meta.env.VITE_VENDOR_PANEL_URL || "http://localhost:5174";
const adminPanelUrl =
  import.meta.env.VITE_ADMIN_PANEL_URL || "http://localhost:5175";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

function AuthHeroPanel({ title, subtitle }) {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-1">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_CAR_IMAGE}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-slate-50/75 to-emerald-50/80 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-emerald-950/80" />

      <div className="relative flex flex-col justify-center px-10 py-16 xl:px-14">
        <p className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
          Premium Car Marketplace
        </p>
        <h2 className="mt-6 max-w-lg text-4xl font-bold leading-tight text-slate-900 dark:text-white xl:text-5xl">
          {title}
        </h2>
        <p className="mt-5 max-w-md text-base text-slate-600 dark:text-slate-200">{subtitle}</p>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      if (!user) {
        setError("Invalid login response. Please try again.");
        return;
      }

      if (user.role === "vendor") {
        clearToken();
        setError(
          "This account is registered as a vendor. Please use the Vendor Portal to sign in."
        );
        return;
      }

      if (user.role === "admin") {
        clearToken();
        setError(
          "This account is registered as an admin. Please use the Admin Panel to sign in."
        );
        return;
      }

      if (user.role !== "customer") {
        clearToken();
        setError("This account is not authorized for the customer website.");
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
    <section className="grid flex-1 lg:grid-cols-2">
      <AuthHeroPanel
        title={`Drive smarter with ${APP_NAME}`}
        subtitle="Sign in to browse vehicles, manage bookings, and complete reservations."
      />

      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-8 lg:px-12 lg:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
              Customer Login
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Sign in to your customer account
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
              >
                {error}
                {error.includes("Vendor Portal") && (
                  <p className="mt-2">
                    <a
                      href={vendorPanelUrl}
                      className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    >
                      Open Vendor Portal
                    </a>
                  </p>
                )}
                {error.includes("Admin Panel") && (
                  <p className="mt-2">
                    <a
                      href={adminPanelUrl}
                      className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400"
                    >
                      Open Admin Panel
                    </a>
                  </p>
                )}
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
                placeholder="you@example.com"
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
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400"
            >
              Register
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-slate-500">
            Are you a vendor?{" "}
            <a
              href={vendorPanelUrl}
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              Vendor Portal
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
