import React, { useState } from "react";
import {
  BookOpen, ChevronDown, ShoppingCart, Package, BarChart3,
  Bot, Building2, Users, Palette, Sparkles, LucideIcon
} from "lucide-react";
import type { ThemeConfig } from "../lib/theme";
import type { Language } from "../lib/translations";

interface Props { theme: ThemeConfig; lang: Language; }

type Feat = { t: string; tM: string; d: string; dM: string; badge?: string };
type Cat = { id: string; icon: LucideIcon; title: string; titleMy: string; color: string; bg: string; border: string; features: Feat[] };

const CATS: Cat[] = [
  { id:"pos", icon: ShoppingCart, title:"POS / Cashier", titleMy:"ငွေကောင်တာ (POS)",
    color:"text-sky-400", bg:"bg-sky-500/10", border:"border-sky-500/20",
    features:[
      {t:"Quick Add to Cart",tM:"ကုန်ပစ္စည်း တစ်ချက်နှိပ် Cart ထည့်",d:"Click any product to instantly add to cart.",dM:"ကုန်ပစ္စည်းကို နှိပ်ရုံနဲ့ Cart ထဲ ချက်ချင်းထည့်သွင်းနိုင်ပါတယ်"},
      {t:"5 Payment Methods",tM:"ငွေချေနည်း ၅ မျိုး",d:"Cash, KPay, WavePay, AYA Pay, Card",dM:"Cash, KPay, WavePay, AYA Pay, Card — ဘယ်နည်းနဲ့မဆို ငွေလက်ခံနိုင်",badge:"5 Methods"},
      {t:"Change Due Calculator",tM:"ပြန်အမ်းငွေ တွက်ချက်",d:"Enter cash tendered, change calculates instantly.",dM:"ပေးတဲ့ ငွေပမာဏ ထည့်ရုံနဲ့ ပြန်အမ်းငွေ ချက်ချင်းထွက်ပါတယ်"},
      {t:"Transaction Reference",tM:"ငွေလွှဲ Reference မှတ်",d:"Store txn reference for KPay/WavePay/AYA.",dM:"Digital payment တိုင်း Reference Number သိမ်းဆည်းပါတယ်"},
      {t:"Hold Order",tM:"အော်ဒါ ခဏသိမ်း",d:"Pause a sale, resume anytime.",dM:"Order ကို Hold လုပ်ပြီး နောက်မှ ဆက်ရောင်းနိုင်ပါတယ်"},
      {t:"Coupon Codes",tM:"Coupon ကုဒ် လျှော့ဈေး",d:"Apply percent or fixed discount codes at checkout.",dM:"WELCOME10, SWIFT50, VIP20, PROMO1000 — Coupon ကုဒ်ဖြင့် ဈေးလျှော့"},
      {t:"Receipt Print",tM:"ပြေစာ ပရင့်",d:"Auto-print receipt with store info after every sale.",dM:"ဆိုင်အမည်၊ လိပ်စာ ပါတဲ့ ပြေစာ ချက်ချင်းထုတ်နိုင်"},
      {t:"Camera Barcode Scanner",tM:"ကင်မရာ Barcode ဖတ်စနစ်",d:"Scan barcodes live via camera with flash & manual simulator.",dM:"ဖုန်း/ကွန်ပျူတာ Camera ဖြင့် Barcode အလိုအလျောက်ဖတ်နိုင်",badge:"Cam"},
      {t:"Keyboard Shortcuts (F1-F9)",tM:"ကီးဘုတ် ဖြတ်လမ်းခလုတ်များ",d:"F1 Search, F2 Camera, F4 Checkout, F9 Hold Order, Esc Close.",dM:"F1 ရှာဖွေ၊ F2 ကင်မရာ၊ F4 ငွေရှင်း၊ F9 အော်ဒါသိမ်း၊ Esc ပိတ်",badge:"Hotkeys"},
    ]
  },
  { id:"inventory", icon: Package, title:"Products + Inventory", titleMy:"ကုန်ပစ္စည်း + Stock",
    color:"text-emerald-400", bg:"bg-emerald-500/10", border:"border-emerald-500/20",
    features:[
      {t:"Add / Edit Products",tM:"ကုန်ပစ္စည်း ထည့်/ပြင်",d:"Name, SKU, Barcode, Category, Cost, Retail Price, Unit, Image.",dM:"အမည်၊ SKU၊ Barcode၊ ကဏ္ဍ၊ ကုန်ကျ၊ ရောင်းဈေး၊ ယူနစ်"},
      {t:"SKU Duplicate Check",tM:"SKU ထပ်မှု စစ်ဆေး",d:"Inline error on duplicate SKU.",dM:"SKU ထပ်နေရင် ချက်ချင်း error ပြ — Save မလုပ်ပေး",badge:"Auto"},
      {t:"Product Variants",tM:"ပစ္စည်း Variants",d:"Size/color variants with own SKU, price, stock.",dM:"S/M/L, အရောင်ခွဲ — Variant တစ်ခုချင်း SKU/ဈေး/Stock သီးသန့်"},
      {t:"Stock Adjustment + Audit Log",tM:"Stock ပြင် + မှတ်တမ်း",d:"5 reason codes + notes with actor and timestamp.",dM:"Damage/Expired/Recount/Return/Other + မှတ်ချက် + မှတ်တမ်းတင်"},
      {t:"Low Stock Alerts",tM:"Stock နည်းပါး သတိပေး",d:"Dashboard alert when stock drops below threshold.",dM:"Stock သတ်မှတ်ထားသည်ထက် နည်းရင် Dashboard မှာ သတိပေး"},
      {t:"Supplier Linking",tM:"ကုန်သည် ချိတ်ဆက်",d:"Link each product to a supplier.",dM:"ပစ္စည်းတစ်ခုချင်း Supplier ချိတ်ဆက်ထားနိုင်"},
    ]
  },
  { id:"reports", icon: BarChart3, title:"Reports + Finance", titleMy:"အစီရင်ခံ + ဘဏ္ဍာ",
    color:"text-violet-400", bg:"bg-violet-500/10", border:"border-violet-500/20",
    features:[
      {t:"Sales Dashboard",tM:"ရောင်းအားခြုံ Dashboard",d:"Today/month revenue, transactions, avg ticket.",dM:"ဒီနေ့/ဒီလ ဝင်ငွေ၊ အရောင်းဦးရေ၊ ပျမ်းမျှ Voucher"},
      {t:"Full P+L Statement",tM:"အမြတ်/အရှုံးစာရင်း",d:"Revenue to Gross Profit to Net Profit — full P+L.",dM:"ဝင်ငွေ → ကုန်ကျ → ဂရော့စ် → ကုန်ကျစရိတ် → လစာ → အမြတ်ငွေ",badge:"P+L"},
      {t:"CSV Export",tM:"CSV ဖိုင် Download",d:"11-column report: Date, Customer, Total, Cashier, Branch, TxnRef.",dM:"Sales Report ကို CSV ဖိုင် Download ယူနိုင်"},
      {t:"Expense + Payroll Tracking",tM:"ကုန်ကျ + လစာ မှတ်",d:"Log expenses and payroll, auto-deducted in net profit.",dM:"ကုန်ကျစရိတ်နဲ့ လစာ မှတ်တမ်းတင်ပြီး အမြတ်ငွေတွက်မှာ နုတ်ပါတယ်"},
      {t:"Interactive Revenue Charts",tM:"အပြန်အလှန် ဇယားဂရပ်များ",d:"Interactive 30-day revenue curve and payment method pie chart.",dM:"၃၀ ရက် ဝင်ငွေ Trend မျဉ်းကွေးနှင့် Payment နည်းလမ်း ပိုင်းခြားဇယား",badge:"Recharts"},
      {t:"Z-Report (Daily Register Close)",tM:"Z-Report (နေ့ချုပ်စာရင်း)",d:"Daily reconciliation, cash drawer balance & 80mm thermal receipt print.",dM:"နေ့ချုပ်စာရင်း၊ ငွေသား/ဒစ်ဂျစ်တယ်ခွဲခြမ်းမှုနှင့် 80mm ပြေစာထုတ်",badge:"Thermal Print"},
      {t:"Google Sheets Sync & Export",tM:"Google Sheets စာရင်းထုတ် & Auto-Sync",d:"Direct Webhook auto-sync, 1-click clipboard copy, and UTF-8 CSV.",dM:"Google Sheet ထဲ တိုက်ရိုက် Auto-Sync ပို့ခြင်း၊ 1-Click Copy နှင့် UTF-8 CSV",badge:"Sheets"},
    ]
  },
  { id:"ai", icon: Bot, title:"AI & Smart User Guide", titleMy:"AI လက်ထောက် + လမ်းညွှန်",
    color:"text-fuchsia-400", bg:"bg-fuchsia-500/10", border:"border-fuchsia-500/20",
    features:[
      {t:"Smart POS User Guide",tM:"စမတ် အသုံးပြုနည်း လမ်းညွှန်",d:"Comprehensive in-app user guide with shortcuts, step-by-step tutorials & tips.",dM:"ဖြတ်လမ်းခလုတ်များ၊ အဆင့်ဆင့်အသုံးပြုပုံနှင့် အကြံပြုချက် လမ်းညွှန်အပြည့်အစုံ",badge:"Guide"},
      {t:"Local Smart Intelligence",tM:"Offline သုံးနိုင်သော Local AI",d:"Answers POS shortcuts, Z-Report, inventory & profit queries offline without external API.",dM:"အင်တာနက်/API မလိုဘဲ ဖြတ်လမ်းခလုတ်၊ နေ့ချုပ်၊ စတော့၊ အမြတ်ငွေများ ချက်ချင်းဖြေကြားပေးနိုင်",badge:"Local AI"},
      {t:"Live Financial Insights",tM:"အချိန်နှင့်တပြေးညီ ဘဏ္ဍာရေးသုံးသပ်ချက်",d:"Instant analysis of revenue, profit margin, low stock and sales recommendations.",dM:"ရောင်းအား၊ အသားတင်အမြတ်နှင့် စတော့အခြေအနေများကို အချိန်နှင့်တပြေးညီ သုံးသပ်အကြံပြု",badge:"Insights"},
    ]
  },
  { id:"branches", icon: Building2, title:"Branch Management", titleMy:"ဆိုင်ခွဲ စီမံ",
    color:"text-amber-400", bg:"bg-amber-500/10", border:"border-amber-500/20",
    features:[
      {t:"Unlimited Branches",tM:"ဆိုင်ခွဲ အကန့်မသတ်",d:"Create and manage multiple store branches.",dM:"ဆိုင်ခွဲများ အကန့်မသတ် ဖန်တီးနိုင်"},
      {t:"Stock Transfers",tM:"ဆိုင်ခွဲချင်း Stock လွှဲ",d:"Transfer stock between branches with full log.",dM:"ဆိုင်ခွဲတစ်ခုမှ တစ်ခုသို့ Stock လွှဲပြောင်းနိုင်"},
      {t:"Staff Accounts",tM:"ဝန်ထမ်း Account",d:"Create staff accounts assigned to specific branches.",dM:"ဝန်ထမ်း Account ဖန်တီးပြီး ဆိုင်ခွဲ သတ်မှတ်ပေးနိုင်"},
      {t:"Role-Based Access",tM:"အခွင့်အာဏာ ခွဲ",d:"Staff sees only their branch. Owner sees all.",dM:"Staff — ကိုယ်ဆိုင်ခွဲသာ / Owner — အားလုံး",badge:"Security"},
    ]
  },
  { id:"customers", icon: Users, title:"Customers + Staff", titleMy:"ဝယ်သူ + ဝန်ထမ်း",
    color:"text-rose-400", bg:"bg-rose-500/10", border:"border-rose-500/20",
    features:[
      {t:"Customer Directory",tM:"ဝယ်သူ လိပ်စာစာအုပ်",d:"Name, phone, debt balance, purchase history.",dM:"ဝယ်သူ အမည်၊ ဖုန်း၊ အကြွေးကျန်၊ ဝယ်ယူမှတ်တမ်း"},
      {t:"COD Tracking",tM:"COD မှတ်တမ်း",d:"Track Cash-on-Delivery: Pending to Delivered or Cancelled.",dM:"COD Status: Pending → Delivered / Cancelled"},
      {t:"Staff Shifts",tM:"ဝန်ထမ်း အလုပ်ချိန်",d:"Clock In/Out, hours worked, drawer float.",dM:"Clock-In/Out မှတ်တမ်း၊ နာရီတွက်ချက်မှု"},
      {t:"Supplier Management",tM:"ကုန်သည် စီမံ",d:"Manage supplier contact info.",dM:"ကုန်သည်/ဖြန့်ဖြူးသူ စာရင်း စီမံနိုင်"},
    ]
  },
  { id:"ui", icon: Palette, title:"UI + Customization", titleMy:"အသွင်အပြင် + ပြင်ဆင်မှု",
    color:"text-indigo-400", bg:"bg-indigo-500/10", border:"border-indigo-500/20",
    features:[
      {t:"12 Themes (Default Clean Slate)",tM:"Theme ၁၂ မျိုး (Default Clean Slate)",d:"Clean Slate Minimalist, Clean Studio Light, Liquid Glass x3, OLED Dark x5, Monochrome.",dM:"Clean Slate (Default), Clean Light, Liquid Glass x3, OLED Dark x5, Monochrome",badge:"12 Themes"},
      {t:"Bilingual EN / MY",tM:"မြန်မာ / English",d:"Switch UI language with one click.",dM:"EN / MY တစ်ချက်နှိပ်ရုံ ဘာသာပြောင်း"},
      {t:"Mobile Responsive",tM:"ဖုန်း / Tablet / PC",d:"Works on all screen sizes. Bottom nav on mobile.",dM:"ဘယ် Screen Size မဆို — Mobile မှာ Bottom Nav"},
      {t:"Settings Page",tM:"ဆက်တင်",d:"Store name, phone, address, receipt footer, theme.",dM:"ဆိုင်အချက်အလက် + Theme — တစ်နေရာတည်း ပြင်ဆင်"},
      {t:"PWA & 100% Offline Mode",tM:"PWA & Offline အပြည့်အဝသုံးနိုင်",d:"Install as native app on Android, iOS & Windows. Full offline caching & auto-sync.",dM:"ဖုန်းနှင့် Desktop တွင် App ကဲ့သို့ Install လုပ်ပြီး အင်တာနက်မရှိဘဲ သုံးနိုင်",badge:"Offline"},
      {t:"Stock Push Notifications",tM:"Stock နည်းပါး သတိပေးချက်များ",d:"Browser and OS push notifications when products reach low stock threshold.",dM:"ပစ္စည်းလက်ကျန် နည်းပါးလျှင် Browser သတိပေးချက် တက်ရောက်",badge:"Push"},
    ]
  },
];

