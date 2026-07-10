"use client";

import { useEffect, useState } from "react";

export default function ShiftStatistics() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/shift-statistics")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch shift statistics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="card" style={{ padding: "24px", textAlign: "center" }}>Đang tải thống kê ca học...</div>;
  }

  const subjects = Object.keys(data);
  if (subjects.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <div className="card-header">
        <h3 className="card-title">🕐 Thống kê Đăng ký Ca học</h3>
      </div>
      <div className="card-body">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {subjects.map((subjectName) => (
            <div key={subjectName} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ background: "var(--bg-glass-hover)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "16px", marginRight: "8px" }}>🏅</span>
                <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{subjectName}</strong>
              </div>
              <table className="data-table" style={{ margin: 0, border: "none" }}>
                <thead>
                  <tr>
                    <th>Tên ca</th>
                    <th>Thời gian</th>
                    <th>Ngày học</th>
                    <th>Số lượng đăng ký</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data[subjectName].map((shift: any) => {
                    const capacity = shift.capacity ?? 30;
                    const registeredCount = shift.registered_count || 0;
                    const isFull = registeredCount >= capacity;
                    const percentage = Math.min(100, Math.round((registeredCount / capacity) * 100));
                    
                    let statusColor = "var(--accent-emerald)";
                    if (percentage > 80) statusColor = "var(--accent-amber)";
                    if (isFull) statusColor = "var(--accent-rose)";

                    return (
                      <tr key={shift.id}>
                        <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {shift.shift_name}
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                            {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {shift.days_of_week.map((d: string) => (
                              <span key={d} style={{ fontSize: 11, padding: "2px 6px", background: "var(--bg-secondary)", borderRadius: 4, color: "var(--text-secondary)" }}>
                                {d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                              {registeredCount} / {capacity}
                            </span>
                            <div style={{ width: "100px", height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${percentage}%`, background: statusColor }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          {isFull ? (
                            <span className="badge badge-rose">Đã đầy</span>
                          ) : percentage > 80 ? (
                            <span className="badge badge-amber">Sắp đầy</span>
                          ) : (
                            <span className="badge badge-emerald">Còn chỗ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
