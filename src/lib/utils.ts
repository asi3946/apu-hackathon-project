import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwindのクラス名をうまく結合する関数
 * 例: cn("p-4", isActive && "bg-blue-500") -> "p-4 bg-blue-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}