import { loginUser as apiLoginUser } from "./api";

const TOKEN_KEY = "access_token";

export async function loginUser(email, password) {
  return apiLoginUser(email, password);
}

export function saveToken(accessToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
