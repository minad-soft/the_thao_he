"use client";

import { useState } from "react";
import type { Shift, Subject } from "@/types/database.types";
import Modal from "@/components/Modal";

interface ShiftsTableProps {
  shifts: Shift[];
  subjects: Subject[];
  onShiftAdded: (shift: Shift) => void;
  onShiftUpdated: (shift: Shift) => void;
  onShiftDeleted: (id: string) => void;
}

const defaultForm = {
  shift_name: "",
  start_time: "",
  end_time: "",
  subject: "",
  subject_id: "",
  days_of_week: [] as string[],
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function ShiftsTable({ shifts, subjects, onShiftAdded, onShiftUpdated, onShiftDeleted }: ShiftsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setFormData({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      subject: shift.subject,
      subject_id: shift.subject_id || "",
      days_of_week: shift.days_of_week,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ca học "${name}"?`)) return;
    try {
      const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onShiftDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa ca học: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.days_of_week.includes(day);
      if (exists) {
        return { ...prev, days_of_week: prev.days_of_week.filter((d) => d !== day) };
      } else {
        return { ...prev, days_of_week: [...prev.days_of_week, day] };
      }
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.shift_name || !formData.start_time || !formData.end_time || !formData.subject_id) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    // Resolve subject name from subject_id
    const selectedSubject = subjects.find((s) => s.id === formData.subject_id);
    const subjectName = selectedSubject ? selectedSubject.subject_name : formData.subject;

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/shifts/${editingId}` : "/api/shifts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_name: formData.shift_name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          subject: subjectName,
          subject_id: formData.subject_id || null,
          days_of_week: formData.days_of_week,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onShiftUpdated(data);
      } else {
        onShiftAdded(data);
      }
      setIsModalOpen(false);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🕐 Danh sách Ca học</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm ca học
          </button>
        </div>
        <div className="card-body">
          {shifts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🕐</div>
              <div className="empty-state-text">Chưa có ca học nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên ca</th>
                  <th>Thời gian</th>
                  <th>Môn học</th>
                  <th>Ngày học</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
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
                      <span className="badge badge-cyan">{shift.subject}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {shift.days_of_week.map((day) => (
                          <span key={day} className="badge badge-indigo" style={{ padding: "2px 6px", fontSize: 11 }}>
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(shift)}>
                        Sửa
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(shift.id, shift.shift_name)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setError(""); }}
        title={editingId ? "Sửa Ca học" : "Thêm Ca học mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm ca học")}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Tên ca học *</label>
          <input
            className="form-input"
            placeholder="VD: Ca sáng, Ca 1..."
            value={formData.shift_name}
            onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Giờ bắt đầu *</label>
            <input
              className="form-input"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Giờ kết thúc *</label>
            <input
              className="form-input"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Môn học *</label>
          <select
            className="form-select"
            value={formData.subject_id}
            onChange={(e) => {
              const sub = subjects.find((s) => s.id === e.target.value);
              setFormData({ ...formData, subject_id: e.target.value, subject: sub ? sub.subject_name : "" });
            }}
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.icon} {sub.subject_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Ngày học trong tuần</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {weekDays.map((day) => {
              const isSelected = formData.days_of_week.includes(day);
              return (
                <button
                  key={day}
                  className={`btn ${isSelected ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "6px 12px", minWidth: "40px" }}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
