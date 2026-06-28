import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";
const TOKEN_KEY = "access_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/users/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        const field = Array.isArray(item?.loc)
          ? item.loc[item.loc.length - 1]
          : "field";
        return item?.msg ? `${field}: ${item.msg}` : JSON.stringify(item);
      })
      .join(". ");
  }

  if (detail && typeof detail === "object") {
    return detail.message || JSON.stringify(detail);
  }

  if (error.message === "Network Error") {
    return `Cannot reach the server. Make sure the backend is running on ${API_BASE_URL}.`;
  }

  if (!error.response) {
    return error.message || "Network error. Please check your connection.";
  }

  return "Something went wrong. Please try again.";
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post("/users/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
}

export async function getAdminVehicles({ page = 1, limit = 10 } = {}) {
  const response = await api.get("/vehicles/admin/all", { params: { page, limit } });
  return response.data;
}

/**
 * Walks every page of /vehicles/admin/all and returns the full inventory.
 * Needed for views (like the approval queue) that must consider every
 * vehicle regardless of status, since the backend has no status filter.
 */
export async function getAllAdminVehicles() {
  const limit = 100;
  const first = await getAdminVehicles({ page: 1, limit });
  const items = Array.isArray(first) ? first : first?.items || [];
  const totalPages = first?.pages ?? 1;

  let all = [...items];
  for (let page = 2; page <= totalPages; page += 1) {
    const data = await getAdminVehicles({ page, limit });
    all = all.concat(Array.isArray(data) ? data : data?.items || []);
  }

  return all;
}

export async function approveVehicle(id) {
  const response = await api.patch(`/vehicles/${id}/approve`);
  return response.data;
}

export async function rejectVehicle(id) {
  const response = await api.patch(`/vehicles/${id}/reject`);
  return response.data;
}

export async function getAdminDashboardStats() {
  const response = await api.get("/dashboard/admin/stats");
  return response.data;
}

export async function getAdminAnalyticsOverview(params = {}) {
  const response = await api.get("/analytics/admin/overview", { params });
  return response.data;
}

export async function getAdminAnalyticsRevenue(params = {}) {
  const response = await api.get("/analytics/admin/revenue", { params });
  return response.data;
}

export async function getAdminAnalyticsBookings(params = {}) {
  const response = await api.get("/analytics/admin/bookings", { params });
  return response.data;
}

export async function getAdminTopVehicles(params = {}) {
  const response = await api.get("/analytics/admin/top-vehicles", { params });
  return response.data;
}

export async function getAdminTopVendors(params = {}) {
  const response = await api.get("/analytics/admin/top-vendors", { params });
  return response.data;
}

export async function getAdminPayouts() {
  const response = await api.get("/admin/payouts");
  return response.data;
}

export async function approvePayout(id) {
  const response = await api.patch(`/admin/payouts/${id}/approve`);
  return response.data;
}

export async function rejectPayout(id) {
  const response = await api.patch(`/admin/payouts/${id}/reject`);
  return response.data;
}

export async function completePayout(id) {
  const response = await api.patch(`/admin/payouts/${id}/complete`);
  return response.data;
}

export async function getVehicleReviews(vehicleId) {
  const response = await api.get(`/vehicles/${vehicleId}/reviews`);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
}

export default api;
