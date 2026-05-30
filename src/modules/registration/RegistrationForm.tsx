"use client";

import { useState, useEffect } from "react";
import type { School, PricingPackage } from "@/types/database.types";
import Modal from "@/components/Modal";

interface RegistrationFormProps {
  onRegistered: () => void;
}

interface RegistrationResult {
  card_code: string;
  students: { full_name: string };
  pricing_packages: { package_name: string; subject: string; price: number };
  remaining_sessions: number;
}

export default function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    class_name: "",
    phone_number: "",
    school_id: "",
    other_school_name: "",
    notes: "",
    package_id: "",
    receipt_number: "",
    payment_method_id: "",
  });

  // Fetch schools, packages, and payment methods
  useEffect(() => {
    Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch("/api/pricing-packages").then((r) => r.json()),
      fetch("/api/payment-methods").then((r) => r.json()),
    ]).then(([s, p, pm]) => {
      setSchools(s);
      setPackages(p);
      setPaymentMethods(pm.filter((m: any) => m.is_active));
    });
  }, []);

  // Kiểm tra school có phải "Trường khác" (mã 99) không
  const selectedSchool = schools.find((s) => s.id === formData.school_id);
  const isOtherSchool = selectedSchool?.school_code === "99";

  // Lấy giá hiển thị từ gói đã chọn (readonly, không cho sửa)
  const selectedPackage = packages.find((p) => p.id === formData.package_id);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name || !formData.dob || !formData.phone_number || !formData.school_id || !formData.package_id || !formData.receipt_number || !formData.payment_method_id) {
      setError("Vui lòng điền đầy đủ các thông tin có dấu *.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError("Số điện thoại phụ huynh phải bao gồm đúng 10 chữ số.");
      return;
    }

    if (isOtherSchool && (!formData.other_school_name || !formData.notes)) {
      setError("Khi chọn 'Trường khác', bắt buộc điền 'Tên trường khác' và 'Ghi chú'.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
        return;
      }

      setResult(data);
      setShowResult(true);
      setFormData({
        full_name: "",
        dob: "",
        class_name: "",
        phone_number: "",
        school_id: "",
        other_school_name: "",
        notes: "",
        package_id: "",
        receipt_number: "",
        payment_method_id: "",
      });
      onRegistered();
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
          <h3 className="card-title">📝 Form Ghi danh học viên mới</h3>
        </div>
        <div style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {/* Họ tên + Ngày sinh */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Họ tên học viên *</label>
                <input
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            {/* Lớp + SĐT */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lớp</label>
                <input
                  className="form-input"
                  placeholder="VD: 10A1"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại phụ huynh *</label>
                <input
                  className="form-input"
                  placeholder="VD: 0901234567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>

            {/* Trường học */}
            <div className="form-group">
              <label className="form-label">Trường học *</label>
              <select
                className="form-select"
                value={formData.school_id}
                onChange={(e) =>
                  setFormData({ ...formData, school_id: e.target.value, other_school_name: "", notes: "" })
                }
              >
                <option value="">— Chọn trường —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.school_code}] {s.school_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trường khác - hiện khi chọn mã 99 */}
            {isOtherSchool && (
              <div className="other-school-section">
                <div className="form-group">
                  <label className="form-label">Tên trường khác *</label>
                  <input
                    className="form-input"
                    placeholder="VD: THPT Lê Hồng Phong"
                    value={formData.other_school_name}
                    onChange={(e) => setFormData({ ...formData, other_school_name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div className="form-group">
              <label className="form-label">Ghi chú {isOtherSchool ? "(học chung với ai) *" : "(không bắt buộc)"}</label>
              <input
                className="form-input"
                placeholder="Nhập ghi chú thêm..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Gói học + Giá */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gói học *</label>
                <select
                  className="form-select"
                  value={formData.package_id}
                  onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                >
                  <option value="">— Chọn gói —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.package_name} ({p.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Giá (tự động)</label>
                <div className="price-display">
                  {selectedPackage ? (
                    <>
                      <span className="price-value">{formatPrice(selectedPackage.price)}</span>
                      <span className="price-sessions">{selectedPackage.sessions_count} buổi</span>
                    </>
                  ) : (
                    <span className="price-placeholder">Chọn gói để xem giá</span>
                  )}
                </div>
              </div>
            </div>

            {/* Số phiếu thu & Hình thức thanh toán */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Số phiếu thu *</label>
                <input
                  className="form-input"
                  placeholder="VD: PT00123"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hình thức thanh toán *</label>
                <select
                  className="form-select"
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                >
                  <option value="">— Chọn hình thức —</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.method_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Đang xử lý...
                </>
              ) : (
                "📝 Ghi danh"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal kết quả */}
      <Modal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        title="✅ Ghi danh thành công!"
        footer={
          <button className="btn btn-primary" onClick={() => setShowResult(false)}>
            Đóng
          </button>
        }
      >
        {result && (
          <div className="result-card">
            <div className="result-card-code">{result.card_code}</div>
            <div className="result-label">Mã thẻ học viên</div>
            <div className="result-details">
              <div className="result-row">
                <span>Học viên</span>
                <strong>{result.students?.full_name}</strong>
              </div>
              <div className="result-row">
                <span>Gói học</span>
                <strong>{result.pricing_packages?.package_name}</strong>
              </div>
              <div className="result-row">
                <span>Môn</span>
                <strong>{result.pricing_packages?.subject}</strong>
              </div>
              <div className="result-row">
                <span>Giá</span>
                <strong className="price">{formatPrice(result.pricing_packages?.price || 0)}</strong>
              </div>
              <div className="result-row">
                <span>Số buổi</span>
                <strong>{result.remaining_sessions} buổi</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
