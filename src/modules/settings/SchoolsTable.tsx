"use client";

import { useState } from "react";
import type { School } from "@/types/database.types";
import Modal from "@/components/Modal";

interface SchoolsTableProps {
  schools: School[];
  onSchoolAdded: (school: School) => void;
  onSchoolUpdated: (school: School) => void;
  onSchoolDeleted: (id: string) => void;
}

export default function SchoolsTable({ schools, onSchoolAdded, onSchoolUpdated, onSchoolDeleted }: SchoolsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ school_name: "", school_code: "" });
  const [error, setError] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ school_name: "", school_code: "" });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingId(school.id);
    setFormData({ school_name: school.school_name, school_code: school.school_code });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa trường "${name}"?`)) return;
    try {
      const res = await fetch(`/api/schools/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSchoolDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa trường: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.school_name.trim() || !formData.school_code.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/schools/${editingId}` : "/api/schools";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onSchoolUpdated(data);
      } else {
        onSchoolAdded(data);
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
          <h3 className="card-title">🏫 Danh sách Trường học</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm trường
          </button>
        </div>
        <div className="card-body">
          {schools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏫</div>
              <div className="empty-state-text">Chưa có trường học nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã trường</th>
                  <th>Tên trường</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <span className={`badge ${school.school_code === "99" ? "badge-amber" : "badge-indigo"}`}>
                        {school.school_code}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {school.school_name}
                      {school.school_code === "99" && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: "var(--accent-amber)" }}>
                          (Mặc định)
                        </span>
                      )}
                    </td>
                    <td>{new Date(school.created_at).toLocaleDateString("vi-VN")}</td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(school)}>
                        Sửa
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(school.id, school.school_name)}
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
        title={editingId ? "Sửa Trường học" : "Thêm Trường học mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm trường")}
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
          <label className="form-label">Tên trường</label>
          <input
            className="form-input"
            placeholder="VD: THPT Nguyễn Huệ"
            value={formData.school_name}
            onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mã trường</label>
          <input
            className="form-input"
            placeholder="VD: 01"
            value={formData.school_code}
            onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}
