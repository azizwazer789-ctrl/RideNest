import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../services/api";
import { registerUser } from "../services/auth";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { HERO_CAR_REGISTER_IMAGE } from "../config/images";

const websiteUrl = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400";

const labelClassName = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

function getPasswordStrength(password) {
  if (!password) {
    return { label: "Enter at least 8 characters", level: "empty", width: "0%" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { label: "Weak — add numbers and mixed case", level: "weak", width: "33%" };
  }
  if (score <= 4) {
    return { label: "Good — almost there", level: "medium", width: "66%" };
  }
  return { label: "Strong password", level: "strong", width: "100%" };
}

const strengthBarClass = {
  empty: "bg-slate-300 dark:bg-slate-700",
  weak: "bg-orange-500",
  medium: "bg-amber-400",
  strong: "bg-emerald-500",
};

const strengthTextClass = {
  empty: "text-slate-500",
  weak: "text-orange-600 dark:text-orange-300",
  medium: "text-amber-600 dark:text-amber-300",
  strong: "text-emerald-600 dark:text-emerald-300",
};

function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

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
      const data = await registerUser({ ...form, role: "vendor" });
      setSuccess(data.message || "Vendor account created! You can now sign in.");
      setForm({ full_name: "", email: "", password: "" });
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
            style={{ backgroundImage: `url('${HERO_CAR_REGISTER_IMAGE}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-slate-50/75 to-orange-50/80 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-emerald-950/80" />
          <div className="relative flex flex-col justify-center px-10 py-16 xl:px-14">
            <p className="inline-flex w-fit rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:border-orange-400/30 dark:text-orange-300">
              Become a Vendor
            </p>
            <h2 className="mt-6 max-w-lg text-4xl font-bold leading-tight text-slate-900 dark:text-white">
              List your vehicles on our marketplace
            </h2>
            <p className="mt-5 max-w-md text-base text-slate-600 dark:text-slate-200">
              Register as a vendor to add cars and receive booking requests from
              customers.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-8 lg:px-12 lg:py-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Vendor Registration
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                Create vendor account
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Join as a vehicle vendor
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
                <label htmlFor="full_name" className={labelClassName}>
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClassName}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
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
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="At least 8 characters"
                />
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${strengthBarClass[passwordStrength.level]}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${strengthTextClass[passwordStrength.level]}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Register as Vendor"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Log in
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-slate-500">
              Want to book a car instead?{" "}
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

export default Register;
