import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, ShoppingCart, Building2, Package, BarChart3,
  Brain, HelpCircle, Settings, FileText, Table, LogOut, X,
  Store, Shield, Lock, Moon, Sun, Smartphone, Globe, Check,
  ChevronRight
} from "lucide-react";
import { Branch } from "../types";
import { Language, translations } from "../lib/translations";

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  setCurrentView: (view: "dashboard" | "pos" | "products" | "reports" | "ai-analyst" | "branches" | "guide") => void;
  theme: any;
  lang: Language;
  setLang: (lang: Language) => void;
  shopName: string;
  currentUserData: any;
  isStaffUser: boolean;
  activeBranchId: string;
  branches: Branch[];
  onSelectBranch: (branch: Branch | "all") => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenTerms: () => void;
  onOpenGoogleSheets: () => void;
  onToggleTheme: () => void;
  isAppInstalled: boolean;
  onInstallClick: () => void;
}

export default function MobileSidebarDrawer({
  isOpen,
  onClose,
  currentView,
  setCurrentView,
  theme,
  lang,
  setLang,
  shopName,
  currentUserData,
  isStaffUser,
  activeBranchId,
  branches,
  onSelectBranch,
  onLogout,
  onOpenSettings,
  onOpenTerms,
  onOpenGoogleSheets,
  onToggleTheme,
  isAppInstalled,
  onInstallClick,
}: MobileSidebarDrawerProps) {
  const t = translations[lang];
  const touchStartXRef = useRef<number | null>(null);

  const activeBranchName =
    activeBranchId === "all"
      ? (lang === "my" ? "ဆိုင်ခွဲ အားလုံး (All Branches)" : "All Branches")
      : (branches.find((b) => b.id === activeBranchId)?.name || currentUserData?.assignedBranchName || "Branch");

  const navItems = [
    {
      id: "dashboard" as const,
      label: t.workspace || "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "pos" as const,
      label: "POS Terminal",
      icon: ShoppingCart,
      badge: lang === "my" ? "အရောင်း" : "Sales",
    },
    {
      id: "branches" as const,
      label: lang === "my" ? "ဆိုင်ခွဲများ (Branches)" : "Branches",
      icon: Building2,
      badge: `${branches.filter((b) => b.status === "active").length || 1}`,
    },
    {
      id: "products" as const,
      label: t.products || "Products",
      icon: Package,
      badge: null,
    },
    {
      id: "reports" as const,
      label: t.salesSummary || "Reports & P&L",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "ai-analyst" as const,
      label: t.aiAnalyst || "AI Analyst",
      icon: Brain,
      badge: "AI",
    },
    {
      id: "guide" as const,
      label: lang === "my" ? "Feature လမ်းညွှန်" : "Feature Guide",
      icon: HelpCircle,
      badge: null,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current !== null && e.changedTouches.length > 0) {
                const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                if (deltaX < -50) {
                  onClose();
                }
              }
              touchStartXRef.current = null;
            }}
            className={`absolute top-0 bottom-0 left-0 w-[310px] max-w-[85vw] ${
              theme.isLight
                ? "bg-white text-slate-900 border-slate-200"
                : "bg-[#0c0c10] text-slate-100 border-white/10"
            } border-r flex flex-col shadow-2xl overflow-hidden`}
          >
            {/* Drawer Header */}
            <div
              className={`p-4 border-b ${
                theme.isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"
              } flex items-center justify-between shrink-0`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    theme.isLight
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-indigo-500 text-white shadow-md shadow-indigo-950"
                  }`}
                >
                  <Store size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-sm tracking-tight truncate leading-tight font-display">
                    {shopName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isStaffUser ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Lock size={10} />
                        Staff Mode
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Shield size={10} />
                        Store Owner
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                  theme.isLight
                    ? "bg-slate-200/60 hover:bg-slate-300 text-slate-700"
                    : "bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
                title="Close Sidebar"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
              {/* Active Branch Info Card */}
              <div
                className={`p-3 rounded-2xl border ${
                  theme.isLight
                    ? "bg-slate-100/70 border-slate-200"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} className="text-indigo-400" />
                    {lang === "my" ? "လက်ရှိ ဆိုင်ခွဲ" : "Active Branch"}
                  </span>
                  <span className="font-mono text-slate-400">
                    {currentUserData?.username || "Owner"}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span
                    className={`truncate ${
                      theme.isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {activeBranchName}
                  </span>
                </div>
              </div>

              {/* Quick Settings & Preferences (Theme, Language, App Install) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  {lang === "my" ? "အမြန် စီမံမှုများ (Quick Controls)" : "Quick Controls"}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* Theme Switcher Button */}
                  <button
                    onClick={onToggleTheme}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      theme.isLight
                        ? "bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        theme.isLight
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-indigo-500/15 text-indigo-400"
                      }`}
                    >
                      {theme.isLight ? <Moon size={15} /> : <Sun size={15} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold truncate leading-tight">
                        {theme.isLight ? "Dark Mode" : "Light Mode"}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">Theme</div>
                    </div>
                  </button>

                  {/* Language Toggle */}
                  <div
                    className={`p-1 rounded-2xl border flex items-center justify-between ${
                      theme.isLight
                        ? "bg-slate-100 border-slate-200"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setLang("en");
                        localStorage.setItem("lang", "en");
                      }}
                      className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                        lang === "en"
                          ? "bg-indigo-500 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => {
                        setLang("my");
                        localStorage.setItem("lang", "my");
                      }}
                      className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                        lang === "my"
                          ? "bg-indigo-500 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      MY
                    </button>
                  </div>
                </div>

                {/* Install App Button if not installed */}
                {!isAppInstalled && (
                  <button
                    onClick={() => {
                      onClose();
                      onInstallClick();
                    }}
                    className={`w-full p-2.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                      theme.isLight
                        ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                        : "bg-white text-black border-white hover:bg-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} />
                      <span className="text-xs font-black">
                        {lang === "my" ? "Home Screen သို့ ထည့်မည် (Install App)" : "Install App"}
                      </span>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {/* Main Navigation Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1 pt-1">
                  {lang === "my" ? "စာမျက်နှာများ (Navigation)" : "Navigation"}
                </p>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        onClose();
                      }}
                      className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-900/40"
                          : theme.isLight
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : theme.isLight
                              ? "bg-slate-200 text-slate-700"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* System & Management Modals */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1 pt-1">
                  {lang === "my" ? "စနစ် ဆက်တင်များ (Settings & Tools)" : "Settings & Tools"}
                </p>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    theme.isLight
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={16} className="text-slate-400" />
                    <span>{t.systemSettings || "System Settings"}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenGoogleSheets();
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    theme.isLight
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Table size={16} className="text-emerald-400" />
                    <span>Google Sheets Suite</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenTerms();
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    theme.isLight
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-slate-400" />
                    <span>{lang === "my" ? "စည်းကမ်းချက်များ (Terms & Privacy)" : "Terms & Conditions"}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Drawer Footer with Logout */}
            <div
              className={`p-3 border-t ${
                theme.isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"
              } shrink-0 space-y-2`}
            >
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={15} />
                <span>{t.logout || "Log Out"}</span>
              </button>

              <div className="text-center text-[10px] text-slate-500 font-mono">
                Swift POS Enterprise • v2.4
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
