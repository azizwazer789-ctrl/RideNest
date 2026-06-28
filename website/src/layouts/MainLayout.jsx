import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNotifications } from "../hooks/useNotifications";

function MainLayout() {
  const notifications = useNotifications();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar notifications={notifications} />
      <main className="w-full flex-1">
        <Outlet context={notifications} />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
