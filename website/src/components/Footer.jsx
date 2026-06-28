import { Link } from "react-router-dom";
import Logo from "./Logo";
import { APP_NAME, APP_TAGLINE, SUPPORT_EMAIL, SUPPORT_PHONE } from "../config/brand";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-600 dark:text-slate-400">
              {APP_TAGLINE}. Book verified vehicles from reliable vendors across
              major cities.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Explore
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/vehicles" className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  Browse Vehicles
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
                  Join as Customer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Support
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>{SUPPORT_EMAIL}</li>
              <li>{SUPPORT_PHONE}</li>
              <li>Mon – Sat, 9am – 6pm PKT</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Booking Policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
          <p>&copy; {year} {APP_NAME}. All rights reserved.</p>
          <p>Built for customers, vendors, and fleet partners.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
