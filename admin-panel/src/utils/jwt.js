import { getToken } from "../services/auth";

/**
 * Decode a JWT payload without verifying the signature (UI display only).
 */
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Read the logged-in user from the stored access token.
 * Returns { id, email, role } or null if missing/invalid.
 */
export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload?.sub || !payload?.role) return null;

  return {
    id: payload.sub,
    email: payload.email ?? "",
    role: payload.role,
  };
}
