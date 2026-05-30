"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { Staff } from "@/types/database.types";

interface StaffTableProps {
  staffs: Staff[];
  onStaffUpdated: (staff: Staff) => void;
  onStaffDeleted: (id: string) => void;
}

export default function StaffTable({ staffs, onStaffUpdated, onStaffDeleted }: StaffTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone_number: "",
    role: "STAFF" as 'ADMIN' | 'STAFF' | 'ACCOUNTANT',
    password: "",
    status: "ACTIVE" as 'ACTIVE' | 'INACTIVE',
  });
  const [error, setError] = useState("");
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const handleTogglePassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenEdit = (staff: Staff) => {
    setEditingId(staff.id);
    setFormData({
      full_name: staff.full_name,
      username: staff.username,
      phone_number: staff.phone_number || "",
      role: staff.role,
      password: "", // Bỏ trống mật khẩu để người dùng chỉ nhập khi cần đổi
      status: staff.status,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${name}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/staffs/${id}`, { method: "DELETE" });
      if (res.ok) {
        onStaffDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi khi xóa: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối máy chủ");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.full_name.trim()) {
      setError("Vui lòng điền họ tên nhân viên.");
      return;
    }
    if (!formData.username.trim()) {
      setError("Vui lòng điền tên đăng nhập.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/staffs/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra khi lưu thay đổi");
        return;
      }

      onStaffUpdated(data);
      setIsModalOpen(false);
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "badge-rose";
      case "ACCOUNTANT":
        return "badge-purple";
      default:
        return "badge-indigo";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "ACCOUNTANT":
        return "Kế toán";
      default:
        return "Nhân viên";
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👥 Tài khoản vận hành hệ thống ({staffs.length})</h3>
        </div>
        <div className="card-body" style={{ overflowX: "auto" }}>
          {staffs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-text">Chưa có tài khoản nhân viên nào.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Tên đăng nhập</th>
                  <th>Số điện thoại</th>
                  <th>Mật khẩu</th>
                  <th>Phân quyền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff) => (
                  <tr key={staff.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {staff.full_name}
                    </td>
                    <td>
                      <span className="staff-username-pill">
                        {staff.username}
                      </span>
                    </td>
                    <td>{staff.phone_number || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "14px" }}>
                          {showPasswordMap[staff.id] ? staff.password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => handleTogglePassword(staff.id)}
                          title={showPasswordMap[staff.id] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPasswordMap[staff.id] ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(staff.role)}`}>
                        {getRoleLabel(staff.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${staff.status === "ACTIVE" ? "badge-emerald" : "badge-rose"}`}>
                        <span className={`status-dot ${staff.status === "ACTIVE" ? "active" : ""}`}></span>
                        {staff.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(staff)}>
                          Sửa
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--accent-rose)" }}
                          onClick={() => handleDelete(staff.id, staff.full_name)}
                        >
                          Xóa
                        </button>
                      </div>
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
        onClose={() => {
          setIsModalOpen(false);
          setError("");
        }}
        title="Sửa thông tin Nhân viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        {error && (
          <div
            style={{
              color: "var(--accent-rose)",
              fontSize: 13,
              marginBottom: 16,
              padding: "8px 12px",
              background: "rgba(244,63,94,0.1)",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Họ tên nhân viên *</label>
          <input
            className="form-input"
            placeholder="VD: Nguyễn Văn A"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tên đăng nhập *</label>
          <input
            className="form-input"
            placeholder="VD: nvanga"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Số điện thoại</label>
          <input
            className="form-input"
            placeholder="VD: 0901234567"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu mới (Để trống nếu giữ nguyên)</label>
          <input
            type="password"
            className="form-input"
            placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phân quyền</label>
          <select
            className="form-input"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'STAFF' | 'ACCOUNTANT' })
            }
          >
            <option value="STAFF">Nhân viên</option>
            <option value="ACCOUNTANT">Kế toán</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
            }
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>
      </Modal>
    </>
  );
}
