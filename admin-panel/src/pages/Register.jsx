import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../services/api";
import { registerUser } from "../services/auth";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "driver", label: "Driver" },
];

const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";

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
  empty: "bg-slate-700",
  weak: "bg-orange-500",
  medium: "bg-amber-400",
  strong: "bg-emerald-500",
};

function AuthHeroPanel({ title, subtitle }) {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:min-h-[calc(100vh-8rem)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-emerald-950/80" />

      <div className="relative flex flex-col justify-center px-10 py-16 xl:px-14">
        <p className="inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
          Join the Marketplace
        </p>
        <h2 className="mt-6 max-w-lg text-4xl font-bold leading-tight text-white xl:text-5xl">
          {title}
        </h2>
        <p className="mt-5 max-w-md text-base text-slate-200">{subtitle}</p>

        <ul className="mt-10 space-y-4 text-sm text-slate-300">
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            List or book vehicles in minutes
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Role-based dashboards for every user
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Built for customers, vendors, and drivers
          </li>
        </ul>
      </div>
    </div>
  );
}

function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "customer",
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
      const data = await registerUser(form);
      setSuccess(data.message || "Account created successfully!");
      setForm({ full_name: "", email: "", password: "", role: "customer" });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="-mx-4 -my-8 grid min-h-[calc(100vh-5rem)] overflow-hidden sm:-mx-6 lg:grid-cols-2">
      <div className="relative flex min-h-[220px] overflow-hidden lg:hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-900/70" />
        <div className="relative flex flex-col justify-center px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Create Account
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Join RideNest today
          </h2>
        </div>
      </div>

      <AuthHeroPanel
        title="Start your journey with RideNest"
        subtitle="Create your account as a customer, vendor, or driver and access tools built for modern car rental."
      />

      <div className="flex items-center justify-center bg-slate-950 px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              New Account
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Create account</h1>
            <p className="mt-2 text-slate-400">Join RideNest</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8"
          >
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                {success}
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-300">
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
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
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
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
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
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${strengthBarClass[passwordStrength.level]}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p
                  className={`mt-2 text-xs ${
                    passwordStrength.level === "weak"
                      ? "text-orange-300"
                      : passwordStrength.level === "medium"
                        ? "text-amber-300"
                        : passwordStrength.level === "strong"
                          ? "text-emerald-300"
                          : "text-slate-500"
                  }`}
                >
                  {passwordStrength.label}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputClassName}
              >
                {ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
