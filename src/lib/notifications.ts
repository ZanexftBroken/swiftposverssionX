
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title: string, body: string, icon = "/icons/icon-192.png") {
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon, badge: "/icons/icon-192.png" });
}

export function checkLowStockAndNotify(
  products: { name: string; quantity: number; lowStockThreshold?: number }[],
  lang: "en" | "my"
) {
  const lowStock = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
  if (lowStock.length > 0 && Notification.permission === "granted") {
    const names = lowStock.slice(0, 3).map(p => p.name).join(", ");
    const more = lowStock.length > 3 ? ` +${lowStock.length - 3} more` : "";
    sendNotification(
      lang === "my" ? "Stock နည်းပါးနေပါသည်" : "Low Stock Alert",
      lang === "my"
        ? `${names}${more} — Stock ဖြည့်သွင်းရန် လိုအပ်ပါသည်`
        : `${names}${more} — Please restock soon`
    );
  }
}
