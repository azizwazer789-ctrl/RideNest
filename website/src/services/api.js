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

export async function registerUser(data) {
  const response = await api.post("/users/signup", data);
  return response.data;
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

export async function getVehicles() {
  const response = await api.get("/vehicles/");
  return response.data;
}

export async function getVehicle(id) {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
}

export async function createBooking(data) {
  const response = await api.post("/bookings/", data);
  return response.data;
}

export async function getMyBookings() {
  const response = await api.get("/bookings/my");
  return response.data;
}

export async function cancelBooking(id) {
  const response = await api.patch(`/bookings/${id}/cancel`);
  return response.data;
}

export async function addFavorite(vehicleId) {
  const response = await api.post(`/favorites/${vehicleId}`);
  return response.data;
}

export async function removeFavorite(vehicleId) {
  const response = await api.delete(`/favorites/${vehicleId}`);
  return response.data;
}

export async function getMyFavorites() {
  const response = await api.get("/favorites/my");
  return response.data;
}

export async function getVehicleReviews(vehicleId) {
  const response = await api.get(`/vehicles/${vehicleId}/reviews`);
  return response.data;
}

export async function createReview(data) {
  const response = await api.post("/reviews", data);
  return response.data;
}

export async function updateReview(reviewId, data) {
  const response = await api.put(`/reviews/${reviewId}`, data);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
}

export async function getMyReviews() {
  const response = await api.get("/reviews/my");
  return response.data;
}

export async function getMyNotifications() {
  const response = await api.get("/notifications/my");
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data;
}

export async function deleteNotification(notificationId) {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
}

export default api;
