import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import RequireRole from "../components/RequireRole";

import Login from "../pages/Login";
import Overview from "../pages/dashboard/Overview";
import ApprovalQueue from "../pages/dashboard/ApprovalQueue";
import AllListings from "../pages/dashboard/AllListings";
import PaymentsOverview from "../pages/dashboard/PaymentsOverview";
import VendorPayouts from "../pages/dashboard/VendorPayouts";
import AnalyticsDashboard from "../pages/dashboard/AnalyticsDashboard";
import ReviewsModeration from "../pages/dashboard/ReviewsModeration";
import AddOnsPage from "../pages/dashboard/AddOnsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireRole role="admin" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/queue" element={<ApprovalQueue />} />
          <Route path="/dashboard/listings" element={<AllListings />} />
          <Route path="/dashboard/payments" element={<PaymentsOverview />} />
          <Route path="/dashboard/payouts" element={<VendorPayouts />} />
          <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
          <Route path="/dashboard/reviews" element={<ReviewsModeration />} />
          <Route path="/dashboard/addons" element={<AddOnsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
