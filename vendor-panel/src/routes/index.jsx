import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import RequireRole from "../components/RequireRole";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Overview from "../pages/dashboard/Overview";
import VehiclesPage from "../pages/dashboard/VehiclesPage";
import BookingsPage from "../pages/dashboard/BookingsPage";
import MessagesPage from "../pages/dashboard/MessagesPage";
import ConversationDetailsPage from "../pages/dashboard/ConversationDetailsPage";
import AddVehicle from "../pages/AddVehicle";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireRole role="vendor" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/vehicles" element={<VehiclesPage />} />
          <Route path="/dashboard/bookings" element={<BookingsPage />} />
          <Route path="/dashboard/messages" element={<MessagesPage />} />
          <Route path="/dashboard/messages/:id" element={<ConversationDetailsPage />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