export default function FeatureGuide({ theme, lang }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isLight = !!theme.isLight;
  const total = CATS.reduce((s, c) => s + c.features.length, 0);

  const cls = {
    card: isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03]",
    row: isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]",
    feat: isLight ? "bg-slate-50 hover:bg-slate-100" : "bg-white/[0.04] hover:bg-white/[0.07]",
    div: isLight ? "border-slate-100" : "border-white/[0.05]",
    h1: isLight ? "text-slate-900" : "text-white",
    sub: isLight ? "text-slate-500" : "text-slate-400",
    title: isLight ? "text-slate-800" : "text-white",
    count: isLight ? "text-slate-400" : "text-slate-500",
    desc: isLight ? "text-slate-500" : "text-slate-400",
    chev: isLight ? "text-slate-400" : "text-slate-600",
    foot: isLight ? "text-slate-400" : "text-slate-600",
    pill: isLight ? "bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20",
    cnt: isLight ? "bg-slate-200 text-slate-500" : "bg-white/10 text-slate-500",
    badge: isLight ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className={"inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black mb-2 " + cls.badge}>
          <BookOpen size={13} />
          {lang === "my" ? "Feature လမ်းညွှန်" : "Feature Guide"}
        </div>
        <h1 className={"text-2xl sm:text-3xl font-black tracking-tight " + cls.h1}>
          {lang === "my" ? "Swift POS — ပါဝင်သည့် Features အားလုံး" : "Everything in Swift POS"}
        </h1>
        <p className={"text-sm " + cls.sub}>
          {lang === "my"
            ? "Feature " + total + " ခု — ကဏ္ဍ " + CATS.length + " ခု"
            : total + " features across " + CATS.length + " categories"}
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setOpenId(null)}
          className={"px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer " +
            (openId === null ? "bg-neutral-900 border-neutral-900 text-white" : cls.pill)}
        >
          {lang === "my" ? "အားလုံး" : "All"}
        </button>
        {CATS.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setOpenId(openId === c.id ? null : c.id)}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer " +
                (openId === c.id ? c.bg + " " + c.border + " " + c.color : cls.pill)}>
              <Icon size={12} />
              <span className="hidden sm:inline">{lang === "my" ? c.titleMy : c.title}</span>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-black " + cls.cnt}>{c.features.length}</span>
            </button>
          );
        })}
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {CATS.filter(c => openId === null || c.id === openId).map(cat => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className={"rounded-2xl border overflow-hidden " + cls.card + " " + (isLight ? "" : cat.border)}>
              <button
                onClick={() => setOpenId(openId === cat.id ? null : cat.id)}
                className={"w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left transition " + cls.row}
              >
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + cat.bg + " border " + cat.border}>
                    <Icon size={20} className={cat.color} />
                  </div>
                  <div>
                    <div className={"font-black text-sm " + cls.title}>{lang === "my" ? cat.titleMy : cat.title}</div>
                    <div className={"text-[10px] font-bold " + cls.count}>{cat.features.length} features</div>
                  </div>
                </div>
                <ChevronDown size={16} className={"transition-transform duration-200 " + (openId === cat.id ? "rotate-180 " : "") + cls.chev} />
              </button>
              {(openId === cat.id || openId === null) && (
                <div className={"px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t " + cls.div}>
                  {cat.features.map((f, i) => (
                    <div key={i} className={"flex gap-3 p-3 rounded-xl transition " + cls.feat}>
                      <div className={"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 " + cat.bg + " " + cat.border + " border"}>
                        <Icon size={14} className={cat.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={"text-xs font-black " + cls.title}>{lang === "my" ? f.tM : f.t}</span>
                          {f.badge && (
                            <span className={"text-[9px] px-1.5 py-0.5 rounded-full font-black border " + cat.bg + " " + cat.color + " " + cat.border}>
                              {f.badge}
                            </span>
                          )}
                        </div>
                        <p className={"text-[11px] mt-0.5 leading-relaxed " + cls.desc}>
                          {lang === "my" ? f.dM : f.d}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={"text-center text-[11px] py-4 flex items-center justify-center gap-1.5 " + cls.foot}>
        <Sparkles size={12} />
        <span>Swift POS — {lang === "my" ? "Feature တွေ ဆက်ထည့်နေဆဲ" : "Continuously improving"}</span>
      </div>
    </div>
  );
}
