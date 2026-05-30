"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/modules/checkin/BarcodeScanner";
import "./checkin-batch.css";

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  room_name?: string;
}

interface CheckinEntry {
  log_id: string;
  student_name: string;
  school_name: string;
  subject_name: string;
  sessions_used: number;
  sessions_total: number;
  location: { lat: number; lng: number };
}

export default function BatchCheckinPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [entries, setEntries] = useState<CheckinEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/shifts")
      .then((r) => r.ok ? r.json() : [])
      .then(setShifts)
      .catch(console.error);
  }, []);

  const startBatch = async () => {
    if (!selectedShift) return alert("Vui lòng chọn lớp");
    const res = await fetch("/api/checkin/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: selectedShift }),
    });
    const json = await res.json();
    if (json.batchId) setBatchId(json.batchId);
    else alert(json.error || "Lỗi tạo phiên điểm danh");
  };

  const handleScan = async (code: string) => {
    if (!batchId) return;
    if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ GPS");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`/api/checkin/batch/${batchId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_code: code,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEntries((prev) => [
          ...prev,
          {
            log_id: "entry-" + Date.now(),
            student_name: code,
            school_name: "—",
            subject_name: "—",
            sessions_used: 1,
            sessions_total: 0,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          },
        ]);
      } else {
        alert(json.error || "Lỗi check-in");
      }
    });
  };

  const finalize = async (action: "save" | "save_print") => {
    const res = await fetch(`/api/checkin/batch/${batchId}/finalize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (json.success) {
      if (action === "save_print" && json.pdfUrl) window.open(json.pdfUrl, "_blank");
      alert("Phiên điểm danh đã lưu thành công!");
      router.push("/checkin-batch");
    } else {
      alert(json.error || "Lỗi hoàn tất");
    }
  };

  const selectedShiftInfo = shifts.find((s) => s.id === selectedShift);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Check-in Hàng Loạt</h1>
        <p className="page-subtitle">Điểm danh nhanh theo lớp — quét thẻ từng học viên</p>
      </div>

      {/* BƯỚC 1: Chọn lớp */}
      <div className="batch-step-card">
        <div className="batch-step-title">
          <span className="batch-step-num">1</span>
          Chọn lớp học
        </div>
        <div className="batch-shift-row">
          <div style={{ flex: 1 }}>
            <label className="batch-shift-label">Ca học / Lớp</label>
            <select
              className="batch-select"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              disabled={!!batchId}
            >
              <option value="">— Chọn lớp để bắt đầu —</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shift_name} · {s.room_name ?? "Chưa xếp phòng"} ({s.start_time} – {s.end_time})
                </option>
              ))}
            </select>
          </div>
          <button
            className="batch-btn-start"
            onClick={startBatch}
            disabled={!selectedShift || !!batchId}
          >
            {batchId ? "✓ Đang điểm danh" : "Bắt đầu điểm danh"}
          </button>
        </div>

        {batchId && selectedShiftInfo && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 14, color: "var(--accent-indigo-light)" }}>
            🏫 <strong>{selectedShiftInfo.shift_name}</strong>
            {selectedShiftInfo.room_name ? ` · Phòng ${selectedShiftInfo.room_name}` : ""}
            {` · ${selectedShiftInfo.start_time} – ${selectedShiftInfo.end_time}`}
          </div>
        )}
      </div>

      {/* BƯỚC 2 & 3: Hiện sau khi bắt đầu */}
      {batchId && (
        <div className="batch-main-grid">
          {/* Cột trái: Quét + Hoàn tất */}
          <div>
            <div className="batch-step-card">
              <div className="batch-step-title">
                <span className="batch-step-num">2</span>
                Quét mã vạch thẻ
              </div>
              <BarcodeScanner onScan={handleScan} />
            </div>

            <div className="batch-step-card">
              <div className="batch-step-title">
                <span className="batch-step-num">3</span>
                Hoàn tất phiên
              </div>
              <button
                className="batch-btn-save batch-btn-close"
                onClick={() => finalize("save")}
              >
                <span>💾</span> Lưu &amp; Đóng
              </button>
              <button
                className="batch-btn-save batch-btn-print"
                onClick={() => finalize("save_print")}
              >
                <span>🖨️</span> Lưu &amp; In Danh Sách
              </button>
            </div>
          </div>

          {/* Cột phải: Danh sách */}
          <div className="batch-step-card" style={{ minHeight: 400 }}>
            <div className="batch-table-header">
              <div className="batch-step-title" style={{ margin: 0 }}>
                <span className="batch-step-num">✓</span>
                Danh sách đã check-in
              </div>
              <div className="batch-active-badge">
                <span className="batch-active-dot" />
                {entries.length} học viên
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="batch-table-wrapper">
                <table className="batch-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mã thẻ / Học viên</th>
                      <th>Môn học</th>
                      <th>Buổi</th>
                      <th>GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, i) => (
                      <tr key={e.log_id}>
                        <td style={{ color: "var(--text-muted)", width: 36 }}>{i + 1}</td>
                        <td className="td-primary">{e.student_name}</td>
                        <td>{e.subject_name}</td>
                        <td>
                          <span className="batch-sessions-badge">
                            {e.sessions_used}/{e.sessions_total === 0 ? "?" : e.sessions_total}
                          </span>
                        </td>
                        <td>
                          <span className="batch-gps-text">
                            {e.location.lat.toFixed(4)}, {e.location.lng.toFixed(4)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="batch-empty">
                <div className="batch-empty-icon">📋</div>
                <div className="batch-empty-text">Chưa có học viên nào được check-in</div>
                <div className="batch-empty-sub">Quét mã vạch thẻ học viên để thêm vào danh sách</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
