import { Product } from "../types";

export interface ExpiryInfo {
  status: "expired" | "expiring" | "valid" | "none";
  days: number;
  labelEn: string;
  labelMy: string;
  badgeClass: string;
  textClass: string;
}

/**
 * Calculate expiry status and remaining days for a given expiry date (YYYY-MM-DD)
 */
export function getExpiryInfo(expiryDate?: string): ExpiryInfo {
  if (!expiryDate) {
    return {
      status: "none",
      days: 0,
      labelEn: "No Expiry",
      labelMy: "သက်တမ်းမသတ်မှတ်ထား",
      badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      textClass: "text-slate-400",
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const exp = new Date(expiryDate + "T23:59:59");
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (expiryDate < todayStr || diffDays < 0) {
    return {
      status: "expired",
      days: diffDays,
      labelEn: "Expired",
      labelMy: "သက်တမ်းကုန်ပြီ",
      badgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      textClass: "text-rose-400",
    };
  }

  if (diffDays <= 60) {
    return {
      status: "expiring",
      days: diffDays,
      labelEn: `Exp in ${diffDays}d`,
      labelMy: `${diffDays} ရက်အတွင်း ကုန်မည်`,
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      textClass: "text-amber-300",
    };
  }

  return {
    status: "valid",
    days: diffDays,
    labelEn: `Exp: ${expiryDate}`,
    labelMy: `သက်တမ်း: ${expiryDate}`,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    textClass: "text-emerald-400",
  };
}

/**
 * Filter expired products
 */
export function getExpiredProducts(products: Product[]): Product[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return products.filter((p) => p.expiryDate && p.expiryDate < todayStr);
}

/**
 * Filter products expiring within the specified days window (default 60 days)
 */
export function getExpiringSoonProducts(products: Product[], daysWindow = 60): Product[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const futureDate = new Date(now.getTime() + daysWindow * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return products.filter(
    (p) => p.expiryDate && p.expiryDate >= todayStr && p.expiryDate <= futureDate
  );
}
