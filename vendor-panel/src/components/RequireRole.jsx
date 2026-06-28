import { Navigate, Outlet } from "react-router-dom";
import { clearToken } from "../services/auth";
import { getUserFromToken } from "../utils/jwt";

function RequireRole({ role, children }) {
  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    clearToken();
    return <Navigate to="/login" replace state={{ unauthorized: true }} />;
  }

  return children ?? <Outlet />;
}

export default RequireRole;
