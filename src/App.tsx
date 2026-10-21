import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Store, Settings, LogOut, ArrowLeft, Plus, Search, 
  Trash2, Layers, Landmark, BarChart3, Brain, LayoutDashboard, 
  ShoppingCart, Package, ListChecks, Users, HelpCircle, Truck, 
  Clock, DollarSign, ArrowUpRight, TrendingUp, Award, Percent, Calendar, Building2, ChevronDown, Sparkles, ShieldCheck,
  Wifi, WifiOff, Bell, BellOff, Zap, Receipt, Table, Sun, Moon, Lock, Shield, Globe, Check, Download,
  Smartphone, Share2, PlusSquare, MoreVertical, X, FileText, Menu, AlertTriangle
} from "lucide-react";
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, doc, getDoc, onSnapshot, query, orderBy, limit,
  where, getDocs, setDoc, serverTimestamp, addDoc, updateDoc
} from "firebase/firestore";

import { Product, Customer, Supplier, ShopSettings, Branch, StockTransfer } from "./types";
import { getTheme } from "./lib/theme";
import PosView from "./components/PosView";
import Modals from "./components/Modals";
import GoogleSheetsModal from "./components/GoogleSheetsModal";
import AiAnalyst from "./components/AiAnalyst";
import MasterAdminPanel from "./components/MasterAdminPanel";
import BranchManager from "./components/BranchManager";
import FeatureGuide from "./components/FeatureGuide";
import TermsModal from "./components/TermsModal";
import MobileSidebarDrawer from "./components/MobileSidebarDrawer";
import { getExpiryInfo, getExpiredProducts, getExpiringSoonProducts } from "./lib/pharmacy";
import OfflineIndicator from "./components/OfflineIndicator";
import { translations, Language } from "./lib/translations";
import { motion, AnimatePresence } from "motion/react";
import { requestNotificationPermission, checkLowStockAndNotify } from "./lib/notifications";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";


