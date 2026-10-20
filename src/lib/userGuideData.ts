export interface GuideChapter {
  id: string;
  icon: string;
  titleEn: string;
  titleMy: string;
  descEn: string;
  descMy: string;
  stepsEn: string[];
  stepsMy: string[];
  tipsEn?: string[];
  tipsMy?: string[];
}

export const USER_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "pos-checkout",
    icon: "pos-checkout",
    titleEn: "POS Sales & Checkout",
    titleMy: "POS အရောင်းနှင့် ဘောက်ချာထုတ်နည်း",
    descEn: "How to search products, scan barcodes, apply discounts, and complete sales vouchers.",
    descMy: "ကုန်ပစ္စည်းရှာဖွေခြင်း၊ Barcode စကင်ဖတ်ခြင်း၊ လျှော့စျေးနှင့် ဘောက်ချာဖြတ်ခြင်း အဆင့်ဆင့်။",
    stepsEn: [
      "Press [F1] or click the search box to find products by Name, SKU, or Barcode.",
      "Press [F2] to open the high-speed Camera Barcode Scanner for direct scanning.",
      "Click product cards to add them to your cart. Click [+] or [-] to adjust quantities.",
      "Press [F4] or click 'Proceed to Checkout' to open payment options.",
      "Select payment method: Cash, KPay, WavePay, CB Pay, AYA Pay, Credit Card, or COD.",
      "Enter Amount Tendered to calculate Change Due automatically, or apply discount / coupon codes.",
      "Click 'Complete & Print Receipt' to finalize the sale and print 80mm/58mm thermal slip."
    ],
    stepsMy: [
      "[F1] ခလုတ် သို့မဟုတ် ရှာဖွေရေးအကွက်ကို နှိပ်ပြီး ကုန်ပစ္စည်းအမည်၊ SKU သို့မဟုတ် Barcode ဖြင့် ရှာပါ။",
      "[F2] ခလုတ်ကို နှိပ်ပြီး ကင်မရာ Barcode စကင်နာဖွင့်ကာ ကုန်ပစ္စည်းကုဒ်များကို တိုက်ရိုက်ဖတ်ပါ။",
      "ကုန်ပစ္စည်းများကို နှိပ်၍ Cart ထဲသို့ ထည့်ပါ။ [+] သို့မဟုတ် [-] နှိပ်ပြီး အရေအတွက် ပြင်ဆင်ပါ။",
      "[F4] သို့မဟုတ် 'Proceed to Checkout' ကို နှိပ်ပြီး ငွေရှင်းရန် မျက်နှာပြင်သို့ သွားပါ။",
      "ငွေပေးချေမှုပုံစံ ရွေးချယ်ပါ - Cash, KPay, WavePay, CB Pay, AYA Pay, Credit Card, သို့မဟုတ် COD။",
      "ပေးငွေ (Amount Tendered) ရိုက်ထည့်ပါက ပြန်အမ်းငွေ (Change Due) အလိုအလျောက် တွက်ချက်ပေးပါသည်။",
      "'Complete & Print Receipt' ကို နှိပ်ပြီး အရောင်းစာရင်းပိတ်ကာ ဘောက်ချာ ထုတ်ယူပါ။"
    ],
    tipsEn: [
      "Press [F9] anytime to hold the current cart and serve another customer.",
      "Press [Escape] to quickly close modals or return to the sales screen."
    ],
    tipsMy: [
      "[F9] နှိပ်၍ လက်ရှိဘောက်ချာကို ခေတ္တဆိုင်းငံ့ (Hold Order) ထားပြီး အခြားဖောက်သည်ကို ဦးစွာရောင်းချနိုင်ပါသည်။",
      "[Escape] ခလုတ်နှိပ်၍ Modal များ သို့မဟုတ် Checkout မျက်နှာပြင်ကို အမြန်ပိတ်နိုင်ပါသည်။"
    ]
  },
  {
    id: "z-report",
    icon: "z-report",
    titleEn: "Z-Report (Daily Register Close)",
    titleMy: "Z-Report (နေ့ချုပ်စာရင်း) ထုတ်နည်း",
    descEn: "Close the register at the end of the day, review financial totals, and print thermal Z-Reports.",
    descMy: "ဆိုင်ပိတ်ချိန် နေ့စဉ် အရောင်းဝင်ငွေ၊ ငွေသားနှင့် Digital ခွဲခြားမှု စစ်ဆေးခြင်းနှင့် ပရင့်ထုတ်ခြင်း။",
    stepsEn: [
      "Go to Dashboard and click 'Z-Report' in the Quick Operations grid.",
      "Review the daily totals: Gross Sales, Item Discounts, Taxes, Net Revenue, and Voucher Count.",
      "Check Payment Breakdown: Cash In Drawer vs Digital Wallets (KPay, WavePay, CB Pay, etc.).",
      "Click 'Print Z-Report' to output a formatted 80mm register closeout audit receipt."
    ],
    stepsMy: [
      "Dashboard သို့သွားပြီး Quick Operations အကွက်ထဲမှ 'Z-Report' ကို နှိပ်ပါ။",
      "ယနေ့အတွက် ရောင်းအားစုစုပေါင်း၊ လျှော့စျေး၊ အခွန်၊ အသားတင်ဝင်ငွေနှင့် ဘောက်ချာအရေအတွက်ကို စစ်ဆေးပါ။",
      "ငွေပေးချေမှုအလိုက် ခွဲခြားချက်ကို ကြည့်ပါ - အံဆွဲထဲမှ ငွေသားနှင့် Digital Wallet (KPay, WavePay စသည်)။",
      "'Print Z-Report' ကို နှိပ်ပြီး 80mm စက္ကူအရွယ်အစားဖြင့် နေ့ချုပ်စာရင်းကို ပရင့်ထုတ်ယူပါ။"
    ],
    tipsEn: [
      "Always generate the Z-Report at the end of every business shift or before closing the store."
    ],
    tipsMy: [
      "နေ့စဉ် ဆိုင်မပိတ်မီ သို့မဟုတ် Shift မလဲမီ Z-Report ကို မပျက်မကွက် ထုတ်ယူစစ်ဆေးသင့်ပါသည်။"
    ]
  },
  {
    id: "google-sheets",
    icon: "google-sheets",
    titleEn: "Google Sheets Export & Auto-Sync",
    titleMy: "Google Sheets ထဲ စာရင်းများ ပို့ခြင်း & Auto-Sync",
    descEn: "Export sales, inventory, expenses, purchases, and payroll to Google Sheets with 1-click sync.",
    descMy: "အရောင်း၊ စတော့၊ အသုံးစရိတ်၊ အဝယ်စာရင်းနှင့် လစာများကို Google Sheet ထဲသို့ တိုက်ရိုက် Auto-Sync ပို့နည်း။",
    stepsEn: [
      "Click 'Google Sheets' from the Quick Operations grid or from the Reports view.",
      "Choose which lists you want to export: Sales, Inventory, Expenses, Purchases, Payroll, or ALL.",
      "Option 1 (Auto-Sync Webhook): Paste your Google Apps Script Web App URL and click 'Sync Now' - rows are directly inserted into separate sheets!",
      "Option 2 (1-Click Copy): Click 'Copy for Google Sheets', open sheets.google.com, and press [Ctrl + V].",
      "Option 3 (CSV Download): Click 'Download CSV' for a UTF-8 BOM formatted spreadsheet file."
    ],
    stepsMy: [
      "Dashboard ရှိ Quick Operations မှ 'Google Sheets' သို့မဟုတ် Reports စာမျက်နှာမှ ခလုတ်ကို နှိပ်ပါ။",
      "ပို့လိုသည့် စာရင်းအမျိုးအစား ရွေးချယ်ပါ - အရောင်း၊ ကုန်ပစ္စည်းစတော့၊ အသုံးစရိတ်၊ အဝယ်စာရင်း၊ လစာ သို့မဟုတ် အားလုံး။",
      "နည်းလမ်း ၁ (Auto-Sync): Google Apps Script Web App URL ထည့်ပြီး 'Sync Now' နှိပ်ပါက Sheet ထဲသို့ တိုက်ရိုက် auto ရောက်သွားပါမည်။",
      "နည်းလမ်း ၂ (1-Click Copy): 'Copy for Google Sheets' ကို နှိပ်ပြီး sheets.google.com ဖွင့်ကာ [Ctrl + V] နှိပ်၍ paste ချပါ။",
      "နည်းလမ်း ၃ (CSV ဒေါင်းလုဒ်): 'Download CSV' နှိပ်၍ Excel နှင့် Google Sheets သုံးနိုင်သော ဖိုင်ကို ရယူပါ။"
    ],
    tipsEn: [
      "Do you need Google Sheets API? No complex GCP API key is required! Google Apps Script Web App gives you free, direct auto-sync in under 1 minute."
    ],
    tipsMy: [
      "Google Sheets API လိုမလား? ရှုပ်ထွေးသော Google Cloud Console API Key မလိုဘဲ Google Apps Script Web App ဖြင့် အခမဲ့ ၁ မိနစ်အတွင်း တိုက်ရိုက် Auto-Sync ချိတ်ဆက်နိုင်ပါသည်။"
    ]
  },
  {
    id: "inventory-barcode",
    icon: "inventory-barcode",
    titleEn: "Inventory, Barcode & Stock Adjustment",
    titleMy: "ကုန်ပစ္စည်း၊ စတော့နှင့် Barcode စီမံခန့်ခွဲခြင်း",
    descEn: "Add items, define barcodes, track low stock, and manage stock adjustment reasons.",
    descMy: "ကုန်ပစ္စည်းအသစ်ထည့်ခြင်း၊ Barcode ကုဒ်သတ်မှတ်ခြင်းနှင့် စတော့အဝင်အထွက် ချိန်ညှိနည်း။",
    stepsEn: [
      "Click 'Products' from the navigation bar to manage your inventory catalog.",
      "Click '+ Add Product' to record product name, category, cost price, retail price, and stock quantity.",
      "Assign or scan a Barcode and SKU. Products with barcodes can be scanned directly at checkout using [F2].",
      "Set a 'Low Stock Threshold' (e.g., 5 items) to receive automated low-stock warning alerts.",
      "To adjust stock, open 'Stock Adjustment' to record reasons: Damaged, Expired, Recount, or Transfer."
    ],
    stepsMy: [
      "Navigation bar ရှိ 'Items' (ကုန်ပစ္စည်းများ) ကို နှိပ်ပြီး ကုန်ပစ္စည်းစာရင်းသို့ သွားပါ။",
      "'+ Add Product' ကို နှိပ်ပြီး ပစ္စည်းအမည်၊ အမျိုးအစား၊ အရင်းစျေး၊ ရောင်းစျေးနှင့် လက်ကျန်အရေအတွက် ထည့်ပါ။",
      "Barcode နှင့် SKU သတ်မှတ်ပါ။ Barcode ထည့်ထားပါက အရောင်းမျက်နှာပြင်တွင် [F2] ကင်မရာဖြင့် တိုက်ရိုက်ဖတ်နိုင်ပါသည်။",
      "လက်ကျန်နည်း အချက်ပေးမှုအတွက် 'Low Stock Threshold' (ဥပမာ - ၅ ခု) သတ်မှတ်ထားပါ။",
      "ပျက်စီးခြင်း၊ သက်တမ်းကုန်ခြင်း သို့မဟုတ် ပြန်လည်ရေတွက်မှုများအတွက် 'Stock Adjustment' တွင် မှတ်တမ်းတင်ပါ။"
    ],
    tipsEn: [
      "Products with variants (Sizes/Colors) can be created with distinct SKUs and individual stock counts."
    ],
    tipsMy: [
      "ဆိုဒ်/အရောင် ကွဲပြားသော ပစ္စည်းများကို Variants စနစ်ဖြင့် သီးခြား SKU နှင့် စတော့အရေအတွက်များ သတ်မှတ်နိုင်ပါသည်။"
    ]
  },
  {
    id: "offline-pwa",
    icon: "offline-pwa",
    titleEn: "Offline Mode & Progressive Web App (PWA)",
    titleMy: "Offline အသုံးပြုပုံနှင့် PWA App ထည့်သွင်းနည်း",
    descEn: "Use Swift POS without internet connection, automatic caching, and installation on Desktop/Mobile.",
    descMy: "အင်တာနက်လိုင်းမရှိလည်း ချောမွေ့စွာ ရောင်းချနိုင်ခြင်းနှင့် ဖုန်း/ကွန်ပျူတာတွင် App အဖြစ် ထည့်သွင်းပုံ။",
    stepsEn: [
      "Swift POS is engineered with an Offline-First Service Worker cache.",
      "If your internet drops, an orange/rose banner appears: 'Offline Mode Active'.",
      "You can continue making sales, searching cached products, and printing receipts seamlessly.",
      "When internet connectivity restores, the system automatically synchronizes your data with the cloud.",
      "To install Swift POS as a standalone desktop/mobile app: Click the 'Install App' icon in Chrome/Edge URL bar or 'Add to Home Screen' in Safari."
    ],
    stepsMy: [
      "Swift POS သည် အင်တာနက်လိုင်းမရှိလည်း အလုပ်လုပ်နိုင်သော Offline-First စနစ်ဖြင့် တည်ဆောက်ထားပါသည်။",
      "အင်တာနက် ပြတ်တောက်သွားပါက အပေါ်တွင် 'Offline Mode Active' လိမ္မော်ရောင်ဘား ပေါ်လာပါမည်။",
      "လိုင်းမရှိသော်လည်း ကုန်ပစ္စည်းများ ရှာဖွေရောင်းချခြင်း၊ ဘောက်ချာဖြတ်ခြင်းများကို ပုံမှန်အတိုင်း ဆက်လက်သုံးနိုင်ပါသည်။",
      "အင်တာနက် ပြန်လည်ရရှိသည်နှင့် တပြိုင်နက် Cloud နှင့် အလိုအလျောက် Sync ပြန်လည်ပြုလုပ်ပေးပါသည်။",
      "ကွန်ပျူတာ သို့မဟုတ် ဖုန်းတွင် App အဖြစ် သွင်းလိုပါက Browser ၏ URL bar ရှိ 'Install App' (သို့မဟုတ် Add to Home Screen) ကို နှိပ်ပါ။"
    ],
    tipsEn: [
      "Keep the browser cache clear only when necessary; the offline database preserves your operational continuity."
    ],
    tipsMy: [
      "အော့ဖ်လိုင်းအသုံးပြုမှု စွမ်းဆောင်ရည်အတွက် Browser Cache ကို မလိုအပ်ဘဲ ဖျက်ပစ်ခြင်း မပြုလုပ်သင့်ပါ။"
    ]
  },
  {
    id: "branches-transfers",
    icon: "branches-transfers",
    titleEn: "Multi-Branch & Stock Transfers",
    titleMy: "ဆိုင်ခွဲများ (Multi-Branch) နှင့် ပစ္စည်းလွှဲပြောင်းခြင်း",
    descEn: "Manage multiple retail branches, assign staff, and record stock transfers between locations.",
    descMy: "ဆိုင်ခွဲအများအပြား ဖွင့်လှစ်စီမံခြင်း၊ ဝန်ထမ်းခန့်အပ်ခြင်းနှင့် ဆိုင်ခွဲအချင်းချင်း စတော့လွှဲပြောင်းနည်း။",
    stepsEn: [
      "Go to 'Stores' / 'Branches' from the navigation bar.",
      "Click '+ Create New Branch' to set up a new branch with branch code and manager details.",
      "Switch active branch filter on top of Dashboard to view sales and reports for each specific branch.",
      "Go to 'Stock Transfer' tab to transfer inventory from one branch to another.",
      "Select source branch, target branch, product name, and quantity transferred."
    ],
    stepsMy: [
      "Navigation bar မှ 'Stores' (ဆိုင်ခွဲများ) သို့ သွားပါ။",
      "'+ Create New Branch' ကို နှိပ်၍ ဆိုင်ခွဲကုဒ်၊ ဆိုင်ခွဲအမည်နှင့် မန်နေဂျာအချက်အလက်များဖြင့် ဆိုင်ခွဲအသစ် ထည့်ပါ။",
      "Dashboard အပေါ်ရှိ Branch Filter မှ သက်ဆိုင်ရာ ဆိုင်ခွဲကို ရွေးချယ်၍ ရောင်းအားနှင့် အစီရင်ခံစာများ ကြည့်နိုင်ပါသည်။",
      "'Stock Transfer' အကွက်သို့ သွားပြီး ဆိုင်ခွဲတစ်ခုမှ အခြားဆိုင်ခွဲတစ်ခုသို့ ပစ္စည်းလွှဲပြောင်းနိုင်ပါသည်။",
      "ထုတ်ပေးမည့်ဆိုင်၊ လက်ခံမည့်ဆိုင်၊ ပစ္စည်းအမည်နှင့် အရေအတွက် ရွေးချယ်ပြီး အတည်ပြုပါ။"
    ],
    tipsEn: [
      "Main Branch inventory is shared across centralized catalogs with branch-specific quantities."
    ],
    tipsMy: [
      "ပင်မဆိုင် (Main Branch) မှနေ၍ ဆိုင်ခွဲအားလုံး၏ လက်ကျန်နှင့် အရောင်းစာရင်းများကို ဗဟိုမှ အချိန်နှင့်တပြေးညီ ကြည့်ရှုနိုင်ပါသည်။"
    ]
  },
  {
    id: "financials-pnl",
    icon: "financials-pnl",
    titleEn: "Expenses, Payroll & Net Profit (P&L)",
    titleMy: "အသုံးစရိတ်၊ ဝန်ထမ်းလစာနှင့် အမြတ်ငွေ (P&L) စစ်ဆေးခြင်း",
    descEn: "Track operational expenses, record employee salaries, and monitor gross & net profit margins.",
    descMy: "ဆိုင်အသုံးစရိတ်များ၊ ဝန်ထမ်းလစာစာရင်းနှင့် စုစုပေါင်းအသားတင်အမြတ် (Net Profit) စစ်ဆေးနည်း။",
    stepsEn: [
      "From Dashboard, open 'Expenses' to log daily shop expenses (utilities, packaging, rent, meals).",
      "Open 'Payroll' to record monthly salary disbursements, bonuses, and deductions for staff.",
      "Go to 'Reports' tab to view real-time Profit & Loss statement:",
      "Gross Profit = Sales Revenue - Cost of Goods Sold (COGS).",
      "Net Profit = Gross Profit - Operating Expenses - Payroll.",
      "View 30-Day Revenue Trend line chart and Payment Method distribution pie chart."
    ],
    stepsMy: [
      "Dashboard မှ 'Expenses' သို့ သွားပြီး ဆိုင်သုံးစရိတ်များ (မီးဖိုး၊ ရေဖိုး၊ အိတ်ဖိုး၊ ဆိုင်ငှားခ စသည်) မှတ်တမ်းတင်ပါ။",
      "'Payroll' သို့ သွားပြီး ဝန်ထမ်းများ၏ လစဉ်လစာ၊ ဘောနပ်စ်နှင့် ဖြတ်တောက်မှုများ မှတ်တမ်းတင်ပါ။",
      "'Reports' (အစီရင်ခံစာ) သို့ သွားပြီး အချိန်နှင့်တပြေးညီ အမြတ်/အရှုံး (P&L) ရှင်းတမ်းကို ကြည့်ရှုပါ -",
      "Gross Profit = ရောင်းအား (Sales Revenue) - ကုန်ပစ္စည်းအရင်း (COGS)",
      "Net Profit = Gross Profit - ဆိုင်အသုံးစရိတ် - ဝန်ထမ်းလစာ",
      "ရက် ၃၀ အတွင်း ဝင်ငွေလမ်းကြောင်း (Line Chart) နှင့် ငွေချေစနစ်ဝေစု (Pie Chart) တို့ကို လေ့လာသုံးသပ်ပါ။"
    ],
    tipsEn: [
      "Filter reports by Today, Yesterday, 7 Days, 30 Days, or All to view precise financial statements."
    ],
    tipsMy: [
      "ယနေ့၊ မနေ့က၊ ၇ ရက်၊ ၃၀ ရက် သို့မဟုတ် အားလုံး ရွေးချယ်၍ ဘဏ္ဍာရေးစာရင်းများကို တိကျစွာ ခွဲခြမ်းကြည့်ရှုနိုင်ပါသည်။"
    ]
  }
];

export const KEYBOARD_SHORTCUTS = [
  { key: "F1", actionEn: "Focus Product Search", actionMy: "ကုန်ပစ္စည်း အမြန်ရှာဖွေရေး အကွက်သို့ ရောက်ရန်" },
  { key: "F2", actionEn: "Open Camera Barcode Scanner", actionMy: "ကင်မရာ Barcode စကင်နာ ဖွင့်ရန်" },
  { key: "F4", actionEn: "Proceed to Checkout Flow", actionMy: "ငွေရှင်း / Checkout မျက်နှာပြင်သို့ သွားရန်" },
  { key: "F9", actionEn: "Hold Order (Suspend Cart)", actionMy: "လက်ရှိဘောက်ချာကို ခေတ္တဆိုင်းငံ့ (Hold) ထားရန်" },
  { key: "Esc", actionEn: "Close Modal / Cancel Action", actionMy: "Modal ပိတ်ရန် / မူလမျက်နှာပြင်သို့ ပြန်သွားရန်" },
];
