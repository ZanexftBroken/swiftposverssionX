import React, { useState } from "react";
import { 
  FileText, Shield, Lock, Scale, Database, CheckCircle2, 
  X, Check, AlertCircle, RefreshCw, Smartphone
} from "lucide-react";
import type { Language } from "../lib/translations";
import type { ThemeConfig } from "../lib/theme";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  theme?: ThemeConfig;
}

export default function TermsModal({
  isOpen,
  onClose,
  lang = "my",
  theme
}: TermsModalProps) {
  const [activeSection, setActiveSection] = useState<string>("all");

  if (!isOpen) return null;

  const sections = [
    {
      id: "license",
      icon: Scale,
      titleEn: "1. Software License & Usage Terms",
      titleMy: "၁။ ဆော့ဖ်ဝဲလ် အသုံးပြုခွင့် လိုင်စင်နှင့် စည်းကမ်းချက်များ",
      contentEn: [
        "Swift POS grants you a non-exclusive, revocable license to operate and manage your business point-of-sale activities, inventory, and staff.",
        "Reverse engineering, unauthorized redistribution, or malicious alteration of core security protocols is strictly prohibited.",
        "The software is designed for retail, wholesale, pharmacy, food & beverage, and general merchandising businesses operating in Myanmar and internationally."
      ],
      contentMy: [
        "Swift POS သည် သင့်လုပ်ငန်း၏ အရောင်းကောင်တာ (POS)၊ ကုန်ပစ္စည်းစတော့နှင့် ဝန်ထမ်းစီမံခန့်ခွဲမှုများကို စနစ်တကျ လုပ်ဆောင်နိုင်ရန် တရားဝင် အသုံးပြုခွင့် ပေးအပ်ထားပါသည်။",
        "စနစ်၏ လုံခြုံရေးဆိုင်ရာ ကုဒ်များနှင့် ဒေတာဘေ့စ်ကို ခွင့်ပြုချက်မရှိဘဲ ဖျက်ဆီးခြင်း၊ ပြုပြင်ပြောင်းလဲခြင်း သို့မဟုတ် ခိုးယူအသုံးပြုခြင်းကို တားမြစ်ထားပါသည်။",
        "လက်လီ၊ လက်ကား၊ ဆေးဆိုင်၊ စားသောက်ကုန်နှင့် အထွေထွေအရောင်းဆိုင်များတွင် စနစ်တကျ အသုံးပြုရန် ရည်ရွယ်ထုတ်လုပ်ထားပါသည်။"
      ]
    },
    {
      id: "data-privacy",
      icon: Database,
      titleEn: "2. Data Privacy & Offline Storage Policy",
      titleMy: "၂။ ဒေတာလုံခြုံမှုနှင့် အော့ဖ်လိုင်း သိုလှောင်မှုဆိုင်ရာ မူဝါဒ",
      contentEn: [
        "Your business data (products, prices, customer directory, sales history, and profits) belongs solely to your organization.",
        "Offline-First Architecture: In the absence of an internet connection, all transaction records are encrypted and stored locally on your device (IndexedDB/CacheStorage).",
        "Cloud Auto-Sync: Once internet connectivity is re-established, local records automatically synchronize with secure cloud servers (Firebase Cloud Storage & Firestore).",
        "We do not sell, rent, or disclose your financial records or customer lists to any third parties."
      ],
      contentMy: [
        "သင့်လုပ်ငန်း၏ ကုန်ပစ္စည်းစာရင်း၊ ဈေးနှုန်းများ၊ ဝယ်ယူသူအချက်အလက်၊ အရောင်းဘောက်ချာများနှင့် အမြတ်ငွေစာရင်းများသည် သင့်လုပ်ငန်း၏ ကိုယ်ပိုင်သီးသန့် ပိုင်ဆိုင်မှုသာ ဖြစ်ပါသည်။",
        "အော့ဖ်လိုင်းစနစ် (Offline-First): အင်တာနက်မရှိချိန်တွင် ရောင်းချသမျှ စာရင်းများအားလုံးကို သင့်ဖုန်း/ကွန်ပျူတာ၏ Local Storage တွင် စနစ်တကျ လုံခြုံစွာ သိမ်းဆည်းပေးထားပါသည်။",
        "Cloud Auto-Sync: အင်တာနက် ပြန်လည်ရရှိသည်နှင့် တပြိုင်နက် သိမ်းဆည်းထားသော အရောင်းဒေတာများကို Google Firebase Cloud Database သို့ အလိုအလျောက် ပို့ဆောင်သိမ်းဆည်းပေးပါသည်။",
        "သင့်လုပ်ငန်း၏ ဘဏ္ဍာရေးစာရင်းများနှင့် ဝယ်ယူသူအချက်အလက်များကို မည်သည့် ပြင်ပအဖွဲ့အစည်းသို့မှ လွှဲပြောင်းရောင်းချခြင်း လုံးဝ မပြုလုပ်ပါ။"
      ]
    },
    {
      id: "accounts",
      icon: Shield,
      titleEn: "3. Account Security & Role-Based Access",
      titleMy: "၃။ အကောင့်လုံခြုံရေးနှင့် အခွင့်အာဏာ ခွဲဝေမှု တာဝန်ယူချက်",
      contentEn: [
        "Store Owner (Owner) has full administrative privileges, including profit/loss inspection, branch creation, inventory deletion, and payroll management.",
        "Staff Cashiers (Staff) are restricted strictly to their assigned branch point of sale, with restricted access to master financial reports.",
        "Store administrators are solely responsible for safeguarding master passwords and managing branch cashier access credentials."
      ],
      contentMy: [
        "ဆိုင်ရှင်အကောင့် (Store Owner) သည် အမြတ်/အရှုံးစာရင်းများ ကြည့်ရှုခြင်း၊ ဆိုင်ခွဲများ ဖွင့်လှစ်ခြင်း၊ စတော့စာရင်းဖျက်ခြင်းနှင့် ဝန်ထမ်းလစာစာရင်းများကို အပြည့်အဝ စီမံခွင့်ရှိပါသည်။",
        "ငွေကိုင်ဝန်ထမ်းများ (Staff Cashiers) သည် သက်ဆိုင်ရာ ဆိုင်ခွဲ၏ ငွေကောင်တာ အရောင်းစာရင်းကိုသာ ကိုင်တွယ်ခွင့်ရှိပြီး ဆိုင်၏ အဓိကဘဏ္ဍာရေး အချက်အလက်များကို ကြည့်ရှုခွင့် ကန့်သတ်ထားပါသည်။",
        "အကောင့်စကားဝှက်များကို လုံခြုံစွာ ထိန်းသိမ်းရန်နှင့် ဝန်ထမ်းအကောင့်များ စီမံခန့်ခွဲရန်မှာ ဆိုင်ပိုင်ရှင်၏ အဓိကတာဝန်ဖြစ်ပါသည်။"
      ]
    },
    {
      id: "transactions",
      icon: Lock,
      titleEn: "4. Financial & Transaction Integrity",
      titleMy: "၄။ အရောင်းဘောက်ချာနှင့် ငွေလွှဲပြေစာ တိကျမှုဆိုင်ရာ မူဝါဒ",
      contentEn: [
        "Transaction references for digital payments (KPay, WavePay, AYA Pay, Credit/Debit cards) are recorded alongside each voucher.",
        "Cash balance reconciliation (Z-Report / Daily Register Close) must be validated at the conclusion of each work shift.",
        "Swift POS provides automated calculation tools; final fiscal auditing and tax compliance remain the responsibility of the registered business owner."
      ],
      contentMy: [
        "ဒစ်ဂျစ်တယ်ငွေပေးချေမှုများ (KPay၊ WavePay၊ AYA Pay၊ ဘဏ်ကတ်များ) အတွက် Transaction Reference နံပါတ်များကို ဘောက်ချာတိုင်းတွင် စနစ်တကျ မှတ်တမ်းတင်ပေးထားပါသည်။",
        "နေ့စဉ် အရောင်းသိမ်းချိန်တွင် ငွေအံဆွဲငွေသားနှင့် ဒစ်ဂျစ်တယ်စာရင်း တိကျစေရန် Z-Report (နေ့ချုပ်စာရင်း) ကို ရှင်းတမ်းထုတ်၍ စစ်ဆေးအတည်ပြုရပါမည်။",
        "Swift POS သည် စာရင်းတိကျစွာ တွက်ချက်နိုင်ရန် ကူညီပေးသော စမတ်စနစ်ဖြစ်ပြီး အခွန်နှင့် တရားဝင် ငွေစာရင်းစစ်ဆေးမှုများမှာ သက်ဆိုင်ရာ ဆိုင်ပိုင်ရှင်၏ တာဝန်ဖြစ်ပါသည်။"
      ]
    },
    {
      id: "updates",
      icon: RefreshCw,
      titleEn: "5. Updates, Support & Service Availability",
      titleMy: "၅။ စနစ်အဆင့်မြှင့်တင်ခြင်းနှင့် ဝန်ဆောင်မှုဆိုင်ရာ ကတိကဝတ်",
      contentEn: [
        "Continuous performance improvements, security patches, and localized feature enhancements will be rolled out automatically via cloud updates.",
        "Offline functionality guarantees operational continuity even during power outages or internet service interruptions."
      ],
      contentMy: [
        "စနစ် ပိုမိုမြန်ဆန်သွက်လက်စေရန်၊ လုံခြုံရေး ပိုမိုအားကောင်းစေရန်နှင့် မြန်မာလုပ်ငန်းရှင်များအတွက် လိုအပ်သော Feature အသစ်များကို Cloud မှတဆင့် အလိုအလျောက် Update ပြုလုပ်ပေးသွားပါမည်။",
        "မီးပျက်ခြင်း သို့မဟုတ် အင်တာနက်လိုင်း ပြတ်တောက်ချိန်များတွင်လည်း အရောင်းအဝယ် လုံးဝ မရပ်တန့်စေဘဲ အော့ဖ်လိုင်း ဆက်လက်ရောင်းချနိုင်စေရန် အာမခံပါသည်။"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121214] border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display flex items-center gap-2">
                {lang === "my" ? "အသုံးပြုမှု စည်းကမ်းချက်များနှင့် မူဝါဒများ" : "Terms & Conditions & Privacy"}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {lang === "my" ? "Swift POS လုပ်ငန်းသုံး ဆော့ဖ်ဝဲလ် အသုံးပြုသူ သဘောတူညီချက်" : "Swift POS Enterprise User Agreement & Data Policy"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-3 px-5 border-b border-neutral-800 bg-[#121214] overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveSection("all")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              activeSection === "all"
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            {lang === "my" ? "အားလုံး ဖတ်ရှုရန်" : "All Sections"}
          </button>
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeSection === s.id
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                <Icon size={12} />
                <span>{lang === "my" ? s.titleMy.split("။")[0] : s.titleEn.split(".")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-neutral-300 leading-relaxed no-scrollbar">
          
          {/* Professional Trust Badge Banner */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
            <Shield size={20} className="text-white shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">
                {lang === "my" ? "လုပ်ငန်းရှင်များအတွက် ယုံကြည်စိတ်ချရမှု အာမခံချက်" : "Enterprise Trust & Data Integrity"}
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {lang === "my"
                  ? "Swift POS သည် မြန်မာစီးပွားရေးလုပ်ငန်းရှင်များ အဆင်ပြေစေရန်အတွက် ဒေတာလုံခြုံမှု၊ အော့ဖ်လိုင်းတိကျမှုနှင့် ပွင့်လင်းမြင်သာမှုကို အပြည့်အဝ ဦးစားပေး တည်ဆောက်ထားပါသည်။"
                  : "Swift POS is engineered with strict offline-first guarantees, zero data sales, and enterprise-grade role-based access control."}
              </p>
            </div>
          </div>

          {/* Section Items */}
          {sections
            .filter((s) => activeSection === "all" || s.id === activeSection)
            .map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="p-4 sm:p-5 rounded-2xl bg-[#18181b] border border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-neutral-800 pb-2">
                    <Icon size={16} className="text-neutral-400" />
                    <span className="font-display">{lang === "my" ? s.titleMy : s.titleEn}</span>
                  </div>
                  <ul className="space-y-2 text-neutral-300 text-xs sm:text-[13px] leading-relaxed">
                    {(lang === "my" ? s.contentMy : s.contentEn).map((para, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check size={13} className="text-neutral-400 shrink-0 mt-1" />
                        <span>{para}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-between shrink-0 bg-[#161618]">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <CheckCircle2 size={13} className="text-white" />
            <span>{lang === "my" ? "ဗားရှင်း ၂.၀.၀ — မူပိုင်ခွင့် ရယူပြီး" : "Version 2.0.0 — All Rights Reserved"}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {lang === "my" ? "သဘောတူလက်ခံပါသည်" : "I Understand & Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