export default function App() {
  // Authentication & session state
  const [user, setUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("My Store");
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: "My Store",
    phone: "",
    address: "",
    footer: "Thank you!",
    theme: "clean-modern",
  });

  const theme = useMemo(() => getTheme(shopSettings.theme || "clean-modern"), [shopSettings.theme]);

  // Language localization state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("lang");
    return (saved === "my" || saved === "en") ? saved : "en";
  });

  const t = translations[lang];

  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerShopName, setRegisterShopName] = useState("");

  // Router views
  const [currentView, setCurrentView] = useState<
    "dashboard" | "pos" | "products" | "reports" | "ai-analyst" | "branches" | "guide"
  >("dashboard");

  // Global collection states
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);

  // Branch management states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>("all");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  // Computed User Roles
  const isStaffUser = !!currentUserData?.assignedBranchId || currentUserData?.role === "staff";
  const isOwnerUser = !isStaffUser;

  // Sync active branch if staff member
  useEffect(() => {
    if (currentUserData?.assignedBranchId) {
      setActiveBranchId(currentUserData.assignedBranchId);
    }
  }, [currentUserData]);

  const handleSelectBranch = (branch: Branch | "all") => {
    setIsBranchDropdownOpen(false);
    if (isStaffUser) {
      return; // Locked for staff
    }
    if (branch === "all") {
      setActiveBranchId("all");
    } else {
      setActiveBranchId(branch.id);
    }
  };

  // Modals controller
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Search in inventory
  const [invSearch, setInvSearch] = useState("");
  // Inventory Filter Tab state
  const [invFilter, setInvFilter] = useState<"all" | "low-stock" | "expiring" | "expired">("all");


  // Report active date filter
  const [reportPeriod, setReportPeriod] = useState<"today" | "yesterday" | "week" | "month" | "all">("all");

  // Track held carts globally
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // PWA Install / Add to Home Screen state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Mobile Sidebar Drawer state & Swipe Gesture Detection
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && Math.abs(deltaX) > 40) {
      if (touchStartX < 50 && deltaX > 40) {
        // Swiped right from the left edge of screen -> open sidebar
        setIsMobileSidebarOpen(true);
      } else if (isMobileSidebarOpen && deltaX < -40) {
        // Swiped left while sidebar is open -> close sidebar
        setIsMobileSidebarOpen(false);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  useEffect(() => {
    // Check if app is running in standalone mode (already installed on homescreen)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      try {
        await deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          setIsAppInstalled(true);
          setDeferredInstallPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // --- Auth State Listener ---
  useEffect(() => {
    // Check local storage master login override first
    const isMaster = localStorage.getItem("master_logged_in") === "true";
    if (isMaster) {
      setShopId("master_shop");
      setShopName("SWIFT POS");
      setUser({ uid: "master_user", email: "master@pos.local" });
      setCurrentUserData({
        shopId: "master_shop",
        shopName: "SWIFT POS",
        username: "master",
        role: "admin",
        expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const emailPrefix = u.email ? u.email.split("@")[0].toLowerCase() : "";
        let userData: any = null;

        try {
          // 1. Try UID document
          const userDocRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else if (emailPrefix) {
            // 2. Try emailPrefix document ID
            const prefixDocRef = doc(db, "users", emailPrefix);
            const prefixDoc = await getDoc(prefixDocRef);
            if (prefixDoc.exists()) {
              userData = prefixDoc.data();
            } else {
              // 3. Query username == emailPrefix
              const q = query(collection(db, "users"), where("username", "==", emailPrefix));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                userData = querySnap.docs[0].data();
              }
            }
          }

          // 4. Auto-creation fallback for admin/Firebase-console created auth accounts
          if (!userData) {
            const newShopId = "shop_" + u.uid.substring(0, 8);
            userData = {
              shopId: newShopId,
              shopName: "My Store",
              username: emailPrefix || "user",
              role: "user",
              expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days trial default
              createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users", u.uid), userData);
            await setDoc(doc(db, "shops", newShopId), {
              shopName: "My Store",
              createdAt: serverTimestamp()
            });
            await setDoc(doc(db, "shops", newShopId, "settings", "general"), {
              shopName: "My Store",
              phone: "",
              address: "",
              footer: "Thank you!",
              theme: "clean-modern"
            });
          }

          // 5. Expiry Verification
          if (new Date() > new Date(userData.expiryDate)) {
            setLoginErr("လိုင်စင်သက်တမ်း ကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြု၍ ဆက်သွယ်ပါ။ (Your license key has expired. Please contact support.)");
            signOut(auth);
            setUser(null);
            setShopId(null);
            setCurrentUserData(null);
            return;
          }

          setShopId(userData.shopId);
          setShopName(userData.shopName || "My Store");
          setCurrentUserData(userData);
        } catch (error: any) {
          console.error("Auth bootstrap error:", error);
        }
      } else {
        setUser(null);
        setShopId(null);
        setCurrentUserData(null);
      }
    });
    return () => unsub();
  }, []);

  // --- Store settings listener ---
  useEffect(() => {
    if (!shopId) return;
    const configRef = doc(db, "shops", shopId, "settings", "general");
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ShopSettings;
        setShopSettings(data);
        setShopName(data.shopName || shopName);
      }
    });
    return () => unsubscribe();
  }, [shopId]);

  // --- Real-time Data Listeners ---
  useEffect(() => {
    if (!shopId) return;

    // Listen products
    const prodQ = query(collection(db, "shops", shopId, "products"), orderBy("name"));
    const unsubProd = onSnapshot(prodQ, (snap) => {
      const items: Product[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Product));
      setAllProducts(items);
    });

    // Listen customers
    const custQ = query(collection(db, "shops", shopId, "customers"), orderBy("name"));
    const unsubCust = onSnapshot(custQ, (snap) => {
      const items: Customer[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(items);
    });

    // Listen suppliers
    const suppQ = query(collection(db, "shops", shopId, "suppliers"), orderBy("name"));
    const unsubSupp = onSnapshot(suppQ, (snap) => {
      const items: Supplier[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(items);
    });

    // Listen sales
    const salesQ = query(collection(db, "shops", shopId, "sales"), orderBy("createdAt", "desc"), limit(100));
    const unsubSales = onSnapshot(salesQ, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setSalesHistory(items);
    });

    // Listen expenses
    const expQ = query(collection(db, "shops", shopId, "expenses"));
    const unsubExp = onSnapshot(expQ, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setExpenses(items);
    });

    // Listen purchases
    const purQ = query(collection(db, "shops", shopId, "purchases"));
    const unsubPur = onSnapshot(purQ, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setPurchases(items);
    });

    // Listen payroll
    const payQ = query(collection(db, "shops", shopId, "payroll"));
    const unsubPay = onSnapshot(payQ, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setPayroll(items);
    });

    // Listen branches
    const branchQ = query(collection(db, "shops", shopId, "branches"));
    const unsubBranch = onSnapshot(branchQ, (snap) => {
      const items: Branch[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as Branch));
      
      if (items.length === 0) {
        const defaultBranchRef = doc(collection(db, "shops", shopId, "branches"));
        const initialBranch: Branch = {
          id: defaultBranchRef.id,
          name: "Main Branch / ပင်မဆိုင်",
          code: "MAIN",
          isMain: true,
          status: "active",
          createdAt: new Date().toISOString() as any,
        };
        setBranches([initialBranch]);
        setBranchesLoaded(true);
        setDoc(defaultBranchRef, {
          name: "Main Branch / ပင်မဆိုင်",
          code: "MAIN",
          isMain: true,
          status: "active",
          createdAt: serverTimestamp(),
        }).catch((err) => console.error("Error auto-creating main branch:", err));
      } else {
        setBranches(items);
        setBranchesLoaded(true);
      }
    }, (err) => {
      console.error("Branch subscription error:", err);
    });

    // Listen stock transfers
    const transferQ = query(collection(db, "shops", shopId, "stock_transfers"), limit(100));
    const unsubTransfer = onSnapshot(transferQ, (snap) => {
      const items: StockTransfer[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as StockTransfer));
      setStockTransfers(items);
    });

    return () => {
      unsubProd();
      unsubCust();
      unsubSupp();
      unsubSales();
      unsubExp();
      unsubPur();
      unsubPay();
      unsubBranch();
      unsubTransfer();
    };
  }, [shopId]);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);

    if (loginUser.trim() === "master" && loginPass === "master123") {
      localStorage.setItem("master_logged_in", "true");
      setShopId("master_shop");
      setShopName("SWIFT POS");
      setUser({ uid: "master_user", email: "master@pos.local" });
      setLoginLoading(false);
      return;
    }

    try {
      const email = loginUser.trim().includes("@") 
        ? loginUser.trim() 
        : `${loginUser.trim()}@pos.local`;
      await signInWithEmailAndPassword(auth, email, loginPass);
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginErr(t.loginErr || "လော့ဂ်အင် အဆင်မပြေပါ။ အကောင့်အချက်အလက်များကို ပြန်စစ်ပါ။");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);

    const usernameTrimmed = loginUser.trim();
    if (!usernameTrimmed) {
      setLoginErr(lang === "my" ? "အသုံးပြုသူအမည် ဖြည့်စွက်ပေးပါ။" : "Username is required.");
      setLoginLoading(false);
      return;
    }
    if (loginPass.length < 6) {
      setLoginErr(lang === "my" ? "လျှို့ဝှက်နံပါတ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။" : "Password must be at least 6 characters.");
      setLoginLoading(false);
      return;
    }

    try {
      const email = usernameTrimmed.includes("@") 
        ? usernameTrimmed 
        : `${usernameTrimmed}@pos.local`;

      const userCredential = await createUserWithEmailAndPassword(auth, email, loginPass);
      const u = userCredential.user;
      
      const newShopId = "shop_" + u.uid.substring(0, 8);
      const chosenShopName = registerShopName.trim() || `${usernameTrimmed} Store`;

      const userData = {
        shopId: newShopId,
        shopName: chosenShopName,
        username: usernameTrimmed,
        role: "owner",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", u.uid), userData);
      await setDoc(doc(db, "users", usernameTrimmed.toLowerCase()), userData);
      await setDoc(doc(db, "shops", newShopId), {
        shopName: chosenShopName,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, "shops", newShopId, "settings", "general"), {
        shopName: chosenShopName,
        phone: "",
        address: "",
        footer: "Thank you!",
        theme: "immersive-glass"
      });

      // Explicitly initialize Main Branch
      const mainBranchRef = doc(collection(db, "shops", newShopId, "branches"));
      await setDoc(mainBranchRef, {
        name: "Main Branch / ပင်မဆိုင်",
        code: "MAIN",
        isMain: true,
        status: "active",
        createdAt: serverTimestamp()
      });

      alert(t.registerSuccess || "Account registered successfully!");
      setIsRegisterMode(false);
    } catch (err: any) {
      console.error("Registration failed:", err);
      let errMsg = err.message;
      if (err.code === "auth/email-already-in-use") {
        errMsg = lang === "my" ? "ဤအသုံးပြုသူအမည်မှာ သုံးပြီးသားဖြစ်နေပါသည်။" : "This username is already taken.";
      } else if (err.code === "auth/weak-password") {
        errMsg = lang === "my" ? "လျှို့ဝှက်နံပါတ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။" : "Password must be at least 6 characters.";
      }
      setLoginErr(errMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("master_logged_in");
    signOut(auth);
    setUser(null);
    setShopId(null);
    setCurrentUserData(null);
    setCurrentView("dashboard");
  };

  // ─── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredSalesForReport.length === 0) {
      alert(lang === "my" ? "Export ပြုလုပ်ရန် အရောင်းမှတ်တမ်း မရှိပါ။" : "No sales data to export.");
      return;
    }
    const header = ["Date", "Customer", "Items", "Subtotal", "Discount", "Tax", "Total", "Payment", "Cashier", "Branch", "TxnRef"];
    const rows = filteredSalesForReport.map((s) => {
      const date = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : new Date(s.createdAt).toLocaleString();
      const items = (s.items || []).map((i: any) => `${i.name}x${i.qty}`).join("; ");
      return [
        `"${date}"`,
        `"${s.customerName || "Walk-in"}"`,
        `"${items}"`,
        s.subTotal || 0,
        s.discount || 0,
        s.tax || 0,
        s.total || 0,
        `"${s.paymentMethod || ""}"`,
        `"${s.cashierName || ""}"`,
        `"${s.branchName || ""}"`,
        `"${s.txnRef || ""}"`,
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swift-pos-sales-${reportPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const licenseDaysLeft = useMemo(() => {
    if (!currentUserData || !currentUserData.expiryDate) return null;
    const diff = new Date(currentUserData.expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [currentUserData]);

  // --- Dashboard Real-time Stats Computations ---
  const dashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const branchFilteredSales = activeBranchId === "all" 
      ? salesHistory 
      : salesHistory.filter((s) => s.branchId === activeBranchId);

    const todaySales = branchFilteredSales.filter((s) => {
      const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return date && date >= today;
    });

    const revenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const count = todaySales.length;

    // COD Pending amount
    const codPendingAmount = branchFilteredSales
      .filter((s) => s.paymentMethod === "COD" && s.codStatus === "Pending")
      .reduce((sum, s) => sum + (s.total || 0), 0);

    return {
      revenue,
      salesCount: count,
      codPendingAmount,
      customersCount: customers.length,
    };
  }, [salesHistory, customers, activeBranchId]);

  // --- Reports Tab Computations ---
  const filteredSalesForReport = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const branchFilteredSales = activeBranchId === "all" 
      ? salesHistory 
      : salesHistory.filter((s) => s.branchId === activeBranchId);

    return branchFilteredSales.filter((s) => {
      if (!s.createdAt) return false;
      const sDate = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      
      if (reportPeriod === "today") {
        return sDate >= startOfToday;
      } else if (reportPeriod === "yesterday") {
        return sDate >= startOfYesterday && sDate < startOfToday;
      } else if (reportPeriod === "week") {
        return sDate >= startOfWeek;
      } else if (reportPeriod === "month") {
        return sDate >= startOfMonth;
      }
      return true; // "all"
    });
  }, [salesHistory, reportPeriod, activeBranchId]);

  const filteredExpensesForReport = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return expenses.filter((e) => {
      if (!e.createdAt) return true;
      const eDate = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      if (reportPeriod === "today") return eDate >= startOfToday;
      if (reportPeriod === "yesterday") return eDate >= startOfYesterday && eDate < startOfToday;
      if (reportPeriod === "week") return eDate >= startOfWeek;
      if (reportPeriod === "month") return eDate >= startOfMonth;
      return true;
    });
  }, [expenses, reportPeriod]);

  const filteredPurchasesForReport = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return purchases.filter((p) => {
      if (!p.createdAt) return true;
      const pDate = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      if (reportPeriod === "today") return pDate >= startOfToday;
      if (reportPeriod === "yesterday") return pDate >= startOfYesterday && pDate < startOfToday;
      if (reportPeriod === "week") return pDate >= startOfWeek;
      if (reportPeriod === "month") return pDate >= startOfMonth;
      return true;
    });
  }, [purchases, reportPeriod]);

  const filteredPayrollForReport = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return payroll.filter((p) => {
      if (!p.createdAt) return true;
      const pDate = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      if (reportPeriod === "today") return pDate >= startOfToday;
      if (reportPeriod === "yesterday") return pDate >= startOfYesterday && pDate < startOfToday;
      if (reportPeriod === "week") return pDate >= startOfWeek;
      if (reportPeriod === "month") return pDate >= startOfMonth;
      return true;
    });
  }, [payroll, reportPeriod]);

  const reportTotals = useMemo(() => {
    const totalRev = filteredSalesForReport.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalCost = filteredSalesForReport.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const totalExpenses = filteredExpensesForReport.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPurchases = filteredPurchasesForReport.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayroll = filteredPayrollForReport.reduce((sum, p) => sum + (p.amount || 0), 0);

    const netProfit = totalRev - totalCost - totalExpenses - totalPayroll;
    const grossMargin = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0;
    const salesCount = filteredSalesForReport.length;
    const avgVoucher = salesCount > 0 ? totalRev / salesCount : 0;

    return {
      totalRev,
      totalCost,
      totalExpenses,
      totalPurchases,
      totalPayroll,
      netProfit,
      grossMargin,
      salesCount,
      avgVoucher,
    };
  }, [filteredSalesForReport, filteredExpensesForReport, filteredPurchasesForReport, filteredPayrollForReport]);

  const topSellingProducts = useMemo(() => {
    const productsMap: { [name: string]: { qty: number; revenue: number } } = {};
    
    filteredSalesForReport.forEach((sale) => {
      const items = sale.items || [];
      items.forEach((item: any) => {
        const name = item.name || "Unknown Item";
        const qty = item.qty || 0;
        const price = item.price || 0;
        const totalItemRev = qty * price;

        if (!productsMap[name]) {
          productsMap[name] = { qty: 0, revenue: 0 };
        }
        productsMap[name].qty += qty;
        productsMap[name].revenue += totalItemRev;
      });
    });

    return Object.keys(productsMap)
      .map((name) => ({
        name,
        qty: productsMap[name].qty,
        revenue: productsMap[name].revenue,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSalesForReport]);

  const paymentMethodsBreakdown = useMemo(() => {
    const methods = ["Cash", "KPay", "WavePay", "AYA Pay", "Credit", "COD"];
    const counts: { [method: string]: number } = {};
    methods.forEach((m) => (counts[m] = 0));

    filteredSalesForReport.forEach((s) => {
      const pm = s.paymentMethod || "Cash";
      const total = s.total || 0;
      if (counts[pm] !== undefined) {
        counts[pm] += total;
      } else {
        counts[pm] = total;
      }
    });

    const totalSales = Object.values(counts).reduce((sum, v) => sum + v, 0);

    return Object.keys(counts).map((method) => {
      const amount = counts[method];
      const percentage = totalSales > 0 ? (amount / totalSales) * 100 : 0;
      return {
        method,
        amount,
        percentage,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesForReport]);

  const last7DaysSales = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const totalForD = salesHistory
        .filter((s) => {
          if (!s.createdAt) return false;
          const sDate = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
          return sDate >= startOfD && sDate < endOfD;
        })
        .reduce((sum, s) => sum + (s.total || 0), 0);

      result.push({
        dateLabel: dateStr,
        amount: totalForD,
      });
    }
    return result;
  }, [salesHistory]);

  const filteredInventoryProducts = useMemo(() => {
    let prods = allProducts;
    const today = new Date().toISOString().slice(0, 10);
    const in60d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (invFilter === "low-stock") {
      prods = prods.filter((p) => p.quantity <= (p.lowStockThreshold || 5));
    } else if (invFilter === "expiring") {
      prods = prods.filter((p) => p.expiryDate && p.expiryDate >= today && p.expiryDate <= in60d);
    } else if (invFilter === "expired") {
      prods = prods.filter((p) => p.expiryDate && p.expiryDate < today);
    }

    if (!invSearch) return prods;
    const term = invSearch.toLowerCase();
    return prods.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.genericName && p.genericName.toLowerCase().includes(term)) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  }, [allProducts, invSearch, invFilter]);

  const lowStockCount = useMemo(() => {
    return allProducts.filter((p) => p.quantity <= (p.lowStockThreshold || 5)).length;
  }, [allProducts]);

  const expiringCount = useMemo(() => {
    return getExpiringSoonProducts(allProducts, 60).length;
  }, [allProducts]);

  const expiredCount = useMemo(() => {
    return getExpiredProducts(allProducts).length;
  }, [allProducts]);

  // --- Auth Render fallback ---
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[100vh] bg-[#050505] text-slate-200 relative overflow-hidden font-sans">
        {/* Background Glow Effect */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Floating Language Selector at Top Right */}
        <div className="absolute top-4 right-4 z-20 flex gap-1 bg-[#0a0a0a]/80 p-1 rounded-xl border border-white/10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLang("en");
              localStorage.setItem("lang", "en");
            }}
            className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition ${
              lang === "en" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            EN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLang("my");
              localStorage.setItem("lang", "my");
            }}
            className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition ${
              lang === "my" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            မြန်မာ
          </motion.button>
        </div>

        <div className="w-full max-w-sm text-center bg-[#121214] border border-neutral-800 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Store className="text-black" size={32} />
          </div>
          <h2 className="text-2xl font-black mb-1 text-white tracking-tight font-display">
            {isRegisterMode ? (t.registerTitle || "Create Account") : t.loginTitle}
          </h2>
          <p className="text-neutral-400 mb-6 text-xs font-medium">
            {t.loginSubtitle}
          </p>
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">{t.username}</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder={t.loginPlaceholder}
                className="w-full p-3.5 bg-[#18181b] border border-neutral-800 rounded-xl outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition text-sm font-semibold text-white placeholder:text-neutral-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">{t.password}</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full p-3.5 bg-[#18181b] border border-neutral-800 rounded-xl outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition text-sm font-semibold text-white placeholder:text-neutral-500"
              />
            </div>
            {isRegisterMode && (
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">{t.storeName} (Optional)</label>
                <input
                  type="text"
                  value={registerShopName}
                  onChange={(e) => setRegisterShopName(e.target.value)}
                  placeholder={lang === "my" ? "ဆိုင်အမည် (ဥပမာ- Kyaw Store)..." : "Store Name (e.g. Kyaw Store)..."}
                  className="w-full p-3.5 bg-[#18181b] border border-neutral-800 rounded-xl outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition text-sm font-semibold text-white placeholder:text-neutral-500"
                />
              </div>
            )}
            {loginErr && <p className="text-rose-400 text-xs font-bold mt-2">{loginErr}</p>}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loginLoading}
              className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3.5 rounded-xl shadow-sm transition text-sm mt-5 disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (isRegisterMode ? t.signingUp : t.loggingIn) : (isRegisterMode ? t.signUp : t.login)}
            </motion.button>
          </form>

          {/* Toggle Mode Button */}
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setLoginErr("");
              }}
              className="text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {isRegisterMode ? t.haveAccount : t.noAccount}
            </motion.button>
          </div>

          {/* Terms & Conditions Link on Login Screen */}
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-[11px] text-neutral-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <FileText size={12} />
              <span>{lang === "my" ? "အသုံးပြုမှု စည်းကမ်းချက်များနှင့် မူဝါဒများ" : "Terms & Conditions & Privacy Policy"}</span>
            </button>
          </div>
        </div>

        {/* Terms Modal for Login Screen */}
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          lang={lang}
          theme={theme}
        />
      </div>
    );
  }

  if (shopId === "master_shop") {
    return (
      <div className="h-[100vh] flex flex-col w-full bg-[#060606] relative overflow-hidden font-sans">
        <MasterAdminPanel lang={lang} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`${theme.bgOuter} h-[100vh] flex flex-col ${theme.isLight ? "text-slate-800" : "text-slate-200"} w-full relative overflow-hidden font-sans`}
    >
      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Background Glow Effect */}
      <div className={`absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 ${theme.glow1} blur-[120px] rounded-full pointer-events-none`}></div>
      <div className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 ${theme.glow2} blur-[100px] rounded-full pointer-events-none`}></div>

      {/* Header bar */}
      {currentView !== "pos" && (
        <header className={`${theme.isLight ? "bg-slate-100/50" : "bg-black/20"} backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between shrink-0 border-b ${theme.border} z-40 pt-safe relative`}>
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`w-9 h-9 sm:w-10 sm:h-10 ${
                theme.isLight 
                  ? "bg-slate-200/60 border-slate-300 text-slate-800 hover:bg-slate-200" 
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              } border rounded-xl flex items-center justify-center shadow-sm cursor-pointer lg:hidden shrink-0`}
              title={lang === "my" ? "Sidebar Menu ဖွင့်မည်" : "Open Sidebar Menu"}
            >
              <Menu size={18} />
            </motion.button>

            {currentView !== "dashboard" && (
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`w-9 h-9 sm:w-10 sm:h-10 ${theme.isLight ? "bg-slate-200/50 border-slate-300 text-slate-700" : "bg-white/5 border-white/10 text-slate-300"} border rounded-xl flex items-center justify-center shadow-sm hover:opacity-85 transition cursor-pointer shrink-0`}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className={`${theme.textAccent} ${theme.bgAccent} border ${theme.borderAccent} p-2 rounded-xl hidden xs:flex shrink-0`}>
              <Store size={18} />
            </div>
            <div className="min-w-0">
              <h1 className={`font-black ${theme.isLight ? "text-slate-900" : "text-white"} text-xs sm:text-base leading-tight tracking-tight font-display truncate max-w-[100px] xs:max-w-[140px] sm:max-w-none`}>
                {currentView === "dashboard" 
                  ? t.workspace 
                  : currentView === "products" 
                  ? t.products 
                  : currentView === "reports" 
                  ? t.salesSummary 
                  : currentView === "ai-analyst" 
                  ? t.aiAnalyst 
                  : currentView === "branches"
                  ? (lang === "my" ? "ဆိုင်ခွဲများ စီမံခန့်ခွဲခြင်း (Branch Manager)" : "Branch Management")
                  : currentView === "guide"
                  ? (lang === "my" ? "Feature လမ်းညွှန်" : "Feature Guide")
                  : currentView}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">
                {shopName}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-black/20 dark:bg-white/5 border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <LayoutDashboard size={14} />
              <span>{t.workspace || "Dashboard"}</span>
            </button>

            <button
              onClick={() => setCurrentView("pos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "pos"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <ShoppingCart size={14} />
              <span>POS</span>
            </button>

            <button
              onClick={() => setCurrentView("branches")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "branches"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <Building2 size={14} />
              <span>{lang === "my" ? "ဆိုင်ခွဲများ (Branches)" : "Branches"}</span>
            </button>

            <button
              onClick={() => setCurrentView("products")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "products"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <Package size={14} />
              <span>{t.products}</span>
            </button>

            <button
              onClick={() => setCurrentView("reports")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "reports"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <BarChart3 size={14} />
              <span>{t.salesSummary}</span>
            </button>

            <button
              onClick={() => setCurrentView("ai-analyst")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "ai-analyst"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <Sparkles size={14} />
              <span>{t.aiAnalyst}</span>
            </button>

            <button
              onClick={() => setCurrentView("guide")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === "guide"
                  ? "bg-indigo-500 text-white shadow"
                  : `${theme.isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`
              }`}
            >
              <HelpCircle size={14} />
              <span>{lang === "my" ? "Features" : "Features"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Branch Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition cursor-pointer ${
                  isStaffUser
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                    : theme.isLight 
                    ? "bg-slate-200/60 border-slate-300 text-slate-800 hover:bg-slate-200" 
                    : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Building2 size={13} className={isStaffUser ? "text-amber-400 shrink-0" : "text-indigo-400 shrink-0"} />
                <span className="truncate max-w-[80px] sm:max-w-[140px]">
                  {activeBranchId === "all" 
                    ? (lang === "my" ? "ဆိုင်ခွဲ အားလုံး" : "All Branches")
                    : (branches.find((b) => b.id === activeBranchId)?.name || currentUserData?.assignedBranchName || "Branch")}
                </span>
                {isStaffUser ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-black flex items-center gap-1">
                    <Lock size={10} /> Staff
                  </span>
                ) : (
                  <ChevronDown size={12} className="text-slate-400" />
                )}
              </button>

              {isBranchDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" 
                    onClick={() => setIsBranchDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                    {isStaffUser ? (
                      /* Staff Account Status Card */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-1 border-b border-white/10">
                          <ShieldCheck size={16} />
                          <span>{lang === "my" ? "အလုပ်သမား မုဒ် (Staff Mode)" : "Staff Account Mode"}</span>
                        </div>
                        <div className="text-xs text-slate-300 space-y-1">
                          <p className="flex justify-between">
                            <span className="text-slate-400">{lang === "my" ? "အသုံးပြုသူ:" : "User:"}</span>
                            <strong className="text-white font-mono">{currentUserData?.username}</strong>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">{lang === "my" ? "ဆိုင်ခွဲ:" : "Branch:"}</span>
                            <strong className="text-amber-300">{branches.find((b) => b.id === activeBranchId)?.name || currentUserData?.assignedBranchName || "Branch"}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                            {lang === "my" ? "ဆိုင်ခွဲ ပြောင်းလဲကြည့်ရှုခြင်းကို အလုပ်ရှင် (Store Owner) မုဒ်မှသာ ဆောင်ရွက်နိုင်ပါသည်။" : "Branch switching is restricted to the Store Owner account."}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsBranchDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full mt-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut size={13} />
                          {lang === "my" ? "အကောင့်ထွက်မည် / အလုပ်ရှင်အဖြစ် ဝင်မည်" : "Log Out / Switch Account"}
                        </button>
                      </div>
                    ) : (
                      /* Store Owner Switcher Menu */
                      <>
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                              {lang === "my" ? "ဆိုင်ရှင် မုဒ် (Store Owner)" : "Store Owner Mode"}
                            </div>
                            <div className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                              <Shield size={13} className="text-white" />
                              {currentUserData?.username || "Owner"}
                            </div>
                          </div>
                          <span className="text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full font-bold">
                            Full Access
                          </span>
                        </div>

                        <div className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-wider pt-1">
                          {lang === "my" ? "ကြည့်ရှုလိုသည့် ဆိုင်ခွဲ ရွေးပါ" : "Select Active Branch View"}
                        </div>

                        <button
                          onClick={() => handleSelectBranch("all")}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                            activeBranchId === "all" ? "bg-white text-black font-black" : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Globe size={13} />
                            {lang === "my" ? "ဆိုင်ခွဲ အားလုံး (All)" : "All Branches"}
                          </span>
                          {activeBranchId === "all" && <Check size={12} />}
                        </button>

                        {branches.filter((b) => b.status === "active").map((b) => (
                          <button
                            key={b.id}
                            onClick={() => handleSelectBranch(b)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              activeBranchId === b.id ? "bg-white text-black font-black" : "text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={13} />
                                {b.name}
                              </div>
                              {b.username && (
                                <div className="text-[9px] font-semibold text-neutral-400 pl-5 font-mono">
                                  Staff User: {b.username}
                                </div>
                              )}
                            </div>
                            {activeBranchId === b.id && <Check size={12} className="text-black" />}
                          </button>
                        ))}

                        <div className="pt-1.5 border-t border-white/10">
                          <button
                            onClick={() => {
                              setCurrentView("branches");
                              setIsBranchDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={13} />
                            {lang === "my" ? "ဆိုင်ခွဲ အကောင့်များ ပြုလုပ်ရန်/စီမံရန်" : "Create & Manage Branch Users"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Add to Home Screen / Install App Button */}
            {!isAppInstalled && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallClick}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all cursor-pointer shadow-sm ${
                  theme.isLight
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                    : "bg-white text-black border-white hover:bg-neutral-200"
                }`}
                title={lang === "my" ? "Home Screen သို့ ထည့်သွင်းမည် (Install App)" : "Add to Home Screen / Install App"}
              >
                <Smartphone size={13} className="shrink-0" />
                <span className="hidden sm:inline">
                  {lang === "my" ? "App ထည့်မည်" : "Install App"}
                </span>
              </motion.button>
            )}

            {/* Premium Language Pill Toggle */}
            <div className={`flex ${theme.isLight ? "bg-slate-200/50" : "bg-white/5"} p-1 rounded-full border ${theme.border} text-[10px] mr-1`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLang("en");
                  localStorage.setItem("lang", "en");
                }}
                className={`px-2.5 py-1 font-black rounded-full cursor-pointer transition-all ${
                  lang === "en" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                EN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLang("my");
                  localStorage.setItem("lang", "my");
                }}
                className={`px-2.5 py-1 font-black rounded-full cursor-pointer transition-all ${
                  lang === "my" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                MY
              </motion.button>
            </div>

            {/* Quick Clean Dark / Light Mode Switcher (Tablet & Desktop) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                const nextTheme = theme.isLight ? "clean-modern" : "clean-light";
                setShopSettings((prev) => ({ ...prev, theme: nextTheme }));
                if (shopId) {
                  try {
                    await updateDoc(doc(db, "shops", shopId, "settings", "general"), { theme: nextTheme });
                  } catch (e) {
                    console.error("Theme toggle error:", e);
                  }
                }
              }}
              className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 ${theme.isLight ? "bg-slate-200/50 border-slate-300 text-amber-500" : "bg-white/5 border-white/10 text-indigo-300"} border rounded-full items-center justify-center shadow-sm hover:opacity-85 transition cursor-pointer`}
              title={theme.isLight ? (lang === "my" ? "Clean Dark Mode သို့ ပြောင်းမည်" : "Switch to Clean Dark Mode") : (lang === "my" ? "Clean Light Mode သို့ ပြောင်းမည်" : "Switch to Clean Light Mode")}
            >
              {theme.isLight ? <Moon size={16} /> : <Sun size={16} />}
            </motion.button>

            {/* System Settings (Desktop) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveModal("settings")}
              className={`hidden md:flex w-9 h-9 sm:w-10 sm:h-10 ${theme.isLight ? "bg-slate-200/50 border-slate-300 text-slate-700" : "bg-white/5 border-white/10 text-slate-300"} border rounded-full items-center justify-center shadow-sm hover:opacity-85 transition cursor-pointer`}
              title={t.systemSettings}
            >
              <Settings size={17} />
            </motion.button>

            {/* Terms & Conditions (Desktop) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTermsModal(true)}
              className={`hidden md:flex w-9 h-9 sm:w-10 sm:h-10 ${theme.isLight ? "bg-slate-200/50 border-slate-300 text-slate-700" : "bg-white/5 border-white/10 text-slate-300"} border rounded-full items-center justify-center shadow-sm hover:opacity-85 transition cursor-pointer`}
              title={lang === "my" ? "စည်းကမ်းချက်များနှင့် မူဝါဒများ (Terms & Conditions)" : "Terms & Conditions & Privacy"}
            >
              <FileText size={16} />
            </motion.button>

            {/* Logout (Tablet & Desktop) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 bg-rose-500/10 border border-rose-500/20 rounded-full items-center justify-center text-rose-400 shadow-sm hover:bg-rose-500/20 transition cursor-pointer"
              title={t.logout}
            >
              <LogOut size={17} />
            </motion.button>
          </div>
        </header>
      )}

      {/* Main View Router Content */}
      <main className="flex-1 overflow-hidden relative z-10">
        {/* VIEW 1: DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="w-full h-full overflow-y-auto px-4 sm:px-6 pb-24 no-scrollbar space-y-6 pt-2">
            {/* SaaS Client License Status Banner */}
            {currentUserData && shopId !== "master_shop" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    licenseDaysLeft !== null && licenseDaysLeft <= 5 
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-display">
                      {lang === "my" ? "စနစ်အသုံးပြုခွင့် လိုင်စင်အခြေအနေ" : "System License Status"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-mono">
                      {lang === "my" 
                        ? `လိုင်စင်သက်တမ်းကုန်ဆုံးရန် ${licenseDaysLeft} ရက် ကျန်ပါသေးသည်` 
                        : `${licenseDaysLeft} days remaining on your active license`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                    licenseDaysLeft !== null && licenseDaysLeft <= 3 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {licenseDaysLeft !== null && licenseDaysLeft <= 3 
                      ? (lang === "my" ? "စမ်းသပ်အသုံးပြုမှု" : "Trial Account") 
                      : (lang === "my" ? "လုပ်ငန်းသုံးလိုင်စင်" : "Premium License")}
                  </span>
                  <button 
                    onClick={() => alert(
                      lang === "my" 
                        ? "စနစ်လိုင်စင် သက်တမ်းတိုးရန် သို့မဟုတ် ဝယ်ယူရန်အတွက် ကျေးဇူးပြု၍ မာစတာစနစ်စီမံခန့်ခွဲသူ (သို့မဟုတ် ဖုန်းနံပါတ်/Viber) သို့ ဆက်သွယ်ဆောင်ရွက်ပေးပါရန်။" 
                        : "To extend or purchase a full system license, please contact your System Administrator directly."
                    )}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black border border-white/10 text-white rounded-lg transition"
                  >
                    {lang === "my" ? "သက်တမ်းတိုးရန် ဆက်သွယ်ရန်" : "Renew License"}
                  </button>
                </div>
              </div>
            )}

            {/* Pharmacy Expiry Alert Banner */}
            {(expiredCount > 0 || expiringCount > 0) && (
              <div className="bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    expiredCount > 0
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white font-display flex items-center gap-2">
                      <span>{lang === "my" ? "ဆေးဝါး သက်တမ်းကုန်ဆုံးမှု သတိပေးချက်" : "Pharmacy Expiry Alert"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      {expiredCount > 0 && (
                        <span className="text-rose-400 font-bold mr-2">
                          {expiredCount} {lang === "my" ? "မျိုး သက်တမ်းကုန်ပြီ" : "items expired"}
                        </span>
                      )}
                      {expiringCount > 0 && (
                        <span className="text-amber-300 font-bold">
                          {expiringCount} {lang === "my" ? "မျိုး ၆၀ ရက်အတွင်း ကုန်မည်" : "items expiring in 60d"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal("expiry-alerts")}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer shrink-0 shadow-sm"
                >
                  {lang === "my" ? "ဆေးဝါးများ စစ်ဆေးရန်" : "Review Medicines"}
                </button>
              </div>
            )}

            {/* Call to action POS banner */}
            <div className={`bg-[#121214] border border-neutral-800 rounded-[2rem] p-6 sm:p-7 shadow-sm relative overflow-hidden text-white shrink-0`}>
              <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4 pointer-events-none">
                <Store size={150} />
              </div>
              <div className="relative z-10">
                <h2 className="font-black text-2xl mb-1 text-white font-display tracking-tight">{t.posBannerTitle}</h2>
                <p className="text-neutral-400 text-xs sm:text-sm mb-5 font-semibold">{t.posBannerSub}</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentView("pos")}
                  className="bg-white text-black hover:bg-neutral-200 px-6 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
                >
                  <ShoppingCart size={16} /> {t.posBannerBtn}
                </motion.button>
              </div>
            </div>

            {/* Quick calculations panels */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${theme.bgInner} p-4 rounded-[1.5rem] border ${theme.border} shadow-sm`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {lang === "my" ? "ယနေ့အရောင်းအရေအတွက်" : "Today's Sales (Count)"}
                </p>
                <div className="flex items-end gap-1">
                  <h3 className={`text-2xl font-black ${theme.textAccent} font-display`}>{dashboardStats.salesCount}</h3>
                  <span className="text-[9px] font-bold text-slate-500 mb-1">{lang === "my" ? "ကြိမ်" : "times"}</span>
                </div>
              </div>
              <div className={`${theme.bgInner} p-4 rounded-[1.5rem] border ${theme.border} shadow-sm`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.todaySales}</p>
                <div className="flex items-end gap-1 overflow-hidden">
                  <h3 className={`text-xl font-black ${theme.isLight ? "text-slate-800" : "text-white"} font-display truncate`}>
                    {dashboardStats.revenue.toLocaleString()}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 mb-1">Ks</span>
                </div>
              </div>
              <div className={`${theme.bgInner} p-4 rounded-[1.5rem] border ${theme.border} shadow-sm`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.codPending}</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-xl font-black text-amber-500 font-display truncate">
                    {dashboardStats.codPendingAmount.toLocaleString()}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 mb-1">Ks</span>
                </div>
              </div>
              <div className={`${theme.bgInner} p-4 rounded-[1.5rem] border ${theme.border} shadow-sm`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.totalCustomers}</p>
                <h3 className={`text-2xl font-black ${theme.isLight ? "text-slate-800" : "text-white"} font-display`}>{dashboardStats.customersCount}</h3>
              </div>
            </div>

            {/* Quick operations panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t.quickOps}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView("pos")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-900 text-white" : "bg-white text-black"} w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm`}>
                    <ShoppingCart size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-900" : "text-white"} text-center`}>{t.newSale}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal("sales-list")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} w-12 h-12 rounded-xl flex items-center justify-center border`}>
                    <ListChecks size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-300"} text-center`}>{t.salesRecords}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal("purchase-list")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} w-12 h-12 rounded-xl flex items-center justify-center border`}>
                    <Package size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-300"} text-center`}>{t.purchasedItems}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal("z-report")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} w-12 h-12 rounded-xl flex items-center justify-center border`}>
                    <Receipt size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-300"} text-center`}>
                    {lang === "my" ? "Z-Report (နေ့ချုပ်)" : "Z-Report"}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal("google-sheets")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} w-12 h-12 rounded-xl flex items-center justify-center border`}>
                    <Table size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-300"} text-center`}>
                    Google Sheets
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal("cod")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} w-12 h-12 rounded-xl flex items-center justify-center border`}>
                    <Truck size={22} />
                  </div>
                  <span className={`text-[10px] font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-300"} text-center`}>{t.codTracking}</span>
                </motion.button>
              </div>
            </div>

            {/* Other services buttons list */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t.otherSecs}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setCurrentView("branches")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer group`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Building2 size={18} />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-bold ${theme.isLight ? "text-neutral-900" : "text-white"}`}>{t.branches}</div>
                    <div className="text-[9px] text-neutral-400 font-semibold">
                      {!branchesLoaded
                        ? <span className="inline-block w-8 h-2.5 bg-neutral-800 rounded animate-pulse" />
                        : <>{branches.length} {lang === "my" ? "ဆိုင်ခွဲ" : "Branches"}</>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView("products")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Package size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.products}</span>
                </button>

                <button
                  onClick={() => setCurrentView("reports")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <BarChart3 size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.salesSummary}</span>
                </button>

                <button
                  onClick={() => setActiveModal("expenses")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <DollarSign size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.generalExpenses}</span>
                </button>

                <button
                  onClick={() => setActiveModal("payroll")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Users size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.staffPayroll}</span>
                </button>

                <button
                  onClick={() => setActiveModal("customers")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Users size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.customersList}</span>
                </button>

                <button
                  onClick={() => setActiveModal("suppliers")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Landmark size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.suppliers}</span>
                </button>

                <button
                  onClick={() => setActiveModal("stock-adjust")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Package size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.stockAdjust}</span>
                </button>

                <button
                  onClick={() => setActiveModal("shifts")}
                  className={`${theme.bgInner} rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${theme.border} ${theme.borderHover} transition cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-neutral-100 border-neutral-200 text-neutral-800" : "bg-neutral-900 border-neutral-800 text-white"} p-2.5 rounded-xl border`}>
                    <Clock size={18} />
                  </div>
                  <span className={`text-xs font-bold ${theme.isLight ? "text-neutral-800" : "text-neutral-200"}`}>{t.staffAttendance}</span>
                </button>

                <button
                  onClick={() => setCurrentView("ai-analyst")}
                  className={`col-span-2 ${theme.isLight ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-200"} rounded-2xl p-4 flex items-center gap-3 shadow-sm font-bold transition active:scale-98 cursor-pointer`}
                >
                  <div className={`${theme.isLight ? "bg-white/20 text-white" : "bg-black/10 text-black"} p-2 rounded-xl`}>
                    <Brain size={18} />
                  </div>
                  <span className="text-xs font-bold">{t.aiAnalyst}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: POS */}
        {currentView === "pos" && (
          <PosView
            allProducts={allProducts}
            shopId={shopId || ""}
            shopName={shopName}
            shopSettings={shopSettings}
            customers={customers}
            heldOrdersCount={heldOrders.length}
            lang={lang}
            activeBranchId={activeBranchId}
            activeBranchName={
              activeBranchId === "all" 
                ? "Main Branch" 
                : branches.find((b) => b.id === activeBranchId)?.name || "Main Branch"
            }
            cashierName={currentUserData?.username || "Cashier"}
            onCheckoutSuccess={() => {}}
            onHoldOrder={(cart) => setHeldOrders((prev) => [...prev, cart])}
            onViewHeld={() => {
              if (heldOrders.length === 0) {
                alert(lang === "my" ? "ခေတ္တရပ်ဆိုင်းထားသည့် ဘောက်ချာ မရှိသေးပါ။" : "No held vouchers found.");
                return;
              }
              setActiveModal("sales-list");
            }}
            onClose={() => setCurrentView("dashboard")}
            onMobileCartToggle={(isOpen) => setIsMobileCartOpen(isOpen)}
          />
        )}

        {/* VIEW 3: INVENTORY PRODUCTS LIST */}
        {currentView === "products" && (
          <div className="w-full h-full flex flex-col overflow-hidden relative z-10">
            {/* Filter toolbar */}
            <div className={`p-4 ${theme.isLight ? "bg-slate-100/50" : "bg-black/20"} backdrop-blur-md border-b ${theme.border} space-y-3 shadow-sm`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className={`w-full pl-9 pr-4 py-3 bg-white/5 border ${theme.border} ${theme.isLight ? "text-slate-800" : "text-white"} rounded-xl text-xs font-semibold outline-none focus:border-indigo-500/50 focus:bg-white/10 transition placeholder:text-slate-600`}
                />
              </div>
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setInvFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    invFilter === "all"
                      ? "bg-indigo-500 text-white shadow"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {lang === "my" ? "အားလုံး" : "All Items"} ({allProducts.length})
                </button>

                <button
                  onClick={() => setInvFilter("low-stock")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    invFilter === "low-stock"
                      ? "bg-rose-500 text-white shadow"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span>{lang === "my" ? "လက်ကျန်နည်း" : "Low Stock"}</span>
                  {lowStockCount > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded-full font-black">
                      {lowStockCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setInvFilter("expiring")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    invFilter === "expiring"
                      ? "bg-amber-500 text-black shadow font-black"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span>{lang === "my" ? "သက်တမ်းကုန်ခါနီး (၆၀ရက်)" : "Expiring Soon"}</span>
                  {expiringCount > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-black">
                      {expiringCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setInvFilter("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    invFilter === "expired"
                      ? "bg-rose-600 text-white shadow font-black"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <span>{lang === "my" ? "သက်တမ်းကုန်" : "Expired"}</span>
                  {expiredCount > 0 && (
                    <span className="text-[10px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded-full font-black">
                      {expiredCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setActiveModal("add-product")}
                  className={`flex-1 min-w-[140px] bg-gradient-to-r ${theme.gradientBtn} text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition cursor-pointer shadow-sm`}
                >
                  <Plus size={16} /> {t.addProduct}
                </button>
                {lowStockCount > 0 && (
                  <button
                    onClick={() => setActiveModal("low-stock")}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {lang === "my" ? `လက်ကျန်နည်း (${lowStockCount})` : `Low Stock (${lowStockCount})`}
                  </button>
                )}
                {(expiredCount > 0 || expiringCount > 0) && (
                  <button
                    onClick={() => setActiveModal("expiry-alerts")}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle size={14} />
                    <span>{lang === "my" ? `သက်တမ်းစစ်ဆေးရန် (${expiredCount + expiringCount})` : `Expiry Alerts (${expiredCount + expiringCount})`}</span>
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-7xl mx-auto w-full">
                {filteredInventoryProducts.map((p) => {
                  const isLow = p.quantity <= (p.lowStockThreshold || 5);
                  return (
                    <div
                      key={p.id}
                      className={`${theme.bgInner} p-4 rounded-2xl border ${theme.border} shadow-sm flex items-center gap-4 ${theme.borderHover} transition-all`}
                    >
                      <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center shrink-0">
                        <Layers size={24} className="text-slate-600" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-bold text-sm ${theme.isLight ? "text-slate-900" : "text-white"} truncate font-display`}>{p.name}</h4>
                          <span className={`${theme.textAccent} ${theme.bgAccent} border ${theme.borderAccent} px-2 py-0.5 rounded text-[8px] font-black uppercase shrink-0`}>
                            {p.category}
                          </span>
                        </div>

                        {/* Pharmacy Generic Name & Dosage */}
                        {(p.genericName || p.dosage) && (
                          <div className="text-[11px] text-slate-400 font-medium truncate mb-1">
                            {p.genericName && <span className="italic">{p.genericName}</span>}
                            {p.genericName && p.dosage && <span className="mx-1">•</span>}
                            {p.dosage && <span className="text-indigo-400 font-bold">{p.dosage}</span>}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-bold mb-1.5">
                          <span>SKU: {p.sku}</span>
                          {p.batchNumber && <span>Batch: <strong className="text-slate-300">{p.batchNumber}</strong></span>}
                          {p.expiryDate && (() => {
                            const info = getExpiryInfo(p.expiryDate);
                            return (
                              <span className={`px-1.5 py-0.2 rounded border font-bold ${info.badgeClass}`}>
                                {lang === "my" ? info.labelMy : info.labelEn}
                              </span>
                            );
                          })()}
                        </div>

                        <div className={`flex gap-4 text-xs font-semibold ${theme.isLight ? "text-slate-600" : "text-slate-400"}`}>
                          <span>{lang === "my" ? "လက်လီ: " : "Retail: "}<b className={`${theme.isLight ? "text-slate-800" : "text-slate-200"}`}>{p.retailPrice.toLocaleString()} Ks</b></span>
                          <span>{lang === "my" ? "လက်ကျန်: " : "Stock: "}<b className={isLow ? "text-rose-400 font-black" : `${theme.isLight ? "text-slate-800" : "text-slate-200"}`}>{p.quantity}{lang === "my" ? "ခု" : " pcs"}</b></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: REPORTS VIEW */}
        {currentView === "reports" && (
          <div className="w-full h-full flex flex-col overflow-hidden relative z-10">
            {/* Report toolbar */}
            <div className={`p-4 shrink-0 ${theme.isLight ? "bg-slate-100/50" : "bg-black/20"} backdrop-blur-md border-b ${theme.border} max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm`}>
              <div>
                <h2 className={`text-xl font-black ${theme.isLight ? "text-slate-800" : "text-white"} font-display flex items-center gap-2`}>
                  <BarChart3 size={20} className="text-indigo-400" />
                  {lang === "my" ? "အရောင်းအစီရင်ခံစာများ" : "Sales Reports & Analytics"}
                </h2>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {lang === "my" ? "သင့်ဆိုင်၏ ရောင်းအားနှင့် ဘဏ္ဍာရေး အချက်အလက်များ" : "Analyze your business performance, products, and channels"}
                </p>
              </div>

              {/* Time Period Filter Pills */}
              <div className="flex gap-1 bg-[#0a0a0a]/95 border border-white/10 p-1 rounded-2xl self-start sm:self-center shrink-0">
                {[
                  { value: "all", labelEn: "All", labelMy: "အားလုံး" },
                  { value: "today", labelEn: "Today", labelMy: "ယနေ့" },
                  { value: "yesterday", labelEn: "Yesterday", labelMy: "မနေ့က" },
                  { value: "week", labelEn: "7 Days", labelMy: "၇ ရက်" },
                  { value: "month", labelEn: "30 Days", labelMy: "၃၀ ရက်" },
                ].map((item) => (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={item.value}
                    onClick={() => setReportPeriod(item.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      reportPeriod === item.value
                        ? `${theme.isLight ? "bg-black text-white" : "bg-white text-black"} shadow-sm`
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {lang === "my" ? item.labelMy : item.labelEn}
                  </motion.button>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={handleExportCSV}
                  className={`px-4 py-2 ${theme.isLight ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300" : "bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800"} rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5`}
                >
                  <Download size={13} />
                  {lang === "my" ? "CSV Export" : "Export CSV"}
                </button>
                <button
                  onClick={() => setActiveModal("google-sheets")}
                  className={`px-4 py-2 ${theme.isLight ? "bg-neutral-900 hover:bg-neutral-800 text-white" : "bg-white hover:bg-neutral-200 text-black"} rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm`}
                >
                  <Table size={13} />
                  Google Sheets
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 max-w-7xl mx-auto w-full no-scrollbar space-y-4">
              {/* Analytics metrics bento grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Net Profit Card */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-4 shadow-sm relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                    <TrendingUp size={48} className="text-indigo-400" />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.netProfit}</p>
                  <h3 className={`text-xl sm:text-2xl font-black ${theme.textAccent} font-display truncate`}>
                    {reportTotals.netProfit.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">Ks</span>
                  </h3>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      Margin: {reportTotals.grossMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 2. Total Revenue Card */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-4 shadow-sm relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                    <DollarSign size={48} className="text-indigo-400" />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.totalRevenue}</p>
                  <h3 className={`text-xl sm:text-2xl font-black ${theme.isLight ? "text-slate-800" : "text-slate-100"} font-display truncate`}>
                    {reportTotals.totalRev.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">Ks</span>
                  </h3>
                  <p className="text-[9px] text-slate-500 font-semibold mt-2.5">
                    {lang === "my" ? "စုစုပေါင်း ရောင်းရငွေ" : "Gross store revenue"}
                  </p>
                </div>

                {/* 3. Total Costs Card */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-4 shadow-sm relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                    <Package size={48} className="text-rose-400" />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{t.totalCost}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-rose-400 font-display truncate">
                    {(reportTotals.totalCost + reportTotals.totalExpenses + reportTotals.totalPayroll).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">Ks</span>
                  </h3>
                  <p className="text-[9px] text-slate-500 font-semibold mt-2.5">
                    {lang === "my" ? "ရင်းနှီးငွေ + စရိတ်များ" : "COGS & operational costs"}
                  </p>
                </div>

                {/* 4. Total Sales & Ticket Card */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-4 shadow-sm relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                    <ListChecks size={48} className="text-purple-400" />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{lang === "my" ? "စုစုပေါင်း ဘောက်ချာ" : "Total Transactions"}</p>
                  <h3 className={`text-xl sm:text-2xl font-black ${theme.isLight ? "text-slate-800" : "text-slate-100"} font-display truncate`}>
                    {reportTotals.salesCount} <span className="text-[10px] font-bold text-slate-500">{lang === "my" ? "ကြိမ်" : "Sales"}</span>
                  </h3>
                  <p className="text-[9px] text-indigo-400 font-bold mt-2.5">
                    Avg: {Math.round(reportTotals.avgVoucher).toLocaleString()} Ks
                  </p>
                </div>
              </div>

              {/* Weekly performance visual chart */}
              <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                      {lang === "my" ? "နောက်ဆုံး ၇ ရက် အရောင်းအခြေအနေ" : "Weekly Sales Trend (Last 7 Days)"}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                      {lang === "my" ? "နေ့စဉ်ရောင်းအား တိုးတက်မှုဇယား" : "Daily sales volume analysis"}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    <Clock size={10} /> Real-time
                  </span>
                </div>

                {/* SVG/CSS Custom Bar Chart */}
                <div className="h-44 flex items-end gap-3 pt-6 px-2">
                  {last7DaysSales.map((day, idx) => {
                    const maxAmount = Math.max(...last7DaysSales.map((d) => d.amount), 1);
                    const percentageHeight = (day.amount / maxAmount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
                        <div className="w-full relative flex justify-center items-end h-full">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#0a0a0a]/95 text-white border border-white/10 text-[9px] px-2 py-1 rounded-md font-bold whitespace-nowrap shadow-md z-20">
                            {day.amount.toLocaleString()} Ks
                          </div>
                          {/* Bar Graphic */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(percentageHeight, 4)}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className={`w-full rounded-t-xl transition-all duration-300 ${
                              day.amount === maxAmount
                                ? theme.isLight ? "bg-black" : "bg-white"
                                : theme.isLight ? "bg-neutral-300" : "bg-neutral-700"
                            } group-hover:brightness-110 shadow`}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 mt-2 font-mono">
                          {day.dateLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bento insights columns: Top Selling Products and Payment Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Selling Products */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm space-y-4`}>
                  <div className="flex items-center gap-2">
                    <Award className={theme.isLight ? "text-neutral-900" : "text-white"} size={18} />
                    <div>
                      <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                        {lang === "my" ? "လူကြိုက်အများဆုံး ကုန်ပစ္စည်းများ" : "Top Selling Products"}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-semibold">
                        {lang === "my" ? "အများဆုံး ရောင်းအားရသော ကုန်ပစ္စည်း ၅ ခု" : "Best sellers in selected time period"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {topSellingProducts.length === 0 ? (
                      <p className="text-[11px] text-slate-500 font-bold py-6 text-center">
                        {lang === "my" ? "အရောင်းမှတ်တမ်း မရှိသေးပါ။" : "No product sales recorded in this period."}
                      </p>
                    ) : (
                      topSellingProducts.map((p, idx) => {
                        const maxQty = Math.max(...topSellingProducts.map((p) => p.qty), 1);
                        const progressPercent = (p.qty / maxQty) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-black ${theme.isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-1.5`}>
                                <span className="text-[9px] font-black text-slate-400 bg-white/5 border border-white/10 w-4 h-4 rounded flex items-center justify-center font-mono">{idx + 1}</span>
                                {p.name}
                              </span>
                              <span className={`${theme.isLight ? "text-neutral-900" : "text-white"} font-bold text-[11px]`}>
                                {p.qty} {lang === "my" ? "ခု" : "sold"} • {p.revenue.toLocaleString()} Ks
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                className={`h-full rounded-full ${theme.isLight ? "bg-black" : "bg-white"}`}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Payment Channel Distribution */}
                <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm space-y-4`}>
                  <div className="flex items-center gap-2">
                    <Landmark className={theme.isLight ? "text-neutral-900" : "text-white"} size={18} />
                    <div>
                      <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                        {lang === "my" ? "ငွေပေးချေမှုစနစ် အချိုးအစား" : "Payment Method Distribution"}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-semibold">
                        {lang === "my" ? "အသုံးပြုမှုအများဆုံး ငွေပေးချေမှုလမ်းကြောင်းများ" : "Sales channels split by value"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {paymentMethodsBreakdown.every((m) => m.amount === 0) ? (
                      <p className="text-[11px] text-slate-500 font-bold py-6 text-center">
                        {lang === "my" ? "အရောင်းမှတ်တမ်း မရှိသေးပါ။" : "No payments recorded in this period."}
                      </p>
                    ) : (
                      paymentMethodsBreakdown.map((pm, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-black ${theme.isLight ? "text-slate-800" : "text-slate-200"}`}>
                              {pm.method}
                            </span>
                            <span className="text-slate-400 font-bold text-[11px]">
                              {pm.percentage.toFixed(1)}% • {pm.amount.toLocaleString()} Ks
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pm.percentage}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.1 }}
                              className={`h-full rounded-full ${theme.isLight ? "bg-neutral-600" : "bg-neutral-300"}`}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Recent Sales history table list for filtered period */}
              <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                      {lang === "my" ? "အသေးစိတ် အရောင်းမှတ်တမ်းများ" : "Filtered Sales Ledger"}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-semibold">
                      {lang === "my" ? "ရွေးချယ်ထားသော အချိန်အပိုင်းအခြားအတွင်းမှ ဘောက်ချာများ" : `Showing ${filteredSalesForReport.length} vouchers for ${reportPeriod.toUpperCase()}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pt-1">
                  {filteredSalesForReport.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-bold text-xs">
                      {lang === "my" ? "ရွေးချယ်ထားသော အချိန်အပိုင်းအခြားအတွက် အရောင်းမှတ်တမ်း မရှိပါ။" : "No sales found for the selected time range."}
                    </div>
                  ) : (
                    filteredSalesForReport.map((s) => {
                      const itemsStr = (s.items || []).map((i: any) => i.name).join(", ");
                      const dateStr = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : new Date(s.createdAt).toLocaleString();
                      return (
                        <div
                          key={s.id}
                          className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between hover:border-indigo-500/20 transition duration-200"
                        >
                          <div className="overflow-hidden mr-3">
                            <b className={`text-xs font-bold ${theme.isLight ? "text-slate-800" : "text-slate-200"} block truncate`}>
                              {itemsStr || (lang === "my" ? "ကိုယ်တိုင်ထည့်သွင်းမှု" : "Manual / Direct Entry")}
                            </b>
                            <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">
                              {dateStr}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-sm ${theme.textAccent} font-display`}>
                              {(s.total || 0).toLocaleString()} Ks
                            </p>
                            <span className={`text-[9px] font-bold ${theme.isLight ? "text-slate-600 bg-slate-100 border-slate-200" : "text-slate-400 bg-white/5 border-white/5"} px-2 py-0.5 rounded-md uppercase tracking-wider block mt-1`}>
                              {s.paymentMethod}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* P&L Statement */}
              <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm space-y-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="text-indigo-400" size={18} />
                  <div>
                    <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                      {lang === "my" ? "အမြတ်အရှုံးဇယား (P&L Statement)" : "Profit & Loss Statement"}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-semibold">
                      {lang === "my" ? "ဝင်ငွေ၊ ကုန်ကျစရိတ်နှင့် အမြတ်ကို ထင်ဟပ်ပြသည်" : "Income, expenses & net profit breakdown for selected period"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className={`${theme.isLight ? "text-slate-600" : "text-slate-400"}`}>{lang === "my" ? "ရောင်းအား (Revenue)" : "Sales Revenue"}</span>
                    <span className="font-black text-emerald-400 font-display">+ {reportTotals.totalRev.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className={`${theme.isLight ? "text-slate-600" : "text-slate-400"}`}>{lang === "my" ? "ကုန်ပစ္စည်း ရင်းနှီးငွေ" : "Cost of Goods Sold (COGS)"}</span>
                    <span className="font-bold text-rose-400 font-display">- {reportTotals.totalCost.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className={`font-semibold ${theme.isLight ? "text-slate-700" : "text-slate-300"}`}>{lang === "my" ? "Gross Profit" : "Gross Profit"}</span>
                    <span className={`font-black font-display ${(reportTotals.totalRev - reportTotals.totalCost) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {(reportTotals.totalRev - reportTotals.totalCost).toLocaleString()} Ks
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className={`${theme.isLight ? "text-slate-600" : "text-slate-400"}`}>{lang === "my" ? "ရုံးစရိတ် (Expenses)" : "Operating Expenses"}</span>
                    <span className="font-bold text-rose-400">- {reportTotals.totalExpenses.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className={`${theme.isLight ? "text-slate-600" : "text-slate-400"}`}>{lang === "my" ? "ဝန်ထမ်းလစာ (Payroll)" : "Payroll"}</span>
                    <span className="font-bold text-rose-400">- {reportTotals.totalPayroll.toLocaleString()} Ks</span>
                  </div>
                  <div className={`flex justify-between items-center py-3 px-4 rounded-2xl border mt-2 ${
                    reportTotals.netProfit >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-rose-500/10 border-rose-500/20"
                  }`}>
                    <span className={`font-black text-sm ${reportTotals.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {lang === "my" ? "အမြတ်ငွေ (Net Profit)" : "Net Profit"}
                    </span>
                    <span className={`text-xl font-black font-display ${reportTotals.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {reportTotals.netProfit.toLocaleString()} Ks
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 text-center pt-1">
                    Gross Margin: <strong className="text-indigo-400">{reportTotals.totalRev > 0 ? ((reportTotals.totalRev - reportTotals.totalCost) / reportTotals.totalRev * 100).toFixed(1) : "N/A"}%</strong>
                    &nbsp;|&nbsp; Avg Ticket: <strong className="text-indigo-400">{Math.round(reportTotals.avgVoucher).toLocaleString()} Ks</strong>
                  </p>
                </div>
              </div>

              {/* ── 30-Day Revenue Trend Line Chart ── */}
              {(() => {
                const now = new Date();
                const days30 = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(now);
                  d.setDate(now.getDate() - (29 - i));
                  const key = d.toISOString().slice(0, 10);
                  const dayTotal = salesHistory
                    .filter((s: any) => {
                      const sd = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
                      return sd.toISOString().slice(0, 10) === key;
                    })
                    .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
                  return {
                    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    revenue: dayTotal,
                  };
                });
                return (
                  <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={16} className="text-indigo-400" />
                      <div>
                        <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                          {lang === "my" ? "၃၀ ရက် ဝင်ငွေ Trend (Revenue Curve)" : "30-Day Revenue Trend"}
                        </h4>
                        <p className="text-[9px] text-slate-500 font-semibold">
                          {lang === "my" ? "တစ်လတာ နေ့စဉ်ရောင်းအား ပြောင်းလဲမှု" : "Interactive daily revenue curve"}
                        </p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={days30} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.isLight ? "#e2e8f0" : "#ffffff10"} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "#64748b" }}
                          interval={4}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#64748b" }}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                          tickLine={false}
                          axisLine={false}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0a0a0a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            color: "#fff",
                          }}
                          formatter={(v: any) => [`${Number(v).toLocaleString()} Ks`, lang === "my" ? "ဝင်ငွေ" : "Revenue"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* ── Payment Method Distribution Breakdown ── */}
              {(() => {
                const paymentTotals = salesHistory.reduce((acc: Record<string, number>, s: any) => {
                  const method = s.paymentMethod || "Cash";
                  acc[method] = (acc[method] || 0) + (s.total || 0);
                  return acc;
                }, {} as Record<string, number>);
                const pieData: { name: string; value: number }[] = Object.entries(paymentTotals).map(([name, value]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  value: Number(value) || 0,
                }));
                const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];
                const total: number = pieData.reduce((s: number, d) => s + d.value, 0);
                return pieData.length === 0 ? null : (
                  <div className={`${theme.bgInner} border ${theme.border} rounded-3xl p-5 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Percent size={16} className="text-violet-400" />
                      <div>
                        <h4 className={`text-xs font-black ${theme.isLight ? "text-slate-800" : "text-white"} uppercase tracking-wider`}>
                          {lang === "my" ? "ငွေချေမှု နည်းလမ်းခွဲခြားခြင်း (Payment Distribution)" : "Payment Method Breakdown"}
                        </h4>
                        <p className="text-[9px] text-slate-500 font-semibold">
                          {lang === "my" ? "လူကြိုက်အများဆုံး ငွေချေစနစ်" : "Share of sales by payment channel"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#0a0a0a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                              fontSize: "11px",
                              color: "#fff",
                            }}
                            formatter={(v: any) => [`${Number(v).toLocaleString()} Ks`, ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 flex-1 w-full">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className={`text-xs font-bold ${theme.isLight ? "text-slate-700" : "text-slate-300"}`}>{d.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-white">{d.value.toLocaleString()} Ks</div>
                              <div className="text-[9px] text-slate-500 font-mono">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* VIEW 5: AI ANALYST & USER GUIDE VIEW */}
        {currentView === "ai-analyst" && (
          <AiAnalyst
            allProducts={allProducts}
            salesHistory={salesHistory}
            expenses={expenses}
            purchases={purchases}
            payroll={payroll}
            customers={customers}
            shopId={shopId || ""}
            lang={lang}
            onOpenGoogleSheets={() => setActiveModal("google-sheets")}
          />
        )}

        {/* VIEW 6: BRANCH MANAGER VIEW */}
        {currentView === "branches" && (
          <BranchManager
            shopId={shopId || ""}
            branches={branches}
            stockTransfers={stockTransfers}
            allProducts={allProducts}
            salesHistory={salesHistory}
            activeBranchId={activeBranchId}
            onSelectActiveBranch={(bId) => setActiveBranchId(bId)}
            lang={lang}
            theme={theme}
          />
        )}

        {/* VIEW 7: FEATURE GUIDE */}
        {currentView === "guide" && (
          <FeatureGuide theme={theme} lang={lang} />
        )}
      </main>

      {/* Persistent Bottom navigation for mobile screen layout */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 justify-around items-center px-2 py-2 pb-safe shadow-lg lg:hidden z-40 ${isMobileCartOpen ? "hidden" : "flex"}`}>
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "dashboard" ? "text-indigo-400 bg-white/5" : "text-slate-500"
          }`}
        >
          <LayoutDashboard size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">Home</span>
        </button>

        <button
          onClick={() => setCurrentView("pos")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "pos" ? "text-indigo-400 bg-white/5" : "text-slate-500"
          }`}
        >
          <ShoppingCart size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">POS</span>
        </button>

        <button
          onClick={() => setCurrentView("branches")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "branches" ? "text-indigo-400 bg-white/5" : "text-slate-500"
          }`}
        >
          <Building2 size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">Stores</span>
        </button>

        <button
          onClick={() => setCurrentView("products")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "products" ? "text-indigo-400 bg-white/5" : "text-slate-500"
          }`}
        >
          <Package size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">Items</span>
        </button>

        <button
          onClick={() => setCurrentView("reports")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "reports" ? "text-indigo-400 bg-white/5" : "text-slate-500"
          }`}
        >
          <BarChart3 size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">Reports</span>
        </button>

        <button
          onClick={() => setCurrentView("ai-analyst")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "ai-analyst" ? "text-violet-400 bg-violet-500/10" : "text-slate-500"
          }`}
        >
          <Brain size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">AI</span>
        </button>

        <button
          onClick={() => setCurrentView("guide")}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all cursor-pointer ${
            currentView === "guide" ? "text-indigo-400 bg-indigo-500/10" : "text-slate-500"
          }`}
        >
          <HelpCircle size={18} className="mb-0.5" />
          <span className="text-[8px] font-black">{lang === "my" ? "ကူညီ" : "Help"}</span>
        </button>
      </nav>

      {/* Modal Controller Coordinator */}
      {activeModal && activeModal !== "google-sheets" && (
        <Modals
          modalType={activeModal}
          shopId={shopId || ""}
          shopName={shopName}
          shopSettings={shopSettings}
          allProducts={allProducts}
          customers={customers}
          suppliers={suppliers}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onSettingsSaved={(newSettings) => setShopSettings(newSettings)}
        />
      )}

      {/* Google Sheets Suite Modal */}
      {activeModal === "google-sheets" && (
        <GoogleSheetsModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          allProducts={allProducts}
          salesHistory={salesHistory}
          expenses={expenses}
          purchases={purchases}
          payroll={payroll}
          customers={customers}
          suppliers={suppliers}
          shopName={shopName}
          lang={lang}
          theme={theme}
        />
      )}

      {/* PWA Install / Add to Home Screen Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#121214] border border-neutral-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-display">
                    {lang === "my" ? "Home Screen သို့ ထည့်သွင်းရန် လမ်းညွှန်" : "Add to Home Screen"}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {lang === "my" ? "ဖုန်းနှင့် Desktop တွင် သီးသန့် App အဖြစ် ထည့်သွင်းနိုင်ပါသည်" : "Install as standalone app on phone or desktop"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* iPhone / Safari */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Share2 size={13} className="text-indigo-400" />
                    iPhone / iPad (Safari Browser)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold">iOS</span>
                </div>
                <ol className="text-xs text-neutral-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    {lang === "my" ? "Safari browser ၏ အောက်ခြေရှိ Share ခလုတ်" : "Tap the Share button"}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono text-[10px] border border-neutral-700 mx-1">
                      <Share2 size={10} className="inline mr-1" /> Share
                    </span>
                    {lang === "my" ? "ကို နှိပ်ပါ။" : "at bottom."}
                  </li>
                  <li>
                    {lang === "my" ? "အောက်သို့ scroll ဆွဲပြီး" : "Scroll down and select"}
                    <strong className="text-white mx-1">"Add to Home Screen"</strong>
                    ({lang === "my" ? "ပင်မမျက်နှာပြင်သို့ ထည့်ပါ" : "or Home screen"})
                    {lang === "my" ? "ကို ရွေးချယ်ပါ။" : "."}
                  </li>
                  <li>{lang === "my" ? "ညာဘက်အပေါ်ထောင့်ရှိ 'Add' ကို နှိပ်ပြီး ပြီးဆုံးပါပြီ။" : "Tap 'Add' in the top right."}</li>
                </ol>
              </div>

              {/* Android & PC */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <MoreVertical size={13} className="text-emerald-400" />
                    Android / Chrome / Edge / PC
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold">Android & PC</span>
                </div>
                <ol className="text-xs text-neutral-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    {lang === "my" ? "Browser ၏ ညာဘက်အပေါ်ထောင့် အစက် ၃ စက် မီနူး" : "Click browser menu"}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono text-[10px] border border-neutral-700 mx-1">Menu (⋮)</span>
                    {lang === "my" ? "သို့မဟုတ် URL bar ရှိ Install icon ကို နှိပ်ပါ။" : "or URL bar install icon."}
                  </li>
                  <li>
                    <strong className="text-white mx-1">"Install app"</strong>
                    {lang === "my" ? "သို့မဟုတ်" : "or"}
                    <strong className="text-white mx-1">"Add to Home screen"</strong>
                    {lang === "my" ? "ကို ရွေးချယ်နှိပ်ပေးပါ။" : "."}
                  </li>
                </ol>
              </div>
            </div>

            {/* Features badge bar */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Zap size={12} className="text-white" />
                {lang === "my" ? "100% Offline အလုပ်လုပ်သည်" : "100% Offline Ready"}
              </span>
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {lang === "my" ? "နားလည်ပါပြီ" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        lang={lang}
        theme={theme}
      />

      {/* Mobile Slide-Out Sidebar Drawer */}
      <MobileSidebarDrawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        lang={lang}
        setLang={(newLang) => {
          setLang(newLang);
          localStorage.setItem("lang", newLang);
        }}
        shopName={shopName}
        currentUserData={currentUserData}
        isStaffUser={isStaffUser}
        activeBranchId={activeBranchId}
        branches={branches}
        onSelectBranch={handleSelectBranch}
        onLogout={handleLogout}
        onOpenSettings={() => setActiveModal("settings")}
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenGoogleSheets={() => setActiveModal("googleSheets")}
        onToggleTheme={async () => {
          const nextTheme = theme.isLight ? "clean-modern" : "clean-light";
          setShopSettings((prev) => ({ ...prev, theme: nextTheme }));
          if (shopId) {
            try {
              await updateDoc(doc(db, "shops", shopId, "settings", "general"), { theme: nextTheme });
            } catch (e) {
              console.error("Theme toggle error:", e);
            }
          }
        }}
        isAppInstalled={isAppInstalled}
        onInstallClick={handleInstallClick}
      />
    </div>
  );
}
