import React, { useState, useEffect, useMemo } from "react";
import {
  X, Plus, Trash2, AlertTriangle, CheckCircle, AlertCircle,
  Package, User, Phone, DollarSign, Clock, Truck, RotateCcw,
  Search, ChevronDown, Image, Tag, Boxes, Shield, FileText,
  Settings, Store, MapPin, Receipt, Palette, Check, CheckCircle2, Sparkles, RefreshCcw, CreditCard
} from "lucide-react";
import { db } from "../firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  onSnapshot, query, orderBy, limit, setDoc, serverTimestamp, where
} from "firebase/firestore";
import { Product, Customer, Supplier, ShopSettings, Expense, Purchase, Payroll, Shift } from "../types";
import { THEMES } from "../lib/theme";
import { translations, Language } from "../lib/translations";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a string to Title Case */
function toTitleCase(str: string): string {
  return str.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/** Validate Myanmar phone number */
function isValidMyanmarPhone(phone: string): boolean {
  return /^(09|\+959)\d{7,9}$/.test(phone.trim());
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ModalsProps {
  modalType: string;
  shopId: string;
  shopName: string;
  shopSettings: ShopSettings;
  allProducts: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  lang?: Language;
  currentUser?: string;
  onClose: () => void;
  onSettingsSaved: (settings: ShopSettings) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Modals({
  modalType,
  shopId,
  shopName,
  shopSettings,
  allProducts,
  customers,
  suppliers,
  lang = "en",
  currentUser = "staff",
  onClose,
  onSettingsSaved,
}: ModalsProps) {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);

  // --- Add Product State ---
  const [pName, setPName] = useState("");
  const [pCat, setPCat] = useState("");
  const [pSku, setPSku] = useState("");
  const [pBarcode, setPBarcode] = useState("");
  const [pCost, setPCost] = useState(0);
  const [pRetail, setPRetail] = useState(0);
  const [pWhole, setPWhole] = useState(0);
  const [pQty, setPQty] = useState(10);
  const [pUnit, setPUnit] = useState("");
  const [pTax, setPTax] = useState<"none" | "5%" | "10%">("none");
  const [pReorder, setPReorder] = useState(5);
  const [pSupplierId, setPSupplierId] = useState("");
  const [pImageUrl, setPImageUrl] = useState("");
  const [pLowThreshold, setPLowThreshold] = useState(5);
  const [skuError, setSkuError] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [productVariants, setProductVariants] = useState<{
    id: string; name: string; sku: string; retailPrice: number;
    wholesalePrice: number; quantity: number;
  }[]>([]);
  const [vName, setVName] = useState("");
  const [vSku, setVSku] = useState("");
  const [vRetail, setVRetail] = useState(0);
  const [vWhole, setVWhole] = useState(0);
  const [vQty, setVQty] = useState(10);

  // --- Add Customer State ---
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cPhoneError, setCPhoneError] = useState("");
  const [cSearch, setCSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);

  // --- Settings State ---
  const [sName, setSName] = useState(shopSettings.shopName || shopName);
  const [sPhone, setSPhone] = useState(shopSettings.phone || "");
  const [sAdd, setSAdd] = useState(shopSettings.address || "");
  const [sFoot, setSFoot] = useState(shopSettings.footer || "ကျေးဇူးတင်ပါသည်ခင်ဗျာ။");
  const [sTheme, setSTheme] = useState(shopSettings.theme || "clean-modern");

  // --- Supplier State ---
  const [suppName, setSuppName] = useState("");

  // --- Stock Adjustment State (enhanced) ---
  const [adjProdId, setAdjProdId] = useState("");
  const [adjQty, setAdjQty] = useState(0);
  const [adjReasonCode, setAdjReasonCode] = useState<"Damaged" | "Expired" | "Recount" | "Return" | "Other">("Recount");
  const [adjNotes, setAdjNotes] = useState("");

  // --- COD filter state ---
  const [codFilter, setCodFilter] = useState<"all" | "Pending" | "OutForDelivery" | "Collected" | "Failed">("all");

  // --- Dynamic data lists ---
  const [listData, setListData] = useState<any[]>([]);

  // --- Inline toast ---
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Load dynamic list data based on modal type
  useEffect(() => {
    if (!shopId) return;
    let unsub = () => {};

    if (modalType === "z-report") {
      const q = query(collection(db, "shops", shopId, "sales"), orderBy("createdAt", "desc"), limit(200));
      unsub = onSnapshot(q, (snap) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const todaySales = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s: any) => {
            const sd = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
            return sd.toISOString().slice(0, 10) === todayStr;
          });
        setListData(todaySales);
      });
    } else if (modalType === "sales-list") {
      const q = query(collection(db, "shops", shopId, "sales"), orderBy("createdAt", "desc"), limit(60));
      unsub = onSnapshot(q, (snap) => {
        setListData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    } else if (modalType === "purchase-list") {
      const q = query(collection(db, "shops", shopId, "purchases"), orderBy("date", "desc"));
      unsub = onSnapshot(q, (snap) => setListData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    } else if (modalType === "expenses") {
      const q = query(collection(db, "shops", shopId, "expenses"), orderBy("date", "desc"));
      unsub = onSnapshot(q, (snap) => setListData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    } else if (modalType === "payroll") {
      const q = query(collection(db, "shops", shopId, "payroll"), orderBy("date", "desc"));
      unsub = onSnapshot(q, (snap) => setListData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    } else if (modalType === "cod") {
      const q = query(collection(db, "shops", shopId, "sales"), where("paymentMethod", "==", "COD"));
      unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setListData(items);
      });
    } else if (modalType === "shifts") {
      const q = query(collection(db, "shops", shopId, "shifts"), orderBy("time", "desc"), limit(40));
      unsub = onSnapshot(q, (snap) => setListData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    }

    return () => unsub();
  }, [shopId, modalType]);

  // Load customer purchase history when one is selected
  useEffect(() => {
    if (!selectedCustomer || modalType !== "customers") return;
    let unsub = () => {};
    const q = query(
      collection(db, "shops", shopId, "sales"),
      where("customerId", "==", selectedCustomer),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    unsub = onSnapshot(q, (snap) => setCustomerSales(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [selectedCustomer, shopId, modalType]);

  // ─── Product SKU duplicate check ─────────────────────────────────────────
  const handleSkuBlur = async () => {
    if (!pSku.trim()) return;
    setSkuError("");
    try {
      const q = query(collection(db, "shops", shopId, "products"), where("sku", "==", pSku.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSkuError(t.skuDuplicateError);
      }
    } catch {}
  };

  // ─── Save Product ────────────────────────────────────────────────────────
  const handleSaveProduct = async () => {
    if (!pName.trim() || pRetail <= 0) {
      showToast("error", lang === "my" ? "အမည်နှင့် လက်လီစျေးနှုန်း ဖြည့်စွက်ပေးပါ။" : "Item name and retail price are required.");
      return;
    }
    if (skuError) {
      showToast("error", t.skuDuplicateError);
      return;
    }
    if (hasVariants && productVariants.length === 0) {
      showToast("error", lang === "my" ? "Variant တစ်ခု ထည့်ပေးပါ။" : "Add at least one variant.");
      return;
    }

    setLoading(true);
    try {
      // Normalize name and category
      const normalizedName = toTitleCase(pName.trim());
      const normalizedCat = toTitleCase(pCat.trim() || "General");
      const computedQty = hasVariants ? productVariants.reduce((s, v) => s + v.quantity, 0) : (pQty || 0);

      await addDoc(collection(db, "shops", shopId, "products"), {
        name: normalizedName,
        category: normalizedCat,
        sku: pSku.trim() || "sku-" + Date.now().toString().slice(-6),
        barcode: pBarcode.trim() || null,
        unit: pUnit.trim() || null,
        taxCategory: pTax,
        costPrice: pCost || 0,
        retailPrice: pRetail,
        wholesalePrice: pWhole || pRetail,
        quantity: computedQty,
        lowStockThreshold: pLowThreshold || 5,
        reorderPoint: pReorder || 5,
        supplierId: pSupplierId || null,
        supplierName: pSupplierId ? suppliers.find((s) => s.id === pSupplierId)?.name || null : null,
        imageUrl: pImageUrl.trim() || null,
        hasVariants,
        variants: hasVariants ? productVariants : null,
      });

      showToast("success", lang === "my" ? "ကုန်ပစ္စည်းအသစ် ထည့်သွင်းပြီးပါပြီ။" : "Product added successfully!");
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Customer ───────────────────────────────────────────────────────
  const handleSaveCustomer = async () => {
    if (!cName.trim()) {
      showToast("error", lang === "my" ? "ဝယ်သူအမည် ဖြည့်ပါ။" : "Customer name is required.");
      return;
    }
    if (cPhone && !isValidMyanmarPhone(cPhone)) {
      setCPhoneError(t.phoneInvalid);
      return;
    }
    setCPhoneError("");
    setLoading(true);
    try {
      await addDoc(collection(db, "shops", shopId, "customers"), {
        name: cName.trim(),
        phone: cPhone.trim() || "",
        points: 0,
        debt: 0,
      });
      showToast("success", lang === "my" ? "ဝယ်သူအသစ် ထည့်သွင်းပြီးပါပြီ။" : "Customer registered!");
      setCName(""); setCPhone("");
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Settings ───────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (!sName) return;
    setLoading(true);
    try {
      const payload: ShopSettings = { shopName: sName, footer: sFoot, phone: sPhone, address: sAdd, theme: sTheme };
      await setDoc(doc(db, "shops", shopId, "settings", "general"), payload, { merge: true });
      onSettingsSaved(payload);
      showToast("success", lang === "my" ? "ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ။" : "Settings saved successfully.");
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!suppName.trim()) return;
    try {
      await addDoc(collection(db, "shops", shopId, "suppliers"), { name: suppName.trim(), debt: 0 });
      setSuppName("");
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    }
  };

  const handleAddExpense = async (desc: string, amount: number) => {
    if (!desc || amount <= 0) return;
    await addDoc(collection(db, "shops", shopId, "expenses"), { desc, amount, date: serverTimestamp() });
  };

  const handleAddPurchase = async (desc: string, amount: number) => {
    if (!desc || amount <= 0) return;
    await addDoc(collection(db, "shops", shopId, "purchases"), { desc, amount, date: serverTimestamp() });
  };

  const handleAddPayroll = async (name: string, amount: number) => {
    if (!name || amount <= 0) return;
    await addDoc(collection(db, "shops", shopId, "payroll"), { name, amount, date: serverTimestamp() });
  };

  const handleClockInOut = async (type: "in" | "out") => {
    try {
      await addDoc(collection(db, "shops", shopId, "shifts"), {
        userId: currentUser,
        staffName: currentUser,
        type,
        time: serverTimestamp(),
      });
      showToast("success", type === "in" ? t.shiftsClockInSuccess : t.shiftsClockOutSuccess);
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    }
  };

  // ─── Enhanced Stock Adjustment ───────────────────────────────────────────
  const selectedProduct = allProducts.find((p) => p.id === adjProdId);
  const isLargeAdjustment = selectedProduct && Math.abs(adjQty - selectedProduct.quantity) > 50;

  const handleStockAdjustment = async () => {
    if (!adjProdId || !selectedProduct) return;
    const prevQty = selectedProduct.quantity;
    try {
      await updateDoc(doc(db, "shops", shopId, "products", adjProdId), { quantity: adjQty });

      // Write audit log
      await addDoc(collection(db, "shops", shopId, "stock_adjustments"), {
        productId: adjProdId,
        productName: selectedProduct.name,
        reasonCode: adjReasonCode,
        notes: adjNotes.trim() || "",
        actorId: currentUser,
        actorName: currentUser,
        prevQty,
        newQty: adjQty,
        requiresApproval: (isLargeAdjustment || false),
        createdAt: serverTimestamp(),
      });

      showToast("success", t.adjustSuccess);
      setAdjProdId(""); setAdjQty(0); setAdjNotes(""); setAdjReasonCode("Recount");
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    }
  };

  // ─── COD Status Update ────────────────────────────────────────────────────
  const handleUpdateCOD = async (saleId: string, status: string) => {
    try {
      await updateDoc(doc(db, "shops", shopId, "sales", saleId), {
        codStatus: status,
        ...(status === "Collected" ? { collectedAt: serverTimestamp() } : {}),
      });
    } catch (e: any) {
      showToast("error", "Error: " + e.message);
    }
  };

  const getModalTitle = () => {
    const titles: Record<string, string> = {
      "add-product": lang === "my" ? "ကုန်ပစ္စည်းအသစ် ထည့်မည်" : "Add New Product",
      "settings": lang === "my" ? "စနစ် ဆက်တင်များ" : "System Settings",
      "customers": lang === "my" ? "ဝယ်သူများစာရင်း" : "Customers Directory",
      "suppliers": lang === "my" ? "ဆပ်ပလိုင်ယာများ" : "Suppliers",
      "cod": lang === "my" ? "COD ကောက်ခံရန်စာရင်း" : "COD Tracking",
      "expenses": lang === "my" ? "စရိတ်မှတ်တမ်း" : "Expenses Manager",
      "purchase-list": lang === "my" ? "ဝယ်ယူမှုမှတ်တမ်း" : "Purchases Manager",
      "payroll": lang === "my" ? "ဝန်ထမ်းလစာ" : "Payroll Manager",
      "low-stock": lang === "my" ? "လက်ကျန်နည်းသောအချက်ပေးမှု" : "Low Stock Alerts",
      "stock-adjust": lang === "my" ? "စတော့ချိန်ညှိမှု" : "Stock Adjustment",
      "shifts": lang === "my" ? "ဝန်ထမ်းအဝင်အထွက် မှတ်တမ်း" : "Staff Shift Logs",
      "sales-list": lang === "my" ? "ဘောက်ချာမှတ်တမ်းစာရင်း" : "Sales Records",
      "z-report": lang === "my" ? "Z-Report (နေ့ချုပ်စာရင်း)" : "Z-Report / Daily Register Close",
    };
    return titles[modalType] || modalType.replace(/-/g, " ");
  };

  // Filtered customers for directory
  const filteredCustomers = useMemo(
    () => customers.filter((c) =>
      c.name.toLowerCase().includes(cSearch.toLowerCase()) ||
      c.phone?.includes(cSearch)
    ),
    [customers, cSearch]
  );

  // COD filtered list
  const filteredCOD = useMemo(() =>
    codFilter === "all" ? listData : listData.filter((s) => s.codStatus === codFilter),
    [listData, codFilter]
  );

  // COD summary totals
  const codSummary = useMemo(() => ({
    pending: listData.filter((s) => s.codStatus === "Pending").reduce((a, s) => a + (s.total || 0), 0),
    collected: listData.filter((s) => s.codStatus === "Collected").reduce((a, s) => a + (s.total || 0), 0),
  }), [listData]);

  // Paired shift records grouped into In/Out pairs for display
  const pairedShifts = useMemo(() => {
    const ins = listData.filter((s) => s.type === "in");
    const outs = listData.filter((s) => s.type === "out");
    return ins.map((inRecord) => {
      const matchOut = outs.find((o) => {
        const oTime = o.time?.toMillis() || 0;
        const iTime = inRecord.time?.toMillis() || 0;
        return oTime > iTime;
      });
      const hoursWorked = matchOut
        ? Math.round(((matchOut.time?.toMillis() || 0) - (inRecord.time?.toMillis() || 0)) / 1000 / 60)
        : null;
      return { inRecord, outRecord: matchOut || null, hoursWorked };
    });
  }, [listData]);

  const inputCls = "w-full p-4 bg-white/5 border border-white/10 text-white placeholder:text-slate-600 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition";
  const smallInputCls = "w-full p-3 bg-white/5 border border-white/10 text-white placeholder:text-slate-600 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] backdrop-blur-xl p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className={`bg-[#080b11]/95 rounded-[2.25rem] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_80px_rgba(99,102,241,0.12),inset_0_1px_1px_rgba(255,255,255,0.12)] w-full ${
        modalType === "settings" ? "max-w-2xl" : "max-w-xl"
      } max-h-[92vh] overflow-hidden border border-white/10 flex flex-col relative`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex justify-between items-center shrink-0 relative z-10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {modalType === "settings" && (
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow shrink-0">
                <Settings size={19} className="animate-spin-slow" />
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white capitalize tracking-tight font-display flex items-center gap-2">
                {getModalTitle()}
              </h2>
              {modalType === "settings" && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {lang === "my" ? "ဆိုင်အချက်အလက်များနှင့် UI အသွင်အပြင် ရွေးချယ်မှု" : "Customize store identity, receipt layout & visual theme"}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white border border-white/10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Inline Toast */}
        {toast && (
          <div className={`mx-6 mt-3 p-3 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 ${
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {toast.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {toast.text}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-4 relative z-10">

          {/* ── 1. ADD PRODUCT ──────────────────────────────────────────────── */}
          {modalType === "add-product" && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={labelCls}>{lang === "my" ? "ကုန်ပစ္စည်းအမည် *" : "Item Name *"}</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  onBlur={() => setPName(toTitleCase(pName))}
                  placeholder={lang === "my" ? "ကုန်ပစ္စည်းအမည်..." : "Item Name..."}
                  className={inputCls}
                />
              </div>

              {/* Category + SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.category}</label>
                  <input
                    type="text"
                    value={pCat}
                    onChange={(e) => setPCat(e.target.value)}
                    onBlur={() => setPCat(toTitleCase(pCat))}
                    placeholder={lang === "my" ? "အုပ်စု..." : "Category..."}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t.barcodeSku}</label>
                  <input
                    type="text"
                    value={pSku}
                    onChange={(e) => { setPSku(e.target.value); setSkuError(""); }}
                    onBlur={handleSkuBlur}
                    placeholder="SKU / Barcode..."
                    className={`${inputCls} ${skuError ? "border-rose-500 focus:ring-rose-500/20" : ""}`}
                  />
                  {skuError && (
                    <p className="mt-1 text-[10px] text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle size={11} /> {skuError}
                    </p>
                  )}
                </div>
              </div>

              {/* Barcode + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{lang === "my" ? "Barcode (သီးသန့်)" : "Separate Barcode"}</label>
                  <input
                    type="text"
                    value={pBarcode}
                    onChange={(e) => setPBarcode(e.target.value)}
                    placeholder="12345678..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t.unitLabel}</label>
                  <input
                    type="text"
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    placeholder="pcs, kg, box..."
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Tax Category */}
              <div>
                <label className={labelCls}>{t.taxCategoryLabel}</label>
                <div className="flex gap-2">
                  {(["none", "5%", "10%"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPTax(opt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        pTax === opt
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {opt === "none" ? t.taxNone : opt === "5%" ? t.tax5 : t.tax10}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 my-2">
                <div>
                  <h4 className="text-xs font-black text-white">{lang === "my" ? "အမျိုးအစားကွဲများ သတ်မှတ်မည်" : "Enable Product Variants"}</h4>
                  <p className="text-[10px] text-slate-400">{lang === "my" ? "အရွယ်အစား၊ အရောင် ခွဲခြားနိုင်သည်" : "Add sizes, colors, types"}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500" />
                </label>
              </div>

              {/* Prices + Qty (when no variants) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.costPrice}</label>
                  <input type="number" value={pCost} onChange={(e) => setPCost(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t.retailPrice} *</label>
                  <input type="number" value={pRetail} onChange={(e) => setPRetail(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.wholesalePrice}</label>
                  <input type="number" value={pWhole} onChange={(e) => setPWhole(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                {!hasVariants && (
                  <div>
                    <label className={labelCls}>{t.stockQty} *</label>
                    <input type="number" value={pQty} onChange={(e) => setPQty(parseInt(e.target.value) || 0)} className={inputCls} />
                  </div>
                )}
              </div>

              {/* Reorder + Low stock threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.lowThreshold}</label>
                  <input type="number" value={pLowThreshold} onChange={(e) => setPLowThreshold(parseInt(e.target.value) || 5)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t.reorderPointLabel}</label>
                  <input type="number" value={pReorder} onChange={(e) => setPReorder(parseInt(e.target.value) || 5)} className={inputCls} />
                </div>
              </div>

              {/* Supplier */}
              {suppliers.length > 0 && (
                <div>
                  <label className={labelCls}>{t.supplierLabel}</label>
                  <select
                    value={pSupplierId}
                    onChange={(e) => setPSupplierId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">{t.noSupplier}</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Image URL */}
              <div>
                <label className={labelCls}>{t.imageUrlLabel}</label>
                <input
                  type="url"
                  value={pImageUrl}
                  onChange={(e) => setPImageUrl(e.target.value)}
                  placeholder={t.imageUrlPlaceholder}
                  className={inputCls}
                />
                {pImageUrl && (
                  <img
                    src={pImageUrl}
                    alt="Preview"
                    className="mt-2 w-16 h-16 object-cover rounded-xl border border-white/10"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>

              {/* Variants form */}
              {hasVariants && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">{lang === "my" ? "ဗားရှင်းအသစ် ထည့်မည်" : "Add Variant"}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{lang === "my" ? "ဗားရှင်းအမည်" : "Variant Name"}</label>
                      <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Red, XL..." className={smallInputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SKU</label>
                      <input type="text" value={vSku} onChange={(e) => setVSku(e.target.value)} placeholder="Variant SKU..." className={smallInputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>{lang === "my" ? "လက်လီဈေး" : "Retail"}</label>
                      <input type="number" value={vRetail} onChange={(e) => setVRetail(parseFloat(e.target.value) || 0)} className={smallInputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{lang === "my" ? "လက်ကားဈေး" : "Wholesale"}</label>
                      <input type="number" value={vWhole} onChange={(e) => setVWhole(parseFloat(e.target.value) || 0)} className={smallInputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{lang === "my" ? "လက်ကျန်" : "Stock"}</label>
                      <input type="number" value={vQty} onChange={(e) => setVQty(parseInt(e.target.value) || 0)} className={smallInputCls} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!vName.trim()) return;
                      setProductVariants((prev) => [...prev, {
                        id: "var_" + Date.now(),
                        name: vName.trim(),
                        sku: vSku.trim() || `${pSku}-${vName.trim()}`,
                        retailPrice: vRetail || pRetail,
                        wholesalePrice: vWhole || pWhole || pRetail,
                        quantity: vQty,
                      }]);
                      setVName(""); setVSku(""); setVRetail(0); setVWhole(0); setVQty(10);
                    }}
                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    + {lang === "my" ? "ဗားရှင်းအသစ်ထည့်မည်" : "Add Variant"}
                  </button>

                  {productVariants.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-white/5">
                      {productVariants.map((v, idx) => (
                        <div key={v.id} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl border border-white/5 text-xs text-slate-300">
                          <div>
                            <span className="font-bold text-white">{v.name}</span>
                            <span className="text-[10px] text-slate-500 block">SKU: {v.sku} | Qty: {v.quantity}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-indigo-400 font-bold">{v.retailPrice.toLocaleString()} Ks</span>
                            <button type="button" onClick={() => setProductVariants((p) => p.filter((_, i) => i !== idx))} className="text-rose-400 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/10 cursor-pointer">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSaveProduct}
                disabled={loading || !!skuError}
                className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 rounded-2xl text-sm mt-4 transition active:scale-98 cursor-pointer disabled:opacity-50 shadow"
              >
                {loading ? t.saving : t.save}
              </button>
            </div>
          )}

          {/* ── 2. SETTINGS ──────────────────────────────────────────────────── */}
          {modalType === "settings" && (
            <div className="space-y-6">
              {/* Section A: Store Identity & Receipt Customization */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-white/[0.08]">
                  <Store className="text-indigo-400 shrink-0" size={15} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-display">
                    {lang === "my" ? "ဆိုင်အချက်အလက်နှင့် ပြေစာ စာသားများ" : "Store Identity & Receipt Details"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Store Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                        <Store size={13} className="text-indigo-400" />
                        <span>{lang === "my" ? "ဆိုင်အမည် (Store Name)" : "Store Name"}</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lang === "my" ? "ပြေစာနှင့် ဘောက်ချာတွင် ပြသမည်" : "Printed on receipt header"}
                      </span>
                    </div>
                    <div className="relative flex items-center rounded-2xl bg-[#0e131f]/75 border border-white/10 focus-within:border-indigo-500/70 focus-within:bg-[#121929]/90 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-200">
                      <input
                        type="text"
                        value={sName}
                        onChange={(e) => setSName(e.target.value)}
                        placeholder={lang === "my" ? "ဆိုင်အမည် ဖြည့်သွင်းပါ..." : "Enter store name..."}
                        className="w-full px-4 py-3.5 bg-transparent text-sm font-semibold text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Phone size={13} className="text-indigo-400" />
                      <span>{lang === "my" ? "ဖုန်းနံပါတ် (Phone Number)" : "Phone Number"}</span>
                    </label>
                    <div className="relative flex items-center rounded-2xl bg-[#0e131f]/75 border border-white/10 focus-within:border-indigo-500/70 focus-within:bg-[#121929]/90 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-200">
                      <input
                        type="text"
                        value={sPhone}
                        onChange={(e) => setSPhone(e.target.value)}
                        placeholder="09XXXXXXXXX"
                        className="w-full px-4 py-3.5 bg-transparent text-sm font-semibold text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <MapPin size={13} className="text-indigo-400" />
                      <span>{lang === "my" ? "ဆိုင်လိပ်စာ (Store Address)" : "Store Address"}</span>
                    </label>
                    <div className="relative flex items-center rounded-2xl bg-[#0e131f]/75 border border-white/10 focus-within:border-indigo-500/70 focus-within:bg-[#121929]/90 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-200">
                      <input
                        type="text"
                        value={sAdd}
                        onChange={(e) => setSAdd(e.target.value)}
                        placeholder={lang === "my" ? "မြို့နယ် / လိပ်စာ..." : "Address / Location..."}
                        className="w-full px-4 py-3.5 bg-transparent text-sm font-semibold text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Receipt Footer Message */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                        <Receipt size={13} className="text-indigo-400" />
                        <span>{lang === "my" ? "ဘောက်ချာအောက်ခြေစာတို (Receipt Footer)" : "Receipt Footer Greeting"}</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lang === "my" ? "ပြေစာအောက်ဆုံးတွင် ဖော်ပြမည်" : "Printed at receipt bottom"}
                      </span>
                    </div>
                    <div className="relative flex items-center rounded-2xl bg-[#0e131f]/75 border border-white/10 focus-within:border-indigo-500/70 focus-within:bg-[#121929]/90 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-200">
                      <input
                        type="text"
                        value={sFoot}
                        onChange={(e) => setSFoot(e.target.value)}
                        placeholder="Thank you, please come again!"
                        className="w-full px-4 py-3.5 bg-transparent text-sm font-semibold text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section B: Customizable UI Theme Picker */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Palette className="text-indigo-400 shrink-0" size={15} />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-display">
                      {t.themeLabel || "System UI Theme"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1">
                    <Sparkles size={11} className="text-indigo-400" /> 10 Themes
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-medium -mt-1">
                  {lang === "my" 
                    ? "ရွေးချယ်ထားသော Theme သည် စနစ်တစ်ခုလုံး (Dashboard, POS, Reports) တွင် တိုက်ရိုက်ပြောင်းလဲသွားမည် ဖြစ်ပါသည်။" 
                    : "Select your preferred visual styling. Applies instantly across all POS screens, receipts, and dashboards."}
                </p>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(THEMES).map((theme) => {
                    const isSelected = sTheme === theme.id;
                    
                    // Categorize theme vibe for visual badges
                    const vibeTag = theme.id === "clean-modern"
                      ? { label: "Clean UI/UX (Default)", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" }
                      : theme.id === "clean-light"
                      ? { label: "Clean Light", cls: "bg-sky-400/15 text-sky-300 border-sky-400/20" }
                      : theme.isLight
                      ? { label: "Light Mode", cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
                      : theme.id === "monochrome"
                      ? { label: "Monochrome", cls: "bg-white/10 text-neutral-300 border-white/20" }
                      : theme.id.includes("liquid")
                      ? { label: "Liquid Glass", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20" }
                      : theme.id.includes("immersive")
                      ? { label: "Glassmorphic", cls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20" }
                      : { label: "OLED Dark", cls: "bg-purple-500/15 text-purple-300 border-purple-500/20" };

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSTheme(theme.id)}
                        className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between outline-none ${
                          isSelected
                            ? "border-indigo-500/80 bg-gradient-to-br from-indigo-500/15 via-white/[0.08] to-purple-500/10 shadow-[0_0_24px_rgba(99,102,241,0.22),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-indigo-500/40 scale-[1.01]"
                            : "bg-[#0e131f]/60 border-white/[0.07] hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:scale-[1.008]"
                        }`}
                      >
                        {/* Ambient theme glow on active */}
                        {isSelected && (
                          <div className={`absolute top-0 right-0 w-24 h-24 ${theme.glow1 || "bg-indigo-500/20"} blur-[30px] rounded-full pointer-events-none -mr-4 -mt-4`} />
                        )}

                        <div className="flex items-center gap-3 min-w-0 relative z-10">
                          {/* Multi-layer Swatch Orb */}
                          <div className="w-9 h-9 rounded-xl p-[2px] bg-gradient-to-b from-white/20 to-white/5 border border-white/10 shadow-inner flex items-center justify-center shrink-0 group-hover:border-white/30 transition-colors">
                            <div className={`w-full h-full rounded-[9px] bg-gradient-to-tr ${theme.gradient} shadow-[0_0_10px_rgba(255,255,255,0.15)] flex items-center justify-center`} />
                          </div>

                          {/* Theme Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-white font-display tracking-tight truncate">
                                {theme.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${vibeTag.cls}`}>
                                {vibeTag.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        <div className="relative z-10 ml-2 shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-in zoom-in-50 duration-150">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-white/15 group-hover:border-white/35 transition-colors flex items-center justify-center bg-black/20" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Intentional Save Button */}
              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-white hover:bg-neutral-200 text-black font-black py-4 px-6 rounded-2xl text-sm shadow active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <RefreshCcw size={16} className="animate-spin text-black" />
                      <span>{t.saving}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} className="text-black" />
                      <span>{lang === "my" ? "ဆက်တင်များ အားလုံး သိမ်းဆည်းမည်" : "Save All Settings"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── 3. CUSTOMERS ─────────────────────────────────────────────────── */}
          {modalType === "customers" && (
            <div className="space-y-4">
              {/* Add Customer Form */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                <p className={labelCls}>{t.addCustomer}</p>
                <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} placeholder={lang === "my" ? "အမည် *" : "Name *"} className={smallInputCls} />
                <div>
                  <input
                    type="tel"
                    value={cPhone}
                    onChange={(e) => { setCPhone(e.target.value); setCPhoneError(""); }}
                    placeholder={lang === "my" ? "09xxxxxxxxx" : "09xxxxxxxxx"}
                    className={`${smallInputCls} ${cPhoneError ? "border-rose-500" : ""}`}
                  />
                  {cPhoneError && <p className="mt-1 text-[10px] text-rose-400 font-bold">{cPhoneError}</p>}
                </div>
                <button onClick={handleSaveCustomer} className="w-full bg-white hover:bg-neutral-200 text-black py-3 rounded-xl text-xs font-black shadow transition cursor-pointer">
                  {lang === "my" ? "အသစ်ထည့်သွင်းမည်" : "Add Customer"}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input type="text" value={cSearch} onChange={(e) => setCSearch(e.target.value)} placeholder={t.customerSearch} className={`${smallInputCls} pl-8`} />
              </div>

              {/* Customers List */}
              <p className={labelCls}>{t.customersListLabel}</p>
              <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className={`bg-white/5 p-4 rounded-xl border transition cursor-pointer ${selectedCustomer === c.id ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/5 hover:border-white/10"}`}
                    onClick={() => setSelectedCustomer(selectedCustomer === c.id ? null : c.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white font-display">{c.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{c.phone || (lang === "my" ? "ဖုန်းမရှိပါ" : "No Phone")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border ${c.debt > 0 ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                          {c.debt > 0 ? `${c.debt.toLocaleString()} Ks` : t.noDebt}
                        </span>
                        {c.debt > 0 && (
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(lang === "my" ? "ကြွေးမြီ ရှင်းလင်းမည်မှာ သေချာပါသလား?" : "Clear this debt?")) {
                              await updateDoc(doc(db, "shops", shopId, "customers", c.id), { debt: 0 });
                            }
                          }} className="bg-white/10 text-white hover:bg-white/20 font-black text-[10px] px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer">
                            {t.clearDebt}
                          </button>
                        )}
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(lang === "my" ? "ဖျက်ပစ်ရန် သေချာပါသလား?" : "Delete this customer?")) {
                            await deleteDoc(doc(db, "shops", shopId, "customers", c.id));
                            if (selectedCustomer === c.id) setSelectedCustomer(null);
                          }
                        }} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Purchase History Expansion */}
                    {selectedCustomer === c.id && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                        <p className={labelCls}>{t.purchaseHistory}</p>
                        {customerSales.length === 0 ? (
                          <p className="text-xs text-slate-500">{t.noSalesHistory}</p>
                        ) : (
                          customerSales.slice(0, 5).map((s) => (
                            <div key={s.id} className="flex justify-between items-center text-[10px] text-slate-400 py-1 border-b border-white/5">
                              <span>{s.createdAt?.toDate().toLocaleDateString()}</span>
                              <span className="font-bold text-white">{(s.total || 0).toLocaleString()} Ks</span>
                              <span className="text-slate-500">{s.paymentMethod}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. SUPPLIERS ─────────────────────────────────────────────────── */}
          {modalType === "suppliers" && (
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-2">
                <input type="text" value={suppName} onChange={(e) => setSuppName(e.target.value)} placeholder={t.supplierName} className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500/50" />
                <button onClick={handleAddSupplier} className="bg-white hover:bg-neutral-200 text-black px-5 rounded-xl text-xs font-black cursor-pointer shadow">{lang === "my" ? "ထည့်မည်" : "Add"}</button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                {suppliers.map((s) => (
                  <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-sm">
                    <span className="font-bold text-sm text-white font-display">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                        {s.debt > 0 ? `${s.debt.toLocaleString()} Ks Debt` : (lang === "my" ? "ကြွေးမရှိပါ" : "No Debt")}
                      </span>
                      {s.debt > 0 && (
                        <button onClick={async () => await updateDoc(doc(db, "shops", shopId, "suppliers", s.id), { debt: 0 })} className="bg-white/10 text-white border border-white/10 text-[10px] px-2.5 py-1.5 rounded-lg font-bold cursor-pointer">Pay</button>
                      )}
                      <button onClick={async () => { if (window.confirm(lang === "my" ? "ဖျက်ပစ်ရန် သေချာပါသလား?" : "Delete?")) await deleteDoc(doc(db, "shops", shopId, "suppliers", s.id)); }} className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. COD TRACKING — Full Workflow ─────────────────────────────── */}
          {modalType === "cod" && (
            <div className="space-y-4">
              {/* Summary Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-amber-400 uppercase mb-1">{t.codTotalPending}</p>
                  <p className="text-xl font-black text-amber-300 font-display">{codSummary.pending.toLocaleString()} Ks</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">{t.codTotalCollected}</p>
                  <p className="text-xl font-black text-emerald-300 font-display">{codSummary.collected.toLocaleString()} Ks</p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {(["all", "Pending", "OutForDelivery", "Collected", "Failed"] as const).map((f) => {
                  const labels: Record<string, string> = {
                    all: t.codFilterAll,
                    Pending: t.codPendingStatus,
                    OutForDelivery: t.codOutForDelivery,
                    Collected: t.codCollected,
                    Failed: t.codFailed,
                  };
                  const colors: Record<string, string> = {
                    all: codFilter === "all" ? "bg-white text-slate-900" : "bg-white/5 text-slate-300",
                    Pending: codFilter === "Pending" ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-400",
                    OutForDelivery: codFilter === "OutForDelivery" ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-400",
                    Collected: codFilter === "Collected" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-400",
                    Failed: codFilter === "Failed" ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-400",
                  };
                  return (
                    <button key={f} onClick={() => setCodFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition cursor-pointer ${colors[f]}`}>
                      {labels[f]}
                    </button>
                  );
                })}
              </div>

              {/* COD List */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto no-scrollbar">
                {filteredCOD.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-semibold text-sm">
                    {lang === "my" ? "COD မှတ်တမ်း မရှိသေးပါ။" : "No COD records found."}
                  </div>
                ) : (
                  filteredCOD.map((s) => {
                    const itemsStr = (s.items || []).map((i: any) => i.name).join(", ");
                    const statusColors: Record<string, string> = {
                      Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      OutForDelivery: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      Collected: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      Failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                    };
                    const statusColor = statusColors[s.codStatus] || statusColors.Pending;
                    return (
                      <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="overflow-hidden mr-2">
                            <p className="font-bold text-xs text-slate-200 truncate font-display">{itemsStr || "Items"}</p>
                            <p className="text-[9px] text-slate-500 font-semibold">{s.createdAt?.toDate().toLocaleDateString()}</p>
                            {s.customerName && <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">{s.customerName}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-black text-sm text-indigo-400 font-display">{(s.total || 0).toLocaleString()} Ks</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${statusColor}`}>{s.codStatus || "Pending"}</span>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-1.5 flex-wrap">
                          {s.codStatus === "Pending" && (
                            <button onClick={() => handleUpdateCOD(s.id, "OutForDelivery")} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1">
                              <Truck size={11} /> {t.codMarkDelivery}
                            </button>
                          )}
                          {(s.codStatus === "Pending" || s.codStatus === "OutForDelivery") && (
                            <button onClick={() => handleUpdateCOD(s.id, "Collected")} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1">
                              <CheckCircle size={11} /> {t.codMarkCollected}
                            </button>
                          )}
                          {s.codStatus !== "Failed" && s.codStatus !== "Collected" && (
                            <button onClick={() => handleUpdateCOD(s.id, "Failed")} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1">
                              <AlertCircle size={11} /> {t.codMarkFailed}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── 6. EXPENSES / PAYROLL / PURCHASES ────────────────────────────── */}
          {(modalType === "expenses" || modalType === "purchase-list" || modalType === "payroll") && (
            <FinanceManager
              type={modalType}
              items={listData}
              lang={lang}
              onAddItem={modalType === "expenses" ? handleAddExpense : modalType === "purchase-list" ? handleAddPurchase : handleAddPayroll}
              shopId={shopId}
            />
          )}

          {/* ── 7. LOW STOCK ─────────────────────────────────────────────────── */}
          {modalType === "low-stock" && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar">
              {allProducts.filter((p) => p.quantity <= (p.lowStockThreshold || 5)).length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-bold">{t.noLowStock}</div>
              ) : (
                allProducts.filter((p) => p.quantity <= (p.lowStockThreshold || 5)).map((p) => (
                  <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-rose-500/20 flex justify-between items-center shadow-sm">
                    <div>
                      <b className="text-white text-sm font-display">{p.name}</b>
                      <p className="text-[10px] text-slate-500 font-bold">{lang === "my" ? "အုပ်စု: " : "Category: "}{p.category}</p>
                      {p.reorderPoint && <p className="text-[10px] text-amber-400 font-semibold">{lang === "my" ? "ပြည့်တင်ရမည်: " : "Reorder at: "}{p.reorderPoint}</p>}
                    </div>
                    <span className="text-rose-400 bg-rose-500/10 font-black border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-display">
                      {p.quantity} {lang === "my" ? "ခုကျန်" : "Left"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── 8. STOCK ADJUSTMENT — Enhanced ──────────────────────────────── */}
          {modalType === "stock-adjust" && (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4 shadow-inner">
                {/* Product selector */}
                <div>
                  <label className={labelCls}>{t.selectProduct} *</label>
                  <select
                    value={adjProdId}
                    onChange={(e) => { setAdjProdId(e.target.value); const p = allProducts.find((x) => x.id === e.target.value); setAdjQty(p?.quantity || 0); }}
                    className="w-full p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    <option value="">{t.selectProduct}</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({lang === "my" ? "လက်ရှိ" : "Current"}: {p.quantity})</option>
                    ))}
                  </select>
                </div>

                {/* Show prev qty */}
                {selectedProduct && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase">{t.adjustPrevQty}</p>
                      <p className="text-lg font-black text-white">{selectedProduct.quantity} <span className="text-xs text-slate-400">{selectedProduct.unit || "pcs"}</span></p>
                    </div>
                    <div className="text-slate-500">→</div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase">{t.adjustNewQty}</p>
                      <p className={`text-lg font-black ${adjQty < selectedProduct.quantity ? "text-rose-400" : "text-emerald-400"}`}>{adjQty} <span className="text-xs text-slate-400">{selectedProduct.unit || "pcs"}</span></p>
                    </div>
                  </div>
                )}

                {/* Reason code */}
                <div>
                  <label className={labelCls}>{t.adjustReasonCode}</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["Recount", "Damaged", "Expired", "Return", "Other"] as const).map((r) => {
                      const rLabels: Record<string, string> = {
                        Recount: t.adjustReasonRecount,
                        Damaged: t.adjustReasonDamaged,
                        Expired: t.adjustReasonExpired,
                        Return: t.adjustReasonReturn,
                        Other: t.adjustReasonOther,
                      };
                      return (
                        <button key={r} type="button" onClick={() => setAdjReasonCode(r)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition cursor-pointer ${adjReasonCode === r ? "bg-indigo-500 text-white border-indigo-500" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"}`}>
                          {rLabels[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* New qty + Notes */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={adjQty}
                    onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)}
                    placeholder={t.newQuantity}
                    className="flex-1 p-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold outline-none"
                  />
                  <button onClick={handleStockAdjustment} className="bg-white hover:bg-neutral-200 text-black font-black px-6 py-3 rounded-xl text-xs shadow transition cursor-pointer">
                    {t.adjustBtn}
                  </button>
                </div>

                <input
                  type="text"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder={t.adjustNotes}
                  className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-medium outline-none"
                />

                <p className="text-[9px] text-slate-500 font-semibold">
                  {t.adjustActor}: <strong className="text-indigo-400">{currentUser}</strong>
                </p>

                {/* Large adjustment warning */}
                {isLargeAdjustment && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{t.adjustApprovalWarning}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 9. STAFF SHIFTS — Enhanced ──────────────────────────────────── */}
          {modalType === "shifts" && (
            <div className="space-y-4">
              <div className="flex gap-3 shrink-0">
                <button onClick={() => handleClockInOut("in")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2">
                  <Clock size={14} /> {t.shiftsClockIn}
                </button>
                <button onClick={() => handleClockInOut("out")} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2">
                  <Clock size={14} /> {t.shiftsClockOut}
                </button>
              </div>

              {/* Paired shift records */}
              <p className={labelCls}>{t.shiftPaired}</p>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                {pairedShifts.length === 0 ? (
                  <p className="text-center text-slate-500 py-6 font-semibold">{t.shiftsNoLogs}</p>
                ) : (
                  pairedShifts.map(({ inRecord, outRecord, hoursWorked }) => (
                    <div key={inRecord.id} className="bg-white/5 p-3 border border-white/5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">IN</span>
                          <span className="text-xs font-semibold text-slate-300">{inRecord.time?.toDate().toLocaleString()}</span>
                        </div>
                        {hoursWorked !== null && (
                          <span className="text-[10px] font-black text-indigo-400">
                            {Math.floor(hoursWorked / 60)}h {hoursWorked % 60}m
                          </span>
                        )}
                      </div>
                      {outRecord ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">OUT</span>
                          <span className="text-xs font-semibold text-slate-300">{outRecord.time?.toDate().toLocaleString()}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-400 font-semibold italic">{t.shiftNoPair}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── 10. SALES LIST ────────────────────────────────────────────────── */}
          {modalType === "sales-list" && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {listData.map((s) => {
                const itemsStr = (s.items || []).map((i: any) => i.name).join(", ");
                return (
                  <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm flex justify-between items-center hover:border-white/10 transition">
                    <div className="overflow-hidden mr-2">
                      <p className="font-bold text-xs text-slate-200 truncate font-display">{itemsStr || (lang === "my" ? "အမည်မသိ" : "Unknown Items")}</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-1">{s.createdAt?.toDate().toLocaleString()}</p>
                      {s.cashierName && <p className="text-[9px] text-indigo-400">{lang === "my" ? "ကောင်တာ:" : "Cashier:"} {s.cashierName}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-sm text-white font-display">{(s.total || 0).toLocaleString()} Ks</p>
                        <span className="text-[9px] font-bold text-slate-400 bg-white/5 border border-white/10 px-1 rounded">{s.paymentMethod}</span>
                      </div>
                      <button onClick={async () => {
                        if (window.confirm(t.deleteVoucherConfirm)) {
                          await deleteDoc(doc(db, "shops", shopId, "sales", s.id));
                        }
                      }} className="text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 p-2 rounded-lg transition cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* ── 11. Z-REPORT (DAILY REGISTER CLOSE) ───────────────────────── */}
          {modalType === "z-report" && (() => {
            const totalTxns = listData.length;
            const grossRev = listData.reduce((s: number, x: any) => s + (x.subTotal || x.total || 0), 0);
            const totalDisc = listData.reduce((s: number, x: any) => s + (x.discount || 0), 0);
            const netRev = listData.reduce((s: number, x: any) => s + (x.total || 0), 0);
            const cashSales = listData.filter((x: any) => (x.paymentMethod || "Cash").toLowerCase() === "cash").reduce((s: number, x: any) => s + (x.total || 0), 0);
            const digitalSales = netRev - cashSales;
            
            const handlePrintZReport = () => {
              const printWin = window.open("", "_blank");
              if (!printWin) return;
              const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
              printWin.document.write(`
                <html>
                  <head>
                    <title>Z-Report - ${dateStr}</title>
                    <style>
                      body { font-family: 'Courier New', monospace; font-size: 13px; max-width: 320px; margin: 0 auto; padding: 15px; color: #000; }
                      h1 { font-size: 18px; text-align: center; margin: 0; text-transform: uppercase; }
                      h2 { font-size: 13px; text-align: center; margin: 5px 0 15px; border-bottom: 2px dashed #000; padding-bottom: 8px; }
                      .row { display: flex; justify-content: space-between; margin: 4px 0; }
                      .divider { border-top: 1px dashed #000; margin: 8px 0; }
                      .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
                      .bold { font-weight: bold; }
                      .center { text-align: center; margin-top: 15px; font-size: 11px; }
                    </style>
                  </head>
                  <body>
                    <h1>${shopName || "SWIFT POS"}</h1>
                    <h2>DAILY Z-REPORT / CLOSE</h2>
                    <div class="row"><span>Date & Time:</span><span>${dateStr}</span></div>
                    <div class="row"><span>Cashier:</span><span>${currentUser}</span></div>
                    <div class="divider"></div>
                    <div class="row"><span>Total Orders:</span><span class="bold">${totalTxns}</span></div>
                    <div class="row"><span>Gross Sales:</span><span>${grossRev.toLocaleString()} Ks</span></div>
                    <div class="row"><span>Discounts:</span><span>-${totalDisc.toLocaleString()} Ks</span></div>
                    <div class="double-divider"></div>
                    <div class="row bold"><span>NET REVENUE:</span><span>${netRev.toLocaleString()} Ks</span></div>
                    <div class="divider"></div>
                    <div class="row"><span>Cash Collected:</span><span>${cashSales.toLocaleString()} Ks</span></div>
                    <div class="row"><span>Digital / Other:</span><span>${digitalSales.toLocaleString()} Ks</span></div>
                    <div class="divider"></div>
                    <div class="center">
                      ============================<br/>
                      REGISTER CLOSED SUCCESSFULLY<br/>
                      Swift POS Enterprise
                    </div>
                  </body>
                </html>
              `);
              printWin.document.close();
              printWin.focus();
              printWin.print();
            };

            return (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                      {lang === "my" ? "ယနေ့ စုစုပေါင်း အရောင်းဝင်ငွေ" : "Today's Net Revenue"}
                    </span>
                    <h3 className="text-2xl font-black text-white font-display mt-0.5">
                      {netRev.toLocaleString()} <span className="text-xs font-bold text-slate-400">Ks</span>
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black">
                    {totalTxns} {lang === "my" ? "ဘောက်ချာ" : "Sales"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5">
                      <DollarSign size={11} className="text-emerald-400" />
                      {lang === "my" ? "ငွေသား အရောင်း" : "Cash Sales"}
                    </span>
                    <span className="text-base font-black text-white mt-1 block">{cashSales.toLocaleString()} Ks</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5">
                      <CreditCard size={11} className="text-sky-400" />
                      {lang === "my" ? "ဒစ်ဂျစ်တယ် ငွေလွှဲ" : "Digital (KPay/Wave)"}
                    </span>
                    <span className="text-base font-black text-white mt-1 block">{digitalSales.toLocaleString()} Ks</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{lang === "my" ? "စုစုပေါင်း ဈေးရောင်းတန်ဖိုး:" : "Gross Sales:"}</span>
                    <span className="font-bold">{grossRev.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{lang === "my" ? "စုစုပေါင်း လျှော့ပေးငွေ:" : "Total Discounts:"}</span>
                    <span className="font-bold text-rose-400">-{totalDisc.toLocaleString()} Ks</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-white/5 pt-2">
                    <span>{lang === "my" ? "စာရင်းဝင်ငွေ စုစုပေါင်း:" : "Net Revenue:"}</span>
                    <span className="text-emerald-400">{netRev.toLocaleString()} Ks</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePrintZReport}
                    className="flex-1 py-3.5 bg-white hover:bg-neutral-200 text-black font-black text-xs rounded-2xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Receipt size={16} />
                    <span>{lang === "my" ? "Z-Report ပရင့်ထုတ်မည် (Thermal Print)" : "Print Z-Report (80mm)"}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    {lang === "my" ? "ပိတ်မည်" : "Close"}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Finance Manager Sub-Component ─────────────────────────────────────────
interface FinanceProps {
  type: string;
  items: any[];
  lang?: Language;
  onAddItem: (desc: string, amount: number) => void;
  shopId: string;
}

function FinanceManager({ type, items, lang = "en", onAddItem, shopId }: FinanceProps) {
  const t = translations[lang];
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState(0);

  const handleSubmit = () => {
    if (!desc.trim() || amt <= 0) return;
    onAddItem(desc.trim(), amt);
    setDesc("");
    setAmt(0);
  };

  const placeholders: Record<string, string> = {
    expenses: lang === "my" ? "အကြောင်းအရာ..." : "Description...",
    payroll: lang === "my" ? "ဝန်ထမ်းအမည်..." : "Employee Name...",
    "purchase-list": lang === "my" ? "ဝယ်ယူသည့်ပစ္စည်း..." : "Purchased Item...",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={placeholders[type] || "Description..."}
          className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500/50"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(parseFloat(e.target.value) || 0)}
            placeholder={lang === "my" ? "ပမာဏ (Ks)" : "Amount (Ks)"}
            className="w-28 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500/50"
          />
          <button onClick={handleSubmit} className="bg-white hover:bg-neutral-200 text-black px-5 rounded-xl text-xs font-black transition cursor-pointer shadow">
            {lang === "my" ? "ပေါင်းမည်" : "Add"}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
        {items.map((i) => (
          <div key={i.id} className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold text-xs text-slate-200 font-display">{i.desc || i.name}</p>
              <p className="text-[9px] text-slate-500 font-semibold">{i.date?.toDate().toLocaleDateString() || ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-rose-400 font-display">{(i.amount || 0).toLocaleString()} Ks</span>
              <button onClick={async () => {
                if (window.confirm(lang === "my" ? "ဖျက်ပစ်မည်မှာ သေချာပါသလား?" : "Delete this item?")) {
                  await deleteDoc(doc(db, "shops", shopId, type === "purchase-list" ? "purchases" : type, i.id));
                }
              }} className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg cursor-pointer">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
