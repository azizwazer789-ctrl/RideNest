import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import RequireRole from "../components/RequireRole";

import Login from "../pages/Login";
import Overview from "../pages/dashboard/Overview";
import ApprovalQueue from "../pages/dashboard/ApprovalQueue";
import AllListings from "../pages/dashboard/AllListings";

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
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
