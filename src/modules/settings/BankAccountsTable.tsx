"use client";

import { useState } from "react";
import type { BankAccount } from "@/types/database.types";
import Modal from "@/components/Modal";

interface BankAccountsTableProps {
  bankAccounts: BankAccount[];
  onBankAccountAdded: (account: BankAccount) => void;
  onBankAccountUpdated: (account: BankAccount) => void;
  onBankAccountDeleted: (id: string) => void;
}

const defaultForm = {
  bank_name: "",
  account_code: "",
  account_number: "",
  account_holder: "",
  branch: "",
  is_default: false,
};

export default function BankAccountsTable({
  bankAccounts,
  onBankAccountAdded,
  onBankAccountUpdated,
  onBankAccountDeleted,
}: BankAccountsTableProps) {
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

  const handleOpenEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      bank_name: account.bank_name,
      account_code: account.account_code,
      account_number: account.account_number,
      account_holder: account.account_holder,
      branch: account.branch ?? "",
      is_default: account.is_default,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) return;
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onBankAccountDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa tài khoản: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.bank_name.trim() || !formData.account_code.trim() || !formData.account_number.trim() || !formData.account_holder.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/bank-accounts/${editingId}` : "/api/bank-accounts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          branch: formData.branch || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (editingId) {
        onBankAccountUpdated(data);
      } else {
        onBankAccountAdded(data);
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
          <h3 className="card-title">🏦 Tài khoản Ngân hàng</h3>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            + Thêm tài khoản
          </button>
        </div>
        <div className="card-body">
          {bankAccounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏦</div>
              <div className="empty-state-text">Chưa có tài khoản nào</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngân hàng</th>
                  <th>Mã TK</th>
                  <th>Số TK</th>
                  <th>Chủ TK</th>
                  <th>Chi nhánh</th>
                  <th>Mặc định</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((account) => (
                  <tr key={account.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {account.bank_name}
                    </td>
                    <td>
                      <span className="badge badge-indigo">{account.account_code}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 13 }}>
                        {account.account_number}
                      </span>
                    </td>
                    <td>{account.account_holder}</td>
                    <td>
                      {account.branch || (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {account.is_default ? (
                        <span className="badge badge-amber">⭐ Mặc định</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(account)}>
                        Sửa
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => handleDelete(account.id, account.bank_name)}
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
        title={editingId ? "Sửa Tài khoản" : "Thêm Tài khoản mới"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (editingId ? "Lưu thay đổi" : "Thêm tài khoản")}
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
          <label className="form-label">Tên ngân hàng *</label>
          <input
            className="form-input"
            placeholder="VD: Vietcombank"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mã tài khoản *</label>
            <input
              className="form-input"
              placeholder="VD: VCB01"
              value={formData.account_code}
              onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Số tài khoản *</label>
            <input
              className="form-input"
              placeholder="VD: 1234567890"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Chủ tài khoản *</label>
            <input
              className="form-input"
              placeholder="VD: Nguyễn Văn A"
              value={formData.account_holder}
              onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Chi nhánh</label>
            <input
              className="form-input"
              placeholder="VD: Hà Nội"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tài khoản mặc định</label>
          <label className="toggle-switch" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </Modal>
    </>
  );
}
