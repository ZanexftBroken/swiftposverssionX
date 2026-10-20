import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Brain, Send, Sparkles, BookOpen, MessageSquare, Search,
  ChevronDown, ChevronUp, Command, HelpCircle, CheckCircle2,
  ExternalLink, Table, Zap, ShoppingCart, Package, Receipt, Building2, DollarSign
} from "lucide-react";
import { Product, ChatMessage } from "../types";
import { Language } from "../lib/translations";
import { USER_GUIDE_CHAPTERS, KEYBOARD_SHORTCUTS } from "../lib/userGuideData";

interface AiAnalystProps {
  allProducts: Product[];
  salesHistory?: any[];
  expenses?: any[];
  purchases?: any[];
  payroll?: any[];
  customers?: any[];
  shopId: string;
  lang?: Language;
  onOpenGoogleSheets?: () => void;
}

export default function AiAnalyst({
  allProducts,
  salesHistory = [],
  expenses = [],
  purchases = [],
  payroll = [],
  customers = [],
  shopId,
  lang = "my",
  onOpenGoogleSheets
}: AiAnalystProps) {
  const [activeTab, setActiveTab] = useState<"ai-chat" | "user-guide">("ai-chat");
  const [guideSearch, setGuideSearch] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>("pos-checkout");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: lang === "my"
        ? "မင်္ဂလာပါဗျာ၊ ကျွန်တော်က Swift POS ရဲ့ စမတ် AI လက်ထောက် & User Guide ဖြစ်ပါတယ်။\n\nစနစ်အသုံးပြုနည်းလမ်းညွှန်များ (ဖြတ်လမ်းခလုတ်များ၊ Z-Report၊ Google Sheets၊ Offline Mode) အပြင် ဆိုင်ရဲ့ ရောင်းအား၊ အမြတ်ငွေ၊ စတော့အခြေအနေများကို မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။"
        : "Hello! I am your Swift POS Smart Assistant & Guide.\n\nAsk me anything about how to use the POS (Shortcuts, Z-Report, Google Sheets, Offline Mode), or inquire about your sales, profits, and inventory status.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [staticInsight, setStaticInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time Business Metrics computed locally (No API needed)
  const shopMetrics = useMemo(() => {
    const totalRevenue = salesHistory.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalCost = salesHistory.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPayroll = payroll.reduce((sum, p) => sum + (p.amount || 0), 0);
    const netProfit = totalRevenue - totalCost - totalExpenses - totalPayroll;

    const lowStockItems = allProducts.filter(
      (p) => p.quantity <= (p.lowStockThreshold || 5)
    );
    const inventoryValuation = allProducts.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
    const potentialSalesValue = allProducts.reduce((sum, p) => sum + p.quantity * p.retailPrice, 0);

    return {
      totalRevenue,
      totalCost,
      totalExpenses,
      totalPayroll,
      netProfit,
      lowStockItems,
      inventoryValuation,
      potentialSalesValue,
      totalProductsCount: allProducts.length,
      vouchersCount: salesHistory.length,
    };
  }, [allProducts, salesHistory, expenses, payroll]);

  // Generate initial local insights
  const generateLocalInsights = () => {
    setInsightLoading(true);
    setTimeout(() => {
      const { lowStockItems, totalProductsCount, netProfit, totalRevenue } = shopMetrics;
      if (totalProductsCount === 0) {
        setStaticInsight(
          lang === "my"
            ? "လက်ရှိတွင် ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ။ '+ Add Product' ဖြင့် ပစ္စည်းများ ထည့်သွင်းပြီး အရောင်းစတင်လိုက်ပါ။"
            : "No inventory added yet. Please add products to view live business insights."
        );
      } else {
        const parts: string[] = [];
        if (lowStockItems.length > 0) {
          parts.push(
            lang === "my"
              ? `စတော့လက်ကျန် နည်းနေသော ပစ္စည်း (${lowStockItems.length}) မျိုး ရှိနေပါသည် (${lowStockItems.slice(0, 3).map((p) => p.name).join(", ")}...)။ ပစ္စည်းပြတ်လပ်မှု မဖြစ်စေရန် အမြန်ဖြည့်တင်းပါ။`
              : `${lowStockItems.length} items are running low on stock (${lowStockItems.slice(0, 3).map((p) => p.name).join(", ")}...). Please reorder soon.`
          );
        } else {
          parts.push(
            lang === "my"
              ? "စတော့အခြေအနေ ကောင်းမွန်ပါသည်။ လက်ကျန်ပြတ်လပ်နေသော ပစ္စည်း မရှိသေးပါ။"
              : "Stock health is good. No items are currently below low-stock threshold."
          );
        }

        parts.push(
          lang === "my"
            ? `လက်ရှိ စုစုပေါင်းရောင်းအား: ${totalRevenue.toLocaleString()} Ks | အသားတင်အမြတ်: ${netProfit.toLocaleString()} Ks ဖြစ်ပါသည်။`
            : `Total Revenue: ${totalRevenue.toLocaleString()} Ks | Net Profit: ${netProfit.toLocaleString()} Ks.`
        );

        parts.push(
          lang === "my"
            ? "အကြံပြုချက်: အမြန်အရောင်းအတွက် [F1] Search, [F2] Camera Barcode, [F4] Checkout ကို အသုံးပြုပါ။ နေ့စဉ် ဆိုင်ပိတ်ချိန်တွင် Z-Report ဖြင့် နေ့ချုပ်စာရင်း စစ်ဆေးပါ။"
            : "Tip: Use [F1] for search, [F2] for Barcode Scanner, and [F4] for instant checkout. Don't forget daily Z-Reports."
        );

        setStaticInsight(parts.join("\n\n"));
      }
      setInsightLoading(false);
    }, 400);
  };

  useEffect(() => {
    generateLocalInsights();
  }, [allProducts.length, salesHistory.length]);

  // Smart Local Knowledge Engine (Answers without external API)
  const processLocalQuery = (query: string): string | null => {
    const q = query.toLowerCase().trim();

    // 1. Keyboard shortcuts / ဖြတ်လမ်းခလုတ်များ
    if (q.includes("shortcut") || q.includes("ဖြတ်လမ်း") || q.includes("ခလုတ်") || q.includes("f1") || q.includes("f2") || q.includes("f4") || q.includes("f9")) {
      return lang === "my"
        ? `⌨️ **Swift POS ၏ အမြန်ဖြတ်လမ်းခလုတ်များ (Keyboard Shortcuts):**\n\n• **[F1]** - ကုန်ပစ္စည်း အမြန်ရှာဖွေရေး အကွက်သို့ သွားရောက်ရန်\n• **[F2]** - ကင်မရာ Barcode စကင်နာ ဖွင့်ရန် (မိုဘိုင်း & ကွန်ပျူတာ)\n• **[F4]** - ငွေရှင်း / Checkout စတင်ရန်\n• **[F9]** - လက်ရှိဘောက်ချာကို ခေတ္တဆိုင်းငံ့ (Hold Order) ထားရန်\n• **[Esc]** - Modal များပိတ်ရန် သို့မဟုတ် အရောင်းမျက်နှာပြင်သို့ ပြန်သွားရန်`
        : `⌨️ **Swift POS Keyboard Shortcuts:**\n\n• **[F1]** - Focus Product Search box\n• **[F2]** - Open Camera Barcode Scanner\n• **[F4]** - Proceed to Checkout flow\n• **[F9]** - Hold current order\n• **[Esc]** - Close modals / Return to sales view`;
    }

    // 2. Google Sheets / စာရင်းထုတ်ယူခြင်း
    if (q.includes("google sheet") || q.includes("sheet") || q.includes("api လို") || q.includes("excel") || q.includes("export") || q.includes("စာရင်းထုတ်")) {
      return lang === "my"
        ? `**Google Sheets စာရင်းထုတ်ယူခြင်း & Auto-Sync:**\n\n• **Google Sheets API လိုမလား?**\n  -> ရှုပ်ထွေးသော Google Cloud API Key လုံးဝမလိုပါခင်ဗျာ! Google Apps Script Web App (အခမဲ့) နည်းလမ်းဖြင့် ၁ မိနစ်အတွင်း တိုက်ရိုက် Auto-Sync လုပ်နိုင်သလို၊ 1-Click Copy ဖြင့်လည်း Google Sheet ထဲ ချက်ချင်း paste လုပ်နိုင်ပါသည်။\n\n• **ထုတ်ယူနိုင်သော စာရင်းများ:**\n  ၁။ အရောင်းမှတ်တမ်းများ (Sales Ledger)\n  ၂။ ကုန်ပစ္စည်း/စတော့ (Inventory)\n  ၃။ အသုံးစရိတ်များ (Expenses)\n  ၄။ အဝယ်စာရင်း (Purchases)\n  ၅။ ဝန်ထမ်းလစာ (Payroll)\n  ၆။ ဖောက်သည်များ (Customers)\n\nDashboard ရှိ **'Google Sheets'** ခလုတ်ကို နှိပ်၍ အသုံးပြုနိုင်ပါပြီ!`
        : `**Google Sheets Sync & Export:**\n\n• **Is Google Sheets API Required?**\n  -> No complex API keys required! You can use Google Apps Script Web App for free direct auto-sync, or use 1-Click Copy to paste right into sheets.google.com.\n\n• **Available Exports:**\n  Sales, Inventory, Expenses, Purchases, Payroll, and Customers.\n\nClick the **'Google Sheets'** button on the Dashboard or Reports page to start!`;
    }

    // 3. Z-Report / နေ့ချုပ်စာရင်း
    if (q.includes("z-report") || q.includes("z report") || q.includes("နေ့ချုပ်") || q.includes("ရှင်းတမ်း") || q.includes("ဆိုင်ပိတ်")) {
      return lang === "my"
        ? `**Z-Report (နေ့ချုပ်စာရင်း) ထုတ်နည်း:**\n\n၁။ Dashboard ရှိ Quick Operations မှ **'Z-Report'** ခလုတ်ကို နှိပ်ပါ။\n၂။ ယနေ့ ရောင်းအားစုစုပေါင်း (Gross Sales)၊ လျှော့စျေး (Discounts)၊ အသားတင်ရောင်းအား (Net Sales) နှင့် ဘောက်ချာအရေအတွက်ကို ကြည့်ရှုပါ။\n၃။ အံဆွဲထဲရှိ ငွေသား (Cash) နှင့် ဒစ်ဂျစ်တယ်ငွေပေးချေမှု (KPay, WavePay စသည်) တို့ကို သီးခြားစီ စစ်ဆေးပါ။\n၄။ **'Print Z-Report'** နှိပ်၍ 80mm စက္ကူအရွယ်အစားဖြင့် သပ်ရပ်စွာ ပရင့်ထုတ်ယူနိုင်ပါသည်။`
        : `**Z-Report (Daily Register Close):**\n\n1. Click **'Z-Report'** on the Dashboard Quick Operations grid.\n2. Review today's Gross Sales, Discounts, Net Sales, and Voucher Count.\n3. Check Cash vs Digital Wallets (KPay, WavePay, etc.) breakdown.\n4. Click **'Print Z-Report'** to print an 80mm audit receipt.`;
    }

    // 4. Offline Mode / အော့ဖ်လိုင်း
    if (q.includes("offline") || q.includes("လိုင်းမရှိ") || q.includes("အင်တာနက်") || q.includes("pwa") || q.includes("install")) {
      return lang === "my"
        ? `**Offline Mode & PWA အသုံးပြုပုံ:**\n\n• Swift POS သည် အင်တာနက်လိုင်း မရှိသော်လည်း အရောင်းစာရင်းသွင်းခြင်း၊ ဘောက်ချာထုတ်ခြင်းများကို Offline-First စနစ်ဖြင့် ပုံမှန်အတိုင်း ပြုလုပ်နိုင်ပါသည်။\n• အင်တာနက် ပြန်ရရှိပါက Cloud နှင့် အလိုအလျောက် Auto-Sync ပြုလုပ်ပေးပါသည်။\n• ကွန်ပျူတာ သို့မဟုတ် ဖုန်းတွင် App အဖြစ် သွင်းလိုပါက Chrome/Edge ၏ URL bar ရှိ 'Install App' (သို့မဟုတ် Add to Home Screen) ကို နှိပ်ပြီး Desktop/Mobile App အဖြစ် သုံးနိုင်ပါသည်။`
        : `**Offline Mode & PWA Guide:**\n\n• Swift POS is an Offline-First app. It functions fully without internet, caching all products and sales.\n• Automatically syncs with Cloud once internet connection is restored.\n• Install on Desktop/Mobile via Chrome/Edge 'Install App' icon or Safari 'Add to Home Screen'.`;
    }

    // 5. Stock / Inventory / စတော့
    if (q.includes("စတော့") || q.includes("stock") || q.includes("ပစ္စည်းထည့်") || q.includes("ကုန်ပစ္စည်း")) {
      const lowItems = shopMetrics.lowStockItems;
      const lowStr = lowItems.length > 0
        ? `\n\n**လက်ရှိ စတော့နည်းနေသော ပစ္စည်းများ (${lowItems.length} မျိုး):**\n` + lowItems.slice(0, 5).map((p) => `• ${p.name} (လက်ကျန်: ${p.quantity} ခု)`).join("\n")
        : `\n\nလက်ရှိတွင် စတော့ပြတ်လပ်နေသော ပစ္စည်း မရှိသေးပါ။`;

      return lang === "my"
        ? `**ကုန်ပစ္စည်းနှင့် စတော့ စီမံခန့်ခွဲမှု:**\n\n• ကုန်ပစ္စည်းအသစ်ထည့်ရန်: **Items -> '+ Add Product'** ကို နှိပ်ပါ။\n• Barcode ကုဒ်များ သတ်မှတ်ထားပါက [F2] ကင်မရာစကင်နာဖြင့် အမြန်ဖတ်နိုင်ပါသည်။\n• စတော့ချိန်ညှိရန်: **Stock Adjustment** မှ ပျက်စီး၊ သက်တမ်းကုန်၊ ပြန်လည်ရေတွက်မှုများ မှတ်တမ်းတင်နိုင်ပါသည်။${lowStr}`
        : `**Inventory & Stock Management:**\n\n• To add items: Go to **Items -> '+ Add Product'**.\n• Assign barcodes for fast camera scanning via [F2].\n• Record stock changes in **Stock Adjustment**.${lowStr}`;
    }

    // 6. Net Profit / Revenue / Financials
    if (q.includes("အမြတ်") || q.includes("ဝင်ငွေ") || q.includes("ရောင်းအား") || q.includes("profit") || q.includes("revenue") || q.includes("ငွေစာရင်း")) {
      return lang === "my"
        ? `**ဆိုင်၏ ဘဏ္ဍာရေး အချက်အလက်များ (Live Status):**\n\n• စုစုပေါင်းရောင်းအား (Revenue): **${shopMetrics.totalRevenue.toLocaleString()} Ks**\n• ကုန်ပစ္စည်းအရင်း (COGS): **${shopMetrics.totalCost.toLocaleString()} Ks**\n• ဆိုင်အသုံးစရိတ် (Expenses): **${shopMetrics.totalExpenses.toLocaleString()} Ks**\n• ဝန်ထမ်းလစာ (Payroll): **${shopMetrics.totalPayroll.toLocaleString()} Ks**\n• အသားတင်အမြတ်ငွေ (Net Profit): **${shopMetrics.netProfit.toLocaleString()} Ks**\n\nအသေးစိတ် အစီရင်ခံစာနှင့် လမ်းကြောင်းဇယားများကို **Reports** စာမျက်နှာတွင် ကြည့်ရှုနိုင်ပါသည်။`
        : `**Store Financial Status:**\n\n• Sales Revenue: **${shopMetrics.totalRevenue.toLocaleString()} Ks**\n• Product Cost (COGS): **${shopMetrics.totalCost.toLocaleString()} Ks**\n• Expenses: **${shopMetrics.totalExpenses.toLocaleString()} Ks**\n• Payroll: **${shopMetrics.totalPayroll.toLocaleString()} Ks**\n• Net Profit: **${shopMetrics.netProfit.toLocaleString()} Ks**\n\nView complete charts in the **Reports** tab.`;
    }

    // 7. Multi-Branch / ဆိုင်ခွဲ
    if (q.includes("ဆိုင်ခွဲ") || q.includes("branch") || q.includes("လွှဲ") || q.includes("transfer")) {
      return lang === "my"
        ? `**ဆိုင်ခွဲများ (Multi-Branch) နှင့် ပစ္စည်းလွှဲပြောင်းခြင်း:**\n\n၁။ ဆိုင်ခွဲအသစ် ထည့်သွင်းရန်: **Stores -> '+ Create New Branch'** နှိပ်ပါ။\n၂။ ဆိုင်ခွဲအလိုက် စတော့လွှဲပြောင်းရန်: **Stock Transfer** သို့ သွားပြီး ထုတ်ပေးမည့်ဆိုင်နှင့် လက်ခံမည့်ဆိုင် ရွေးချယ်ပါ။\n၃။ Dashboard အပေါ်ရှိ Branch Filter မှ သက်ဆိုင်ရာ ဆိုင်ခွဲကို ရွေးချယ်ပြီး ဆိုင်ခွဲအလိုက် ရောင်းအား ကြည့်ရှုနိုင်ပါသည်။`
        : `**Multi-Branch Management:**\n\n1. Create branches in **Stores -> '+ Create New Branch'**.\n2. Transfer stock in **Stock Transfer** between locations.\n3. Filter dashboard and reports by individual branch using the top dropdown.`;
    }

    return null;
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || inputValue).trim();
    if (!text || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    if (!customText) setInputValue("");
    setLoading(true);

    // First check local knowledge engine (instant & offline-capable)
    const localAnswer = processLocalQuery(text);
    if (localAnswer) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: "ai", text: localAnswer }]);
        setLoading(false);
      }, 350);
      return;
    }

    // Try server API fallback if available
    try {
      const res = await fetch("/api/ai-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          context: {
            totalProductsCount: shopMetrics.totalProductsCount,
            totalRevenue: shopMetrics.totalRevenue,
            netProfit: shopMetrics.netProfit,
            lowStockCount: shopMetrics.lowStockItems.length,
          },
        }),
      });

      const data = await res.json();
      if (data.error || !data.text) {
        // Fallback gracefully without showing ugly error
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: lang === "my"
              ? `အချက်အလက် စစ်ဆေးချက်အရ သင့်ဆိုင်တွင် ကုန်ပစ္စည်း (${shopMetrics.totalProductsCount}) မျိုးရှိပြီး၊ ရောင်းအား (${shopMetrics.totalRevenue.toLocaleString()} Ks) နှင့် အသားတင်အမြတ် (${shopMetrics.netProfit.toLocaleString()} Ks) ရှိပါသည်။\n\nအခြားသိလိုသော အကြောင်းအရာ (ဖြတ်လမ်းခလုတ်များ၊ Z-Report၊ Google Sheets စသည်) ကို မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။`
              : `Your store currently holds ${shopMetrics.totalProductsCount} products, with ${shopMetrics.totalRevenue.toLocaleString()} Ks revenue and ${shopMetrics.netProfit.toLocaleString()} Ks net profit.\n\nFeel free to ask about keyboard shortcuts, Z-Reports, or Google Sheets sync.`,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: lang === "my"
            ? `လက်ရှိ စနစ်အခြေအနေ: စုစုပေါင်းရောင်းအား ${shopMetrics.totalRevenue.toLocaleString()} Ks ၊ အသားတင်အမြတ် ${shopMetrics.netProfit.toLocaleString()} Ks ဖြစ်ပါသည်။\n\nစနစ်အသုံးပြုနည်း အသေးစိတ်ကို 'User Guide' Tab တွင်လည်း ဝင်ရောက်ဖတ်ရှုနိုင်ပါသည်။`
            : `Store summary: Total revenue ${shopMetrics.totalRevenue.toLocaleString()} Ks, Net profit ${shopMetrics.netProfit.toLocaleString()} Ks.\n\nYou can also browse the 'User Guide' tab for full documentation.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Guide Chapters
  const filteredChapters = useMemo(() => {
    if (!guideSearch.trim()) return USER_GUIDE_CHAPTERS;
    const s = guideSearch.toLowerCase();
    return USER_GUIDE_CHAPTERS.filter(
      (c) =>
        c.titleEn.toLowerCase().includes(s) ||
        c.titleMy.toLowerCase().includes(s) ||
        c.descEn.toLowerCase().includes(s) ||
        c.descMy.toLowerCase().includes(s)
    );
  }, [guideSearch]);

  const renderChapterIcon = (id: string) => {
    switch (id) {
      case "pos-checkout":
        return <ShoppingCart size={18} className="text-white" />;
      case "z-report":
        return <Receipt size={18} className="text-white" />;
      case "google-sheets":
        return <Table size={18} className="text-white" />;
      case "inventory-barcode":
        return <Package size={18} className="text-white" />;
      case "offline-pwa":
        return <Zap size={18} className="text-white" />;
      case "branches-transfers":
        return <Building2 size={18} className="text-white" />;
      case "financials-pnl":
        return <DollarSign size={18} className="text-white" />;
      default:
        return <BookOpen size={18} className="text-white" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-4 sm:p-6 pb-24 overflow-y-auto h-full no-scrollbar relative z-10 font-sans text-neutral-200">
      
      {/* AI Header Banner */}
      <div className="bg-[#121214] border border-neutral-800 rounded-[2rem] p-6 shadow-sm text-white relative overflow-hidden shrink-0">
        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4">
          <Brain size={160} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-2xl mb-1 flex items-center gap-2 font-display">
              <Sparkles className="text-white" size={24} />
              {lang === "my" ? "Swift POS စမတ် AI & User Guide" : "Swift POS Smart AI & User Guide"}
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium">
              {lang === "my"
                ? "စနစ်အသုံးပြုနည်း လမ်းညွှန်များ၊ ဖြတ်လမ်းခလုတ်များ၊ Z-Report၊ Google Sheets နှင့် စီးပွားရေးအကြံပြုချက်များ"
                : "Interactive system manuals, shortcuts, Z-Reports, Google Sheets sync & financial insights"}
            </p>
          </div>

          {/* Tab Switcher: Chat vs Guide */}
          <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 self-start sm:self-center shrink-0">
            <button
              onClick={() => setActiveTab("ai-chat")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === "ai-chat"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <MessageSquare size={15} />
              {lang === "my" ? "AI အကြံပေး" : "AI Assistant"}
            </button>
            <button
              onClick={() => setActiveTab("user-guide")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === "user-guide"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen size={15} />
              {lang === "my" ? "အသုံးပြုနည်းလမ်းညွှန်" : "User Guide"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: AI ASSISTANT & CHAT ─── */}
      {activeTab === "ai-chat" && (
        <div className="flex flex-col gap-4 flex-1">
          {/* Static Insights Box */}
          <div className="bg-[#121214] p-5 rounded-[1.5rem] border border-neutral-800 shadow-sm space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
                <Sparkles className="text-white" size={14} />
                {lang === "my" ? "စနစ်၏ လက်ရှိအခြေအနေ သုံးသပ်ချက်" : "Smart Store Insights"}
              </h3>
              <button
                onClick={generateLocalInsights}
                disabled={insightLoading}
                className="text-xs font-bold text-neutral-300 hover:text-white disabled:opacity-50 transition cursor-pointer"
              >
                {insightLoading
                  ? (lang === "my" ? "တွက်ချက်နေသည်..." : "Analyzing...")
                  : (lang === "my" ? "ပြန်လည်သုံးသပ်မည်" : "Refresh Insights")}
              </button>
            </div>
            <div className="text-xs sm:text-sm font-medium text-neutral-200 leading-relaxed bg-[#18181b] p-4 rounded-xl border border-neutral-800 min-h-[60px] whitespace-pre-wrap">
              {insightLoading ? (
                <div className="flex items-center gap-2 text-neutral-400 animate-pulse">
                  <Sparkles size={16} className="animate-spin text-white" />
                  {lang === "my" ? "ဒေတာများကို ခွဲခြမ်းစိတ်ဖြာနေသည်..." : "Analyzing data..."}
                </div>
              ) : (
                staticInsight
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-[#121214] flex-1 p-4 rounded-[1.5rem] border border-neutral-800 shadow-sm flex flex-col min-h-[420px] overflow-hidden">
            
            {/* Quick Prompt Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-neutral-800 mb-3">
              {[
                { icon: Command, labelMy: "ဖြတ်လမ်းခလုတ်များ", labelEn: "Keyboard Shortcuts", query: "ဖြတ်လမ်းခလုတ်တွေ ဘာတွေရှိလဲ" },
                { icon: Receipt, labelMy: "Z-Report ထုတ်နည်း", labelEn: "How to do Z-Report", query: "Z-Report နေ့ချုပ် ဘယ်လိုထုတ်ရမလဲ" },
                { icon: Table, labelMy: "Google Sheets သို့ပို့နည်း", labelEn: "Google Sheets Export", query: "မှတ်သမျှစာရင်းတွေ Google Sheet ထဲ ဘယ်လိုထည့်မလဲ API လိုမလား" },
                { icon: Zap, labelMy: "Offline အသုံးပြုပုံ", labelEn: "Offline Mode Guide", query: "Offline ဖြစ်ရင် ဘယ်လိုသုံးရမလဲ" },
                { icon: Package, labelMy: "စတော့နည်းပစ္စည်းများ", labelEn: "Low Stock Items", query: "စတော့နည်းနေတာ ဘာတွေရှိလဲ" },
                { icon: DollarSign, labelMy: "ယနေ့အမြတ်ငွေ", labelEn: "Net Profit Status", query: "လက်ရှိရောင်းအားနဲ့ အမြတ်ဘယ်လောက်ကျန်လဲ" },
              ].map((pill, i) => {
                const IconComponent = pill.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(pill.query)}
                    className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <IconComponent size={12} className="text-neutral-400" />
                    <span>{lang === "my" ? pill.labelMy : pill.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3.5 p-2 no-scrollbar text-sm min-h-0">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl max-w-[85%] w-fit leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-white text-black font-semibold ml-auto shadow-sm"
                      : "bg-[#18181b] text-neutral-200 border border-neutral-800"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="bg-[#18181b] text-neutral-400 p-3.5 rounded-2xl max-w-[80%] w-fit italic border border-neutral-800 flex items-center gap-2">
                  <Sparkles className="animate-spin text-white" size={16} />
                  {lang === "my" ? "AI စဉ်းစားနေသည်..." : "AI is thinking..."}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-2 mt-3 border-t border-neutral-800 pt-3 shrink-0">
              <input
                id="ai-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  lang === "my"
                    ? "ဖြတ်လမ်းခလုတ်များ၊ Z-Report၊ Google Sheets၊ စတော့၊ အမြတ်ငွေ စသည် မေးမြန်းပါ..."
                    : "Ask about shortcuts, Z-Report, Google Sheets, inventory, profits..."
                }
                className="flex-1 p-3.5 bg-[#18181b] border border-neutral-800 rounded-xl text-xs sm:text-sm font-semibold text-white outline-none focus:border-neutral-500 transition placeholder:text-neutral-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputValue.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black px-5 py-3.5 rounded-xl font-bold text-sm shadow transition flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SYSTEM USER GUIDE & MANUAL ─── */}
      {activeTab === "user-guide" && (
        <div className="flex flex-col gap-5 flex-1">
          
          {/* Keyboard Shortcuts Quick Bar */}
          <div className="bg-[#121214] p-5 rounded-[1.5rem] border border-neutral-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Command size={15} className="text-white" />
              {lang === "my" ? "အမြန်ဖြတ်လမ်းခလုတ်များ (Keyboard Shortcuts)" : "Essential Keyboard Shortcuts"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {KEYBOARD_SHORTCUTS.map((s) => (
                <div key={s.key} className="bg-[#18181b] border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="font-mono font-black text-white text-sm bg-neutral-800 px-2 py-0.5 rounded-lg w-fit border border-neutral-700">
                    {s.key}
                  </span>
                  <span className="text-[11px] text-neutral-300 font-semibold mt-2">
                    {lang === "my" ? s.actionMy : s.actionEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Guide Search Bar */}
          <div className="flex items-center gap-3 bg-[#121214] border border-neutral-800 rounded-2xl px-4 py-3">
            <Search size={18} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              placeholder={lang === "my" ? "လမ်းညွှန်များထဲမှ ရှာဖွေပါ (ဥပမာ - Z-Report, Google Sheet, Barcode)..." : "Search user guide (e.g. Z-Report, Google Sheet, Barcode)..."}
              className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
            />
            {guideSearch && (
              <button onClick={() => setGuideSearch("")} className="text-xs text-neutral-400 hover:text-white">
                Clear
              </button>
            )}
          </div>

          {/* Chapters Accordions */}
          <div className="space-y-3">
            {filteredChapters.map((ch) => {
              const isExpanded = expandedChapter === ch.id;
              return (
                <div
                  key={ch.id}
                  className="bg-[#121214] border border-neutral-800 hover:border-neutral-700 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? null : ch.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer transition bg-transparent hover:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                        {renderChapterIcon(ch.id)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white font-display">
                          {lang === "my" ? ch.titleMy : ch.titleEn}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {lang === "my" ? ch.descMy : ch.descEn}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 border-t border-neutral-800 bg-[#09090b] space-y-4 text-xs sm:text-sm">
                      <div>
                        <h5 className="text-xs font-black text-neutral-300 uppercase tracking-widest mb-2.5">
                          {lang === "my" ? "လုပ်ဆောင်ရန် အဆင့်ဆင့်:" : "Step-by-step instructions:"}
                        </h5>
                        <ol className="list-decimal list-inside space-y-2 text-neutral-300 leading-relaxed">
                          {(lang === "my" ? ch.stepsMy : ch.stepsEn).map((step, idx) => (
                            <li key={idx} className="pl-1">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips & Shortcuts */}
                      {ch.tipsMy && ch.tipsMy.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle size={13} className="text-neutral-400" />
                            {lang === "my" ? "သိကောင်းစရာ အကြံပြုချက်" : "Pro Tip"}
                          </span>
                          {(lang === "my" ? ch.tipsMy : ch.tipsEn || []).map((tip, idx) => (
                            <p key={idx} className="text-xs text-neutral-300">
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Direct action button if applicable */}
                      {ch.id === "google-sheets" && onOpenGoogleSheets && (
                        <button
                          onClick={onOpenGoogleSheets}
                          className="px-4 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Table size={14} />
                          {lang === "my" ? "Google Sheets ဖွင့်မည်" : "Open Google Sheets Suite"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
