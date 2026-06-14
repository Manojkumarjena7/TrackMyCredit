import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
  });
}

export function getMonthShort(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-IN", {
    month: "short",
  });
}
