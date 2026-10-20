
import React, { useEffect, useRef, useState } from "react";
import { X, Camera, ZapOff, Flashlight } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  lang?: "en" | "my";
}

export default function BarcodeScanner({ onScan, onClose, lang = "en" }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let html5QrCode: any;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!divRef.current) return;
        html5QrCode = new Html5Qrcode("barcode-reader");
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError(lang === "my" ? "Camera မတွေ့ပါ" : "No camera found");
          return;
        }

        // Prefer back camera
        const camera = cameras.find((c: any) => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];

        await html5QrCode.start(
          { deviceId: { exact: camera.id } },
          { fps: 15, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onScan(decodedText);
            html5QrCode.stop().catch(() => {});
            onClose();
          },
          () => {}
        );
        setScanning(true);
      } catch (err: any) {
        setError(lang === "my" ? "Camera ဖွင့်မရပါ — Camera permission ပေးပါ" : "Cannot open camera — please allow camera permission");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-black">
            <Camera size={20} className="text-cyan-400" />
            <span>{lang === "my" ? "Barcode ရိုး‌ကြည့်ပါ" : "Scan Barcode"}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner area */}
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
          <div id="barcode-reader" ref={divRef} className="w-full" />

          {/* Scan line animation */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-4 right-4 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-bounce top-1/2" />
            </div>
          )}

          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs text-center flex items-center gap-2 justify-center">
            <ZapOff size={14} />
            {error}
          </div>
        )}

        <p className="text-slate-400 text-xs text-center">
          {lang === "my"
            ? "ကုန်ပစ္စည်း barcode ကို camera ဘောင်ထဲ ထည့်ပါ"
            : "Hold the product barcode inside the frame"}
        </p>

        {/* Manual entry fallback */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={lang === "my" ? "Barcode ကိုယ်တိုင် ရိုက်ထည့်ပါ..." : "Or type barcode manually..."}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-cyan-500/70 placeholder:text-slate-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) { onScan(val); onClose(); }
              }
            }}
            autoFocus={!!error}
          />
          <button
            onClick={(e) => {
              const input = (e.currentTarget.previousSibling as HTMLInputElement);
              if (input?.value.trim()) { onScan(input.value.trim()); onClose(); }
            }}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl transition cursor-pointer"
          >
            {lang === "my" ? "ရှာ" : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}
