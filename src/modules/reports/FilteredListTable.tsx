"use client";

import React from "react";

interface FilteredListTableProps {
  data: Array<{
    id: string;
    studentName: string;
    schoolName: string;
    packageName: string;
    paymentMethod: string;
    amount: number;
    createdAt: string;
  }>;
}

export default function FilteredListTable({ data }: FilteredListTableProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <div className="card-header">
        <h3 className="card-title">📋 Danh sách giao dịch</h3>
      </div>
      <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
        {data.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px" }}>
            Không có giao dịch nào thỏa mãn điều kiện lọc.
          </div>
        ) : (
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Học viên</th>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Trường</th>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Gói học</th>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Hình thức TT</th>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px", textAlign: "right" }}>Số tiền</th>
                <th style={{ padding: "12px 20px", color: "var(--text-muted)", fontSize: "14px" }}>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px 20px", fontSize: "14px" }}>{row.studentName}</td>
                  <td style={{ padding: "12px 20px", fontSize: "14px" }}>{row.schoolName}</td>
                  <td style={{ padding: "12px 20px", fontSize: "14px" }}>{row.packageName}</td>
                  <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                    <span className="badge" style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                      {row.paymentMethod}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: "14px", textAlign: "right", color: "var(--accent-emerald)" }}>
                    {formatPrice(row.amount)}
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: "14px", color: "var(--text-muted)" }}>
                    {formatDate(row.createdAt)}
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
