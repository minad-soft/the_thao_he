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
  page?: number;
  totalCount?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onExport?: () => void;
}

export default function FilteredListTable({ data, page = 1, totalCount = 0, limit = 25, onPageChange, onExport }: FilteredListTableProps) {
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
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>📋 Danh sách giao dịch</h3>
        <button
          onClick={onExport}
          className="btn btn-secondary"
          style={{ height: "36px", padding: "0 16px", display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)", cursor: "pointer", borderRadius: "8px" }}
          disabled={!data || data.length === 0}
        >
          <span>📊</span> Xuất Excel
        </button>
      </div>
      <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
        {data.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px" }}>
            Không có giao dịch nào thỏa mãn điều kiện lọc.
          </div>
        ) : (
          <>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="data-table data-table-mobile-card" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-card)" }}>
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
                  <td data-label="Học viên" style={{ padding: "12px 20px", fontSize: "14px" }}>{row.studentName}</td>
                  <td data-label="Trường" style={{ padding: "12px 20px", fontSize: "14px" }}>{row.schoolName}</td>
                  <td data-label="Gói học" style={{ padding: "12px 20px", fontSize: "14px" }}>{row.packageName}</td>
                  <td data-label="Hình thức TT" style={{ padding: "12px 20px", fontSize: "14px" }}>
                    <span className="badge" style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                      {row.paymentMethod}
                    </span>
                  </td>
                  <td data-label="Số tiền" style={{ padding: "12px 20px", fontSize: "14px", textAlign: "right", color: "var(--accent-emerald)" }}>
                    {formatPrice(row.amount)}
                  </td>
                  <td data-label="Ngày đăng ký" style={{ padding: "12px 20px", fontSize: "14px", color: "var(--text-muted)" }}>
                    {formatDate(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {onPageChange && totalCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--border-color)", background: "var(--bg-card)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                Hiển thị {Math.min((page - 1) * limit + 1, totalCount)} - {Math.min(page * limit, totalCount)} trong số {totalCount} giao dịch
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={page === 1} 
                  onClick={() => onPageChange(page - 1)}
                  style={{ padding: "6px 12px", height: "auto" }}
                >
                  Trước
                </button>
                <span style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", fontSize: "14px", border: "1px solid var(--border-color)" }}>
                  Trang {page} / {Math.max(1, Math.ceil(totalCount / limit))}
                </span>
                <button 
                  className="btn btn-secondary" 
                  disabled={page >= Math.ceil(totalCount / limit)} 
                  onClick={() => onPageChange(page + 1)}
                  style={{ padding: "6px 12px", height: "auto" }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
