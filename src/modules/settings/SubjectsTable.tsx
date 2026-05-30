"use client";

import { useState } from "react";
import type { Subject } from "@/types/database.types";
import Modal from "@/components/Modal";

interface SubjectsTableProps {
  subjects: Subject[];
  onSubjectAdded: (subject: Subject) => void;
  onSubjectUpdated: (subject: Subject) => void;
  onSubjectDeleted: (id: string) => void;
}

const iconOptions = ["⚽", "🏊", "🏀", "🏸", "🎾", "🏐", "🤸", "🏃"];

const defaultForm = {
  subject_name: "",
  description: "",
  icon: "🏀",
};

export default function SubjectsTable({
  subjects,
  onSubjectAdded,
  onSubjectUpdated,
  onSubjectDeleted,
}: SubjectsTableProps) {
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

  const handleOpenEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      subject_name: subject.subject_name,
      description: subject.description ?? "",
      icon: subject.icon,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa môn "${name}"?`)) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSubjectDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa môn học: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.subject_name.trim()) {
      setError("Vui lòng nhập tên môn học.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/subjects/${editingId}` : "/api/subjects";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: formData.subject_name,
          description: formData.description || null,
          icon: formData.icon,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onSubjectUpdated(data);
      } else {
        onSubjectAdded(data);
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
          <h3 className="card-title">🏅 Danh sách Môn học</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm môn học
          </button>
        </div>
        <div className="card-body">
          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏅</div>
              <div className="empty-state-text">Chưa có môn học nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Icon</th>
                  <th>Tên môn</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td style={{ fontSize: 24, textAlign: "center" }}>{subject.icon}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {subject.subject_name}
                    </td>
                    <td>
                      {subject.description || (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>{new Date(subject.created_at).toLocaleDateString("vi-VN")}</td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(subject)}>
                        Sửa
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(subject.id, subject.subject_name)}
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
        title={editingId ? "Sửa Môn học" : "Thêm Môn học mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm môn học")}
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
          <label className="form-label">Tên môn học *</label>
          <input
            className="form-input"
            placeholder="VD: Bóng đá, Bơi lội..."
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <input
            className="form-input"
            placeholder="Mô tả ngắn về môn học"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Biểu tượng</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {iconOptions.map((icon) => {
              const isSelected = formData.icon === icon;
              return (
                <button
                  key={icon}
                  className={`btn ${isSelected ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "8px 14px", fontSize: 20, minWidth: "48px" }}
                  onClick={() => setFormData({ ...formData, icon })}
                  type="button"
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
