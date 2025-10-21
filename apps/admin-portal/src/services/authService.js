import { API_BASE_URL } from "../lib/utils";

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(data) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found");
  }
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");

  return res.json();
}