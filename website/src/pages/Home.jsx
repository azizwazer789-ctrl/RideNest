import { Link } from "react-router-dom";
import { APP_NAME } from "../config/brand";
import { HERO_CAR_IMAGE } from "../config/images";

function Home() {
  const categories = [
    { title: "Economy", detail: "Affordable daily rentals for city travel." },
    { title: "SUV", detail: "Spacious comfort for family and long drives." },
    { title: "Luxury", detail: "Premium rides for business and events." },
    { title: "Commercial", detail: "Reliable options for work and transport." },
  ];

  const featuredVehicles = [
    {
      name: "Toyota Corolla Cross",
      type: "SUV",
      rate: "18,000 PKR / day",
      image:
        "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Honda Civic RS",
      type: "Sedan",
      rate: "15,500 PKR / day",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "KIA Sportage",
      type: "SUV",
      rate: "20,000 PKR / day",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const benefits = [
    "Verified vendors and quality-checked vehicles",
    "Transparent pricing with no hidden surprises",
    "Fast booking flow with secure confirmations",
    "Flexible options for personal and business trips",
  ];

  return (
    <main className="w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_CAR_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-slate-50/80 to-slate-100/95 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950" />

        <div className="relative w-full px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
              Premium Car Marketplace
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Book the right car for every trip with confidence.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-200 sm:text-lg">
              Discover verified vehicles from trusted vendors, compare options
              instantly, and reserve in minutes for business, family, or
              weekend travel.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/vehicles"
                className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Explore Cars
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Become a Member
              </Link>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/75 dark:shadow-2xl sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Quick Search
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Karachi"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Pickup Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Return Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-emerald-400"
                />
              </div>
              <div className="flex items-end">
                <Link
                  to="/vehicles"
                  className="w-full rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-400"
                >
                  Search Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Browse by Category
          </h2>
          <Link
            to="/vehicles"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View all vehicles
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Featured Vehicles
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Handpicked listings with strong ratings and reliable availability.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredVehicles.map((vehicle) => (
            <article
              key={vehicle.name}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="h-52 w-full object-cover"
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {vehicle.name}
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {vehicle.type}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {vehicle.rate}
                </p>
                <Link
                  to="/vehicles"
                  className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid w-full gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Why Choose {APP_NAME}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Built for modern travelers and trusted by vendors across cities.
          </p>
          <ul className="mt-6 space-y-3">
            {benefits.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-slate-700 dark:text-slate-200"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "15K+", label: "Successful bookings", color: "text-orange-500" },
            { value: "2,500+", label: "Active vehicles", color: "text-emerald-600 dark:text-emerald-400" },
            { value: "120+", label: "Verified vendors", color: "text-orange-500" },
            { value: "98%", label: "Booking satisfaction", color: "text-emerald-600 dark:text-emerald-400" },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-8 shadow-sm dark:border-emerald-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Ready to find your next ride?
              </h2>
              <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
                Browse top-rated vehicles, compare offers, and complete your
                booking in just a few clicks.
              </p>
            </div>
            <Link
              to="/vehicles"
              className="inline-flex rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Start Booking
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
