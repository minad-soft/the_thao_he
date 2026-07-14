"use client";

import { useState, useEffect } from "react";
import "./checkin-history.css";

interface CheckinHistoryEntry {
  id: string;
  checked_in_at: string;
  student_name: string;
  card_code: string;
  school_name: string;
  subject_name: string;
  shift_name: string;
  remaining_sessions: number;
}

export default function CheckinHistoryPage() {
  const [data, setData] = useState<CheckinHistoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 25;

  const [shifts, setShifts] = useState<any[]>([]);

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [shiftId, setShiftId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/shifts").then(r => r.ok ? r.json() : []).then(setShifts).catch(console.error);
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        startDate,
        endDate,
        shiftId,
        search
      });
      const res = await fetch(`/api/checkin/history?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setTotalCount(json.totalCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else fetchData();
  };

  const handleExport = async () => {
    try {
      const q = new URLSearchParams({
        page: "1",
        limit: "10000", // Export all matching
        startDate,
        endDate,
        shiftId,
        search
      });
      const res = await fetch(`/api/checkin/history?${q.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      
      if (!json.data || json.data.length === 0) {
        return alert("Không có dữ liệu để xuất");
      }

      const { utils, writeFile } = await import("xlsx");
      const exportData = json.data.map((row: any, i: number) => ({
        "STT": i + 1,
        "Thời gian": new Date(row.checked_in_at).toLocaleString("vi-VN"),
        "Học viên": row.student_name,
        "Mã thẻ": row.card_code,
        "Lớp học": row.shift_name,
        "Môn học": row.subject_name,
        "Số buổi còn": row.remaining_sessions
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "LichSuDiemDanh");
      
      const wscols = [
        { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
      ];
      ws["!cols"] = wscols;

      writeFile(wb, `LichSuDiemDanh_${startDate}_${endDate}.xlsx`);
    } catch (e) {
      alert("Lỗi xuất Excel");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Lịch sử Điểm danh</h1>
        <p className="page-subtitle">Tra cứu chuyên cần của học viên theo ngày và theo lớp</p>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-body" style={{ padding: "16px" }}>
          <form onSubmit={handleFilterSubmit} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
              <label className="form-label">Từ ngày</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
              <label className="form-label">Đến ngày</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "200px" }}>
              <label className="form-label">Lớp học / Ca học</label>
              <select className="form-select" value={shiftId} onChange={e => setShiftId(e.target.value)}>
                <option value="">-- Tất cả ca học --</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.shift_name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 2, minWidth: "200px" }}>
              <label className="form-label">Tìm kiếm học viên</label>
              <input type="text" className="form-input" placeholder="Tên hoặc mã thẻ..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ height: "42px" }} disabled={loading}>
                {loading ? "Đang lọc..." : "Lọc dữ liệu"}
              </button>
              <button type="button" className="btn btn-outline" style={{ height: "42px" }} onClick={handleExport}>
                📥 Xuất Excel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: "center" }}>STT</th>
                  <th>Thời gian</th>
                  <th>Học viên</th>
                  <th>Mã thẻ</th>
                  <th>Lớp học / Ca học</th>
                  <th>Môn học</th>
                  <th style={{ textAlign: 'center' }}>Số buổi còn</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Đang tải dữ liệu...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Không tìm thấy lịch sử điểm danh.</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{(page - 1) * limit + i + 1}</td>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(row.checked_in_at).toLocaleString("vi-VN", { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' })}
                      </td>
                      <td style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{row.student_name}</td>
                      <td style={{ fontFamily: "monospace" }}>{row.card_code}</td>
                      <td>{row.shift_name}</td>
                      <td><span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>{row.subject_name}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: row.remaining_sessions > 0 ? "var(--accent-green)" : "var(--accent-red)", fontWeight: "bold" }}>
                          {row.remaining_sessions}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalCount > limit && (
            <div className="pagination" style={{ padding: "16px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trang trước</button>
              <span style={{ padding: "8px 16px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                Trang {page} / {Math.ceil(totalCount / limit)}
              </span>
              <button className="btn btn-outline" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(p => p + 1)}>Trang sau</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
