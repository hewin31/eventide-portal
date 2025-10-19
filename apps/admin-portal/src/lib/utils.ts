import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const API_BASE_URL = "http://localhost:5000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
