"use client";

import { useState, useEffect, useCallback } from "react";
import type { Staff } from "@/types/database.types";
import StaffTable from "@/modules/staff/StaffTable";
import Modal from "@/components/Modal";
import "./staff.css";

export default function StaffPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone_number: "",
    role: "STAFF" as 'ADMIN' | 'STAFF' | 'ACCOUNTANT',
    password: "",
    status: "ACTIVE" as 'ACTIVE' | 'INACTIVE',
  });

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staffs");
      if (res.ok) {
        setStaffs(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch staffs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchStaffs();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchStaffs]);

  const handleOpenAddModal = () => {
    setFormData({
      full_name: "",
      username: "",
      phone_number: "",
      role: "STAFF",
      password: "",
      status: "ACTIVE",
    });
    setError("");
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    setError("");
    if (!formData.full_name.trim()) {
      setError("Vui lòng điền họ tên nhân viên.");
      return;
    }
    if (!formData.username.trim()) {
      setError("Vui lòng điền tên đăng nhập.");
      return;
    }
    if (!formData.password.trim()) {
      setError("Vui lòng điền mật khẩu đăng nhập.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra khi tạo nhân viên");
        return;
      }

      setStaffs((prev) => [data, ...prev]);
      setIsAddModalOpen(false);
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter staffs based on search and role filters
  const filteredStaffs = staffs.filter((staff) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      staff.full_name?.toLowerCase().includes(term) ||
      staff.username?.toLowerCase().includes(term) ||
      staff.phone_number?.toLowerCase().includes(term);

    const matchRole = roleFilter === "ALL" || staff.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">Quản lý Nhân viên</h1>
          <p className="page-subtitle">
            Hệ thống có {staffs.length} tài khoản nhân viên vận hành
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          ➕ Thêm Nhân viên
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="staff-toolbar card" style={{ marginBottom: "20px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", width: "100%" }}>
          <div className="staff-search" style={{ flex: "1 1 300px", margin: 0 }}>
            <span className="staff-search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Tìm kiếm theo Tên, Username, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ flex: "0 0 200px" }}>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ height: "46px" }}
            >
              <option value="ALL">Tất cả chức vụ</option>
              <option value="STAFF">Nhân viên</option>
              <option value="ACCOUNTANT">Kế toán</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <StaffTable
          staffs={filteredStaffs}
          onStaffUpdated={(updatedStaff) =>
            setStaffs((prev) =>
              prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
            )
          }
          onStaffDeleted={(id) =>
            setStaffs((prev) => prev.filter((s) => s.id !== id))
          }
        />
      )}

      {/* Modal Thêm Nhân Viên */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError("");
        }}
        title="Thêm tài khoản Nhân viên mới"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleAddSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
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
          <label className="form-label">Tên đăng nhập (Username) *</label>
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
          <label className="form-label">Mật khẩu đăng nhập *</label>
          <input
            type="password"
            className="form-input"
            placeholder="Nhập mật khẩu truy cập"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phân quyền</label>
          <select
            className="form-select"
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
            className="form-select"
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
    </div>
  );
}
