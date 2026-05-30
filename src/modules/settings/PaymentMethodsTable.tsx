"use client";

import { useState } from "react";
import type { PaymentMethod } from "@/types/database.types";
import Modal from "@/components/Modal";

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  onPaymentMethodAdded: (method: PaymentMethod) => void;
  onPaymentMethodUpdated: (method: PaymentMethod) => void;
  onPaymentMethodDeleted: (id: string) => void;
}

const defaultForm = { method_name: "", description: "", is_active: true };

export default function PaymentMethodsTable({ paymentMethods, onPaymentMethodAdded, onPaymentMethodUpdated, onPaymentMethodDeleted }: PaymentMethodsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ ...defaultForm });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setFormData({
      method_name: method.method_name,
      description: method.description || "",
      is_active: method.is_active,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hình thức "${name}"?`)) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (res.ok) {
        onPaymentMethodDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa hình thức: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.method_name.trim()) {
      setError("Vui lòng nhập tên hình thức thanh toán.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/payment-methods/${editingId}` : "/api/payment-methods";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method_name: formData.method_name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onPaymentMethodUpdated(data);
      } else {
        onPaymentMethodAdded(data);
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
          <h3 className="card-title">💳 Hình thức Thanh toán</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm hình thức
          </button>
        </div>
        <div className="card-body">
          {paymentMethods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-text">Chưa có hình thức thanh toán nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên hình thức</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((pm) => (
                  <tr key={pm.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {pm.method_name}
                    </td>
                    <td>
                      {pm.description ? (
                        pm.description
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${pm.is_active ? "badge-emerald" : "badge-rose"}`}>
                        {pm.is_active ? "Hoạt động" : "Tạm ngưng"}
                      </span>
                    </td>
                    <td>{new Date(pm.created_at).toLocaleDateString("vi-VN")}</td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(pm)}>
                        Sửa
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(pm.id, pm.method_name)}
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
        title={editingId ? "Sửa Hình thức thanh toán" : "Thêm Hình thức thanh toán mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm hình thức")}
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
          <label className="form-label">Tên hình thức *</label>
          <input
            className="form-input"
            placeholder="VD: Tiền mặt, Chuyển khoản..."
            value={formData.method_name}
            onChange={(e) => setFormData({ ...formData, method_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <input
            className="form-input"
            placeholder="Mô tả ngắn"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Đang sử dụng</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </Modal>
    </>
  );
}
