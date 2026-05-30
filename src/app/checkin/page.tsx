"use client";

import { useState, useEffect, useCallback } from "react";
import type { CheckinLog } from "@/types/database.types";
import BarcodeScanner from "@/modules/checkin/BarcodeScanner";
import QRTicket from "@/modules/checkin/QRTicket";
import CheckinHistory from "@/modules/checkin/CheckinHistory";
import "./checkin.css";

interface CheckinResult {
  success: boolean;
  ticket_code: string;
  card_code: string;
  student_name: string;
  package_name: string;
  subject: string;
  print_ticket: boolean;
  sessions_before: number;
  sessions_after: number;
  checked_in_at: string;
}

interface CheckinError {
  error: string;
  status_type?: string;
  student_name?: string;
  card_code?: string;
}

export default function CheckinPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [lastError, setLastError] = useState<CheckinError | null>(null);
  const [logs, setLogs] = useState<CheckinLog[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/checkin-logs");
      if (res.ok) setLogs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchLogs();
    // Refresh logs mỗi 30 giây
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleScan = async (cardCode: string) => {
    setIsProcessing(true);
    setLastResult(null);
    setLastError(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_code: cardCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLastResult(data);
        fetchLogs(); // Refresh log
      } else {
        setLastError(data);
      }
    } catch {
      setLastError({ error: "Không thể kết nối server" });
    } finally {
      setIsProcessing(false);
    }
  };

  const errorIcon = () => {
    switch (lastError?.status_type) {
      case "NOT_FOUND": return "🔍";
      case "INACTIVE": return "🚫";
      case "NO_SESSIONS": return "⏰";
      default: return "❌";
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check-in Điểm danh</h1>
        <p className="page-subtitle">Quét mã vạch thẻ học viên để check-in</p>
      </div>

      {/* Stats */}
      <div className="checkin-stats">
        <div className="checkin-stat">
          <div className="checkin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.12)" }}>🎫</div>
          <div>
            <div className="checkin-stat-value">{logs.length}</div>
            <div className="checkin-stat-label">Lượt check-in hôm nay</div>
          </div>
        </div>
        <div className="checkin-stat">
          <div className="checkin-stat-icon" style={{ background: "rgba(99, 102, 241, 0.12)" }}>👥</div>
          <div>
            <div className="checkin-stat-value">
              {new Set(logs.map((l) => l.card_code)).size}
            </div>
            <div className="checkin-stat-label">Học viên duy nhất</div>
          </div>
        </div>
        <div className="checkin-stat">
          <div className="checkin-stat-icon" style={{ background: "rgba(6, 182, 212, 0.12)" }}>🕐</div>
          <div>
            <div className="checkin-stat-value">
              {logs.length > 0
                ? new Date(logs[0].checked_in_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : "—"
              }
            </div>
            <div className="checkin-stat-label">Check-in gần nhất</div>
          </div>
        </div>
      </div>

      {/* Scanner Input */}
      <BarcodeScanner onScan={handleScan} disabled={isProcessing} />

      {/* Content */}
      <div className="checkin-layout">
        {/* Cột trái: Kết quả / Lỗi / Idle */}
        <div>
          {isProcessing ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : lastResult ? (
            <QRTicket
              ticketCode={lastResult.ticket_code}
              studentName={lastResult.student_name}
              packageName={lastResult.package_name}
              subject={lastResult.subject}
              sessionsBefore={lastResult.sessions_before}
              sessionsAfter={lastResult.sessions_after}
              checkedInAt={lastResult.checked_in_at}
              printTicket={lastResult.print_ticket}
            />
          ) : lastError ? (
            <div className="checkin-error">
              <div className="checkin-error-icon">{errorIcon()}</div>
              <div className="checkin-error-message">{lastError.error}</div>
              {lastError.student_name && (
                <div className="checkin-error-detail">
                  Học viên: {lastError.student_name}
                </div>
              )}
              {lastError.card_code && (
                <div className="checkin-error-detail">
                  Mã thẻ: {lastError.card_code}
                </div>
              )}
            </div>
          ) : (
            <div className="scanner-idle">
              <div className="scanner-idle-icon">📷</div>
              <div className="scanner-idle-text">Sẵn sàng quét mã vạch...</div>
            </div>
          )}
        </div>

        {/* Cột phải: Lịch sử */}
        <CheckinHistory logs={logs} />
      </div>
    </div>
  );
}
