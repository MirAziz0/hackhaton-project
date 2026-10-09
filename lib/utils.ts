import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats money as "12 400 ₼". Written by hand instead of Intl.NumberFormat because Node and
// browsers format the az-AZ locale differently, which breaks hydration of server-rendered pages.
export function formatAZN(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  const [whole, fraction] = Math.abs(rounded).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g," ");
  const sign = rounded < 0 ? "−" : "";
  return `${sign}${grouped}${fraction === "00" ? "" : `,${fraction}`} ₼`;
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
