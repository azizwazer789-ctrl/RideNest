import { loginUser as apiLoginUser, registerUser as apiRegisterUser } from "./api";

const TOKEN_KEY = "access_token";

export async function registerUser(data) {
  return apiRegisterUser({
    full_name: data.full_name,
    email: data.email,
    password: data.password,
    role: data.role,
  });
}

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
