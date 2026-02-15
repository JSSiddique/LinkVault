export const API_BASE = "http://localhost:3000";
const AUTH_TOKEN_KEY = "linkvault_auth_token";

export const getAuthToken = () =>
  window.localStorage.getItem(AUTH_TOKEN_KEY) || "";

export const setAuthToken = (token) => {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const authHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
