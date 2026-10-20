
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => {
        setJustReconnected(false);
        setShowBanner(false);
      }, 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setJustReconnected(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-xs font-black transition-all duration-500 ${
        justReconnected
          ? "bg-emerald-500 text-white"
          : "bg-rose-600 text-white"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {justReconnected ? (
        <>
          <Wifi size={13} className="animate-pulse" />
          <span>Internet ပြန်ရပါပြီ — Data sync လုပ်နေပါသည်</span>
          <RefreshCw size={12} className="animate-spin" />
        </>
      ) : (
        <>
          <WifiOff size={13} />
          <span>Offline မုဒ် — Data သိမ်းဆည်းနေပါသည်၊ Internet ပြန်ရလာရင် auto-sync ဖြစ်ပါမည်</span>
        </>
      )}
    </div>
  );
}
