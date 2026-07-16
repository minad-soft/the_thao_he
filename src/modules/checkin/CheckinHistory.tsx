"use client";

import { useState, useEffect } from "react";
import type { CheckinLog } from "@/types/database.types";

interface ExtendedCheckinLog extends CheckinLog {
  registrations?: {
    students?: {
      full_name: string;
      sports_preference: string | null;
    } | null;
  } | null;
}

interface CheckinHistoryProps {
  logs: ExtendedCheckinLog[];
}

export default function CheckinHistory({ logs }: CheckinHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  
  const validPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  useEffect(() => {
    if (currentPage !== validPage && totalPages > 0) {
      setCurrentPage(validPage);
    }
  }, [currentPage, validPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const currentLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 Lịch sử Check-in hôm nay ({logs.length})</h3>
      </div>
      <div className="card-body">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">Chưa có lượt check-in nào hôm nay</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã thẻ</th>
                  <th>Học viên</th>
                  <th>Môn đăng ký</th>
                  <th>Buổi</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log) => (
                  <tr key={log.id}>
                  <td>
                    {new Date(log.checked_in_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--accent-indigo-light)",
                    }}>
                      {log.card_code}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {log.registrations?.students?.full_name || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {log.registrations?.students?.sports_preference || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--text-muted)" }}>{log.sessions_before}</span>
                    {" → "}
                    <span style={{
                      fontWeight: 700,
                      color: log.sessions_after <= 2 ? "var(--accent-rose)" : "var(--accent-emerald-light)",
                    }}>
                      {log.sessions_after}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', padding: '0 16px 16px' }}>
              <button
                disabled={validPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="btn btn-secondary btn-sm"
              >
                Trước
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Trang {validPage} / {totalPages}
              </span>
              <button
                disabled={validPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="btn btn-secondary btn-sm"
              >
                Sau
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
