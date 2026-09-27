import { apiRequest } from "./client";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  token: string;
  user: User;
}

export function register(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function fetchMe(): Promise<User> {
  return apiRequest<User>("/api/auth/me");
}