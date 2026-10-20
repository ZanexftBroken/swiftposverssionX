import React, { useState, useEffect } from "react";
import {
  X, Sheet, Copy, Download, RefreshCw, CheckCircle2,
  ExternalLink, Sparkles, AlertCircle, Info, ChevronDown,
  ChevronUp, Check, Database, Send, Table, ShoppingCart, Package, DollarSign, ListChecks, Users, UserCheck
} from "lucide-react";
import { Product, Customer, Supplier } from "../types";
import { Language } from "../lib/translations";

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  salesHistory: any[];
  expenses: any[];
  purchases: any[];
  payroll: any[];
  customers: Customer[];
  suppliers?: Supplier[];
  shopName: string;
  lang?: Language;
  theme?: any;
}

export default function GoogleSheetsModal({
  isOpen,
  onClose,
  allProducts,
  salesHistory,
  expenses,
  purchases,
  payroll,
  customers,
  shopName,
  lang = "my",
  theme
}: GoogleSheetsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [copiedMode, setCopiedMode] = useState<string | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState<boolean>(false);

  // Load saved webhook URL
  useEffect(() => {
    const saved = localStorage.getItem("swift_pos_gsheet_webhook");
    if (saved) setWebhookUrl(saved);
  }, []);

  if (!isOpen) return null;

  // Format Helper: format date
  const formatDate = (val: any): string => {
    if (!val) return "";
    if (val.toDate) return val.toDate().toLocaleString();
    if (typeof val === "string" || typeof val === "number") return new Date(val).toLocaleString();
    return "";
  };

  // Build structured table data for chosen category
  const getTableData = (category: string) => {
    switch (category) {
      case "sales": {
        const headers = ["Date", "Customer", "Items", "Subtotal", "Discount", "Tax", "Total", "Payment Method", "Cashier", "Branch", "TxnRef"];
        const rows = salesHistory.map((s) => {
          const itemsStr = (s.items || []).map((i: any) => `${i.name} (${i.qty}x)`).join("; ");
          return [
            formatDate(s.createdAt),
            s.customerName || "Walk-in",
            itemsStr,
            s.subTotal || 0,
            s.discount || 0,
            s.tax || 0,
            s.total || 0,
            s.paymentMethod || "Cash",
            s.cashierName || "-",
            s.branchName || "Main",
            s.txnRef || "-"
          ];
        });
        return { headers, rows, sheetName: "Sales" };
      }
      case "products": {
        const headers = ["Product Name", "SKU", "Barcode", "Category", "Cost Price", "Retail Price", "Wholesale Price", "Quantity", "Low Stock Alert"];
        const rows = allProducts.map((p) => [
          p.name,
          p.sku || "",
          p.barcode || "",
          p.category || "General",
          p.costPrice || 0,
          p.retailPrice || 0,
          p.wholesalePrice || 0,
          p.quantity || 0,
          p.lowStockThreshold || 5
        ]);
        return { headers, rows, sheetName: "Inventory" };
      }
      case "expenses": {
        const headers = ["Date", "Description", "Amount", "Branch"];
        const rows = expenses.map((e) => [
          formatDate(e.date || e.createdAt),
          e.desc || e.description || e.category || "General Expense",
          e.amount || 0,
          e.branchName || "Main"
        ]);
        return { headers, rows, sheetName: "Expenses" };
      }
      case "purchases": {
        const headers = ["Date", "Description / Supplier", "Amount"];
        const rows = purchases.map((p) => [
          formatDate(p.date || p.createdAt),
          p.desc || p.supplierName || "Purchase Entry",
          p.amount || 0
        ]);
        return { headers, rows, sheetName: "Purchases" };
      }
      case "payroll": {
        const headers = ["Date", "Employee Name", "Amount Paid"];
        const rows = payroll.map((pr) => [
          formatDate(pr.date || pr.createdAt),
          pr.name || pr.staffName || "Staff",
          pr.amount || 0
        ]);
        return { headers, rows, sheetName: "Payroll" };
      }
      case "customers": {
        const headers = ["Customer Name", "Phone", "Reward Points", "Outstanding Debt"];
        const rows = customers.map((c) => [
          c.name,
          c.phone || "-",
          c.points || 0,
          c.debt || 0
        ]);
        return { headers, rows, sheetName: "Customers" };
      }
      default:
        return null;
    }
  };

  // Convert table data to TSV for clipboard
  const getTSVString = (headers: string[], rows: (string | number)[][]): string => {
    const headLine = headers.join("\t");
    const rowLines = rows.map((r) => r.map((c) => String(c).replace(/[\t\n\r]/g, " ")).join("\t"));
    return [headLine, ...rowLines].join("\n");
  };

  // Convert table data to CSV with escaping
  const getCSVString = (headers: string[], rows: (string | number)[][]): string => {
    const escapeCsv = (str: string | number) => {
      const s = String(str ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };
    const headLine = headers.map(escapeCsv).join(",");
    const rowLines = rows.map((r) => r.map(escapeCsv).join(","));
    return "\uFEFF" + [headLine, ...rowLines].join("\n"); // UTF-8 BOM
  };

  // 1-Click Copy to Clipboard for Google Sheets
  const handleCopyToClipboard = async () => {
    try {
      if (selectedCategory === "all") {
        const categories = ["sales", "products", "expenses", "purchases", "payroll", "customers"];
        let combined = `=== SWIFT POS EXPORT - ${shopName} - ${new Date().toLocaleString()} ===\n\n`;
        for (const cat of categories) {
          const data = getTableData(cat);
          if (data && data.rows.length > 0) {
            combined += `--- ${data.sheetName.toUpperCase()} (${data.rows.length} records) ---\n`;
            combined += getTSVString(data.headers, data.rows) + "\n\n";
          }
        }
        await navigator.clipboard.writeText(combined);
      } else {
        const data = getTableData(selectedCategory);
        if (data) {
          const tsv = getTSVString(data.headers, data.rows);
          await navigator.clipboard.writeText(tsv);
        }
      }
      setCopiedMode("clipboard");
      setSyncStatus({
        type: "success",
        msg: lang === "my"
          ? "Clipboard သို့ ကူးယူပြီးပါပြီ! Google Sheets ဖွင့်ပြီး Ctrl + V နှိပ်၍ paste ချနိုင်ပါပြီ။"
          : "Copied to clipboard! Open Google Sheets and press Ctrl + V to paste."
      });
      setTimeout(() => setCopiedMode(null), 3000);
    } catch (e: any) {
      setSyncStatus({ type: "error", msg: "Failed to copy: " + e.message });
    }
  };

  // Download Formatted CSV
  const handleDownloadCSV = () => {
    if (selectedCategory === "all") {
      // Download multi-section CSV
      const categories = ["sales", "products", "expenses", "purchases", "payroll", "customers"];
      let combinedCsv = "\uFEFF";
      for (const cat of categories) {
        const data = getTableData(cat);
        if (data && data.rows.length > 0) {
          combinedCsv += `\n"=== ${data.sheetName.toUpperCase()} ==="\n`;
          combinedCsv += getCSVString(data.headers, data.rows).replace("\uFEFF", "") + "\n";
        }
      }
      const blob = new Blob([combinedCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `swift-pos-all-records-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = getTableData(selectedCategory);
      if (data) {
        const csv = getCSVString(data.headers, data.rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `swift-pos-${selectedCategory}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
    setSyncStatus({
      type: "success",
      msg: lang === "my" ? "CSV ဖိုင်ကို အောင်မြင်စွာ ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ။" : "CSV file downloaded successfully!"
    });
  };

  // Direct Auto-Sync to Google Apps Script Webhook
  const handleAutoSync = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        msg: lang === "my"
          ? "ကျေးဇူးပြု၍ Google Apps Script Webhook URL ထည့်သွင်းပေးပါ။ (အောက်ပါ လမ်းညွှန်တွင် ကြည့်ပါ)"
          : "Please enter your Google Apps Script Webhook URL."
      });
      return;
    }

    // Save URL for next time
    localStorage.setItem("swift_pos_gsheet_webhook", webhookUrl.trim());
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      // Prepare full payload
      const payload: any = {
        action: "sync_pos_data",
        shopName,
        syncedAt: new Date().toISOString(),
        category: selectedCategory,
        data: {}
      };

      const categoriesToExport = selectedCategory === "all"
        ? ["sales", "products", "expenses", "purchases", "payroll", "customers"]
        : [selectedCategory];

      let totalRecords = 0;
      for (const cat of categoriesToExport) {
        const data = getTableData(cat);
        if (data) {
          payload.data[data.sheetName] = {
            headers: data.headers,
            rows: data.rows
          };
          totalRecords += data.rows.length;
        }
      }

      // Send to Webhook
      await fetch(webhookUrl.trim(), {
        method: "POST",
        mode: "no-cors", // Google Apps Script redirects require no-cors in browser
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      setSyncStatus({
        type: "success",
        msg: lang === "my"
          ? `Google Sheet သို့ စာရင်းများ (${totalRecords} ခု) အောင်မြင်စွာ Auto-Sync ပို့ဆောင်ပြီးပါပြီ!`
          : `Successfully synced ${totalRecords} records to your Google Sheet!`
      });
    } catch (e: any) {
      setSyncStatus({
        type: "error",
        msg: lang === "my" ? "Sync လုပ်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်: " + e.message : "Sync error: " + e.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Apps Script Template Code
  const appsScriptCode = `// ---------------------------------------------------------------
// SWIFT POS - GOOGLE APPS SCRIPT WEBHOOK RECEIVER
// ---------------------------------------------------------------
function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Iterate through all sheets sent (Sales, Inventory, Expenses, etc.)
    for (var sheetName in payload.data) {
      var item = payload.data[sheetName];
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      // Clear existing content and rewrite with fresh data
      sheet.clearContents();

      // Write headers
      if (item.headers && item.headers.length > 0) {
        sheet.appendRow(item.headers);
        var headerRange = sheet.getRange(1, 1, 1, item.headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#4338ca");
        headerRange.setFontColor("#ffffff");
      }

      // Write data rows
      if (item.rows && item.rows.length > 0) {
        sheet.getRange(2, 1, item.rows.length, item.headers.length).setValues(item.rows);
      }
      sheet.autoResizeColumns(1, item.headers.length);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: Object.keys(payload.data).length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121214] border border-neutral-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-neutral-200">
        
        {/* Header */}
        <div className="bg-[#18181b] border-b border-neutral-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow">
              <Table size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-display flex items-center gap-2">
                {lang === "my" ? "Google Sheets စာရင်းထုတ်ယူခြင်း & Auto-Sync" : "Google Sheets Sync & Export Suite"}
              </h3>
              <p className="text-neutral-400 text-xs font-semibold">
                {lang === "my"
                  ? "အရောင်း၊ စတော့၊ အသုံးစရိတ်၊ အဝယ်နှင့် လစာစာရင်းအားလုံးကို Google Sheet ထဲ တိုက်ရိုက်ပို့ပါ"
                  : "Sync sales, inventory, expenses, purchases & payroll directly into Google Sheets"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 no-scrollbar text-sm">

          {/* User Question Answer Banner: "Google Sheet API လိုမလား?" */}
          <div className="bg-[#18181b] border border-neutral-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <Sparkles className="text-white shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-display">
                {lang === "my" ? "Google Sheets API လိုမလား?" : "Is Google Sheets API Required?"}
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {lang === "my"
                  ? "Google Cloud Console တွင် ရှုပ်ထွေးသော API Key များ ပြုလုပ်ရန် မလိုပါ။ Google Apps Script Web App (အခမဲ့) နည်းလမ်းဖြင့် ၁ မိနစ်အတွင်း တိုက်ရိုက် Auto-Sync လုပ်နိုင်သည့်အပြင်၊ 1-Click Copy ဖြင့်လည်း Google Sheet ထဲသို့ ချက်ချင်း paste လုပ်နိုင်ပါသည်။"
                  : "No complex Google Cloud API key required! You can use Google Apps Script Web App for free, 1-minute auto-sync, or use 1-Click Copy to paste directly into Google Sheets."}
              </p>
            </div>
          </div>

          {/* Category Pills Selector */}
          <div>
            <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">
              {lang === "my" ? "ပို့ဆောင်လိုသည့် စာရင်းအမျိုးအစား ရွေးချယ်ပါ" : "Select Data Category to Sync / Export"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "all", labelMy: "စာရင်းအားလုံး (All)", labelEn: "All Records", icon: <Database size={13} />, count: salesHistory.length + allProducts.length + expenses.length },
                { id: "sales", labelMy: "အရောင်းမှတ်တမ်း", labelEn: "Sales Ledger", icon: <ShoppingCart size={13} />, count: salesHistory.length },
                { id: "products", labelMy: "ကုန်ပစ္စည်း/စတော့", labelEn: "Inventory Items", icon: <Package size={13} />, count: allProducts.length },
                { id: "expenses", labelMy: "အသုံးစရိတ်များ", labelEn: "Expenses", icon: <DollarSign size={13} />, count: expenses.length },
                { id: "purchases", labelMy: "အဝယ်စာရင်းများ", labelEn: "Purchases", icon: <ListChecks size={13} />, count: purchases.length },
                { id: "payroll", labelMy: "ဝန်ထမ်းလစာ", labelEn: "Payroll", icon: <Users size={13} />, count: payroll.length },
                { id: "customers", labelMy: "ဖောက်သည်များ", labelEn: "Customers", icon: <UserCheck size={13} />, count: customers.length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-white border-white text-black shadow"
                      : "bg-[#18181b] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                  }`}
                >
                  <span className="text-xs font-black truncate flex items-center gap-1.5">
                    {cat.icon}
                    {lang === "my" ? cat.labelMy : cat.labelEn}
                  </span>
                  <span className={`text-[10px] font-mono mt-1 font-bold ${selectedCategory === cat.id ? "text-neutral-700" : "text-neutral-500"}`}>{cat.count} records</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Card 1: Direct Auto-Sync Webhook */}
          <div className="bg-[#18181b] border border-neutral-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-white" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-display">
                  {lang === "my" ? "နည်းလမ်း ၁: Google Sheet သို့ တိုက်ရိုက် Auto-Sync ပို့မည်" : "Method 1: Direct Google Sheet Auto-Sync"}
                </h4>
              </div>
              <button
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {lang === "my" ? "၁ မိနစ် Setup လမ်းညွှန်" : "1-Min Setup Guide"}
                {showScriptGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              {lang === "my"
                ? "သင်၏ Google Sheet မှ ရရှိထားသော Apps Script Webhook URL ကို အောက်တွင် ထည့်သွင်းပြီး 'Sync Now' ကို နှိပ်ပါ -"
                : "Paste your Google Apps Script Web App URL below and click 'Sync Now' -"}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-black/60 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
              />
              <button
                onClick={handleAutoSync}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 rounded-xl font-black text-xs shadow transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-black" />
                    {lang === "my" ? "ပို့ဆောင်နေသည်..." : "Syncing..."}
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    {lang === "my" ? "Sync Now (ပို့မည်)" : "Sync Now"}
                  </>
                )}
              </button>
            </div>

            {/* Expandable Setup Instructions */}
            {showScriptGuide && (
              <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-3 mt-3 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-white flex items-center gap-1.5 font-display">
                    <Info size={14} /> {lang === "my" ? "Google Sheet Auto-Sync ပြုလုပ်နည်း (၃ ဆင့်)" : "Google Apps Script 3-Step Setup"}
                  </h5>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedMode("script");
                      setTimeout(() => setCopiedMode(null), 2500);
                    }}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-bold border border-neutral-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMode === "script" ? <Check size={12} /> : <Copy size={12} />}
                    {copiedMode === "script" ? (lang === "my" ? "ကူးပြီးပါပြီ" : "Copied!") : (lang === "my" ? "Code ကူးယူမည်" : "Copy Code")}
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                  <li>{lang === "my" ? "Google Drive တွင် Google Sheet အသစ်တစ်ခု ဖွင့်ပါ။" : "Create a new Google Sheet on Google Drive."}</li>
                  <li>{lang === "my" ? "အပေါ်မီနူးရှိ 'Extensions' -> 'Apps Script' ကို နှိပ်ပြီး အထက်ပါ Code ကို ကူးထည့်ပါ။" : "Click 'Extensions' -> 'Apps Script' and paste the copied code."}</li>
                  <li>{lang === "my" ? "'Deploy' -> 'New Deployment' -> Select 'Web App' -> 'Who has access: Anyone' ရွေးချယ်ပြီး Deploy နှိပ်ပါ။" : "Click 'Deploy' -> 'New Deployment' -> Select 'Web App' -> Set 'Who has access' to 'Anyone' -> Deploy."}</li>
                  <li>{lang === "my" ? "ရရှိလာသော Web App URL ကို အထက်ပါ အကွက်ထဲသို့ ထည့်သွင်းပြီး Sync Now နှိပ်လိုက်ရုံပါပဲ!" : "Copy the generated Web App URL, paste into the box above and hit Sync Now!"}</li>
                </ol>
              </div>
            )}
          </div>

          {/* Action Card 2 & 3: 1-Click Copy & CSV Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1-Click Copy */}
            <div className="bg-[#18181b] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 mb-1">
                  <Copy size={16} className="text-white" />
                  {lang === "my" ? "နည်းလမ်း ၂: 1-Click Copy" : "Method 2: 1-Click Copy"}
                </h4>
                <p className="text-[11px] text-neutral-400">
                  {lang === "my"
                    ? "Google Sheet ဖွင့်ထားပြီး Ctrl + V နှိပ်လိုက်ရုံဖြင့် အကွက်တိ ကျစေသည့် Clipboard စနစ်"
                    : "Instantly copy formatted table data to paste directly with Ctrl + V"}
                </p>
              </div>
              <button
                onClick={handleCopyToClipboard}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedMode === "clipboard" ? <Check size={14} /> : <Copy size={14} />}
                {copiedMode === "clipboard"
                  ? (lang === "my" ? "ကူးယူပြီးပါပြီ!" : "Copied!")
                  : (lang === "my" ? "Google Sheet အတွက် ကူးယူမည်" : "Copy for Google Sheets")}
              </button>
            </div>

            {/* CSV Download */}
            <div className="bg-[#18181b] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 mb-1">
                  <Download size={16} className="text-white" />
                  {lang === "my" ? "နည်းလမ်း ၃: CSV ဒေါင်းလုဒ်" : "Method 3: Download CSV"}
                </h4>
                <p className="text-[11px] text-neutral-400">
                  {lang === "my"
                    ? "Unicode မပျက်စေသော UTF-8 BOM ဖြင့် Excel & Sheets သုံးနိုင်သည့် ဖိုင်ထုတ်ယူခြင်း"
                    : "Download standard UTF-8 CSV compatible with Excel and Google Sheets Import"}
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={14} />
                {lang === "my" ? "CSV ဖိုင် ဒေါင်းလုဒ်လုပ်မည်" : "Download UTF-8 CSV"}
              </button>
            </div>
          </div>

          {/* Sync Status Toast / Notification */}
          {syncStatus && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
              syncStatus.type === "success"
                ? "bg-neutral-900 border-neutral-700 text-white"
                : "bg-rose-950/40 border-rose-800 text-rose-300"
            }`}>
              {syncStatus.type === "success" ? <CheckCircle2 size={18} className="shrink-0 text-white" /> : <AlertCircle size={18} className="shrink-0 text-rose-400" />}
              <span className="font-semibold">{syncStatus.msg}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#18181b] border-t border-neutral-800 p-4 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-neutral-500 font-mono">
            {shopName} • {allProducts.length} Items • {salesHistory.length} Vouchers
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-black transition cursor-pointer border border-neutral-700"
          >
            {lang === "my" ? "ပိတ်မည်" : "Close"}
          </button>
        </div>

      </div>
    </div>
  );
}
