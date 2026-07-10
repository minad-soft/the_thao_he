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
  onSubjectUpdated?: (subject: Subject) => void;
}

const defaultShiftItem = {
  shift_name: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  days_of_week: [] as string[],
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function ShiftsTable({ shifts, subjects, onShiftAdded, onShiftUpdated, onShiftDeleted, onSubjectUpdated }: ShiftsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formSubjectId, setFormSubjectId] = useState("");
  const [shiftItems, setShiftItems] = useState([{ ...defaultShiftItem }]);
  
  const [error, setError] = useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [noteForm, setNoteForm] = useState({ notes: "", show_notes: false });

  const handleOpenNoteEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setNoteForm({ notes: subject.notes || "", show_notes: subject.show_notes || false });
    setIsNoteModalOpen(true);
  };

  const handleNoteSubmit = async () => {
    if (!editingSubject) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingSubject,
          notes: noteForm.notes,
          show_notes: noteForm.show_notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (onSubjectUpdated) {
        onSubjectUpdated(data);
      }
      setIsNoteModalOpen(false);
    } catch (err: any) {
      alert("Lỗi lưu ghi chú: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormSubjectId("");
    setShiftItems([{ ...defaultShiftItem }]);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenAddForSubject = (subjectId: string) => {
    setEditingId(null);
    setFormSubjectId(subjectId);
    setShiftItems([{ ...defaultShiftItem }]);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setFormSubjectId(shift.subject_id || "");
    setShiftItems([{
      shift_name: shift.shift_name,
      start_date: shift.start_date || "",
      end_date: shift.end_date || "",
      start_time: shift.start_time,
      end_time: shift.end_time,
      days_of_week: shift.days_of_week,
    }]);
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

  const toggleDay = (itemIndex: number, day: string) => {
    setShiftItems((prev) => {
      const newItems = [...prev];
      const currentDays = newItems[itemIndex].days_of_week || [];
      const exists = currentDays.includes(day);
      
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        days_of_week: exists 
          ? currentDays.filter((d) => d !== day)
          : [...currentDays, day]
      };
      return newItems;
    });
  };

  const handleAddShiftItem = () => {
    setShiftItems((prev) => [...prev, { ...defaultShiftItem }]);
  };

  const handleRemoveShiftItem = (index: number) => {
    setShiftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setShiftItems((prev) => {
      const newItems = [...prev];
      (newItems[index] as any)[field] = value;
      return newItems;
    });
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!formSubjectId) {
      setError("Vui lòng chọn Môn học.");
      return;
    }

    for (let i = 0; i < shiftItems.length; i++) {
      const item = shiftItems[i];
      if (!item.shift_name || !item.start_time || !item.end_time || !item.start_date || !item.end_date) {
        setError(`Vui lòng điền đầy đủ thông tin bắt buộc cho Ca ${i + 1}.`);
        return;
      }
    }

    const selectedSubject = subjects.find((s) => s.id === formSubjectId);
    const subjectName = selectedSubject ? selectedSubject.subject_name : "";

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Edit mode (single shift)
        const item = shiftItems[0];
        const res = await fetch(`/api/shifts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            subject: subjectName,
            subject_id: formSubjectId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onShiftUpdated(data);
      } else {
        // Add mode (multiple shifts)
        for (const item of shiftItems) {
          const res = await fetch("/api/shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...item,
              subject: subjectName,
              subject_id: formSubjectId,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          onShiftAdded(data);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group shifts by subject
  const shiftsBySubject = shifts.reduce((acc, shift) => {
    const key = shift.subject || "Khác";
    if (!acc[key]) acc[key] = [];
    acc[key].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🕐 Danh sách Ca học theo Môn</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Tạo ca học mới
          </button>
        </div>
        <div className="card-body">
          {shifts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🕐</div>
              <div className="empty-state-text">Chưa có ca học nào</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {Object.keys(shiftsBySubject).map((subjectName) => {
                const subjectObj = subjects.find(s => s.subject_name === subjectName);
                return (
                <div key={subjectName} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                  <div style={{ background: "var(--bg-glass-hover)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🏅</span>
                    <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{subjectName}</strong>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="badge badge-indigo">{shiftsBySubject[subjectName].length} ca</span>
                      {subjectObj && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: "var(--accent-emerald-light)", padding: "2px 8px", fontSize: "12px", border: "1px dashed var(--accent-emerald-light)" }}
                          onClick={() => handleOpenAddForSubject(subjectObj.id)}
                        >
                          + Thêm ca học
                        </button>
                      )}
                    </div>
                  </div>
                  {subjectObj && (
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Ghi chú chung:</div>
                          {subjectObj.notes ? (
                            <div style={{ fontSize: 14, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{subjectObj.notes}</div>
                          ) : (
                            <div style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có ghi chú</div>
                          )}
                          <div style={{ marginTop: 8 }}>
                            <span className={`badge ${subjectObj.show_notes ? "badge-emerald" : "badge-slate"}`} style={{ fontSize: 11 }}>
                              {subjectObj.show_notes ? "👁️ Đang hiển thị cho học viên" : "👁️‍🗨️ Đang ẩn với học viên"}
                            </span>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenNoteEdit(subjectObj)}>Sửa ghi chú</button>
                      </div>
                    </div>
                  )}
                  <table className="data-table" style={{ margin: 0, border: "none" }}>
                    <thead>
                      <tr>
                        <th>Tên ca</th>
                        <th>Thời gian (Giờ)</th>
                        <th>Thời gian (Ngày)</th>
                        <th>Ngày học</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftsBySubject[subjectName].map((shift) => (
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
                            <span style={{ fontSize: 13 }}>
                              {shift.start_date ? new Date(shift.start_date).toLocaleDateString("vi-VN") : "—"} <br/>
                              {shift.end_date ? new Date(shift.end_date).toLocaleDateString("vi-VN") : "—"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {shift.days_of_week.map((day) => (
                                <span key={day} className="badge badge-slate" style={{ padding: "2px 6px", fontSize: 11 }}>
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
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setError(""); }}
        title={editingId ? "Sửa Ca học" : "Tạo Ca học mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Lưu các ca học")}
            </button>
          </>
        }
      >
        {error && (
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-indigo-light)" }}>1. Chọn Môn học *</label>
          <select
            className="form-select"
            value={formSubjectId}
            onChange={(e) => setFormSubjectId(e.target.value)}
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.icon} {sub.subject_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-indigo-light)", margin: 0 }}>
            2. Danh sách Ca học *
          </label>
          {!editingId && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleAddShiftItem} style={{ color: "var(--accent-emerald-light)" }}>
              + Thêm ca học
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}>
          {shiftItems.map((item, index) => (
            <div key={index} style={{ background: "var(--bg-glass)", padding: 16, borderRadius: 8, border: "1px solid var(--border-color)", position: "relative" }}>
              {!editingId && shiftItems.length > 1 && (
                <button 
                  type="button"
                  className="btn btn-ghost btn-sm" 
                  style={{ position: "absolute", top: 8, right: 8, color: "var(--accent-rose)", padding: "4px 8px" }}
                  onClick={() => handleRemoveShiftItem(index)}
                >
                  ✕ Xóa
                </button>
              )}
              
              <h5 style={{ margin: "0 0 12px 0", color: "var(--text-secondary)" }}>Ca #{index + 1}</h5>
              
              <div className="form-group">
                <label className="form-label">Tên ca học *</label>
                <input
                  className="form-input"
                  placeholder="VD: Ca sáng, Ca 1..."
                  value={item.shift_name}
                  onChange={(e) => handleItemChange(index, "shift_name", e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={item.start_date}
                    onChange={(e) => handleItemChange(index, "start_date", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={item.end_date}
                    onChange={(e) => handleItemChange(index, "end_date", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giờ bắt đầu *</label>
                  <input
                    className="form-input"
                    type="time"
                    value={item.start_time}
                    onChange={(e) => handleItemChange(index, "start_time", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giờ kết thúc *</label>
                  <input
                    className="form-input"
                    type="time"
                    value={item.end_time}
                    onChange={(e) => handleItemChange(index, "end_time", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ngày học trong tuần</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                  {weekDays.map((day) => {
                    const isSelected = item.days_of_week.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        className={`btn ${isSelected ? "btn-primary" : "btn-ghost"}`}
                        style={{ padding: "6px 12px", minWidth: "40px" }}
                        onClick={() => toggleDay(index, day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={`Ghi chú môn: ${editingSubject?.subject_name}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsNoteModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleNoteSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nội dung ghi chú</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Nhập ghi chú chung cho tất cả các ca học của môn này..."
            value={noteForm.notes}
            onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
            style={{ resize: "vertical", minHeight: "80px" }}
          />
        </div>
        <div className="form-group" style={{ marginTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={noteForm.show_notes}
              onChange={(e) => setNoteForm({ ...noteForm, show_notes: e.target.checked })}
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 500 }}>
              Hiển thị thông báo này cho học viên
            </span>
          </label>
          <p style={{ margin: "4px 0 0 26px", fontSize: "13px", color: "var(--text-secondary)" }}>
            Nếu được chọn, ghi chú sẽ xuất hiện trong thông báo khi học viên chọn nguyện vọng.
          </p>
        </div>
      </Modal>
    </>
  );
}
