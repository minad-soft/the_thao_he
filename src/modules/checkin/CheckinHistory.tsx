"use client";

import type { CheckinLog } from "@/types/database.types";

interface CheckinHistoryProps {
  logs: CheckinLog[];
}

export default function CheckinHistory({ logs }: CheckinHistoryProps) {
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Mã thẻ</th>
                <th>Mã vé</th>
                <th>Buổi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
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
                    <span style={{
                      fontFamily: "'Courier New', monospace",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--accent-emerald-light)",
                    }}>
                      {log.ticket_code}
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
        )}
      </div>
    </div>
  );
}
