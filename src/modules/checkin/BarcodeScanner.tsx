"use client";

import { useRef, useEffect } from "react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

/**
 * BarcodeScanner — Input luôn ở trạng thái focused.
 * Máy quét mã vạch sẽ nhập chuỗi và tự trigger onSubmit.
 * Tuân thủ DESIGN.md mục C.
 */
export default function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus liên tục
  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    };

    keepFocus();
    const interval = setInterval(keepFocus, 1000);

    // Re-focus khi click bất cứ đâu trên trang
    document.addEventListener("click", keepFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", keepFocus);
    };
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (value) {
      onScan(value);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="scanner-form">
      <div className="scanner-input-wrapper">
        <span className="scanner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            <path d="M8 7v10"></path>
            <path d="M12 7v10"></path>
            <path d="M16 7v10"></path>
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="scanner-input"
          placeholder={disabled ? "Đang xử lý..." : "Quét mã vạch hoặc nhập mã thẻ..."}
          disabled={disabled}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="btn btn-primary scanner-btn"
          disabled={disabled}
        >
          Check-in
        </button>
      </div>
      <div className="scanner-hint">
        💡 Đặt con trỏ chuột vào ô trên, sau đó quét mã vạch. Hệ thống sẽ tự động xử lý.
      </div>
    </form>
  );
}
