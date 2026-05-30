"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

interface StudentRecord {
  id: string;
  full_name: string;
  dob: string | null;
  class_name: string | null;
  phone_number: string | null;
  school_id: string | null;
  other_school_name: string | null;
  notes: string | null;
  created_at: string;
  schools: { school_name: string; school_code: string } | null;
  registrations: Array<{
    id: string;
    card_code: string;
    status: string;
    remaining_sessions: number;
    is_card_issued: boolean;
    card_reissue_count: number;
    receipt_number: string | null;
    payment_method_id: string | null;
    package_id: string | null;
    payment_methods: { method_name: string } | null;
    pricing_packages: { package_name: string; subject: string; price: number } | null;
  }>;
}

interface StudentsTableProps {
  students: StudentRecord[];
  schools?: any[];
  packages?: any[];
  paymentMethods?: any[];
  onRefresh?: () => void;
  onStudentUpdated: (student: Partial<StudentRecord>) => void;
  onStudentDeleted: (id: string) => void;
}

export default function StudentsTable({ 
  students, 
  schools = [], 
  packages = [], 
  paymentMethods = [], 
  onRefresh,
  onStudentUpdated, 
  onStudentDeleted 
}: StudentsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    full_name: "", 
    phone_number: "", 
    dob: "", 
    class_name: "", 
    school_id: "", 
    other_school_name: "", 
    notes: "",
    package_id: "", 
    receipt_number: "", 
    payment_method_id: "", 
    status: "ACTIVE",
    remaining_sessions: 0,
    registration_id: "",
    is_card_issued: false,
    card_reissue_count: 0
  });
  const [error, setError] = useState("");

  // Card reissue state
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false);
  const [reissueRegId, setReissueRegId] = useState<string | null>(null);
  const [newCardCode, setNewCardCode] = useState("");
  const [isReissuing, setIsReissuing] = useState(false);
  const [reissueError, setReissueError] = useState("");

  // Column visibility state
  const availableColumns = [
    { id: "full_name", label: "Họ tên" },
    { id: "dob", label: "Ngày sinh" },
    { id: "class_name", label: "Lớp" },
    { id: "phone_number", label: "SĐT" },
    { id: "school", label: "Trường" },
    { id: "notes", label: "Ghi chú" },
    { id: "card_code", label: "Mã thẻ" },
    { id: "package", label: "Gói học" },
    { id: "price", label: "Giá" },
    { id: "remaining", label: "Số buổi" },
    { id: "receipt_number", label: "Số phiếu thu" },
    { id: "payment_method", label: "Thanh toán" },
    { id: "card_issued", label: "Cấp thẻ" },
    { id: "status", label: "Trạng thái" },
    { id: "created_at", label: "Ngày ĐK" },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    full_name: true,
    dob: false,
    class_name: false,
    phone_number: true,
    school: true,
    notes: false,
    card_code: true,
    package: true,
    price: true,
    remaining: true,
    receipt_number: false,
    payment_method: false,
    card_issued: true,
    status: true,
    created_at: false,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const handleOpenEdit = (student: StudentRecord) => {
    setEditingId(student.id);
    const reg = student.registrations?.[0];
    setFormData({
      full_name: student.full_name || "",
      phone_number: student.phone_number || "",
      dob: student.dob || "",
      class_name: student.class_name || "",
      school_id: student.school_id || "",
      other_school_name: student.other_school_name || "",
      notes: student.notes || "",
      package_id: reg?.package_id || "",
      receipt_number: reg?.receipt_number || "",
      payment_method_id: reg?.payment_method_id || "",
      status: reg?.status || "ACTIVE",
      remaining_sessions: reg?.remaining_sessions || 0,
      registration_id: reg?.id || "",
      is_card_issued: reg?.is_card_issued || false,
      card_reissue_count: reg?.card_reissue_count || 0,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học viên "${name}"? Thao tác này sẽ xóa mọi dữ liệu check-in và ghi danh của học viên này!`)) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        onStudentDeleted(id);
      } else {
        const data = await res.json();
        alert(`Lỗi xóa học viên: ${data.error}`);
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.full_name.trim()) {
      setError("Vui lòng điền tên học viên.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/students/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      if (onRefresh) {
        onRefresh();
      } else {
        onStudentUpdated({
          id: editingId as string,
          full_name: data.full_name,
          phone_number: data.phone_number,
        });
      }
      
      setIsModalOpen(false);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueCard = async (regId: string, studentId: string) => {
    if (!confirm("Xác nhận đã phát thẻ nhựa cho học viên?")) return;
    try {
      const res = await fetch(`/api/registrations/${regId}/issue-card`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Đã cập nhật trạng thái cấp thẻ!");
        if (onRefresh) onRefresh();
        setFormData(prev => ({ ...prev, is_card_issued: true }));
      } else {
        alert("Lỗi khi cập nhật trạng thái");
      }
    } catch {
      alert("Không thể kết nối server");
    }
  };

  const handleOpenReissue = (regId: string) => {
    setReissueRegId(regId);
    setNewCardCode("");
    setReissueError("");
    setIsReissueModalOpen(true);
  };

  const handleSubmitReissue = async () => {
    setReissueError("");
    if (!newCardCode.trim()) {
      setReissueError("Vui lòng nhập mã thẻ mới.");
      return;
    }

    setIsReissuing(true);
    try {
      const res = await fetch(`/api/registrations/${reissueRegId}/reissue-card`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_card_code: newCardCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReissueError(data.error || "Có lỗi xảy ra");
        return;
      }

      alert("Đã cấp lại thẻ thành công!");
      setIsReissueModalOpen(false);
      if (onRefresh) onRefresh();
      setFormData(prev => ({ ...prev, card_reissue_count: prev.card_reissue_count + 1 }));
    } catch {
      setReissueError("Không thể kết nối server");
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <>
      <div className="card" style={{ overflow: "visible" }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">👥 Danh sách Học viên ({students.length})</h3>
          <div className="column-toggle" style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Ẩn/hiện cột
            </button>
            {showColumnMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, zIndex: 9999, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.8)', marginTop: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                 {availableColumns.map(col => (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[col.id]} 
                        onChange={() => toggleColumn(col.id)} 
                        style={{ accentColor: 'var(--accent-indigo)' }}
                      />
                      {col.label}
                    </label>
                 ))}
                 <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowColumnMenu(false)} style={{ fontSize: 11, padding: "2px 8px" }}>Đóng</button>
                 </div>
              </div>
            )}
          </div>
        </div>
        <div className="card-body" style={{ overflowX: "auto" }}>
          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-text">Chưa có học viên nào. Hãy ghi danh hoặc import Excel.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {visibleColumns.full_name && <th>Họ tên</th>}
                  {visibleColumns.dob && <th>Ngày sinh</th>}
                  {visibleColumns.class_name && <th>Lớp</th>}
                  {visibleColumns.phone_number && <th>SĐT</th>}
                  {visibleColumns.school && <th>Trường</th>}
                  {visibleColumns.notes && <th>Ghi chú</th>}
                  {visibleColumns.card_code && <th>Mã thẻ</th>}
                  {visibleColumns.package && <th>Gói học</th>}
                  {visibleColumns.price && <th>Giá</th>}
                  {visibleColumns.remaining && <th>Số buổi</th>}
                  {visibleColumns.receipt_number && <th>Số phiếu thu</th>}
                  {visibleColumns.payment_method && <th>Thanh toán</th>}
                  {visibleColumns.card_issued && <th>Cấp thẻ</th>}
                  {visibleColumns.status && <th>Trạng thái</th>}
                  {visibleColumns.created_at && <th>Ngày ĐK</th>}
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const reg = student.registrations?.[0];
                  return (
                    <tr key={student.id}>
                      {visibleColumns.full_name && (
                        <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {student.full_name}
                        </td>
                      )}
                      {visibleColumns.dob && (
                        <td>{student.dob ? new Date(student.dob).toLocaleDateString("vi-VN") : "—"}</td>
                      )}
                      {visibleColumns.class_name && <td>{student.class_name || "—"}</td>}
                      {visibleColumns.phone_number && <td>{student.phone_number || "—"}</td>}
                      {visibleColumns.school && (
                        <td>
                          {student.schools ? (
                            <span className="badge badge-indigo">
                              [{student.schools.school_code}] {student.schools.school_name}
                            </span>
                          ) : student.other_school_name ? (
                            <span className="badge badge-amber">{student.other_school_name}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {visibleColumns.notes && <td>{student.notes || "—"}</td>}
                      {visibleColumns.card_code && (
                        <td>
                          {reg ? (
                            <span style={{
                              fontFamily: "'Courier New', monospace",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "var(--accent-indigo-light)",
                              background: "rgba(99, 102, 241, 0.1)",
                              padding: "3px 8px",
                              borderRadius: 4,
                              letterSpacing: "0.04em",
                            }}>
                              {reg.card_code}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.package && (
                        <td>
                          {reg?.pricing_packages ? (
                            <>
                              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                                {reg.pricing_packages.package_name}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {reg.pricing_packages.subject}
                              </div>
                            </>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.price && (
                        <td>
                          {reg?.pricing_packages ? (
                            <span className="price">{formatPrice(reg.pricing_packages.price)}</span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.remaining && (
                        <td>
                          {reg ? (
                            <span style={{ fontWeight: 600, color: "var(--accent-emerald-light)" }}>
                              {reg.remaining_sessions} buổi
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.receipt_number && (
                        <td>{reg?.receipt_number || "—"}</td>
                      )}
                      {visibleColumns.payment_method && (
                        <td>
                          {reg?.payment_methods ? (
                            <span className="badge" style={{ background: "var(--bg-card-hover)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}>
                              {reg.payment_methods.method_name}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.card_issued && (
                        <td>
                          {reg ? (
                            !reg.is_card_issued ? (
                              <span className="badge" style={{ background: "var(--bg-glass)", color: "var(--text-secondary)" }}>
                                Chưa cấp thẻ
                              </span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span className="badge badge-indigo">Đã cấp thẻ</span>
                                {reg.card_reissue_count > 0 && (
                                  <span style={{ fontSize: 11, color: "var(--accent-amber)" }}>
                                    (Cấp lại lần {reg.card_reissue_count})
                                  </span>
                                )}
                              </div>
                            )
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td>
                          {reg ? (
                            <span className={`badge ${reg.status === "ACTIVE" ? "badge-emerald" : "badge-rose"}`}>
                              <span className={`status-dot ${reg.status === "ACTIVE" ? "active" : ""}`}></span>
                              {reg.status === "ACTIVE" ? "Hoạt động" : reg.status}
                            </span>
                          ) : "—"}
                        </td>
                      )}
                      {visibleColumns.created_at && (
                        <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          {new Date(student.created_at).toLocaleDateString("vi-VN")}
                        </td>
                      )}
                      <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap", minWidth: 160 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(student)}>
                          Sửa
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: "var(--accent-rose)" }}
                          onClick={() => handleDelete(student.id, student.full_name)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setError(""); }}
        title="Sửa thông tin Học viên"
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
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}
        <div className="form-grid-2">
          {/* Cột 1: Thông tin Học viên */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)" }}>Thông tin Cơ bản</h4>
            <div className="form-group">
              <label className="form-label">Họ tên Học viên *</label>
              <input
                className="form-input"
                placeholder="VD: Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày sinh</label>
              <input
                type="date"
                className="form-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
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
              <label className="form-label">Lớp</label>
              <input
                className="form-input"
                placeholder="VD: 5A"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trường học</label>
              <select
                className="form-input"
                value={formData.school_id || ""}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    school_id: e.target.value,
                    other_school_name: e.target.value === "other" ? "" : ""
                  });
                }}
              >
                <option value="">-- Chọn trường --</option>
                {schools?.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                <option value="other">Trường khác...</option>
              </select>
            </div>
            {formData.school_id === "other" && (
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Nhập tên trường khác..."
                  value={formData.other_school_name || ""}
                  onChange={(e) => setFormData({ ...formData, other_school_name: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <textarea
                className="form-input"
                style={{ minHeight: "60px" }}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* Cột 2: Thông tin Ghi danh */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)" }}>Thông tin Ghi danh</h4>
            <div className="form-group">
              <label className="form-label">Gói học</label>
              <select
                className="form-input"
                value={formData.package_id || ""}
                onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              >
                <option value="">-- Chọn gói học --</option>
                {packages?.map(p => <option key={p.id} value={p.id}>{p.package_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số buổi</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={formData.remaining_sessions}
                onChange={(e) => setFormData({ ...formData, remaining_sessions: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hình thức thanh toán</label>
              <select
                className="form-input"
                value={formData.payment_method_id || ""}
                onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
              >
                <option value="">-- Chọn hình thức --</option>
                {paymentMethods?.map(p => <option key={p.id} value={p.id}>{p.method_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Số phiếu thu</label>
              <input
                className="form-input"
                placeholder="Số phiếu thu (nếu có)"
                value={formData.receipt_number || ""}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="EXPIRED">Hết hạn / Hết buổi</option>
                <option value="CANCELLED">Đã hủy / Hoàn phí</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái thẻ nhựa</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "var(--bg-glass-hover)", padding: "12px", borderRadius: "6px" }}>
                {!formData.is_card_issued ? (
                  <>
                    <span className="badge badge-slate">Chưa cấp thẻ</span>
                    {formData.registration_id && (
                      <button 
                        type="button"
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleIssueCard(formData.registration_id, editingId as string)}
                        style={{ padding: "4px 12px", fontSize: 13 }}
                      >
                        Phát thẻ ngay
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="badge badge-indigo">Đã cấp thẻ</span>
                    {formData.card_reissue_count > 0 && (
                      <span style={{ fontSize: 12, color: "var(--accent-amber)", fontWeight: 500 }}>
                        (Cấp lại lần {formData.card_reissue_count})
                      </span>
                    )}
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleOpenReissue(formData.registration_id)}
                      style={{ color: "var(--accent-amber)", border: "1px solid var(--accent-amber)", padding: "4px 12px", fontSize: 13 }}
                    >
                      Cấp lại thẻ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Cấp lại thẻ */}
      <Modal
        isOpen={isReissueModalOpen}
        onClose={() => { setIsReissueModalOpen(false); setReissueError(""); }}
        title="Cấp lại thẻ Học viên"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsReissueModalOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={handleSubmitReissue} disabled={isReissuing}>
              {isReissuing ? "Đang xử lý..." : "Xác nhận cấp lại"}
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 16, fontSize: 14, color: "var(--text-muted)" }}>
          Việc cấp lại thẻ sẽ <strong>vô hiệu hóa mã thẻ cũ</strong>. Vui lòng nhập tay mã thẻ mới được in trên thẻ nhựa.
        </div>
        {reissueError && (
          <div style={{ color: "var(--accent-rose)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(244,63,94,0.1)", borderRadius: 6 }}>
            {reissueError}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Mã thẻ mới *</label>
          <input
            className="form-input"
            placeholder="Nhập mã in trên thẻ nhựa (VD: HE26XXX...)"
            value={newCardCode}
            onChange={(e) => setNewCardCode(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
