"use client";

import { useState } from "react";
import type { PricingPackage, Subject } from "@/types/database.types";
import Modal from "@/components/Modal";

interface PricingTableProps {
  packages: PricingPackage[];
  subjects: Subject[];
  onPackageAdded: (pkg: PricingPackage) => void;
  onPackageUpdated: (pkg: PricingPackage) => void;
  onPackageDeleted: (id: string) => void;
}

const defaultForm = {
  package_name: "",
  subject: "",
  subject_id: "",
  price: "",
  sessions_count: "",
  duration_type: "Month",
  print_ticket: false,
};

export default function PricingTable({ packages, subjects, onPackageAdded, onPackageUpdated, onPackageDeleted }: PricingTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setFormData({
      package_name: pkg.package_name,
      subject: pkg.subject,
      subject_id: pkg.subject_id || "",
      price: pkg.price.toString(),
      sessions_count: pkg.sessions_count.toString(),
      duration_type: pkg.duration_type,
      print_ticket: pkg.print_ticket,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói "${name}"?`)) return;
    try {
      const res = await fetch(`/api/pricing-packages/${id}`, { method: "DELETE" });
      if (res.ok) {
        onPackageDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa gói học: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.package_name || !formData.subject_id || !formData.price || !formData.sessions_count) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    // Resolve subject name from subject_id
    const selectedSubject = subjects.find((s) => s.id === formData.subject_id);
    const subjectName = selectedSubject ? selectedSubject.subject_name : formData.subject;

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/pricing-packages/${editingId}` : "/api/pricing-packages";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_name: formData.package_name,
          subject: subjectName,
          subject_id: formData.subject_id || null,
          price: parseFloat(formData.price),
          sessions_count: parseInt(formData.sessions_count),
          duration_type: formData.duration_type,
          print_ticket: formData.print_ticket,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onPackageUpdated(data);
      } else {
        onPackageAdded(data);
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
          <h3 className="card-title">💰 Bảng giá Gói học</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm gói
          </button>
        </div>
        <div className="card-body">
          {packages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-text">Chưa có gói học nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên gói</th>
                  <th>Môn học</th>
                  <th>Giá</th>
                  <th>Số buổi</th>
                  <th>Thời hạn</th>
                  <th>In vé</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {pkg.package_name}
                    </td>
                    <td>
                      <span className="badge badge-cyan">{pkg.subject}</span>
                    </td>
                    <td>
                      <span className="price">{formatPrice(pkg.price)}</span>
                    </td>
                    <td>{pkg.sessions_count} buổi</td>
                    <td>
                      <span className={`badge ${pkg.duration_type === "Month" ? "badge-indigo" : "badge-emerald"}`}>
                        {pkg.duration_type === "Month" ? "Theo tháng" : "Theo khoảng"}
                      </span>
                    </td>
                    <td>
                      {pkg.print_ticket ? (
                        <span style={{ color: "var(--accent-emerald)" }}>✓</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(pkg)}>
                        Sửa
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(pkg.id, pkg.package_name)}
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
        title={editingId ? "Sửa Gói học" : "Thêm Gói học mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm gói")}
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
          <label className="form-label">Tên gói</label>
          <input
            className="form-input"
            placeholder="VD: Gói Tháng - Bơi Lội"
            value={formData.package_name}
            onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
          />
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
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Giá (VNĐ)</label>
            <input
              className="form-input"
              type="number"
              placeholder="500000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số buổi</label>
            <input
              className="form-input"
              type="number"
              placeholder="12"
              value={formData.sessions_count}
              onChange={(e) => setFormData({ ...formData, sessions_count: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Loại thời hạn</label>
            <select
              className="form-select"
              value={formData.duration_type}
              onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
            >
              <option value="Month">Theo tháng</option>
              <option value="Period">Theo khoảng thời gian</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tùy chọn in vé</label>
            <label className="toggle-switch" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={formData.print_ticket}
                onChange={(e) => setFormData({ ...formData, print_ticket: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}
